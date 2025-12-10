import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error stack:', err.stack);

  // Erro de validação do Prisma
  if (err.code === 'P2002') {
    return res.status(409).json({
      error: 'Conflito: Dados já existem',
      message: 'Um registro com esses dados já existe no sistema'
    });
  }

  // Erro de registro não encontrado do Prisma
  if (err.code === 'P2025') {
    return res.status(404).json({
      error: 'Não encontrado',
      message: 'O registro solicitado não foi encontrado'
    });
  }

  // Erro de token JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Token inválido',
      message: 'O token fornecido é inválido'
    });
  }

  // Erro de token expirado
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expirado',
      message: 'O token fornecido está expirado'
    });
  }

  // Erro de validação
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Dados inválidos',
      message: err.message
    });
  }

  // Erro padrão
  return res.status(500).json({
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado'
  });
};

export default errorHandler;