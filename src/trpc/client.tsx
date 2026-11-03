"use client";

import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import { useState } from "react";
import superjson from "superjson";
import type { AppRouter } from "@/server/routers/_app";
import { makeQueryClient } from "./query-client";

export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>();

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  // No servidor, sempre um client novo (evita vazar cache entre requisições).
  if (typeof window === "undefined") return makeQueryClient();
  // No navegador, reaproveita o mesmo client entre re-renders.
  return (browserQueryClient ??= makeQueryClient());
}

function getUrl() {
  // No navegador a URL relativa basta; no servidor (SSR do client component)
  // é preciso uma URL absoluta.
  if (typeof window !== "undefined") return "/api/trpc";
  const port = process.env.PORT ?? 3000;
  return `http://localhost:${port}/api/trpc`;
}

export function TRPCReactProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [httpBatchLink({ transformer: superjson, url: getUrl() })],
    }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TRPCProvider>
    </QueryClientProvider>
  );
}
