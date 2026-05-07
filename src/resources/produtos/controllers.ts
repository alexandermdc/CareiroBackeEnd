import { Request, Response } from 'express';
import prisma from '../../config/dbConfig'; // Importe o cliente Prisma corretamente
import { categoria, produto } from '@prisma/client'; // Importando o tipo 'produto' gerado pelo Prisma
import { supabase } from '../../config/supabaseConfig';
import { CreateProdutoInput } from './schemas';
import { where } from 'sequelize';


export const getProdutos = async (req: Request, res: Response) => {
  const hasLimit = req.query.limit !== undefined;
  const limit = hasLimit ? Math.min(parseInt(req.query.limit as string) || 50, 100) : 50;
  const skip = parseInt(req.query.offset as string) || 0;

  try {
    // Buscar com paginação para evitar memory leak
    const [produtos, total] = await Promise.all([
      prisma.produto.findMany({
        take: limit,
        skip: skip,
        select: {
          id_produto: true,
          nome: true,
          preco: true,
          preco_promocao: true,
          is_promocao: true,
          disponivel: true,
          image: true,
          fk_vendedor: true
        }
      }),
      prisma.produto.count()
    ]);
    
    console.log(`📦 Produtos: ${produtos.length}/${total}`);
    
    // Limpar URLs de imagem inválidas (Google redirects, placeholder, etc)
    const produtosLimpos = produtos.map(produto => {
      let imagemLimpa = null;
      
      if (produto.image) {
        const isBase64 = produto.image.startsWith('data:image');
        const isUrlValida = produto.image.startsWith('http') && 
                           !produto.image.includes('google.com/url') && 
                           !produto.image.includes('placeholder.com');
        
        imagemLimpa = isBase64 || isUrlValida ? produto.image : null;
      }
      
      return {
        ...produto,
        image: imagemLimpa
      };
    });
    
    // Retorna novo formato apenas se ?limit foi passado, caso contrário mantém compatibilidade
    if (hasLimit) {
      res.json({ data: produtosLimpos, total, limit, skip });
    } else {
      res.json(produtosLimpos);
    }
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).send('Erro ao buscar produtos');
  }
};

export const getProdutosCount = async (req: Request, res: Response) => {
  try{
    const produtosCount = await prisma.produto.count()
    res.json({total: produtosCount})
  } catch (error) {
    console.error('Erro ao buscar total de produtos', error);
    res.status(500).send('Erro ao buscar total de produtos');
  }
};

export const getProdutosByCategoriaCount = async (req: Request, res: Response) => {
  const nome_categoria : string = req.params.nome_categoria;
  try{
    const produtosByCategoriaCount = await prisma.produto.count({
      where: {
        categoria: {
          nome: {
            equals: nome_categoria,
            mode: 'insensitive'
          }
        },
      },
    })
    res.json({total: produtosByCategoriaCount})
  } catch (error) {
    console.error('Erro ao buscar total de produtos', error);
    res.status(500).send('Erro ao buscar total de produtos');
  }
};

