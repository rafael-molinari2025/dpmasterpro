import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Header from "@/components/layout/Header";
import { programarFerias } from "./actions";
import { ArrowLeft, AlertCircle, Calendar } from "lucide-react";

export default async function FeriasNovaPage({
  searchParams,
}: {
  searchParams: Promise<{ empresaId?: string; error?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const escritorioId = (session.user as any).escritorioId as string;

  const { empresaId, error } = await searchParams;

  const [empresas, funcionarios] = await Promise.all([
    db.empresa.findMany({
      where: { escritorioId, ativa: true },
      select: { id: true, nomeFantasia: true, razaoSocial: true },
      orderBy: { razaoSocial: "asc" },
    }),
    empresaId
      ? db.funcionario.findMany({
          where: { empresaId, situacao: "ATIVO" },
          select: { id: true, nome: true, matricula: true, dataAdmissao: true },
          orderBy: { nome: "asc" },
        })
      : Promise.resolve([]),
  ]);

  const hoje = new Date();
  const dataHoje = hoje.toISOString().split("T")[0];

  return (
    <>
      <Header title="Programar Férias" subtitle="Agendar período de gozo para um funcionário" />
      <div className="flex-1 p-3 sm:p-6">
        <div className="max-w-2xl mx-auto">

          <a
            href="/ferias"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Férias
          </a>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{decodeURIComponent(error)}</p>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h2 className="font-semibold text-gray-900">Dados das Férias</h2>
            </div>

            {/* Passo 1: selecionar empresa */}
            {!empresaId && (
              <form method="GET" action="/ferias/nova">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">
                    Empresa <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="empresaId"
                    required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Selecione uma empresa...</option>
                    {empresas.map((e) => (
                      <option key={e.id} value={e.id}>{e.nomeFantasia ?? e.razaoSocial}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 mt-4">
                  <a
                    href="/ferias"
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 text-center"
                  >
                    Cancelar
                  </a>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                  >
                    Continuar
                  </button>
                </div>
              </form>
            )}

            {/* Passo 2: form completo */}
            {empresaId && (
              <form action={programarFerias} className="space-y-4">
                <input type="hidden" name="empresaId" value={empresaId} />

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">
                    Funcionário <span className="text-red-500">*</span>
                  </label>
                  {funcionarios.length === 0 ? (
                    <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                      Nenhum funcionário ativo encontrado para esta empresa.
                    </p>
                  ) : (
                    <select
                      name="funcionarioId"
                      required
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">Selecione o funcionário...</option>
                      {funcionarios.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.nome} — Matrícula {f.matricula} (adm. {new Date(f.dataAdmissao).toLocaleDateString("pt-BR")})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">
                      Início do Gozo <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="dataInicioGozo"
                      defaultValue={dataHoje}
                      required
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">
                      Fim do Gozo <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="dataFimGozo"
                      required
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">
                      Dias de Abono Pecuniário (máx. 10)
                    </label>
                    <input
                      type="number"
                      name="diasAbono"
                      defaultValue="0"
                      min="0"
                      max="10"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <input
                      type="checkbox"
                      name="adiantamento13"
                      id="adiantamento13"
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                    />
                    <label htmlFor="adiantamento13" className="text-sm text-gray-700">
                      Adiantamento do 13º
                    </label>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-800">
                  O período aquisitivo é calculado automaticamente com base na data de início do gozo.
                </div>

                <div className="flex gap-3 pt-2">
                  <a
                    href={`/ferias/nova`}
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 text-center transition-colors"
                  >
                    Voltar
                  </a>
                  <button
                    type="submit"
                    disabled={funcionarios.length === 0}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Calendar className="w-4 h-4" />
                    Agendar Férias
                  </button>
                </div>
              </form>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
