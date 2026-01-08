import express from 'express';
import { servirImagem } from './controllers';

const router = express.Router();

/**
 * @swagger
 * /image-proxy:
 *   get:
 *     summary: Proxy para servir imagens do Supabase (resolve CORS)
 *     tags: [Utilidades]
 *     parameters:
 *       - in: query
 *         name: url
 *         required: true
 *         schema:
 *           type: string
 *         description: URL completa da imagem no Supabase
 *         example: https://tirewajbsbwnupzrfkbt.supabase.co/storage/v1/object/public/feiras/imagens/1767732767256-Feira_Polo2-5.jpeg
 *     responses:
 *       200:
 *         description: Imagem retornada com sucesso
 *         content:
 *           image/jpeg:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: URL não fornecida
 *       404:
 *         description: Imagem não encontrada
 */
router.get('/', servirImagem);

export default router;