export const getProdutosByVendedor = async (req: Request, res: Response) => {
  const id_vendedor: string = req.params.id_vendedor;
  
  try {
    console.log(`📦 Buscando produtos do vendedor: ${id_vendedor}`);
    
    const hasLimit = req.query.limit !== undefined;
    const limit = hasLimit ? Math.min(parseInt(req.query.limit as string) || 50, 100) : 50;
    const skip = parseInt(req.query.offset as string) || 0;
    
    const [produtos, total] = await Promise.all([
      prisma.produto.findMany({
        where: {
          fk_vendedor: id_vendedor
        },
        take: limit,
        skip: skip,
        include: {
          categoria: true,
          vendedor: {
            select: {
              id_vendedor: true,
              nome: true,
              email: true
            }
          }
        },
        orderBy: {
          nome: 'asc'
        }
      }),
      prisma.produto.count({
        where: {
          fk_vendedor: id_vendedor
        }
      })
    ]);

    console.log(`✅ ${produtos.length} produtos encontrados`);
    
    // Limpar URLs de imagem inválidas
    const produtosLimpos = produtos.map(produto => {
      let imagemLimpa = null;
      
      if (produto.image) {
        const isBase64 = produto.image.startsWith('data:image');
        const isUrlValida = produto.image.startsWith('http') && 
                           !produto.image.includes('google.com/url') && 
                           !produto.image.includes('placeholder.com');
        
        imagemLimpa = isBase64 || isUrlValida ? produto.image : null;
      }
      
      return {
        ...produto,
        image: imagemLimpa
      };
    });

    // Retorna novo formato apenas se ?limit foi passado, caso contrário mantém compatibilidade
    if (hasLimit) {
      res.json({ data: produtosLimpos, total, limit, skip });
    } else {
      res.json(produtosLimpos);
    }
  } catch (error) {
    console.error('❌ Erro ao buscar produtos do vendedor:', error);
    res.status(500).json({ error: 'Erro ao buscar produtos do vendedor' });
  }
};

export const getProdutoById = async (req: Request, res: Response) => {
  const id : string = req.params.id; ;
  try {
    const result: produto | null = await prisma.produto.findUnique({
      where: {
        id_produto: id,
      },
      include: {
        vendedor: true
      }
    });

    if (result) {
      // Limpar URL de imagem inválida
      let imagemLimpa = null;
      
      if (result.image) {
        const isBase64 = result.image.startsWith('data:image');
        const isUrlValida = result.image.startsWith('http') && 
                           !result.image.includes('google.com/url') && 
                           !result.image.includes('placeholder.com');
        
        imagemLimpa = isBase64 || isUrlValida ? result.image : null;
      }
      
      const produtoLimpo = {
        ...result,
        image: imagemLimpa
      };
      res.json(produtoLimpo);
    } else {
      res.status(404).send('Produto não encontrado');
    }
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    res.status(500).send('Erro ao buscar produto');
  }
};

export const getProdutosByCategoria = async (req: Request, res: Response) => {
  const nome_categoria : string = req.params.nome_categoria;

  const limit = parseInt(req.query.limit as string);
  const skip = parseInt(req.query.offset as string)

  const takeValue = isNaN(limit) || limit <= 0 ? 10 : limit; 
  const skipValue = isNaN(skip) || skip < 0 ? 0 : skip;

  try {
    const result: produto[] = await prisma.produto.findMany({
      where: {
        categoria: {
          nome: {
            equals: nome_categoria,
            mode: 'insensitive'
          }
        },
      },
      take: takeValue,
      skip: skipValue,
    });
    res.json(result)
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    res.status(500).send('Erro ao buscar produto');
  }
};

