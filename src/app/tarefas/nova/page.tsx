import { FormularioTarefa } from "@/components/formulario-tarefa";

export default function NovaTarefa() {
  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Nova tarefa</h1>
      <FormularioTarefa />
    </main>
  );
}
