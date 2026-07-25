import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.corporacaoId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const viaturas = await prisma.viatura.findMany({
      where: { corporacaoId: session.user.corporacaoId },
      orderBy: { identificacao: "asc" },
    });

    return NextResponse.json(viaturas);
  } catch (error) {
    console.error("Erro ao buscar viaturas:", error);
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
    const { placa, identificacao, tipo, capacidadeGuarnicao, equipamentoAPH } = data;

    if (!placa || !identificacao || !tipo) {
      return NextResponse.json(
        { error: "Campos obrigatórios não preenchidos" },
        { status: 400 }
      );
    }

    const viatura = await prisma.viatura.create({
      data: {
        corporacaoId: session.user.corporacaoId,
        placa: placa.toUpperCase(),
        identificacao: identificacao.toUpperCase(),
        tipo,
        capacidadeGuarnicao: capacidadeGuarnicao || 3,
        equipamentoAPH: equipamentoAPH || false,
      },
    });

    return NextResponse.json(viatura);
  } catch (error) {
    console.error("Erro ao criar viatura:", error);
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
    const { id, placa, identificacao, tipo, capacidadeGuarnicao, equipamentoAPH, ativo } = data;

    const viatura = await prisma.viatura.update({
      where: { id },
      data: {
        placa: placa?.toUpperCase(),
        identificacao: identificacao?.toUpperCase(),
        tipo,
        capacidadeGuarnicao,
        equipamentoAPH,
        ativo,
      },
    });

    return NextResponse.json(viatura);
  } catch (error) {
    console.error("Erro ao atualizar viatura:", error);
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

    await prisma.viatura.delete({ where: { id: id! } });

    return NextResponse.json({ message: "Viatura removida" });
  } catch (error) {
    console.error("Erro ao deletar viatura:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
