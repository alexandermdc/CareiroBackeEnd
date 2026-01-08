import { Request, Response } from 'express';
import prisma from '../../config/dbConfig';
import { associacao } from '@prisma/client';

// Listar todas as associações (público)
export const getAssociacoes = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("📋 Listando todas as associações");
    const associacoes = await prisma.associacao.findMany({
      include: {
        vendedor: {
          select: {
            id_vendedor: true,
            nome: true,
            telefone: true,
            tipo_vendedor: true,
          }
        }
      },
      orderBy: {
        nome: 'asc',
      },
    });
    
    console.log(`✅ ${associacoes.length} associações encontradas`);
    res.json(associacoes);
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
  const { nome, descricao, image, endereco, data_hora } = req.body;
  
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
        data_hora
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
  const { nome, descricao, image, endereco, data_hora } = req.body;
  
  try {
    const associacaoAtualizada = await prisma.associacao.update({
      where: { id_associacao: id },
      data: { 
        ...(nome && { nome }),
        ...(descricao && { descricao }),
        ...(image !== undefined && { image }),
        ...(endereco !== undefined && { endereco }),
        ...(data_hora !== undefined && { data_hora })
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
