import { createTRPCRouter, publicProcedure } from "../trpc";
import { tarefasRouter } from "./tarefas";

/**
 * Router raiz. `ping` existe apenas para validar a integração.
 */
export const appRouter = createTRPCRouter({
  tarefas: tarefasRouter,
  ping: publicProcedure.query(() => ({
    message: "pong",
    timestamp: new Date(),
  })),
});

// Apenas o tipo é exportado para o cliente: nenhum código de servidor vaza para o bundle.
export type AppRouter = typeof appRouter;
