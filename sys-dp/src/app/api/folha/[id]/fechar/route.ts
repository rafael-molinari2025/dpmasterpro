import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";
import { hasPermissao } from "@/lib/permissoes";
import { registrarLog } from "@/lib/logger";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAuth();
  if (!guard.ok) return guard.response;
  const { escritorioId, perfil, permissoes } = guard.session;

  if (!hasPermissao(perfil, permissoes as string[], "folha")) {
    return NextResponse.json({ error: "Sem permissão para fechar folha" }, { status: 403 });
  }

  const { id } = await params;

  const folha = await db.folha.findFirst({
    where: { id, empresa: { escritorioId } },
    include: { empresa: { select: { razaoSocial: true } } },
  });
  if (!folha) return NextResponse.json({ error: "Folha não encontrada" }, { status: 404 });
  if (folha.status === "FECHADA") {
    return NextResponse.json({ error: "Folha já está fechada" }, { status: 409 });
  }

  await db.folha.update({ where: { id }, data: { status: "FECHADA" } });

  await registrarLog({
    escritorioId,
    usuarioId: guard.session.userId,
    nomeUsuario: guard.session.name,
    tipo: "FOLHA",
    modulo: "folha",
    acao: "FECHAR",
    descricao: `Folha fechada: ${folha.empresa.razaoSocial} — ${folha.competencia} (${folha.tipo})`,
    detalhes: { folhaId: id, competencia: folha.competencia },
  });

  return NextResponse.json({ ok: true });
}
