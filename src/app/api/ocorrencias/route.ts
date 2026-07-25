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
    const status = searchParams.get("status");
    const id = searchParams.get("id");

    if (id) {
      const ocorrencia = await prisma.ocorrencia.findUnique({
        where: { id },
        include: {
          viaturasEmpenhadas: {
            include: {
              viatura: true,
            },
          },
          fichasAPH: {
            include: { victimas: true },
          },
          operador: { select: { nome: true } },
        },
      });
      return NextResponse.json(ocorrencia);
    }

    const where: Record<string, unknown> = {
      corporacaoId: session.user.corporacaoId,
    };

    if (status) {
      where.status = status;
    }

    const ocorrencias = await prisma.ocorrencia.findMany({
      where,
      include: {
        viaturasEmpenhadas: {
          include: {
            viatura: { select: { identificacao: true, placa: true, tipo: true } },
          },
        },
        fichasAPH: {
          include: { victimas: { select: { id: true } } },
        },
      },
      orderBy: { dataHoraChamada: "desc" },
    });

    return NextResponse.json(ocorrencias);
  } catch (error) {
    console.error("Erro ao buscar ocorrências:", error);
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
      tipo, descricao, localizacao, bairro, referencias,
      qtdVitimas, prioridade, dataHoraChamada,
    } = data;

    if (!tipo || !dataHoraChamada) {
      return NextResponse.json(
        { error: "Tipo e data/hora da chamada são obrigatórios" },
        { status: 400 }
      );
    }

    // Gerar número sequencial
    const ultimaOcorrencia = await prisma.ocorrencia.findFirst({
      where: { corporacaoId: session.user.corporacaoId },
      orderBy: { numeroSequencial: "desc" },
    });

    const numeroSequencial = (ultimaOcorrencia?.numeroSequencial || 0) + 1;

    const ocorrencia = await prisma.ocorrencia.create({
      data: {
        corporacaoId: session.user.corporacaoId,
        numeroSequencial,
        tipo,
        descricao,
        localizacao,
        bairro,
        referencias,
        qtdVitimas: qtdVitimas || 0,
        prioridade: prioridade || "MEDIA",
        dataHoraChamada: new Date(dataHoraChamada),
        operadorId: session.user.id,
      },
    });

    return NextResponse.json(ocorrencia);
  } catch (error) {
    console.error("Erro ao criar ocorrência:", error);
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
    const { id, status, descricao, localizacao, bairro, referencias, qtdVitimas, prioridade } = data;

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (descricao !== undefined) updateData.descricao = descricao;
    if (localizacao !== undefined) updateData.localizacao = localizacao;
    if (bairro !== undefined) updateData.bairro = bairro;
    if (referencias !== undefined) updateData.referencias = referencias;
    if (qtdVitimas !== undefined) updateData.qtdVitimas = qtdVitimas;
    if (prioridade) updateData.prioridade = prioridade;

    if (status === "ENCERRADA") {
      updateData.dataHoraFechamento = new Date();
    }

    const ocorrencia = await prisma.ocorrencia.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(ocorrencia);
  } catch (error) {
    console.error("Erro ao atualizar ocorrência:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
