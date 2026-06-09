"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { calcularINSS, calcularIRRF } from "@/lib/calculo-folha";

function calcularAvos(dataAdmissao: Date, anoReferencia: number): number {
  const admissaoAno = dataAdmissao.getFullYear();
  const admissaoMes = dataAdmissao.getMonth() + 1;
  const admissaoDia = dataAdmissao.getDate();
  if (admissaoAno > anoReferencia) return 0;
  if (admissaoAno < anoReferencia) return 12;
  const mesInicio = admissaoDia <= 15 ? admissaoMes : admissaoMes + 1;
  return Math.max(0, 13 - mesInicio);
}

export async function processarDecimoTerceiro(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const escritorioId = (session.user as any).escritorioId as string;

  const empresaId = formData.get("empresaId") as string;
  const parcela = formData.get("parcela") as string; // "1" ou "2"

  if (!empresaId) {
    redirect("/folha/decimo-terceiro?error=" + encodeURIComponent("Selecione uma empresa."));
  }

  try {
    const empresa = await db.empresa.findFirst({
      where: { id: empresaId, escritorioId },
    });
    if (!empresa) redirect("/folha/decimo-terceiro");

    const anoAtual = new Date().getFullYear();
    const competencia = `${anoAtual}-12`;
    const tipoFolha = parcela === "2" ? "DECIMO_TERCEIRO_2" : "DECIMO_TERCEIRO_1";

    const funcionarios = await db.funcionario.findMany({
      where: {
        empresaId,
        empresa: { escritorioId },
        situacao: { in: ["ATIVO", "FERIAS", "AFASTADO"] },
      },
      include: {
        dependentes: { where: { deducaoIRRF: true } },
      },
    });

    if (funcionarios.length === 0) {
      redirect("/folha/decimo-terceiro?empresaId=" + empresaId + "&parcela=" + parcela + "&error=" + encodeURIComponent("Nenhum funcionário encontrado."));
    }

    // Garante rubricas essenciais
    const codigoDecimo = parcela === "1" ? "0200" : "0201";
    const [rubricaDecimoTerceiro, rubricaINSS, rubricaIRRF] = await Promise.all([
      db.rubrica.upsert({
        where: { codigo: codigoDecimo },
        create: {
          codigo: codigoDecimo,
          descricao: parcela === "1" ? "13º Salário — 1ª Parcela" : "13º Salário — 2ª Parcela",
          tipo: "PROVENTO",
          naturezaESocial: parcela === "1" ? "1010" : "1011",
          incide13: false,
          incideFerias: false,
          incideINSS: parcela === "2",
          incideIRRF: parcela === "2",
        },
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

    // Verifica se já existe folha para este tipo/competência
    const folhaExistente = await db.folha.findFirst({
      where: { empresaId, competencia, tipo: tipoFolha as any },
    });
    if (folhaExistente) {
      redirect("/folha/decimo-terceiro?empresaId=" + empresaId + "&parcela=" + parcela + "&processado=1");
    }

    let totalProventos = 0;
    let totalDescontos = 0;
    let totalINSS = 0;
    let totalIRRF = 0;
    const itensData: any[] = [];

    for (const func of funcionarios) {
      const salario = parseFloat(func.salario.toString());
      const avos = calcularAvos(func.dataAdmissao, anoAtual);
      if (avos === 0) continue;

      const valorBruto = Math.round((salario / 12) * avos * 100) / 100;

      if (parcela === "1") {
        const valor1a = Math.round(valorBruto * 0.5 * 100) / 100;
        totalProventos += valor1a;
        itensData.push({
          funcionarioId: func.id,
          rubricaId: rubricaDecimoTerceiro.id,
          descricao: `13º Salário — 1ª Parcela (${avos}/12 avos)`,
          tipo: "PROVENTO" as const,
          valor: valor1a,
          referencia: avos,
          baseINSS: 0,
          baseFGTS: valor1a,
          baseIRRF: 0,
        });
      } else {
        const valor2a = Math.round(valorBruto * 0.5 * 100) / 100;
        const numDeps = func.dependentes.length;
        const inss = calcularINSS(valorBruto);
        const irrf = calcularIRRF(valorBruto - inss, numDeps);

        totalProventos += valor2a;
        totalINSS += inss;
        totalIRRF += irrf;
        if (inss > 0) totalDescontos += inss;
        if (irrf > 0) totalDescontos += irrf;

        itensData.push({
          funcionarioId: func.id,
          rubricaId: rubricaDecimoTerceiro.id,
          descricao: `13º Salário — 2ª Parcela (${avos}/12 avos)`,
          tipo: "PROVENTO" as const,
          valor: valor2a,
          referencia: avos,
          baseINSS: valorBruto,
          baseFGTS: valor2a,
          baseIRRF: valorBruto - inss,
        });

        if (inss > 0) {
          itensData.push({
            funcionarioId: func.id,
            rubricaId: rubricaINSS.id,
            descricao: "INSS — 13º Salário",
            tipo: "DESCONTO" as const,
            valor: inss,
            referencia: 0,
            baseINSS: 0,
            baseFGTS: 0,
            baseIRRF: 0,
          });
        }

        if (irrf > 0) {
          itensData.push({
            funcionarioId: func.id,
            rubricaId: rubricaIRRF.id,
            descricao: "IRRF — 13º Salário",
            tipo: "DESCONTO" as const,
            valor: irrf,
            referencia: 0,
            baseINSS: 0,
            baseFGTS: 0,
            baseIRRF: 0,
          });
        }
      }
    }

    await db.folha.create({
      data: {
        empresaId,
        competencia,
        tipo: tipoFolha as any,
        status: "FECHADA",
        totalProventos,
        totalDescontos,
        totalLiquido: totalProventos - totalDescontos,
        totalINSSEmpregado: totalINSS,
        totalIRRF,
        itens: { create: itensData },
      },
    });

    redirect("/folha/decimo-terceiro?empresaId=" + empresaId + "&parcela=" + parcela + "&processado=1");
  } catch (err: any) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err;
    redirect("/folha/decimo-terceiro?error=" + encodeURIComponent(String(err?.message ?? "Erro ao processar 13º salário.")));
  }
}
