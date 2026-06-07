import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const tabelas = await db.tabelaINSS.findMany({
      orderBy: { ano: "desc" },
    });
    return NextResponse.json(tabelas);
  } catch {
    return NextResponse.json({ error: "Erro ao buscar tabelas" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const tabela = await db.tabelaINSS.create({ data: body });
    return NextResponse.json(tabela, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao criar tabela" }, { status: 500 });
  }
}
