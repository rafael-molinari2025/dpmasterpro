import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";

export async function GET(request: Request) {
  const guard = await requireAuth();
  if (!guard.ok) return guard.response;
  const { escritorioId } = guard.session;

  const { searchParams } = new URL(request.url);
  const empresaId = searchParams.get("empresaId");
  const situacao = searchParams.get("situacao");
  const q = searchParams.get("q");

  try {
    if (empresaId) {
      const empresa = await db.empresa.findFirst({ where: { id: empresaId, escritorioId } });
      if (!empresa) return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    const funcionarios = await db.funcionario.findMany({
      where: {
        empresa: { escritorioId },
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
        empresa: { select: { razaoSocial: true, nomeFantasia: true } },
      },
      orderBy: { nome: "asc" },
    });
    return NextResponse.json(funcionarios);
  } catch {
    return NextResponse.json({ error: "Erro ao buscar funcionários" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const guard = await requireAuth();
  if (!guard.ok) return guard.response;
  const { escritorioId } = guard.session;

  try {
    const body = await request.json();
    const empresa = await db.empresa.findFirst({ where: { id: body.empresaId, escritorioId } });
    if (!empresa) return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });

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
      return NextResponse.json({ error: "CPF ou matrícula já cadastrado nesta empresa" }, { status: 409 });
    }
    return NextResponse.json({ error: "Erro ao criar funcionário" }, { status: 500 });
  }
}
