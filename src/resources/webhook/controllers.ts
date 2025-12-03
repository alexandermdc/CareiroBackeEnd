import { Request, Response } from "express";
import { Payment } from "mercadopago";
import mercadopago from "../mercadopago/service"; // seu client config
import { verifyMercadoPagoSignature } from "../mercadopago/mercadopago";
import { handleMercadoPagoPayment } from "../mercadopago/serverMercadoPago";

export const webhookHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('[WEBHOOK] Recebida notificação:', {
      headers: req.headers,
      query: req.query,
      body: req.body
    });

    // Verificar a assinatura do Mercado Pago
    const isValidSignature = verifyMercadoPagoSignature(req, res);
    if (!isValidSignature) {
      console.log('[WEBHOOK] Assinatura inválida');
      // A função verifyMercadoPagoSignature já enviou a resposta de erro
      return;
    }

    console.log('[WEBHOOK] Assinatura válida');

    const { type, data } = req.body;

    if (type === "payment") {
      try {
        const paymentClient = new Payment(mercadopago);
        const paymentData = await paymentClient.get({ id: Number(data.id) });

        if (
          paymentData.status === "approved" ||
          paymentData.date_approved !== null
        ) {
          await handleMercadoPagoPayment(paymentData);
        }
        
        console.log('[WEBHOOK] Pagamento processado com sucesso:', data.id);
      } catch (paymentError: any) {
        // Se for um erro de pagamento não encontrado (teste do MP), apenas loga mas retorna 200
        if (paymentError.status === 404 || paymentError.error === 'not_found') {
          console.log('[WEBHOOK] Pagamento de teste não encontrado (ID:', data.id, ') - ignorando');
        } else {
          // Outros erros são re-lançados
          throw paymentError;
        }
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