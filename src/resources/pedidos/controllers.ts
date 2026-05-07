import { Request, Response } from 'express';
import prisma from '../../config/dbConfig';
import { Prisma, pedido } from '@prisma/client';
import { CreatePedidoDTO, UpdatePedidoDTO } from './types';

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

const parseOptionalInt = (value: unknown): number | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;

  const parsed = Number(value);
  if (Number.isNaN(parsed)) return undefined;

  return parsed;
};

const isRetiradaRequest = (payload: any): boolean => {
  const forma = payload?.forma_entrega ?? payload?.formaEntrega ?? payload?.tipo_entrega ?? payload?.tipoEntrega ?? payload?.entrega;

  if (typeof forma === 'string') {
    const normalized = forma.trim().toLowerCase();
    if (normalized.includes('retirada')) {
      return true;
    }
  }

  return Boolean(payload?.fk_feira_retirada || payload?.fk_associacao_retirada);
};

const serializePedidoRetirada = (pedidoData: any) => {
  if (!pedidoData) return pedidoData;

  return {
    ...pedidoData,
    feira_retirada: pedidoData.feira_retirada
      ? {
          id_feira: pedidoData.feira_retirada.id_feira,
          nome: pedidoData.feira_retirada.nome,
          localizacao: pedidoData.feira_retirada.localizacao,
          data_hora: pedidoData.feira_retirada.data_hora,
        }
      : null,
  };
};

const serializePedidosRetirada = (pedidosData: any[]) => pedidosData.map(serializePedidoRetirada);

