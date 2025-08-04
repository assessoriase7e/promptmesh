# Configuração do Webhook do Clerk

Este documento explica como configurar o webhook do Clerk para sincronizar usuários automaticamente com o banco de dados do PromptMesh.

## 📋 Pré-requisitos

1. Conta no Clerk configurada
2. Banco de dados PostgreSQL configurado
3. Variáveis de ambiente configuradas

## 🔧 Configuração no Clerk Dashboard

### 1. Acessar o Dashboard do Clerk

1. Acesse [https://dashboard.clerk.com](https://dashboard.clerk.com)
2. Selecione seu projeto
3. Navegue para **Webhooks** no menu lateral

### 2. Criar um Novo Webhook

1. Clique em **Add Endpoint**
2. Configure os seguintes campos:

**Endpoint URL:**
```
https://seu-dominio.com/api/webhooks/clerk
```

**Events to listen for:**
- ✅ `user.created`
- ✅ `user.updated` 
- ✅ `user.deleted`

**Message Filtering (opcional):**
Deixe em branco para receber todos os eventos

### 3. Obter o Signing Secret

1. Após criar o webhook, clique no endpoint criado
2. Na seção **Signing Secret**, clique em **Reveal**
3. Copie o valor (começará com `whsec_`)

### 4. Configurar Variável de Ambiente

Adicione no seu arquivo `.env.local`:

```env
CLERK_WEBHOOK_SECRET=whsec_seu_signing_secret_aqui
```

## 🧪 Testando o Webhook

### 1. Teste Local com ngrok

Para testar localmente, use o ngrok:

```bash
# Instalar ngrok (se não tiver)
npm install -g ngrok

# Expor porta local
ngrok http 3000

# Use a URL gerada no webhook do Clerk
# Exemplo: https://abc123.ngrok.io/api/webhooks/clerk
```

### 2. Teste Manual

Você pode testar criando um novo usuário no Clerk:

1. Acesse sua aplicação
2. Crie uma nova conta
3. Verifique os logs do servidor
4. Confirme se o usuário foi criado no banco

### 3. Verificar Logs

O webhook registra logs detalhados:

```bash
# Verificar logs do Next.js
yarn dev

# Ou verificar logs de produção
pm2 logs
```

## 🔄 Sincronização de Usuários Existentes

Se você já tem usuários no Clerk antes de configurar o webhook:

### Sincronizar Todos os Usuários

```bash
yarn sync-users
```

### Sincronizar Usuário Específico

```bash
yarn sync-users --user=user_123456789
```

## 📊 Monitoramento

### 1. Logs de Auditoria

Todos os eventos do webhook são registrados na tabela `AuditLog`:

```sql
SELECT * FROM "AuditLog" 
WHERE metadata->>'source' = 'clerk_webhook' 
ORDER BY "createdAt" DESC;
```

### 2. Dashboard do Clerk

No dashboard do Clerk, você pode:
- Ver tentativas de webhook
- Verificar status de entrega
- Reenviar webhooks falhados
- Ver logs de erro

### 3. Verificar Sincronização

```typescript
import { checkUserSync } from '@/lib/sync-clerk-users'

// Verificar se usuário está sincronizado
const user = await checkUserSync('user_123456789')
console.log(user ? 'Sincronizado' : 'Não sincronizado')
```

## 🚨 Troubleshooting

### Webhook não está sendo chamado

1. **Verificar URL:** Certifique-se que a URL está correta e acessível
2. **Verificar HTTPS:** Clerk só envia webhooks para URLs HTTPS
3. **Verificar eventos:** Confirme que os eventos corretos estão selecionados

### Erro de verificação de assinatura

1. **Verificar secret:** Confirme que `CLERK_WEBHOOK_SECRET` está correto
2. **Verificar headers:** O webhook precisa receber os headers corretos
3. **Verificar timestamp:** Webhooks expiram após 5 minutos

### Usuário não criado no banco

1. **Verificar logs:** Verifique os logs do servidor para erros
2. **Verificar banco:** Confirme que o banco está acessível
3. **Verificar seed:** Execute `yarn db:seed` se necessário

### Erro de plano não encontrado

```bash
# Executar seed para criar planos padrão
yarn db:seed
```

## 🔐 Segurança

### Validação de Assinatura

O webhook sempre valida a assinatura do Clerk:

```typescript
const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!)
const evt = wh.verify(body, headers)
```

### Rate Limiting

Considere implementar rate limiting para o endpoint do webhook:

```typescript
// Exemplo com next-rate-limit
import rateLimit from 'express-rate-limit'
```

### Logs Seguros

Nunca registre informações sensíveis nos logs:
- ❌ Senhas
- ❌ Tokens
- ❌ Dados pessoais completos
- ✅ IDs de usuário
- ✅ Timestamps
- ✅ Status de operação

## 📈 Escalabilidade

Para aplicações com muitos usuários:

1. **Queue System:** Use Redis/Bull para processar webhooks em background
2. **Retry Logic:** Implemente retry automático para falhas
3. **Batch Processing:** Processe múltiplos eventos em lote
4. **Monitoring:** Use ferramentas como Sentry para monitoramento

## 🔗 Links Úteis

- [Documentação Oficial do Clerk Webhooks](https://clerk.com/docs/integrations/webhooks)
- [Eventos Disponíveis](https://clerk.com/docs/integrations/webhooks/overview#supported-events)
- [Verificação de Assinatura](https://clerk.com/docs/integrations/webhooks/overview#verifying-webhooks)
- [Troubleshooting](https://clerk.com/docs/integrations/webhooks/troubleshooting)