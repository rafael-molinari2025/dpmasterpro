import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Header from "@/components/layout/Header";
import { Calculator, Info, Users, DollarSign, Play, CheckCircle, AlertCircle } from "lucide-react";
import { processarDecimoTerceiro } from "./actions";

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function calcularAvos(dataAdmissao: Date, anoReferencia: number): number {
  const admissaoAno = dataAdmissao.getFullYear();
  const admissaoMes = dataAdmissao.getMonth() + 1;
  const admissaoDia = dataAdmissao.getDate();

  if (admissaoAno > anoReferencia) return 0;
  if (admissaoAno < anoReferencia) return 12;

  // Mesmo ano: conta meses. Se admitido até dia 15, conta o mês de admissão.
  const mesInicio = admissaoDia <= 15 ? admissaoMes : admissaoMes + 1;
  return Math.max(0, 13 - mesInicio);
}

export default async function DecimoTerceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ empresaId?: string; parcela?: string; processado?: string; error?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const escritorioId = (session.user as any).escritorioId as string;
  const { empresaId, parcela = "1", processado, error } = await searchParams;

  const anoAtual = new Date().getFullYear();

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
            situacao: { in: ["ATIVO", "FERIAS", "AFASTADO"] },
          },
          include: {
            cargo: { select: { descricao: true } },
            dependentes: { where: { deducaoIRRF: true } },
          },
          orderBy: { nome: "asc" },
        })
      : [],
  ]);

  const parcelas = funcionarios.map((f) => {
    const salario = parseFloat(f.salario.toString());
    const avos = calcularAvos(f.dataAdmissao, anoAtual);
    const valorBruto = (salario / 12) * avos;

    // 1ª parcela: 50% sem INSS/IRRF
    const valorPrimeiraParcela = valorBruto * 0.5;

    // 2ª parcela: restante com INSS e IRRF sobre valor total
    const valorSegundaParcela = valorBruto - valorPrimeiraParcela;

    // FGTS sobre valor total (informativo)
    const valorFGTS = valorBruto * 0.08;

    return {
      id: f.id,
      nome: f.nome,
      matricula: f.matricula,
      cargo: f.cargo?.descricao ?? "—",
      salario,
      avos,
      valorBruto,
      valorPrimeiraParcela,
      valorSegundaParcela,
      valorFGTS,
    };
  });

  const totalBruto = parcelas.reduce((s, p) => s + p.valorBruto, 0);
  const totalParcela = parcelas.reduce((s, p) => s + (parcela === "1" ? p.valorPrimeiraParcela : p.valorSegundaParcela), 0);
  const totalFGTS = parcelas.reduce((s, p) => s + p.valorFGTS, 0);

  const empresaSelecionada = empresas.find((e) => e.id === empresaId);

  return (
    <>
      <Header
        title="13º Salário"
        subtitle={`Cálculo ${anoAtual} — ${empresaSelecionada ? (empresaSelecionada.nomeFantasia ?? empresaSelecionada.razaoSocial) : "Selecione uma empresa"}`}
      />
      <div className="flex-1 p-3 sm:p-6 space-y-6">

        {processado === "1" && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-800">
              {parcela === "1" ? "1ª Parcela" : "2ª Parcela"} do 13º salário processada com sucesso!
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{decodeURIComponent(error)}</p>
          </div>
        )}

        {/* Info banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Prazos Legais — 13º Salário {anoAtual}</p>
            <p className="mt-0.5 text-blue-700">
              <strong>1ª Parcela (adiantamento 50%):</strong> entre 01/02 e 30/11/{anoAtual} &nbsp;|&nbsp;
              <strong>2ª Parcela (com INSS e IRRF):</strong> até 20/12/{anoAtual}
            </p>
            <p className="mt-0.5 text-blue-700 text-xs">
              Avos: admitido até dia 15 do mês conta o mês inteiro. A cada mês completo = 1/12 do salário.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <form method="GET" className="flex flex-wrap items-center gap-3">
            <select
              name="empresaId"
              defaultValue={empresaId ?? ""}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione uma empresa</option>
              {empresas.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nomeFantasia ?? e.razaoSocial}
                </option>
              ))}
            </select>
            <select
              name="parcela"
              defaultValue={parcela}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="1">1ª Parcela — Adiantamento (50%)</option>
              <option value="2">2ª Parcela — com INSS e IRRF</option>
            </select>
            <button
              type="submit"
              className="px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              Calcular
            </button>
          </form>

          {parcelas.length > 0 && (
            <form action={processarDecimoTerceiro}>
              <input type="hidden" name="empresaId" value={empresaId ?? ""} />
              <input type="hidden" name="parcela" value={parcela} />
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors w-full sm:w-auto justify-center"
              >
                <Play className="w-4 h-4" />
                Processar {parcela === "1" ? "1ª" : "2ª"} Parcela
              </button>
            </form>
          )}
        </div>

        {/* Summary cards */}
        {parcelas.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Funcionários", value: String(parcelas.length), icon: Users, color: "blue" },
              { label: `Valor ${parcela === "1" ? "1ª Parcela" : "2ª Parcela"}`, value: `R$ ${fmt(totalParcela)}`, icon: DollarSign, color: "green" },
              { label: "Total Bruto 13º", value: `R$ ${fmt(totalBruto)}`, icon: Calculator, color: "purple" },
              { label: "FGTS s/ 13º", value: `R$ ${fmt(totalFGTS)}`, icon: DollarSign, color: "amber" },
            ].map((s) => {
              const Icon = s.icon;
              const colorMap: Record<string, string> = {
                blue: "bg-blue-50 text-blue-600",
                green: "bg-green-50 text-green-600",
                purple: "bg-purple-50 text-purple-600",
                amber: "bg-amber-50 text-amber-600",
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

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 text-sm">
              {parcela === "1" ? "1ª Parcela — Adiantamento 50%" : "2ª Parcela — com INSS e IRRF"} — {anoAtual}
            </h2>
          </div>

          {!empresaId ? (
            <div className="text-center py-16">
              <Calculator className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Selecione uma empresa para calcular o 13º salário</p>
            </div>
          ) : parcelas.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Nenhum funcionário ativo nesta empresa</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Matrícula</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Funcionário</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Cargo</th>
                      <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Salário</th>
                      <th className="text-center px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Avos</th>
                      <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Valor Bruto</th>
                      <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {parcela === "1" ? "1ª Parcela" : "2ª Parcela"}
                      </th>
                      <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">FGTS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {parcelas.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 text-sm font-mono text-gray-500">{p.matricula}</td>
                        <td className="px-5 py-3 text-sm font-medium text-gray-900">{p.nome}</td>
                        <td className="px-5 py-3 text-sm text-gray-600">{p.cargo}</td>
                        <td className="px-5 py-3 text-sm text-right text-gray-700">R$ {fmt(p.salario)}</td>
                        <td className="px-5 py-3 text-center">
                          <span className="text-sm font-bold text-blue-700">{p.avos}/12</span>
                        </td>
                        <td className="px-5 py-3 text-sm text-right font-medium text-gray-900">
                          R$ {fmt(p.valorBruto)}
                        </td>
                        <td className="px-5 py-3 text-sm text-right font-bold text-green-700">
                          R$ {fmt(parcela === "1" ? p.valorPrimeiraParcela : p.valorSegundaParcela)}
                        </td>
                        <td className="px-5 py-3 text-sm text-right text-gray-600">
                          R$ {fmt(p.valorFGTS)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t border-gray-200">
                    <tr>
                      <td colSpan={5} className="px-5 py-3 text-xs font-medium text-gray-700">
                        Total — {parcelas.length} funcionário{parcelas.length !== 1 ? "s" : ""}
                      </td>
                      <td className="px-5 py-3 text-sm text-right font-bold text-gray-900">
                        R$ {fmt(totalBruto)}
                      </td>
                      <td className="px-5 py-3 text-sm text-right font-bold text-green-700">
                        R$ {fmt(totalParcela)}
                      </td>
                      <td className="px-5 py-3 text-sm text-right font-bold text-gray-700">
                        R$ {fmt(totalFGTS)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div className="px-5 py-3 border-t border-gray-100 bg-amber-50">
                <p className="text-xs text-amber-800">
                  <strong>Atenção:</strong> O IRRF e o INSS definitivos da 2ª parcela devem ser calculados separadamente sobre o valor total do 13º salário.
                  {parcela === "1" && " A 1ª parcela não sofre desconto de INSS nem IRRF."}
                </p>
              </div>
            </>
          )}
        </div>

      </div>
    </>
  );
}
