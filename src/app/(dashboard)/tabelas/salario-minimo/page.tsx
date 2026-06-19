import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Header from "@/components/layout/Header";
import { Info, TrendingUp } from "lucide-react";

const historico = [
  { ano: 2026, valor: 1621.00, reajuste: "+7.58%", vigencia: "01/01/2026", lei: "Decreto nº 12.303/2025" },
  { ano: 2025, valor: 1507.00, reajuste: "+7.51%", vigencia: "01/01/2025", lei: "Decreto nº 12.008/2024" },
  { ano: 2024, valor: 1412.00, reajuste: "+6.97%", vigencia: "01/01/2024", lei: "Decreto nº 11.864/2023" },
  { ano: 2023, valor: 1320.00, reajuste: "+9.09%", vigencia: "01/01/2023", lei: "Medida Provisória 1.172/2023" },
  { ano: 2022, valor: 1212.00, reajuste: "+10.18%", vigencia: "01/01/2022", lei: "Decreto nº 10.942/2022" },
  { ano: 2021, valor: 1100.00, reajuste: "+5.26%", vigencia: "01/01/2021", lei: "Decreto nº 10.591/2020" },
];

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function SalarioMinimoPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const smAtual = historico[0];

  return (
    <>
      <Header title="Salário Mínimo" subtitle="Vigência e histórico de reajustes" />
      <div className="flex-1 p-3 sm:p-6 space-y-6">

        <div className="bg-green-50 border border-green-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          <div className="text-center">
            <p className="text-xs text-green-700 font-medium uppercase tracking-wide">Salário Mínimo {smAtual.ano}</p>
            <p className="text-4xl font-bold text-green-800 mt-1">R$ {fmt(smAtual.valor)}</p>
            <p className="text-xs text-green-600 mt-1">{smAtual.reajuste} de reajuste</p>
          </div>
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Hora (220h/mês)", value: `R$ ${fmt(smAtual.valor / 220)}` },
              { label: "Dia (30 dias)", value: `R$ ${fmt(smAtual.valor / 30)}` },
              { label: "Semana", value: `R$ ${fmt((smAtual.valor / 30) * 7)}` },
              { label: "Vigência", value: smAtual.vigencia },
            ].map((item) => (
              <div key={item.label} className="bg-white/60 rounded-lg p-3 text-center">
                <p className="text-xs text-green-700">{item.label}</p>
                <p className="text-sm font-bold text-green-900 mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Pisos vinculados ao salário mínimo ({smAtual.ano})</p>
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-blue-700">
              {[
                { label: "Piso previdência social", value: `R$ ${fmt(smAtual.valor)}` },
                { label: "Benefício INSS mínimo", value: `R$ ${fmt(smAtual.valor)}` },
                { label: "Seguro-desemprego mínimo", value: `R$ ${fmt(smAtual.valor)}` },
                { label: "Pensão por morte mínima", value: `R$ ${fmt(smAtual.valor)}` },
              ].map((p) => (
                <div key={p.label} className="bg-white/50 rounded p-2">
                  <p className="text-xs">{p.label}</p>
                  <p className="text-sm font-bold mt-0.5">{p.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <h2 className="font-semibold text-gray-900">Histórico de Reajustes</h2>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full min-w-[480px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Ano</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">Valor</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">Reajuste</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Vigência</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Instrumento Legal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {historico.map((h) => (
                <tr key={h.ano} className={`hover:bg-gray-50 ${h.ano === 2026 ? "bg-green-50" : ""}`}>
                  <td className="px-5 py-3 text-sm font-bold text-gray-800">
                    {h.ano}
                    {h.ano === 2026 && <span className="ml-2 text-xs text-green-700 bg-green-100 px-1.5 py-0.5 rounded">Vigente</span>}
                  </td>
                  <td className="px-5 py-3 text-sm text-right font-medium text-gray-900">R$ {fmt(h.valor)}</td>
                  <td className="px-5 py-3 text-right">
                    <span className="text-sm font-bold text-green-600">{h.reajuste}</span>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-600">{h.vigencia}</td>
                  <td className="px-5 py-3 text-xs text-gray-500">{h.lei}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>

      </div>
    </>
  );
}
