import { Request, Response } from 'express';
import prisma from '../../config/dbConfig';
import { pedido } from '@prisma/client';

// GET: Buscar pedidos do usuário autenticado
export const getPedidos = async (req: Request, res: Response): Promise<void> => {
  try {
    const userEmail = (req as any).user?.email;
    const userCpf = (req as any).user?.cpf;
    
    if (!userEmail && !userCpf) {
      res.status(401).json({ error: 'Usuário não identificado' });
      return;
    }

    console.log("Buscando pedidos para usuário:", userEmail || userCpf);
    const pedidos: pedido[] = await prisma.pedido.findMany({
      where: {
        fk_cliente: userEmail || userCpf
      },
      include: {
        cliente: true,
        feira: true,
        atende_um: true,
      }
    });
    res.json(pedidos);
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    res.status(500).send('Erro ao buscar pedidos');
  }
};

// GET: Buscar pedido por ID (apenas do usuário autenticado)
export const getPedidoById = async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id);
  const userEmail = (req as any).user?.email;
  const userCpf = (req as any).user?.cpf;
  
  if (!userEmail && !userCpf) {
    res.status(401).json({ error: 'Usuário não identificado' });
    return;
  }

  try {
    const pedido: pedido | null = await prisma.pedido.findUnique({
      where: { pedido_id: id },
      include: {
        cliente: true,
        feira: true,
        atende_um: true,
      }
    });

    if (!pedido) {
      res.status(404).json({ error: 'Pedido não encontrado' });
      return;
    }

    // Verificar se o pedido pertence ao usuário autenticado
    if (pedido.fk_cliente !== (userEmail || userCpf)) {
      res.status(403).json({ error: 'Acesso negado - este pedido não pertence a você' });
      return;
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
      },
      include: {
        
      }
    });

    res.status(201).json(novoPedido);
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    res.status(500).send('Erro ao criar pedido');
  }
};

// PUT: Atualizar pedido (apenas do usuário autenticado)
export const updatePedido = async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id);
  const { data_pedido, fk_feira } = req.body;
  const userEmail = (req as any).user?.email;
  const userCpf = (req as any).user?.cpf;
  
  if (!userEmail && !userCpf) {
    res.status(401).json({ error: 'Usuário não identificado' });
    return;
  }

  try {
    // Verificar se o pedido existe e pertence ao usuário
    const pedidoExistente = await prisma.pedido.findUnique({
      where: { pedido_id: id }
    });

    if (!pedidoExistente) {
      res.status(404).json({ error: 'Pedido não encontrado' });
      return;
    }

    if (pedidoExistente.fk_cliente !== (userEmail || userCpf)) {
      res.status(403).json({ error: 'Acesso negado - você não pode atualizar este pedido' });
      return;
    }

    const pedidoAtualizado: pedido = await prisma.pedido.update({
      where: { pedido_id: id },
      data: {
        data_pedido: data_pedido ? new Date(data_pedido) : undefined,
        fk_feira: fk_feira || undefined,
        // Não permitir mudança de cliente
        fk_cliente: pedidoExistente.fk_cliente,
      },
      include: {
        cliente: true,
        feira: true,
      }
    });

    res.json(pedidoAtualizado);
  } catch (error) {
    console.error('Erro ao atualizar pedido:', error);
    res.status(500).send('Erro ao atualizar pedido');
  }
};

// DELETE: Deletar pedido (apenas do usuário autenticado)
export const deletePedido = async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id);
  const userEmail = (req as any).user?.email;
  const userCpf = (req as any).user?.cpf;
  
  if (!userEmail && !userCpf) {
    res.status(401).json({ error: 'Usuário não identificado' });
    return;
  }

  try {
    // Verificar se o pedido existe e pertence ao usuário
    const pedidoExistente = await prisma.pedido.findUnique({
      where: { pedido_id: id }
    });

    if (!pedidoExistente) {
      res.status(404).json({ error: 'Pedido não encontrado' });
      return;
    }

    if (pedidoExistente.fk_cliente !== (userEmail || userCpf)) {
      res.status(403).json({ error: 'Acesso negado - você não pode deletar este pedido' });
      return;
    }

    const pedidoDeletado: pedido = await prisma.pedido.delete({
      where: { pedido_id: id }
    });

    res.json({ message: 'Pedido deletado com sucesso', pedido: pedidoDeletado });
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
