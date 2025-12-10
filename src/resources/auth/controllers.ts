import { Request, Response, NextFunction } from "express";
import prisma from "../../config/dbConfig";
import bcrypt from "bcrypt";
import { gerarToken, gerarRefreshToken } from "./jwt";
import { addRefreshToken } from "./refreshToken";

/**
 * Login unificado - funciona para CLIENTE, VENDEDOR e ADMIN
 * Tenta buscar primeiro como cliente, depois como vendedor
 */
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      res.status(400).json({ error: 'Email e senha são obrigatórios' });
      return;
    }

    // Tentar buscar como cliente
    const cliente = await prisma.cliente.findUnique({ 
      where: { email }
    });

    if (cliente) {
      // Verificar senha
      const senhaCorreta = await bcrypt.compare(senha, cliente.senha);

      if (!senhaCorreta) {
        res.status(401).json({ error: 'Credenciais inválidas' });
        return;
      }

      // Preparar payload
      const tokenPayload = {
        cpf: cliente.cpf,
        email: cliente.email,
        tipo: cliente.tipo_usuario
      };

      // Gerar tokens
      const accessToken = gerarToken(tokenPayload);
      const refreshToken = gerarRefreshToken(tokenPayload);
      addRefreshToken(refreshToken);

      console.log(`✅ Login realizado: ${cliente.email} (${cliente.tipo_usuario})`);

      res.status(200).json({
        token: accessToken,
        accessToken,
        refreshToken,
        expiresIn: '1h',
        cliente: {
          cpf: cliente.cpf,
          nome: cliente.nome,
          email: cliente.email,
          telefone: cliente.telefone,
          tipo: cliente.tipo_usuario
        }
      });
      return;
    }

    // Se não achou como cliente, tentar como vendedor
    const vendedor = await prisma.vendedor.findUnique({
      where: { email },
      include: {
        associacao: {
          select: {
            id_associacao: true,
            nome: true
          }
        }
      }
    });

    if (vendedor) {
      // Verificar senha
      const senhaCorreta = await bcrypt.compare(senha, vendedor.senha);

      if (!senhaCorreta) {
        res.status(401).json({ error: 'Credenciais inválidas' });
        return;
      }

      // Preparar payload
      const tokenPayload = {
        id_vendedor: vendedor.id_vendedor,
        email: vendedor.email,
        tipo: vendedor.tipo_usuario
      };

      // Gerar tokens
      const accessToken = gerarToken(tokenPayload);
      const refreshToken = gerarRefreshToken(tokenPayload);
      addRefreshToken(refreshToken);

      console.log(`✅ Login realizado: ${vendedor.email} (${vendedor.tipo_usuario})`);

      res.status(200).json({
        token: accessToken,
        accessToken,
        refreshToken,
        expiresIn: '1h',
        vendedor: {
          id_vendedor: vendedor.id_vendedor,
          nome: vendedor.nome,
          email: vendedor.email,
          telefone: vendedor.telefone,
          endereco_venda: vendedor.endereco_venda,
          tipo_vendedor: vendedor.tipo_vendedor,
          tipo_documento: vendedor.tipo_documento,
          numero_documento: vendedor.numero_documento,
          associacao: vendedor.associacao,
          tipo: vendedor.tipo_usuario
        }
      });
      return;
    }

    // Não encontrou nem como cliente nem como vendedor
    res.status(401).json({ error: 'Credenciais inválidas' });

  } catch (error) {
    console.error('❌ Erro no login:', error);
    next(error);
  }
};

/**
 * Registro de novo CLIENTE
 */
export const registrarCliente = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { cpf, nome, email, telefone, senha } = req.body;

    // Validações
    if (!cpf || !nome || !email || !telefone || !senha) {
      res.status(400).json({ error: 'Todos os campos são obrigatórios' });
      return;
    }

    // Verificar se email já existe (em cliente ou vendedor)
    const [clienteExistente, vendedorExistente] = await Promise.all([
      prisma.cliente.findUnique({ where: { email } }),
      prisma.vendedor.findUnique({ where: { email } })
    ]);

    if (clienteExistente || vendedorExistente) {
      res.status(409).json({ error: 'Email já cadastrado' });
      return;
    }

    // Verificar se CPF já existe
    const cpfExistente = await prisma.cliente.findUnique({ where: { cpf } });
    if (cpfExistente) {
      res.status(409).json({ error: 'CPF já cadastrado' });
      return;
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 10);

    // Criar cliente
    const cliente = await prisma.cliente.create({
      data: {
        cpf,
        nome,
        email,
        telefone,
        senha: senhaHash,
        tipo_usuario: 'CLIENTE'
      }
    });

    console.log(`✅ Novo cliente cadastrado: ${email}`);

    res.status(201).json({
      message: 'Cliente cadastrado com sucesso',
      cliente: {
        cpf: cliente.cpf,
        nome: cliente.nome,
        email: cliente.email,
        telefone: cliente.telefone
      }
    });
  } catch (error) {
    console.error('❌ Erro ao registrar cliente:', error);
    next(error);
  }
};

/**
 * Registro de novo VENDEDOR (apenas admin pode criar)
 */
export const registrarVendedor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { 
      nome, 
      email, 
      senha, 
      telefone, 
      endereco_venda, 
      tipo_vendedor, 
      tipo_documento, 
      numero_documento,
      fk_associacao 
    } = req.body;

    // Validações
    if (!nome || !email || !senha || !telefone || !endereco_venda || !tipo_vendedor || !tipo_documento || !numero_documento) {
      res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos' });
      return;
    }

    // Verificar se email já existe (em cliente ou vendedor)
    const [clienteExistente, vendedorExistente] = await Promise.all([
      prisma.cliente.findUnique({ where: { email } }),
      prisma.vendedor.findUnique({ where: { email } })
    ]);

    if (clienteExistente || vendedorExistente) {
      res.status(409).json({ error: 'Email já cadastrado' });
      return;
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 10);

    // Criar vendedor
    const vendedor = await prisma.vendedor.create({
      data: {
        nome,
        email,
        telefone,
        endereco_venda,
        tipo_vendedor,
        tipo_documento,
        numero_documento,
        senha: senhaHash,
        tipo_usuario: 'VENDEDOR',
        fk_associacao: fk_associacao || null
      },
      include: {
        associacao: true
      }
    });

    console.log(`✅ Novo vendedor cadastrado: ${email}`);

    res.status(201).json({
      message: 'Vendedor cadastrado com sucesso',
      vendedor: {
        id_vendedor: vendedor.id_vendedor,
        nome: vendedor.nome,
        email: vendedor.email,
        telefone: vendedor.telefone,
        endereco_venda: vendedor.endereco_venda,
        tipo_vendedor: vendedor.tipo_vendedor
      }
    });
  } catch (error) {
    console.error('❌ Erro ao registrar vendedor:', error);
    next(error);
  }
};

export default {
  login,
  registrarCliente,
  registrarVendedor
};
