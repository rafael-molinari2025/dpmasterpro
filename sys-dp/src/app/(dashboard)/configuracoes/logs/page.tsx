import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Header from "@/components/layout/Header";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import LogsViewer from "./LogsViewer";

export default async function LogsPage() {
  const session = await auth();
  const user = session?.user as any;
  if (!session?.user) redirect("/login");
  if (user?.perfil !== "ADMIN") redirect("/dashboard");

  return (
    <>
      <Header title="Logs do Sistema" subtitle="Monitoramento de operações, cálculos e erros" />
      <div className="flex-1 p-6 space-y-5">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/configuracoes" className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Configurações
          </Link>
          <span>/</span>
          <span className="text-gray-700 font-medium">Logs do Sistema</span>
        </div>
        <LogsViewer />
      </div>
    </>
  );
}
