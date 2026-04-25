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

## Migração de Local de Retirada (Associação -> Feira)

### Alterações implementadas

- Banco:
  - `feira.disponivel_retirada` (`boolean`, default `false`)
  - `pedido.fk_feira_retirada` (`int`, FK para `feira.id_feira`, nullable)
  - Índices:
    - `idx_feira_disponivel_retirada`
    - `idx_pedido_fk_feira_retirada`
- API de feiras:
  - `GET /feira?disponivel_retirada=true` filtra feiras disponíveis para retirada
  - `PUT/PATCH /feira/:id` aceita `disponivel_retirada` (apenas admin)
- API de pedidos:
  - `POST /pedido/cadastro` aceita `fk_feira_retirada`
  - Quando pedido for retirada (`forma_entrega` contendo `RETIRADA`), exige ponto de retirada
  - Retrocompatível com `fk_associacao_retirada` (temporário), priorizando `fk_feira_retirada`
  - Respostas retornam `feira_retirada: { id_feira, nome, localizacao, data_hora }`

### Migração SQL

Arquivo: `prisma/migrations/20260425110000_add_feira_retirada_fields/migration.sql`

### Exemplos de request/response

#### 1) Filtrar feiras disponíveis para retirada

Request:
`GET /feira?disponivel_retirada=true`

Response 200:
```json
[
  {
    "id_feira": 5,
    "nome": "Feira Municipal",
    "localizacao": "Praça Central",
    "data_hora": "Sábado 07:00",
    "disponivel_retirada": true
  }
]
```

#### 2) Cadastro de pedido (novo payload)

Request:
`POST /pedido/cadastro`
```json
{
  "forma_entrega": "RETIRADA",
  "fk_feira_retirada": 5,
  "produtos": [
    {
      "produto_id": "7f5a5f8f-12ac-4fa9-a08c-df8924b2c4f0",
      "quantidade": 2
    }
  ]
}
```

Response 201 (trecho):
```json
{
  "pedido_id": 123,
  "fk_feira_retirada": 5,
  "feira_retirada": {
    "id_feira": 5,
    "nome": "Feira Municipal",
    "localizacao": "Praça Central",
    "data_hora": "Sábado 07:00"
  },
  "fk_associacao_retirada": null
}
```

#### 3) Cadastro de pedido (payload legado temporário)

Request:
`POST /pedido/cadastro`
```json
{
  "forma_entrega": "RETIRADA",
  "fk_associacao_retirada": "46fb8be0-03ce-4ddf-a2f3-83cb428af282",
  "produtos": [
    {
      "produto_id": "7f5a5f8f-12ac-4fa9-a08c-df8924b2c4f0",
      "quantidade": 1
    }
  ]
}
```

### Testes de integração

- Arquivo: `tests/integration/retirada-feira.integration.test.js`
- Execução:
  - `npm run test:integration:retirada`

Cobertura dos cenários:
- filtro de feiras por `disponivel_retirada`
- criação de pedido com `fk_feira_retirada`
- serialização de `feira_retirada` no retorno
- retrocompatibilidade com `fk_associacao_retirada`

### Plano de depreciação de `fk_associacao_retirada`

1. **Agora (compatibilidade)**: aceitar ambos os campos, priorizando `fk_feira_retirada`.
2. **Próxima release**: emitir warning em logs quando chegar payload com `fk_associacao_retirada`.
3. **Release +2**: bloquear novos pedidos com `fk_associacao_retirada` (retornar `400` com mensagem de migração).
4. **Release +3**: remover leitura/escrita de `fk_associacao_retirada` da API e documentação.
5. **Release final**: migration para remover coluna `pedido.fk_associacao_retirada` e FK associada.

### Checklist de validação manual pós-deploy

- [ ] Executar migration em homologação e produção sem erro
- [ ] Confirmar criação/edição de feira com `disponivel_retirada` via admin
- [ ] Validar `GET /feira?disponivel_retirada=true` retornando apenas feiras disponíveis
- [ ] Validar `POST /pedido/cadastro` com `fk_feira_retirada` (sucesso)
- [ ] Validar pedido de retirada sem `fk_feira_retirada` e sem legado (erro esperado)
- [ ] Validar payload legado com `fk_associacao_retirada` (sucesso temporário)
- [ ] Validar `GET /pedido`, `GET /pedido/:id` e `/pedido/admin/pedidos` com `feira_retirada` presente
- [ ] Confirmar métricas/logs para identificar clientes ainda usando payload legado
