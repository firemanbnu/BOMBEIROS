import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.corporacaoId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const data = await req.json();
    const { ocorrenciaId, viaturaId } = data;

    if (!ocorrenciaId || !viaturaId) {
      return NextResponse.json(
        { error: "Ocorrência e Viatura são obrigatórias" },
        { status: 400 }
      );
    }

    const viaturaEmpenhada = await prisma.viaturaEmpenhada.create({
      data: {
        ocorrenciaId,
        viaturaId,
        horaAcionamento: new Date(),
        status: "ACIONADA",
      },
      include: { viatura: true },
    });

    // Atualizar status da ocorrência
    await prisma.ocorrencia.update({
      where: { id: ocorrenciaId },
      data: { status: "EM_ATENDIMENTO" },
    });

    return NextResponse.json(viaturaEmpenhada);
  } catch (error) {
    console.error("Erro ao empenhar viatura:", error);
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
    const { id, status, horaChegadaLocal, horaTermino, horaChegadaQuartel, horaDeslocamentoHospital, horaChegadaHospital, guarnicaoIds } = data;

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (horaChegadaLocal) updateData.horaChegadaLocal = new Date(horaChegadaLocal);
    if (horaTermino) updateData.horaTermino = new Date(horaTermino);
    if (horaChegadaQuartel) updateData.horaChegadaQuartel = new Date(horaChegadaQuartel);
    if (horaDeslocamentoHospital) updateData.horaDeslocamentoHospital = new Date(horaDeslocamentoHospital);
    if (horaChegadaHospital) updateData.horaChegadaHospital = new Date(horaChegadaHospital);

    const viaturaEmpenhada = await prisma.viaturaEmpenhada.update({
      where: { id },
      data: updateData,
      include: { viatura: true },
    });

    // Se todas as viaturas retornaram ao quartel, verificar se pode encerrar
    if (status === "NO_QUARTEL" || status === "DESPACHADA") {
      const viaturasDaOcorrencia = await prisma.viaturaEmpenhada.findMany({
        where: { ocorrenciaId: viaturaEmpenhada.ocorrenciaId },
      });

      const todasFinalizadas = viaturasDaOcorrencia.every(
        (v) => v.status === "NO_QUARTEL" || v.status === "DESPACHADA" || v.id === id
      );

      if (todasFinalizadas) {
        // Notificar que pode encerrar (via response)
        return NextResponse.json({
          ...viaturaEmpenhada,
          podeEncerrar: true,
        });
      }
    }

    return NextResponse.json(viaturaEmpenhada);
  } catch (error) {
    console.error("Erro ao atualizar viatura empenhada:", error);
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

    await prisma.viaturaEmpenhada.delete({ where: { id: id! } });

    return NextResponse.json({ message: "Empenho removido" });
  } catch (error) {
    console.error("Erro ao deletar empenho:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
