import { Request, Response, NextFunction } from 'express';

/**
 * Middleware para verificar se o usuário tem permissões administrativas
 * Por enquanto, qualquer usuário autenticado pode fazer operações administrativas
 * Em produção, isso deveria verificar roles/permissions específicas
 */
export const isAdmin = (req: Request, res: Response, next: NextFunction): void => {
  const user = (req as any).user;
  
  if (!user) {
    res.status(401).json({ error: 'Token não fornecido ou inválido' });
    return;
  }

  // TODO: Implementar verificação de roles quando o sistema de usuários for expandido
  // Por exemplo: if (user.role !== 'admin') { return res.status(403)... }
  
  // Por enquanto, qualquer usuário autenticado pode fazer operações admin
  // Isso deveria ser restrito em produção
  console.log(`[ADMIN] Operação administrativa realizada por: ${user.email || user.cpf}`);
  
  next();
};

/**
 * Middleware para verificar se o usuário pode acessar apenas seus próprios recursos
 */
export const canAccessResource = (resourceField: string = 'fk_cliente') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;
    const resourceOwner = req.body[resourceField] || req.params[resourceField];
    
    if (!user) {
      res.status(401).json({ error: 'Token não fornecido ou inválido' });
      return;
    }

    const userIdentifier = user.email || user.cpf;
    
    // Se não há owner específico no request, continua (será definido pelo controller)
    if (!resourceOwner) {
      next();
      return;
    }

    // Verifica se o usuário pode acessar o recurso
    if (resourceOwner !== userIdentifier) {
      res.status(403).json({ 
        error: 'Acesso negado - você não pode acessar este recurso' 
      });
      return;
    }

    next();
  };
};

export default {
  isAdmin,
  canAccessResource
};