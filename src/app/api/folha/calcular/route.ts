import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calcularINSS, calcularIRRF, calcularFGTS } from "@/lib/calculos";

export async function POST(request: Request) {
  try {
    const { empresaId, competencia, tipo = "NORMAL" } = await request.json();

    if (!empresaId || !competencia) {
      return NextResponse.json({ error: "empresaId e competencia são obrigatórios" }, { status: 400 });
    }

    // Busca ou cria a folha
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
      await db.folha.update({
        where: { id: folha.id },
        data: { status: "EM_CALCULO" },
      });
    }

    // Remove itens calculados automaticamente (mantém manuais)
    await db.itemFolha.deleteMany({
      where: { folhaId: folha.id, manual: false },
    });

    // Busca funcionários ativos
    const funcionarios = await db.funcionario.findMany({
      where: {
        empresaId,
        situacao: { in: ["ATIVO", "FERIAS"] },
      },
      include: {
        dependentes: { where: { deducaoIRRF: true } },
      },
    });

    // Busca tabelas vigentes
    const anoAtual = parseInt(competencia.split("-")[0]);
    const tabelaINSS = await db.tabelaINSS.findFirst({
      where: { ano: anoAtual, ativa: true },
    });
    const tabelaIRRF = await db.tabelaIRRF.findFirst({
      where: { ano: anoAtual, ativa: true },
    });
    const tabelaFGTS = await db.tabelaFGTS.findFirst({
      where: { ano: anoAtual, ativa: true },
    });

    // Busca rubricas base
    const rubricaSalario = await db.rubrica.findUnique({ where: { codigo: "0001" } });
    const rubricaINSS = await db.rubrica.findUnique({ where: { codigo: "1000" } });
    const rubricaIRRF = await db.rubrica.findUnique({ where: { codigo: "1001" } });
    const rubricaFGTS = await db.rubrica.findUnique({ where: { codigo: "9001" } });

    if (!rubricaSalario || !rubricaINSS || !rubricaIRRF || !rubricaFGTS) {
      return NextResponse.json({ error: "Rubricas padrão não encontradas. Execute o seed primeiro." }, { status: 500 });
    }

    let totalProventos = 0;
    let totalDescontos = 0;
    let totalINSSEmpregado = 0;
    let totalINSSPatronal = 0;
    let totalFGTS = 0;
    let totalIRRF = 0;

    // Calcula para cada funcionário
    for (const func of funcionarios) {
      const salario = parseFloat(func.salario.toString());
      const numeroDependentes = func.dependentes.length;

      // 1. Salário base
      await db.itemFolha.create({
        data: {
          folhaId: folha.id,
          funcionarioId: func.id,
          rubricaId: rubricaSalario.id,
          descricao: "Salário Base",
          tipo: "PROVENTO",
          referencia: 220,
          valor: salario,
          baseINSS: salario,
          baseFGTS: salario,
          baseIRRF: salario,
          manual: false,
        },
      });

      totalProventos += salario;

      // 2. INSS progressivo
      const faixasINSS = (tabelaINSS?.faixas as any[]) ?? [];
      const resultINSS = calcularINSS(salario, faixasINSS.length ? faixasINSS : undefined);

      await db.itemFolha.create({
        data: {
          folhaId: folha.id,
          funcionarioId: func.id,
          rubricaId: rubricaINSS.id,
          descricao: `INSS — ${resultINSS.aliquotaEfetiva}% ef.`,
          tipo: "DESCONTO",
          valor: resultINSS.valorDesconto,
          manual: false,
        },
      });

      totalDescontos += resultINSS.valorDesconto;
      totalINSSEmpregado += resultINSS.valorDesconto;

      // 3. IRRF
      const faixasIRRF = (tabelaIRRF?.faixas as any[]) ?? [];
      const resultIRRF = calcularIRRF({
        salarioBruto: salario,
        inssDescontado: resultINSS.valorDesconto,
        numeroDependentes,
      });

      if (resultIRRF.valorDesconto > 0) {
        await db.itemFolha.create({
          data: {
            folhaId: folha.id,
            funcionarioId: func.id,
            rubricaId: rubricaIRRF.id,
            descricao: `IRRF — ${resultIRRF.aliquota}%`,
            tipo: "DESCONTO",
            valor: resultIRRF.valorDesconto,
            manual: false,
          },
        });
        totalDescontos += resultIRRF.valorDesconto;
        totalIRRF += resultIRRF.valorDesconto;
      }

      // 4. FGTS (informativo)
      const aliquotaFGTS = parseFloat((tabelaFGTS?.aliquota ?? 8).toString());
      const valorFGTS = calcularFGTS(salario, aliquotaFGTS);

      await db.itemFolha.create({
        data: {
          folhaId: folha.id,
          funcionarioId: func.id,
          rubricaId: rubricaFGTS.id,
          descricao: `FGTS ${aliquotaFGTS}%`,
          tipo: "INFORMATIVO",
          valor: valorFGTS,
          manual: false,
        },
      });

      totalFGTS += valorFGTS;

      // INSS Patronal (20% sobre salário + FAP/RAT)
      const empresa = await db.empresa.findUnique({ where: { id: empresaId } });
      const aliquotaPatronal = empresa?.recolheINSSPatronal ? 0.20 : 0;
      const ratFap = parseFloat((empresa?.aliquotaRAT ?? 1).toString()) / 100;
      const patronal = salario * (aliquotaPatronal + ratFap);
      totalINSSPatronal += patronal;
    }

    // Atualiza totais da folha
    const folhaAtualizada = await db.folha.update({
      where: { id: folha.id },
      data: {
        status: "ABERTA",
        totalProventos,
        totalDescontos,
        totalLiquido: totalProventos - totalDescontos,
        totalINSSEmpregado,
        totalINSSPatronal,
        totalFGTS,
        totalIRRF,
      },
    });

    return NextResponse.json({
      folha: folhaAtualizada,
      funcionariosProcessados: funcionarios.length,
    });
  } catch (error) {
    console.error("Erro ao calcular folha:", error);
    return NextResponse.json({ error: "Erro interno ao calcular folha" }, { status: 500 });
  }
}
