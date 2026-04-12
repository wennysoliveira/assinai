import { logger } from "../lib/logger";

const QQPAG_BASE_URL = process.env.QQPAG_BASE_URL || "https://api.qqpag.com.br";
const QQPAG_TOKEN = process.env.QQPAG_TOKEN || "";

interface PixChargeRequest {
  externalId: string;
  amount: number;
  description: string;
  cpfCnpj: string;
  customerName: string;
}

interface PixChargeResponse {
  transactionId: string;
  qrCode: string;
  pixCopiaECola: string;
  externalId: string;
  status: string;
}

export async function generatePixCharge(data: PixChargeRequest): Promise<PixChargeResponse> {
  logger.info({ externalId: data.externalId }, "Generating PIX charge via QQPag");

  try {
    const response = await fetch(`${QQPAG_BASE_URL}/pix/cobranca`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${QQPAG_TOKEN}`,
      },
      body: JSON.stringify({
        external_id: data.externalId,
        valor: data.amount,
        descricao: data.description,
        cpf_cnpj: data.cpfCnpj,
        nome: data.customerName,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error({ status: response.status, body: errorText }, "QQPag API error");
      throw new Error(`QQPag API returned ${response.status}: ${errorText}`);
    }

    const result = await response.json() as Record<string, unknown>;

    return {
      transactionId: String(result.transaction_id || result.transactionId || ""),
      qrCode: String(result.qr_code || result.qrCode || ""),
      pixCopiaECola: String(result.pix_copia_e_cola || result.pixCopiaECola || ""),
      externalId: data.externalId,
      status: String(result.status || "pending"),
    };
  } catch (error) {
    logger.error({ error, externalId: data.externalId }, "Failed to generate PIX charge");
    throw error;
  }
}
