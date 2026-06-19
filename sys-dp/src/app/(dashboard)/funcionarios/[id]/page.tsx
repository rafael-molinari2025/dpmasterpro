import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import Header from "@/components/layout/Header";
import FormEditarFuncionario from "./FormEditarFuncionario";
import DependentesSection from "./DependentesSection";
import Link from "next/link";
import { ArrowLeft, User, TrendingUp } from "lucide-react";

export default async function FuncionarioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const escritorioId = (session.user as any).escritorioId as string;
  const { id } = await params;

  const [funcionario, cargos, setores, dependentes, historicoSalario] = await Promise.all([
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
    db.dependente.findMany({
      where: { funcionario: { id, empresa: { escritorioId } } },
      orderBy: { nome: "asc" },
    }),
    db.historicoSalario.findMany({
      where: { funcionarioId: id },
      orderBy: { dataAlteracao: "desc" },
      take: 10,
    }).catch(() => [] as any[]),
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

        <div className="max-w-4xl space-y-6">
          <FormEditarFuncionario
            funcionario={funcData as any}
            cargos={cargos}
            setores={setores}
          />
          <DependentesSection
            funcionarioId={id}
            dependentesIniciais={dependentes.map((d) => ({
              ...d,
              dataNascimento: d.dataNascimento.toISOString(),
            }))}
          />

          {historicoSalario.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-gray-500" />
                <h2 className="text-sm font-semibold text-gray-800">Histórico Salarial</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {historicoSalario.map((h: any) => (
                  <div key={h.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm text-gray-700">
                        R$ {parseFloat(h.salarioAnterior.toString()).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        <span className="mx-2 text-gray-400">→</span>
                        <span className="font-medium text-gray-900">
                          R$ {parseFloat(h.salarioNovo.toString()).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                      </p>
                      {h.motivo && <p className="text-xs text-gray-400 mt-0.5">{h.motivo}</p>}
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(h.dataAlteracao).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </>
  );
}
