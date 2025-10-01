import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

// Middleware para verificar erros de validação
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Dados inválidos',
      details: errors.array()
    });
  }
  next();
};

// Validações para cliente
export const validateCliente = [
  body('cpf')
    .isLength({ min: 11, max: 11 })
    .withMessage('CPF deve ter exatamente 11 dígitos')
    .isNumeric()
    .withMessage('CPF deve conter apenas números'),
  body('nome')
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres')
    .trim(),
  body('email')
    .isEmail()
    .withMessage('Email deve ter um formato válido')
    .normalizeEmail(),
  body('telefone')
    .isLength({ min: 10, max: 15 })
    .withMessage('Telefone deve ter entre 10 e 15 dígitos')
    .isNumeric()
    .withMessage('Telefone deve conter apenas números'),
  body('senha')
    .isLength({ min: 6 })
    .withMessage('Senha deve ter pelo menos 6 caracteres'),
  handleValidationErrors
];

// Validações para vendedor
export const validateVendedor = [
  body('nome')
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres')
    .trim(),
  body('telefone')
    .isLength({ min: 10, max: 15 })
    .withMessage('Telefone deve ter entre 10 e 15 dígitos')
    .isNumeric()
    .withMessage('Telefone deve conter apenas números'),
  body('endereco_venda')
    .isLength({ min: 5, max: 200 })
    .withMessage('Endereço de venda deve ter entre 5 e 200 caracteres')
    .trim(),
  body('tipo_vendedor')
    .isIn(['Autônomo', 'Associado'])
    .withMessage('Tipo de vendedor deve ser "Autônomo" ou "Associado"'),
  body('tipo_documento')
    .isIn(['CPF', 'CNPJ'])
    .withMessage('Tipo de documento deve ser "CPF" ou "CNPJ"'),
  body('senha')
    .isLength({ min: 6 })
    .withMessage('Senha deve ter pelo menos 6 caracteres'),
  handleValidationErrors
];

// Validações para produto
export const validateProduto = [
  body('nome')
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome do produto deve ter entre 2 e 100 caracteres')
    .trim(),
  body('preco')
    .isFloat({ min: 0.01 })
    .withMessage('Preço deve ser um número maior que 0'),
  body('descricao')
    .isLength({ min: 5, max: 500 })
    .withMessage('Descrição deve ter entre 5 e 500 caracteres')
    .trim(),
  body('disponivel')
    .isBoolean()
    .withMessage('Disponível deve ser verdadeiro ou falso'),
  body('fk_vendedor')
    .isUUID()
    .withMessage('ID do vendedor deve ser um UUID válido'),
  handleValidationErrors
];

// Validações para login
export const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Email deve ter um formato válido')
    .normalizeEmail(),
  body('senha')
    .isLength({ min: 1 })
    .withMessage('Senha é obrigatória'),
  handleValidationErrors
];

export default {
  validateCliente,
  validateVendedor,
  validateProduto,
  validateLogin,
  handleValidationErrors
};