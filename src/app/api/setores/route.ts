import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { hasPermissao } from "@/lib/permissoes";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const guard = await requireAuth();
  if (!guard.ok) return guard.response;
  const { escritorioId, perfil, permissoes } = guard.session;

  if (!hasPermissao(perfil, permissoes as string[], "funcionarios")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { empresaId, codigo, descricao, centroCusto } = await req.json();

  if (!empresaId || !codigo || !descricao) {
    return NextResponse.json({ error: "Empresa, código e descrição são obrigatórios" }, { status: 400 });
  }

  const empresa = await db.empresa.findFirst({ where: { id: empresaId, escritorioId } });
  if (!empresa) return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });

  try {
    const setor = await db.setor.create({
      data: {
        empresaId,
        codigo,
        descricao,
        centroCusto: centroCusto || null,
        ativo: true,
      },
    });
    return NextResponse.json(setor, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Já existe um setor com este código nesta empresa" }, { status: 409 });
    }
    return NextResponse.json({ error: "Erro ao criar setor" }, { status: 500 });
  }
}
