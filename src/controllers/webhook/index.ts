import { Request, Response } from "express";
import { Payment } from "mercadopago";
import mercadopago from "../../services/mercadoPago"; // seu client config
import { verifyMercadoPagoSignature } from "../mercadoPago/mercadopago";
import { handleMercadoPagoPayment } from "../serverMercadoPago/index";

export const webhookHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    // Verificar a assinatura do Mercado Pago
    const isValidSignature = verifyMercadoPagoSignature(req, res);
    if (!isValidSignature) {
      // A função verifyMercadoPagoSignature já enviou a resposta de erro
      return;
    }

    const { type, data } = req.body;

    if (type === "payment") {
      const paymentClient = new Payment(mercadopago);
      const paymentData = await paymentClient.get({ id: Number(data.id) });

      if (
        paymentData.status === "approved" ||
        paymentData.date_approved !== null
      ) {
        await handleMercadoPagoPayment(paymentData);
      }
    } else {
      console.log("Tipo de evento não tratado:", type);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Erro no webhook:", error);
    res.status(500).json({ error: "Falha no processamento do webhook" });
  }
};
export default webhookHandler;