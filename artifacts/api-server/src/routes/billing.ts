import { Router, type IRouter } from "express";
import { eq, and, lte, lt, sql } from "drizzle-orm";
import { db, subscriptionsTable, invoicesTable, customersTable } from "@workspace/db";
import {
  ProcessDueSubscriptionsResponse,
} from "@workspace/api-zod";
import { generatePixCharge } from "../services/qqpag";
import { sendPaymentReminder } from "../services/uazapi";
import { logger } from "../lib/logger";

const router: IRouter = Router();

export async function markOverdueInvoices(): Promise<number> {
  const now = new Date();
  const result = await db
    .update(invoicesTable)
    .set({ status: "overdue" })
    .where(
      and(
        eq(invoicesTable.status, "pending"),
        lt(invoicesTable.dueDate, now)
      )
    )
    .returning({ id: invoicesTable.id });

  if (result.length > 0) {
    logger.info({ count: result.length }, "Marked invoices as overdue");
  }

  return result.length;
}

export async function processDueSubscriptions(): Promise<{ processed: number; successful: number; failed: number; overdue: number }> {
  logger.info("Processing due subscriptions");

  const overdue = await markOverdueInvoices();

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

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
      const existingInvoice = await db
        .select({ id: invoicesTable.id })
        .from(invoicesTable)
        .where(
          and(
            eq(invoicesTable.subscriptionId, sub.id),
            sql`${invoicesTable.dueDate}::date = ${sub.nextBillingDate}::date`,
            sql`${invoicesTable.status} IN ('pending','paid')`
          )
        )
        .limit(1);

      if (existingInvoice.length > 0) {
        logger.info({ subscriptionId: sub.id, invoiceId: existingInvoice[0].id }, "Invoice already exists for this period, skipping");
        successful++;
        continue;
      }

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

  return { processed: dueSubscriptions.length, successful, failed, overdue };
}

router.post("/billing/process-due", async (_req, res): Promise<void> => {
  const result = await processDueSubscriptions();

  res.json(ProcessDueSubscriptionsResponse.parse({
    processed: result.processed,
    successful: result.successful,
    failed: result.failed,
    message: `Processadas ${result.processed} assinaturas: ${result.successful} com sucesso, ${result.failed} com falha. ${result.overdue} faturas marcadas como atrasadas.`,
  }));
});

export default router;
