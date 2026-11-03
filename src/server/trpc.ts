import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { z, ZodError } from "zod";

/**
 * Inicialização do tRPC.
 * superjson permite trafegar tipos como Date entre servidor e cliente
 * sem conversão manual (ex.: `dataCriacao`).
 */
const t = initTRPC.create({
  transformer: superjson,
  // Por padrão a `message` de um erro de validação é um dump JSON dos issues
  // do zod. Aqui ela vira a primeira mensagem legível, e os erros por campo
  // (`zodError.fieldErrors`) ficam disponíveis para o formulário mostrar
  // "O título é obrigatório." junto do input certo.
  errorFormatter({ shape, error }) {
    const zodError =
      error.cause instanceof ZodError ? z.flattenError(error.cause) : null;
    const primeiroErro = zodError && Object.values(zodError.fieldErrors).flat()[0];
    return {
      ...shape,
      message: primeiroErro ?? shape.message,
      data: { ...shape.data, zodError },
    };
  },
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
