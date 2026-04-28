import crypto from "crypto";
import { Request, Response } from "express";

function isMercadoPagoWebhookStrictModeEnabled(): boolean {
  return process.env.NODE_ENV === "production" || process.env.MERCADO_PAGO_WEBHOOK_STRICT_SIGNATURE === "true";
}

function shouldBypassMercadoPagoWebhookValidation(): boolean {
  return process.env.MERCADO_PAGO_ALLOW_UNVERIFIED_WEBHOOKS === "true";
}

/**
 * Verifica a assinatura enviada pelo Mercado Pago no webhook.
 * Protege contra chamadas externas maliciosas.
 */
export function verifyMercadoPagoSignature(req: Request, res: Response): boolean {
  const xSignature = req.headers["x-signature"] as string | undefined;
  const xRequestId = req.headers["x-request-id"] as string | undefined;
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET as string | undefined;
  const strictModeEnabled = isMercadoPagoWebhookStrictModeEnabled();
  const bypassValidation = shouldBypassMercadoPagoWebhookValidation();

  if (!xSignature || !xRequestId) {
    if (strictModeEnabled && !bypassValidation) {
      res.status(400).json({ error: "Missing x-signature or x-request-id header" });
      return false;
    }

    console.warn("[WEBHOOK][MercadoPago] Headers ausentes, seguindo sem validação estrita.");
    return true;
  }

  if (!secret) {
    if (strictModeEnabled && !bypassValidation) {
      res.status(500).json({ error: "Missing MERCADO_PAGO_WEBHOOK_SECRET" });
      return false;
    }

    console.warn("[WEBHOOK][MercadoPago] MERCADO_PAGO_WEBHOOK_SECRET ausente, seguindo sem validação estrita.");
    return true;
  }

  const signatureParts = xSignature.split(",");
  let ts = "";
  let v1 = "";

  signatureParts.forEach((part) => {
    const [key, value] = part.split("=");
    if (key.trim() === "ts") {
      ts = value.trim();
    } else if (key.trim() === "v1") {
      v1 = value.trim();
    }
  });

  if (!ts || !v1) {
    res.status(400).json({ error: "Invalid x-signature header format" });
    return false;
  }

  const dataIdFromQueryFlat = typeof req.query["data.id"] === "string" ? req.query["data.id"] : undefined;
  const dataIdFromQueryNested = typeof (req.query as any)?.data?.id === "string" ? (req.query as any).data.id : undefined;
  const dataIdFromBody = typeof (req.body as any)?.data?.id === "string" || typeof (req.body as any)?.data?.id === "number"
    ? String((req.body as any).data.id)
    : undefined;
  const dataId = dataIdFromQueryFlat || dataIdFromQueryNested || dataIdFromBody;

  let manifest = "";
  if (dataId) {
    manifest += `id:${dataId};`;
  }
  if (xRequestId) {
    manifest += `request-id:${xRequestId};`;
  }
  manifest += `ts:${ts};`;

  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(manifest);
  const generatedHash = hmac.digest("hex");

  const generatedHashBuffer = Buffer.from(generatedHash, "hex");
  const receivedHashBuffer = Buffer.from(v1, "hex");
  const isValid =
    generatedHashBuffer.length === receivedHashBuffer.length &&
    crypto.timingSafeEqual(generatedHashBuffer, receivedHashBuffer);

  if (!isValid) {
    if (strictModeEnabled && !bypassValidation) {
      res.status(401).json({ error: "Invalid signature" });
      return false;
    }

    console.warn("[WEBHOOK][MercadoPago] Assinatura inválida, mas validação estrita desativada. Manifest:", manifest);
    return true;
  }

  return true;
}
/**
 * Função para verificar se o webhook é do tipo de pagamento.
 * @param req - Requisição Express
 * @returns Verdadeiro se for um evento de pagamento, falso caso contrário.
 */
export function isPaymentWebhook(req: Request): boolean {
  const { type } = req.body;
  return type === "payment";
}
