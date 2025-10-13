import express from 'express';
import {
  listarClientes,
  listarClientesPorId,
  criarCliente,
  atualizarCliente,
  deletarCliente,
  adicionarFavorito,
  listarFavoritos
} from '../../controllers/cliente';
import isAuth from '../../middlewares/isAuth';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Clientes
 *   description: Rotas para gerenciar clientes
 */

/**
 * @swagger
 * /clientes:
 *   get:
 *     summary: Lista todos os clientes
 *     tags: [Clientes]
 *     responses:
 *       200:
 *         description: Lista de clientes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   cpf:
 *                     type: string
 *                     example: '12345678900'
 *                   nome:
 *                     type: string
 *                     example: 'Alexander Nascimento'
 *                   email:
 *                     type: string
 *                     example: 'alexander@email.com'
 */
router.get('/', listarClientes);

/**
 * @swagger
 * /clientes/{cpf}:
 *   get:
 *     summary: Busca um cliente pelo CPF
 *     tags: [Clientes]
 *     parameters:
 *       - in: path
 *         name: cpf
 *         required: true
 *         schema:
 *           type: string
 *         description: CPF do cliente
 *     responses:
 *       200:
 *         description: Cliente encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cpf:
 *                   type: string
 *                   example: '12345678900'
 *                 nome:
 *                   type: string
 *                   example: 'Alexander Nascimento'
 *                 email:
 *                   type: string
 *                   example: 'alexander@email.com'
 *       404:
 *         description: Cliente não encontrado
 */
router.get('/:cpf', listarClientesPorId);

/**
 * @swagger
 * /clientes:
 *   post:
 *     summary: Cria um novo cliente
 *     tags: [Clientes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cpf
 *               - nome
 *               - email
 *             properties:
 *               cpf:
 *                 type: string
 *                 example: '12345678900'
 *               nome:
 *                 type: string
 *                 example: 'Alexander Nascimento'
 *               email:
 *                 type: string
 *                 example: 'alexander@email.com'
 *     responses:
 *       201:
 *         description: Cliente criado com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post('/', criarCliente);

/**
 * @swagger
 * /clientes/{cpf}:
 *   put:
 *     summary: Atualiza um cliente pelo CPF
 *     tags: [Clientes]
 *     parameters:
 *       - in: path
 *         name: cpf
 *         required: true
 *         schema:
 *           type: string
 *         description: CPF do cliente a ser atualizado
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *                 example: 'Alexander Atualizado'
 *               email:
 *                 type: string
 *                 example: 'alexanderatualizado@email.com'
 *     responses:
 *       200:
 *         description: Cliente atualizado com sucesso
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Cliente não encontrado
 */
router.put('/:cpf', isAuth, atualizarCliente);

/**
 * @swagger
 * /clientes/{cpf}:
 *   delete:
 *     summary: Deleta um cliente pelo CPF
 *     tags: [Clientes]
 *     parameters:
 *       - in: path
 *         name: cpf
 *         required: true
 *         schema:
 *           type: string
 *         description: CPF do cliente a ser deletado
 *     responses:
 *       204:
 *         description: Cliente deletado com sucesso
 *       404:
 *         description: Cliente não encontrado
 */
router.delete('/:cpf', isAuth, deletarCliente);

router.put("/:cpf/favoritos", isAuth, adicionarFavorito);

router.get("/:cpf/favoritos", isAuth, listarFavoritos)

export default router;
