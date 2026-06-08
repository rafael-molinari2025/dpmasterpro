import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, requireAuth } from "@/lib/auth-guard";
import bcrypt from "bcryptjs";
import { registrarLog } from "@/lib/logger";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const { escritorioId } = guard.session;
  const { id } = await params;

  const usuario = await db.usuario.findFirst({
    where: { id, escritorioId },
    select: { id: true, nome: true, email: true, perfil: true, permissoes: true, ativo: true, ultimoAcesso: true, createdAt: true },
  });
  if (!usuario) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

  return NextResponse.json(usuario);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const { escritorioId, userId } = guard.session;
  const { id } = await params;

  const usuario = await db.usuario.findFirst({ where: { id, escritorioId } });
  if (!usuario) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

  try {
    const { nome, email, senha, perfil, permissoes, ativo } = await request.json();

    const data: Record<string, unknown> = {};
    if (nome !== undefined) data.nome = nome;
    if (email !== undefined) data.email = email.toLowerCase().trim();
    if (ativo !== undefined) data.ativo = ativo;
    if (perfil !== undefined) {
      data.perfil = perfil === "ADMIN" ? "ADMIN" : "OPERADOR";
      data.permissoes = perfil === "ADMIN" ? [] : (Array.isArray(permissoes) ? permissoes : []);
    } else if (Array.isArray(permissoes)) {
      data.permissoes = permissoes;
    }
    if (senha) {
      data.senha = await bcrypt.hash(senha, 12);
    }

    const updated = await db.usuario.update({
      where: { id },
      data,
      select: { id: true, nome: true, email: true, perfil: true, permissoes: true, ativo: true },
    });

    const alteracoes: string[] = [];
    if (nome !== undefined) alteracoes.push("nome");
    if (email !== undefined) alteracoes.push("e-mail");
    if (senha) alteracoes.push("senha");
    if (perfil !== undefined) alteracoes.push("perfil");
    if (permissoes !== undefined) alteracoes.push("permissões");
    if (ativo !== undefined) alteracoes.push(ativo ? "reativado" : "desativado");

    await registrarLog({
      escritorioId,
      usuarioId: guard.session.userId,
      nomeUsuario: guard.session.name,
      tipo: "USUARIO",
      modulo: "usuarios",
      acao: "EDITAR",
      descricao: `Usuário editado: ${updated.nome} (${updated.email}) — alterações: ${alteracoes.join(", ")}`,
      detalhes: { usuarioEditadoId: id, nome: updated.nome, email: updated.email, alteracoes },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Este e-mail já está em uso." }, { status: 409 });
    }
    return NextResponse.json({ error: "Erro ao atualizar usuário." }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const { escritorioId, userId } = guard.session;
  const { id } = await params;

  // Admin não pode se auto-deletar
  if (id === userId) {
    return NextResponse.json({ error: "Você não pode excluir sua própria conta." }, { status: 400 });
  }

  const usuario = await db.usuario.findFirst({ where: { id, escritorioId } });
  if (!usuario) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

  await db.usuario.delete({ where: { id } });

  await registrarLog({
    escritorioId,
    usuarioId: guard.session.userId,
    nomeUsuario: guard.session.name,
    nivel: "AVISO",
    tipo: "USUARIO",
    modulo: "usuarios",
    acao: "EXCLUIR",
    descricao: `Usuário excluído: ${usuario.nome} (${usuario.email})`,
    detalhes: { usuarioExcluidoId: id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil },
  });

  return NextResponse.json({ ok: true });
}
