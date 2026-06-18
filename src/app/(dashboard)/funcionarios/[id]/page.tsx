import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import Header from "@/components/layout/Header";
import FormEditarFuncionario from "./FormEditarFuncionario";
import Link from "next/link";
import { ArrowLeft, User } from "lucide-react";

export default async function FuncionarioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const escritorioId = (session.user as any).escritorioId as string;
  const { id } = await params;

  const [funcionario, cargos, setores] = await Promise.all([
    db.funcionario.findFirst({
      where: { id, empresa: { escritorioId } },
      include: {
        empresa: { select: { id: true, razaoSocial: true, nomeFantasia: true } },
        cargo: { select: { id: true, descricao: true, codigo: true, empresaId: true } },
        setor: { select: { id: true, descricao: true, codigo: true, empresaId: true } },
      },
    }),
    db.cargo.findMany({
      where: { empresa: { escritorioId }, ativo: true },
      select: { id: true, descricao: true, codigo: true, empresaId: true },
      orderBy: { descricao: "asc" },
    }),
    db.setor.findMany({
      where: { empresa: { escritorioId }, ativo: true },
      select: { id: true, descricao: true, codigo: true, empresaId: true },
      orderBy: { descricao: "asc" },
    }),
  ]);

  if (!funcionario) notFound();

  const nomeEmpresa = funcionario.empresa.nomeFantasia ?? funcionario.empresa.razaoSocial;

  const funcData = {
    ...funcionario,
    salario: parseFloat(funcionario.salario.toString()),
    dataNascimento: funcionario.dataNascimento.toISOString(),
    dataAdmissao: funcionario.dataAdmissao.toISOString(),
    endereco: funcionario.endereco as Record<string, string> | null,
  };

  return (
    <>
      <Header
        title={funcionario.nome}
        subtitle={`${nomeEmpresa} • Matrícula ${funcionario.matricula}`}
      />
      <div className="flex-1 p-3 sm:p-6">

        <div className="flex items-center gap-2 mb-6 text-sm text-gray-500">
          <Link href="/funcionarios" className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Funcionários
          </Link>
          <span>/</span>
          <span className="flex items-center gap-1.5 text-gray-700 font-medium">
            <User className="w-3.5 h-3.5" />
            {funcionario.nome}
          </span>
        </div>

        <div className="max-w-4xl">
          <FormEditarFuncionario
            funcionario={funcData as any}
            cargos={cargos}
            setores={setores}
          />
        </div>

      </div>
    </>
  );
}
