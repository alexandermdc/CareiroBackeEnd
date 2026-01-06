import { Router } from "express";
import { login, loginVendedor, loginCliente, registrarCliente, registrarVendedor } from "./controllers";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Autenticação
 *   description: Endpoints de login e autenticação
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Realiza login do usuário
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - senha
 *             properties:
 *               email:
 *                 type: string
 *                 example: usuario@email.com
 *               senha:
 *                 type: string
 *                 example: senha123
 *     responses:
 *       200:
 *         description: Login bem-sucedido com tokens JWT
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR...
 *                 refreshToken:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR...
 *                 expiresIn:
 *                   type: string
 *                   example: "1h"
 *                 cliente:
 *                   type: object
 *                   properties:
 *                     cpf:
 *                       type: string
 *                       example: "12345678900"
 *                     nome:
 *                       type: string
 *                       example: "João Silva"
 *                     email:
 *                       type: string
 *                       example: "joao@email.com"
 *       401:
 *         description: Credenciais inválidas
 */
router.post("/login", login);

/**
 * @swagger
 * /auth/login/cliente:
 *   post:
 *     summary: Realiza login específico de cliente
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - senha
 *             properties:
 *               email:
 *                 type: string
 *                 example: cliente@email.com
 *               senha:
 *                 type: string
 *                 example: senha123
 *     responses:
 *       200:
 *         description: Login de cliente bem-sucedido
 *       401:
 *         description: Credenciais inválidas
 */
router.post("/login/cliente", loginCliente);

/**
 * @swagger
 * /auth/login/vendedor:
 *   post:
 *     summary: Realiza login específico de vendedor
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - senha
 *             properties:
 *               email:
 *                 type: string
 *                 example: vendedor@email.com
 *               senha:
 *                 type: string
 *                 example: senha123
 *     responses:
 *       200:
 *         description: Login de vendedor bem-sucedido
 *       401:
 *         description: Credenciais inválidas
 */
router.post("/login/vendedor", loginVendedor);

/**
 * Rotas de registro
 */
router.post("/registrar/cliente", registrarCliente);
router.post("/registrar/vendedor", registrarVendedor);

export default router;
