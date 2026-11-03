import { randomUUID } from "node:crypto";
import type { Tarefa } from "./schema";

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

export const tarefasStore = {
  /** Mais recentes primeiro. */
  listar(): Tarefa[] {
    return [...tarefas.values()].sort(
      (a, b) => b.dataCriacao.getTime() - a.dataCriacao.getTime(),
    );
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
