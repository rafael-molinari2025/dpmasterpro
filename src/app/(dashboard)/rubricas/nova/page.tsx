"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import { ArrowLeft, Save, AlertCircle, CheckCircle } from "lucide-react";

const NATUREZAS_ESOCIAL = [
  { codigo: "1000", descricao: "Remuneração básica (salário, pró-labore)" },
  { codigo: "1010", descricao: "Adicionais legais (noturno, perigoso, insalubre)" },
  { codigo: "1011", descricao: "Hora extra até 50%" },
  { codigo: "1012", descricao: "Hora extra acima de 50%" },
  { codigo: "1020", descricao: "Comissões e gratificações" },
  { codigo: "1030", descricao: "Gorjetas" },
  { codigo: "1040", descricao: "Prêmios" },
  { codigo: "1060", descricao: "Diárias de viagem (tributável)" },
  { codigo: "1070", descricao: "Abono pecuniário de férias" },
  { codigo: "1080", descricao: "13º salário" },
  { codigo: "1090", descricao: "Rescisão / verbas rescisórias" },
  { codigo: "1100", descricao: "Outros proventos tributáveis" },
  { codigo: "1110", descricao: "Outros proventos não tributáveis" },
  { codigo: "3000", descricao: "Desconto INSS empregado" },
  { codigo: "3500", descricao: "Desconto IRRF" },
  { codigo: "4000", descricao: "Desconto vale-transporte" },
  { codigo: "4010", descricao: "Desconto vale-alimentação" },
  { codigo: "4020", descricao: "Desconto plano de saúde" },
  { codigo: "4030", descricao: "Desconto adiantamento salarial" },
  { codigo: "4040", descricao: "Outros descontos" },
  { codigo: "9900", descricao: "Informativo (base de cálculo)" },
];

const lb = "block text-xs font-medium text-gray-600 mb-1";
const inp = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";

const emptyForm = {
  codigo: "",
  descricao: "",
  tipo: "PROVENTO",
  naturezaESocial: "1000",
  incideINSS: false,
  incideFGTS: false,
  incideIRRF: false,
  incide13: false,
  incideFerias: false,
  incideRescisao: false,
  empresaId: "",
};

export default function NovaRubricaPage() {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [salvando, setSalvando] = useState(false);
  const [resultado, setResultado] = useState<{ tipo: "sucesso" | "erro"; msg: string } | null>(null);

  function fText(key: keyof typeof emptyForm) {
    return {
      value: form[key] as string,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
        setForm((v) => ({ ...v, [key]: e.target.value })),
    };
  }

  function fCheck(key: "incideINSS" | "incideFGTS" | "incideIRRF" | "incide13" | "incideFerias" | "incideRescisao") {
    return {
      checked: form[key] as boolean,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((v) => ({ ...v, [key]: e.target.checked })),
    };
  }

  // Auto-fill incidências based on tipo
  function handleTipoChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const tipo = e.target.value;
    if (tipo === "PROVENTO") {
      setForm((v) => ({ ...v, tipo, incideINSS: true, incideFGTS: true, incideIRRF: true, incide13: true, incideFerias: true }));
    } else if (tipo === "DESCONTO") {
      setForm((v) => ({ ...v, tipo, incideINSS: false, incideFGTS: false, incideIRRF: false, incide13: false, incideFerias: false }));
    } else {
      setForm((v) => ({ ...v, tipo, incideINSS: false, incideFGTS: false, incideIRRF: false, incide13: false, incideFerias: false }));
    }
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setResultado(null);
    try {
      const res = await fetch("/api/rubricas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          empresaId: form.empresaId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResultado({ tipo: "erro", msg: data.error ?? "Erro ao salvar." });
      } else {
        setResultado({ tipo: "sucesso", msg: "Rubrica criada com sucesso!" });
        setTimeout(() => router.push("/rubricas"), 1200);
      }
    } catch {
      setResultado({ tipo: "erro", msg: "Erro de conexão." });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      <Header title="Nova Rubrica" subtitle="Configuração de evento de folha e vinculação com o eSocial" />
      <div className="flex-1 p-3 sm:p-6">
        <div className="max-w-2xl mx-auto">

          <div className="mb-4">
            <a href="/rubricas" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-4 h-4" />
              Voltar para rubricas
            </a>
          </div>

          {resultado && (
            <div className={`mb-4 flex items-center gap-2 px-4 py-3 rounded-lg text-sm border ${
              resultado.tipo === "sucesso"
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-red-50 border-red-200 text-red-700"
            }`}>
              {resultado.tipo === "sucesso"
                ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
                : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
              {resultado.msg}
            </div>
          )}

          <form onSubmit={salvar} className="space-y-6">

            {/* Identificação */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <h2 className="text-sm font-semibold text-gray-800">Identificação</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={lb}>Código *</label>
                  <input
                    type="text"
                    required
                    maxLength={20}
                    placeholder="Ex: 0001, HORA_EXTRA"
                    className={inp}
                    {...fText("codigo")}
                  />
                  <p className="text-xs text-gray-400 mt-0.5">Código único da rubrica</p>
                </div>
                <div>
                  <label className={lb}>Tipo *</label>
                  <select
                    required
                    className={inp}
                    value={form.tipo}
                    onChange={handleTipoChange}
                  >
                    <option value="PROVENTO">Provento</option>
                    <option value="DESCONTO">Desconto</option>
                    <option value="INFORMATIVO">Informativo</option>
                    <option value="BASE_CALCULO">Base de Cálculo</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className={lb}>Descrição *</label>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    placeholder="Ex: Hora Extra 50%, Vale Transporte..."
                    className={inp}
                    {...fText("descricao")}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={lb}>Natureza eSocial (Tabela 03) *</label>
                  <select required className={inp} {...fText("naturezaESocial")}>
                    {NATUREZAS_ESOCIAL.map((n) => (
                      <option key={n.codigo} value={n.codigo}>
                        {n.codigo} — {n.descricao}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Incidências */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-800">Incidências</h2>
                <p className="text-xs text-gray-500 mt-0.5">Define sobre quais bases este evento incide para cálculo</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { key: "incideINSS" as const, label: "INSS", desc: "Base de contribuição previdenciária" },
                  { key: "incideFGTS" as const, label: "FGTS", desc: "Base do Fundo de Garantia" },
                  { key: "incideIRRF" as const, label: "IRRF", desc: "Base do Imposto de Renda" },
                  { key: "incide13" as const, label: "13º", desc: "Incide sobre o décimo terceiro" },
                  { key: "incideFerias" as const, label: "Férias", desc: "Incide sobre as férias" },
                  { key: "incideRescisao" as const, label: "Rescisão", desc: "Incide nas verbas rescisórias" },
                ].map(({ key, label, desc }) => (
                  <label key={key} className="flex items-start gap-2.5 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600"
                      {...fCheck(key)}
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{label}</p>
                      <p className="text-xs text-gray-500">{desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Botões */}
            <div className="flex flex-wrap items-center justify-end gap-3 pb-6">
              <a
                href="/rubricas"
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </a>
              <button
                type="submit"
                disabled={salvando}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-4 h-4" />
                {salvando ? "Salvando..." : "Criar Rubrica"}
              </button>
            </div>

          </form>
        </div>
      </div>
    </>
  );
}
