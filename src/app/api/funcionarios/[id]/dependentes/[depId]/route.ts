import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { hasPermissao } from "@/lib/permissoes";
import { db } from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; depId: string }> }
) {
  const guard = await requireAuth();
  if (!guard.ok) return guard.response;
  const { escritorioId, perfil, permissoes } = guard.session;
  const { id, depId } = await params;

  if (!hasPermissao(perfil, permissoes as string[], "funcionarios")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const func = await db.funcionario.findFirst({
    where: { id, empresa: { escritorioId } },
    select: { id: true },
  });
  if (!func) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const dep = await db.dependente.findFirst({ where: { id: depId, funcionarioId: id } });
  if (!dep) return NextResponse.json({ error: "Dependente não encontrado" }, { status: 404 });

  await db.dependente.delete({ where: { id: depId } });
  return NextResponse.json({ ok: true });
}
