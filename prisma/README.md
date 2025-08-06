# 🗄️ Banco de Dados - PromptMesh

Este diretório contém toda a configuração do banco de dados usando **Prisma** com **PostgreSQL**.

## 📋 Estrutura do Schema

### 🔑 Entidades Principais

- **User**: Usuários autenticados via Clerk
- **Plan**: Planos de assinatura (Free, Pro, Enterprise)
- **Project**: Projetos/fluxos criados pelos usuários
- **Node**: Cards/nodes individuais no canvas
- **Edge**: Conexões entre nodes
- **Execution**: Histórico de execuções dos fluxos
- **NodeExecution**: Execução individual de cada node
- **Template**: Templates salvos e oficiais
- **File**: Arquivos uploadados via UploadThing
- **SystemConfig**: Configurações do sistema
- **AuditLog**: Logs de auditoria

### 🎯 Tipos de Nodes Suportados

- `PROMPT_INPUT`: Input de texto/prompt
- `IMAGE_INPUT`: Upload de imagem
- `AI_GENERATOR`: Geração com IA (texto, imagem)
- `IMAGE_EDITOR`: Edição de imagem
- `OUTPUT`: Saída final
- `CONDITION`: Nó condicional
- `LOOP`: Nó de repetição
- `VARIABLE`: Variável/parâmetro
- `API_CALL`: Chamada de API externa
- `TEXT_PROCESSOR`: Processamento de texto

## 🚀 Setup Inicial

### 1. Configurar Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env.local`:

```bash
cp .env.example .env.local
```

Configure a URL do PostgreSQL:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/promptmesh"
```

### 2. Instalar Dependências

```bash
yarn install
```

### 3. Gerar o Cliente Prisma

```bash
yarn db:generate
```

### 4. Aplicar o Schema ao Banco

```bash
# Para desenvolvimento (push direto)
yarn db:push

# OU para produção (com migrations)
yarn db:migrate
```

### 5. Popular com Dados Iniciais

```bash
yarn db:seed
```

## 🛠️ Scripts Disponíveis

- `yarn db:generate` - Gera o cliente Prisma
- `yarn db:push` - Aplica mudanças do schema diretamente ao banco
- `yarn db:migrate` - Cria e aplica migrations
- `yarn db:seed` - Popula o banco com dados iniciais
- `yarn db:studio` - Abre o Prisma Studio para visualizar dados
- `yarn db:reset` - Reseta o banco e aplica todas as migrations

## 📊 Dados Iniciais (Seed)

O script de seed cria:

### Planos de Assinatura
- **Gratuito**: 15 créditos de boas-vindas + 20 mensais, até 3 projetos
- **Pro**: 500 créditos, projetos ilimitados
- **Enterprise**: 2000 créditos, recursos avançados

### Templates Oficiais
- **Post para Redes Sociais**: Template de marketing
- **Melhoria de Imagem**: Template de design com IA

### Configurações do Sistema
- Tamanho máximo de arquivo: 10MB
- Tipos de arquivo suportados: JPEG, PNG, WebP, GIF
- Retenção de arquivos: 7 dias

## 🔄 Fluxo de Execução

1. **Usuário cria projeto** → Salvo na tabela `projects`
2. **Adiciona nodes e conexões** → Salvos em `nodes` e `edges`
3. **Executa o fluxo** → Cria registro em `executions`
4. **Cada node é processado** → Cria registros em `node_executions`
5. **Resultados são salvos** → URLs em `executions.outputs`
6. **Arquivos temporários** → Expiram em 7 dias

## 🔐 Segurança e Auditoria

- Todos os logs de ações importantes são salvos em `audit_logs`
- Arquivos temporários são automaticamente removidos
- Relacionamentos com `onDelete: Cascade` para limpeza automática
- Validação de tipos via Prisma e Zod

## 📈 Escalabilidade

O schema foi projetado para suportar:
- Milhões de usuários
- Projetos complexos com centenas de nodes
- Histórico completo de execuções
- Templates compartilhados pela comunidade
- Monetização flexível via planos e créditos