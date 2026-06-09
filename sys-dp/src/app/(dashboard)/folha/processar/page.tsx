import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Header from "@/components/layout/Header";
import { processarFolha } from "./actions";
import { Play, AlertCircle, ArrowLeft } from "lucide-react";

export default async function ProcessarFolhaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; empresaId?: string; competencia?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const escritorioId = (session.user as any).escritorioId as string;

  const { error, empresaId: defaultEmpresaId, competencia: defaultComp } = await searchParams;

  const hoje = new Date();
  const competenciaDefault =
    defaultComp ?? `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;

  const empresas = await db.empresa.findMany({
    where: { escritorioId, ativa: true },
    select: { id: true, nomeFantasia: true, razaoSocial: true },
    orderBy: { razaoSocial: "asc" },
  });

  return (
    <>
      <Header title="Processar Folha" subtitle="Calcular proventos e descontos da competência" />
      <div className="flex-1 p-3 sm:p-6">
        <div className="max-w-lg mx-auto">

          <a
            href="/folha"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Folha de Pagamento
          </a>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{decodeURIComponent(error)}</p>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-1">Configurações de Processamento</h2>
            <p className="text-sm text-gray-500 mb-6">
              O sistema calculará INSS, IRRF e FGTS para todos os funcionários ativos da empresa.
            </p>

            <form action={processarFolha} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">
                  Empresa <span className="text-red-500">*</span>
                </label>
                <select
                  name="empresaId"
                  defaultValue={defaultEmpresaId ?? ""}
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Selecione uma empresa...</option>
                  {empresas.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.nomeFantasia ?? e.razaoSocial}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">
                  Competência <span className="text-red-500">*</span>
                </label>
                <input
                  type="month"
                  name="competencia"
                  defaultValue={competenciaDefault}
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Tipo de Folha</label>
                <select
                  name="tipo"
                  defaultValue="NORMAL"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="NORMAL">Normal (Mensal)</option>
                  <option value="ADIANTAMENTO">Adiantamento</option>
                  <option value="COMPLEMENTAR">Complementar</option>
                </select>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-800">
                  <strong>Atenção:</strong> O processamento calcula automaticamente INSS progressivo, IRRF (com isenção 2026) e FGTS (8%) para todos os colaboradores ativos. As guias GPS, DARF e FGTS Digital serão geradas automaticamente.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <a
                  href="/folha"
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 text-center transition-colors"
                >
                  Cancelar
                </a>
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors font-medium"
                >
                  <Play className="w-4 h-4" />
                  Processar Folha
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </>
  );
}
