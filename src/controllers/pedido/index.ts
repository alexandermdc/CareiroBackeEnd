import { Request, Response } from 'express';
import prisma from '../../config/dbConfig';
import { pedido } from '@prisma/client';

// GET: Buscar todos os pedidos
export const getPedidos = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("aqui no pedido");
    const pedidos: pedido[] = await prisma.pedido.findMany({
      include: {
        cliente: true,
        feira: true,
        atende_um: true,
        produto: true
      }
    });
    res.json(pedidos);
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    res.status(500).send('Erro ao buscar pedidos');
  }
};

// GET: Buscar pedido por ID
export const getPedidoById = async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id);
  try {
    const pedido: pedido | null = await prisma.pedido.findUnique({
      where: { pedido_id: id },
      include: {
        cliente: true,
        feira: true,
        atende_um: true,
        produto: true
      }
    });

    if (!pedido) {
      res.status(404).send('Pedido não encontrado');
    }

    res.json(pedido);
  } catch (error) {
    console.error('Erro ao buscar pedido:', error);
    res.status(500).send('Erro ao buscar pedido');
  }
};

// POST: Criar novo pedido com produtos
export const createPedido = async (req: Request, res: Response): Promise<void> => {
  const { data_pedido, fk_feira, produtos } = req.body;
  // Use fk_cliente vindo do token se disponível (fonte confiável)
  const fk_cliente = (req as any).user?.email || (req as any).user?.cpf || req.body.fk_cliente;

  try {
    const novoPedido: pedido = await prisma.pedido.create({
      data: {
        data_pedido: new Date(data_pedido),
        fk_feira,
        fk_cliente,
        produto: {
          connect: produtos.map((produtoId: number) => ({ id_produto: produtoId }))
        }
      },
      include: {
        produto: true
      }
    });

    res.status(201).json(novoPedido);
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    res.status(500).send('Erro ao criar pedido');
  }
};

// PUT: Atualizar pedido
export const updatePedido = async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id);
  const { data_pedido, fk_feira, fk_cliente, produtos } = req.body;

  try {
    const pedidoAtualizado: pedido = await prisma.pedido.update({
      where: { pedido_id: id },
      data: {
        data_pedido: new Date(data_pedido),
        fk_feira,
        fk_cliente,
        produto: {
          set: produtos.map((produtoId: number) => ({ id_produto: produtoId }))
        }
      },
      include: {
        produto: true
      }
    });

    res.json(pedidoAtualizado);
  } catch (error) {
    console.error('Erro ao atualizar pedido:', error);
    res.status(500).send('Erro ao atualizar pedido');
  }
};

// DELETE: Deletar pedido
export const deletePedido = async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id);
  try {
    const pedidoDeletado: pedido | null = await prisma.pedido.delete({
      where: { pedido_id: id }
    });

    res.json(pedidoDeletado);
  } catch (error) {
    console.error('Erro ao deletar pedido:', error);
    res.status(500).send('Erro ao deletar pedido');
  }
};

export default {
  getPedidos,
  getPedidoById,
  createPedido,
  updatePedido,
  deletePedido
};
