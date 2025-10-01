import express from 'express';
import { getProdutos,
    getProdutoById,
    createProduto,
    updateProduto,
    deleteProduto } from '../../controllers/produto';
import isAuth from '../../middlewares/isAuth';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Produto
 *   description: Endpoints para gerenciamento de produtos
 */

/**
 * @swagger
 * /produto:
 *   get:
 *     summary: Lista todos os produtos
 *     tags: [Produto]
 *     responses:
 *       200:
 *         description: Lista de produtos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id_produto:
 *                     type: string
 *                     format: uuid
 *                     example: "550e8400-e29b-41d4-a716-446655440000"
 *                   nome:
 *                     type: string
 *                     example: "Tomate"
 *                   categoria:
 *                     type: string
 *                     example: "Hortifruti"
 *                   qntd:
 *                     type: integer
 *                     example: 100
 *                   data_coleta:
 *                     type: string
 *                     format: date
 *                     example: "2024-07-05"
 *                   preco:
 *                     type: number
 *                     format: float
 *                     example: 3.5
 *                   id_pedido:
 *                     type: integer
 *                     example: 1
 *                   fk_vendedor:
 *                     type: string
 *                     format: uuid
 *                     example: "550e8400-e29b-41d4-a716-446655440111"
 */
router.get('/', getProdutos);

/**
 * @swagger
 * /produto/{id}:
 *   get:
 *     summary: Busca um produto pelo ID
 *     tags: [Produto]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do produto
 *     responses:
 *       200:
 *         description: Produto encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id_produto:
 *                   type: string
 *                   format: uuid
 *                   example: "550e8400-e29b-41d4-a716-446655440000"
 *                 nome:
 *                   type: string
 *                   example: "Tomate"
 *                 categoria:
 *                   type: string
 *                   example: "Hortifruti"
 *                 qntd:
 *                   type: integer
 *                   example: 100
 *                 data_coleta:
 *                   type: string
 *                   format: date
 *                   example: "2024-07-05"
 *                 preco:
 *                   type: number
 *                   format: float
 *                   example: 3.5
 *                 id_pedido:
 *                   type: integer
 *                   example: 1
 *                 fk_vendedor:
 *                   type: string
 *                   format: uuid
 *                   example: "550e8400-e29b-41d4-a716-446655440111"
 *       404:
 *         description: Produto não encontrado
 */
router.get('/:id', getProdutoById);

/**
 * @swagger
 * /produto/cadastro:
 *   post:
 *     summary: Cria um novo produto
 *     tags: [Produto]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *               - categoria
 *               - qntd
 *               - data_coleta
 *               - preco
 *               - id_pedido
 *               - fk_vendedor
 *             properties:
 *               nome:
 *                 type: string
 *                 example: "Tomate"
 *               categoria:
 *                 type: string
 *                 example: "Hortifruti"
 *               qntd:
 *                 type: integer
 *                 example: 100
 *               data_coleta:
 *                 type: string
 *                 format: date
 *                 example: "2024-07-05"
 *               preco:
 *                 type: number
 *                 format: float
 *                 example: 3.5
 *               id_pedido:
 *                 type: integer
 *                 example: 1
 *               fk_vendedor:
 *                 type: string
 *                 format: uuid
 *                 example: "550e8400-e29b-41d4-a716-446655440111"
 *     responses:
 *       201:
 *         description: Produto criado com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post('/cadastro', isAuth, createProduto);

/**
 * @swagger
 * /produto/{id}:
 *   put:
 *     summary: Atualiza um produto pelo ID
 *     tags: [Produto]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do produto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *                 example: "Tomate Italiano"
 *               categoria:
 *                 type: string
 *                 example: "Hortifruti"
 *               qntd:
 *                 type: integer
 *                 example: 120
 *               data_coleta:
 *                 type: string
 *                 format: date
 *                 example: "2024-07-06"
 *               preco:
 *                 type: number
 *                 format: float
 *                 example: 4.0
 *               id_pedido:
 *                 type: integer
 *                 example: 1
 *               fk_vendedor:
 *                 type: string
 *                 format: uuid
 *                 example: "550e8400-e29b-41d4-a716-446655440111"
 *     responses:
 *       200:
 *         description: Produto atualizado com sucesso
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Produto não encontrado
 */
router.put('/:id', isAuth, updateProduto);

/**
 * @swagger
 * /produto/{id}:
 *   delete:
 *     summary: Deleta um produto pelo ID
 *     tags: [Produto]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do produto a ser deletado
 *     responses:
 *       204:
 *         description: Produto deletado com sucesso
 *       404:
 *         description: Produto não encontrado
 */
router.delete('/:id', isAuth, deleteProduto);

export default router;
