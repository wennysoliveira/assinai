import { logger } from "../lib/logger";

const UAZAPI_BASE_URL = process.env.UAZAPI_BASE_URL || "https://api.uazapi.com";
const UAZAPI_TOKEN = process.env.UAZAPI_TOKEN || "";

interface SendMessageRequest {
  phone: string;
  message: string;
}

interface SendMediaRequest {
  phone: string;
  mediaUrl: string;
  caption?: string;
  mediaType?: "image" | "document";
}

interface UazapiResponse {
  success: boolean;
  message: string;
}

async function sendRequest(endpoint: string, body: Record<string, unknown>): Promise<UazapiResponse> {
  try {
    const response = await fetch(`${UAZAPI_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${UAZAPI_TOKEN}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error({ status: response.status, body: errorText }, "Uazapi API error");
      return { success: false, message: `Uazapi API returned ${response.status}` };
    }

    return { success: true, message: "Message sent successfully" };
  } catch (error) {
    logger.error({ error }, "Failed to send message via Uazapi");
    return { success: false, message: "Failed to connect to Uazapi API" };
  }
}

export async function sendTextMessage(data: SendMessageRequest): Promise<UazapiResponse> {
  logger.info({ phone: data.phone }, "Sending text message via Uazapi");
  return sendRequest("/send/text", {
    phone: data.phone,
    message: data.message,
  });
}

export async function sendMediaMessage(data: SendMediaRequest): Promise<UazapiResponse> {
  logger.info({ phone: data.phone }, "Sending media message via Uazapi");
  return sendRequest("/send/media", {
    phone: data.phone,
    mediaUrl: data.mediaUrl,
    caption: data.caption || "",
    mediaType: data.mediaType || "image",
  });
}

export async function sendPaymentReminder(
  phone: string,
  customerName: string,
  amount: number,
  dueDate: string,
  pixCode: string
): Promise<UazapiResponse> {
  const message = `Olá ${customerName}! 👋\n\nLembrete de pagamento:\n💰 Valor: R$ ${amount.toFixed(2)}\n📅 Vencimento: ${dueDate}\n\n📱 PIX Copia e Cola:\n${pixCode}\n\nEm caso de dúvidas, entre em contato conosco.`;
  return sendTextMessage({ phone, message });
}

export async function sendPaymentConfirmation(
  phone: string,
  customerName: string,
  amount: number
): Promise<UazapiResponse> {
  const message = `Olá ${customerName}! ✅\n\nPagamento confirmado!\n💰 Valor: R$ ${amount.toFixed(2)}\n\nObrigado pela confiança!`;
  return sendTextMessage({ phone, message });
}
