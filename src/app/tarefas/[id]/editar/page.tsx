import { TRPCError } from "@trpc/server";
import { notFound } from "next/navigation";
import { FormularioTarefa } from "@/components/formulario-tarefa";
import { getQueryClient, trpc } from "@/trpc/server";

// Dados em memória e mutáveis: sempre renderizar no servidor.
export const dynamic = "force-dynamic";

export default async function EditarTarefa({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Carrega a tarefa no servidor e já entrega o formulário preenchido.
  // Id inexistente vira a página 404; outros erros continuam sendo erros.
  const tarefa = await getQueryClient()
    .fetchQuery(trpc.tarefas.buscarPorId.queryOptions({ id }))
    .catch((erro: unknown) => {
      if (erro instanceof TRPCError && erro.code === "NOT_FOUND") notFound();
      throw erro;
    });

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Editar tarefa</h1>
      <FormularioTarefa
        tarefa={{ id: tarefa.id, titulo: tarefa.titulo, descricao: tarefa.descricao }}
      />
    </main>
  );
}
