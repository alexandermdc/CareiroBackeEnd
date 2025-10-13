import express from 'express';
import {
  getPedidos,
  getPedidoById,
  createPedido,
  updatePedido,
  deletePedido
} from '../../controllers/pedido';
import isAuth from '../../middlewares/isAuth';

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
 *       401:
 *         description: Token não fornecido ou inválido
 */
router.get('/', isAuth, getPedidos);

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
 *               - data_pedido
 *               - fk_feira
 *               - fk_cliente
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
 *     responses:
 *       201:
 *         description: Pedido criado com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post('/cadastro', isAuth, createPedido);

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
