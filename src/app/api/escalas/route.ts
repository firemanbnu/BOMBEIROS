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
    const dataInicio = searchParams.get("dataInicio");
    const dataFim = searchParams.get("dataFim");
    const viaturaId = searchParams.get("viaturaId");

    const where: Record<string, unknown> = {
      viatura: { corporacaoId: session.user.corporacaoId },
    };

    if (dataInicio && dataFim) {
      where.dataInicio = { gte: new Date(dataInicio) };
      where.dataFim = { lte: new Date(dataFim) };
    }

    if (viaturaId) {
      where.viaturaId = viaturaId;
    }

    const escalas = await prisma.escalaServico.findMany({
      where,
      include: {
        viatura: { select: { identificacao: true, placa: true, tipo: true } },
        guarnicao: { select: { nome: true, matricula: true, funcao: true } },
      },
      orderBy: { dataInicio: "asc" },
    });

    return NextResponse.json(escalas);
  } catch (error) {
    console.error("Erro ao buscar escalas:", error);
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
    const { viaturaId, guarnicaoId, funcaoNaViatura, dataInicio, dataFim, observacoes } = data;

    if (!viaturaId || !guarnicaoId || !funcaoNaViatura || !dataInicio || !dataFim) {
      return NextResponse.json(
        { error: "Campos obrigatórios não preenchidos" },
        { status: 400 }
      );
    }

    const escala = await prisma.escalaServico.create({
      data: {
        viaturaId,
        guarnicaoId,
        funcaoNaViatura,
        dataInicio: new Date(dataInicio),
        dataFim: new Date(dataFim),
        observacoes,
        criadoPorId: session.user.id,
      },
      include: {
        viatura: { select: { identificacao: true } },
        guarnicao: { select: { nome: true } },
      },
    });

    return NextResponse.json(escala);
  } catch (error) {
    console.error("Erro ao criar escala:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.corporacaoId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    await prisma.escalaServico.delete({ where: { id: id! } });

    return NextResponse.json({ message: "Escala removida" });
  } catch (error) {
    console.error("Erro ao deletar escala:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
