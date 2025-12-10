import crypto from "crypto";
import { Request, Response } from "express";

/**
 * Verifica a assinatura enviada pelo Mercado Pago no webhook.
 * Protege contra chamadas externas maliciosas.
 */
export function verifyMercadoPagoSignature(req: Request, res: Response): boolean {
  const xSignature = req.headers["x-signature"] as string | undefined;
  const xRequestId = req.headers["x-request-id"] as string | undefined;

  if (!xSignature || !xRequestId) {
    res.status(400).json({ error: "Missing x-signature or x-request-id header" });
    return false;
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

  const dataId = req.query["data.id"] as string | undefined;

  let manifest = "";
  if (dataId) {
    manifest += `id:${dataId};`;
  }
  if (xRequestId) {
    manifest += `request-id:${xRequestId};`;
  }
  manifest += `ts:${ts};`;

  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET as string;
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(manifest);
  const generatedHash = hmac.digest("hex");

  if (generatedHash !== v1) {
    res.status(401).json({ error: "Invalid signature" });
    return false;
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
