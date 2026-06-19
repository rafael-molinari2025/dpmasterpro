import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Header from "@/components/layout/Header";
import { Info, Percent } from "lucide-react";

const aliquotas = [
  { categoria: "Empregado CLT", aliquota: "8%", base: "Remuneração bruta mensal", obs: "Regra geral" },
  { categoria: "Empregado aprendiz (até 24 anos)", aliquota: "2%", base: "Remuneração bruta mensal", obs: "Art. 15, §7º, Lei 8.036/90" },
  { categoria: "Doméstico", aliquota: "8%", base: "Remuneração bruta mensal", obs: "LC 150/2015" },
  { categoria: "Trabalhador avulso", aliquota: "8%", base: "Remuneração bruta mensal", obs: "Equiparado a empregado" },
  { categoria: "Diretor não empregado", aliquota: "8% (optativo)", base: "Remuneração", obs: "Se optar pelo FGTS" },
];

const prazosDeposito = [
  { tipo: "FGTS mensal (folha)", prazo: "Até o dia 7 do mês seguinte", canal: "FGTS Digital (PIX)" },
  { tipo: "FGTS rescisório (multa 40%)", prazo: "Até 10 dias corridos da rescisão", canal: "FGTS Digital (PIX)" },
  { tipo: "FGTS 13º salário — 1ª parcela", prazo: "Até 31 de janeiro do ano seguinte", canal: "FGTS Digital (PIX)" },
  { tipo: "FGTS 13º salário — 2ª parcela", prazo: "Até 31 de janeiro do ano seguinte", canal: "FGTS Digital (PIX)" },
  { tipo: "FGTS férias (quando antecipado)", prazo: "Até o dia 7 do mês seguinte", canal: "FGTS Digital (PIX)" },
];

export default async function TabelaFGTSPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <>
      <Header title="FGTS 2026" subtitle="Alíquotas, prazos e regras do Fundo de Garantia" />
      <div className="flex-1 p-3 sm:p-6 space-y-6">

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">FGTS Digital — vigente desde março/2024</p>
            <p className="mt-0.5 text-blue-700">
              O recolhimento do FGTS é feito exclusivamente via <strong>Pix</strong> pelo FGTS Digital (gov.br).
              O sistema integra-se ao eSocial para geração automática da guia. Não há mais GRRF ou GFIP.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <Percent className="w-4 h-4 text-blue-600" />
              <h2 className="font-semibold text-gray-900">Alíquotas por Categoria</h2>
            </div>
            {/* Cards (mobile) */}
            <div className="sm:hidden divide-y divide-gray-100">
              {aliquotas.map((a) => (
                <div key={a.categoria} className="px-5 py-3 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700">{a.categoria}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{a.obs}</p>
                  </div>
                  <span className="flex-shrink-0 text-sm font-bold text-blue-700">{a.aliquota}</span>
                </div>
              ))}
            </div>
            {/* Tabela (tablet/desktop) */}
            <div className="hidden sm:block overflow-x-auto">
            <table className="w-full min-w-[400px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Categoria</th>
                  <th className="text-center px-5 py-3 text-xs font-medium text-gray-500">Alíquota</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Observação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {aliquotas.map((a) => (
                  <tr key={a.categoria} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-sm text-gray-700">{a.categoria}</td>
                    <td className="px-5 py-3 text-center">
                      <span className="text-sm font-bold text-blue-700">{a.aliquota}</span>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-500">{a.obs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Prazos de Depósito</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {prazosDeposito.map((p) => (
                <div key={p.tipo} className="px-5 py-3.5">
                  <p className="text-sm font-medium text-gray-900">{p.tipo}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{p.prazo}</p>
                  <span className="mt-1 inline-block text-[11px] px-2 py-0.5 rounded-full bg-green-50 text-green-700">{p.canal}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Bases de Incidência do FGTS</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: "Salário mensal", incide: true },
              { label: "13º salário", incide: true },
              { label: "Férias (simples)", incide: true },
              { label: "Horas extras", incide: true },
              { label: "Adicional noturno", incide: true },
              { label: "Comissões", incide: true },
              { label: "Adicional de periculosidade", incide: true },
              { label: "Adicional de insalubridade", incide: true },
              { label: "Aviso prévio trabalhado", incide: true },
              { label: "Aviso prévio indenizado", incide: true },
              { label: "Abono de férias (1/3)", incide: false },
              { label: "Diárias de viagem (≤ 50% do salário)", incide: false },
              { label: "Vale-transporte", incide: false },
              { label: "Vale-alimentação (PAT)", incide: false },
              { label: "PLR (conforme acordo)", incide: false },
            ].map((b) => (
              <div key={b.label} className="flex items-center gap-2 text-sm">
                <div className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center ${b.incide ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500"}`}>
                  <span className="text-[10px] font-bold">{b.incide ? "✓" : "✗"}</span>
                </div>
                <span className="text-gray-700">{b.label}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}
