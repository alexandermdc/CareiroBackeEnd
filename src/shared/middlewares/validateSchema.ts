import { Request, Response, NextFunction } from 'express';
import { Schema, ZodObject } from 'zod'; 

export const validate = (schema: ZodObject) => 
    (req: Request, res: Response, next: NextFunction) => {
    try {
        
        req.body = schema.parse(req.body); 
        next();
    } catch (error: any) {
        console.error('Erro de Zod completo:', error);
        res.status(400).json({ 
            message: 'Erro de validação dos dados.', 
            errors: error.errors || [] 
        });
    }
};