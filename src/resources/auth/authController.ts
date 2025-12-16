import { Request, Response, NextFunction } from "express";
import prisma from "../../config/dbConfig";
import bcrypt from "bcrypt";
import { gerarToken, gerarRefreshToken } from "./jwt";
import { addRefreshToken } from "./refreshToken";

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      res.status(400).json({ error: 'Email e senha são obrigatórios' });
      return;
    }

    const cliente = await prisma.cliente.findUnique({ where: { email } });

    if (!cliente) {
      res.status(401).json({ error: 'Credenciais inválidas' });
      return;
    }

    const senhaCorreta = await bcrypt.compare(senha, cliente.senha);

    if (!senhaCorreta) {
      res.status(401).json({ error: 'Credenciais inválidas' });
      return;
    }

    const tokenPayload = { 
      cpf: cliente.cpf, 
      email: cliente.email,
      tipo: 'CLIENTE' as const
    };
    const accessToken = gerarToken(tokenPayload);
    const refreshToken = gerarRefreshToken(tokenPayload);

    // Adicionar refresh token à lista de tokens válidos
    addRefreshToken(refreshToken);

    res.status(200).json({
      token: accessToken,        // Nome padrão para frontend
      accessToken,               // Compatibilidade
      refreshToken,
      expiresIn: '1h',
      cliente: {
        cpf: cliente.cpf,
        nome: cliente.nome,
        email: cliente.email,
        tipo: 'CLIENTE'
      }
    });
  } catch (error) {
    next(error); // manda pro middleware de erro
  }
};

// 👨‍🌾 Login de Vendedor (por ID)
export const loginVendedor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id_vendedor, senha } = req.body;

    if (!id_vendedor || !senha) {
      res.status(400).json({ error: 'ID do vendedor e senha são obrigatórios' });
      return;
    }

    // Buscar vendedor pelo ID
    const vendedor = await prisma.vendedor.findUnique({ 
      where: { id_vendedor },
      include: {
        associacao: {
          select: {
            id_associacao: true,
            nome: true
          }
        }
      }
    });

    if (!vendedor) {
      res.status(401).json({ error: 'Credenciais inválidas' });
      return;
    }

    // Verificar senha
    const senhaCorreta = await bcrypt.compare(senha, vendedor.senha);

    if (!senhaCorreta) {
      res.status(401).json({ error: 'Credenciais inválidas' });
      return;
    }

    // Gerar tokens
    const tokenPayload = { 
      id_vendedor: vendedor.id_vendedor,
      nome: vendedor.nome,
      tipo: 'VENDEDOR' as const
    };
    const accessToken = gerarToken(tokenPayload);
    const refreshToken = gerarRefreshToken(tokenPayload);

    // Adicionar refresh token à lista
    addRefreshToken(refreshToken);

    console.log('✅ Login de vendedor realizado:', vendedor.nome);

    res.status(200).json({
      accessToken,
      refreshToken,
      expiresIn: '1h',
      vendedor: {
        id_vendedor: vendedor.id_vendedor,
        nome: vendedor.nome,
        telefone: vendedor.telefone,
        endereco_venda: vendedor.endereco_venda,
        tipo_vendedor: vendedor.tipo_vendedor,
        tipo_documento: vendedor.tipo_documento,
        numero_documento: vendedor.numero_documento,
        tipo: 'VENDEDOR',
        associacao: vendedor.associacao ? {
          id_associacao: vendedor.associacao.id_associacao,
          nome: vendedor.associacao.nome
        } : null
      }
    });
  } catch (error) {
    console.error('❌ Erro no login do vendedor:', error);
    next(error);
  }
};
