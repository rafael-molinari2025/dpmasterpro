import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Header from "@/components/layout/Header";
import { FileText, Info, Calendar } from "lucide-react";

export default async function DIRFPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const anoAtual = new Date().getFullYear();

  return (
    <>
      <Header title="DIRF" subtitle={`Declaração do Imposto sobre a Renda Retido na Fonte — Ano-base ${anoAtual - 1}`} />
      <div className="flex-1 p-6 space-y-6">

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">DIRF — Declaração do IRRF</p>
            <p className="mt-0.5 text-blue-700">
              A DIRF deve ser entregue anualmente à Receita Federal pelo programa <strong>PGD DIRF</strong>.
              Prazo de entrega: até o último dia útil de fevereiro de <strong>{anoAtual}</strong> (ano-base {anoAtual - 1}).
              A DIRF declara todos os valores de IRRF retidos de empregados, prestadores de serviços e demais beneficiários.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              Informações da DIRF
            </h3>
            <div className="space-y-3">
              {[
                { label: "Prazo de entrega", value: `Último dia útil de fevereiro/${anoAtual}` },
                { label: "Programa", value: "PGD DIRF (Receita Federal)" },
                { label: "Ano-base declarado", value: String(anoAtual - 1) },
                { label: "Obrigatoriedade", value: "Fontes pagadoras com retenção de IRRF" },
                { label: "Penalidade por atraso", value: "R$ 500 a R$ 1.500 por mês/fração" },
              ].map((item) => (
                <div key={item.label} className="flex items-start justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-600">{item.label}</span>
                  <span className="text-sm font-medium text-gray-900 text-right ml-4">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">O que é declarado na DIRF</h3>
            <div className="space-y-2">
              {[
                "Rendimentos pagos a empregados e IRRF retido",
                "Rendimentos pagos a autônomos (1,5% a 27,5%)",
                "Rendimentos pagos a pessoa jurídica (serviços sujeitos à retenção)",
                "Plano de saúde coletivo (valores pagos pela empresa)",
                "Salário-educação e outros benefícios tributáveis",
                "13º salário e IRRF retido",
                "Férias e IRRF retido",
                "Rescisão de contrato e IRRF retido",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-gray-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-2">Geração do Arquivo DIRF</h3>
          <p className="text-sm text-gray-600 mb-4">
            O arquivo DIRF será gerado com base nos valores de IRRF de todas as folhas do ano-base registradas no sistema.
          </p>
          <div className="flex items-center gap-3">
            <button type="button" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
              <FileText className="w-4 h-4" />
              Gerar Arquivo DIRF {anoAtual - 1}
            </button>
            <span className="text-xs text-gray-400">Formato compatível com PGD DIRF {anoAtual}</span>
          </div>
        </div>

      </div>
    </>
  );
}
