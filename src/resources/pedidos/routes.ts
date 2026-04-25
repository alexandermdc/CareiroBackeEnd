import express from 'express';
import {
  getPedidos,
  getPedidoById,
  createPedido,
  updatePedido,
  deletePedido,
  getPedidosPorStatus,
  getPedidoPorMercadoPagoId,
  getPedidosAdmin
} from './controllers';
import { isAuth, isCliente, isVendedor, isClienteOrVendedor, isAdmin } from '../../shared/middlewares/isAuth';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Pedido
 *   description: Endpoints para gerenciamento de pedidos
 */

/**
 * @swagger
 * /pedido:
 *   get:
 *     summary: Lista pedidos do usuário autenticado
 *     tags: [Pedido]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de pedidos do usuário
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   pedido_id:
 *                     type: integer
 *                     example: 1
 *                   data_pedido:
 *                     type: string
 *                     format: date
 *                     example: '2024-07-05'
 *                   fk_feira:
 *                     type: integer
 *                     example: 3
 *                   fk_cliente:
 *                     type: string
 *                     example: 'cliente@email.com'
 *                   fk_feira_retirada:
 *                     type: integer
 *                     nullable: true
 *                     example: 5
 *                   feira_retirada:
 *                     type: object
 *                     nullable: true
 *                     properties:
 *                       id_feira:
 *                         type: integer
 *                       nome:
 *                         type: string
 *                       localizacao:
 *                         type: string
 *                       data_hora:
 *                         type: string
 *       401:
 *         description: Token não fornecido ou inválido
 */
router.get('/', isAuth, getPedidos);

// Lista pedidos por status (ex.: PAGO). Query: ?status=PAGO&limit=50
router.get('/pagos', isAuth, getPedidosPorStatus);

// Buscar pedido pelo mercadopago_payment_id
router.get('/por-pagamento/:paymentId', isAuth, getPedidoPorMercadoPagoId);

// Rotas admin: lista pedidos com dados completos para controle
router.get('/admin/pedidos', isAuth, isAdmin, getPedidosAdmin);

/**
 * @swagger
 * /pedido/{id}:
 *   get:
 *     summary: Busca um pedido pelo ID (apenas do usuário autenticado)
 *     tags: [Pedido]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do pedido
 *     responses:
 *       200:
 *         description: Pedido encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pedido_id:
 *                   type: integer
 *                   example: 1
 *                 data_pedido:
 *                   type: string
 *                   format: date
 *                   example: '2024-07-05'
 *                 fk_feira:
 *                   type: integer
 *                   example: 3
 *                 fk_cliente:
 *                   type: string
 *                   example: 'cliente@email.com'
 *                 fk_feira_retirada:
 *                   type: integer
 *                   nullable: true
 *                   example: 5
 *                 feira_retirada:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     id_feira:
 *                       type: integer
 *                     nome:
 *                       type: string
 *                     localizacao:
 *                       type: string
 *                     data_hora:
 *                       type: string
 *       401:
 *         description: Token não fornecido ou inválido
 *       403:
 *         description: Acesso negado - pedido não pertence ao usuário
 *       404:
 *         description: Pedido não encontrado
 */
router.get('/:id', isAuth, getPedidoById);

/**
 * @swagger
 * /pedido/cadastro:
 *   post:
 *     summary: Cria um novo pedido
 *     tags: [Pedido]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - produtos
 *             properties:
 *               data_pedido:
 *                 type: string
 *                 format: date
 *                 example: '2024-07-05'
 *               fk_feira:
 *                 type: integer
 *                 example: 3
 *               fk_cliente:
 *                 type: string
 *                 example: 'cliente@email.com'
 *               forma_entrega:
 *                 type: string
 *                 description: Se enviado como RETIRADA, exige ponto de retirada
 *                 example: 'RETIRADA'
 *               fk_feira_retirada:
 *                 type: integer
 *                 nullable: true
 *                 description: Campo novo priorizado para retirada
 *                 example: 5
 *               fk_associacao_retirada:
 *                 type: string
 *                 nullable: true
 *                 description: Campo legado aceito temporariamente
 *                 example: '2f63ba48-b882-4653-a4e1-e3f6d286eb5e'
 *               produtos:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     produto_id:
 *                       type: string
 *                     quantidade:
 *                       type: integer
 *     responses:
 *       201:
 *         description: Pedido criado com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post('/cadastro', isAuth, isClienteOrVendedor, createPedido);

/**
 * @swagger
 * /pedido/{id}:
 *   put:
 *     summary: Atualiza um pedido pelo ID
 *     tags: [Pedido]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do pedido
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               data_pedido:
 *                 type: string
 *                 format: date
 *                 example: '2024-07-06'
 *               fk_feira:
 *                 type: integer
 *                 example: 5
 *               fk_cliente:
 *                 type: string
 *                 example: 'novo@email.com'
 *               fk_feira_retirada:
 *                 type: integer
 *                 nullable: true
 *               fk_associacao_retirada:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Pedido atualizado com sucesso
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Pedido não encontrado
 */
router.put('/:id', isAuth, updatePedido);

/**
 * @swagger
 * /pedido/{id}:
 *   delete:
 *     summary: Deleta um pedido pelo ID
 *     tags: [Pedido]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do pedido a ser deletado
 *     responses:
 *       204:
 *         description: Pedido deletado com sucesso
 *       404:
 *         description: Pedido não encontrado
 */
router.delete('/:id', isAuth, deletePedido);

export default router;
