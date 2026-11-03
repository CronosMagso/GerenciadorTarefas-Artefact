"use client";

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { TAMANHO_PAGINA } from "@/server/tarefas/limites";
import { useTRPC } from "@/trpc/client";

type Feedback = { tipo: "sucesso" | "erro"; texto: string };

// Fuso fixo: com o fuso do ambiente, servidor e navegador poderiam formatar a
// data de forma diferente e causar erro de hidratação.
const formatarData = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

const MENSAGENS_SALVO = {
  criada: "Tarefa criada com sucesso.",
  atualizada: "Tarefa atualizada com sucesso.",
} as const;

type Props = {
  /** Vem de `?salvo=` quando o usuário acaba de criar/editar uma tarefa. */
  salvo?: keyof typeof MENSAGENS_SALVO;
};

export function ListaTarefas({ salvo }: Props) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<Feedback | null>(
    salvo ? { tipo: "sucesso", texto: MENSAGENS_SALVO[salvo] } : null,
  );

  // Remove `?salvo=` da URL para a mensagem não reaparecer ao recarregar a página.
  useEffect(() => {
    if (salvo) window.history.replaceState(null, "", "/");
  }, [salvo]);

  // A primeira página já chega hidratada do SSR (ver `page.tsx`), então não há
  // loading inicial. As próximas são pedidas pelo infinite scroll abaixo.
  const consulta = useInfiniteQuery(
    trpc.tarefas.listar.infiniteQueryOptions(
      { limit: TAMANHO_PAGINA },
      { getNextPageParam: (ultimaPagina) => ultimaPagina.proximoCursor },
    ),
  );
  const tarefas = consulta.data?.pages.flatMap((pagina) => pagina.itens);

  // Elemento "sentinela" no fim da lista: quando ele entra na tela, carrega a próxima página.
  const sentinela = useRef<HTMLDivElement>(null);
  const { hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage } =
    consulta;
  useEffect(() => {
    const elemento = sentinela.current;
    // Após uma falha, não tenta sozinho (evitaria um laço de requisições):
    // o usuário decide com o botão "Tentar novamente".
    if (!elemento || !hasNextPage || isFetchingNextPage || isFetchNextPageError) return;
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) fetchNextPage();
      },
      { rootMargin: "200px" }, // começa a carregar um pouco antes de chegar ao fim
    );
    observador.observe(elemento);
    return () => observador.disconnect();
  }, [hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage]);

  const deletar = useMutation(
    trpc.tarefas.deletar.mutationOptions({
      onSuccess: () => {
        setFeedback({ tipo: "sucesso", texto: "Tarefa excluída com sucesso." });
      },
      // Mensagem vem do backend (ex.: "Tarefa com id ... não encontrada.").
      onError: (erro) => setFeedback({ tipo: "erro", texto: erro.message }),
      // Sucesso ou erro: recarrega a lista (o 404 indica que ela já estava desatualizada).
      onSettled: () =>
        queryClient.invalidateQueries({ queryKey: trpc.tarefas.listar.pathKey() }),
    }),
  );

  // Mensagem de sucesso some sozinha; a de erro fica até a próxima ação.
  useEffect(() => {
    if (feedback?.tipo !== "sucesso") return;
    const timer = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timer);
  }, [feedback]);

  function aoExcluir(id: string, titulo: string) {
    if (!window.confirm(`Excluir a tarefa "${titulo}"?`)) return;
    setFeedback(null);
    deletar.mutate({ id });
  }

  return (
    <section className="space-y-4">
      <Link
        href="/tarefas/nova"
        className="inline-block rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
      >
        Nova tarefa
      </Link>

      {feedback && (
        <div
          role={feedback.tipo === "erro" ? "alert" : "status"}
          className={`rounded border px-3 py-2 text-sm ${
            feedback.tipo === "erro"
              ? "border-red-300 bg-red-50 text-red-800"
              : "border-green-300 bg-green-50 text-green-800"
          }`}
        >
          {feedback.texto}
        </div>
      )}

      {/* Falha ao carregar a lista inicial (a de páginas seguintes é tratada abaixo). */}
      {consulta.isError && !isFetchNextPageError && (
        <div role="alert" className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          Não foi possível carregar as tarefas: {consulta.error.message}{" "}
          <button className="underline" onClick={() => consulta.refetch()}>
            Tentar novamente
          </button>
        </div>
      )}

      {tarefas?.length === 0 && (
        <p className="text-sm text-gray-500">Nenhuma tarefa cadastrada ainda.</p>
      )}

      <ul className="space-y-2">
        {tarefas?.map((tarefa) => {
          const excluindo = deletar.isPending && deletar.variables?.id === tarefa.id;
          return (
            <li
              key={tarefa.id}
              className={`flex items-start justify-between gap-4 rounded border border-gray-300 p-3 ${
                excluindo ? "opacity-50" : ""
              }`}
            >
              <div className="min-w-0">
                <h2 className="font-semibold break-words">{tarefa.titulo}</h2>
                {tarefa.descricao && (
                  <p className="text-sm text-gray-600 break-words">{tarefa.descricao}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Criada em {formatarData.format(tarefa.dataCriacao)}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Link
                  href={`/tarefas/${tarefa.id}/editar`}
                  className="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
                >
                  Editar
                </Link>
                <button
                  onClick={() => aoExcluir(tarefa.id, tarefa.titulo)}
                  disabled={excluindo}
                  className="rounded border border-red-300 px-3 py-1 text-sm text-red-700 hover:bg-red-50 disabled:cursor-not-allowed"
                >
                  {excluindo ? "Excluindo..." : "Excluir"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Rodapé do infinite scroll: sentinela + estados de carregamento/erro. */}
      <div ref={sentinela} className="py-2 text-center text-sm text-gray-500">
        {isFetchingNextPage && <p role="status">Carregando mais tarefas...</p>}
        {isFetchNextPageError && (
          <p role="alert" className="text-red-700">
            Não foi possível carregar mais tarefas.{" "}
            <button className="underline" onClick={() => fetchNextPage()}>
              Tentar novamente
            </button>
          </p>
        )}
        {!hasNextPage && tarefas && tarefas.length > TAMANHO_PAGINA && (
          <p>Todas as tarefas foram carregadas.</p>
        )}
      </div>
    </section>
  );
}
