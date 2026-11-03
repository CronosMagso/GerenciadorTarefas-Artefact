// Fora do schema.ts de propósito: o formulário (client) usa os mesmos limites
// no `maxLength` dos inputs sem precisar embutir o zod no bundle do navegador.
export const TITULO_MAX = 100;
export const DESCRICAO_MAX = 500;

// Paginação da listagem (infinite scroll). O tamanho da página é compartilhado
// porque a página SSR e o cliente precisam pedir exatamente a mesma query.
export const TAMANHO_PAGINA = 10;
export const LIMITE_MAXIMO_PAGINA = 50;
