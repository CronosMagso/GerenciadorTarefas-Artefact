import { createTRPCRouter, publicProcedure } from "../trpc";

/**
 * Router raiz. Os routers de domínio (ex.: tarefas) serão adicionados aqui
 * nas próximas etapas. `ping` existe apenas para validar a integração.
 */
export const appRouter = createTRPCRouter({
  ping: publicProcedure.query(() => ({
    message: "pong",
    timestamp: new Date(),
  })),
});

// Apenas o tipo é exportado para o cliente: nenhum código de servidor vaza para o bundle.
export type AppRouter = typeof appRouter;
