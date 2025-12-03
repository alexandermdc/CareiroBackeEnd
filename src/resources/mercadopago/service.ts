import { MercadoPagoConfig } from 'mercadopago';

// Verificar se o token está carregado
if (!process.env.MERCADO_PAGO_TOKEN) {
  console.error('[ERRO] MERCADO_PAGO_TOKEN não está definido no .env');
} else {
  console.log('[INFO] MercadoPago configurado com token:', process.env.MERCADO_PAGO_TOKEN.substring(0, 20) + '...');
}

const mercadopago = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_TOKEN!,
});

export default mercadopago;