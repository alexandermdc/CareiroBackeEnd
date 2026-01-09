export interface CreateFeiraDTO {
  nome: string;
  image?: string;
  data_hora?: string;
  descricao?: string;
  localizacao?: string;
}

export interface UpdateFeiraDTO {
  id_feira: number;
  nome?: string;
  image?: string;
  data_hora?: string;
  descricao?: string;
  localizacao?: string;
}

export interface FeiraResponse {
  id_feira: number;
  nome: string;
  image: string | null;
  data_hora: string | null;
  descricao: string | null;
  localizacao: string | null;
}
