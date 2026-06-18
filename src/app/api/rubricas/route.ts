import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { hasPermissao } from "@/lib/permissoes";
import { db } from "@/lib/db";

export async function GET() {
  const guard = await requireAuth();
  if (!guard.ok) return guard.response;
  const { escritorioId } = guard.session;

  const empresaIds = await db.empresa
    .findMany({ where: { escritorioId }, select: { id: true } })
    .then((es) => es.map((e) => e.id));

  const rubricas = await db.rubrica.findMany({
    where: {
      OR: [{ global: true }, { empresaId: { in: empresaIds } }],
    },
    orderBy: [{ tipo: "asc" }, { codigo: "asc" }],
  });
  return NextResponse.json(rubricas);
}

export async function POST(req: NextRequest) {
  const guard = await requireAuth();
  if (!guard.ok) return guard.response;
  const { escritorioId, perfil, permissoes } = guard.session;

  if (!hasPermissao(perfil, permissoes as string[], "rubricas")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const body = await req.json();
  const {
    codigo, descricao, tipo, naturezaESocial,
    incideINSS, incideFGTS, incideIRRF, incide13, incideFerias, incideRescisao,
    empresaId,
  } = body;

  if (!codigo || !descricao || !tipo || !naturezaESocial) {
    return NextResponse.json({ error: "Código, descrição, tipo e natureza eSocial são obrigatórios" }, { status: 400 });
  }

  // Validate empresaId if provided
  if (empresaId) {
    const empresa = await db.empresa.findFirst({ where: { id: empresaId, escritorioId } });
    if (!empresa) return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
  }

  try {
    const rubrica = await db.rubrica.create({
      data: {
        codigo,
        descricao,
        tipo,
        naturezaESocial,
        incideINSS: incideINSS === true,
        incideFGTS: incideFGTS === true,
        incideIRRF: incideIRRF === true,
        incide13: incide13 === true,
        incideFerias: incideFerias === true,
        incideRescisao: incideRescisao === true,
        global: !empresaId,
        empresaId: empresaId || null,
        ativa: true,
      },
    });
    return NextResponse.json(rubrica, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Já existe uma rubrica com este código" }, { status: 409 });
    }
    return NextResponse.json({ error: "Erro ao criar rubrica" }, { status: 500 });
  }
}
