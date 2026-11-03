import { ListaTarefas } from "@/components/lista-tarefas";
import { TAMANHO_PAGINA } from "@/server/tarefas/limites";
import { getQueryClient, HydrateClient, trpc } from "@/trpc/server";

// As tarefas vivem em memória e mudam a cada requisição: a página precisa ser
// renderizada no servidor a cada acesso (SSR). Sem isso o Next poderia
// pré-renderizá-la no build (SSG) e a lista ficaria congelada.
export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ salvo?: string }>;
}) {
  const { salvo } = await searchParams;

  // Busca só a PRIMEIRA página no servidor e a coloca no cache do React Query;
  // `HydrateClient` envia esse cache ao navegador, e a lista já nasce no HTML,
  // sem spinner inicial. As demais páginas vêm do infinite scroll no cliente.
  // O input precisa ser idêntico ao do cliente para que a chave de cache bata.
  await getQueryClient().prefetchInfiniteQuery(
    trpc.tarefas.listar.infiniteQueryOptions(
      { limit: TAMANHO_PAGINA },
      { getNextPageParam: (ultimaPagina) => ultimaPagina.proximoCursor },
    ),
  );

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Tarefas</h1>
      <HydrateClient>
        <ListaTarefas
          salvo={salvo === "criada" || salvo === "atualizada" ? salvo : undefined}
        />
      </HydrateClient>
    </main>
  );
}
