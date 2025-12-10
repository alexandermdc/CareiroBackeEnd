import { PaymentResponse } from "mercadopago/dist/clients/payment/commonTypes";

export async function handleMercadoPagoPayment(paymentData: PaymentResponse): Promise<void> {
  const metadata = paymentData.metadata;
  const userEmail = metadata?.user_email; // snake_case, como o MP converte
  const testeId = metadata?.teste_id;

  console.log("Pagamento aprovado para:", userEmail);
  console.log("Referente ao teste:", testeId);

  // Aqui você pode:
  // - Liberar acesso ao conteúdo
  // - Marcar status no banco de dados
  // - Enviar e-mail de confirmação
  // - Integrar com outro serviço

  // Exemplo:
  // await sendConfirmationEmail(userEmail, testeId);
}
