import { Request, Response } from 'express';
import prisma from '../../config/dbConfig';
import { categoria } from '@prisma/client';

// Listar todas as categorias
export const getCategorias = async (req: Request, res: Response) => {
  try {
    const hasLimit = req.query.limit !== undefined;
    const limit = hasLimit ? Math.min(parseInt(req.query.limit as string) || 50, 100) : 50;
    const skip = parseInt(req.query.offset as string) || 0;
    
    const [categorias, total] = await Promise.all([
      prisma.categoria.findMany({
        take: limit,
        skip: skip,
        orderBy: {
          nome: 'asc',
        },
      }),
      prisma.categoria.count()
    ]);
    
    console.log(`📋 ${categorias.length}/${total} categorias encontradas`);
    
    // Retorna novo formato apenas se ?limit foi passado, caso contrário mantém compatibilidade
    if (hasLimit) {
      res.json({ data: categorias, total, limit, skip });
    } else {
      res.json(categorias);
    }
  } catch (error) {
    console.error('❌ Erro ao buscar categorias:', error);
    res.status(500).json({ error: 'Erro ao buscar categorias' });
  }
};

// Buscar categoria por ID
export const getCategoriaById = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    const categoria: categoria | null = await prisma.categoria.findUnique({
      where: {
        id_categoria: id,
      },
    });

    if (categoria) {
      res.json(categoria);
    } else {
      res.status(404).json({ error: 'Categoria não encontrada' });
    }
  } catch (error) {
    console.error('❌ Erro ao buscar categoria:', error);
    res.status(500).json({ error: 'Erro ao buscar categoria' });
  }
};

// Criar nova categoria
export const createCategoria = async (req: Request, res: Response): Promise<void> => {
  const { nome }: { nome: string } = req.body;

  if (!nome || nome.trim() === '') {
    res.status(400).json({ error: 'Nome da categoria é obrigatório' });
    return;
  }

  try {
    const categoria: categoria = await prisma.categoria.create({
      data: {
        nome: nome.trim(),
      },
    });

    console.log(`✅ Categoria criada: ${categoria.nome} (${categoria.id_categoria})`);
    res.status(201).json(categoria);
  } catch (error) {
    console.error('❌ Erro ao criar categoria:', error);
    res.status(500).json({ error: 'Erro ao criar categoria' });
  }
};

export default {
  getCategorias,
  getCategoriaById,
  createCategoria,
};
