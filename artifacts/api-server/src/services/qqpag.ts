import { randomUUID } from "crypto";
import { logger } from "../lib/logger";

const BASE_URL = (process.env.QQPAG_BASE_URL || "https://sandbox.qqpag.com.br").replace(/\/$/, "");
const CLIENT_ID = process.env.QQPAG_CLIENT_ID || "";
const CLIENT_SECRET = process.env.QQPAG_CLIENT_SECRET || "";
const CHAVE_PIX = process.env.QQPAG_CHAVE_PIX || "";
const SCOPES = "cob.write cob.read cobv.write cobv.read pix.write pix.read webhook.read webhook.write";

interface TokenCache {
  token: string;
  expiresAt: number;
}

let tokenCache: TokenCache | null = null;

async function getAccessToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt - 30_000) {
    return tokenCache.token;
  }

  logger.info("Requesting new QQPag OAuth2 token");

  const response = await fetch(`${BASE_URL}/api/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: "client_credentials",
      scope: SCOPES,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    logger.error({ status: response.status, body }, "QQPag OAuth2 token request failed");
    throw new Error(`QQPag auth failed: ${response.status}`);
  }

  const data = await response.json() as { access_token: string; expires_in?: number };
  const expiresIn = data.expires_in ?? 3600;

  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + expiresIn * 1000,
  };

  logger.info({ expiresIn }, "QQPag OAuth2 token obtained");
  return tokenCache.token;
}

async function apiRequest(
  method: string,
  path: string,
  body?: unknown,
  retryOnUnauth = true,
): Promise<Response> {
  const token = await getAccessToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && retryOnUnauth) {
    logger.warn("QQPag 401 — invalidating token cache and retrying");
    tokenCache = null;
    return apiRequest(method, path, body, false);
  }

  return res;
}

export function generateTxId(invoiceId: number): string {
  const uid = randomUUID().replace(/-/g, "").toUpperCase().slice(0, 20);
  const prefix = `INV${String(invoiceId).padStart(8, "0")}`;
  return `${prefix}${uid}`.slice(0, 35);
}

export interface PixChargeRequest {
  txId: string;
  amount: number;
  cpfCnpj: string;
  customerName: string;
  description?: string;
  expiracaoSegundos?: number;
}

export interface PixChargeResult {
  txId: string;
  qrCode: string;
  pixCopiaECola: string;
}

export async function generatePixCharge(data: PixChargeRequest): Promise<PixChargeResult> {
  if (!CLIENT_ID || !CLIENT_SECRET || !CHAVE_PIX) {
    throw new Error("QQPag não configurado: defina QQPAG_CLIENT_ID, QQPAG_CLIENT_SECRET e QQPAG_CHAVE_PIX");
  }

  logger.info({ txId: data.txId }, "Creating QQPag PIX charge");

  const cpfCnpj = data.cpfCnpj.replace(/\D/g, "");
  const isCnpj = cpfCnpj.length > 11;

  const chargeBody = {
    calendario: { expiracao: data.expiracaoSegundos ?? 86_400 },
    devedor: {
      [isCnpj ? "cnpj" : "cpf"]: cpfCnpj,
      nome: data.customerName,
    },
    valor: {
      original: data.amount.toFixed(2),
      modalidadeAlteracao: 0,
    },
    chave: CHAVE_PIX,
    ...(data.description ? { solicitacaoPagador: data.description } : {}),
  };

  const createRes = await apiRequest("PUT", `/api/v1/cob/${data.txId}`, chargeBody);

  if (!createRes.ok) {
    const errorText = await createRes.text();
    logger.error({ status: createRes.status, body: errorText, txId: data.txId }, "QQPag create charge error");
    throw new Error(`QQPag criar cobrança retornou ${createRes.status}: ${errorText}`);
  }

  const chargeData = await createRes.json() as Record<string, unknown>;
  logger.info({ txId: data.txId, status: chargeData.status }, "QQPag charge created");

  const qrcodeRes = await apiRequest("GET", `/api/v2/cob/${data.txId}/qrcode`);

  let qrCode = "";
  let pixCopiaECola = "";

  if (qrcodeRes.ok) {
    const qrData = await qrcodeRes.json() as Record<string, unknown>;
    const imagemQrcode = qrData.imagemQrcode ?? qrData.qrcode ?? qrData.image ?? qrData.qrCode;
    const copiaECola = qrData.pixCopiaECola ?? qrData.payload ?? qrData.emv ?? qrData.copyPaste ?? qrData.qrcode;
    if (typeof imagemQrcode === "string") {
      qrCode = imagemQrcode.startsWith("data:") ? imagemQrcode : imagemQrcode;
    } else if (typeof qrData.imagemQrcode === "object" && qrData.imagemQrcode && "base64" in (qrData.imagemQrcode as Record<string, unknown>)) {
      const base64 = String((qrData.imagemQrcode as Record<string, unknown>).base64 ?? "");
      qrCode = base64 ? `data:image/png;base64,${base64}` : "";
    }
    if (typeof copiaECola === "string") {
      pixCopiaECola = copiaECola;
    }
    logger.info({ txId: data.txId }, "QRCode obtained from QQPag");
  } else {
    const errText = await qrcodeRes.text();
    logger.warn({ status: qrcodeRes.status, body: errText, txId: data.txId }, "QQPag QRCode fetch failed");

    const loc = chargeData.loc as Record<string, unknown> | undefined;
    pixCopiaECola = String(
      chargeData.pixCopiaECola ?? chargeData.pixCopiaCola ?? loc?.location ?? ""
    );
  }

  return { txId: data.txId, qrCode, pixCopiaECola };
}

export async function consultarCobranca(txId: string): Promise<Record<string, unknown>> {
  const res = await apiRequest("GET", `/api/v2/cob/${txId}`);
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`QQPag consultar cobrança ${txId} retornou ${res.status}: ${errorText}`);
  }
  return res.json() as Promise<Record<string, unknown>>;
}
