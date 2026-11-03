import { createTRPCRouter } from "../trpc";
import { tarefasRouter } from "./tarefas";

/** Router raiz: cada domínio da API entra aqui como um sub-router. */
export const appRouter = createTRPCRouter({
  tarefas: tarefasRouter,
});

// Apenas o tipo é exportado para o cliente: nenhum código de servidor vaza para o bundle.
export type AppRouter = typeof appRouter;
