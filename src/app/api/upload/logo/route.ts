import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.corporacaoId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.name.split(".").pop();
    const fileName = `logo_${session.user.corporacaoId}_${Date.now()}.${ext}`;
    const filePath = `public/uploads/logos/${fileName}`;

    const { writeFile } = await import("fs/promises");
    const path = await import("path");
    const fullPath = path.join(process.cwd(), filePath);
    await writeFile(fullPath, buffer);

    const logoUrl = `/uploads/logos/${fileName}`;

    await prisma.corporacao.update({
      where: { id: session.user.corporacaoId },
      data: { logoUrl },
    });

    return NextResponse.json({ logoUrl });
  } catch (error) {
    console.error("Erro no upload:", error);
    return NextResponse.json({ error: "Erro no upload" }, { status: 500 });
  }
}
