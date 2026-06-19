import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";

export async function GET() {
  const guard = await requireAuth();
  if (!guard.ok) return guard.response;
  const { escritorioId } = guard.session;

  const hoje = new Date();
  const em30dias = new Date(hoje.getTime() + 30 * 24 * 60 * 60 * 1000);

  try {
    const [feriasVencidas, guiasPendentes, guiasVencidas, esocialErro] = await Promise.all([
      // Férias vencidas não gozadas
      db.ferias.findMany({
        where: {
          empresa: { escritorioId },
          status: "VENCIDA",
        },
        select: {
          id: true,
          funcionario: { select: { nome: true } },
          empresa: { select: { nomeFantasia: true, razaoSocial: true } },
          dataFimAquisitivo: true,
          diasDireito: true,
        },
        orderBy: { dataFimAquisitivo: "asc" },
        take: 10,
      }),

      // Guias pendentes com vencimento nos próximos 7 dias
      db.guiaPagamento.findMany({
        where: {
          empresa: { escritorioId },
          status: "PENDENTE",
          dataVencimento: { gte: hoje, lte: new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000) },
        },
        select: {
          id: true,
          tipo: true,
          competencia: true,
          valorTotal: true,
          dataVencimento: true,
          empresa: { select: { nomeFantasia: true, razaoSocial: true } },
        },
        orderBy: { dataVencimento: "asc" },
        take: 10,
      }),

      // Guias vencidas não pagas
      db.guiaPagamento.findMany({
        where: {
          empresa: { escritorioId },
          status: "VENCIDA",
        },
        select: {
          id: true,
          tipo: true,
          competencia: true,
          valorTotal: true,
          dataVencimento: true,
          empresa: { select: { nomeFantasia: true, razaoSocial: true } },
        },
        orderBy: { dataVencimento: "desc" },
        take: 5,
      }),

      // Eventos eSocial com erro
      db.eventoEsocial.findMany({
        where: {
          empresa: { escritorioId },
          status: { in: ["ERRO", "REJEITADO"] },
        },
        select: {
          id: true,
          tipoEvento: true,
          descricao: true,
          status: true,
          empresa: { select: { nomeFantasia: true, razaoSocial: true } },
          updatedAt: true,
        },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
    ]);

    const alertas: Array<{
      id: string;
      tipo: "ferias" | "guia" | "esocial";
      nivel: "info" | "aviso" | "critico";
      titulo: string;
      descricao: string;
      link?: string;
    }> = [];

    for (const f of feriasVencidas) {
      const empresa = f.empresa.nomeFantasia ?? f.empresa.razaoSocial;
      alertas.push({
        id: `ferias-${f.id}`,
        tipo: "ferias",
        nivel: "critico",
        titulo: "Férias vencidas",
        descricao: `${f.funcionario.nome} (${empresa}) — ${f.diasDireito} dias não gozados`,
        link: "/ferias",
      });
    }

    for (const g of guiasVencidas) {
      const empresa = g.empresa.nomeFantasia ?? g.empresa.razaoSocial;
      const venc = new Date(g.dataVencimento).toLocaleDateString("pt-BR");
      alertas.push({
        id: `guia-venc-${g.id}`,
        tipo: "guia",
        nivel: "critico",
        titulo: `Guia vencida — ${g.tipo.replace("_", " ")}`,
        descricao: `${empresa} · ${g.competencia} · venceu ${venc}`,
        link: "/guias",
      });
    }

    for (const g of guiasPendentes) {
      const empresa = g.empresa.nomeFantasia ?? g.empresa.razaoSocial;
      const venc = new Date(g.dataVencimento).toLocaleDateString("pt-BR");
      alertas.push({
        id: `guia-pend-${g.id}`,
        tipo: "guia",
        nivel: "aviso",
        titulo: `Guia a vencer — ${g.tipo.replace("_", " ")}`,
        descricao: `${empresa} · ${g.competencia} · vence ${venc}`,
        link: "/guias",
      });
    }

    for (const e of esocialErro) {
      const empresa = e.empresa.nomeFantasia ?? e.empresa.razaoSocial;
      alertas.push({
        id: `esocial-${e.id}`,
        tipo: "esocial",
        nivel: "critico",
        titulo: `eSocial ${e.status === "REJEITADO" ? "rejeitado" : "com erro"} — ${e.tipoEvento}`,
        descricao: `${empresa} · ${e.descricao}`,
        link: "/esocial",
      });
    }

    return NextResponse.json({ alertas, total: alertas.length });
  } catch {
    return NextResponse.json({ alertas: [], total: 0 });
  }
}
