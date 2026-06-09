import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Header from "@/components/layout/Header";
import FormNovoFuncionario from "./FormNovoFuncionario";

export default async function NovoFuncionarioPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const escritorioId = (session.user as any).escritorioId as string;

  const [empresas, cargosRaw, setoresRaw] = await Promise.all([
    db.empresa.findMany({
      where: { escritorioId, ativa: true },
      select: { id: true, nomeFantasia: true, razaoSocial: true },
      orderBy: { razaoSocial: "asc" },
    }),
    db.cargo.findMany({
      where: { empresa: { escritorioId }, ativo: true },
      select: { id: true, empresaId: true, descricao: true, codigo: true, salarioBase: true },
      orderBy: { descricao: "asc" },
    }),
    db.setor.findMany({
      where: { empresa: { escritorioId }, ativo: true },
      select: { id: true, empresaId: true, descricao: true, codigo: true },
      orderBy: { descricao: "asc" },
    }),
  ]);

  const cargos = cargosRaw.map((c) => ({
    ...c,
    salarioBase: parseFloat(c.salarioBase.toString()),
  }));

  return (
    <>
      <Header title="Novo Funcionário" subtitle="Cadastro de colaborador" />
      <FormNovoFuncionario empresas={empresas} cargos={cargos} setores={setoresRaw} />
    </>
  );
}
