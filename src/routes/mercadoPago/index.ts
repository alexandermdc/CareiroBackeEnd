
import criarPagamento from "../../controllers/mercadoPago";
import express from "express";
import isAuth from '../../middlewares/isAuth';

const router = express.Router();

/**
 * @swagger
 * /mercado-pago/pagamento:
 *   post:
 *     summary: Cria uma preferência de pagamento no Mercado Pago
 *     tags: [Mercado Pago]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - testeId
 *             properties:
 *               testeId:
 *                 type: string
 *                 description: Identificador externo da transação
 *                 example: "pedido-123"
 *               userEmail:
 *                 type: string
 *                 format: email
 *                 description: Email do cliente (opcional)
 *                 example: "cliente@email.com"
 *     responses:
 *       200:
 *         description: Preferência de pagamento criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 preferenceId:
 *                   type: string
 *                   example: "123456789-abc123-xyz789"
 *                 initPoint:
 *                   type: string
 *                   format: uri
 *                   example: "https://www.mercadopago.com/init-point-do-pagamento"
 *       500:
 *         description: Erro ao criar a preferência de pagamento
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Erro ao criar preferência"
 */

router.post("/", isAuth, criarPagamento);

export default router;
