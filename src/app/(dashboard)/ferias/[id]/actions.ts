"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export async function cancelarFerias(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const escritorioId = (session.user as any).escritorioId as string;

  const feriasId = formData.get("feriasId") as string;

  try {
    const ferias = await db.ferias.findFirst({
      where: { id: feriasId, empresa: { escritorioId } },
    });
    if (!ferias) redirect("/ferias");

    await db.ferias.update({
      where: { id: feriasId },
      data: { status: "CANCELADA" },
    });
  } catch (err: any) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err;
  }

  redirect("/ferias");
}

export async function atualizarFerias(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const escritorioId = (session.user as any).escritorioId as string;

  const feriasId = formData.get("feriasId") as string;
  const dataInicioGozo = formData.get("dataInicioGozo") as string;
  const dataFimGozo = formData.get("dataFimGozo") as string;
  const diasAbono = parseInt(formData.get("diasAbono") as string) || 0;
  const adiantamento13 = formData.get("adiantamento13") === "on";
  const observacao = (formData.get("observacao") as string) || "";

  try {
    const ferias = await db.ferias.findFirst({
      where: { id: feriasId, empresa: { escritorioId } },
    });
    if (!ferias) redirect("/ferias");

    const inicio = new Date(dataInicioGozo);
    const fim = new Date(dataFimGozo);
    const diasGozo = Math.round((fim.getTime() - inicio.getTime()) / (24 * 60 * 60 * 1000)) + 1;

    if (diasGozo <= 0) {
      redirect(`/ferias/${feriasId}?error=` + encodeURIComponent("Data final deve ser posterior à inicial."));
    }

    await db.ferias.update({
      where: { id: feriasId },
      data: {
        dataInicioGozo: inicio,
        dataFimGozo: fim,
        diasGozo,
        diasAbono: Math.min(diasAbono, 10),
        adiantamento13,
        observacao: observacao || null,
      },
    });
  } catch (err: any) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err;
    redirect(`/ferias/${feriasId}?error=` + encodeURIComponent("Erro ao atualizar férias. Verifique os dados e tente novamente."));
  }

  redirect("/ferias");
}
