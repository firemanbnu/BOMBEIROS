import { NextRequest, NextResponse } from "next/server";
import { Session } from "next-auth";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

function isAdmin(session: Session | null) {
  return (session?.user as unknown as Record<string, unknown>)?.role === "ADMIN";
}

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
          viaturasEmpenhadas: { include: { viatura: true } },
          fichasAPH: { include: { victimas: true } },
          operador: { select: { nome: true } },
        },
      });
      return NextResponse.json(ocorrencia);
    }

    const where: Record<string, unknown> = {
      corporacaoId: session.user.corporacaoId,
    };
    if (status) where.status = status;

    const ocorrencias = await prisma.ocorrencia.findMany({
      where,
      include: {
        viaturasEmpenhadas: {
          include: { viatura: { select: { identificacao: true, placa: true, tipo: true } } },
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
    const { id, status, tipo, descricao, localizacao, bairro, referencias, qtdVitimas, prioridade, dataHoraChamada } = data;

    const updateData: Record<string, unknown> = {};

    if (status) updateData.status = status;

    const adminOnly = isAdmin(session);
    if (adminOnly) {
      if (tipo !== undefined) updateData.tipo = tipo;
      if (descricao !== undefined) updateData.descricao = descricao;
      if (localizacao !== undefined) updateData.localizacao = localizacao;
      if (bairro !== undefined) updateData.bairro = bairro;
      if (referencias !== undefined) updateData.referencias = referencias;
      if (qtdVitimas !== undefined) updateData.qtdVitimas = qtdVitimas;
      if (prioridade) updateData.prioridade = prioridade;
      if (dataHoraChamada) updateData.dataHoraChamada = new Date(dataHoraChamada);
    }

    if (status === "ENCERRADA") {
      const ocorrenciaCompleta = await prisma.ocorrencia.findUnique({
        where: { id },
        include: {
          fichasAPH: {
            include: { victimas: { select: { id: true } } },
          },
        },
      });

      if (!ocorrenciaCompleta) {
        return NextResponse.json({ error: "Ocorrência não encontrada" }, { status: 404 });
      }

      const totalVictimasNasFichas = ocorrenciaCompleta.fichasAPH.reduce(
        (acc, ficha) => acc + ficha.victimas.length, 0
      );

      if (ocorrenciaCompleta.qtdVitimas > 0 && totalVictimasNasFichas < ocorrenciaCompleta.qtdVitimas) {
        return NextResponse.json(
          { error: `Não é possível encerrar. Faltam fichas APH: ${totalVictimasNasFichas}/${ocorrenciaCompleta.qtdVitimas} vítimas atendidas.` },
          { status: 400 }
        );
      }

      if (ocorrenciaCompleta.fichasAPH.length === 0 && ocorrenciaCompleta.qtdVitimas > 0) {
        return NextResponse.json(
          { error: "Não é possível encerrar. Nenhuma ficha APH foi preenchida para esta ocorrência." },
          { status: 400 }
        );
      }

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

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.corporacaoId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (!isAdmin(session)) {
      return NextResponse.json({ error: "Apenas administradores podem excluir ocorrências" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    const ocorrencia = await prisma.ocorrencia.findUnique({ where: { id } });
    if (!ocorrencia || ocorrencia.corporacaoId !== session.user.corporacaoId) {
      return NextResponse.json({ error: "Ocorrência não encontrada" }, { status: 404 });
    }

    await prisma.fichaAPHVitima.deleteMany({ where: { fichaAPH: { ocorrenciaId: id } } });
    await prisma.fichaAPH.deleteMany({ where: { ocorrenciaId: id } });
    await prisma.viaturaEmpenhada.deleteMany({ where: { ocorrenciaId: id } });
    await prisma.ocorrencia.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro ao excluir ocorrência:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
