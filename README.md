# 🎨 PromptMesh - Criação Visual de Fluxos de IA

Uma plataforma moderna e intuitiva para criar fluxos visuais de geração de imagens com IA, permitindo que usuários construam pipelines complexos através de uma interface drag-and-drop.

## ✨ Funcionalidades

### 🎯 Canvas Visual Interativo

- **Drag & Drop**: Arraste componentes da sidebar para o canvas
- **Conexões Visuais**: Conecte nós para criar fluxos complexos
- **Nós Customizados**: 4 tipos de nós especializados
- **Zoom e Pan**: Navegação fluida no canvas
- **Minimapa**: Visão geral do fluxo

### 🧩 Componentes Disponíveis

#### 📝 Prompt Node

- Campo de texto para prompts
- Botão "Melhorar" com IA
- Função de copiar prompt
- Validação em tempo real

#### 📤 Upload Node

- Upload de imagens por drag-and-drop
- Preview de imagens
- Suporte a múltiplos formatos
- Validação de tamanho

#### ⚙️ Parameters Node

- Seleção de modelo de IA (DALL-E 3, Midjourney, Stable Diffusion, Leonardo)
- Estilos predefinidos (Fotorrealista, Artístico, Cartoon, Anime, Abstrato)
- Configuração de resolução
- Seed personalizado
- Modo iterativo

#### 🖼️ Output Node

- Visualização de resultados
- Download individual ou em lote
- Barra de progresso
- Estimativa de créditos

### 🔐 Sistema de Autenticação

- Integração com **Clerk**
- Perfis de usuário
- Gerenciamento de sessões

### 💳 Sistema de Planos

- **Freemium**: 20 créditos gratuitos
- **Pro**: Recursos avançados
- **Enterprise**: Soluções corporativas

### 📊 Histórico e Monitoramento

- Histórico completo de execuções
- Status em tempo real
- Métricas de uso de créditos
- Reexecução de fluxos

### 🎨 Interface Moderna

- **Dark/Light Mode**: Tema adaptável
- **Responsive**: Funciona em todos os dispositivos
- **Sidebar Colapsável**: Mais espaço para o canvas
- **Notificações**: Feedback em tempo real

## 🚀 Tecnologias Utilizadas

### Frontend

- **Next.js 15** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização utilitária
- **shadcn/ui** - Componentes UI modernos
- **Lucide React** - Ícones consistentes

### Canvas e Interatividade

- **@xyflow/react** - Canvas de fluxo visual
- **React Konva** - Manipulação gráfica avançada
- **@dnd-kit** - Drag and drop robusto

### Formulários e Validação

- **React Hook Form** - Gerenciamento de formulários
- **Zod** - Validação de esquemas

### Autenticação e Upload

- **@clerk/nextjs** - Autenticação completa
- **UploadThing** - Upload de arquivos

### Utilitários

- **class-variance-authority** - Variantes de componentes
- **clsx** - Concatenação de classes
- **tailwind-merge** - Merge inteligente de classes
- **sonner** - Notificações elegantes

## 📁 Estrutura do Projeto

```
src/
├── actions/              # Server Actions (CRUD, processamento)
├── app/                  # App Router do Next.js
│   ├── (admin)/         # Rotas administrativas
│   ├── editor/          # Editor visual (em desenvolvimento)
│   ├── history/         # Histórico de execuções
│   ├── settings/        # Configurações do usuário
│   └── page.tsx         # Página principal com canvas
├── components/
│   ├── canvas/          # Componentes do canvas
│   │   ├── nodes/       # Nós customizados
│   │   └── flow-canvas.tsx
│   ├── cards/           # Cards draggable
│   ├── layout/          # Layout principal
│   ├── navbar/          # Barra de navegação
│   ├── sidebar/         # Barra lateral
│   └── ui/              # Componentes UI (shadcn)
├── hooks/               # Hooks customizados
├── lib/                 # Utilitários e configurações
├── types/               # Definições de tipos TypeScript
├── utils/               # Funções utilitárias
└── validators/          # Esquemas de validação Zod
```

