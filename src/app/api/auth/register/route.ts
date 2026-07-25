import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { nome, email, senha, corporacaoNome, cnpj } = await req.json();

    if (!nome || !email || !senha || !corporacaoNome) {
      return NextResponse.json(
        { error: "Campos obrigatórios não preenchidos" },
        { status: 400 }
      );
    }

    const existente = await prisma.usuario.findUnique({ where: { email } });
    if (existente) {
      return NextResponse.json(
        { error: "Email já cadastrado" },
        { status: 409 }
      );
    }

    const senhaHash = await bcrypt.hash(senha, 12);

    const corporacao = await prisma.corporacao.create({
      data: {
        nome: corporacaoNome,
        cnpj: cnpj || null,
      },
    });

    const usuario = await prisma.usuario.create({
      data: {
        corporacaoId: corporacao.id,
        nome,
        email,
        senhaHash,
        role: "ADMIN",
      },
    });

    return NextResponse.json({
      message: "Conta criada com sucesso",
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email },
    });
  } catch (error) {
    console.error("Erro no registro:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
