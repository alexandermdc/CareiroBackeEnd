import express from 'express';
import { getAtendeUm } from './controllers';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Atendimento
 *   description: Endpoints relacionados ao vínculo entre clientes e vendedores
 */

/**
 * @swagger
 * /atendeum:
 *   get:
 *     summary: Lista os vínculos de atendimento entre cliente e vendedor
 *     tags: [Atendimento]
 *     responses:
 *       200:
 *         description: Lista de vínculos retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   clienteId:
 *                     type: integer
 *                     example: 1
 *                   vendedorId:
 *                     type: integer
 *                     example: 2
 *       500:
 *         description: Erro ao buscar os dados de atendimento
 */
router.get('/', getAtendeUm);

export default router;
