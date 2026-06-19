import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";
import { hasPermissao } from "@/lib/permissoes";
import { registrarLog } from "@/lib/logger";
import { calcularRescisao } from "@/lib/calculo-folha";

export async function POST(request: Request) {
  const guard = await requireAuth();
  if (!guard.ok) return guard.response;
  const { escritorioId, perfil, permissoes } = guard.session;

  if (!hasPermissao(perfil, permissoes as string[], "rescisao")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  try {
    const { funcionarioId, tipoRescisao, dataDemissao } = await request.json();

    if (!funcionarioId || !tipoRescisao || !dataDemissao) {
      return NextResponse.json({ error: "Campos obrigatórios ausentes: funcionarioId, tipoRescisao, dataDemissao" }, { status: 400 });
    }

    const funcionario = await db.funcionario.findFirst({
      where: { id: funcionarioId, empresa: { escritorioId } },
      include: {
        empresa: { select: { razaoSocial: true } },
        dependentes: { where: { deducaoIRRF: true }, select: { id: true } },
      },
    });
    if (!funcionario) {
      return NextResponse.json({ error: "Funcionário não encontrado" }, { status: 404 });
    }
    if (funcionario.situacao === "DEMITIDO") {
      return NextResponse.json({ error: "Funcionário já está demitido" }, { status: 409 });
    }

    const resultado = calcularRescisao({
      salario: parseFloat(funcionario.salario.toString()),
      dataAdmissao: new Date(funcionario.dataAdmissao),
      dataDemissao: new Date(dataDemissao),
      tipoRescisao,
      numDependentes: funcionario.dependentes.length,
    });

    await db.funcionario.update({
      where: { id: funcionarioId },
      data: {
        situacao: "DEMITIDO",
        dataDemissao: new Date(dataDemissao),
        motivoDemissao: tipoRescisao,
      },
    });

    await registrarLog({
      escritorioId,
      usuarioId: guard.session.userId,
      nomeUsuario: guard.session.name,
      tipo: "FUNCIONARIO",
      modulo: "rescisao",
      acao: "DEMITIR",
      descricao: `Rescisão registrada: ${funcionario.nome} — ${tipoRescisao} (${funcionario.empresa.razaoSocial}) — Líquido: R$ ${resultado.totalLiquido.toFixed(2)}`,
      detalhes: { funcionarioId, tipoRescisao, dataDemissao, ...resultado },
    });

    return NextResponse.json({ ok: true, resultado, funcionario: { nome: funcionario.nome } });
  } catch (error: any) {
    console.error("Erro ao registrar rescisão:", error);
    return NextResponse.json({ error: "Erro ao registrar rescisão" }, { status: 500 });
  }
}
