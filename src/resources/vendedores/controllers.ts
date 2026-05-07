import { Request, Response } from 'express';
import prisma from '../../config/dbConfig';
import { vendedor } from '@prisma/client';

const bcrypt = require('bcrypt');
const saltRounds = 10;
// Função para obter todos os vendedores com paginação para evitar memory leak
export const getVendedores = async (req: Request, res: Response) => {
  try {
    const hasLimit = req.query.limit !== undefined;
    const limit = hasLimit ? Math.min(parseInt(req.query.limit as string) || 50, 100) : 50;
    const skip = parseInt(req.query.offset as string) || 0;
    
    const [result, total] = await Promise.all([
      prisma.vendedor.findMany({
        take: limit,
        skip: skip,
        select: {
          id_vendedor: true,
          nome: true,
          email: true,
          telefone: true,
          tipo_vendedor: true,
          tipo_usuario: true
        }
      }),
      prisma.vendedor.count()
    ]);
    
    console.log(`📊 Vendedores: ${result.length}/${total}`);
    // Retorna novo formato apenas se ?limit foi passado, caso contrário mantém compatibilidade
    if (hasLimit) {
      res.json({ data: result, total, limit, skip });
    } else {
      res.json(result);
    }
  } catch (error) {
    console.error('Erro ao buscar vendedores:', error);
    res.status(500).send('Erro ao buscar vendedores');
  }
};

// Função para obter um vendedor por ID
export const getVendedorById = async (req: Request, res: Response) => {
  const id = req.params.id;
  try {
    const result: vendedor | null = await prisma.vendedor.findUnique({
      where: { id_vendedor: id },
    });

    if (result) {
      res.json(result);
    } else {
      res.status(404).send('Vendedor não encontrado');
    }
  } catch (error) {
    console.error('Erro ao buscar vendedor:', error);
    res.status(500).send('Erro ao buscar vendedor');
  }
};

// Função para criar um novo vendedor
export const createVendedor = async (req: Request, res: Response) => {
  const { nome, email, tipo_vendedor, telefone, endereco_venda, tipo_documento, numero_documento, fk_associacao, senha, image } = req.body;

  try {
    // Validar campos obrigatórios
    if (!email) {
      res.status(400).json({ error: 'Email é obrigatório' });
      return;
    }

    if (!fk_associacao) {
      res.status(400).json({ error: 'Associação é obrigatória' });
      return;
    }

    const senha_segura = await bcrypt.hash(senha, saltRounds);

    const result = await prisma.vendedor.create({
      data: {
        id_vendedor: crypto.randomUUID(),
        nome,
        email,
        image: image || null,
        tipo_vendedor,
        telefone,
        endereco_venda,
        tipo_documento,
        numero_documento: numero_documento || null,
        fk_associacao,
        senha: senha_segura,
        tipo_usuario: 'VENDEDOR'
      },
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Erro ao criar vendedor:', error);
    res.status(500).send('Erro ao criar vendedor');
  }
};

// Função para atualizar um vendedor
export const updateVendedor = async (req: Request, res: Response) => {
  const id = req.params.id;
  const { nome, email, tipo_vendedor, telefone, endereco_venda, tipo_documento, numero_documento, fk_associacao, senha, image } = req.body;

  try {
    const dataToUpdate: any = {
      nome,
      tipo_vendedor,
      telefone,
      endereco_venda,
      tipo_documento,
      numero_documento,
      fk_associacao,
      image
    };

    // Adicionar email se fornecido
    if (email) {
      dataToUpdate.email = email;
    }

    // Apenas fazer hash da senha se ela for fornecida
    if (senha) {
      const senha_segura = await bcrypt.hash(senha, saltRounds);
      dataToUpdate.senha = senha_segura;
    }

    const result = await prisma.vendedor.update({
      where: { id_vendedor: id },
      data: dataToUpdate,
    });

    if (result) {
      res.json(result);
    } else {
      res.status(404).send('Vendedor não encontrado');
    }
  } catch (error) {
    console.error('Erro ao atualizar vendedor:', error);
    res.status(500).send('Erro ao atualizar vendedor');
  }
};

// Função para deletar um vendedor
export const deleteVendedor = async (req: Request, res: Response) => {
  const id = req.params.id;
  try {
    const result: vendedor | null = await prisma.vendedor.delete({
      where: { id_vendedor: id },
    });

    if (result) {
      res.json(result);
    } else {
      res.status(404).send('Vendedor não encontrado');
    }
  } catch (error) {
    console.error('Erro ao deletar vendedor:', error);
    res.status(500).send('Erro ao deletar vendedor');
  }
};

export default {
  getVendedores,
  getVendedorById,
  createVendedor,
  updateVendedor,
  deleteVendedor,
};
