-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'CHEFE_SERVICO', 'OPERADOR', 'SOCORRISTA');

-- CreateEnum
CREATE TYPE "TipoViatura" AS ENUM ('ASU', 'ABT', 'ABTC', 'APH', 'CAVALO_MECANICO', 'CAPOEIRA', 'MOTORREDATOR', 'SOCORRO_RAPIDO', 'OUTROS');

-- CreateEnum
CREATE TYPE "FuncaoGuarnicao" AS ENUM ('COMANDANTE', 'SOCORRISTA_1', 'SOCORRISTA_2', 'SOCORRISTA_3', 'MOTORISTA', 'BOMBEIRO');

-- CreateEnum
CREATE TYPE "FuncaoNaViatura" AS ENUM ('CMT', 'S1', 'S2', 'S3', 'MOTORISTA_ESC');

-- CreateEnum
CREATE TYPE "TipoOcorrencia" AS ENUM ('INCENDIO', 'RESGATE', 'APH', 'BUSCA_SALVAMENTO', 'PREVENCAO', 'ALAGAMENTO', 'DESABAMENTO', 'OUTROS');

-- CreateEnum
CREATE TYPE "StatusOcorrencia" AS ENUM ('ABERTA', 'EM_ATENDIMENTO', 'ENCERRADA');

-- CreateEnum
CREATE TYPE "Prioridade" AS ENUM ('ALTA', 'MEDIA', 'BAIXA');

-- CreateEnum
CREATE TYPE "StatusEmpenho" AS ENUM ('ACIONADA', 'A_CENA', 'EM_ATENDIMENTO', 'RETORNO', 'NO_QUARTEL', 'DESPACHADA');

-- CreateEnum
CREATE TYPE "DesfechoAPH" AS ENUM ('TRANSPORTADO', 'NAO_TRANSPORTADO', 'OBITO', 'RECUSA', 'DISPENSA');

-- CreateEnum
CREATE TYPE "DispositivoSeguranca" AS ENUM ('CINTO', 'CADEIRINHA', 'BEBE_CONCHINHA', 'NENHUM', 'OUTRO');

