import express from 'express';
import {
  getAssociacoes,
  getAssociacaoById,
  criarAssociacao,
  atualizarAssociacao,
  deletarAssociacao,
} from './controllers';
import isAuth from '../../shared/middlewares/isAuth';
import { isAdmin } from '../../shared/middlewares/isAdmin';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Associação
 *   description: Endpoints para gerenciamento de associações
 */

/**
 * @swagger
 * /associacao:
 *   get:
 *     summary: Lista todas as associações
 *     tags: [Associação]
 *     responses:
 *       200:
 *         description: Lista de associações retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Associacao'
*/
router.get('/', getAssociacoes);

/**
 * @swagger
 * /associacao/{id}:
 *   get:
 *     summary: Retorna uma associação pelo ID
 *     tags: [Associação]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID da associação
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Associação encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Associacao'
 *       404:
 *         description: Associação não encontrada
*/
router.get('/:id', getAssociacaoById);

/**
 * @swagger
 * /associacao/{id}:
 *   put:
 *     summary: Atualiza uma associação existente
 *     tags: [Associação]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID da associação
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Associacao'
 *     responses:
 *       200:
 *         description: Associação atualizada com sucesso
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Associação não encontrada
*/
/**
 * @swagger
 * /associacao/{id}:
 *   delete:
 *     summary: Deleta uma associação existente
 *     tags: [Associação]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID da associação
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Associação deletada com sucesso
 *       401:
 *         description: Token não fornecido ou inválido
 *       404:
 *         description: Associação não encontrada
*/
router.put('/:id', isAuth, isAdmin, atualizarAssociacao);
router.patch('/:id', isAuth, isAdmin, atualizarAssociacao);
router.delete('/:id', isAuth, isAdmin, deletarAssociacao);

/**
 * @swagger
 * /associacao/cadastro:
 *   post:
 *     summary: Cria uma nova associação
 *     tags: [Associação]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Associacao'
 *     responses:
 *       201:
 *         description: Associação criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Associacao'
 *       400:
 *         description: Erro nos dados enviados
 *       401:
 *         description: Token não fornecido ou inválido
 *       403:
 *         description: Acesso negado - apenas administradores
 */
// 👑 Rotas protegidas - APENAS ADMINISTRADORES
router.post('/cadastro', isAuth, isAdmin, criarAssociacao);

export default router;