// GET: Buscar pedidos do usuário autenticado
export const getPedidos = async (req: Request, res: Response): Promise<void> => {
  try {
    const userCpf = (req as any).user?.cpf;
    const hasLimit = req.query.limit !== undefined;
    const limit = hasLimit ? Math.min(parseInt(req.query.limit as string) || 50, 100) : 50;
    const skip = parseInt(req.query.offset as string) || 0;
    
    if (!userCpf) {
      res.status(401).json({ error: 'Usuário não identificado ou CPF não disponível' });
      return;
    }

    console.log("Buscando pedidos para cliente CPF:", userCpf);
    const [pedidos, total] = await Promise.all([
      prisma.pedido.findMany({
        where: {
          fk_cliente: userCpf
        },
        take: limit,
        skip: skip,
        orderBy: {
          data_pedido: 'desc'
        },
        include: {
          cliente: true,
          feira: true,
          feira_retirada: true,
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
      }),
      prisma.pedido.count({
        where: {
          fk_cliente: userCpf
        }
      })
    ]);
    
    console.log(`📊 Pedidos: ${pedidos.length}/${total}`);
    const serializado = serializePedidosRetirada(pedidos);
    // Retorna novo formato apenas se ?limit foi passado, caso contrário mantém compatibilidade
    if (hasLimit) {
      res.json({ data: serializado, total, limit, skip });
    } else {
      res.json(serializado);
    }
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
        feira_retirada: true,
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

    res.json(serializePedidoRetirada(pedido));
  } catch (error) {
    console.error('Erro ao buscar pedido:', error);
    res.status(500).send('Erro ao buscar pedido');
  }
};

// GET: Buscar pedidos que contenham produtos de um vendedor específico
export const getPedidosByVendedor = async (req: Request, res: Response): Promise<void> => {
  const idVendedor = req.params.id_vendedor;
  const user = (req as any).user;
  const hasLimit = req.query.limit !== undefined;
  const limit = hasLimit ? Math.min(parseInt(req.query.limit as string) || 50, 100) : 50;
  const skip = parseInt(req.query.offset as string) || 0;

  if (!idVendedor) {
    res.status(400).json({ error: 'Parâmetro id_vendedor é obrigatório' });
    return;
  }

  if (!user) {
    res.status(401).json({ error: 'Usuário não autenticado' });
    return;
  }

  // Vendedor só pode consultar os próprios pedidos; admin pode consultar qualquer vendedor
  if (user.tipo === 'VENDEDOR' && user.id_vendedor !== idVendedor) {
    res.status(403).json({ error: 'Acesso negado - você só pode consultar seus próprios pedidos vendidos' });
    return;
  }

  if (user.tipo !== 'CLIENTE' && user.tipo !== 'VENDEDOR' && user.tipo !== 'ADMIN') {
    res.status(403).json({ error: 'Acesso negado. Apenas clientes, vendedores ou administradores podem acessar esta rota' });
    return;
  }

  const wherePedidos: any = {
    produtos_no_pedido: {
      some: {
        produto: {
          fk_vendedor: idVendedor,
        },
      },
    },
  };

  // Cliente vê apenas os próprios pedidos com esse vendedor
  if (user.tipo === 'CLIENTE') {
    if (!user.cpf) {
      res.status(401).json({ error: 'Usuário cliente sem CPF no token' });
      return;
    }
    wherePedidos.fk_cliente = user.cpf;
  }

  try {
    const [pedidos, total] = await Promise.all([
      prisma.pedido.findMany({
        where: wherePedidos,
        take: limit,
        skip: skip,
        orderBy: {
          pedido_id: 'desc',
        },
        include: {
          cliente: true,
          feira: true,
          feira_retirada: true,
          associacao_retirada: true,
          atende_um: true,
          produtos_no_pedido: {
            where: {
              produto: {
                fk_vendedor: idVendedor,
              },
            },
            include: {
              produto: {
                include: {
                  vendedor: {
                    select: {
                      id_vendedor: true,
                      nome: true,
                      telefone: true,
                      endereco_venda: true,
                    },
                  },
                  categoria: true,
                },
              },
            },
          },
        },
      }),
      prisma.pedido.count({
        where: wherePedidos
      })
    ]);

    console.log(`📊 Pedidos por vendedor: ${pedidos.length}/${total}`);
    const serializado = serializePedidosRetirada(pedidos);
    // Retorna novo formato apenas se ?limit foi passado, caso contrário mantém compatibilidade
    if (hasLimit) {
      res.json({ data: serializado, total, limit, skip });
    } else {
      res.json(serializado);
    }
  } catch (error) {
    console.error('Erro ao buscar pedidos por vendedor:', error);
    res.status(500).send('Erro ao buscar pedidos por vendedor');
  }
};

// POST: Criar novo pedido com produtos
// POST: Criar novo pedido com produtos
export const createPedido = async (req: Request, res: Response): Promise<void> => {
  // produtos deve ser um array: [{ produto_id: number, quantidade: number }, ...]
  const body = req.body as CreatePedidoDTO;
  const { data_pedido, produtos, cpf_cliente, fk_associacao_retirada } = body;
  const rawFkFeira = (body as any)?.fk_feira;
  const rawFkFeiraRetirada = (body as any)?.fk_feira_retirada;
  const fk_feira = parseOptionalInt(body?.fk_feira);
  const fk_feira_retirada = parseOptionalInt(body?.fk_feira_retirada);
  const pedidoRetirada = isRetiradaRequest(body);
  
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

  if (fk_feira === undefined && rawFkFeira !== undefined && rawFkFeira !== null && rawFkFeira !== '') {
    res.status(400).json({ error: 'fk_feira inválido. Informe um número inteiro válido.' });
    return;
  }

  if (fk_feira_retirada === undefined && rawFkFeiraRetirada !== undefined && rawFkFeiraRetirada !== null && rawFkFeiraRetirada !== '') {
    res.status(400).json({ error: 'fk_feira_retirada inválido. Informe um número inteiro válido.' });
    return;
  }

  const dataPedidoConvertida = data_pedido ? new Date(data_pedido) : new Date();
  if (Number.isNaN(dataPedidoConvertida.getTime())) {
    res.status(400).json({ error: 'data_pedido inválida. Use um formato de data válido.' });
    return;
  }

  try {
    const itensDoPedidoData: { produto_id: string; quantidade: number }[] = [];

    for (let index = 0; index < produtos.length; index++) {
      const produto = produtos[index] as any;
      const produtoId = produto?.produto_id || produto?.id_produto;
      const quantidade = Number(produto?.quantidade);

      if (!produtoId || typeof produtoId !== 'string') {
        res.status(400).json({ error: `produto_id ausente ou inválido no índice ${index}` });
        return;
      }

      if (!Number.isInteger(quantidade) || quantidade <= 0) {
        res.status(400).json({ error: `quantidade inválida no índice ${index}` });
        return;
      }

      itensDoPedidoData.push({
        produto_id: produtoId,
        quantidade,
      });
    }

    let feiraRetiradaValida: number | null = null;
    let associacaoRetiradaValida: string | null = null;

    if (pedidoRetirada && fk_feira_retirada === undefined && !fk_associacao_retirada) {
      res.status(400).json({
        error: 'Para pedidos com retirada, informe fk_feira_retirada (ou fk_associacao_retirada temporariamente para clientes legados).'
      });
      return;
    }

    if (fk_feira_retirada !== undefined && fk_feira_retirada !== null) {
      const feiraRetirada = await prisma.feira.findUnique({
        where: { id_feira: fk_feira_retirada },
        select: {
          id_feira: true,
          disponivel_retirada: true,
        }
      });

      if (!feiraRetirada) {
        res.status(404).json({ error: 'Feira de retirada não encontrada' });
        return;
      }

      if (!feiraRetirada.disponivel_retirada) {
        res.status(400).json({ error: 'A feira selecionada não está disponível para retirada' });
        return;
      }

      feiraRetiradaValida = feiraRetirada.id_feira;
    }

    if (!feiraRetiradaValida && fk_associacao_retirada) {
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
      const produtoIds = itensDoPedidoData.map((p) => p.produto_id);
      
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

    // Usar uma transação para garantir a integridade das escritas
    const novoPedidoId = await prisma.$transaction(async (tx) => {
      // 1. Criar o registro principal do pedido
      const novoPedido = await tx.pedido.create({
        data: {
          data_pedido: dataPedidoConvertida,
          fk_feira,
          fk_cliente,
          ...(feiraRetiradaValida && { fk_feira_retirada: feiraRetiradaValida }),
          ...(!feiraRetiradaValida && associacaoRetiradaValida && { fk_associacao_retirada: associacaoRetiradaValida }),
        }
      });

      console.log('✅ Pedido criado:', novoPedido.pedido_id);

      // 2. Preparar os dados dos itens do pedido (tabela 'item_pedido')
      const itensDoPedidoParaPersistir = itensDoPedidoData.map((item) => ({
        pedido_id: novoPedido.pedido_id,
        produto_id: item.produto_id,
        quantidade: item.quantidade,
      }));

      console.log('📦 Criando itens do pedido:', itensDoPedidoParaPersistir);

      // 3. Inserir todos os itens do pedido de uma só vez (item_pedido)
      await tx.item_pedido.createMany({
        data: itensDoPedidoParaPersistir,
      });

      console.log('✅ Itens do pedido criados');

      return novoPedido.pedido_id;
    });

    // Buscar o pedido completo fora da transação para evitar timeout de transação interativa
    const novoPedidoComItens = await prisma.pedido.findUnique({
      where: { pedido_id: novoPedidoId },
      include: {
        produtos_no_pedido: {
          include: {
            produto: true
          }
        },
        cliente: true,
        feira: true,
        feira_retirada: true,
        associacao_retirada: true,
      }
    });

    if (!novoPedidoComItens) {
      res.status(404).json({ error: 'Pedido criado, mas não foi possível carregá-lo para resposta.' });
      return;
    }

    res.status(201).json(serializePedidoRetirada(novoPedidoComItens));

  } catch (error) {
    console.error('Erro ao criar pedido:', error);

    if (error instanceof Prisma.PrismaClientValidationError) {
      res.status(400).json({ error: 'Dados inválidos para criação do pedido. Verifique os campos enviados.' });
      return;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2003') {
        res.status(400).json({
          error: 'Relacionamento inválido. Verifique cliente, feira e produtos informados.',
          details: error.meta,
        });
        return;
      }

      if (error.code === 'P2002') {
        res.status(409).json({
          error: 'Conflito de dados ao criar pedido.',
          details: error.meta,
        });
        return;
      }

      if (error.code === 'P2025') {
        res.status(404).json({ error: 'Registro relacionado não encontrado para criação do pedido.' });
        return;
      }
    }

    res.status(500).send('Erro ao criar pedido');
  }
};
// PUT: Atualizar pedido (apenas do usuário autenticado)
export const updatePedido = async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id);
  const { data_pedido, fk_feira, fk_associacao_retirada, fk_feira_retirada: fkFeiraRetiradaBody } = req.body as UpdatePedidoDTO;
  const fk_feira_retirada = parseOptionalInt(fkFeiraRetiradaBody);
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

    if (fk_feira_retirada !== undefined && fk_feira_retirada !== null) {
      const feiraRetirada = await prisma.feira.findUnique({
        where: { id_feira: fk_feira_retirada },
        select: {
          id_feira: true,
          disponivel_retirada: true,
        }
      });

      if (!feiraRetirada) {
        res.status(404).json({ error: 'Feira de retirada não encontrada' });
        return;
      }

      if (!feiraRetirada.disponivel_retirada) {
        res.status(400).json({ error: 'A feira selecionada não está disponível para retirada' });
        return;
      }
    }

    if ((fk_feira_retirada === undefined || fk_feira_retirada === null) && fk_associacao_retirada !== undefined && fk_associacao_retirada !== null && fk_associacao_retirada !== '') {
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
        ...(fk_feira_retirada !== undefined && { fk_feira_retirada: fk_feira_retirada || null }),
        ...(fk_feira_retirada !== undefined && fk_feira_retirada !== null && { fk_associacao_retirada: null }),
        ...(fk_associacao_retirada !== undefined && { fk_associacao_retirada: fk_associacao_retirada || null }),
        // Não permitir mudança de cliente
        fk_cliente: pedidoExistente.fk_cliente,
      },
      include: {
        cliente: true,
        feira: true,
        feira_retirada: true,
        associacao_retirada: true,
      }
    });

    res.json(serializePedidoRetirada(pedidoAtualizado));
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
          feira_retirada: true,
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
      data: serializePedidosRetirada(pedidos),
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
        feira_retirada: true,
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

    res.json(serializePedidoRetirada(pedido));
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
    const requestedLimit = req.query.limit ? Math.max(1, parseInt(req.query.limit as string, 10) || 25) : 25;
    const limit = Math.min(requestedLimit, 100);
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
          cliente: {
            select: {
              cpf: true,
              nome: true,
              email: true,
              telefone: true,
            },
          },
          feira: {
            select: {
              id_feira: true,
              nome: true,
              localizacao: true,
              data_hora: true,
            },
          },
          feira_retirada: {
            select: {
              id_feira: true,
              nome: true,
              localizacao: true,
              data_hora: true,
            },
          },
          associacao_retirada: {
            select: {
              id_associacao: true,
              nome: true,
              endereco: true,
              data_hora: true,
            },
          },
          produtos_no_pedido: {
            select: {
              id_item_pedido: true,
              quantidade: true,
              produto: {
                select: {
                  id_produto: true,
                  nome: true,
                  preco: true,
                  fk_vendedor: true,
                  vendedor: {
                    select: {
                      id_vendedor: true,
                      nome: true,
                      telefone: true,
                    },
                  },
                },
              },
            },
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
        fk_feira_retirada: p.fk_feira_retirada,
        fk_associacao_retirada: p.fk_associacao_retirada,
        feira_retirada: p.feira_retirada
          ? {
              id_feira: p.feira_retirada.id_feira,
              nome: p.feira_retirada.nome,
              localizacao: p.feira_retirada.localizacao,
              data_hora: p.feira_retirada.data_hora,
            }
          : null,
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
