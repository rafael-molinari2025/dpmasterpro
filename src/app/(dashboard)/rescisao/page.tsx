import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Header from "@/components/layout/Header";
import { Calculator, Search } from "lucide-react";
import { calcularRescisao } from "@/lib/calculo-folha";
import PrintButton from "@/components/PrintButton";

const tipoRescisaoLabel: Record<string, string> = {
  PEDIDO_DEMISSAO:          "Pedido de Demissão",
  DEMISSAO_SEM_JUSTA_CAUSA: "Demissão Sem Justa Causa",
  DEMISSAO_COM_JUSTA_CAUSA: "Demissão Com Justa Causa",
  RESCISAO_INDIRETA:        "Rescisão Indireta",
  ACORDO_MUTUAL:            "Acordo Mutual",
  APOSENTADORIA:            "Aposentadoria",
  TERMINO_CONTRATO:         "Término de Contrato",
};

function fmt(v: number) {
  return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default async function RescisaoPage({
  searchParams,
}: {
  searchParams: Promise<{ cpf?: string; tipo?: string; data?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const escritorioId = (session.user as any).escritorioId as string;

  const { cpf: cpfParam, tipo: tipoParam, data: dataParam } = await searchParams;

  const cpfLimpo = cpfParam?.replace(/\D/g, "") ?? "";

  let funcionario: any = null;
  let resultado: ReturnType<typeof calcularRescisao> | null = null;
  let erro = "";

  if (cpfLimpo && tipoParam && dataParam) {
    funcionario = await db.funcionario.findFirst({
      where: { cpf: cpfLimpo, empresa: { escritorioId } },
      include: {
        dependentes: { where: { deducaoIRRF: true } },
        empresa: { select: { nomeFantasia: true, razaoSocial: true, cnpj: true } },
        cargo: { select: { descricao: true } },
      },
    });

    if (!funcionario) {
      erro = "Funcionário não encontrado para o CPF informado.";
    } else if (new Date(dataParam) < new Date(funcionario.dataAdmissao)) {
      erro = "A data de demissão deve ser posterior à data de admissão.";
    } else {
      resultado = calcularRescisao({
        salario: parseFloat(funcionario.salario.toString()),
        dataAdmissao: new Date(funcionario.dataAdmissao),
        dataDemissao: new Date(dataParam),
        tipoRescisao: tipoParam,
        numDependentes: funcionario.dependentes.length,
      });
    }
  }

  return (
    <>
      <Header title="Rescisão" subtitle="Cálculo e emissão de TRCT — Termo de Rescisão do Contrato de Trabalho" />
      <div className="flex-1 p-3 sm:p-6 space-y-6">

        {/* Formulário de busca */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Calcular Nova Rescisão</h2>
          {erro && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {erro}
            </div>
          )}
          <form method="GET" action="/rescisao">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1">CPF do Funcionário</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    name="cpf"
                    defaultValue={cpfParam ?? ""}
                    placeholder="000.000.000-00"
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Tipo de Rescisão</label>
                <select
                  name="tipo"
                  defaultValue={tipoParam ?? ""}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 bg-white"
                >
                  <option value="">Selecione...</option>
                  {Object.entries(tipoRescisaoLabel).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Data do Desligamento</label>
                <input
                  type="date"
                  name="data"
                  defaultValue={dataParam ?? ""}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
              >
                <Calculator className="w-4 h-4" />
                Calcular Rescisão
              </button>
            </div>
          </form>
        </div>

        {/* Dados do funcionário (se encontrado) */}
        {funcionario && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <p className="text-slate-500">Funcionário</p>
              <p className="font-semibold text-slate-800 mt-0.5">{funcionario.nome}</p>
            </div>
            <div>
              <p className="text-slate-500">Cargo</p>
              <p className="font-medium text-slate-700 mt-0.5">{funcionario.cargo?.descricao ?? "—"}</p>
            </div>
            <div>
              <p className="text-slate-500">Admissão</p>
              <p className="font-medium text-slate-700 mt-0.5">
                {new Date(funcionario.dataAdmissao).toLocaleDateString("pt-BR")}
              </p>
            </div>
            <div>
              <p className="text-slate-500">Salário Base</p>
              <p className="font-medium text-slate-700 mt-0.5">
                {fmt(parseFloat(funcionario.salario.toString()))}
              </p>
            </div>
            {resultado && (
              <>
                <div>
                  <p className="text-slate-500">Tempo de Serviço</p>
                  <p className="font-medium text-slate-700 mt-0.5">
                    {resultado.anos} ano{resultado.anos !== 1 ? "s" : ""} ({resultado.mesesTotal} meses)
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Tipo de Rescisão</p>
                  <p className="font-medium text-slate-700 mt-0.5">
                    {tipoRescisaoLabel[tipoParam!] ?? tipoParam}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Aviso Prévio</p>
                  <p className="font-medium text-slate-700 mt-0.5">{resultado.diasAviso} dias</p>
                </div>
                <div>
                  <p className="text-slate-500">Dependentes IRRF</p>
                  <p className="font-medium text-slate-700 mt-0.5">{funcionario.dependentes.length}</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* TRCT */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">TRCT — Demonstrativo de Rescisão</h2>
            {resultado && <PrintButton />}
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Proventos */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Verbas Rescisórias — Proventos
                </h3>
                <div className="space-y-2">
                  {[
                    { label: "Saldo de Salário",        valor: resultado?.saldoSalario    ?? null },
                    { label: "Aviso Prévio Indenizado", valor: resultado?.indenAviso       ?? null },
                    { label: "Férias Vencidas + 1/3",   valor: resultado?.feriasVencidas  ?? null },
                    { label: "Férias Proporcionais + 1/3", valor: resultado?.feriasPropor ?? null },
                    { label: "13º Proporcional",        valor: resultado?.decimo13        ?? null },
                    { label: "Multa FGTS",              valor: resultado?.multaFGTS       ?? null },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between text-sm">
                      <span className="text-gray-600">{item.label}</span>
                      <span className={`font-medium ${item.valor !== null && item.valor > 0 ? "text-gray-900" : "text-gray-400"}`}>
                        {item.valor !== null ? fmt(item.valor) : "R$ —"}
                      </span>
                    </div>
                  ))}
                  <div className="border-t pt-2 flex justify-between text-sm font-bold">
                    <span className="text-gray-900">Total Bruto</span>
                    <span className="text-green-700">
                      {resultado ? fmt(resultado.totalBruto) : "R$ —"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Descontos + Totais */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Descontos</h3>
                <div className="space-y-2">
                  {[
                    { label: "INSS s/ Rescisão", valor: resultado?.inssRescisao  ?? null },
                    { label: "IRRF s/ Rescisão", valor: resultado?.irrfRescisao  ?? null },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between text-sm">
                      <span className="text-gray-600">{item.label}</span>
                      <span className={`font-medium ${item.valor !== null && item.valor > 0 ? "text-red-600" : "text-gray-400"}`}>
                        {item.valor !== null ? `- ${fmt(item.valor)}` : "R$ —"}
                      </span>
                    </div>
                  ))}
                  <div className="border-t pt-2 flex justify-between text-sm font-bold">
                    <span className="text-gray-900">Total Descontos</span>
                    <span className="text-red-600">
                      {resultado ? `- ${fmt(resultado.totalDescontos)}` : "R$ —"}
                    </span>
                  </div>
                </div>

                <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-xs text-green-700">Valor Líquido a Receber</p>
                  <p className="text-2xl font-bold text-green-800 mt-1">
                    {resultado ? fmt(resultado.totalLiquido) : "R$ —"}
                  </p>
                </div>

                <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs text-amber-700">FGTS a Depositar (saldo + multa)</p>
                  <p className="text-lg font-bold text-amber-800 mt-0.5">
                    {resultado ? fmt(resultado.fgtsADepositar) : "R$ —"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CLT Reference */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-slate-800 mb-2">Referências CLT</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs text-slate-600">
            {[
              { tipo: "Pedido de Demissão",    verbas: "Saldo + Férias + 13º Prop." },
              { tipo: "Sem Justa Causa",       verbas: "+ Aviso + Multa FGTS 40%" },
              { tipo: "Com Justa Causa",       verbas: "Apenas Saldo + FGTS" },
              { tipo: "Acordo Mutual",         verbas: "+ 50% Aviso + Multa FGTS 20%" },
            ].map((item) => (
              <div key={item.tipo} className="bg-white border border-slate-200 rounded-lg p-3">
                <p className="font-medium text-slate-700">{item.tipo}</p>
                <p className="mt-1">{item.verbas}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}
