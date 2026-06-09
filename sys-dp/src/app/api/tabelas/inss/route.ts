import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";

export async function GET() {
  const guard = await requireAuth();
  if (!guard.ok) return guard.response;

  try {
    const tabelas = await db.tabelaINSS.findMany({ orderBy: { ano: "desc" } });
    return NextResponse.json(tabelas);
  } catch {
    return NextResponse.json({ error: "Erro ao buscar tabelas" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const guard = await requireAuth();
  if (!guard.ok) return guard.response;
  if (guard.session.perfil !== "ADMIN") {
    return NextResponse.json({ error: "Acesso restrito a administradores" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { ano, faixas, teto, salarioMinimo } = body;
    if (!ano || !faixas) {
      return NextResponse.json({ error: "Campos obrigatórios: ano, faixas" }, { status: 400 });
    }
    const tabela = await db.tabelaINSS.create({ data: { ano, faixas, teto, salarioMinimo } });
    return NextResponse.json(tabela, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao criar tabela" }, { status: 500 });
  }
}
