import { PaymentResponse } from "mercadopago/dist/clients/payment/commonTypes";
import prisma from "../../config/dbConfig";

export async function handleMercadoPagoPayment(paymentData: PaymentResponse): Promise<void> {
  console.log("💰 Processando pagamento aprovado:", {
    id: paymentData.id,
    status: paymentData.status,
    external_reference: paymentData.external_reference
  });

  // Extrair pedido_id do external_reference (formato: "pedido-123")
  const externalRef = paymentData.external_reference;
  if (!externalRef || !externalRef.startsWith('pedido-')) {
    console.log('⚠️ External reference inválida:', externalRef);
    return;
  }

  const pedidoId = parseInt(externalRef.replace('pedido-', ''));
  
  if (isNaN(pedidoId)) {
    console.log('⚠️ Pedido ID inválido:', externalRef);
    return;
  }

  try {
    // Atualizar status do pedido no banco
    const pedidoAtualizado = await prisma.pedido.update({
      where: { pedido_id: pedidoId },
      data: {
        status: paymentData.status === 'approved' ? 'PAGO' : paymentData.status?.toUpperCase() || 'PENDENTE',
        mercadopago_payment_id: String(paymentData.id),
        payer_email: paymentData.payer?.email ?? undefined
      },
      include: {
        cliente: {
          select: {
            nome: true,
            email: true
          }
        },
        produtos_no_pedido: {
          include: {
            produto: true
          }
        }
      }
    });

    console.log(`✅ Pedido #${pedidoId} atualizado para status: ${pedidoAtualizado.status}`);
    console.log(`📧 Cliente: ${pedidoAtualizado.cliente.email}`);

    // TODO: Implementar envio de email de confirmação
    // await enviarEmailConfirmacao(pedidoAtualizado);

  } catch (error: any) {
    console.error(`❌ Erro ao atualizar pedido #${pedidoId}:`, error.message);
    throw error;
  }
}
