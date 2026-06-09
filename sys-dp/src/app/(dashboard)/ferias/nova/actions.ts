"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export async function programarFerias(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const escritorioId = (session.user as any).escritorioId as string;
  const funcionarioId = formData.get("funcionarioId") as string;
  const dataInicioGozo = formData.get("dataInicioGozo") as string;
  const dataFimGozo = formData.get("dataFimGozo") as string;
  const diasAbono = parseInt(formData.get("diasAbono") as string) || 0;
  const adiantamento13 = formData.get("adiantamento13") === "on";

  if (!funcionarioId || !dataInicioGozo || !dataFimGozo) {
    redirect("/ferias/nova?error=" + encodeURIComponent("Preencha todos os campos obrigatórios."));
  }

  try {
    const func = await db.funcionario.findFirst({
      where: { id: funcionarioId, empresa: { escritorioId } },
    });
    if (!func) redirect("/ferias/nova?error=" + encodeURIComponent("Funcionário não encontrado."));

    const inicio = new Date(dataInicioGozo);
    const fim = new Date(dataFimGozo);
    const diasGozo = Math.round((fim.getTime() - inicio.getTime()) / (24 * 60 * 60 * 1000)) + 1;

    if (diasGozo <= 0) {
      redirect("/ferias/nova?error=" + encodeURIComponent("Data final deve ser posterior à inicial."));
    }

    // Período aquisitivo — 12 meses antes do início do gozo
    const dataInicioAquisitivo = new Date(inicio);
    dataInicioAquisitivo.setFullYear(dataInicioAquisitivo.getFullYear() - 1);
    const dataFimAquisitivo = new Date(inicio);
    dataFimAquisitivo.setDate(dataFimAquisitivo.getDate() - 1);

    await db.ferias.create({
      data: {
        empresaId: func.empresaId,
        funcionarioId,
        periodoAquisitivo: `${dataInicioAquisitivo.toLocaleDateString("pt-BR")} – ${dataFimAquisitivo.toLocaleDateString("pt-BR")}`,
        dataInicioAquisitivo,
        dataFimAquisitivo,
        dataInicioGozo: inicio,
        dataFimGozo: fim,
        diasDireito: 30,
        diasGozo,
        diasAbono: Math.min(diasAbono, 10),
        adiantamento13,
        status: "AGENDADA",
      },
    });
  } catch (err: any) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err;
    redirect("/ferias/nova?error=" + encodeURIComponent("Erro ao programar férias. Verifique os dados e tente novamente."));
  }

  redirect("/ferias");
}
