import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.corporacaoId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      const ficha = await prisma.fichaAPH.findUnique({
        where: { id },
        include: {
          victimas: true,
          ocorrencia: { select: { numeroSequencial: true, tipo: true } },
          viaturaEmpenhada: { include: { viatura: true } },
          preenchidoPor: { select: { nome: true } },
        },
      });
      return NextResponse.json(ficha);
    }

    const ocorrenciaId = searchParams.get("ocorrenciaId");
    if (!ocorrenciaId) {
      return NextResponse.json({ error: "ocorrenciaId é obrigatório" }, { status: 400 });
    }

    const fichas = await prisma.fichaAPH.findMany({
      where: { ocorrenciaId },
      include: {
        victimas: true,
        viaturaEmpenhada: { include: { viatura: true } },
        preenchidoPor: { select: { nome: true } },
      },
      orderBy: { numeroFicha: "asc" },
    });

    return NextResponse.json(fichas);
  } catch (error) {
    console.error("Erro ao buscar fichas APH:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.corporacaoId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const data = await req.json();
    const {
      ocorrenciaId, viaturaEmpenhadaId, numeroFicha, hora,
      localOcorrencia, bairro, municipio, uf, cepLocal, referencias,
      NaturezaChamada, NumeroSAMU, NumeroPM, NumeroPC,
      materiaisDeixados,
      caracterizacaoLocal, acidenteTrabalho, produtosPerigosos,
      tipoTrauma, violenciaTipo, quedaDetalhes, veiculosEnvolvidos, afogamentoLocal,
      nomePaciente, idadePaciente, sexoPaciente, documentoPaciente,
      enderecoPaciente, telefonePaciente, nomeMaePaciente,
      pesoPaciente, alturaPaciente, dataNascimento,
      passadoMedico, alergias, medicacoesEmUso,
      nivelConscienciaDet, posicaoPaciente, caracteristicasPele,
      viaAerea, respiracao, circulacao, pele, estadoConsciencia,
      pressaoArterial, pulso, respiracaoFrequencia, temperatura, spO2, glasgow, DorEscala,
      historicoClinico, glasgowDetalhe, avaliacaoPupilar, abdome, lesaoCervical, perfusao,
      procedimentosRealizados,
      desfecho,
      recursosAdicionais,
      hospitalDestino, horaChegadaHospital, horaEntregaPaciente, medicoRecebedor,
      dispositivoSeguranca, segurancaDetalhes, tipoEncarceramento,
      desfechoOcorrencia, destinoPaciente, testemunhas, assinaturaPreenchido,
      termoRecusa, textoRecusa,
      observacoes,
      victimas,
    } = data;

    const ultimaFicha = await prisma.fichaAPH.findFirst({
      where: { ocorrenciaId },
      orderBy: { numeroFicha: "desc" },
    });

    const numFicha = numeroFicha || `${String(parseInt(ultimaFicha?.numeroFicha || "0") + 1).padStart(3, "0")}`;

    const ficha = await prisma.fichaAPH.create({
      data: {
        ocorrenciaId,
        viaturaEmpenhadaId,
        numeroFicha: numFicha,
        hora: hora || new Date().toTimeString().slice(0, 5),
        preenchidoPorId: session.user.id,
        localOcorrencia,
        bairro,
        municipio,
        uf,
        cepLocal,
        referencias,
        NaturezaChamada,
        NumeroSAMU,
        NumeroPM,
        NumeroPC,
        materiaisDeixados,
        caracterizacaoLocal,
        acidenteTrabalho: acidenteTrabalho ?? null,
        produtosPerigosos,
        tipoTrauma,
        violenciaTipo,
        quedaDetalhes,
        veiculosEnvolvidos: veiculosEnvolvidos || null,
        afogamentoLocal,
        nomePaciente,
        idadePaciente: idadePaciente ? parseInt(String(idadePaciente)) : null,
        sexoPaciente,
        documentoPaciente,
        enderecoPaciente,
        telefonePaciente,
        nomeMaePaciente,
        pesoPaciente: pesoPaciente ? parseFloat(String(pesoPaciente)) : null,
        alturaPaciente: alturaPaciente ? parseFloat(String(alturaPaciente)) : null,
        dataNascimento,
        passadoMedico: passadoMedico || null,
        alergias,
        medicacoesEmUso,
        nivelConscienciaDet,
        posicaoPaciente,
        caracteristicasPele,
        viaAerea,
        respiracao,
        circulacao,
        pele,
        estadoConsciencia,
        pressaoArterial,
        pulso,
        respiracaoFrequencia,
        temperatura,
        spO2,
        glasgow: glasgow ? parseInt(String(glasgow)) : null,
        DorEscala: DorEscala ? parseInt(String(DorEscala)) : null,
        historicoClinico,
        glasgowDetalhe: glasgowDetalhe || null,
        avaliacaoPupilar,
        abdome,
        lesaoCervical,
        perfusao,
        procedimentosRealizados: procedimentosRealizados || [],
        desfecho: desfecho || "TRANSPORTADO",
        recursosAdicionais,
        hospitalDestino,
        horaChegadaHospital: horaChegadaHospital ? new Date(horaChegadaHospital) : null,
        horaEntregaPaciente: horaEntregaPaciente ? new Date(horaEntregaPaciente) : null,
        medicoRecebedor,
        dispositivoSeguranca: dispositivoSeguranca || "NENHUM",
        segurancaDetalhes: segurancaDetalhes || null,
        tipoEncarceramento,
        desfechoOcorrencia,
        destinoPaciente,
        testemunhas: testemunhas || null,
        assinaturaPreenchido,
        termoRecusa: termoRecusa || false,
        textoRecusa,
        observacoes,
        victimas: {
          create: victimas || [],
        },
      },
      include: { victimas: true },
    });

    return NextResponse.json(ficha);
  } catch (error) {
    console.error("Erro ao criar ficha APH:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.corporacaoId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const data = await req.json();
    const { id, ...updateData } = data;
    const { victimas, ...camposUpdate } = updateData;

    if (camposUpdate.idadePaciente) camposUpdate.idadePaciente = parseInt(String(camposUpdate.idadePaciente));
    if (camposUpdate.pesoPaciente) camposUpdate.pesoPaciente = parseFloat(String(camposUpdate.pesoPaciente));
    if (camposUpdate.alturaPaciente) camposUpdate.alturaPaciente = parseFloat(String(camposUpdate.alturaPaciente));
    if (camposUpdate.glasgow) camposUpdate.glasgow = parseInt(String(camposUpdate.glasgow));
    if (camposUpdate.DorEscala) camposUpdate.DorEscala = parseInt(String(camposUpdate.DorEscala));
    if (camposUpdate.horaChegadaHospital) camposUpdate.horaChegadaHospital = new Date(camposUpdate.horaChegadaHospital);
    if (camposUpdate.horaEntregaPaciente) camposUpdate.horaEntregaPaciente = new Date(camposUpdate.horaEntregaPaciente);

    const ficha = await prisma.fichaAPH.update({
      where: { id },
      data: camposUpdate,
      include: { victimas: true },
    });

    return NextResponse.json(ficha);
  } catch (error) {
    console.error("Erro ao atualizar ficha APH:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
