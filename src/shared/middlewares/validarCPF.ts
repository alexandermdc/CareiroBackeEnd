import { Request, Response, NextFunction } from 'express';
import { validarCPF } from '../utils/cpfValidator';

const isDevelopment = process.env.NODE_ENV !== 'production';

/**
 * Middleware para validar CPF nos parâmetros da rota
 * Uso: router.get('/clientes/:cpf', validarCPFParam, ...)
 */
export function validarCPFParam(req: Request, res: Response, next: NextFunction): void {
  const { cpf } = req.params;

  if (!cpf) {
    res.status(400).json({
      error: 'CPF não fornecido',
      message: 'O CPF é obrigatório'
    });
    return;
  }

  // Em desenvolvimento, aceita qualquer CPF
  if (isDevelopment) {
    next();
    return;
  }

  if (!validarCPF(cpf)) {
    res.status(400).json({
      error: 'CPF inválido',
      message: 'O CPF fornecido não é válido'
    });
    return;
  }

  next();
}

/**
 * Middleware para validar CPF no body da requisição
 * Uso: router.post('/clientes', validarCPFBody, ...)
 */
export function validarCPFBody(req: Request, res: Response, next: NextFunction): void {
  const { cpf } = req.body;

  if (!cpf) {
    res.status(400).json({
      error: 'CPF não fornecido',
      message: 'O CPF é obrigatório'
    });
    return;
  }

  // Em desenvolvimento, aceita qualquer CPF
  if (isDevelopment) {
    console.log(`🔧 [DEV] Validação de CPF desabilitada: ${cpf}`);
    next();
    return;
  }

  if (!validarCPF(cpf)) {
    res.status(400).json({
      error: 'CPF inválido',
      message: 'O CPF fornecido não é válido'
    });
    return;
  }

  next();
}
