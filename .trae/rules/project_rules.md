# Regras do Projeto Adaptadas para PromptMesh

## ✨ Tecnologias Utilizadas

- Framework: **Next.js 15** (App Router)
- Linguagem: **TypeScript**
- Estilo: **Tailwind CSS**
- Componentes UI: **shadcn/ui** + **Lucide Icons**
- Formulários: **React Hook Form**
- Validação: **Zod**
- HTTP: **fetch** (nativo)
- Autenticação: **Clerk**
- Upload: **UploadThing**
- Canvas & Drag-and-Drop: **React Flow** (para fluxo visual e conexões), complementado por **React Konva** e **DndKit** para manipulação avançada no canvas.

## 📚 Arquitetura e Estrutura de Pastas

- `src/actions`: Server Actions (Data Access Layer para CRUD, processamento e geração)
- `src/app/(admin)`: Telas administrativas (ex: dashboard do usuário, histórico, configuração de planos)
- `src/app/componentes`: Componentes UI compartilhados ou comuns
- Organização por **feature-based structure** para facilitar escalabilidade, mas ações separadas em `/actions`.
- Componentes específicos do canvas e cards agrupados em feature específica (ex: `/components/canvas`, `/components/cards`)

## Paradigma e Fluxo de Dados

- Priorizar SSR com Next.js 15 e passar dados do server para client via props.
- Evitar **hooks globais**, contextos e estados globais.
- Evitar `useState` para estados simples; usar **query params** para manter fonte de verdade.
- Uso explícito de `export const revalidate = 3600` em páginas.
- Manter revalidação manual via `revalidatePath` após criação, edição e exclusão.
- `params` e `searchParams` são promises no Next 15 e devem ser tratados como tal.

## Padrões de Código

- Indentação: 2 espaços, formatação com Prettier.
- Componentes e funções como arrow functions.
- Evitar `any`; usar tipagem do Prisma para modelos.
- Comentários curtos, apenas para blocos complexos.
- Buscar componentes prontos do shadcn/ui antes de criar algo novo.
- Não usar axios; usar fetch nativo.
- Evitar HTML puro quando houver componente equivalente no shadcn.
- Para botões que navegam, envolver em `Link` do Next.js.
- Criar componentes agnósticos e reutilizáveis.
- Revalidar dados após alterações.
- Criar uma arquivo para cada action

## UI Patterns

### Header de Páginas

- Usar padrão com botão voltar + título alinhado via `container mx-auto`
- Responsivo (botão abaixo no mobile, lado a lado no desktop)
- Usar componente `Button` com variantes e ícone `ArrowLeft` (Lucide)
- Aplicar em páginas de criação, edição, detalhes

## Estados de Loading

- Controlar loading local com useState ao disparar query params.
- Usar `Skeleton` do shadcn/ui como UI de loading.
- Setar loading true ao alterar query param; detectar remontagem com useEffect para desativar loading.

## Integração BMAD (Simulado)

- O agente atua como equipe ágil (PO, Scrum Master, Dev, QA, Orquestrador).
- Ciclo interno completo sem dependência externa.
- Criar documentação sintética quando aplicável (`product_requirements.md`, `architecture.md`, `sprint_plan.md`).

## Restrições Técnicas

- Não usar `any`, `eval` ou `localStorage` sem justificativa.
- Evitar repetição de código e código desnecessário.
- Não gerar exemplos de uso "copy-paste".
- Comentários devem ser breves e úteis.
- Não criar testes automáticos (por enquanto).
- Não criar componentes do shadcn do zero; usar comando oficial.
- Priorizar query params ao invés de estados locais para controle.

## Permissões do Agente

- Pode acessar APIs externas, executar comandos no terminal e criar arquivos.
- Não pode ignorar padrões, criar código desnecessário ou gerar exemplos prontos.

## Testes

- Não gerar testes automaticamente.
- Sempre execute npx tsc --noEmit --skipLibCheck para ver se aparecem erros no terminal.

## Documentação

- Sem docstrings extensas.
- Comentários curtos e focados.
- Documentação sintética e contextual ao projeto.

## Específico para PromptMesh — Funcionalidades Canvas e Fluxo

- Canvas implementado com **React Flow** para nodes/cards e conexões.
- Manipulação visual avançada de imagens e uploads com **React Konva** e **DndKit**.
- Upload via **UploadThing**, com preview no card.
- Prompt enhancement com IA integrado via server action.
- Controle de execução do fluxo via Server Actions + fila (Redis ou similar).
- Histórico e execução com armazenamento temporário (7 dias).
- Planos e monetização conforme especificado.
- Download automático de imagens/vídeos gerados.
