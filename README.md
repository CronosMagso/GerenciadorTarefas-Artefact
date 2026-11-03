# GerenciadorTarefas-Artefact

Sistema simples de gerenciamento de tarefas feito com **Next.js 15** e **tRPC**. O backend mantém as tarefas **em memória** (sem banco de dados) e as expõe via tRPC; o frontend lista, cria, edita e exclui.

> As respostas da parte teórica (CSR/SSR/SSG, abordagens de backend e tRPC) estão em [`RESPOSTAS.md`](./RESPOSTAS.md).

## Funcionalidades

- **Listagem** com Server-Side Rendering (a primeira página já vem no HTML) e **infinite scroll** para as demais.
- **Exclusão** direto na lista, com confirmação e mensagens de sucesso/erro.
- **Criação e edição** em um formulário único, com validação (título obrigatório) e estados de carregamento.
- **Tratamento de erros** com mensagens claras vindas do backend (ex.: atualizar ou excluir uma tarefa inexistente).
- Página 404 amigável para tarefas que não existem.

## Como executar

Requisitos: Node.js 18.18 ou superior (exigência do Next 15) e npm.

```bash
npm install
npm run dev      # http://localhost:3000
```

Outros comandos:

```bash
npm run build    # build de produção
npm start        # serve o build (rode `npm run build` antes)
npm run lint     # ESLint
```

Não há variáveis de ambiente nem banco de dados. **As tarefas ficam em memória e são perdidas ao reiniciar o servidor**, o que é esperado neste desafio.

## Stack

| Tecnologia | Uso |
|---|---|
| Next.js 15 (App Router) + React 19 | Páginas, SSR e rotas |
| tRPC 11 | API tipada de ponta a ponta |
| TanStack React Query 5 | Cache, mutations e infinite query |
| Zod | Validação de entrada |
| SuperJSON | Trafegar `Date` entre servidor e cliente |
| Tailwind CSS 4 | Estilo |
| TypeScript | Tipagem |

## Estrutura

```
src/
├── app/
│   ├── page.tsx                      # Listagem (SSR da 1ª página)
│   ├── tarefas/nova/page.tsx         # Criar tarefa
│   ├── tarefas/[id]/editar/page.tsx  # Editar tarefa (SSR + 404)
│   ├── api/trpc/[trpc]/route.ts      # Endpoint HTTP do tRPC
│   └── not-found.tsx
├── components/
│   ├── lista-tarefas.tsx             # Lista, exclusão e infinite scroll (client)
│   └── formulario-tarefa.tsx         # Formulário de criar/editar (client)
├── server/
│   ├── trpc.ts                       # Inicialização do tRPC e formatação de erros
│   ├── routers/                      # Routers (raiz e tarefas)
│   └── tarefas/
│       ├── schema.ts                 # Tipo Tarefa e validações (zod)
│       ├── store.ts                  # Armazenamento em memória
│       └── limites.ts                # Constantes compartilhadas (limites, página)
└── trpc/
    ├── server.tsx                    # tRPC para Server Components (sem HTTP)
    ├── client.tsx                    # Provider e hooks para o navegador
    └── query-client.ts               # Configuração do React Query
```

## API (tRPC)

Todas em `/api/trpc/tarefas.*`.

| Procedure | Tipo | Entrada | Resultado |
|---|---|---|---|
| `listar` | query | `{ limit?, cursor? }` | `{ itens, proximoCursor }` |
| `buscarPorId` | query | `{ id }` | `Tarefa` |
| `criar` | mutation | `{ titulo, descricao? }` | `Tarefa` |
| `atualizar` | mutation | `{ id, titulo, descricao? }` | `Tarefa` |
| `deletar` | mutation | `{ id }` | `{ id }` |

Modelo da tarefa: `id` (UUID gerado no servidor), `titulo` (obrigatório, até 100 caracteres), `descricao` (opcional, até 500) e `dataCriacao`.

Erros: entrada inválida retorna `BAD_REQUEST` (400) com mensagem legível, por exemplo "O título é obrigatório."; tarefa inexistente retorna `NOT_FOUND` (404).

## Principais decisões

- **SSR só da primeira página.** `page.tsx` busca a página inicial no servidor e a entrega ao cliente já hidratada (sem spinner); as demais vêm do infinite scroll. Usa `force-dynamic` para a página não ser congelada no build, já que os dados mudam.
- **Chamada direta ao router no servidor.** Nos Server Components o tRPC é chamado como função, sem passar por HTTP, o que deixa o SSR mais rápido.
- **Paginação por cursor** (`dataCriacao` + `id`), e não por offset: criar ou excluir tarefas entre duas páginas não gera itens repetidos nem pulados. O `id` desempata tarefas criadas no mesmo milissegundo.
- **Validação em duas camadas.** O formulário evita ir ao servidor com título vazio, e o backend valida de novo (o cliente nunca é confiável). As mensagens são as mesmas nos dois lados.
- **Store em `globalThis`.** Em desenvolvimento o Next pode carregar o módulo mais de uma vez; guardar o `Map` em `globalThis` garante uma única lista por processo.
- **`superjson`** para que `dataCriacao` chegue ao cliente como `Date`; a data é formatada com fuso fixo para evitar erro de hidratação.
- **Um formulário para criar e editar**, controlado por hooks (`useState`); o modo é definido pela presença da prop `tarefa`.

## Limitações conhecidas

- Os dados vivem em memória: reiniciar o servidor apaga tudo, e em deploys com várias instâncias (ou serverless) cada uma teria a sua própria lista. Para uso real, troque `src/server/tarefas/store.ts` por um banco de dados; as demais camadas não mudam.
- Não há autenticação: qualquer um pode listar, editar e excluir.
- Os testes foram feitos manualmente e por requisições HTTP; não há suíte de testes automatizados.
