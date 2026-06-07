import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Header from "@/components/layout/Header";
import { BookOpen, ExternalLink } from "lucide-react";

const eventos = [
  { codigo: "1000", descricao: "Remuneração básica", tipo: "PROVENTO", exemplos: "Salário, pró-labore" },
  { codigo: "1010", descricao: "Adicionais legais", tipo: "PROVENTO", exemplos: "Adicional noturno, periculosidade, insalubridade" },
  { codigo: "1011", descricao: "Hora extra até 50%", tipo: "PROVENTO", exemplos: "HE 50%" },
  { codigo: "1012", descricao: "Hora extra acima de 50%", tipo: "PROVENTO", exemplos: "HE 100%" },
  { codigo: "1020", descricao: "Comissões e gratificações", tipo: "PROVENTO", exemplos: "Comissão de vendas, gratificações" },
  { codigo: "1030", descricao: "Gorjetas", tipo: "PROVENTO", exemplos: "Gorjeta compulsória ou espontânea" },
  { codigo: "1040", descricao: "Prêmios", tipo: "PROVENTO", exemplos: "Prêmio por assiduidade, produtividade" },
  { codigo: "1060", descricao: "Diárias de viagem (tributável)", tipo: "PROVENTO", exemplos: "Diárias acima de 50% do salário" },
  { codigo: "1070", descricao: "Abono pecuniário de férias", tipo: "PROVENTO", exemplos: "1/3 de férias convertido em pecúnia" },
  { codigo: "1080", descricao: "13º salário", tipo: "PROVENTO", exemplos: "1ª e 2ª parcelas" },
  { codigo: "3000", descricao: "Desconto INSS empregado", tipo: "DESCONTO", exemplos: "Contribuição previdenciária do trabalhador" },
  { codigo: "3500", descricao: "Desconto IRRF", tipo: "DESCONTO", exemplos: "Imposto de renda retido na fonte" },
  { codigo: "4000", descricao: "Desconto vale-transporte", tipo: "DESCONTO", exemplos: "Desconto de até 6% do salário" },
  { codigo: "4010", descricao: "Desconto vale-alimentação", tipo: "DESCONTO", exemplos: "Desconto do benefício alimentação" },
  { codigo: "4020", descricao: "Pensão alimentícia", tipo: "DESCONTO", exemplos: "Desconto determinado judicialmente" },
  { codigo: "4030", descricao: "Plano de saúde", tipo: "DESCONTO", exemplos: "Coparticipação do empregado" },
  { codigo: "4040", descricao: "Desconto falta/atraso", tipo: "DESCONTO", exemplos: "Desconto proporcional por faltas" },
  { codigo: "9001", descricao: "FGTS depositado", tipo: "INFORMATIVO", exemplos: "Depósito de 8% do salário bruto" },
  { codigo: "9002", descricao: "Base de cálculo FGTS", tipo: "BASE_CALCULO", exemplos: "Valor base para cálculo do FGTS" },
  { codigo: "9003", descricao: "Base de cálculo INSS patronal", tipo: "BASE_CALCULO", exemplos: "Valor base para contribuição patronal" },
];

const tipoColor: Record<string, string> = {
  PROVENTO: "bg-green-50 text-green-700",
  DESCONTO: "bg-red-50 text-red-700",
  INFORMATIVO: "bg-slate-50 text-slate-700",
  BASE_CALCULO: "bg-blue-50 text-blue-700",
};

export default async function RubricasEventosPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <>
      <Header title="Eventos eSocial" subtitle="Tabela 03 — Natureza das rubricas (eSocial S-1.3)" />
      <div className="flex-1 p-6 space-y-6">

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Referência: <strong>Tabela 03 do eSocial</strong> — Natureza das Rubricas da Folha de Pagamento
          </p>
          <a
            href="https://www.gov.br/esocial/pt-br/documentacao-tecnica/tabelas-do-esocial"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
          >
            <ExternalLink className="w-3 h-3" />
            Tabelas Oficiais
          </a>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Código</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Natureza da Rubrica</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Tipo</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Exemplos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {eventos.map((e) => (
                  <tr key={e.codigo} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-sm font-mono font-bold text-blue-700">{e.codigo}</td>
                    <td className="px-5 py-3 text-sm text-gray-900">{e.descricao}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${tipoColor[e.tipo]}`}>
                        {e.tipo.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-500">{e.exemplos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-500">{eventos.length} naturezas de rubrica — eSocial Versão S-1.3</p>
            <p className="text-xs text-gray-400">Nota Técnica 06/2026</p>
          </div>
        </div>

      </div>
    </>
  );
}
