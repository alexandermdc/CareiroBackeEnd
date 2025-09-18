// src/config/swagger.ts
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Pedidos com Prisma',
      version: '1.0.0',
      description: 'Documentação da API para gerenciamento de pedidos, clientes, feiras, produtos e vendedores.',
    },
    servers: [
      {
        url: 'http://localhost:3000/api-docs', // URL base da sua API
      },
    ],
  },
  apis: ['./src/routes/**/*.ts'], // caminho para os arquivos onde as rotas estão documentadas
};

const specs = swaggerJsdoc(options);

export function setupSwagger(app: Express) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
}
