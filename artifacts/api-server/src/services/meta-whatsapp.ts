import { logger } from "../lib/logger";

const META_TOKEN = process.env.META_WHATSAPP_TOKEN || "";
const META_PHONE_NUMBER_ID = process.env.META_PHONE_NUMBER_ID || "";
const META_API_VERSION = "v20.0";

interface MessageResult {
  success: boolean;
  message: string;
}

export async function sendWhatsAppMessage(
  to: string,
  text: string
): Promise<MessageResult> {
  if (!META_TOKEN) {
    logger.error("META_WHATSAPP_TOKEN not configured");
    return { success: false, message: "Token da API Meta não configurado" };
  }
  if (!META_PHONE_NUMBER_ID) {
    logger.error("META_PHONE_NUMBER_ID not configured");
    return { success: false, message: "Phone Number ID da Meta não configurado" };
  }

  const phone = to.replace(/\D/g, "");

  try {
    const url = `https://graph.facebook.com/${META_API_VERSION}/${META_PHONE_NUMBER_ID}/messages`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${META_TOKEN}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phone,
        type: "text",
        text: { body: text },
      }),
    });

    const data = await response.json() as Record<string, unknown>;

    if (!response.ok) {
      logger.error({ status: response.status, data }, "Meta WhatsApp API error");
      const error = data.error as { message?: string } | undefined;
      return {
        success: false,
        message: error?.message || `Erro ${response.status} da API Meta`,
      };
    }

    logger.info({ to: phone }, "WhatsApp message sent via Meta API");
    return { success: true, message: "Mensagem enviada com sucesso" };
  } catch (error) {
    logger.error({ error }, "Failed to send WhatsApp message via Meta API");
    return { success: false, message: "Falha ao conectar com a API Meta" };
  }
}
