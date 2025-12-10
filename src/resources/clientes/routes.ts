import express from 'express';
import {
  listarClientes,
  listarClientesPorId,
  criarCliente,
  atualizarCliente,
  deletarCliente,
  adicionarFavorito,
  listarFavoritos,
  removerFavorito
} from './controllers';
import isAuth from '../../shared/middlewares/isAuth';
import { validarCPFParam, validarCPFBody } from '../../shared/middlewares/validarCPF';
import { validarCPF } from '../../shared/utils/cpfValidator';

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
 * /clientes/validar-cpf/{cpf}:
 *   get:
 *     summary: Valida se um CPF é válido
 *     tags: [Clientes]
 *     parameters:
 *       - in: path
 *         name: cpf
 *         required: true
 *         schema:
 *           type: string
 *         description: CPF para validar (com ou sem formatação)
 *     responses:
 *       200:
 *         description: CPF válido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valido:
 *                   type: boolean
 *                   example: true
 *                 cpf:
 *                   type: string
 *                   example: "12345678909"
 *       400:
 *         description: CPF inválido
 */
router.get('/validar-cpf/:cpf', (req, res) => {
  const { cpf } = req.params;
  const valido = validarCPF(cpf);
  
  if (valido) {
    res.status(200).json({ 
      valido: true, 
      cpf: cpf.replace(/[^\d]/g, ''),
      message: 'CPF válido' 
    });
  } else {
    res.status(400).json({ 
      valido: false, 
      cpf,
      message: 'CPF inválido' 
    });
  }
});

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
router.get('/:cpf', validarCPFParam, listarClientesPorId);

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
router.post('/', validarCPFBody, criarCliente);

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
router.put('/:cpf', isAuth, validarCPFParam, atualizarCliente);

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
router.delete('/:cpf', isAuth, validarCPFParam, deletarCliente);

router.put("/:cpf/favoritos", isAuth, validarCPFParam, adicionarFavorito);

router.get("/:cpf/favoritos", isAuth, validarCPFParam, listarFavoritos);
// ✅ Adicionar produto aos favoritos
router.put("/:cpf/favoritos", isAuth, adicionarFavorito);

// ✅ Listar favoritos do cliente
router.get("/:cpf/favoritos", isAuth, listarFavoritos);

// ✅ Remover produto dos favoritos
router.delete("/:cpf/favoritos", isAuth, removerFavorito);

export default router;
