import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, invoicesTable, customersTable, subscriptionsTable } from "@workspace/db";
import { sendPaymentConfirmation } from "../services/uazapi";
import { logger } from "../lib/logger";

const router: IRouter = Router();

interface PixEntry {
  txid?: string;
  endToEndId?: string;
  e2eId?: string;
  valor?: string | number;
  horario?: string;
  [key: string]: unknown;
}

interface QQPagPayload {
  pix?: PixEntry[];
  txid?: string;
  txId?: string;
  externalId?: string;
  transactionId?: string;
  status?: string;
  amount?: number;
  valor?: string | number;
  paidAt?: string;
  horario?: string;
  [key: string]: unknown;
}

function advanceBillingDate(current: Date, periodicity: string): Date {
  const next = new Date(current);
  if (periodicity === "annual") {
    next.setFullYear(next.getFullYear() + 1);
  } else {
    next.setMonth(next.getMonth() + 1);
  }
  return next;
}

async function processPayment(
  externalId: string,
  paidAt?: string,
  valor?: string | number,
  log = logger,
): Promise<void> {
  const [invoice] = await db
    .select()
    .from(invoicesTable)
    .where(eq(invoicesTable.externalId, externalId));

  if (!invoice) {
    log.warn({ externalId }, "Invoice not found for webhook — ignoring");
    return;
  }

  if (invoice.status === "paid") {
    log.info({ externalId, invoiceId: invoice.id }, "Invoice already paid — idempotent skip");
    return;
  }

  const paidAtDate = paidAt ? new Date(paidAt) : new Date();

  await db
    .update(invoicesTable)
    .set({ status: "paid", paidAt: paidAtDate })
    .where(eq(invoicesTable.id, invoice.id));

  log.info({ externalId, invoiceId: invoice.id }, "Invoice marked as paid");

  const [subscription] = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.id, invoice.subscriptionId));

  if (subscription && subscription.status !== "cancelled") {
    const nextDate = advanceBillingDate(subscription.nextBillingDate, subscription.periodicity);
    await db
      .update(subscriptionsTable)
      .set({ status: "active", nextBillingDate: nextDate })
      .where(eq(subscriptionsTable.id, subscription.id));
    log.info(
      { subscriptionId: subscription.id, nextBillingDate: nextDate },
      "Subscription advanced to next billing cycle",
    );
  }

  const [customer] = await db
    .select()
    .from(customersTable)
    .where(eq(customersTable.id, invoice.customerId));

  if (customer) {
    try {
      const amount = valor !== undefined ? Number(valor) : Number(invoice.amount);
      await sendPaymentConfirmation(customer.whatsapp, customer.name, amount);
      log.info({ customerId: customer.id }, "Payment confirmation sent via WhatsApp");
    } catch (error) {
      log.error({ error }, "Failed to send payment confirmation via WhatsApp");
    }
  }
}

router.post("/webhooks/qqpag", async (req, res): Promise<void> => {
  const payload = req.body as QQPagPayload;

  req.log.info({ payloadKeys: Object.keys(payload) }, "Received QQPag webhook");

  try {
    if (Array.isArray(payload.pix) && payload.pix.length > 0) {
      for (const entry of payload.pix) {
        const txId = entry.txid ?? entry.endToEndId ?? entry.e2eId ?? "";
        if (!txId) {
          req.log.warn({ entry }, "Pix entry missing txid — skipping");
          continue;
        }
        await processPayment(txId, entry.horario, entry.valor, req.log);
      }
    } else {
      const externalId =
        payload.txid ??
        payload.txId ??
        payload.externalId ??
        payload.transactionId ??
        "";

      const rawStatus = (payload.status as string | undefined)?.toLowerCase() ?? "";

      const isPaid =
        rawStatus === "paid" ||
        rawStatus === "approved" ||
        rawStatus === "confirmed" ||
        rawStatus === "liquidado" ||
        rawStatus === "concluido" ||
        rawStatus === "active" ||
        rawStatus === "";

      if (externalId && isPaid) {
        await processPayment(
          externalId,
          payload.paidAt ?? (payload.horario as string | undefined),
          payload.amount ?? payload.valor,
          req.log,
        );
      } else {
        req.log.info({ rawStatus, externalId }, "Webhook received but payment not confirmed yet");
      }
    }
  } catch (error) {
    req.log.error({ error }, "Error processing QQPag webhook");
  }

  res.json({ received: true });
});

export default router;
