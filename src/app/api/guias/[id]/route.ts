import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { hasPermissao } from "@/lib/permissoes";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAuth();
  if (!guard.ok) return guard.response;
  const { escritorioId, perfil, permissoes } = guard.session;

  if (!hasPermissao(perfil, permissoes as string[], "guias")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const guia = await db.guiaPagamento.findFirst({
    where: { id, empresa: { escritorioId } },
  });
  if (!guia) return NextResponse.json({ error: "Guia não encontrada" }, { status: 404 });

  const updated = await db.guiaPagamento.update({
    where: { id },
    data: {
      status: body.status ?? guia.status,
      dataPagamento: body.dataPagamento ? new Date(body.dataPagamento) : guia.dataPagamento,
    },
  });

  return NextResponse.json(updated);
}
