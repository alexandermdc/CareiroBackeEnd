import { Request, Response, NextFunction } from "express";
import prisma from "../../config/dbConfig";
import { gerarToken, gerarRefreshToken, verifyRefreshToken } from "./jwt";

// Armazenar refresh tokens válidos (em produção, use Redis ou banco de dados)
const refreshTokens: Set<string> = new Set();

export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      res.status(401).json({ error: 'Refresh token não fornecido' });
      return;
    }

    // Verificar se o refresh token está na lista de tokens válidos
    if (!refreshTokens.has(token)) {
      res.status(403).json({ error: 'Refresh token inválido' });
      return;
    }

    // Verificar se o refresh token é válido
    const payload = verifyRefreshToken(token);
    if (!payload) {
      // Remove o token inválido da lista
      refreshTokens.delete(token);
      res.status(403).json({ error: 'Refresh token expirado ou inválido' });
      return;
    }

    // Verificar se o usuário ainda existe no banco
    const cliente = await prisma.cliente.findUnique({ 
      where: { email: payload.email } 
    });

    if (!cliente) {
      refreshTokens.delete(token);
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    // Gerar novos tokens
    const tokenPayload = { cpf: cliente.cpf, email: cliente.email };
    const newAccessToken = gerarToken(tokenPayload);
    const newRefreshToken = gerarRefreshToken(tokenPayload);

    // Remover o refresh token antigo e adicionar o novo
    refreshTokens.delete(token);
    refreshTokens.add(newRefreshToken);

    res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: '1h'
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;

    if (token) {
      // Remove o refresh token da lista de tokens válidos
      refreshTokens.delete(token);
    }

    res.status(200).json({ message: 'Logout realizado com sucesso' });
  } catch (error) {
    next(error);
  }
};

// Função auxiliar para adicionar refresh token (usado no login)
export const addRefreshToken = (token: string): void => {
  refreshTokens.add(token);
};

// Função auxiliar para limpar tokens expirados (pode ser executada periodicamente)
export const cleanExpiredTokens = (): void => {
  refreshTokens.forEach(token => {
    const payload = verifyRefreshToken(token);
    if (!payload) {
      refreshTokens.delete(token);
    }
  });
};

export default {
  refreshToken,
  logout,
  addRefreshToken,
  cleanExpiredTokens
};
