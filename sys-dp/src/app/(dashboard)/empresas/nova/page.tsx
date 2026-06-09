import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Header from "@/components/layout/Header";
import FormNovaEmpresa from "./FormNovaEmpresa";

export default async function NovaEmpresaPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <>
      <Header title="Nova Empresa" subtitle="Cadastro de empresa cliente" />
      <FormNovaEmpresa />
    </>
  );
}
