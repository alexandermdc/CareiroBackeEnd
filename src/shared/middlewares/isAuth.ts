import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../../resources/auth/jwt';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const isAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token não fornecido' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);

  if (!payload) {
    res.status(403).json({ error: 'Token inválido ou expirado' });
    return;
  }

  req.user = payload;
  next();
};

// ✅ Middleware: só permite CLIENTES
export const isCliente = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Usuário não autenticado' });
    return;
  }

  if (req.user.tipo !== 'CLIENTE') {
    res.status(403).json({ error: 'Acesso negado. Apenas clientes podem acessar esta rota' });
    return;
  }

  next();
};

// ✅ Middleware: só permite VENDEDORES
export const isVendedor = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Usuário não autenticado' });
    return;
  }

  if (req.user.tipo !== 'VENDEDOR') {
    res.status(403).json({ error: 'Acesso negado. Apenas vendedores podem acessar esta rota' });
    return;
  }

  next();
};

// ✅ Middleware: só permite ADMINS
export const isAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Usuário não autenticado' });
    return;
  }

  if (req.user.tipo !== 'ADMIN') {
    res.status(403).json({ error: 'Acesso negado. Apenas administradores podem acessar esta rota' });
    return;
  }

  next();
};

// ✅ Middleware: permite VENDEDOR ou ADMIN
export const isVendedorOrAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Usuário não autenticado' });
    return;
  }

  if (req.user.tipo !== 'VENDEDOR' && req.user.tipo !== 'ADMIN') {
    res.status(403).json({ error: 'Acesso negado. Apenas vendedores ou administradores podem acessar' });
    return;
  }

  next();
};

export default isAuth;
