import { Request, Response } from 'express';
import prisma from '../../config/dbConfig';

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

// Listar todas as associações (público)
export const getAssociacoes = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("📋 Listando todas as associações");
    const disponivelRetirada = parseBoolean(req.query.disponivel_retirada);

    const where: any = {};

    if (disponivelRetirada !== undefined) {
      where.disponivel_retirada = disponivelRetirada;
    }

    const hasLimit = req.query.limit !== undefined;
    const limit = hasLimit ? Math.min(parseInt(req.query.limit as string) || 50, 100) : 50;
    const skip = parseInt(req.query.offset as string) || 0;
    
    const [associacoes, total] = await Promise.all([
      prisma.associacao.findMany({
        where,
        take: limit,
        skip: skip,
        include: {
          vendedor: {
            select: {
              id_vendedor: true,
              nome: true,
              telefone: true,
              tipo_vendedor: true,
              image: true,
            }
          }
        },
        orderBy: {
          nome: 'asc',
        },
      }),
      prisma.associacao.count({ where })
    ]);
    
    console.log(`✅ ${associacoes.length}/${total} associações encontradas`);
    
    // Retorna novo formato apenas se ?limit foi passado, caso contrário mantém compatibilidade
    if (hasLimit) {
      res.json({ data: associacoes, total, limit, skip });
    } else {
      res.json(associacoes);
    }
  } catch (error) {
    console.error('❌ Erro ao buscar associações:', error);
    res.status(500).json({ error: 'Erro ao buscar associações' });
  }
};

// Buscar associação por ID com seus vendedores
export const getAssociacaoById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  
  try {
    const associacao = await prisma.associacao.findUnique({
      where: { id_associacao: id },
      include: {
        vendedor: {
          select: {
            id_vendedor: true,
            nome: true,
            telefone: true,
            tipo_vendedor: true,
            tipo_documento: true,
            numero_documento: true,
            image: true,
          }
        }
      }
    });

    if (!associacao) {
      res.status(404).json({ error: 'Associação não encontrada' });
      return;
    }

    res.json(associacao);
  } catch (error) {
    console.error('❌ Erro ao buscar associação:', error);
    res.status(500).json({ error: 'Erro ao buscar associação' });
  }
};

// 👑 ADM: Criar nova associação (sem id_associacao manual)
export const criarAssociacao = async (req: Request, res: Response): Promise<void> => {
  const { nome, descricao, image, endereco, data_hora, disponivel_retirada } = req.body;
  
  console.log('👑 ADM criando associação:', { 
    nome, 
    descricao, 
    endereco, 
    data_hora,
    image: image ? `${image.substring(0, 50)}...` : 'não enviada'
  });

  // Validação de campos obrigatórios
  if (!nome || !descricao) {
    res.status(400).json({ 
      error: 'Campos obrigatórios: nome e descricao' 
    });
    return;
  }

  try {
    // Criar associação (id_associacao é gerado automaticamente pelo banco)
    const novaAssociacao = await prisma.associacao.create({
      data: { 
        nome, 
        descricao,
        image,
        endereco,
        data_hora,
        disponivel_retirada: parseBoolean(disponivel_retirada, false)
      },
    });

    console.log('✅ Associação criada:', {
      id: novaAssociacao.id_associacao,
      nome: novaAssociacao.nome,
      tem_imagem: !!novaAssociacao.image
    });
    
    res.status(201).json({
      message: 'Associação criada com sucesso',
      associacao: novaAssociacao
    });
    
  } catch (error: any) {
    console.error('🚨 Erro ao criar associação:', error);
    res.status(500).json({ 
      error: 'Erro ao criar associação',
      detalhe: error.message 
    });
  }
};

// 👑 ADM: Atualizar associação
export const atualizarAssociacao = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { nome, descricao, image, endereco, data_hora, disponivel_retirada } = req.body;

  const disponivelRetiradaParseada = parseBoolean(disponivel_retirada);
  
  try {
    const associacaoAtualizada = await prisma.associacao.update({
      where: { id_associacao: id },
      data: { 
        ...(nome && { nome }),
        ...(descricao && { descricao }),
        ...(image !== undefined && { image }),
        ...(endereco !== undefined && { endereco }),
        ...(data_hora !== undefined && { data_hora }),
        ...(disponivelRetiradaParseada !== undefined && { disponivel_retirada: disponivelRetiradaParseada })
      },
      include: {
        vendedor: true
      }
    });

    console.log('✅ Associação atualizada:', associacaoAtualizada.nome);
    res.json({
      message: 'Associação atualizada com sucesso',
      associacao: associacaoAtualizada
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Associação não encontrada' });
    } else {
      console.error('❌ Erro ao atualizar associação:', error);
      res.status(500).json({ error: 'Erro ao atualizar associação' });
    }
  }
};

// 👑 ADM: Deletar associação
export const deletarAssociacao = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  
  try {
    // Verificar se há vendedores vinculados
    const associacao = await prisma.associacao.findUnique({
      where: { id_associacao: id },
      include: { vendedor: true }
    });

    if (!associacao) {
      res.status(404).json({ error: 'Associação não encontrada' });
      return;
    }

    if (associacao.vendedor.length > 0) {
      res.status(400).json({ 
        error: 'Não é possível deletar associação com vendedores vinculados',
        vendedores_vinculados: associacao.vendedor.length,
        sugestao: 'Desvincule os vendedores primeiro'
      });
      return;
    }

    const associacaoRemovida = await prisma.associacao.delete({
      where: { id_associacao: id },
    });

    console.log('✅ Associação deletada:', associacaoRemovida.nome);
    res.json({ 
      message: 'Associação deletada com sucesso',
      associacao: associacaoRemovida 
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Associação não encontrada' });
    } else {
      console.error('❌ Erro ao deletar associação:', error);
      res.status(500).json({ error: 'Erro ao deletar associação' });
    }
  }
};

export default {
  getAssociacoes,
  getAssociacaoById,
  criarAssociacao,
  atualizarAssociacao,
  deletarAssociacao,
};
