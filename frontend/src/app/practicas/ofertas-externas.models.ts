export type OfertaExterna = {
  id: string;
  fuente: string;
  titulo: string;
  empresaNombre: string | null;
  localidad: string | null;
  region: string | null;
  descripcion: string | null;
  categoria: string | null;
  contratoTipo: string | null;
  jornada: string | null;
  salarioMinimo: number | null;
  salarioMaximo: number | null;
  salarioEstimado: boolean | null;
  publicadoEn: string | null;
  urlAplicacion: string;
};

export type OfertaExternaPage = {
  results: OfertaExterna[];
  page: number;
  resultsPerPage: number;
  totalResults: number;
  attribution: string;
  attributionUrl: string;
};

export type OfertaExternaFilters = {
  q?: string;
  where?: string;
  category?: string;
  page?: number;
  resultsPerPage?: number;
};
