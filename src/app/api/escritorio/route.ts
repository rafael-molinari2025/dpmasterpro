import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const { escritorioId } = guard.session;

  const escritorio = await db.escritorio.findUnique({
    where: { id: escritorioId },
    select: { id: true, nome: true, cnpj: true, email: true, telefone: true, plano: true, configuracoes: true, createdAt: true },
  });
  if (!escritorio) return NextResponse.json({ error: "Escritório não encontrado" }, { status: 404 });

  return NextResponse.json(escritorio);
}

export async function PATCH(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const { escritorioId } = guard.session;

  try {
    const body = await request.json();
    const { configuracoes, nome, email, telefone } = body;

    const data: Record<string, unknown> = {};
    if (configuracoes !== undefined) data.configuracoes = configuracoes;
    if (nome !== undefined) data.nome = nome;
    if (email !== undefined) data.email = email;
    if (telefone !== undefined) data.telefone = telefone;

    const updated = await db.escritorio.update({
      where: { id: escritorioId },
      data,
      select: { id: true, nome: true, cnpj: true, email: true, telefone: true, plano: true, configuracoes: true },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Erro ao atualizar escritório" }, { status: 500 });
  }
}
