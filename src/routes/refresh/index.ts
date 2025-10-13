import { Router } from "express";
import { refreshToken, logout } from "../../controllers/auth/refreshToken";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Refresh Token
 *   description: Endpoints para refresh de tokens
 */

/**
 * @swagger
 * /refresh/token:
 *   post:
 *     summary: Renovar access token usando refresh token
 *     tags: [Refresh Token]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Token renovado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 refreshToken:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 expiresIn:
 *                   type: string
 *                   example: "1h"
 *       401:
 *         description: Refresh token não fornecido
 *       403:
 *         description: Refresh token inválido ou expirado
 *       404:
 *         description: Usuário não encontrado
 */
router.post("/token", refreshToken);

/**
 * @swagger
 * /refresh/logout:
 *   post:
 *     summary: Fazer logout e invalidar refresh token
 *     tags: [Refresh Token]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Logout realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Logout realizado com sucesso"
 */
router.post("/logout", logout);

export default router;
