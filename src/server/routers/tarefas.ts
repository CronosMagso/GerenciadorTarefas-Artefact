import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "../trpc";
import {
  atualizarTarefaInput,
  criarTarefaInput,
  listarTarefasInput,
  tarefaIdInput,
} from "../tarefas/schema";
import { tarefasStore } from "../tarefas/store";

// Erro único para "não existe", reaproveitado por buscar/atualizar/deletar.
const tarefaNaoEncontrada = (id: string) =>
  new TRPCError({
    code: "NOT_FOUND",
    message: `Tarefa com id "${id}" não encontrada.`,
  });

export const tarefasRouter = createTRPCRouter({
  // Paginada por cursor: o cliente pede `limit` itens e, para a página seguinte,
  // devolve o `proximoCursor` recebido (formato esperado por useInfiniteQuery).
  listar: publicProcedure
    .input(listarTarefasInput)
    .query(({ input }) =>
      tarefasStore.listarPagina(input.limit, input.cursor ?? undefined),
    ),

  // Usada pela tela de edição para carregar os dados atuais.
  buscarPorId: publicProcedure.input(tarefaIdInput).query(({ input }) => {
    const tarefa = tarefasStore.buscar(input.id);
    if (!tarefa) throw tarefaNaoEncontrada(input.id);
    return tarefa;
  }),

  // A validação (título obrigatório etc.) acontece no schema zod, antes do corpo rodar.
  criar: publicProcedure
    .input(criarTarefaInput)
    .mutation(({ input }) => tarefasStore.criar(input)),

  atualizar: publicProcedure
    .input(atualizarTarefaInput)
    .mutation(({ input }) => {
      const { id, ...dados } = input;
      const tarefa = tarefasStore.atualizar(id, dados);
      if (!tarefa) throw tarefaNaoEncontrada(id);
      return tarefa;
    }),

  deletar: publicProcedure.input(tarefaIdInput).mutation(({ input }) => {
    if (!tarefasStore.remover(input.id)) throw tarefaNaoEncontrada(input.id);
    return { id: input.id };
  }),
});
