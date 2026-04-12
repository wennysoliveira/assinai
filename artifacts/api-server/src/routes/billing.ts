import { Router, type IRouter } from "express";
import { eq, and, lte, sql } from "drizzle-orm";
import { db, subscriptionsTable, invoicesTable, customersTable } from "@workspace/db";
import {
  ProcessDueSubscriptionsResponse,
} from "@workspace/api-zod";
import { generatePixCharge } from "../services/qqpag";
import { sendPaymentReminder } from "../services/uazapi";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.post("/billing/process-due", async (_req, res): Promise<void> => {
  logger.info("Processing due subscriptions");

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const dueSubscriptions = await db
    .select({
      id: subscriptionsTable.id,
      customerId: subscriptionsTable.customerId,
      plan: subscriptionsTable.plan,
      periodicity: subscriptionsTable.periodicity,
      amount: subscriptionsTable.amount,
      nextBillingDate: subscriptionsTable.nextBillingDate,
      customerName: customersTable.name,
      customerWhatsapp: customersTable.whatsapp,
      customerCpfCnpj: customersTable.cpfCnpj,
    })
    .from(subscriptionsTable)
    .leftJoin(customersTable, eq(subscriptionsTable.customerId, customersTable.id))
    .where(
      and(
        eq(subscriptionsTable.status, "active"),
        lte(subscriptionsTable.nextBillingDate, today)
      )
    );

  let successful = 0;
  let failed = 0;

  for (const sub of dueSubscriptions) {
    try {
      const [invoice] = await db
        .insert(invoicesTable)
        .values({
          subscriptionId: sub.id,
          customerId: sub.customerId,
          amount: sub.amount,
          status: "pending",
          dueDate: sub.nextBillingDate,
        })
        .returning();

      const externalId = `INV-${invoice.id}-${Date.now()}`;

      try {
        const pixResult = await generatePixCharge({
          externalId,
          amount: Number(sub.amount),
          description: `${sub.plan} - Fatura #${invoice.id}`,
          cpfCnpj: sub.customerCpfCnpj || "",
          customerName: sub.customerName || "Customer",
        });

        await db
          .update(invoicesTable)
          .set({
            pixCode: pixResult.pixCopiaECola,
            pixQrCode: pixResult.qrCode,
            externalId: pixResult.externalId,
          })
          .where(eq(invoicesTable.id, invoice.id));

        if (sub.customerWhatsapp) {
          const dueDate = sub.nextBillingDate.toLocaleDateString("pt-BR");
          await sendPaymentReminder(
            sub.customerWhatsapp,
            sub.customerName || "Cliente",
            Number(sub.amount),
            dueDate,
            pixResult.pixCopiaECola
          );
        }
      } catch (pixError) {
        logger.warn({ error: pixError, invoiceId: invoice.id }, "PIX generation failed, invoice created without PIX");
      }

      const nextDate = new Date(sub.nextBillingDate);
      if (sub.periodicity === "monthly") {
        nextDate.setMonth(nextDate.getMonth() + 1);
      } else {
        nextDate.setFullYear(nextDate.getFullYear() + 1);
      }

      await db
        .update(subscriptionsTable)
        .set({ nextBillingDate: nextDate })
        .where(eq(subscriptionsTable.id, sub.id));

      successful++;
    } catch (error) {
      logger.error({ error, subscriptionId: sub.id }, "Failed to process subscription");
      failed++;
    }
  }

  res.json(ProcessDueSubscriptionsResponse.parse({
    processed: dueSubscriptions.length,
    successful,
    failed,
    message: `Processed ${dueSubscriptions.length} subscriptions: ${successful} successful, ${failed} failed`,
  }));
});

export default router;
