import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.corporacaoId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const corporacao = await prisma.corporacao.findUnique({
      where: { id: session.user.corporacaoId },
    });

    return NextResponse.json(corporacao);
  } catch (error) {
    console.error("Erro ao buscar corporação:", error);
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
    const { nome, cnpj, nomeFantasia, endereco, cidade, estado, cep, telefone, email, logoUrl, corPrimaria, corSecundaria } = data;

    const corporacao = await prisma.corporacao.update({
      where: { id: session.user.corporacaoId },
      data: {
        nome,
        cnpj,
        nomeFantasia,
        endereco,
        cidade,
        estado,
        cep,
        telefone,
        email,
        logoUrl,
        corPrimaria,
        corSecundaria,
      },
    });

    return NextResponse.json(corporacao);
  } catch (error) {
    console.error("Erro ao atualizar corporação:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
