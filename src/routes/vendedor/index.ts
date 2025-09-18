import express from 'express';
import {
  getVendedores,
  getVendedorById,
  createVendedor,
  updateVendedor,
  deleteVendedor,
} from '../../controllers/vendedor';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Vendedor
 *   description: Endpoints para gerenciamento de vendedores
 */

/**
 * @swagger
 * /vendedor:
 *   get:
 *     summary: Lista todos os vendedores
 *     tags: [Vendedor]
 *     responses:
 *       200:
 *         description: Lista de vendedores
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id_vendedor:
 *                     type: string
 *                     format: uuid
 *                     example: "a1b2c3d4-e5f6-7890-abcd-1234567890ab"
 *                   nome:
 *                     type: string
 *                     example: "Maria Oliveira"
 *                   telefone:
 *                     type: string
 *                     example: "92999998888"
 *                   endereco_venda:
 *                     type: string
 *                     example: "Feira do Santo Antônio"
 *                   tipo_vendedor:
 *                     type: string
 *                     enum: [Autônomo, Associado]
 *                     example: "Autônomo"
 *                   tipo_documento:
 *                     type: string
 *                     enum: [CPF, CNPJ]
 *                     example: "CPF"
 *                   fk_associacao:
 *                     type: string
 *                     format: uuid
 *                     example: "f1e2d3c4-b5a6-7890-abcd-0987654321fe"
 */

router.get('/', getVendedores);

/**
 * @swagger
 * /vendedor/{id}:
 *   get:
 *     summary: Busca um vendedor pelo ID
 *     tags: [Vendedor]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do vendedor
 *     responses:
 *       200:
 *         description: Vendedor encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id_vendedor:
 *                   type: string
 *                   format: uuid
 *                 nome:
 *                   type: string
 *                 telefone:
 *                   type: string
 *                 endereco_venda:
 *                   type: string
 *                 tipo_vendedor:
 *                   type: string
 *                   enum: [Autônomo, Associado]
 *                 tipo_documento:
 *                   type: string
 *                   enum: [CPF, CNPJ]
 *                 fk_associacao:
 *                   type: string
 *                   format: uuid
 *       404:
 *         description: Vendedor não encontrado
 */
router.get('/:id', getVendedorById);

/**
 * @swagger
 * /vendedor/cadastro:
 *   post:
 *     summary: Cria um novo vendedor
 *     tags: [Vendedor]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *               - telefone
 *               - endereco_venda
 *               - tipo_vendedor
 *               - tipo_documento
 *               - senha
 *               - fk_associacao
 *             properties:
 *               nome:
 *                 type: string
 *                 example: "João Silva"
 *               telefone:
 *                 type: string
 *                 example: "92999997777"
 *               endereco_venda:
 *                 type: string
 *                 example: "Feira da Panair"
 *               tipo_vendedor:
 *                 type: string
 *                 enum: [Autônomo, Associado]
 *                 example: "Associado"
 *               tipo_documento:
 *                 type: string
 *                 enum: [CPF, CNPJ]
 *                 example: "CNPJ"
 *               senha:
 *                 type: string
 *                 example: "senha123"
 *               fk_associacao:
 *                 type: string
 *                 format: uuid
 *                 example: "aabbccdd-1122-3344-5566-77889900aabb"
 *     responses:
 *       201:
 *         description: Vendedor criado com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post('/cadastro', createVendedor);

/**
 * @swagger
 * /vendedor/{id}:
 *   put:
 *     summary: Atualiza um vendedor pelo ID
 *     tags: [Vendedor]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do vendedor
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *                 example: "João Atualizado"
 *               telefone:
 *                 type: string
 *                 example: "92988889999"
 *               endereco_venda:
 *                 type: string
 *                 example: "Feira nova"
 *               tipo_vendedor:
 *                 type: string
 *                 enum: [Autônomo, Associado]
 *                 example: "Autônomo"
 *               tipo_documento:
 *                 type: string
 *                 enum: [CPF, CNPJ]
 *                 example: "CPF"
 *               senha:
 *                 type: string
 *                 example: "novasenha123"
 *               fk_associacao:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Vendedor atualizado com sucesso
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Vendedor não encontrado
 */
router.put('/:id', updateVendedor);

/**
 * @swagger
 * /vendedor/{id}:
 *   delete:
 *     summary: Deleta um vendedor pelo ID
 *     tags: [Vendedor]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do vendedor
 *     responses:
 *       204:
 *         description: Vendedor deletado com sucesso
 *       404:
 *         description: Vendedor não encontrado
 */
router.delete('/:id', deleteVendedor); 
export default router;
