import { Request, Response } from 'express';
import prisma from '../../config/dbConfig';
import { feira } from '@prisma/client';

// Buscar todas as feiras
export const getFeiras = async (req: Request, res: Response): Promise<void> => {
  try {
    const feiras: feira[] = await prisma.feira.findMany();
    console.log("Feiras entrando no banco de dados");
    res.json(feiras);
  } catch (error) {
    console.error('Erro ao buscar feiras:', error);
    res.status(500).send('Erro ao buscar feiras');
  }
};

// Buscar feira por ID
export const getFeiraById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const feira = await prisma.feira.findUnique({
      where: { id_feira: parseInt(id) },
    });

    if (!feira) {
      res.status(404).send('Feira não encontrada');
    }

    res.json(feira);
  } catch (error) {
    console.error('Erro ao buscar feira:', error);
    res.status(500).send('Erro ao buscar feira');
  }
};

// Criar nova feira
export const createFeira = async (req: Request, res: Response): Promise<void> => {
  const { nome, endereco } = req.body;
  try {
    const novaFeira = await prisma.feira.create({
      data: { nome, endereco },
    });

    res.status(201).json(novaFeira);
  } catch (error) {
    console.error('Erro ao criar feira:', error);
    res.status(500).send('Erro ao criar feira');
  }
};

// Atualizar feira
export const updateFeira = async (req: Request, res: Response): Promise<void> => {
  const { id_feira, nome, endereco } = req.body;
  try {
    const feiraAtualizada = await prisma.feira.update({
      where: { id_feira: parseInt(id_feira) },
      data: { nome, endereco },
    });

    res.json(feiraAtualizada);
  } catch (error) {
    console.error('Erro ao atualizar feira:', error);
    res.status(500).send('Erro ao atualizar feira');
  }
};

// Deletar feira
export const deleteFeira = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const feiraDeletada = await prisma.feira.delete({
      where: { id_feira: parseInt(id) },
    });

    res.json(feiraDeletada);
  } catch (error) {
    console.error('Erro ao deletar feira:', error);
    res.status(500).send('Erro ao deletar feira');
  }
};

export default {
  getFeiras,
  getFeiraById,
  createFeira,
  updateFeira,
  deleteFeira,
};
