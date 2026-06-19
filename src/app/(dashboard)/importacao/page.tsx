import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Header from "@/components/layout/Header";
import ImportacaoClient from "./ImportacaoClient";

export default async function ImportacaoPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const escritorioId = (session.user as any).escritorioId as string;

  const empresas = await db.empresa.findMany({
    where: { escritorioId, ativa: true },
    select: { id: true, razaoSocial: true, nomeFantasia: true },
    orderBy: { razaoSocial: "asc" },
  });

  return (
    <>
      <Header title="Importação de Dados" subtitle="Importe funcionários via planilha CSV" />
      <div className="flex-1 p-3 sm:p-6">
        <ImportacaoClient empresas={empresas} />
      </div>
    </>
  );
}
