import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-2 text-2xl font-bold">Página não encontrada</h1>
      <p className="mb-4 text-sm text-gray-600">
        A página ou a tarefa que você procura não existe (ou já foi excluída).
      </p>
      <Link href="/" className="underline">
        Voltar para a lista
      </Link>
    </main>
  );
}
