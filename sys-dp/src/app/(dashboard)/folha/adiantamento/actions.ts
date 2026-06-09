"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export async function processarAdiantamento(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const escritorioId = (session.user as any).escritorioId as string;

  const empresaId = formData.get("empresaId") as string;
  const percentual = parseInt(formData.get("percentual") as string) || 40;
  const competencia = formData.get("competencia") as string;

  if (!empresaId || !competencia) {
    redirect("/folha/adiantamento?error=" + encodeURIComponent("Selecione uma empresa e competência."));
  }

  try {
    const empresa = await db.empresa.findFirst({
      where: { id: empresaId, escritorioId },
    });
    if (!empresa) redirect("/folha/adiantamento");

    const funcionarios = await db.funcionario.findMany({
      where: { empresaId, situacao: "ATIVO", empresa: { escritorioId } },
    });

    if (funcionarios.length === 0) {
      redirect("/folha/adiantamento?empresaId=" + empresaId + "&error=" + encodeURIComponent("Nenhum funcionário ativo."));
    }

    // Garante rubricas necessárias
    const [rubricaSalario, rubricaAdiantamento] = await Promise.all([
      db.rubrica.upsert({
        where: { codigo: "0001" },
        create: { codigo: "0001", descricao: "Salário Base", tipo: "PROVENTO", naturezaESocial: "1000", incideINSS: true, incideFGTS: true, incideIRRF: true, incide13: true, incideFerias: true },
        update: {},
      }),
      db.rubrica.upsert({
        where: { codigo: "0050" },
        create: { codigo: "0050", descricao: "Adiantamento Salarial", tipo: "DESCONTO", naturezaESocial: "9999" },
        update: {},
      }),
    ]);

    // Cria ou recupera folha de adiantamento
    let folha = await db.folha.findFirst({
      where: { empresaId, competencia, tipo: "ADIANTAMENTO" },
    });

    if (!folha) {
      const pct = Math.min(100, Math.max(1, percentual));
      let totalProventos = 0;
      let totalDescontos = 0;
      const itensData: any[] = [];

      for (const func of funcionarios) {
        const salario = parseFloat(func.salario.toString());
        const valorAdiantamento = Math.round(salario * (pct / 100) * 100) / 100;
        totalProventos += salario;
        totalDescontos += valorAdiantamento;

        itensData.push(
          {
            funcionarioId: func.id,
            rubricaId: rubricaSalario.id,
            descricao: "Salário Base",
            tipo: "PROVENTO" as const,
            valor: salario,
            referencia: 1,
            baseINSS: 0,
            baseFGTS: 0,
            baseIRRF: 0,
          },
          {
            funcionarioId: func.id,
            rubricaId: rubricaAdiantamento.id,
            descricao: `Adiantamento Salarial (${pct}%)`,
            tipo: "DESCONTO" as const,
            valor: valorAdiantamento,
            referencia: pct,
            baseINSS: 0,
            baseFGTS: 0,
            baseIRRF: 0,
          }
        );
      }

      folha = await db.folha.create({
        data: {
          empresaId,
          competencia,
          tipo: "ADIANTAMENTO",
          status: "FECHADA",
          totalProventos,
          totalDescontos,
          totalLiquido: totalDescontos,
          itens: { create: itensData },
        },
      });
    }

    redirect("/folha/adiantamento?empresaId=" + empresaId + "&competencia=" + competencia + "&processado=1");
  } catch (err: any) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err;
    redirect("/folha/adiantamento?error=" + encodeURIComponent("Erro ao processar adiantamento. Verifique os dados e tente novamente."));
  }
}
