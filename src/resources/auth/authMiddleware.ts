import { Request, Response, NextFunction } from 'express';

// Extending the Request interface to include the 'user' property
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}
import { verifyToken } from './jwt';

export const autenticarToken = (req: Request, res: Response, next: NextFunction) => {
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