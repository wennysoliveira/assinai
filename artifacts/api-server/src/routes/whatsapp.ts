import { Router } from "express";
import { db, customersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { sendWhatsAppMessage } from "../services/meta-whatsapp";
import { logger } from "../lib/logger";

const router = Router();

router.post("/whatsapp/send", async (req, res) => {
  const { customerId, phone, message } = req.body as {
    customerId?: number;
    phone?: string;
    message: string;
  };

  if (!message?.trim()) {
    res.status(400).json({ success: false, message: "Mensagem é obrigatória" });
    return;
  }

  let targetPhone = phone;

  if (customerId) {
    const [customer] = await db
      .select()
      .from(customersTable)
      .where(eq(customersTable.id, customerId));

    if (!customer) {
      res.status(404).json({ success: false, message: "Cliente não encontrado" });
      return;
    }
    targetPhone = customer.whatsapp;
  }

  if (!targetPhone) {
    res.status(400).json({ success: false, message: "Número de WhatsApp é obrigatório" });
    return;
  }

  logger.info({ phone: targetPhone }, "Sending WhatsApp message via Meta API");
  const result = await sendWhatsAppMessage(targetPhone, message);

  if (!result.success) {
    res.status(500).json(result);
    return;
  }

  res.json(result);
});

export default router;
