import { randomUUID } from "node:crypto";
import type { Cursor, Tarefa } from "./schema";

/**
 * Armazenamento em memória (sem banco, conforme o enunciado).
 *
 * Fica em `globalThis` de propósito: em desenvolvimento o Next pode carregar
 * este módulo mais de uma vez (route handler e Server Components são
 * compilados separadamente, e o hot reload recarrega módulos). Sem isso, cada
 * instância teria a sua própria lista e as tarefas "sumiriam" entre telas.
 * Os dados são perdidos ao reiniciar o servidor, o que é esperado aqui.
 */
const globalParaStore = globalThis as unknown as { __tarefas?: Map<string, Tarefa> };
const tarefas = (globalParaStore.__tarefas ??= new Map<string, Tarefa>());

// Mais recentes primeiro; o id desempata tarefas criadas no mesmo milissegundo,
// garantindo uma ordem total (necessária para o cursor).
const ordem = (a: Cursor, b: Cursor) =>
  b.dataCriacao.getTime() - a.dataCriacao.getTime() ||
  (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

export const tarefasStore = {
  /**
   * Uma página de tarefas, mais recentes primeiro. `proximoCursor` é
   * `undefined` na última página.
   */
  listarPagina(limite: number, cursor?: Cursor) {
    const ordenadas = [...tarefas.values()].sort(ordem);
    // Só o que vem DEPOIS do cursor na ordenação. Como o cursor é uma posição,
    // continua válido mesmo que o item que o originou tenha sido excluído.
    const restantes = cursor
      ? ordenadas.filter((tarefa) => ordem(tarefa, cursor) > 0)
      : ordenadas;
    const itens = restantes.slice(0, limite);
    const ultimo = itens.at(-1);
    const proximoCursor: Cursor | undefined =
      ultimo && restantes.length > limite
        ? { dataCriacao: ultimo.dataCriacao, id: ultimo.id }
        : undefined;
    return { itens, proximoCursor };
  },

  buscar(id: string): Tarefa | undefined {
    return tarefas.get(id);
  },

  criar(dados: Pick<Tarefa, "titulo" | "descricao">): Tarefa {
    const tarefa: Tarefa = { id: randomUUID(), ...dados, dataCriacao: new Date() };
    tarefas.set(tarefa.id, tarefa);
    return tarefa;
  },

  /**
   * Substitui os campos editáveis (omitir `descricao` a remove).
   * Retorna `undefined` se a tarefa não existe. Preserva `id` e `dataCriacao`.
   */
  atualizar(
    id: string,
    dados: Pick<Tarefa, "titulo" | "descricao">,
  ): Tarefa | undefined {
    const atual = tarefas.get(id);
    if (!atual) return undefined;
    const atualizada: Tarefa = {
      id: atual.id,
      dataCriacao: atual.dataCriacao,
      titulo: dados.titulo,
      descricao: dados.descricao,
    };
    tarefas.set(id, atualizada);
    return atualizada;
  },

  /** Retorna `false` se a tarefa não existia. */
  remover(id: string): boolean {
    return tarefas.delete(id);
  },
};
