"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Save, AlertCircle, Loader2 } from "lucide-react";

interface Empresa { id: string; nomeFantasia: string | null; razaoSocial: string; }

const lb = "block text-xs font-medium text-gray-600 mb-1";
const inp = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";

export default function SetoresAcoes({ empresas }: { empresas: Empresa[] }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [form, setForm] = useState({ empresaId: empresas[0]?.id ?? "", codigo: "", descricao: "", centroCusto: "" });

  function f(key: keyof typeof form) {
    return {
      value: form[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm((v) => ({ ...v, [key]: e.target.value })),
    };
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      const res = await fetch("/api/setores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setErro(data.error ?? "Erro ao salvar."); return; }
      setAberto(false);
      setForm({ empresaId: empresas[0]?.id ?? "", codigo: "", descricao: "", centroCusto: "" });
      router.refresh();
    } catch {
      setErro("Erro de conexão.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => { setAberto(true); setErro(null); }}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Novo Setor
      </button>

      {aberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-gray-900">Novo Setor</h2>
              <button type="button" onClick={() => setAberto(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {erro && (
              <div className="mb-4 flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {erro}
              </div>
            )}

            <form onSubmit={salvar} className="space-y-4">
              <div>
                <label className={lb}>Empresa *</label>
                <select required className={inp} {...f("empresaId")}>
                  {empresas.map((e) => (
                    <option key={e.id} value={e.id}>{e.nomeFantasia ?? e.razaoSocial}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lb}>Código *</label>
                  <input type="text" required maxLength={20} placeholder="Ex: RH, TI, FIN" className={inp} {...f("codigo")} />
                </div>
                <div>
                  <label className={lb}>Centro de Custo</label>
                  <input type="text" maxLength={20} placeholder="Ex: CC001" className={inp} {...f("centroCusto")} />
                </div>
              </div>
              <div>
                <label className={lb}>Descrição *</label>
                <input type="text" required maxLength={100} placeholder="Ex: Recursos Humanos" className={inp} {...f("descricao")} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setAberto(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={salvando} className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                  {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
