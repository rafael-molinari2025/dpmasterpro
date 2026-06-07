import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";
import bcrypt from "bcryptjs";
import { PERMISSOES_PADRAO } from "@/lib/permissoes";

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const { escritorioId } = guard.session;

  const usuarios = await db.usuario.findMany({
    where: { escritorioId },
    select: {
      id: true,
      nome: true,
      email: true,
      perfil: true,
      permissoes: true,
      ativo: true,
      ultimoAcesso: true,
      createdAt: true,
    },
    orderBy: { nome: "asc" },
  });

  return NextResponse.json(usuarios);
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const { escritorioId } = guard.session;

  try {
    const { nome, email, senha, perfil, permissoes } = await request.json();

    if (!nome || !email || !senha) {
      return NextResponse.json({ error: "Nome, e-mail e senha são obrigatórios." }, { status: 400 });
    }

    const senhaHash = await bcrypt.hash(senha, 12);

    const perfilFinal = perfil === "ADMIN" ? "ADMIN" : "OPERADOR";
    const permissoesFinal: string[] = perfilFinal === "ADMIN"
      ? []
      : (Array.isArray(permissoes) ? permissoes : PERMISSOES_PADRAO);

    const usuario = await db.usuario.create({
      data: {
        escritorioId,
        nome,
        email: email.toLowerCase().trim(),
        senha: senhaHash,
        perfil: perfilFinal as any,
        permissoes: permissoesFinal,
      },
      select: { id: true, nome: true, email: true, perfil: true, permissoes: true, ativo: true, createdAt: true },
    });

    return NextResponse.json(usuario, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Este e-mail já está cadastrado." }, { status: 409 });
    }
    return NextResponse.json({ error: "Erro ao criar usuário." }, { status: 500 });
  }
}
