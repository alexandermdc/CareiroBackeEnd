# Backend do ProjetoCareiro 

## Instalação 
Clonando o Repositório

## Backend
```
git@github.com:alexandermdc/CareiroBackeEnd.git
```

## front end
```
https://github.com/alexandermdc/careiro-frontend
```

## Execução
### Buildando e iniciando os Containers Docker!
Para construir as imagens Docker e iniciar a aplicação localmente, existem duas opções:
1. Com o projeto já instalado, procure o arquivo "docker-compose.local.yml", clique nele com o botão direito e clique em "Compose Up"
   
2. Com o projeto já instalado, execute:
```
docker compose -f docker-compose.local.yaml up -d
```
### Acessando a aplicação
Após inicializar, a aplicação estará disponível em:
* Swagger: localhost:3000/api-docs

## Estrutura do Projeto

### Diretórios Principais

#### `/src`
Diretório principal contendo o código-fonte da aplicação.

- **`app.ts`** - Ponto de entrada da aplicação, configuração do Express e middlewares
- **`config/`** - Configurações do sistema
  - `dbConfig.ts` - Configuração do banco de dados
  - `server.ts` - Configuração do servidor
  - `supabaseConfig.ts` - Configuração do Supabase

- **`resources/`** - Módulos de recursos da aplicação (padrão MVC)
  - `associacoes/` - Gerenciamento de associações
  - `atende_um/` - Sistema de atendimento
  - `auth/` - Autenticação e autorização (JWT, refresh tokens, middlewares)
  - `categorias/` - Gerenciamento de categorias de produtos
  - `clientes/` - Gerenciamento de clientes
  - `feiras/` - Gerenciamento de feiras
  - `image-proxy/` - Proxy para imagens
  - `logs/` - Sistema de logs
  - `mercadopago/` - Integração com MercadoPago
  - `pedidos/` - Gerenciamento de pedidos
  - `produtos/` - Gerenciamento de produtos
  - `vendedores/` - Gerenciamento de vendedores
  - `webhook/` - Webhooks para integrações externas

  Cada módulo de recurso segue a estrutura:
  - `controllers.ts` - Controladores (lógica de requisições HTTP)
  - `routes.ts` - Definição de rotas
  - `service.ts` - Lógica de negócio
  - `types.ts` - Tipos TypeScript

- **`shared/`** - Recursos compartilhados
  - `middlewares/` - Middlewares globais
  - `utils/` - Funções utilitárias

- **`swagger/`** - Documentação da API (Swagger/OpenAPI)

- **`types/`** - Definições de tipos TypeScript globais

- **`generated/`** - Código gerado automaticamente (Prisma Client)

#### `/prisma`
Configuração e migrações do banco de dados usando Prisma ORM...

- **`schema.prisma`** - Schema do banco de dados
- **`seed.ts`** - Script para popular o banco com dados iniciais
- **`migrations/`** - Histórico de migrações do banco de dados

#### `/scripts`
Scripts utilitários para manutenção e operações do sistema.

- `backup_antes_migration.sh` - Backup antes de migrações
- `backup-simples.ts` - Script de backup simplificado
- `rollback.sh` - Script para reverter migrações
- `validar_migration.sh` - Validação de migrações

#### `/backups`
Armazena backups do banco de dados em diferentes formatos (JSON, SQL, CSV).

#### `/logs`
Arquivos de log da aplicação.

### 📄 Arquivos de Configuração

- **`package.json`** - Dependências e scripts NPM
- **`tsconfig.json`** - Configuração do TypeScript
- **`Dockerfile`** - Imagem Docker da aplicação
- **`docker-compose.local.yaml`** - Configuração Docker para ambiente local
