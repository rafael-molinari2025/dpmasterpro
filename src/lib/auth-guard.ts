import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export type GuardedSession = {
  userId: string;
  escritorioId: string;
  email: string;
  name: string;
  perfil: string;
  permissoes: string[];
};

type GuardOk = { ok: true; session: GuardedSession };
type GuardFail = { ok: false; response: NextResponse };
export type GuardResult = GuardOk | GuardFail;

export async function requireAuth(): Promise<GuardResult> {
  const session = await auth();
  const user = session?.user as any;
  const escritorioId = user?.escritorioId as string | undefined;

  if (!session?.user?.id || !escritorioId) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Não autenticado" }, { status: 401 }),
    };
  }

  return {
    ok: true,
    session: {
      userId: session.user.id,
      escritorioId,
      email: session.user.email ?? "",
      name: session.user.name ?? "",
      perfil: user.perfil ?? "OPERADOR",
      permissoes: Array.isArray(user.permissoes) ? user.permissoes : [],
    },
  };
}

export async function requireAdmin(): Promise<GuardResult> {
  const result = await requireAuth();
  if (!result.ok) return result;

  if (result.session.perfil !== "ADMIN") {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Acesso negado. Apenas administradores." },
        { status: 403 }
      ),
    };
  }

  return result;
}
