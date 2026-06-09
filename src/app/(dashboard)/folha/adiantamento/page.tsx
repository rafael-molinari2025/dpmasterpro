import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Header from "@/components/layout/Header";
import { Info, Play, DollarSign, Users, Calculator, CheckCircle, AlertCircle } from "lucide-react";
import { processarAdiantamento } from "./actions";

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function AdiantamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ empresaId?: string; percentual?: string; competencia?: string; processado?: string; error?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const escritorioId = (session.user as any).escritorioId as string;

  const hoje = new Date();
  const competenciaDefault = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
  const { empresaId, percentual = "40", competencia = competenciaDefault, processado, error } = await searchParams;

  const pct = Math.min(100, Math.max(1, parseInt(percentual) || 40));

  const [empresas, funcionarios] = await Promise.all([
    db.empresa.findMany({
      where: { escritorioId, ativa: true },
      select: { id: true, nomeFantasia: true, razaoSocial: true },
      orderBy: { razaoSocial: "asc" },
    }),
    empresaId
      ? db.funcionario.findMany({
          where: {
            empresaId,
            empresa: { escritorioId },
            situacao: "ATIVO",
          },
          include: { cargo: { select: { descricao: true } } },
          orderBy: { nome: "asc" },
        })
      : [],
  ]);

  const adiantamentos = funcionarios.map((f) => {
    const salario = parseFloat(f.salario.toString());
    const valorAdiantamento = salario * (pct / 100);
    return { id: f.id, nome: f.nome, matricula: f.matricula, cargo: f.cargo?.descricao ?? "—", salario, valorAdiantamento };
  });

  const totalAdiantamento = adiantamentos.reduce((s, a) => s + a.valorAdiantamento, 0);
  const totalSalarios = adiantamentos.reduce((s, a) => s + a.salario, 0);

  const mesLabel = new Date(competencia + "-01").toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <>
      <Header title="Adiantamento Salarial" subtitle={`Quinzenal — ${mesLabel.charAt(0).toUpperCase() + mesLabel.slice(1)}`} />
      <div className="flex-1 p-3 sm:p-6 space-y-6">

        {processado === "1" && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-800">Adiantamento processado com sucesso! Os registros foram criados na folha.</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{decodeURIComponent(error)}</p>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Adiantamento Quinzenal</p>
            <p className="mt-0.5 text-blue-700">
              O adiantamento salarial não sofre desconto de INSS ou IRRF — esses valores são calculados e descontados na folha mensal definitiva.
              O percentual mais comum é 40% do salário bruto.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <form method="GET" className="flex flex-wrap items-center gap-3">
            <select
              name="empresaId"
              defaultValue={empresaId ?? ""}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione uma empresa</option>
              {empresas.map((e) => (
                <option key={e.id} value={e.id}>{e.nomeFantasia ?? e.razaoSocial}</option>
              ))}
            </select>
            <input
              type="month"
              name="competencia"
              defaultValue={competencia}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Percentual:</label>
              <input
                type="number"
                name="percentual"
                defaultValue={pct}
                min={1}
                max={100}
                className="w-20 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">%</span>
            </div>
            <button type="submit" className="px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              Calcular
            </button>
          </form>

          {adiantamentos.length > 0 && (
            <form action={processarAdiantamento}>
              <input type="hidden" name="empresaId" value={empresaId ?? ""} />
              <input type="hidden" name="percentual" value={String(pct)} />
              <input type="hidden" name="competencia" value={competencia} />
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors w-full sm:w-auto justify-center"
              >
                <Play className="w-4 h-4" />
                Processar Adiantamento
              </button>
            </form>
          )}
        </div>

        {adiantamentos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: "Funcionários", value: String(adiantamentos.length), icon: Users, color: "blue" },
              { label: `Total Adiantamento (${pct}%)`, value: `R$ ${fmt(totalAdiantamento)}`, icon: DollarSign, color: "green" },
              { label: "Total Salários", value: `R$ ${fmt(totalSalarios)}`, icon: Calculator, color: "purple" },
            ].map((s) => {
              const Icon = s.icon;
              const colorMap: Record<string, string> = {
                blue: "bg-blue-50 text-blue-600",
                green: "bg-green-50 text-green-600",
                purple: "bg-purple-50 text-purple-600",
              };
              return (
                <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-gray-500">{s.label}</p>
                      <p className="text-xl font-bold text-gray-900 mt-1">{s.value}</p>
                    </div>
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colorMap[s.color]}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 text-sm">Adiantamento — {pct}% do salário bruto</h2>
          </div>
          {!empresaId ? (
            <div className="text-center py-16">
              <DollarSign className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Selecione uma empresa para calcular o adiantamento</p>
            </div>
          ) : adiantamentos.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Nenhum funcionário ativo nesta empresa</p>
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Matrícula</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Funcionário</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Cargo</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Salário Bruto</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Adiantamento ({pct}%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {adiantamentos.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 text-sm font-mono text-gray-500">{a.matricula}</td>
                      <td className="px-5 py-3 text-sm font-medium text-gray-900">{a.nome}</td>
                      <td className="px-5 py-3 text-sm text-gray-600">{a.cargo}</td>
                      <td className="px-5 py-3 text-sm text-right text-gray-700">R$ {fmt(a.salario)}</td>
                      <td className="px-5 py-3 text-sm text-right font-bold text-green-700">R$ {fmt(a.valorAdiantamento)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t border-gray-200">
                  <tr>
                    <td colSpan={3} className="px-5 py-3 text-xs font-medium text-gray-700">
                      Total — {adiantamentos.length} funcionário{adiantamentos.length !== 1 ? "s" : ""}
                    </td>
                    <td className="px-5 py-3 text-sm text-right font-bold text-gray-900">R$ {fmt(totalSalarios)}</td>
                    <td className="px-5 py-3 text-sm text-right font-bold text-green-700">R$ {fmt(totalAdiantamento)}</td>
                  </tr>
                </tfoot>
              </table>
              <div className="px-5 py-3 border-t border-gray-100 bg-amber-50">
                <p className="text-xs text-amber-800">
                  <strong>Atenção:</strong> O adiantamento não sofre desconto de INSS ou IRRF. Será deduzido automaticamente na folha mensal.
                </p>
              </div>
            </>
          )}
        </div>

      </div>
    </>
  );
}
