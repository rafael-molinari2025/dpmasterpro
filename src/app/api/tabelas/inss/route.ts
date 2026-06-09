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
    const { ano, vigencia, faixas, tetoContribuicao, salarioMinimo } = body;
    if (!ano || !faixas || !Array.isArray(faixas) || faixas.length === 0) {
      return NextResponse.json({ error: "Campos obrigatórios: ano, faixas (array)" }, { status: 400 });
    }
    if (!tetoContribuicao || !salarioMinimo) {
      return NextResponse.json({ error: "Campos obrigatórios: tetoContribuicao, salarioMinimo" }, { status: 400 });
    }
    const tabela = await db.tabelaINSS.create({
      data: {
        ano,
        vigencia: vigencia ? new Date(vigencia) : new Date(`${ano}-01-01`),
        faixas,
        tetoContribuicao,
        salarioMinimo,
      },
    });
    return NextResponse.json(tabela, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao criar tabela" }, { status: 500 });
  }
}
