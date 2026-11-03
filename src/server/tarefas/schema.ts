import { z } from "zod";
import {
  DESCRICAO_MAX,
  LIMITE_MAXIMO_PAGINA,
  TAMANHO_PAGINA,
  TITULO_MAX,
} from "./limites";

/**
 * Entidade Tarefa. Os nomes dos campos seguem o enunciado (pt-BR).
 * `descricao` é opcional e `dataCriacao` é preenchida pelo servidor.
 */
export type Tarefa = {
  id: string;
  titulo: string;
  descricao?: string;
  dataCriacao: Date;
};

// Campos editáveis, compartilhados entre criação e atualização.
// `trim()` roda antes do `min(1)`, então um título só com espaços também é recusado.
const camposEditaveis = {
  titulo: z
    .string({ error: "O título é obrigatório." })
    .trim()
    .min(1, "O título é obrigatório.")
    .max(TITULO_MAX, `O título deve ter no máximo ${TITULO_MAX} caracteres.`),
  descricao: z
    .string()
    .trim()
    .max(
      DESCRICAO_MAX,
      `A descrição deve ter no máximo ${DESCRICAO_MAX} caracteres.`,
    )
    .optional(),
};

export const criarTarefaInput = z.object(camposEditaveis);

// Atualização é uma substituição completa dos campos editáveis (como um formulário de edição).
export const atualizarTarefaInput = z.object({
  id: z.string().min(1, "O id é obrigatório."),
  ...camposEditaveis,
});

export const tarefaIdInput = z.object({
  id: z.string().min(1, "O id é obrigatório."),
});

/**
 * Cursor da paginação: a posição (dataCriacao + id) do último item recebido.
 * Guardar a posição, e não um número de página/offset, evita itens repetidos
 * ou pulados quando alguém cria ou exclui tarefas entre uma página e outra.
 */
export const cursorSchema = z.object({ dataCriacao: z.date(), id: z.string() });
export type Cursor = z.infer<typeof cursorSchema>;

export const listarTarefasInput = z.object({
  limit: z.number().int().min(1).max(LIMITE_MAXIMO_PAGINA).default(TAMANHO_PAGINA),
  cursor: cursorSchema.nullish(),
});
