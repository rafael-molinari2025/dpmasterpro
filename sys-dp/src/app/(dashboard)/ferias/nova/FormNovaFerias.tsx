"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, AlertCircle, Calendar } from "lucide-react";

interface Empresa { id: string; nomeFantasia: string | null; razaoSocial: string; }
interface Funcionario { id: string; nome: string; matricula: string; dataAdmissao: string; }

interface Props {
  empresas: Empresa[];
}

const lb = "block text-xs font-medium text-gray-600 mb-1";
const inp = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";

export default function FormNovaFerias({ empresas }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [empresaId, setEmpresaId] = useState(empresas[0]?.id ?? "");
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [funcionarioId, setFuncionarioId] = useState("");
  const [diasGozo, setDiasGozo] = useState(30);
  const [diasAbono, setDiasAbono] = useState(0);

  const carregarFuncionarios = useCallback(async (eId: string) => {
    if (!eId) { setFuncionarios([]); return; }
    try {
      const res = await fetch(`/api/funcionarios?empresaId=${eId}&situacao=ATIVO`);
      if (res.ok) {
        const data = await res.json();
        setFuncionarios(data.funcionarios ?? data);
        setFuncionarioId("");
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => { carregarFuncionarios(empresaId); }, [empresaId, carregarFuncionarios]);

  const funcSelecionado = funcionarios.find((f) => f.id === funcionarioId);
  const diasDireito = Math.max(0, 30 - diasAbono);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const g = (k: string) => (fd.get(k) as string) ?? "";

    const body: Record<string, unknown> = {
      funcionarioId,
      dataInicioAquisitivo: g("dataInicioAquisitivo"),
      dataFimAquisitivo: g("dataFimAquisitivo"),
      diasDireito: diasDireito,
      diasAbono: diasAbono,
      adiantamento13: g("adiantamento13") === "true",
    };

    if (g("dataInicioGozo")) {
      body.dataInicioGozo = g("dataInicioGozo");
      if (g("dataFimGozo")) body.dataFimGozo = g("dataFimGozo");
      body.diasGozo = diasGozo;
    }
    if (g("observacao")) body.observacao = g("observacao");

    try {
      const res = await fetch("/api/ferias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao salvar férias.");
        setLoading(false);
        return;
      }
      router.push("/ferias");
      router.refresh();
    } catch {
      setError("Erro de conexão.");
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 p-3 sm:p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-4">
          <a href="/ferias" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-4 h-4" />
            Voltar para férias
          </a>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Empresa e Funcionário */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">Funcionário</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={lb}>Empresa *</label>
                <select
                  value={empresaId}
                  onChange={(e) => setEmpresaId(e.target.value)}
                  required
                  className={inp}
                >
                  <option value="">Selecione a empresa...</option>
                  {empresas.map((e) => (
                    <option key={e.id} value={e.id}>{e.nomeFantasia ?? e.razaoSocial}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={lb}>Funcionário *</label>
                <select
                  value={funcionarioId}
                  onChange={(e) => setFuncionarioId(e.target.value)}
                  required
                  className={inp}
                  disabled={!empresaId || funcionarios.length === 0}
                >
                  <option value="">
                    {!empresaId ? "Selecione a empresa primeiro" : funcionarios.length === 0 ? "Nenhum funcionário ativo" : "Selecione..."}
                  </option>
                  {funcionarios.map((f) => (
                    <option key={f.id} value={f.id}>{f.nome} ({f.matricula})</option>
                  ))}
                </select>
              </div>
              {funcSelecionado && (
                <div className="sm:col-span-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-xs text-blue-800">
                  <span className="font-medium">Admissão:</span>{" "}
                  {new Date(funcSelecionado.dataAdmissao).toLocaleDateString("pt-BR", { timeZone: "UTC" })}
                </div>
              )}
            </div>
          </div>

          {/* Período Aquisitivo */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">Período Aquisitivo</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={lb}>Início do Período *</label>
                <input type="date" name="dataInicioAquisitivo" required className={inp} />
                <p className="text-xs text-gray-400 mt-0.5">Data de admissão ou início de novo período</p>
              </div>
              <div>
                <label className={lb}>Fim do Período (Vencimento) *</label>
                <input type="date" name="dataFimAquisitivo" required className={inp} />
                <p className="text-xs text-gray-400 mt-0.5">12 meses após o início</p>
              </div>
            </div>
          </div>

          {/* Gozo */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-1">Gozo das Férias</h2>
            <p className="text-xs text-gray-500 mb-4">Deixe em branco para apenas registrar o período aquisitivo sem agendar o gozo.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={lb}>Início do Gozo</label>
                <input type="date" name="dataInicioGozo" className={inp} />
              </div>
              <div>
                <label className={lb}>Fim do Gozo</label>
                <input type="date" name="dataFimGozo" className={inp} />
              </div>
              <div>
                <label className={lb}>Dias de Gozo</label>
                <input
                  type="number"
                  min="5"
                  max="30"
                  value={diasGozo}
                  onChange={(e) => setDiasGozo(parseInt(e.target.value) || 30)}
                  className={inp}
                />
              </div>
              <div>
                <label className={lb}>Abono Pecuniário (dias — máx. 10)</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={diasAbono}
                  onChange={(e) => setDiasAbono(parseInt(e.target.value) || 0)}
                  className={inp}
                />
                <p className="text-xs text-gray-400 mt-0.5">Até 1/3 dos dias (máx. 10 dias)</p>
              </div>
            </div>

            <div className="mt-4 bg-slate-50 border border-slate-200 rounded-lg p-3 flex gap-6 text-xs text-slate-700">
              <span><strong>Dias de Direito:</strong> 30</span>
              <span><strong>Abono:</strong> {diasAbono} dias</span>
              <span><strong>Dias Gozados:</strong> {diasDireito}</span>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <input
                type="checkbox"
                id="adiantamento13"
                name="adiantamento13"
                value="true"
                className="w-4 h-4 rounded border-gray-300 text-blue-600"
              />
              <label htmlFor="adiantamento13" className="text-sm text-gray-700">
                Adiantamento do 13º salário
              </label>
            </div>
          </div>

          {/* Observação */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <label className={lb}>Observação</label>
            <textarea
              name="observacao"
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Observações gerais sobre este período de férias..."
            />
          </div>

          {/* Botões */}
          <div className="flex flex-wrap items-center justify-end gap-3 pb-6">
            <a
              href="/ferias"
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </a>
            <button
              type="submit"
              disabled={loading || !funcionarioId}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Calendar className="w-4 h-4" />
              {loading ? "Salvando..." : "Programar Férias"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
