import "server-only";

import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { cache } from "react";
import { appRouter } from "@/server/routers/_app";
import { makeQueryClient } from "./query-client";

// `cache` garante um QueryClient por requisição no servidor.
export const getQueryClient = cache(makeQueryClient);

/**
 * Proxy para uso em Server Components: chama o router diretamente
 * (sem HTTP), o que torna o SSR mais rápido que um fetch à própria API.
 */
export const trpc = createTRPCOptionsProxy({
  router: appRouter,
  ctx: async () => ({}),
  queryClient: getQueryClient,
});

/** Desidrata o cache do servidor e entrega aos Client Components. */
export function HydrateClient({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {children}
    </HydrationBoundary>
  );
}
