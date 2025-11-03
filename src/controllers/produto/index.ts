import { Request, Response } from 'express';
import prisma from '../../config/dbConfig'; // Importe o cliente Prisma corretamente
import { produto } from '@prisma/client'; // Importando o tipo 'produto' gerado pelo Prisma


export const getProdutos = async (req: Request, res: Response) => {
  try {
    // Utilizando o Prisma com a tipagem explícita
    const produtos: produto[] = await prisma.produto.findMany();
    console.log("aqui no produtos");
    
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
    
    res.json(produtosLimpos);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).send('Erro ao buscar produtos');
  }
};

export const getProdutoById = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  try {
    // Tipando a resposta como 'produto'
    const result: produto | null = await prisma.produto.findUnique({
      where: {
        id_produto: id.toString(),
      },
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

export const createProduto = async (req: Request, res: Response) => {
  const { 
    nome,
    preco, 
    descricao, 
    disponivel, 
    image, 
    preco_promocao, 
    is_promocao,
    fk_vendedor, 
    id_categoria,
  }: 
  { 
  nome: string;
  descricao: string;
  disponivel: boolean;
  image: string;
  is_promocao: boolean;
  preco: number;
  preco_promocao?: number;
  fk_vendedor: string;
  id_categoria: string;
} = req.body;
  try {
    const result: produto = await prisma.produto.create({
      data: {
        nome,
        descricao,
        disponivel,
        image,
        is_promocao,
        preco,
        preco_promocao,
        vendedor: {
          connect: { id_vendedor: fk_vendedor }, 
        },
        categoria: {
          connect: { id_categoria: id_categoria }
        },
      },
    });
    res.status(201).json(result);
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    res.status(500).send('Erro ao criar produto');
  }
};

export const updateProduto = async (req: Request, res: Response) => {

  const id = req.params.id;

  const {
    nome,
    descricao,
    image,
    disponivel,
    is_promocao,
    preco,
    preco_promocao,
    id_categoria,
  }: {
    nome?: string;
    descricao?: string;
    image?: string;
    disponivel: boolean;
    is_promocao?: boolean;
    preco?: number;
    preco_promocao?: number;
    id_categoria?: string;
  } = req.body;
  try {
    const result: produto | null = await prisma.produto.update({
      where: {
        id_produto: id,
      },
      data: {
        nome,
        descricao,
        image,
        disponivel,
        is_promocao,
        preco,
        preco_promocao,
        id_categoria,
      },
    });

    if (result) {
      res.json(result);
    } else {
      res.status(404).send('Produto não encontrado');
    }
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).send('Erro ao atualizar produto');
  }
};

export const deleteProduto = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  try {
    const result: produto | null = await prisma.produto.delete({
      where: {
        id_produto: id.toString(),
      },
    });

    if (result) {
      res.json(result);
    } else {
      res.status(404).send('Produto não encontrado');
    }
  } catch (error) {
    console.error('Erro ao deletar produto:', error);
    res.status(500).send('Erro ao deletar produto');
  }
};

export default {
  getProdutos,
  getProdutoById,
  createProduto,
  updateProduto,
  deleteProduto,
};
