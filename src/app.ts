import express from 'express';
import clienteRoutes from './routes/clientes/clientesRoute'; // Importando as rotas de clientes
import associacaoRoutes from './routes/associacao'; // Importando as rotas de associacao */
import atendeUmRoutes from './routes/atende_um'; // Importando as rotas de associado
import feiraRoutes from './routes/feira/feiraRoute'; // Importando as rotas de feira
import pedidoRoutes from './routes/pedido'; // Importando as rotas de pedido
import produtoRoutes from './routes/produto'; // Importando as rotas de produto
import categoriaRoutes from './routes/categoria'; // Importando as rotas de categoria
import vendedorRoutes from './routes/vendedor'; // Importando as rotas de vendedor
import mercadopagoRoutes from './routes/mercadoPago'; // Importando as rotas de mercadoPago
import authRoutes from './routes/authRoutes'; // Importando as rotas de autenticação
import refreshRoutes from './routes/refresh'; // Importando as rotas de refresh token
import webhookRoutes from './routes/webhook'; // Importando as rotas de webhook
import { setupSwagger } from './swagger/swagger';
import { autenticarToken } from './controllers/auth/authMiddleware';
import errorHandler from './middlewares/errorHandler';
import cors from 'cors';

const app = express();
app.use(express.json());
const port = 3000;
const host = '0.0.0.0';

app.use(cors()); // Habilitando CORS para todas as rotas
// Rota principal para verificar conexão com o banco
/* app.get('/', async (req, res) => {
  try {
    const result = await prisma.$queryRawUnsafe<{ now: string }[]>(`SELECT NOW()`);
    res.send(`Hora atual no banco: ${result[0].now}`);
  } catch (err) {
    console.error('Erro ao conectar ao banco:', err);
    res.status(500).send('Erro ao conectar ao banco de dados');
  }
});
app.get('/tables', async (req, res) => {
  try {
    const tables = await prisma.$queryRawUnsafe<{ table_name: string }[]>(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
    );
    res.json(tables.map((table) => table.table_name));
  } catch (err) {
    console.error('Erro ao listar tabelas:', err);
    res.status(500).send('Erro ao listar tabelas do banco de dados');
  }
}); */
app.get('/protegido', autenticarToken, (req, res) => { 
  res.send(`Rota protegida, você está autenticado!, acesso permitido ${req.user.email}`);
});
// Configurando as rotas de clientes
app.use('/clientes', clienteRoutes);

console.log('[INFO] Rotas de cliente carregadas');
app.use('/associacao', associacaoRoutes); // Configurando as rotas de associacao
console.log('[INFO] Rotas de atende um carregadas');
app.use('/atendeum', atendeUmRoutes); // Configurando as rotas de associado
console.log('[INFO] Rotas de associado carregadas');
app.use('/pedido', pedidoRoutes); // Configurando as rotas de clienteVendedor
console.log('[INFO] Rotas de pedidos carregadas');
app.use('/feira', feiraRoutes); // Configurando as rotas de feira
console.log('[INFO] Rotas de feira carregadas');
app.use('/produto', produtoRoutes); // Configurando as rotas de produto
app.use('/categoria', categoriaRoutes); // Configurando as rotas de categoria
console.log('[INFO] Rotas de categoria carregadas');

app.use('/associacao', associacaoRoutes); 
app.use('/atendeum', atendeUmRoutes); 
app.use('/pedido', pedidoRoutes); 
app.use('/feira', feiraRoutes);
app.use('/produto', produtoRoutes);
console.log('[INFO] Rotas de produto carregadas');
app.use('/vendedor', vendedorRoutes); 
app.use('/mercadopago', mercadopagoRoutes); // Configurando as rotas de mercadoPago
setupSwagger(app); // Configurando o Swagger
app.use('/auth', authRoutes); // Configurando as rotas de autenticação

console.log('[INFO] Rotas de autenticação carregadas');
app.use('/refresh', refreshRoutes); // Configurando as rotas de refresh token
console.log('[INFO] Rotas de refresh token carregadas');
app.use('/webhook', webhookRoutes); // Configurando as rotas de webhook
console.log('[INFO] Rotas de webhook carregadas');

// Middleware de tratamento de erros (deve ser o último)
app.use(errorHandler as any);

// Iniciando o servido

app.listen(port, host ,() => {
  console.log(`Server rodando em http://${host}:${port}`);
});
