import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export type GuardedSession = {
  userId: string;
  escritorioId: string;
  email: string;
  name: string;
};

type GuardOk = { ok: true; session: GuardedSession };
type GuardFail = { ok: false; response: NextResponse };
export type GuardResult = GuardOk | GuardFail;

export async function requireAuth(): Promise<GuardResult> {
  const session = await auth();
  const escritorioId = (session?.user as any)?.escritorioId as string | undefined;

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
    },
  };
}