export const createProduto = async (req: Request, res: Response) => {
  const { 
    nome, preco, descricao, disponivel, preco_promocao, is_promocao, 
    fk_vendedor, id_categoria, unidade_medida
  } = req.body as CreateProdutoInput;

  const imageFile = req.file; 

  console.log('📦 Criando produto:');
  console.log('  - Dados recebidos:', req.body);
  console.log('  - Tipos:', {
    disponivel: typeof disponivel,
    is_promocao: typeof is_promocao,
    preco: typeof preco
  });
  console.log('  - Arquivo:', imageFile ? {
    fieldname: imageFile.fieldname,
    originalname: imageFile.originalname,
    mimetype: imageFile.mimetype,
    size: imageFile.size
  } : '❌ NENHUM ARQUIVO RECEBIDO');
  console.log('  - Usuário:', req.user);

  try {
    // Validar se a imagem foi enviada
    if (!imageFile) {
      console.log('❌ Erro: Nenhuma imagem foi enviada no campo "image"');
      res.status(400).json({ error: 'Imagem do produto é obrigatória' });
      return;
    }
    
    // Sanitizar nome do arquivo - remover caracteres especiais e acentos
    const sanitizedFileName = imageFile.originalname
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-zA-Z0-9.-]/g, '_'); // Substitui caracteres especiais por _
    
    const fileName = `${Date.now()}-${sanitizedFileName}`;
    const filePath = `${fileName}`;
    const bucketName = 'produtos/imagens';   

    console.log(`📤 Upload para Supabase: ${filePath}`);

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, imageFile.buffer, {
        contentType: imageFile.mimetype,
        upsert: false,
      });

    if (uploadError) {
      console.error('❌ Erro no Supabase Storage:', uploadError);
      res.status(500).json({ error: 'Erro ao fazer upload da imagem', details: uploadError.message });
      return; // IMPORTANTE: return para não continuar
    }

    const { data: publicURLData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    const imageUrl = publicURLData.publicUrl;

    console.log(`✅ Imagem salva: ${imageUrl}`);

    // Converter strings de FormData para tipos corretos
    const parseBoolean = (value: any): boolean => {
      if (value === undefined || value === null) return false;
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') {
        return value === 'true' || value === '1';
      }
      return Boolean(value);
    };

    const result: produto = await prisma.produto.create({
      data: {
        nome,
        descricao,
        disponivel: parseBoolean(disponivel),
        is_promocao: parseBoolean(is_promocao),
        preco: Number(preco),
        preco_promocao: preco_promocao ? Number(preco_promocao) : null,
        unidade_medida: unidade_medida || 'UNIDADE',
        image: imageUrl, 
        vendedor: {
          connect: { id_vendedor: fk_vendedor }, 
        },
        categoria: {
          connect: { id_categoria: id_categoria }
        },
      },
    });

    console.log(`✅ Produto criado: ${result.id_produto}`);
    res.status(201).json(result);
  } catch (error) {
    console.error('❌ Erro ao criar produto:', error);
    res.status(500).json({ error: 'Erro ao criar produto', details: error instanceof Error ? error.message : 'Erro desconhecido' });
  }
};

export const updateProduto = async (req: Request, res: Response) => {
  const id = req.params.id;
  const imageFile = req.file;

  const {
    nome,
    descricao,
    disponivel,
    is_promocao,
    preco,
    preco_promocao,
    id_categoria,
    unidade_medida,
  } = req.body;

  try {
    console.log(`📝 Atualizando produto: ${id}`);
    console.log('  - Dados recebidos:', req.body);
    console.log('  - Tipos:', {
      disponivel: typeof disponivel,
      is_promocao: typeof is_promocao,
      preco: typeof preco
    });
    console.log('  - Nova imagem:', imageFile ? imageFile.originalname : 'não enviada');

    let imageUrl: string | undefined = undefined;

    // Se uma nova imagem foi enviada, fazer upload
    if (imageFile) {
      const sanitizedFileName = imageFile.originalname
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9.-]/g, '_');
      
      const fileName = `${Date.now()}-${sanitizedFileName}`;
      const filePath = `${fileName}`;
      const bucketName = 'produtos/imagens';

      console.log(`📤 Upload nova imagem: ${filePath}`);

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, imageFile.buffer, {
          contentType: imageFile.mimetype,
          upsert: false,
        });

      if (uploadError) {
        console.error('❌ Erro no upload:', uploadError);
        res.status(500).json({ error: 'Erro ao fazer upload da nova imagem' });
        return;
      }

      const { data: publicURLData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      imageUrl = publicURLData.publicUrl;
      console.log(`✅ Nova imagem salva: ${imageUrl}`);
    }

    // Preparar dados para atualização
    // Converter strings de FormData para tipos corretos
    const parseBoolean = (value: any): boolean => {
      if (value === undefined || value === null) return false;
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') {
        return value === 'true' || value === '1';
      }
      return Boolean(value);
    };

    const dataToUpdate: any = {
      ...(nome && { nome }),
      ...(descricao && { descricao }),
      ...(disponivel !== undefined && { disponivel: parseBoolean(disponivel) }),
      ...(is_promocao !== undefined && { is_promocao: parseBoolean(is_promocao) }),
      ...(preco && { preco: Number(preco) }),
      ...(preco_promocao !== undefined && preco_promocao !== null && { preco_promocao: Number(preco_promocao) }),
      ...(id_categoria && { id_categoria }),
      ...(unidade_medida && { unidade_medida }),
      ...(imageUrl && { image: imageUrl }),
    };

    console.log('  - Dados convertidos:', dataToUpdate);

    const result = await prisma.produto.update({
      where: { id_produto: id },
      data: dataToUpdate,
      include: {
        categoria: true,
        vendedor: {
          select: {
            id_vendedor: true,
            nome: true,
            email: true
          }
        }
      }
    });

    console.log(`✅ Produto atualizado: ${id}`);
    res.json(result);
  } catch (error) {
    console.error('❌ Erro ao atualizar produto:', error);
    res.status(500).json({ 
      error: 'Erro ao atualizar produto', 
      details: error instanceof Error ? error.message : 'Erro desconhecido' 
    });
  }
};

