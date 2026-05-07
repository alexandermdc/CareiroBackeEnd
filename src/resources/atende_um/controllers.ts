import { Request, Response } from 'express';
import prisma from '../../config/dbConfig';
import { atende_um } from '@prisma/client';

export const getAtendeUm = async (req: Request, res: Response): Promise<void> => {
  try {
    const hasLimit = req.query.limit !== undefined;
    const limit = hasLimit ? Math.min(parseInt(req.query.limit as string) || 50, 100) : 50;
    const skip = parseInt(req.query.offset as string) || 0;

    const [dados, total] = await Promise.all([
      prisma.atende_um.findMany({
        take: limit,
        skip: skip,
        include: {
          pedido: true,
          vendedor: true
        }
      }),
      prisma.atende_um.count()
    ]);

    console.log(`📊 Atende_um: ${dados.length}/${total}`);
    // Retorna novo formato apenas se ?limit foi passado, caso contrário mantém compatibilidade
    if (hasLimit) {
      res.status(200).json({ data: dados, total, limit, skip });
    } else {
      res.status(200).json(dados);
    }
  } catch (error) {
    console.error('Erro ao buscar dados de atende_um:', error);
    res.status(500).json({ error: 'Erro ao buscar dados de atende_um' });
  }
};

export default {
  getAtendeUm,
};
