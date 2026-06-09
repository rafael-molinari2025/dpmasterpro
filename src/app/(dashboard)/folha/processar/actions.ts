"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { calcularINSS, calcularIRRF, calcularFGTS, calcularINSSPatronal } from "@/lib/calculo-folha";

export async function processarFolha(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const escritorioId = (session.user as any).escritorioId as string;
  const empresaId = formData.get("empresaId") as string;
  const competencia = formData.get("competencia") as string;
  const tipo = (formData.get("tipo") as string) || "NORMAL";

  if (!empresaId || !competencia) {
    redirect("/folha/processar?error=" + encodeURIComponent("Preencha empresa e competência."));
  }

  let folhaId: string | null = null;

  try {
    const empresa = await db.empresa.findFirst({ where: { id: empresaId, escritorioId } });
    if (!empresa) redirect("/folha/processar?error=" + encodeURIComponent("Empresa não encontrada."));

    // Se já existe, redireciona sem reprocessar
    const existing = await db.folha.findFirst({ where: { empresaId, competencia, tipo: tipo as any } });
    if (existing) {
      redirect(`/folha?competencia=${competencia}&empresaId=${empresaId}`);
    }

    const funcionarios = await db.funcionario.findMany({
      where: { empresaId, situacao: "ATIVO" },
      include: { dependentes: { where: { deducaoIRRF: true } } },
    });

    if (funcionarios.length === 0) {
      redirect("/folha/processar?error=" + encodeURIComponent("Nenhum funcionário ativo encontrado para esta empresa."));
    }

    // Garante que as rubricas padrão existem
    const [rubricaSalario, rubricaINSS, rubricaIRRF] = await Promise.all([
      db.rubrica.upsert({
        where: { codigo: "0001" },
        create: { codigo: "0001", descricao: "Salário Base", tipo: "PROVENTO", naturezaESocial: "1000", incideINSS: true, incideFGTS: true, incideIRRF: true, incide13: true, incideFerias: true },
        update: {},
      }),
      db.rubrica.upsert({
        where: { codigo: "0100" },
        create: { codigo: "0100", descricao: "INSS — Empregado", tipo: "DESCONTO", naturezaESocial: "9101" },
        update: {},
      }),
      db.rubrica.upsert({
        where: { codigo: "0101" },
        create: { codigo: "0101", descricao: "IRRF", tipo: "DESCONTO", naturezaESocial: "9103" },
        update: {},
      }),
    ]);

    let totalProventos = 0;
    let totalDescontos = 0;
    let totalINSSEmpregado = 0;
    let totalINSSPatronal = 0;
    let totalFGTS = 0;
    let totalIRRF = 0;

    const itens: {
      funcionarioId: string;
      rubricaId: string;
      descricao: string;
      tipo: string;
      valor: number;
      baseINSS: number;
      baseFGTS: number;
      baseIRRF: number;
    }[] = [];

    for (const func of funcionarios) {
      const salario = parseFloat(func.salario.toString());
      const inss = calcularINSS(salario);
      const baseIRRF = Math.max(0, salario - inss);
      const irrf = calcularIRRF(baseIRRF, func.dependentes.length);
      const fgts = calcularFGTS(salario);
      const patronal = calcularINSSPatronal(salario, parseFloat(empresa.aliquotaRAT.toString()));

      totalProventos += salario;
      totalDescontos += inss + irrf;
      totalINSSEmpregado += inss;
      totalINSSPatronal += patronal;
      totalFGTS += fgts;
      totalIRRF += irrf;

      itens.push({
        funcionarioId: func.id,
        rubricaId: rubricaSalario.id,
        descricao: "Salário Base",
        tipo: "PROVENTO",
        valor: salario,
        baseINSS: salario,
        baseFGTS: salario,
        baseIRRF: salario,
      });

      itens.push({
        funcionarioId: func.id,
        rubricaId: rubricaINSS.id,
        descricao: "INSS — Empregado",
        tipo: "DESCONTO",
        valor: inss,
        baseINSS: 0,
        baseFGTS: 0,
        baseIRRF: 0,
      });

      if (irrf > 0) {
        itens.push({
          funcionarioId: func.id,
          rubricaId: rubricaIRRF.id,
          descricao: "IRRF",
          tipo: "DESCONTO",
          valor: irrf,
          baseINSS: 0,
          baseFGTS: 0,
          baseIRRF: 0,
        });
      }
    }

    const arredondar = (v: number) => Math.round(v * 100) / 100;

    const folha = await db.folha.create({
      data: {
        empresaId,
        competencia,
        tipo: tipo as any,
        status: "ABERTA",
        totalProventos: arredondar(totalProventos),
        totalDescontos: arredondar(totalDescontos),
        totalLiquido: arredondar(totalProventos - totalDescontos),
        totalINSSEmpregado: arredondar(totalINSSEmpregado),
        totalINSSPatronal: arredondar(totalINSSPatronal),
        totalFGTS: arredondar(totalFGTS),
        totalIRRF: arredondar(totalIRRF),
        itens: { create: itens },
      },
    });

    folhaId = folha.id;

    // Gera guias de pagamento
    const [anoStr, mesStr] = competencia.split("-");
    const ano = parseInt(anoStr);
    const mes = parseInt(mesStr);
    const mesVenc = mes >= 12 ? 1 : mes + 1;
    const anoVenc = mes >= 12 ? ano + 1 : ano;

    const guias = [];
    if (arredondar(totalINSSEmpregado + totalINSSPatronal) > 0) {
      guias.push({
        empresaId,
        folhaId: folha.id,
        tipo: "GPS_INSS" as const,
        competencia,
        dataVencimento: new Date(anoVenc, mesVenc - 1, 20),
        valorPrincipal: arredondar(totalINSSEmpregado + totalINSSPatronal),
        valorTotal: arredondar(totalINSSEmpregado + totalINSSPatronal),
        status: "PENDENTE" as const,
      });
    }
    if (arredondar(totalIRRF) > 0) {
      guias.push({
        empresaId,
        folhaId: folha.id,
        tipo: "DARF_IRRF" as const,
        competencia,
        dataVencimento: new Date(anoVenc, mesVenc - 1, 20),
        valorPrincipal: arredondar(totalIRRF),
        valorTotal: arredondar(totalIRRF),
        status: "PENDENTE" as const,
      });
    }
    if (arredondar(totalFGTS) > 0) {
      guias.push({
        empresaId,
        folhaId: folha.id,
        tipo: "FGTS_DIGITAL" as const,
        competencia,
        dataVencimento: new Date(anoVenc, mesVenc - 1, 7),
        valorPrincipal: arredondar(totalFGTS),
        valorTotal: arredondar(totalFGTS),
        status: "PENDENTE" as const,
      });
    }
    if (guias.length > 0) {
      await db.guiaPagamento.createMany({ data: guias });
    }
  } catch (err: any) {
    // Re-lança redirects do Next.js
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err;
    redirect("/folha/processar?error=" + encodeURIComponent("Erro ao processar folha. Verifique os dados e tente novamente."));
  }

  redirect(`/folha?competencia=${competencia}&empresaId=${empresaId}`);
}
