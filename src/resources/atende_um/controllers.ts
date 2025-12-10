import { Request, Response } from 'express';
import prisma from '../../config/dbConfig';
import { atende_um } from '@prisma/client';

export const getAtendeUm = async (req: Request, res: Response): Promise<void> => {
  try {
    const dados: atende_um[] = await prisma.atende_um.findMany({
      include: {
        pedido: true, // Certifique-se de que o relacionamento "pedido" existe no schema.prisma
        vendedor: true // Certifique-se de que o relacionamento "vendedor" existe no schema.prisma
      }
    });

    console.log("Dados de atende_um recuperados com sucesso");
    res.status(200).json(dados);
  } catch (error) {
    console.error('Erro ao buscar dados de atende_um:', error);
    res.status(500).json({ error: 'Erro ao buscar dados de atende_um' });
  }
};

export default {
  getAtendeUm,
};
