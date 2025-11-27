import { Request, Response } from 'express';
import prisma from '../../config/dbConfig';
import { vendedor } from '@prisma/client';

const bcrypt = require('bcrypt');
const saltRounds = 10;
// Função para obter todos os vendedores
export const getVendedores = async (req: Request, res: Response) => {
  try {
    const result: vendedor[] = await prisma.vendedor.findMany();
    console.log("aqui no vendedores");
    res.json(result);
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
  const { nome, tipo_vendedor, telefone, endereco_venda, tipo_documento, numero_documento, fk_associacao, senha } = req.body;

  try {
    const senha_segura = await bcrypt.hash(senha, saltRounds);

    const result = await prisma.vendedor.create({
      data: {
        id_vendedor: crypto.randomUUID(),
        nome,
        tipo_vendedor,
        telefone,
        endereco_venda,
        tipo_documento,
        numero_documento: numero_documento || null,
        fk_associacao: fk_associacao || null,
        senha: senha_segura
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
  const { nome, tipo_vendedor, telefone, endereco_venda, tipo_documento, numero_documento, fk_associacao, senha } = req.body;

  try {

    const senha_segura = await bcrypt.hash(senha, saltRounds);

    const result = await prisma.vendedor.update({
      where: { id_vendedor: id },
      data: {
        nome,
        tipo_vendedor,
        telefone,
        endereco_venda,
        tipo_documento,
        numero_documento,
        fk_associacao,
        senha:senha_segura
      },
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
