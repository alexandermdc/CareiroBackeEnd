import jwt, { SignOptions } from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const secret = process.env.JWT_SECRET as string;
const refreshSecret = process.env.JWT_REFRESH_SECRET as string;
const expiresIn = process.env.JWT_EXPIRES_IN || "1h";
const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || "14d";

// Gerar access token (curta duração)
export const gerarToken = (payload: object): string => {
  return jwt.sign(payload, secret, { expiresIn } as any);
};

// Gerar refresh token (longa duração)
export const gerarRefreshToken = (payload: object): string => {
  return jwt.sign(payload, refreshSecret, { expiresIn: refreshExpiresIn } as any);
};

// Verificar access token
export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
};

// Verificar refresh token
export const verifyRefreshToken = (token: string): any => {
  try {
    return jwt.verify(token, refreshSecret);
  } catch (error) {
    return null;
  }
};
