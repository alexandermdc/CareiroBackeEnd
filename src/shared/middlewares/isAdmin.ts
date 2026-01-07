import { Request, Response, NextFunction } from 'express';

/**
 * Middleware para verificar se o usuário é administrador
 * Permite acesso apenas aos emails cadastrados como admins
 */
export const isAdmin = (req: Request, res: Response, next: NextFunction): void => {
  // Pegar dados do usuário autenticado (vem do middleware isAuth)
  const userEmail = (req as any).user?.email || (req as any).cliente?.email;
  
  console.log('🔐 Verificando permissão de administrador para:', userEmail);
  
  // Lista de emails de administradores
  // IMPORTANTE: Em produção, busque essa lista do banco de dados
  const admins = [
    'admin@agriconect.com',
    'admin@agriconect.com.br',
    'getulio@agriconect.com',
    'adm@teste.com',
  ];

  if (!userEmail) {
    console.log('⚠️ Acesso negado: Usuário não autenticado');
    res.status(401).json({ 
      error: 'Não autenticado',
      mensagem: 'Faça login para continuar' 
    });
    return;
  }

  if (!admins.includes(userEmail)) {
    console.log(`⚠️ Acesso negado: ${userEmail} não é administrador`);
    res.status(403).json({ 
      error: 'Acesso negado',
      mensagem: 'Apenas administradores podem executar esta ação' 
    });
    return;
  }

  console.log(`✅ Acesso permitido: ${userEmail} é administrador`);
  next();
};
