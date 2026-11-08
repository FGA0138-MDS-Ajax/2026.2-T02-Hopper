export type Perfil = 'ALUNO' | 'PROFESSOR' | 'ADMIN';
export type Modalidade = 'ONLINE' | 'PRESENCIAL' | 'DOMICILIO';
export type StatusAula =
  'SOLICITADA' | 'CONFIRMADA' | 'RECUSADA' | 'REMARCADA' | 'CANCELADA' | 'REALIZADA';
export type TipoNotificacao =
  'SOLICITACAO' | 'CONFIRMACAO' | 'RECUSA' | 'REMARCACAO' | 'CANCELAMENTO' | 'LEMBRETE';

export interface UsuarioAutenticado {
  id: string;
  perfil: Perfil;
}

export interface UsuarioPublico {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  perfil: Perfil;
}

export interface Intervalo {
  inicio: Date;
  fim: Date;
}

export interface FaixaHoraria {
  diaSemana: number;
  horaInicio: string;
  horaFim: string;
}

export interface Paginacao {
  pagina: number;
  limite: number;
  pular: number;
}

export interface Pagina<T> {
  itens: T[];
  total: number;
  pagina: number;
}
