import { Router } from "express";
import { login, loginVendedor } from "../../controllers/auth/authController";

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
 * /auth/login/vendedor:
 *   post:
 *     summary: Realiza login do vendedor
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_vendedor
 *               - senha
 *             properties:
 *               id_vendedor:
 *                 type: string
 *                 format: uuid
 *                 example: "7c9e6679-7425-40de-944b-e07fc1f90ae7"
 *               senha:
 *                 type: string
 *                 example: senha123
 *     responses:
 *       200:
 *         description: Login de vendedor bem-sucedido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *                 expiresIn:
 *                   type: string
 *                 vendedor:
 *                   type: object
 *                   properties:
 *                     id_vendedor:
 *                       type: string
 *                     nome:
 *                       type: string
 *                     telefone:
 *                       type: string
 *                     tipo_vendedor:
 *                       type: string
 *                     associacao:
 *                       type: object
 *                       nullable: true
 *       401:
 *         description: Credenciais inválidas
 */
router.post("/login/vendedor", loginVendedor);

export default router;
