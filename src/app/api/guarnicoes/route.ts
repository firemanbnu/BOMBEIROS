import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.corporacaoId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const guarnicoes = await prisma.guarnicao.findMany({
      where: { corporacaoId: session.user.corporacaoId },
      orderBy: { nome: "asc" },
    });

    return NextResponse.json(guarnicoes);
  } catch (error) {
    console.error("Erro ao buscar guarnições:", error);
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
    const { nome, matricula, funcao, habilitacoes } = data;

    if (!nome || !matricula || !funcao) {
      return NextResponse.json(
        { error: "Campos obrigatórios não preenchidos" },
        { status: 400 }
      );
    }

    const guarnicao = await prisma.guarnicao.create({
      data: {
        corporacaoId: session.user.corporacaoId,
        nome,
        matricula,
        funcao,
        habilitacoes: habilitacoes || [],
      },
    });

    return NextResponse.json(guarnicao);
  } catch (error) {
    console.error("Erro ao criar guarnição:", error);
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
    const { id, nome, matricula, funcao, habilitacoes, ativo } = data;

    const guarnicao = await prisma.guarnicao.update({
      where: { id },
      data: {
        nome,
        matricula,
        funcao,
        habilitacoes,
        ativo,
      },
    });

    return NextResponse.json(guarnicao);
  } catch (error) {
    console.error("Erro ao atualizar guarnição:", error);
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

    await prisma.guarnicao.delete({ where: { id: id! } });

    return NextResponse.json({ message: "Guarnição removida" });
  } catch (error) {
    console.error("Erro ao deletar guarnição:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
