import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Header from "@/components/layout/Header";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import FormNotificacoes from "./FormNotificacoes";

const DEFAULT_CFG = {
  ferias:      { ativo: true,  diasAntecedencia: 30 },
  guias:       { ativo: true,  diasAntecedencia: 5  },
  certificado: { ativo: true,  diasAntecedencia: 30 },
  esocial:     { ativo: true,  diasPendente: 3      },
  email:       { ativo: false, destinatarios: ""    },
};

export default async function NotificacoesPage() {
  const session = await auth();
  const user = session?.user as any;
  if (!session?.user) redirect("/login");
  if (user?.perfil !== "ADMIN") redirect("/dashboard");

  const escritorio = await db.escritorio.findUnique({
    where: { id: user.escritorioId },
    select: { configuracoes: true },
  });

  const config = (escritorio?.configuracoes as any)?.notificacoes ?? {};
  const cfgInicial = { ...DEFAULT_CFG, ...config };

  return (
    <>
      <Header title="Notificações" subtitle="Configure alertas e avisos automáticos do sistema" />
      <div className="flex-1 p-6">
        <div className="flex items-center gap-2 mb-6 text-sm text-gray-500">
          <Link href="/configuracoes" className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Configurações
          </Link>
          <span>/</span>
          <span className="text-gray-700 font-medium">Notificações</span>
        </div>
        <FormNotificacoes inicial={cfgInicial} />
      </div>
    </>
  );
}
