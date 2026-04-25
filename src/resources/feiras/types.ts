export interface CreateFeiraDTO {
  nome: string;
  data_hora?: string | null;
  descricao?: string | null;
  localizacao?: string | null;
  image?: string | null;
  disponivel_retirada?: boolean | string | number;
}

export interface UpdateFeiraDTO {
  nome?: string;
  data_hora?: string | null;
  descricao?: string | null;
  localizacao?: string | null;
  image?: string | null;
  disponivel_retirada?: boolean | string | number;
}

export interface FeiraResponse {
  id_feira: number;
  nome: string;
  image: string | null;
  data_hora: string | null;
  descricao: string | null;
  localizacao: string | null;
}
