import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";
import { calcularINSS, calcularIRRF, calcularFGTS } from "@/lib/calculos";
import { registrarLog } from "@/lib/logger";

export async function POST(request: Request) {
  const guard = await requireAuth();
  if (!guard.ok) return guard.response;
  const { escritorioId } = guard.session;

  try {
    const { empresaId, competencia, tipo = "NORMAL" } = await request.json();

    if (!empresaId || !competencia) {
      return NextResponse.json({ error: "empresaId e competencia são obrigatórios" }, { status: 400 });
    }

    const empresa = await db.empresa.findFirst({ where: { id: empresaId, escritorioId } });
    if (!empresa) return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });

    let folha = await db.folha.findUnique({
      where: { empresaId_competencia_tipo: { empresaId, competencia, tipo } },
    });

    if (folha && folha.status === "FECHADA") {
      return NextResponse.json({ error: "Folha já fechada" }, { status: 409 });
    }

    if (!folha) {
      folha = await db.folha.create({
        data: { empresaId, competencia, tipo, status: "EM_CALCULO" },
      });
    } else {
      await db.folha.update({ where: { id: folha.id }, data: { status: "EM_CALCULO" } });
    }

    await db.itemFolha.deleteMany({ where: { folhaId: folha.id, manual: false } });

    const funcionarios = await db.funcionario.findMany({
      where: { empresaId, situacao: { in: ["ATIVO", "FERIAS"] } },
      include: { dependentes: { where: { deducaoIRRF: true } } },
    });

    const anoAtual = parseInt(competencia.split("-")[0]);
    const tabelaINSS = await db.tabelaINSS.findFirst({ where: { ano: anoAtual, ativa: true } });
    const tabelaIRRF = await db.tabelaIRRF.findFirst({ where: { ano: anoAtual, ativa: true } });
    const tabelaFGTS = await db.tabelaFGTS.findFirst({ where: { ano: anoAtual, ativa: true } });

    const rubricaSalario = await db.rubrica.findUnique({ where: { codigo: "0001" } });
    const rubricaINSS = await db.rubrica.findUnique({ where: { codigo: "1000" } });
    const rubricaIRRF = await db.rubrica.findUnique({ where: { codigo: "1001" } });
    const rubricaFGTS = await db.rubrica.findUnique({ where: { codigo: "9001" } });

    if (!rubricaSalario || !rubricaINSS || !rubricaIRRF || !rubricaFGTS) {
      return NextResponse.json({ error: "Rubricas padrão não encontradas. Execute o seed primeiro." }, { status: 500 });
    }

    let totalProventos = 0, totalDescontos = 0, totalINSSEmpregado = 0;
    let totalINSSPatronal = 0, totalFGTS = 0, totalIRRF = 0;

    for (const func of funcionarios) {
      const salario = parseFloat(func.salario.toString());
      const numeroDependentes = func.dependentes.length;

      await db.itemFolha.create({
        data: { folhaId: folha.id, funcionarioId: func.id, rubricaId: rubricaSalario.id, descricao: "Salário Base", tipo: "PROVENTO", referencia: 220, valor: salario, baseINSS: salario, baseFGTS: salario, baseIRRF: salario, manual: false },
      });
      totalProventos += salario;

      const faixasINSS = (tabelaINSS?.faixas as any[]) ?? [];
      const resultINSS = calcularINSS(salario, faixasINSS.length ? faixasINSS : undefined);
      await db.itemFolha.create({
        data: { folhaId: folha.id, funcionarioId: func.id, rubricaId: rubricaINSS.id, descricao: `INSS — ${resultINSS.aliquotaEfetiva}% ef.`, tipo: "DESCONTO", valor: resultINSS.valorDesconto, manual: false },
      });
      totalDescontos += resultINSS.valorDesconto;
      totalINSSEmpregado += resultINSS.valorDesconto;

      const resultIRRF = calcularIRRF({ salarioBruto: salario, inssDescontado: resultINSS.valorDesconto, numeroDependentes });
      if (resultIRRF.valorDesconto > 0) {
        await db.itemFolha.create({
          data: { folhaId: folha.id, funcionarioId: func.id, rubricaId: rubricaIRRF.id, descricao: `IRRF — ${resultIRRF.aliquota}%`, tipo: "DESCONTO", valor: resultIRRF.valorDesconto, manual: false },
        });
        totalDescontos += resultIRRF.valorDesconto;
        totalIRRF += resultIRRF.valorDesconto;
      }

      const aliquotaFGTS = parseFloat((tabelaFGTS?.aliquota ?? 8).toString());
      const valorFGTS = calcularFGTS(salario, aliquotaFGTS);
      await db.itemFolha.create({
        data: { folhaId: folha.id, funcionarioId: func.id, rubricaId: rubricaFGTS.id, descricao: `FGTS ${aliquotaFGTS}%`, tipo: "INFORMATIVO", valor: valorFGTS, manual: false },
      });
      totalFGTS += valorFGTS;

      const aliquotaPatronal = empresa.recolheINSSPatronal ? 0.20 : 0;
      const ratFap = parseFloat((empresa.aliquotaRAT ?? 1).toString()) / 100;
      totalINSSPatronal += salario * (aliquotaPatronal + ratFap);
    }

    const folhaAtualizada = await db.folha.update({
      where: { id: folha.id },
      data: { status: "ABERTA", totalProventos, totalDescontos, totalLiquido: totalProventos - totalDescontos, totalINSSEmpregado, totalINSSPatronal, totalFGTS, totalIRRF },
    });

    await registrarLog({
      escritorioId,
      usuarioId: guard.session.userId,
      nomeUsuario: guard.session.name,
      tipo: "FOLHA",
      modulo: "folha",
      acao: "CALCULAR",
      descricao: `Folha calculada: ${empresa.razaoSocial} — ${competencia} (${tipo}) — ${funcionarios.length} funcionário(s)`,
      detalhes: {
        folhaId: folhaAtualizada.id,
        empresaId,
        empresaNome: empresa.razaoSocial,
        competencia,
        tipo,
        funcionariosProcessados: funcionarios.length,
        totalProventos:    parseFloat(folhaAtualizada.totalProventos.toString()),
        totalDescontos:    parseFloat(folhaAtualizada.totalDescontos.toString()),
        totalLiquido:      parseFloat(folhaAtualizada.totalLiquido.toString()),
        totalINSSEmpregado: parseFloat(folhaAtualizada.totalINSSEmpregado.toString()),
        totalINSSPatronal:  parseFloat(folhaAtualizada.totalINSSPatronal.toString()),
        totalFGTS:         parseFloat(folhaAtualizada.totalFGTS.toString()),
        totalIRRF:         parseFloat(folhaAtualizada.totalIRRF.toString()),
      },
    });

    return NextResponse.json({ folha: folhaAtualizada, funcionariosProcessados: funcionarios.length });
  } catch (error) {
    console.error("Erro ao calcular folha:", error);
    return NextResponse.json({ error: "Erro interno ao calcular folha" }, { status: 500 });
  }
}
