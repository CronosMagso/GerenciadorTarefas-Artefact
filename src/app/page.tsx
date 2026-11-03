import { ListaTarefas } from "@/components/lista-tarefas";
import { getQueryClient, HydrateClient, trpc } from "@/trpc/server";

// As tarefas vivem em memória e mudam a cada requisição: a página precisa ser
// renderizada no servidor a cada acesso (SSR). Sem isso o Next poderia
// pré-renderizá-la no build (SSG) e a lista ficaria congelada.
export const dynamic = "force-dynamic";

export default async function Home() {
  // Busca no servidor e coloca no cache do React Query; `HydrateClient` envia
  // esse cache ao navegador, e a lista já nasce no HTML, sem spinner inicial.
  await getQueryClient().prefetchQuery(trpc.tarefas.listar.queryOptions());

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Tarefas</h1>
      <HydrateClient>
        <ListaTarefas />
      </HydrateClient>
    </main>
  );
}
