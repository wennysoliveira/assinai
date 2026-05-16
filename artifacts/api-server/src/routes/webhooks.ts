import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, invoicesTable, customersTable } from "@workspace/db";
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
  [key: string]: unknown;
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

  await db
    .update(invoicesTable)
    .set({
      status: "paid",
      paidAt: paidAt ? new Date(paidAt) : new Date(),
    })
    .where(eq(invoicesTable.id, invoice.id));

  log.info({ externalId, invoiceId: invoice.id }, "Invoice marked as paid");

  const [customer] = await db
    .select()
    .from(customersTable)
    .where(eq(customersTable.id, invoice.customerId));

  if (customer) {
    try {
      const amount = valor !== undefined
        ? Number(valor)
        : Number(invoice.amount);
      await sendPaymentConfirmation(customer.whatsapp, customer.name, amount);
      log.info({ customerId: customer.id }, "Payment confirmation sent via WhatsApp");
    } catch (error) {
      log.error({ error }, "Failed to send payment confirmation via WhatsApp");
    }
  }
}

router.post("/webhooks/qqpag", async (req, res): Promise<void> => {
  const payload = req.body as QQPagPayload;

  req.log.info({ payload }, "Received QQPag webhook");

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

      const status =
        (payload.status as string | undefined)?.toLowerCase() ?? "";

      const isPaid =
        status === "paid" ||
        status === "approved" ||
        status === "confirmed" ||
        status === "liquidado" ||
        status === "concluido" ||
        status === "" || // legacy: no status = treat as paid
        false;

      if (externalId && isPaid) {
        await processPayment(
          externalId,
          payload.paidAt ?? payload.horario as string | undefined,
          payload.amount ?? payload.valor,
          req.log,
        );
      } else {
        req.log.info({ status, externalId }, "Webhook received but payment not confirmed yet");
      }
    }
  } catch (error) {
    req.log.error({ error }, "Error processing QQPag webhook");
  }

  res.json({ received: true });
});

export default router;
