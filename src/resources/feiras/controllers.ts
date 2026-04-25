import { Request, Response } from 'express';
import prisma from '../../config/dbConfig';
import { feira } from '@prisma/client';
import { supabase } from '../../config/supabaseConfig';
import { CreateFeiraDTO, UpdateFeiraDTO } from './types';

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

// Buscar todas as feiras
export const getFeiras = async (req: Request, res: Response): Promise<void> => {
  try {
    const disponivelRetirada = parseBoolean(req.query.disponivel_retirada);

    const where: any = {};
    if (disponivelRetirada !== undefined) {
      where.disponivel_retirada = disponivelRetirada;
    }

    const feiras: feira[] = await prisma.feira.findMany({
      where,
      orderBy: {
        id_feira: 'asc'
      }
    });
    console.log("Feiras entrando no banco de dados");
    res.json(feiras);
  } catch (error) {
    console.error('Erro ao buscar feiras:', error);
    res.status(500).send('Erro ao buscar feiras');
  }
};

// Buscar feira por ID
export const getFeiraById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const feira = await prisma.feira.findUnique({
      where: { id_feira: parseInt(id) },
    });

    if (!feira) {
      res.status(404).send('Feira não encontrada');
    }

    res.json(feira);
  } catch (error) {
    console.error('Erro ao buscar feira:', error);
    res.status(500).send('Erro ao buscar feira');
  }
};

// Criar nova feira
export const createFeira = async (req: Request, res: Response): Promise<void> => {
  const { nome, data_hora, descricao, localizacao, image, disponivel_retirada } = req.body as CreateFeiraDTO;
  const imageFile = req.file;

  console.log('📝 Criando feira:', { 
    nome, 
    data_hora, 
    descricao,
    localizacao,
    tem_file: !!imageFile,
    tem_base64: image ? `${image.substring(0, 50)}...` : 'não enviada'
  });

  try {
    let imageUrl = null;

    // Prioridade 1: Imagem base64 do body
    if (image) {
      imageUrl = image;
      console.log('✅ Usando imagem base64 do body');
    }
    // Prioridade 2: Upload via multipart/form-data
    else if (imageFile) {
      const fileName = `${Date.now()}-${imageFile.originalname}`;
      const filePath = `${fileName}`;
      const bucketName = 'feiras/imagens';

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, imageFile.buffer, {
          contentType: imageFile.mimetype,
          upsert: false,
        });

      if (uploadError) {
        console.error('Erro no Supabase Storage:', uploadError);
        res.status(500).send('Erro ao fazer upload da imagem.');
        return;
      }

      const { data: publicURLData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      imageUrl = publicURLData.publicUrl;
      console.log('✅ Upload Supabase concluído:', imageUrl);
    }

    const novaFeira = await prisma.feira.create({
      data: { 
        nome,
        image: imageUrl,
        data_hora: data_hora || null,
        descricao: descricao || null,
        localizacao: localizacao || null,
        disponivel_retirada: parseBoolean(disponivel_retirada, false)
      },
    });

    console.log('✅ Feira criada:', { id: novaFeira.id_feira, tem_imagem: !!novaFeira.image });
    res.status(201).json(novaFeira);
  } catch (error) {
    console.error('Erro ao criar feira:', error);
    res.status(500).send('Erro ao criar feira');
  }
};

// Atualizar feira
export const updateFeira = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { nome, image, data_hora, descricao, localizacao, disponivel_retirada } = req.body as UpdateFeiraDTO;
  try {
    const disponivelRetirada = parseBoolean(disponivel_retirada);
    const dataToUpdate: any = {};
    if (nome !== undefined) dataToUpdate.nome = nome;
    if (image !== undefined) dataToUpdate.image = image;
    if (data_hora !== undefined) dataToUpdate.data_hora = data_hora;
    if (descricao !== undefined) dataToUpdate.descricao = descricao;
    if (localizacao !== undefined) dataToUpdate.localizacao = localizacao;
    if (disponivelRetirada !== undefined) dataToUpdate.disponivel_retirada = disponivelRetirada;

    const feiraAtualizada = await prisma.feira.update({
      where: { id_feira: parseInt(id) },
      data: dataToUpdate,
    });

    res.json(feiraAtualizada);
  } catch (error) {
    console.error('Erro ao atualizar feira:', error);
    res.status(500).send('Erro ao atualizar feira');
  }
};

// Deletar feira
export const deleteFeira = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const feiraDeletada = await prisma.feira.delete({
      where: { id_feira: parseInt(id) },
    });

    res.json(feiraDeletada);
  } catch (error) {
    console.error('Erro ao deletar feira:', error);
    res.status(500).send('Erro ao deletar feira');
  }
};

export default {
  getFeiras,
  getFeiraById,
  createFeira,
  updateFeira,
  deleteFeira,
};