export const deleteProduto = async (req: Request, res: Response) => {
  const id = req.params.id;
  
  try {
    console.log(`🗑️ Deletando produto: ${id}`);
    
    // Primeiro, buscar o produto para pegar a URL da imagem
    const produto = await prisma.produto.findUnique({
      where: { id_produto: id }
    });

    if (!produto) {
      res.status(404).json({ error: 'Produto não encontrado' });
      return;
    }

    // Verificar se existe item_pedido referenciando este produto
    const itemReferente = await prisma.item_pedido.findFirst({
      where: { produto_id: id }
    });

    const forceDelete = req.query.force === 'true' || req.query.force === '1';

    if (itemReferente && !forceDelete) {
      console.warn(`❌ Tentativa de deletar produto referenciado em pedidos: ${id}`);
      // Soft-delete: marcar como indisponível para não quebrar integridade referencial
      await prisma.produto.update({
        where: { id_produto: id },
        data: { disponivel: false }
      });
      res.status(200).json({ message: 'Produto referenciado em pedidos — marcado como indisponível (disponivel=false). Use ?force=true para remover permanentemente e apagar itens de pedido.' });
      return;
    }

    // Se for forçado, remover os itens de pedido em transação antes de deletar o produto
    if (itemReferente && forceDelete) {
      await prisma.$transaction([
        prisma.item_pedido.deleteMany({ where: { produto_id: id } }),
        prisma.produto.delete({ where: { id_produto: id } })
      ]);
    } else {
      // Deletar do banco
      await prisma.produto.delete({
        where: { id_produto: id }
      });
    }

    // Tentar deletar a imagem do Supabase (se existir)
    if (produto.image && produto.image.includes('supabase')) {
      try {
        const fileName = produto.image.split('/').pop();
        if (fileName) {
          await supabase.storage
            .from('produtos/imagens')
            .remove([fileName]);
          console.log(`🗑️ Imagem deletada: ${fileName}`);
        }
      } catch (imageError) {
        console.warn('⚠️ Erro ao deletar imagem, mas produto foi deletado:', imageError);
      }
    }

    console.log(`✅ Produto deletado: ${id}`);
    res.json({ message: 'Produto deletado com sucesso', id });
  } catch (error) {
    console.error('❌ Erro ao deletar produto:', error);
    res.status(500).json({ 
      error: 'Erro ao deletar produto', 
      details: error instanceof Error ? error.message : 'Erro desconhecido' 
    });
  }
};

export default {
  getProdutos,
  getProdutoById,
  getProdutosByCategoria,
  createProduto,
  updateProduto,
  deleteProduto,
  getProdutosCount,
  getProdutosByCategoriaCount
};
