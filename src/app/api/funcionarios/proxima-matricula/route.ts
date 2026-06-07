import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";

export async function GET(request: Request) {
  const guard = await requireAuth();
  if (!guard.ok) return guard.response;
  const { escritorioId } = guard.session;

  const { searchParams } = new URL(request.url);
  const empresaId = searchParams.get("empresaId");

  if (!empresaId) {
    return NextResponse.json({ error: "empresaId obrigatório" }, { status: 400 });
  }

  const empresa = await db.empresa.findFirst({ where: { id: empresaId, escritorioId } });
  if (!empresa) return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });

  // Buscar todas as matrículas existentes e calcular o próximo número
  const funcionarios = await db.funcionario.findMany({
    where: { empresaId },
    select: { matricula: true },
  });

  let maior = 0;
  for (const f of funcionarios) {
    const num = parseInt(f.matricula.replace(/\D/g, ""), 10);
    if (!isNaN(num) && num > maior) maior = num;
  }

  const proxima = String(maior + 1).padStart(5, "0");
  return NextResponse.json({ proxima, total: funcionarios.length });
}
