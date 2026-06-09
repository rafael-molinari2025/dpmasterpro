import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";

export async function GET(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const { escritorioId } = guard.session;

  const { searchParams } = new URL(request.url);
  const page     = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(100, parseInt(searchParams.get("pageSize") ?? "50"));
  const nivel    = searchParams.get("nivel") ?? undefined;
  const tipo     = searchParams.get("tipo") ?? undefined;
  const q        = searchParams.get("q") ?? undefined;
  const de       = searchParams.get("de") ?? undefined;
  const ate      = searchParams.get("ate") ?? undefined;

  const where: Record<string, unknown> = { escritorioId };
  if (nivel) where.nivel = nivel;
  if (tipo)  where.tipo  = tipo;
  if (q) {
    where.OR = [
      { descricao:   { contains: q, mode: "insensitive" } },
      { acao:        { contains: q, mode: "insensitive" } },
      { nomeUsuario: { contains: q, mode: "insensitive" } },
      { modulo:      { contains: q, mode: "insensitive" } },
    ];
  }
  if (de || ate) {
    const range: Record<string, Date> = {};
    if (de)  range.gte = new Date(de);
    if (ate) range.lte = new Date(ate + "T23:59:59.999Z");
    where.createdAt = range;
  }

  const [logs, total, contadores] = await Promise.all([
    db.logSistema.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.logSistema.count({ where }),
    db.logSistema.groupBy({
      by: ["nivel"],
      where: { escritorioId },
      _count: { _all: true },
    }),
  ]);

  return NextResponse.json({ logs, total, page, pageSize, contadores });
}

export async function DELETE(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const { escritorioId } = guard.session;

  const { searchParams } = new URL(request.url);
  const antes = searchParams.get("antes");
  if (!antes) {
    return NextResponse.json({ error: "Parâmetro 'antes' obrigatório" }, { status: 400 });
  }

  const result = await db.logSistema.deleteMany({
    where: { escritorioId, createdAt: { lt: new Date(antes) } },
  });

  return NextResponse.json({ deletados: result.count });
}
