"use client";

import { useState, useCallback } from "react";
import { Plus, Trash2, Users, Loader2, AlertCircle } from "lucide-react";

interface Dependente {
  id: string;
  nome: string;
  cpf: string | null;
  dataNascimento: string;
  parentesco: string;
  invalidez: boolean;
  deducaoIRRF: boolean;
  planoSaude: boolean;
}

const PARENTESCO_LABEL: Record<string, string> = {
  CONJUGE: "Cônjuge",
  FILHO: "Filho",
  FILHA: "Filha",
  ENTEADO: "Enteado",
  ENTEADA: "Enteada",
  PAI: "Pai",
  MAE: "Mãe",
  IRMAO: "Irmão",
  IRMA: "Irmã",
  OUTROS: "Outros",
};

const lb = "block text-xs font-medium text-gray-600 mb-1";
const inp = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";

const emptyForm = {
  nome: "",
  cpf: "",
  dataNascimento: "",
  parentesco: "FILHO",
  invalidez: false,
  deducaoIRRF: true,
  planoSaude: false,
};

interface Props {
  funcionarioId: string;
  dependentesIniciais: Dependente[];
}

export default function DependentesSection({ funcionarioId, dependentesIniciais }: Props) {
  const [deps, setDeps] = useState<Dependente[]>(dependentesIniciais);
  const [adicionando, setAdicionando] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [salvando, setSalvando] = useState(false);
  const [removendo, setRemovendo] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const f = (key: keyof typeof emptyForm) => ({
    value: form[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((v) => ({ ...v, [key]: e.target.value })),
  });

  const fCheck = (key: "invalidez" | "deducaoIRRF" | "planoSaude") => ({
    checked: form[key] as boolean,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((v) => ({ ...v, [key]: e.target.checked })),
  });

  const recarregar = useCallback(async () => {
    const res = await fetch(`/api/funcionarios/${funcionarioId}/dependentes`);
    if (res.ok) setDeps(await res.json());
  }, [funcionarioId]);

  async function adicionar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      const res = await fetch(`/api/funcionarios/${funcionarioId}/dependentes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setErro(data.error ?? "Erro ao adicionar."); return; }
      await recarregar();
      setForm(emptyForm);
      setAdicionando(false);
    } catch {
      setErro("Erro de conexão.");
    } finally {
      setSalvando(false);
    }
  }

  async function remover(depId: string, nome: string) {
    if (!confirm(`Remover dependente "${nome}"?`)) return;
    setRemovendo(depId);
    try {
      await fetch(`/api/funcionarios/${funcionarioId}/dependentes/${depId}`, { method: "DELETE" });
      setDeps((d) => d.filter((x) => x.id !== depId));
    } finally {
      setRemovendo(null);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-800">Dependentes</h2>
          <span className="text-xs text-gray-400">({deps.length})</span>
        </div>
        {!adicionando && (
          <button
            type="button"
            onClick={() => { setAdicionando(true); setErro(null); }}
            className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 px-3 py-1.5 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar
          </button>
        )}
      </div>

      {deps.length === 0 && !adicionando && (
        <p className="text-sm text-gray-400 py-2 text-center">Nenhum dependente cadastrado.</p>
      )}

      {deps.length > 0 && (
        <div className="divide-y divide-gray-100">
          {deps.map((d) => (
            <div key={d.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{d.nome}</p>
                <p className="text-xs text-gray-500">
                  {PARENTESCO_LABEL[d.parentesco] ?? d.parentesco}
                  {d.cpf && ` • CPF: ${d.cpf}`}
                  {" • "}
                  {new Date(d.dataNascimento).toLocaleDateString("pt-BR", { timeZone: "UTC" })}
                </p>
                <div className="flex gap-2 mt-1">
                  {d.deducaoIRRF && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-50 text-green-700">Dedução IRRF</span>
                  )}
                  {d.planoSaude && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">Plano Saúde</span>
                  )}
                  {d.invalidez && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">Invalidez</span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => remover(d.id, d.nome)}
                disabled={removendo === d.id}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              >
                {removendo === d.id
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Trash2 className="w-4 h-4" />}
              </button>
            </div>
          ))}
        </div>
      )}

      {adicionando && (
        <form onSubmit={adicionar} className="border border-gray-200 rounded-lg p-4 space-y-4 bg-gray-50">
          <h3 className="text-xs font-semibold text-gray-700">Novo Dependente</h3>

          {erro && (
            <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {erro}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className={lb}>Nome Completo *</label>
              <input type="text" required className={inp} placeholder="Nome completo do dependente" {...f("nome")} />
            </div>
            <div>
              <label className={lb}>Parentesco *</label>
              <select required className={inp} {...f("parentesco")}>
                {Object.entries(PARENTESCO_LABEL).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={lb}>Data de Nascimento *</label>
              <input type="date" required className={inp} {...f("dataNascimento")} />
            </div>
            <div>
              <label className={lb}>CPF</label>
              <input type="text" className={inp} placeholder="000.000.000-00" maxLength={14} {...f("cpf")} />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-gray-700">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded border-gray-300" {...fCheck("deducaoIRRF")} />
              Dedução IRRF
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded border-gray-300" {...fCheck("planoSaude")} />
              Plano de Saúde
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded border-gray-300" {...fCheck("invalidez")} />
              Invalidez
            </label>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setAdicionando(false); setForm(emptyForm); setErro(null); }}
              className="px-3 py-2 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="flex items-center gap-1.5 px-4 py-2 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {salvando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Salvar Dependente
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