## 🛠️ Instalação e Configuração

### Pré-requisitos

- Node.js 18+
- Yarn ou npm
- Conta no Clerk (autenticação)
- Conta no UploadThing (upload de arquivos)

### 1. Clone o repositório

```bash
git clone <repository-url>
cd promptmesh
```

### 2. Instale as dependências

```bash
yarn install
# ou
npm install
```

### 3. Configure as variáveis de ambiente

Copie o arquivo `.env.example` para `.env.local` e configure:

```env
# Clerk (Autenticação)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# UploadThing (Upload de arquivos)
UPLOADTHING_SECRET=sk_live_...
UPLOADTHING_APP_ID=your-app-id

# Banco de dados
DATABASE_URL="postgresql://..."

# APIs de IA
OPENAI_API_KEY=sk-...
REPLICATE_API_TOKEN=r8_...

# Redis (opcional - para filas)
REDIS_URL=redis://localhost:6379

# AWS S3 (opcional - para armazenamento)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket
```

### 4. Execute o servidor de desenvolvimento

```bash
yarn dev
# ou
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) para ver a aplicação.

## 🎮 Como Usar

### 1. **Criando um Fluxo**

- Arraste componentes da sidebar para o canvas
- Conecte os nós clicando e arrastando entre os pontos de conexão
- Configure cada nó com os parâmetros desejados

### 2. **Configurando Nós**

- **Prompt**: Digite ou melhore seu prompt com IA
- **Upload**: Carregue imagens de referência
- **Parâmetros**: Escolha modelo, estilo e resolução
- **Output**: Visualize e baixe os resultados

### 3. **Executando o Fluxo**

- Clique em "Executar Fluxo" na barra de ferramentas
- Acompanhe o progresso em tempo real
- Baixe os resultados quando concluído

### 4. **Gerenciando Histórico**

- Acesse a página "Histórico" para ver execuções passadas
- Reexecute fluxos ou baixe resultados antigos
- Monitore o uso de créditos

## 🔧 Desenvolvimento

### Comandos Disponíveis

```bash
# Desenvolvimento
yarn dev

# Build de produção
yarn build

# Iniciar produção
yarn start

# Linting
yarn lint

# Adicionar componente shadcn/ui
npx shadcn@latest add [component-name]
```

### Adicionando Novos Nós

1. Crie o componente em `src/components/canvas/nodes/`
2. Adicione o tipo em `src/types/index.ts`
3. Registre no `nodeTypes` do `FlowCanvas`
4. Crie o card correspondente em `src/components/cards/`

### Estrutura de um Nó

```tsx
import { Handle, Position } from "@xyflow/react";

export const CustomNode = ({ data }: { data: any }) => {
  return (
    <div className="bg-white border rounded-lg p-4 shadow-lg">
      <Handle type="target" position={Position.Left} />
      {/* Conteúdo do nó */}
      <Handle type="source" position={Position.Right} />
    </div>
  );
};
```

## 🚀 Deploy

### Vercel (Recomendado)

1. Conecte seu repositório no Vercel
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

### Outras Plataformas

- **Netlify**: Suporte completo ao Next.js
- **Railway**: Deploy simples com banco de dados
- **AWS**: Usando Amplify ou EC2

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Roadmap

### 🔄 Em Desenvolvimento

- [ ] Editor Visual com IA (página `/editor`)
- [ ] Integração com mais modelos de IA
- [ ] Sistema de templates de fluxo
- [ ] Colaboração em tempo real

### 🎯 Próximas Versões

- [ ] API pública para integração
- [ ] Marketplace de templates
- [ ] Análise avançada de performance
- [ ] Suporte a vídeo e áudio

### 🌟 Futuro

- [ ] Mobile app
- [ ] Integração com Figma/Adobe
- [ ] IA para otimização automática de fluxos

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

Feito com ❤️ pela equipe PromptMesh
