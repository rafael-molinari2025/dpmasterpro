import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { hasPermissao } from "@/lib/permissoes";

export async function POST(req: NextRequest) {
  const guard = await requireAuth();
  if (!guard.ok) return guard.response;
  const { escritorioId, perfil, permissoes } = guard.session;

  if (!hasPermissao(perfil, permissoes as string[], "ferias")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const body = await req.json();
  const {
    funcionarioId,
    dataInicioAquisitivo,
    dataFimAquisitivo,
    dataInicioGozo,
    dataFimGozo,
    diasDireito,
    diasGozo,
    diasAbono,
    adiantamento13,
    observacao,
  } = body;

  if (!funcionarioId || !dataInicioAquisitivo || !dataFimAquisitivo) {
    return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
  }

  const func = await db.funcionario.findFirst({
    where: { id: funcionarioId, empresa: { escritorioId } },
    select: { id: true, empresaId: true, situacao: true },
  });
  if (!func) {
    return NextResponse.json({ error: "Funcionário não encontrado" }, { status: 404 });
  }

  const inicio = new Date(dataInicioAquisitivo);
  const fim = new Date(dataFimAquisitivo);
  const periodoAquisitivo = `${inicio.getFullYear()}-${String(inicio.getMonth() + 1).padStart(2, "0")}/${fim.getFullYear()}-${String(fim.getMonth() + 1).padStart(2, "0")}`;

  const hoje = new Date();
  const status = dataInicioGozo
    ? new Date(dataInicioGozo) <= hoje
      ? "GOZADA"
      : "AGENDADA"
    : fim < hoje
    ? "VENCIDA"
    : "A_VENCER";

  const ferias = await db.ferias.create({
    data: {
      empresaId: func.empresaId,
      funcionarioId,
      periodoAquisitivo,
      dataInicioAquisitivo: inicio,
      dataFimAquisitivo: fim,
      dataInicioGozo: dataInicioGozo ? new Date(dataInicioGozo) : null,
      dataFimGozo: dataFimGozo ? new Date(dataFimGozo) : null,
      diasDireito: parseInt(diasDireito) || 30,
      diasGozo: diasGozo ? parseInt(diasGozo) : null,
      diasAbono: parseInt(diasAbono) || 0,
      adiantamento13: adiantamento13 === true || adiantamento13 === "true",
      status: status as any,
      observacao: observacao || null,
    },
  });

  if (dataInicioGozo && status !== "GOZADA") {
    await db.funcionario.update({
      where: { id: funcionarioId },
      data: { situacao: "FERIAS" },
    });
  }

  return NextResponse.json(ferias, { status: 201 });
}
