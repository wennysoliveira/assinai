import { randomUUID } from "crypto";
import { logger } from "../lib/logger";

const BASE_URL = sanitizeBaseUrl(process.env.QQPAG_BASE_URL || "https://sandbox.qqpag.com.br");
const STATIC_TOKEN = process.env.QQPAG_TOKEN || "";
const CLIENT_ID = process.env.QQPAG_CLIENT_ID || "";
const CLIENT_SECRET = process.env.QQPAG_CLIENT_SECRET || "";
const CHAVE_PIX = process.env.QQPAG_CHAVE_PIX || "";
const SCOPES = "cob.write cob.read cobv.write cobv.read pix.write pix.read webhook.read webhook.write";

function sanitizeBaseUrl(value: string): string {
  const normalized = value.replace(/\/$/, "");
  try {
    const parsed = new URL(normalized);
    if (!parsed.protocol.startsWith("http")) {
      throw new Error("invalid protocol");
    }
    return parsed.toString().replace(/\/$/, "");
  } catch {
    throw new Error(`QQPAG_BASE_URL inválida: "${value}"`);
  }
}


function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const cause = error.cause instanceof Error ? ` | cause: ${causeToString(error.cause)}` : "";
    return `${error.message}${cause}`;
  }
  return String(error);
}

function causeToString(cause: Error): string {
  const anyCause = cause as Error & { code?: string };
  return anyCause.code ? `${cause.message} (${anyCause.code})` : cause.message;
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}


const RETRYABLE_NETWORK_CODES = new Set([
  "UND_ERR_SOCKET",
  "ECONNRESET",
  "EPIPE",
  "ETIMEDOUT",
  "UND_ERR_CONNECT_TIMEOUT",
  "UND_ERR_HEADERS_TIMEOUT",
  "UND_ERR_BODY_TIMEOUT",
]);

function getErrorCode(error: unknown): string | undefined {
  if (!(error instanceof Error)) return undefined;
  const direct = (error as Error & { code?: string }).code;
  if (direct) return direct;
  const cause = (error as Error & { cause?: unknown }).cause;
  if (cause && typeof cause === "object") {
    return (cause as { code?: string }).code;
  }
  return undefined;
}

function shouldRetryNetworkError(error: unknown): boolean {
  const code = getErrorCode(error);
  return code ? RETRYABLE_NETWORK_CODES.has(code) : false;
}

async function delay(ms: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, ms));
}

interface TokenCache {
  token: string;
  expiresAt: number;
}

let tokenCache: TokenCache | null = null;

