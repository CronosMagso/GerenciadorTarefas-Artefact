import { initTRPC } from "@trpc/server";
import superjson from "superjson";

/**
 * Inicialização do tRPC.
 * superjson permite trafegar tipos como Date entre servidor e cliente
 * sem conversão manual (ex.: `dataCriacao`).
 */
const t = initTRPC.create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const publicProcedure = t.procedure;
