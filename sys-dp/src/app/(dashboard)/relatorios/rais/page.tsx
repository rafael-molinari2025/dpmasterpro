import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Header from "@/components/layout/Header";
import { FileText, Info, Calendar } from "lucide-react";

export default async function RAISPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const anoAtual = new Date().getFullYear();

  return (
    <>
      <Header title="RAIS" subtitle={`Relação Anual de Informações Sociais — Ano-base ${anoAtual - 1}`} />
      <div className="flex-1 p-6 space-y-6">

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">RAIS — Relação Anual de Informações Sociais</p>
            <p className="mt-0.5 text-blue-700">
              A RAIS é uma obrigação acessória anual entregue ao MTE (Ministério do Trabalho e Emprego).
              Declaração do ano-base <strong>{anoAtual - 1}</strong> deve ser entregue entre janeiro e março de <strong>{anoAtual}</strong>.
              A entrega é feita pelo programa <strong>GDRAIS</strong> ou via portal do eSocial.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              Calendário RAIS {anoAtual}
            </h3>
            <div className="space-y-3">
              {[
                { periodo: "Janeiro a março", prazo: `Entrega da RAIS ${anoAtual - 1}`, status: "pendente" },
                { periodo: "Até 31 de março", prazo: "Prazo final — RAIS Negativa (sem vínculos)", status: "pendente" },
                { periodo: "Após entrega", prazo: "Emissão do CAGED (se necessário)", status: "info" },
              ].map((item) => (
                <div key={item.prazo} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${item.status === "pendente" ? "bg-amber-500" : "bg-blue-500"}`} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.periodo}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.prazo}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              Informações Declaradas
            </h3>
            <div className="space-y-2">
              {[
                "Dados do estabelecimento (CNPJ, CNAE, endereço)",
                "Vínculos empregatícios ativos e encerrados no ano",
                "Remunerações mensais de cada trabalhador",
                "Horas trabalhadas (normais e extras)",
                "Afastamentos (doença, acidente, maternidade, etc.)",
                "Motivo de desligamento (demissão, pedido, acordo)",
                "Grau de instrução e sexo dos empregados",
                "CBO (Classificação Brasileira de Ocupações)",
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
          <h3 className="font-semibold text-gray-900 mb-2">Geração do Arquivo RAIS</h3>
          <p className="text-sm text-gray-600 mb-4">
            A geração do arquivo RAIS para importação no GDRAIS será implementada com base nos dados
            de folha e vínculos registrados no sistema. Certifique-se de que todas as folhas do ano-base
            estão processadas e fechadas antes de gerar o arquivo.
          </p>
          <div className="flex items-center gap-3">
            <button
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
              type="button"
            >
              <FileText className="w-4 h-4" />
              Gerar Arquivo RAIS {anoAtual - 1}
            </button>
            <span className="text-xs text-gray-400">Formato compatível com GDRAIS {anoAtual}</span>
          </div>
        </div>

      </div>
    </>
  );
}
