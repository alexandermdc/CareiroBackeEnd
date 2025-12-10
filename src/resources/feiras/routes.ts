import express from 'express';
import { 
    getFeiras,
    getFeiraById, 
    createFeira, 
    updateFeira, 
    deleteFeira 
} from './controllers';
import isAuth from '../../shared/middlewares/isAuth';

const router = express.Router();


/**
 * @swagger
 * tags:
 *   name: Feiras
 *   description: Rotas para gerenciar feiras
 */

/**
 * @swagger
 * /feiras:
 *   get:
 *     summary: Lista todos as feiras
 *     tags: [Feiras]
 *     responses:
 *       200:
 *         description: Lista de feiras
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id_feira:
 *                     type: int
 *                     example: 1
 *                   nome:
 *                     type: string
 *                     example: 'Feira da Laranja'
 *                   endereco:
 *                     type: string
 *                     example: 'Rua Laranjeiras'
 */
router.get('/', getFeiras);


/**
 * @swagger
 * /feiras/{id}:
 *   get:
 *     summary: Busca uma feira pelo Id
 *     tags: [Feiras]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: int
 *         description: Id das feiras
 *     responses:
 *       200:
 *         description: Feira encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id_feira:
 *                   type: int
 *                   example: 1
 *                 nome:
 *                   type: string
 *                   example: 'Feira da Laranja'
 *                 endereco:
 *                   type: string
 *                   example: 'Rua Laranjeiras'
 *       404:
 *         description: Feira não encontrada
 */
router.get('/:id', getFeiraById);


/**
 * @swagger
 * /feiras:
 *   post:
 *     summary: Cria uma nova Feira
 *     tags: [Feiras]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - nome
 *               - endereco
 *             properties:
 *               id_feira:
 *                 type: int
 *                 example: 1
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
router.post('/', isAuth, createFeira);


/**
 * @swagger
 * /feiras/{id}:
 *   put:
 *     summary: Atualiza uma feira pelo ID
 *     tags: [Feiras]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da feira a ser atualizada
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *                 example: 'Feira Atualizada'
 *               endereco:
 *                 type: string
 *                 example: 'Novo Endereço'
 *     responses:
 *       200:
 *         description: Feira atualizada com sucesso
 *       401:
 *         description: Token não fornecido ou inválido
 *       404:
 *         description: Feira não encontrada
 */
router.put('/:id', isAuth, updateFeira);


/**
 * @swagger
 * /feiras/{id}:
 *   delete:
 *     summary: Deleta uma feira pelo ID
 *     tags: [Feiras]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da feira a ser deletada
 *     responses:
 *       204:
 *         description: Feira deletada com sucesso
 *       401:
 *         description: Token não fornecido ou inválido
 *       404:
 *         description: Feira não encontrada
 */
router.delete('/:id', isAuth, deleteFeira);

export default router;
