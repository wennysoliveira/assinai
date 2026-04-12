import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, invoicesTable, customersTable, subscriptionsTable } from "@workspace/db";
import {
  ListInvoicesQueryParams,
  ListInvoicesResponse,
  GetInvoiceParams,
  GetInvoiceResponse,
  GeneratePixChargeParams,
  GeneratePixChargeResponse,
  SendPaymentReminderParams,
  SendPaymentReminderResponse,
} from "@workspace/api-zod";
import { generatePixCharge } from "../services/qqpag";
import { sendPaymentReminder } from "../services/uazapi";

const router: IRouter = Router();

router.get("/invoices", async (req, res): Promise<void> => {
  const query = ListInvoicesQueryParams.safeParse(req.query);
  const conditions = [];

  if (query.success && query.data.customerId) {
    conditions.push(eq(invoicesTable.customerId, query.data.customerId));
  }
  if (query.success && query.data.subscriptionId) {
    conditions.push(eq(invoicesTable.subscriptionId, query.data.subscriptionId));
  }
  if (query.success && query.data.status) {
    conditions.push(eq(invoicesTable.status, query.data.status));
  }

  const results = await db
    .select({
      id: invoicesTable.id,
      subscriptionId: invoicesTable.subscriptionId,
      customerId: invoicesTable.customerId,
      customerName: customersTable.name,
      amount: invoicesTable.amount,
      status: invoicesTable.status,
      dueDate: invoicesTable.dueDate,
      paidAt: invoicesTable.paidAt,
      pixCode: invoicesTable.pixCode,
      pixQrCode: invoicesTable.pixQrCode,
      externalId: invoicesTable.externalId,
      createdAt: invoicesTable.createdAt,
      updatedAt: invoicesTable.updatedAt,
    })
    .from(invoicesTable)
    .leftJoin(customersTable, eq(invoicesTable.customerId, customersTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(invoicesTable.dueDate);

  const mapped = results.map(r => ({
    ...r,
    amount: Number(r.amount),
    customerName: r.customerName || "Unknown",
  }));

  res.json(ListInvoicesResponse.parse(mapped));
});

router.get("/invoices/:id", async (req, res): Promise<void> => {
  const params = GetInvoiceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [result] = await db
    .select({
      id: invoicesTable.id,
      subscriptionId: invoicesTable.subscriptionId,
      customerId: invoicesTable.customerId,
      customerName: customersTable.name,
      amount: invoicesTable.amount,
      status: invoicesTable.status,
      dueDate: invoicesTable.dueDate,
      paidAt: invoicesTable.paidAt,
      pixCode: invoicesTable.pixCode,
      pixQrCode: invoicesTable.pixQrCode,
      externalId: invoicesTable.externalId,
      createdAt: invoicesTable.createdAt,
      updatedAt: invoicesTable.updatedAt,
    })
    .from(invoicesTable)
    .leftJoin(customersTable, eq(invoicesTable.customerId, customersTable.id))
    .where(eq(invoicesTable.id, params.data.id));

  if (!result) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }

  res.json(GetInvoiceResponse.parse({
    ...result,
    amount: Number(result.amount),
    customerName: result.customerName || "Unknown",
  }));
});

router.post("/invoices/:id/generate-pix", async (req, res): Promise<void> => {
  const params = GeneratePixChargeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [invoice] = await db
    .select()
    .from(invoicesTable)
    .where(eq(invoicesTable.id, params.data.id));

  if (!invoice) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }

  const [customer] = await db
    .select()
    .from(customersTable)
    .where(eq(customersTable.id, invoice.customerId));

  if (!customer) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }

  const externalId = `INV-${invoice.id}-${Date.now()}`;

  const pixResult = await generatePixCharge({
    externalId,
    amount: Number(invoice.amount),
    description: `Fatura #${invoice.id}`,
    cpfCnpj: customer.cpfCnpj,
    customerName: customer.name,
  });

  await db
    .update(invoicesTable)
    .set({
      pixCode: pixResult.pixCopiaECola,
      pixQrCode: pixResult.qrCode,
      externalId: pixResult.externalId,
    })
    .where(eq(invoicesTable.id, invoice.id));

  res.json(GeneratePixChargeResponse.parse({
    invoiceId: invoice.id,
    qrCode: pixResult.qrCode,
    pixCopiaECola: pixResult.pixCopiaECola,
    externalId: pixResult.externalId,
  }));
});

router.post("/invoices/:id/send-reminder", async (req, res): Promise<void> => {
  const params = SendPaymentReminderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [invoice] = await db
    .select()
    .from(invoicesTable)
    .where(eq(invoicesTable.id, params.data.id));

  if (!invoice) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }

  const [customer] = await db
    .select()
    .from(customersTable)
    .where(eq(customersTable.id, invoice.customerId));

  if (!customer) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }

  const pixCode = invoice.pixCode || "PIX code not generated yet";
  const dueDate = invoice.dueDate.toLocaleDateString("pt-BR");

  const result = await sendPaymentReminder(
    customer.whatsapp,
    customer.name,
    Number(invoice.amount),
    dueDate,
    pixCode
  );

  res.json(SendPaymentReminderResponse.parse(result));
});

export default router;
