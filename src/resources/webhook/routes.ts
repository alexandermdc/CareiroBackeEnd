import { Router } from "express";
import { webhookHandler } from "./controllers";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Webhook
 *   description: Endpoints para webhooks de pagamento
 */

/**
 * @swagger
 * /webhook/mercadopago:
 *   post:
 *     summary: Webhook do Mercado Pago para notificações de pagamento
 *     tags: [Webhook]
 *     description: Este endpoint é chamado automaticamente pelo Mercado Pago quando há mudanças no status do pagamento
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 example: "payment"
 *               data:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "123456789"
 *     responses:
 *       200:
 *         description: Webhook processado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 received:
 *                   type: boolean
 *                   example: true
 *       500:
 *         description: Erro no processamento do webhook
 */
router.post("/mercadopago", webhookHandler);

export default router;