async function getAccessToken(retryCount = 1): Promise<string> {
  if (STATIC_TOKEN) {
    return STATIC_TOKEN;
  }

  if (tokenCache && Date.now() < tokenCache.expiresAt - 30_000) {
    return tokenCache.token;
  }

  logger.info("Requesting new QQPag OAuth2 token");

  let response: Response;
  try {
    response = await fetchWithTimeout(`${BASE_URL}/api/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: "client_credentials",
      scope: SCOPES,
    }),
    });
  } catch (error) {
    logger.error({ err: error, baseUrl: BASE_URL }, "QQPag OAuth2 token request network failure");
    if (retryCount > 0 && shouldRetryNetworkError(error)) {
      logger.warn({ code: getErrorCode(error), retriesLeft: retryCount }, "Retrying QQPag OAuth2 token request after network error");
      await delay(300);
      return getAccessToken(retryCount - 1);
    }
    throw new Error(`Falha de conexão com QQPag ao obter token: ${getErrorMessage(error)}`);
  }

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
  retryCount = 1,
): Promise<Response> {
  const token = await getAccessToken();

  let res: Response;
  try {
    res = await fetchWithTimeout(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    logger.error({ err: error, method, path, baseUrl: BASE_URL }, "QQPag request network failure");
    if (retryCount > 0 && shouldRetryNetworkError(error)) {
      logger.warn({ code: getErrorCode(error), method, path, retriesLeft: retryCount }, "Retrying QQPag request after network error");
      await delay(300);
      return apiRequest(method, path, body, retryOnUnauth, retryCount - 1);
    }
    throw new Error(`Falha de conexão com QQPag em ${method} ${path}: ${getErrorMessage(error)}`);
  }

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

function parsePixArtifacts(
  txId: string,
  qrData: Record<string, unknown>,
  chargeData?: Record<string, unknown>,
): { qrCode: string; pixCopiaECola: string } {
  logger.info({ txId, qrDataKeys: Object.keys(qrData) }, "QQPag QRCode raw response keys");

  let qrCode = "";
  let pixCopiaECola = "";

  const rawQr =
    qrData.qrInBase64 ??
    qrData.imagemQrcode ??
    qrData.qrcode ??
    qrData.image ??
    qrData.qrCode;

  const rawCopiaECola =
    qrData.pixCopiaCola ??
    qrData.pixCopiaECola ??
    qrData.payload ??
    qrData.emv ??
    qrData.copyPaste;

  if (typeof rawQr === "string" && rawQr.length > 0) {
    if (rawQr.startsWith("data:") || rawQr.startsWith("http")) {
      qrCode = rawQr;
    } else {
      qrCode = `data:image/png;base64,${rawQr}`;
    }
  } else if (typeof rawQr === "object" && rawQr !== null) {
    const obj = rawQr as Record<string, unknown>;
    const b64 = String(obj.base64 ?? obj.content ?? "");
    if (b64) qrCode = `data:image/png;base64,${b64}`;
  }

  if (typeof rawCopiaECola === "string" && rawCopiaECola.length > 0) {
    pixCopiaECola = rawCopiaECola;
  }

  if (!pixCopiaECola && chargeData) {
    const loc = chargeData.loc as Record<string, unknown> | undefined;
    pixCopiaECola = String(
      chargeData.pixCopiaECola ?? chargeData.pixCopiaCola ?? loc?.location ?? ""
    );
  }

  logger.info(
    { txId, hasQrCode: qrCode.length > 0, hasCopiaECola: pixCopiaECola.length > 0 },
    "QRCode obtained from QQPag",
  );

  return { qrCode, pixCopiaECola };
}

export async function fetchPixChargeArtifacts(
  txId: string,
  chargeData?: Record<string, unknown>,
): Promise<{ qrCode: string; pixCopiaECola: string }> {
  const qrcodeRes = await apiRequest("GET", `/api/v2/cob/${txId}/qrcode`);

  if (qrcodeRes.ok) {
    const qrData = await qrcodeRes.json() as Record<string, unknown>;
    return parsePixArtifacts(txId, qrData, chargeData);
  }

  const errText = await qrcodeRes.text();
  logger.warn({ status: qrcodeRes.status, body: errText, txId }, "QQPag QRCode fetch failed");

  const fallbackChargeData = chargeData ?? await consultarCobranca(txId);
  return parsePixArtifacts(txId, {}, fallbackChargeData);
}

export async function generatePixCharge(data: PixChargeRequest): Promise<PixChargeResult> {
  if (!CHAVE_PIX) {
    throw new Error("QQPag não configurado: defina QQPAG_CHAVE_PIX");
  }

  if (!STATIC_TOKEN && (!CLIENT_ID || !CLIENT_SECRET)) {
    throw new Error("QQPag não configurado: defina QQPAG_TOKEN ou QQPAG_CLIENT_ID e QQPAG_CLIENT_SECRET");
  }

  logger.info({ txId: data.txId }, "Creating QQPag PIX charge");

  const cpfCnpj = data.cpfCnpj.replace(/\D/g, "");
  if (cpfCnpj.length !== 11 && cpfCnpj.length !== 14) {
    throw new Error("CPF/CNPJ do cliente inválido para gerar cobrança PIX");
  }

  const customerName = data.customerName.trim();
  if (!customerName) {
    throw new Error("Nome do cliente é obrigatório para gerar cobrança PIX");
  }

  const isCnpj = cpfCnpj.length > 11;

  const chargeBody = {
    calendario: { expiracao: data.expiracaoSegundos ?? 8_640_000 },
    devedor: {
      [isCnpj ? "cnpj" : "cpf"]: cpfCnpj,
      nome: customerName,
    },
    valor: {
      original: data.amount.toFixed(2),
      modalidadeAlteracao: 1,
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

  const { qrCode, pixCopiaECola } = await fetchPixChargeArtifacts(data.txId, chargeData);

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
