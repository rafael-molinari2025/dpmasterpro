import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { hasPermissao } from "@/lib/permissoes";
import { db } from "@/lib/db";

async function getFuncionario(id: string, escritorioId: string) {
  return db.funcionario.findFirst({ where: { id, empresa: { escritorioId } }, select: { id: true } });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAuth();
  if (!guard.ok) return guard.response;
  const { escritorioId } = guard.session;
  const { id } = await params;

  const func = await getFuncionario(id, escritorioId);
  if (!func) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const dependentes = await db.dependente.findMany({
    where: { funcionarioId: id },
    orderBy: { nome: "asc" },
  });
  return NextResponse.json(dependentes);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAuth();
  if (!guard.ok) return guard.response;
  const { escritorioId, perfil, permissoes } = guard.session;
  const { id } = await params;

  if (!hasPermissao(perfil, permissoes as string[], "funcionarios")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const func = await getFuncionario(id, escritorioId);
  if (!func) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const body = await req.json();
  const { nome, cpf, dataNascimento, parentesco, invalidez, deducaoIRRF, planoSaude } = body;

  if (!nome || !dataNascimento || !parentesco) {
    return NextResponse.json({ error: "Nome, data de nascimento e parentesco são obrigatórios" }, { status: 400 });
  }

  const dep = await db.dependente.create({
    data: {
      funcionarioId: id,
      nome,
      cpf: cpf || null,
      dataNascimento: new Date(dataNascimento),
      parentesco,
      invalidez: invalidez === true,
      deducaoIRRF: deducaoIRRF !== false,
      planoSaude: planoSaude === true,
    },
  });
  return NextResponse.json(dep, { status: 201 });
}
