import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Header from "@/components/layout/Header";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import BotoesBackup from "./BotoesBackup";

export default async function BackupPage() {
  const session = await auth();
  const user = session?.user as any;
  if (!session?.user) redirect("/login");
  if (user?.perfil !== "ADMIN") redirect("/dashboard");

  const escritorioId = user.escritorioId as string;

  const [totalEmpresas, totalFuncionarios, totalFolhas, totalEventos, totalUsuarios] = await Promise.all([
    db.empresa.count({ where: { escritorioId } }),
    db.funcionario.count({ where: { empresa: { escritorioId } } }),
    db.folha.count({ where: { empresa: { escritorioId } } }),
    db.eventoEsocial.count({ where: { empresa: { escritorioId } } }),
    db.usuario.count({ where: { escritorioId } }),
  ]);

  const stats = { totalEmpresas, totalFuncionarios, totalFolhas, totalEventos, totalUsuarios };

  return (
    <>
      <Header title="Backup e Dados" subtitle="Exporte seus dados para backup ou migração" />
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center gap-2 mb-2 text-sm text-gray-500">
          <Link href="/configuracoes" className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Configurações
          </Link>
          <span>/</span>
          <span className="text-gray-700 font-medium">Backup e Dados</span>
        </div>

        <BotoesBackup stats={stats} />
      </div>
    </>
  );
}
