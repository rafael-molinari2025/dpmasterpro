import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const usuarios = await db.usuario.findMany({ select: { email: true, ativo: true, perfil: true } });
    return NextResponse.json({ ok: true, total: usuarios.length, usuarios });
  } catch (error) {
    return NextResponse.json({ ok: false, erro: String(error) }, { status: 500 });
  }
}
