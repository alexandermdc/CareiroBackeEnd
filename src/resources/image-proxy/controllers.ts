import { Request, Response } from 'express';

export const servirImagem = async (req: Request, res: Response): Promise<void> => {
  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    res.status(400).json({ error: 'URL da imagem é obrigatória' });
    return;
  }

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      res.status(404).json({ error: 'Imagem não encontrada' });
      return;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache por 24 horas
    res.send(buffer);
    
  } catch (error) {
    console.error('Erro ao buscar imagem:', error);
    res.status(500).json({ error: 'Erro ao buscar imagem' });
  }
};
