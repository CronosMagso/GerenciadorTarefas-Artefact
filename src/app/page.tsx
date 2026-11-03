import { getQueryClient, trpc } from "@/trpc/server";

// Página provisória: valida a ligação Next + tRPC. Será substituída pela listagem.
export default async function Home() {
  const ping = await getQueryClient().fetchQuery(trpc.ping.queryOptions());

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Gerenciador de Tarefas</h1>
      <p className="mt-2 text-sm">
        tRPC: {ping.message} ({ping.timestamp.toISOString()})
      </p>
    </main>
  );
}
