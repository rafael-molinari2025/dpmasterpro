import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";
import { registrarLog } from "@/lib/logger";
import bcrypt from "bcryptjs";

export async function PATCH(request: Request) {
  const guard = await requireAuth();
  if (!guard.ok) return guard.response;
  const { userId, escritorioId } = guard.session;

  try {
    const { senhaAtual, novaSenha } = await request.json();

    if (!senhaAtual || !novaSenha) {
      return NextResponse.json({ error: "Senha atual e nova senha são obrigatórias." }, { status: 400 });
    }
    if (typeof novaSenha !== "string" || novaSenha.length < 8) {
      return NextResponse.json({ error: "A nova senha deve ter pelo menos 8 caracteres." }, { status: 400 });
    }

    const usuario = await db.usuario.findFirst({ where: { id: userId, escritorioId } });
    if (!usuario) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });

    const senhaValida = await bcrypt.compare(senhaAtual, usuario.senha);
    if (!senhaValida) {
      return NextResponse.json({ error: "Senha atual incorreta." }, { status: 400 });
    }

    const hash = await bcrypt.hash(novaSenha, 12);
    await db.usuario.update({ where: { id: userId }, data: { senha: hash } });

    await registrarLog({
      escritorioId,
      usuarioId: userId,
      nomeUsuario: guard.session.name,
      tipo: "USUARIO",
      modulo: "perfil",
      acao: "ALTERAR_SENHA",
      descricao: `Usuário alterou sua própria senha: ${guard.session.email}`,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro ao alterar senha." }, { status: 500 });
  }
}
