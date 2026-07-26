import { NextRequest, NextResponse } from "next/server";
import { Session } from "next-auth";
import bcrypt from "bcryptjs";
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

    const usuarios = await prisma.usuario.findMany({
      where: { corporacaoId: session.user.corporacaoId },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        ativo: true,
        createdAt: true,
      },
      orderBy: { nome: "asc" },
    });

    return NextResponse.json(usuarios);
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.corporacaoId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (!isAdmin(session)) {
      return NextResponse.json({ error: "Apenas administradores podem criar usuários" }, { status: 403 });
    }

    const { nome, email, senha, role } = await req.json();

    if (!nome || !email || !senha) {
      return NextResponse.json(
        { error: "Nome, email e senha são obrigatórios" },
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

    const usuario = await prisma.usuario.create({
      data: {
        corporacaoId: session.user.corporacaoId,
        nome,
        email,
        senhaHash,
        role: role || "SOCORRISTA",
      },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        ativo: true,
        createdAt: true,
      },
    });

    return NextResponse.json(usuario);
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.corporacaoId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (!isAdmin(session)) {
      return NextResponse.json({ error: "Apenas administradores podem editar usuários" }, { status: 403 });
    }

    const { id, nome, email, role, ativo, senha } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    const existente = await prisma.usuario.findUnique({ where: { id } });
    if (!existente || existente.corporacaoId !== session.user.corporacaoId) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    if (email && email !== existente.email) {
      const emailExiste = await prisma.usuario.findUnique({ where: { email } });
      if (emailExiste) {
        return NextResponse.json({ error: "Email já está em uso" }, { status: 409 });
      }
    }

    const updateData: Record<string, unknown> = {};
    if (nome !== undefined) updateData.nome = nome;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (ativo !== undefined) updateData.ativo = ativo;
    if (senha) updateData.senhaHash = await bcrypt.hash(senha, 12);

    const usuario = await prisma.usuario.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        ativo: true,
        createdAt: true,
      },
    });

    return NextResponse.json(usuario);
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
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
      return NextResponse.json({ error: "Apenas administradores podem excluir usuários" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    const existente = await prisma.usuario.findUnique({ where: { id } });
    if (!existente || existente.corporacaoId !== session.user.corporacaoId) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    if (existente.id === session.user.id) {
      return NextResponse.json({ error: "Você não pode excluir seu próprio usuário" }, { status: 400 });
    }

    await prisma.usuario.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