-- CreateTable
CREATE TABLE "corporacoes" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT,
    "nomeFantasia" TEXT,
    "endereco" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "cep" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "logoUrl" TEXT,
    "corPrimaria" TEXT NOT NULL DEFAULT '#DC2626',
    "corSecundaria" TEXT NOT NULL DEFAULT '#1E3A5F',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "corporacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "corporacaoId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'SOCORRISTA',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "viaturas" (
    "id" TEXT NOT NULL,
    "corporacaoId" TEXT NOT NULL,
    "placa" TEXT NOT NULL,
    "identificacao" TEXT NOT NULL,
    "tipo" "TipoViatura" NOT NULL,
    "capacidadeGuarnicao" INTEGER NOT NULL DEFAULT 3,
    "equipamentoAPH" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "viaturas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guarnicoes" (
    "id" TEXT NOT NULL,
    "corporacaoId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "matricula" TEXT NOT NULL,
    "funcao" "FuncaoGuarnicao" NOT NULL,
    "habilitacoes" JSONB NOT NULL DEFAULT '[]',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guarnicoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escalas_servico" (
    "id" TEXT NOT NULL,
    "viaturaId" TEXT NOT NULL,
    "guarnicaoId" TEXT NOT NULL,
    "funcaoNaViatura" "FuncaoNaViatura" NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3) NOT NULL,
    "observacoes" TEXT,
    "criadoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "escalas_servico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ocorrencias" (
    "id" TEXT NOT NULL,
    "corporacaoId" TEXT NOT NULL,
    "numeroSequencial" INTEGER NOT NULL,
    "tipo" "TipoOcorrencia" NOT NULL,
    "status" "StatusOcorrencia" NOT NULL DEFAULT 'ABERTA',
    "prioridade" "Prioridade" NOT NULL DEFAULT 'MEDIA',
    "descricao" TEXT,
    "localizacao" TEXT,
    "bairro" TEXT,
    "referencias" TEXT,
    "qtdVitimas" INTEGER NOT NULL DEFAULT 0,
    "dataHoraChamada" TIMESTAMP(3) NOT NULL,
    "dataHoraAbertura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataHoraFechamento" TIMESTAMP(3),
    "operadorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ocorrencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "viaturas_empenhadas" (
    "id" TEXT NOT NULL,
    "ocorrenciaId" TEXT NOT NULL,
    "viaturaId" TEXT NOT NULL,
    "horaAcionamento" TIMESTAMP(3),
    "horaChegadaLocal" TIMESTAMP(3),
    "horaTermino" TIMESTAMP(3),
    "horaChegadaQuartel" TIMESTAMP(3),
    "horaDeslocamentoHospital" TIMESTAMP(3),
    "horaChegadaHospital" TIMESTAMP(3),
    "status" "StatusEmpenho" NOT NULL DEFAULT 'ACIONADA',
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "viaturas_empenhadas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fichas_aph" (
    "id" TEXT NOT NULL,
    "ocorrenciaId" TEXT NOT NULL,
    "viaturaEmpenhadaId" TEXT NOT NULL,
    "numeroFicha" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hora" TEXT NOT NULL,
    "preenchidoPorId" TEXT NOT NULL,
    "guarnicaoId" TEXT,
    "assinaturaUrl" TEXT,
    "localOcorrencia" TEXT,
    "municipio" TEXT,
    "uf" TEXT,
    "cepLocal" TEXT,
    "NaturezaChamada" TEXT,
    "NumeroSAMU" TEXT,
    "NumeroPM" TEXT,
    "NumeroPC" TEXT,
    "materiaisDeixados" TEXT,
    "nomePaciente" TEXT,
    "idadePaciente" INTEGER,
    "sexoPaciente" TEXT,
    "documentoPaciente" TEXT,
    "enderecoPaciente" TEXT,
    "telefonePaciente" TEXT,
    "nomeMaePaciente" TEXT,
    "pesoPaciente" DOUBLE PRECISION,
    "alturaPaciente" DOUBLE PRECISION,
    "viaAerea" TEXT,
    "respiracao" TEXT,
    "circulacao" TEXT,
    "pele" TEXT,
    "estadoConsciencia" TEXT,
    "pressaoArterial" TEXT,
    "pulso" TEXT,
    "respiracaoFrequencia" TEXT,
    "temperatura" TEXT,
    "spO2" TEXT,
    "glasgow" INTEGER,
    "DorEscala" INTEGER,
    "historicoClinico" TEXT,
    "procedimentosRealizados" JSONB NOT NULL DEFAULT '[]',
    "desfecho" "DesfechoAPH" NOT NULL DEFAULT 'TRANSPORTADO',
    "recursosAdicionais" TEXT,
    "hospitalDestino" TEXT,
    "horaChegadaHospital" TIMESTAMP(3),
    "horaEntregaPaciente" TIMESTAMP(3),
    "medicoRecebedor" TEXT,
    "dispositivoSeguranca" "DispositivoSeguranca" NOT NULL DEFAULT 'NENHUM',
    "termoRecusa" BOOLEAN NOT NULL DEFAULT false,
    "textoRecusa" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fichas_aph_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fichas_aph_vitimas" (
    "id" TEXT NOT NULL,
    "fichaAPHId" TEXT NOT NULL,
    "nomeVitima" TEXT,
    "idadeVitima" INTEGER,
    "sexoVitima" TEXT,
    "documentoVitima" TEXT,
    "queixaPrincipal" TEXT,
    "alergias" TEXT,
    "medicacoes" TEXT,
    "pressaoArterial" TEXT,
    "pulso" TEXT,
    "respiracao" TEXT,
    "temperatura" TEXT,
    "spO2" TEXT,
    "glasgow" INTEGER,
    "procedimentos" JSONB NOT NULL DEFAULT '[]',
    "desfecho" TEXT,
    "hospitalDestino" TEXT,
    "horaTransporte" TIMESTAMP(3),
    "horaChegadaHospital" TIMESTAMP(3),
    "dispositivoSeguranca" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fichas_aph_vitimas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "corporacoes_cnpj_key" ON "corporacoes"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "viaturas_corporacaoId_placa_key" ON "viaturas"("corporacaoId", "placa");

-- CreateIndex
CREATE UNIQUE INDEX "viaturas_corporacaoId_identificacao_key" ON "viaturas"("corporacaoId", "identificacao");

-- CreateIndex
CREATE UNIQUE INDEX "guarnicoes_corporacaoId_matricula_key" ON "guarnicoes"("corporacaoId", "matricula");

-- CreateIndex
CREATE UNIQUE INDEX "ocorrencias_corporacaoId_numeroSequencial_key" ON "ocorrencias"("corporacaoId", "numeroSequencial");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_corporacaoId_fkey" FOREIGN KEY ("corporacaoId") REFERENCES "corporacoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viaturas" ADD CONSTRAINT "viaturas_corporacaoId_fkey" FOREIGN KEY ("corporacaoId") REFERENCES "corporacoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guarnicoes" ADD CONSTRAINT "guarnicoes_corporacaoId_fkey" FOREIGN KEY ("corporacaoId") REFERENCES "corporacoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escalas_servico" ADD CONSTRAINT "escalas_servico_viaturaId_fkey" FOREIGN KEY ("viaturaId") REFERENCES "viaturas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escalas_servico" ADD CONSTRAINT "escalas_servico_guarnicaoId_fkey" FOREIGN KEY ("guarnicaoId") REFERENCES "guarnicoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocorrencias" ADD CONSTRAINT "ocorrencias_corporacaoId_fkey" FOREIGN KEY ("corporacaoId") REFERENCES "corporacoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocorrencias" ADD CONSTRAINT "ocorrencias_operadorId_fkey" FOREIGN KEY ("operadorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viaturas_empenhadas" ADD CONSTRAINT "viaturas_empenhadas_ocorrenciaId_fkey" FOREIGN KEY ("ocorrenciaId") REFERENCES "ocorrencias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viaturas_empenhadas" ADD CONSTRAINT "viaturas_empenhadas_viaturaId_fkey" FOREIGN KEY ("viaturaId") REFERENCES "viaturas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fichas_aph" ADD CONSTRAINT "fichas_aph_ocorrenciaId_fkey" FOREIGN KEY ("ocorrenciaId") REFERENCES "ocorrencias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fichas_aph" ADD CONSTRAINT "fichas_aph_viaturaEmpenhadaId_fkey" FOREIGN KEY ("viaturaEmpenhadaId") REFERENCES "viaturas_empenhadas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fichas_aph" ADD CONSTRAINT "fichas_aph_preenchidoPorId_fkey" FOREIGN KEY ("preenchidoPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fichas_aph" ADD CONSTRAINT "fichas_aph_guarnicaoId_fkey" FOREIGN KEY ("guarnicaoId") REFERENCES "guarnicoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fichas_aph_vitimas" ADD CONSTRAINT "fichas_aph_vitimas_fichaAPHId_fkey" FOREIGN KEY ("fichaAPHId") REFERENCES "fichas_aph"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
