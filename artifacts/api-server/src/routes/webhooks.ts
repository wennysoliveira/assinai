import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, invoicesTable, customersTable } from "@workspace/db";
import {
  QqpagWebhookBody,
  QqpagWebhookResponse,
} from "@workspace/api-zod";
import { sendPaymentConfirmation } from "../services/uazapi";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.post("/webhooks/qqpag", async (req, res): Promise<void> => {
  const parsed = QqpagWebhookBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid webhook payload");
    res.status(400).json({ received: false });
    return;
  }

  const { externalId, status, amount, paidAt } = parsed.data;

  req.log.info({ externalId, status }, "Received QQPag webhook");

  if (status === "paid" || status === "approved" || status === "confirmed") {
    const [invoice] = await db
      .select()
      .from(invoicesTable)
      .where(eq(invoicesTable.externalId, externalId));

    if (!invoice) {
      req.log.warn({ externalId }, "Invoice not found for webhook");
      res.json(QqpagWebhookResponse.parse({ received: true }));
      return;
    }

    await db
      .update(invoicesTable)
      .set({
        status: "paid",
        paidAt: paidAt ? new Date(paidAt) : new Date(),
      })
      .where(eq(invoicesTable.id, invoice.id));

    const [customer] = await db
      .select()
      .from(customersTable)
      .where(eq(customersTable.id, invoice.customerId));

    if (customer) {
      try {
        await sendPaymentConfirmation(
          customer.whatsapp,
          customer.name,
          Number(invoice.amount)
        );
        req.log.info({ customerId: customer.id }, "Payment confirmation sent via WhatsApp");
      } catch (error) {
        req.log.error({ error }, "Failed to send payment confirmation");
      }
    }
  }

  res.json(QqpagWebhookResponse.parse({ received: true }));
});

export default router;
