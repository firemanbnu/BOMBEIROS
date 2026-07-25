export type OcorrenciaComRelacoes = {
  id: string;
  numeroSequencial: number;
  tipo: string;
  status: string;
  prioridade: string;
  descricao: string | null;
  localizacao: string | null;
  bairro: string | null;
  referencias: string | null;
  qtdVitimas: number;
  dataHoraChamada: Date;
  dataHoraAbertura: Date;
  dataHoraFechamento: Date | null;
  viaturasEmpenhadas: ViaturaEmpenhadaComRelacoes[];
  fichasAPH: FichaAPHResumo[];
};

export type ViaturaEmpenhadaComRelacoes = {
  id: string;
  viatura: {
    id: string;
    identificacao: string;
    placa: string;
    tipo: string;
  };
  horaAcionamento: Date | null;
  horaChegadaLocal: Date | null;
  horaTermino: Date | null;
  horaChegadaQuartel: Date | null;
  horaDeslocamentoHospital: Date | null;
  horaChegadaHospital: Date | null;
  status: string;
};

export type FichaAPHResumo = {
  id: string;
  numeroFicha: string;
  victimas: { id: string }[];
};

export type Usuario = {
  id: string;
  nome: string;
  email: string;
  role: string;
  corporacaoId: string;
};

export type Viatura = {
  id: string;
  placa: string;
  identificacao: string;
  tipo: string;
  capacidadeGuarnicao: number;
  equipamentoAPH: boolean;
  ativo: boolean;
};

export type Guarnicao = {
  id: string;
  nome: string;
  matricula: string;
  funcao: string;
  habilitacoes: string[];
  ativo: boolean;
};

export type Corporacao = {
  id: string;
  nome: string;
  cnpj: string | null;
  nomeFantasia: string | null;
  logoUrl: string | null;
  corPrimaria: string;
  corSecundaria: string;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  telefone: string | null;
  email: string | null;
};
