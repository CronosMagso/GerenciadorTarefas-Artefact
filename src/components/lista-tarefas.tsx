"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTRPC } from "@/trpc/client";

type Feedback = { tipo: "sucesso" | "erro"; texto: string };

// Fuso fixo: com o fuso do ambiente, servidor e navegador poderiam formatar a
// data de forma diferente e causar erro de hidratação.
const formatarData = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

export function ListaTarefas() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  // Os dados já chegam hidratados do SSR (ver `page.tsx`), então não há loading inicial.
  const tarefas = useQuery(trpc.tarefas.listar.queryOptions());

  const deletar = useMutation(
    trpc.tarefas.deletar.mutationOptions({
      onSuccess: () => {
        setFeedback({ tipo: "sucesso", texto: "Tarefa excluída com sucesso." });
      },
      // Mensagem vem do backend (ex.: "Tarefa com id ... não encontrada.").
      onError: (erro) => setFeedback({ tipo: "erro", texto: erro.message }),
      // Sucesso ou erro: recarrega a lista (o 404 indica que ela já estava desatualizada).
      onSettled: () =>
        queryClient.invalidateQueries({ queryKey: trpc.tarefas.listar.queryKey() }),
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

      {tarefas.isError && (
        <div role="alert" className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          Não foi possível carregar as tarefas: {tarefas.error.message}{" "}
          <button className="underline" onClick={() => tarefas.refetch()}>
            Tentar novamente
          </button>
        </div>
      )}

      {tarefas.data?.length === 0 && (
        <p className="text-sm text-gray-500">Nenhuma tarefa cadastrada ainda.</p>
      )}

      <ul className="space-y-2">
        {tarefas.data?.map((tarefa) => {
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
              <button
                onClick={() => aoExcluir(tarefa.id, tarefa.titulo)}
                disabled={excluindo}
                className="shrink-0 rounded border border-red-300 px-3 py-1 text-sm text-red-700 hover:bg-red-50 disabled:cursor-not-allowed"
              >
                {excluindo ? "Excluindo..." : "Excluir"}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
