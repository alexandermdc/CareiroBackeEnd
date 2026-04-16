import { Request, Response } from 'express';
import prisma from '../../config/dbConfig';
import { pedido } from '@prisma/client';

const parseBoolean = (value: unknown, fallback?: boolean): boolean | undefined => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  const normalized = String(value).trim().toLowerCase();

  if (['true', '1', 'yes', 'sim', 'on'].includes(normalized)) {
    return true;
  }

  if (['false', '0', 'no', 'nao', 'não', 'off'].includes(normalized)) {
    return false;
  }

  return fallback;
};

// GET: Buscar pedidos do usuário autenticado
export const getPedidos = async (req: Request, res: Response): Promise<void> => {
  try {
    const userCpf = (req as any).user?.cpf;
    
    if (!userCpf) {
      res.status(401).json({ error: 'Usuário não identificado ou CPF não disponível' });
      return;
    }

    console.log("Buscando pedidos para cliente CPF:", userCpf);
    const pedidos = await prisma.pedido.findMany({
      where: {
        fk_cliente: userCpf
      },
      include: {
        cliente: true,
        feira: true,
        associacao_retirada: true,
        atende_um: true,
        produtos_no_pedido: {
          include: {
            produto: {
              include: {
                vendedor: {
                  select: {
                    id_vendedor: true,
                    nome: true,
                    telefone: true
                  }
                },
                categoria: true
              }
            }
          }
        }
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
  const userCpf = (req as any).user?.cpf;
  
  if (!userCpf) {
    res.status(401).json({ error: 'Usuário não identificado ou CPF não disponível' });
    return;
  }

  try {
    const pedido = await prisma.pedido.findUnique({
      where: { pedido_id: id },
      include: {
        cliente: true,
        feira: true,
        associacao_retirada: true,
        atende_um: true,
        produtos_no_pedido: {
          include: {
            produto: {
              include: {
                vendedor: {
                  select: {
                    id_vendedor: true,
                    nome: true,
                    telefone: true,
                    endereco_venda: true
                  }
                },
                categoria: true
              }
            }
          }
        }
      }
    });

    if (!pedido) {
      res.status(404).json({ error: 'Pedido não encontrado' });
      return;
    }

    // Verificar se o pedido pertence ao usuário autenticado
    if (pedido.fk_cliente !== userCpf) {
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
// POST: Criar novo pedido com produtos
export const createPedido = async (req: Request, res: Response): Promise<void> => {
  // produtos deve ser um array: [{ produto_id: number, quantidade: number }, ...]
  const { data_pedido, fk_feira, produtos, cpf_cliente, fk_associacao_retirada } = req.body;
  
  const user = (req as any).user;
  
  // Determinar o CPF do cliente
  let fk_cliente: string;
  
  if (user?.tipo === 'CLIENTE') {
    // Cliente faz pedido para si mesmo
    fk_cliente = user.cpf;
  } else if (user?.tipo === 'VENDEDOR') {
    // Vendedor deve informar cpf_cliente (pode ser ele mesmo se também for cliente)
    if (!cpf_cliente) {
      res.status(400).json({ 
        error: 'Vendedores devem informar o cpf_cliente no body da requisição.' 
      });
      return;
    }
    fk_cliente = cpf_cliente;
  } else {
    res.status(403).json({ error: 'Usuário sem permissão para criar pedidos' });
    return;
  }
  
  console.log('📦 Criando pedido para cliente CPF:', fk_cliente, '| Usuário logado:', user?.tipo);
  
  if (!produtos || !Array.isArray(produtos) || produtos.length === 0) {
    res.status(400).json({ error: 'A lista de produtos não pode estar vazia' });
    return;
  }
  try {
    let associacaoRetiradaValida: string | null = null;

    if (fk_associacao_retirada) {
      const associacaoRetirada = await prisma.associacao.findUnique({
        where: { id_associacao: fk_associacao_retirada },
        select: {
          id_associacao: true,
          disponivel_retirada: true,
        }
      });

      if (!associacaoRetirada) {
        res.status(404).json({ error: 'Associação de retirada não encontrada' });
        return;
      }

      if (!associacaoRetirada.disponivel_retirada) {
        res.status(400).json({ error: 'A associação selecionada não está disponível para retirada' });
        return;
      }

      associacaoRetiradaValida = associacaoRetirada.id_associacao;
    }

    // Se o usuário é VENDEDOR, verificar se ele não está tentando comprar seus próprios produtos
    if (user?.tipo === 'VENDEDOR' && user?.id_vendedor) {
      const produtoIds = produtos.map((p: any) => p.produto_id || p.id_produto);
      
      const produtosDoVendedor = await prisma.produto.findMany({
        where: {
          id_produto: { in: produtoIds },
          fk_vendedor: user.id_vendedor
        },
        select: {
          id_produto: true,
          nome: true
        }
      });

      if (produtosDoVendedor.length > 0) {
        const nomesProdutos = produtosDoVendedor.map(p => p.nome).join(', ');
        res.status(400).json({ 
          error: `Vendedores não podem comprar seus próprios produtos: ${nomesProdutos}` 
        });
        return;
      }
    }

    // Usar uma transação para garantir a integridade dos dados
    const novoPedidoComItens = await prisma.$transaction(async (tx) => {
      // 1. Criar o registro principal do pedido
      const novoPedido = await tx.pedido.create({
        data: {
          data_pedido: data_pedido ? new Date(data_pedido) : new Date(),
          fk_feira,
          fk_cliente,
          ...(associacaoRetiradaValida && { fk_associacao_retirada: associacaoRetiradaValida }),
        }
      });

      console.log('✅ Pedido criado:', novoPedido.pedido_id);

      // 2. Preparar os dados dos itens do pedido (tabela 'item_pedido')
      const itensDoPedidoData = produtos.map((produto: any) => {
        return {
          pedido_id: novoPedido.pedido_id,
          produto_id: produto.produto_id || produto.id_produto, // Aceita ambos
          quantidade: produto.quantidade,
        };
      });

      console.log('📦 Criando itens do pedido:', itensDoPedidoData);

      // 3. Inserir todos os itens do pedido de uma só vez (item_pedido)
      await tx.item_pedido.createMany({
        data: itensDoPedidoData,
      });

      console.log('✅ Itens do pedido criados');

      // 4. Retornar o pedido completo com seus itens para a resposta
      const pedidoCompleto = await tx.pedido.findUnique({
        where: { pedido_id: novoPedido.pedido_id },
        include: {
          produtos_no_pedido: {
            include: {
              produto: true
            }
          },
          cliente: true,
          feira: true,
          associacao_retirada: true,
        }
      });
      
      return pedidoCompleto;
    });

    res.status(201).json(novoPedidoComItens);

  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    res.status(500).send('Erro ao criar pedido');
  }
};
// PUT: Atualizar pedido (apenas do usuário autenticado)
export const updatePedido = async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id);
  const { data_pedido, fk_feira, fk_associacao_retirada } = req.body;
  const userCpf = (req as any).user?.cpf;
  
  if (!userCpf) {
    res.status(401).json({ error: 'Usuário não identificado ou CPF não disponível' });
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

    if (pedidoExistente.fk_cliente !== userCpf) {
      res.status(403).json({ error: 'Acesso negado - você não pode atualizar este pedido' });
      return;
    }

    if (fk_associacao_retirada !== undefined && fk_associacao_retirada !== null && fk_associacao_retirada !== '') {
      const associacaoRetirada = await prisma.associacao.findUnique({
        where: { id_associacao: fk_associacao_retirada },
        select: {
          id_associacao: true,
          disponivel_retirada: true,
        }
      });

      if (!associacaoRetirada) {
        res.status(404).json({ error: 'Associação de retirada não encontrada' });
        return;
      }

      if (!associacaoRetirada.disponivel_retirada) {
        res.status(400).json({ error: 'A associação selecionada não está disponível para retirada' });
        return;
      }
    }

    const pedidoAtualizado: pedido = await prisma.pedido.update({
      where: { pedido_id: id },
      data: {
        data_pedido: data_pedido ? new Date(data_pedido) : undefined,
        fk_feira: fk_feira || undefined,
        ...(fk_associacao_retirada !== undefined && { fk_associacao_retirada: fk_associacao_retirada || null }),
        // Não permitir mudança de cliente
        fk_cliente: pedidoExistente.fk_cliente,
      },
      include: {
        cliente: true,
        feira: true,
        associacao_retirada: true,
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
  const userCpf = (req as any).user?.cpf;
  
  if (!userCpf) {
    res.status(401).json({ error: 'Usuário não identificado ou CPF não disponível' });
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

    if (pedidoExistente.fk_cliente !== userCpf) {
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

// GET: Listar pedidos por status (ex.: PAGO) - inclui informações do cliente e itens
export const getPedidosPorStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const statusQuery = (req.query.status as string) || 'PAGO';
    const page = req.query.page ? Math.max(1, parseInt(req.query.page as string, 10) || 1) : 1;
    const limit = req.query.limit ? Math.max(1, parseInt(req.query.limit as string, 10) || 25) : 25;
    const skip = (page - 1) * limit;

    const where: any = { status: statusQuery };

    const [total, pedidos] = await Promise.all([
      prisma.pedido.count({ where }),
      prisma.pedido.findMany({
        where,
        skip,
        take: limit,
        orderBy: { pedido_id: 'desc' },
        include: {
          cliente: true,
          feira: true,
          associacao_retirada: true,
          produtos_no_pedido: {
            include: {
              produto: {
                include: {
                  vendedor: {
                    select: {
                      id_vendedor: true,
                      nome: true,
                      telefone: true
                    }
                  }
                }
              }
            }
          }
        }
      })
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    res.json({
      data: pedidos,
      meta: {
        total,
        page,
        limit,
        totalPages
      }
    });
  } catch (error) {
    console.error('Erro ao listar pedidos por status:', error);
    res.status(500).send('Erro ao listar pedidos por status');
  }
};

// GET: Buscar pedido pelo mercadopago_payment_id
export const getPedidoPorMercadoPagoId = async (req: Request, res: Response): Promise<void> => {
  const paymentId = req.params.paymentId;

  if (!paymentId) {
    res.status(400).json({ error: 'Parâmetro paymentId é obrigatório' });
    return;
  }

  try {
    const pedido = await prisma.pedido.findUnique({
      where: { mercadopago_payment_id: paymentId },
      include: {
        cliente: true,
        associacao_retirada: true,
        produtos_no_pedido: {
          include: {
            produto: {
              include: {
                vendedor: {
                  select: {
                    id_vendedor: true,
                    nome: true,
                    telefone: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!pedido) {
      res.status(404).json({ error: 'Pedido não encontrado para o paymentId informado' });
      return;
    }

    res.json(pedido);
  } catch (error) {
    console.error('Erro ao buscar pedido por mercadopago id:', error);
    res.status(500).send('Erro ao buscar pedido por mercadopago id');
  }
};

// GET (admin): listar pedidos com payer_email e vendedores envolvidos
export const getPedidosAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const statusQuery = (req.query.status as string) || undefined;
    const payerEmailQuery = (req.query.payer_email as string) || undefined;
    const page = req.query.page ? Math.max(1, parseInt(req.query.page as string, 10) || 1) : 1;
    const limit = req.query.limit ? Math.max(1, parseInt(req.query.limit as string, 10) || 25) : 25;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (statusQuery) where.status = statusQuery;
    if (payerEmailQuery) where.payer_email = payerEmailQuery;

    const [total, pedidos] = await Promise.all([
      prisma.pedido.count({ where }),
      prisma.pedido.findMany({
        where,
        skip,
        take: limit,
        orderBy: { pedido_id: 'desc' },
        include: {
          cliente: true,
          feira: true,
          associacao_retirada: true,
          produtos_no_pedido: {
            include: {
              produto: {
                include: {
                  vendedor: true
                }
              }
            }
          }
        }
      })
    ]);

    // Agregar vendedores por pedido
    const data = pedidos.map((p) => {
      const vendedoresMap: Record<string, any> = {};
      (p.produtos_no_pedido || []).forEach((item: any) => {
        const v = item.produto?.vendedor;
        if (v && v.id_vendedor) vendedoresMap[v.id_vendedor] = { id_vendedor: v.id_vendedor, nome: v.nome, telefone: v.telefone };
      });

      const vendedores = Object.values(vendedoresMap);

      const total_itens = (p.produtos_no_pedido || []).reduce((acumulado: number, item: any) => {
        return acumulado + (item.quantidade || 0);
      }, 0);

      const valor_total_calculado = (p.produtos_no_pedido || []).reduce((acumulado: number, item: any) => {
        const preco = item.produto?.preco || 0;
        const quantidade = item.quantidade || 0;
        return acumulado + (preco * quantidade);
      }, 0);

      const pago = String(p.status || '').toUpperCase() === 'PAGO';

      return {
        pedido_id: p.pedido_id,
        data_pedido: p.data_pedido,
        status: p.status,
        pago,
        mercadopago_payment_id: p.mercadopago_payment_id,
        payer_email: p.payer_email,
        fk_cliente: p.fk_cliente,
        fk_associacao_retirada: p.fk_associacao_retirada,
        associacao_retirada: p.associacao_retirada,
        feira: p.feira,
        total_itens,
        valor_total_calculado,
        cliente: p.cliente,
        vendedores,
        produtos_no_pedido: p.produtos_no_pedido
      };
    });

    const totalPages = Math.ceil(total / limit) || 1;
    res.json({ data, meta: { total, page, limit, totalPages } });
  } catch (error) {
    console.error('Erro em getPedidosAdmin:', error);
    res.status(500).send('Erro ao listar pedidos (admin)');
  }
};
