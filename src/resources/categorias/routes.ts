import express from 'express';
import { getCategorias, getCategoriaById, createCategoria } from './controllers';
import isAuth from '../../shared/middlewares/isAuth';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Categoria
 *   description: Endpoints para gerenciamento de categorias de produtos
 */

/**
 * @swagger
 * /categoria:
 *   get:
 *     summary: Lista todas as categorias
 *     tags: [Categoria]
 *     responses:
 *       200:
 *         description: Lista de categorias
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id_categoria:
 *                     type: string
 *                     format: uuid
 *                     example: "6cc42d23-1d1a-46b9-b4cf-453043936484"
 *                   nome:
 *                     type: string
 *                     example: "Frutas"
 */
router.get('/', getCategorias);

/**
 * @swagger
 * /categoria/{id}:
 *   get:
 *     summary: Busca uma categoria pelo ID
 *     tags: [Categoria]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da categoria
 *     responses:
 *       200:
 *         description: Categoria encontrada
 *       404:
 *         description: Categoria não encontrada
 */
router.get('/:id', getCategoriaById);

/**
 * @swagger
 * /categoria:
 *   post:
 *     summary: Cria uma nova categoria
 *     tags: [Categoria]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *             properties:
 *               nome:
 *                 type: string
 *                 example: "Frutas"
 *     responses:
 *       201:
 *         description: Categoria criada com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post('/', isAuth, createCategoria);

export default router;
