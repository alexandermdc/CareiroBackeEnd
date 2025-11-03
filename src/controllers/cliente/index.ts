import { Request, Response } from 'express';
import prisma from '../../config/dbConfig'; // PrismaClient instanciado
import { cliente } from '@prisma/client'; // Importando o tipo cliente do Prisma
import { where } from 'sequelize';

const bcrypt = require('bcrypt');
const saltRounds = 10;

export const listarClientes = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("aqui no cliente");
    const clientes: cliente[] = await prisma.cliente.findMany();
    res.json(clientes);
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    res.status(500).send('Erro ao buscar clientes');
  }
};

export const listarClientesPorId = async (req: Request, res: Response): Promise<void> => {
  const { cpf } = req.params;
  try {
    const cliente = await prisma.cliente.findUnique({
      where: { cpf },
    });

    if (!cliente) {
      res.status(404).send('Cliente não encontrado');
      return;
    }

    res.json(cliente);
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    res.status(500).send('Erro ao buscar cliente');
  }
};

export const criarCliente = async (req: Request, res: Response): Promise<void> => {
  const { cpf, nome, email, telefone, senha} = req.body;
  if (!cpf || !nome || !email || !telefone || !senha) {
    res.status(400).send('Todos os campos são obrigatórios');
    return;
  }
  try {
    console.log("aqui no criar cliente");
    const senha_segura = await bcrypt.hash(senha, saltRounds);

    const novoCliente: cliente = await prisma.cliente.create({
      data: { cpf, nome, email, telefone, senha: senha_segura},

    });
    console.log('Cliente criado:', novoCliente);

    res.status(201).json(novoCliente);
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    res.status(500).send('Erro ao criar cliente');
  }
};

export const atualizarCliente = async (req: Request, res: Response): Promise<void> => {
  const { cpf } = req.params;
  const { nome, email, telefone, senha } = req.body;

  try {
    // Preparar dados para atualização
    const dataToUpdate: any = {};
    
    if (nome !== undefined) dataToUpdate.nome = nome;
    if (email !== undefined) dataToUpdate.email = email;
    if (telefone !== undefined) dataToUpdate.telefone = telefone;
    
    // Apenas fazer hash da senha se ela for fornecida
    if (senha !== undefined && senha !== '') {
      const senha_segura = await bcrypt.hash(senha, saltRounds);
      dataToUpdate.senha = senha_segura;
    }

    const clienteAtualizado: cliente = await prisma.cliente.update({
      where: { cpf },
      data: dataToUpdate,
    });

    console.log('Cliente atualizado:', clienteAtualizado);
    res.json(clienteAtualizado);
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).send('Cliente não encontrado');
    } else {
      console.error('Erro ao atualizar cliente:', error);
      res.status(500).send('Erro ao atualizar cliente');
    }
  }
};

export const deletarCliente = async (req: Request, res: Response): Promise<void> => {
  const { cpf } = req.params;

  try {
    const clienteDeletado = await prisma.cliente.delete({
      where: { cpf },
    });

    res.json(clienteDeletado);
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).send('Cliente não encontrado');
    } else {
      console.error('Erro ao deletar cliente:', error);
      res.status(500).send('Erro ao deletar cliente');
    }
  }
};

export const adicionarFavorito = async (req: Request, res: Response): Promise<void> => {

  const { cpf } = req.params;  // ✅ Correto - pega :cpf da URL
  const { produto_id } = req.body;

  try {
    // ✅ Criar um novo registro na tabela favorita_um
    const novoFavorito = await prisma.favorita_um.create({
      data: {
        cliente_cpf: cpf,
        produto_id: produto_id
      },
      include: {
        produto: true
      }
    });

    res.status(200).json(novoFavorito);

  } catch (error: any) {
    console.error('Erro ao adicionar produto favorito', error);
    
    // Se já existe, retornar erro específico
    if (error.code === 'P2002') {
      res.status(409).json({ error: 'Produto já está nos favoritos' });
      return;
    }
    
    res.status(500).json({ error: 'Erro ao adicionar produto favorito.' });
  }

}

export const listarFavoritos = async (req: Request, res: Response): Promise<void> => {
  const { cpf } = req.params;  // ✅ Correto - pega :cpf da URL
  
  try {
    const clienteComFavoritos = await prisma.cliente.findUnique({
      where: { cpf: cpf },
      include: {
        favoritos: {
          select: {
            produto: true
          }
        }
      }
    })

    if(!clienteComFavoritos) {
      res.status(404).json({ message: "Cliente nao encontrado"})
      return;
    }

    const produtosFavoritos = clienteComFavoritos.favoritos.map(fav => {
      const produto = fav.produto;
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
    
    console.log('✅ Favoritos encontrados:', produtosFavoritos.length);
    console.log('📦 Primeiro produto:', produtosFavoritos[0]);
    
    res.status(200).json(produtosFavoritos);

  } catch(error) {
    console.error('Erro ao listar favoritos: ', error)
    res.status(500).json({ message: 'Erro ao listar favoritos. '})
  }

}

export const removerFavorito = async (req: Request, res: Response): Promise<void> => {
  const { cpf } = req.params;
  const { produto_id } = req.body;

  try {
    // Buscar o favorito para deletar
    const favorito = await prisma.favorita_um.findUnique({
      where: {
        cliente_cpf_produto_id: {
          cliente_cpf: cpf,
          produto_id: produto_id
        }
      }
    });

    if (!favorito) {
      res.status(404).json({ error: 'Favorito não encontrado' });
      return;
    }

    // Deletar o favorito
    await prisma.favorita_um.delete({
      where: {
        cliente_cpf_produto_id: {
          cliente_cpf: cpf,
          produto_id: produto_id
        }
      }
    });

    res.status(200).json({ message: 'Favorito removido com sucesso' });

  } catch (error) {
    console.error('Erro ao remover favorito:', error);
    res.status(500).json({ error: 'Erro ao remover favorito.' });
  }
};

export default {
  listarClientes,
  listarClientesPorId,
  criarCliente,
  atualizarCliente,
  deletarCliente,
  adicionarFavorito,
  listarFavoritos,
  removerFavorito
};
