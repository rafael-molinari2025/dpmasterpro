import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const escritorioId = searchParams.get("escritorioId");

  try {
    const empresas = await db.empresa.findMany({
      where: escritorioId ? { escritorioId } : undefined,
      include: {
        _count: { select: { funcionarios: true } },
      },
      orderBy: { razaoSocial: "asc" },
    });
    return NextResponse.json(empresas);
  } catch {
    return NextResponse.json({ error: "Erro ao buscar empresas" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const empresa = await db.empresa.create({ data: body });
    return NextResponse.json(empresa, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao criar empresa" }, { status: 500 });
  }
}
