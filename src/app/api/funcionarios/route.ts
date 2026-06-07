import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const empresaId = searchParams.get("empresaId");
  const situacao = searchParams.get("situacao");
  const q = searchParams.get("q");

  try {
    const funcionarios = await db.funcionario.findMany({
      where: {
        ...(empresaId && { empresaId }),
        ...(situacao && { situacao: situacao as any }),
        ...(q && {
          OR: [
            { nome: { contains: q, mode: "insensitive" } },
            { cpf: { contains: q } },
            { matricula: { contains: q } },
          ],
        }),
      },
      include: {
        cargo: { select: { descricao: true } },
        setor: { select: { descricao: true } },
      },
      orderBy: { nome: "asc" },
    });
    return NextResponse.json(funcionarios);
  } catch {
    return NextResponse.json({ error: "Erro ao buscar funcionários" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const funcionario = await db.funcionario.create({
      data: body,
      include: {
        cargo: { select: { descricao: true } },
        setor: { select: { descricao: true } },
      },
    });
    return NextResponse.json(funcionario, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "CPF ou matrícula já cadastrado nesta empresa" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Erro ao criar funcionário" }, { status: 500 });
  }
}
