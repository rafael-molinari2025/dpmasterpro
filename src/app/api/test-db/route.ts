import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const usuario = await db.usuario.findUnique({
      where: { email: "admin@escritorioexemplo.com.br" },
    });

    if (!usuario) return NextResponse.json({ ok: false, erro: "Usuário não encontrado" });

    const senhaOk = await bcrypt.compare("Admin@2026", usuario.senha);
    const hashLength = usuario.senha.length;
    const hashPrefix = usuario.senha.substring(0, 7);

    return NextResponse.json({
      ok: true,
      ativo: usuario.ativo,
      perfil: usuario.perfil,
      senhaCorreta: senhaOk,
      hashLength,
      hashPrefix,
    });
  } catch (error) {
    return NextResponse.json({ ok: false, erro: String(error) }, { status: 500 });
  }
}
