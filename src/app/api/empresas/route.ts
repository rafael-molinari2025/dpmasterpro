import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";

export async function GET() {
  const guard = await requireAuth();
  if (!guard.ok) return guard.response;
  const { escritorioId } = guard.session;

  try {
    const empresas = await db.empresa.findMany({
      where: { escritorioId },
      include: { _count: { select: { funcionarios: true } } },
      orderBy: { razaoSocial: "asc" },
    });
    return NextResponse.json(empresas);
  } catch {
    return NextResponse.json({ error: "Erro ao buscar empresas" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const guard = await requireAuth();
  if (!guard.ok) return guard.response;
  const { escritorioId } = guard.session;

  try {
    const body = await request.json();
    const empresa = await db.empresa.create({
      data: { ...body, escritorioId },
    });
    return NextResponse.json(empresa, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao criar empresa" }, { status: 500 });
  }
}
