"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DESCRICAO_MAX, TITULO_MAX } from "@/server/tarefas/limites";
import { useTRPC } from "@/trpc/client";

// Formato do erro vindo do `errorFormatter` (src/server/trpc.ts). Tipado à mão
// porque o tipo inferido do cliente não inclui o campo `zodError` acrescentado lá.
type DadosDoErro = {
  zodError?: { fieldErrors: Record<string, string[] | undefined> } | null;
};

type Props = {
  /** Presente = modo edição; ausente = criação. */
  tarefa?: { id: string; titulo: string; descricao?: string };
};

export function FormularioTarefa({ tarefa }: Props) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const editando = tarefa !== undefined;

  // Estado controlado do formulário (valores iniciais vêm da tarefa, se houver).
  const [titulo, setTitulo] = useState(tarefa?.titulo ?? "");
  const [descricao, setDescricao] = useState(tarefa?.descricao ?? "");
  const [erroTitulo, setErroTitulo] = useState<string | null>(null);
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  // Criar e atualizar compartilham o mesmo fluxo de sucesso/erro.
  const opcoes = {
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: trpc.tarefas.listar.pathKey() });
      // A listagem lê `?salvo=` para exibir a mensagem de sucesso.
      router.push(`/?salvo=${editando ? "atualizada" : "criada"}`);
    },
  };
  const criar = useMutation(trpc.tarefas.criar.mutationOptions(opcoes));
  const atualizar = useMutation(trpc.tarefas.atualizar.mutationOptions(opcoes));
  const salvando = criar.isPending || atualizar.isPending;

  function aoErro(erro: { message: string; data?: unknown }) {
    // Erro de validação do backend em um campo específico vai junto do input;
    // qualquer outro (ex.: tarefa inexistente, rede) vai para a faixa geral.
    const erroDoCampo = (erro.data as DadosDoErro | undefined)?.zodError?.fieldErrors.titulo?.[0];
    if (erroDoCampo) setErroTitulo(erroDoCampo);
    else setErroGeral(erro.message);
  }

  function aoEnviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErroGeral(null);

    // Validação no frontend: evita a ida ao servidor quando o título está vazio.
    // O backend valida de novo, pois o cliente nunca é confiável.
    const tituloLimpo = titulo.trim();
    if (!tituloLimpo) {
      setErroTitulo("O título é obrigatório.");
      return;
    }
    setErroTitulo(null);

    const dados = { titulo: tituloLimpo, descricao: descricao.trim() || undefined };
    if (editando) atualizar.mutate({ id: tarefa.id, ...dados }, { onError: aoErro });
    else criar.mutate(dados, { onError: aoErro });
  }

  return (
    // noValidate: as mensagens exibidas são as nossas, não as do navegador.
    <form onSubmit={aoEnviar} noValidate className="space-y-4">
      {erroGeral && (
        <div role="alert" className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          {erroGeral}
        </div>
      )}

      <div>
        <label htmlFor="titulo" className="block text-sm font-medium">
          Título *
        </label>
        <input
          id="titulo"
          value={titulo}
          onChange={(e) => {
            setTitulo(e.target.value);
            if (erroTitulo) setErroTitulo(null);
          }}
          maxLength={TITULO_MAX}
          aria-invalid={erroTitulo !== null}
          aria-describedby={erroTitulo ? "erro-titulo" : undefined}
          className={`mt-1 w-full rounded border px-3 py-2 ${
            erroTitulo ? "border-red-500" : "border-gray-300"
          }`}
        />
        {erroTitulo && (
          <p id="erro-titulo" className="mt-1 text-sm text-red-700">
            {erroTitulo}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="descricao" className="block text-sm font-medium">
          Descrição
        </label>
        <textarea
          id="descricao"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          maxLength={DESCRICAO_MAX}
          rows={4}
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={salvando}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {salvando ? "Salvando..." : editando ? "Salvar alterações" : "Criar tarefa"}
        </button>
        <Link href="/" className="rounded border border-gray-300 px-4 py-2 hover:bg-gray-50">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
