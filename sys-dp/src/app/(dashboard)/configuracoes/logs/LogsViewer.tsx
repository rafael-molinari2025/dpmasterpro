"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search, RefreshCw, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Trash2, AlertCircle, AlertTriangle, Info, Zap, X,
} from "lucide-react";

type NivelLog = "INFO" | "AVISO" | "ERRO" | "CRITICO";
type TipoLog =
  | "AUTENTICACAO" | "EMPRESA" | "FUNCIONARIO" | "FOLHA"
  | "FERIAS" | "RESCISAO" | "ESOCIAL" | "BACKUP"
  | "USUARIO" | "CONFIGURACAO" | "SISTEMA";

interface LogItem {
  id: string;
  nivel: NivelLog;
  tipo: TipoLog;
  modulo: string;
  acao: string;
  descricao: string;
  nomeUsuario: string | null;
  detalhes: Record<string, unknown> | null;
  ip: string | null;
  createdAt: string;
}

interface Contador { nivel: NivelLog; _count: { _all: number } }

const NIVEL_CFG: Record<NivelLog, { label: string; badge: string; icon: React.ReactNode }> = {
  INFO:    { label: "Info",    badge: "bg-blue-100 text-blue-700 border-blue-200",   icon: <Info      className="w-3.5 h-3.5" /> },
  AVISO:   { label: "Aviso",   badge: "bg-amber-100 text-amber-700 border-amber-200", icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  ERRO:    { label: "Erro",    badge: "bg-red-100 text-red-700 border-red-200",       icon: <AlertCircle   className="w-3.5 h-3.5" /> },
  CRITICO: { label: "Crítico", badge: "bg-rose-100 text-rose-800 border-rose-300",    icon: <Zap           className="w-3.5 h-3.5" /> },
};

const TIPO_LABEL: Record<TipoLog, string> = {
  AUTENTICACAO: "Autenticação", EMPRESA: "Empresa",       FUNCIONARIO: "Funcionário",
  FOLHA:        "Folha",        FERIAS:  "Férias",        RESCISAO:    "Rescisão",
  ESOCIAL:      "eSocial",      BACKUP:  "Backup",        USUARIO:     "Usuário",
  CONFIGURACAO: "Configuração", SISTEMA: "Sistema",
};

const NIVEL_STAT: Record<NivelLog, string> = {
  INFO:    "bg-blue-50 border-blue-200 text-blue-700",
  AVISO:   "bg-amber-50 border-amber-200 text-amber-700",
  ERRO:    "bg-red-50 border-red-200 text-red-700",
  CRITICO: "bg-rose-50 border-rose-200 text-rose-800",
};

function NivelBadge({ nivel }: { nivel: NivelLog }) {
  const c = NIVEL_CFG[nivel];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${c.badge}`}>
      {c.icon}{c.label}
    </span>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function LogsViewer() {
  const [logs, setLogs]           = useState<LogItem[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(false);
  const [expandido, setExpandido] = useState<string | null>(null);
  const [contadores, setContadores] = useState<Partial<Record<NivelLog, number>>>({});

  const [q,     setQ]     = useState("");
  const [nivel, setNivel] = useState("");
  const [tipo,  setTipo]  = useState("");
  const [de,    setDe]    = useState("");
  const [ate,   setAte]   = useState("");

  const [limpando, setLimpando]   = useState(false);
  const [diasLimpar, setDiasLimpar] = useState("30");
  const [msgLimpar,  setMsgLimpar]  = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const PAGE_SIZE = 50;

  const buscar = useCallback(async (pg: number) => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(pg), pageSize: String(PAGE_SIZE) });
      if (nivel) p.set("nivel", nivel);
      if (tipo)  p.set("tipo",  tipo);
      if (q)     p.set("q",     q);
      if (de)    p.set("de",    de);
      if (ate)   p.set("ate",   ate);

      const res = await fetch(`/api/logs?${p}`);
      if (!res.ok) return;
      const data = await res.json();
      setLogs(data.logs);
      setTotal(data.total);

      const cnt: Partial<Record<NivelLog, number>> = {};
      (data.contadores as Contador[]).forEach((c) => { cnt[c.nivel] = c._count._all; });
      setContadores(cnt);
    } finally {
      setLoading(false);
    }
  }, [nivel, tipo, q, de, ate]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setPage(1); buscar(1); }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [buscar]);

  useEffect(() => { buscar(page); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  function limparFiltros() { setQ(""); setNivel(""); setTipo(""); setDe(""); setAte(""); setPage(1); }

  async function limparLogs() {
    if (!confirm(`Excluir todos os logs com mais de ${diasLimpar} dias? Esta ação não pode ser desfeita.`)) return;
    setLimpando(true);
    setMsgLimpar(null);
    try {
      const antes = new Date();
      antes.setDate(antes.getDate() - parseInt(diasLimpar));
      const res = await fetch(`/api/logs?antes=${antes.toISOString()}`, { method: "DELETE" });
      const data = await res.json();
      setMsgLimpar(`${data.deletados} log(s) excluído(s).`);
      buscar(1);
    } catch {
      setMsgLimpar("Erro ao limpar logs.");
    } finally {
      setLimpando(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const temFiltro = !!(q || nivel || tipo || de || ate);

  return (
    <div className="space-y-5">

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["CRITICO", "ERRO", "AVISO", "INFO"] as NivelLog[]).map((n) => (
          <button
            key={n}
            onClick={() => { setNivel(nivel === n ? "" : n); setPage(1); }}
            className={`rounded-xl border p-4 text-left transition-all hover:shadow-sm ${NIVEL_STAT[n]} ${nivel === n ? "ring-2 ring-offset-1 ring-current" : ""}`}
          >
            <p className="text-2xl font-bold">{contadores[n] ?? 0}</p>
            <p className="text-xs font-medium mt-0.5 opacity-80">{NIVEL_CFG[n].label}</p>
          </button>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">Busca</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Descrição, ação, usuário…"
                className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="w-36">
            <label className="block text-xs font-medium text-gray-600 mb-1">Nível</label>
            <select
              value={nivel}
              onChange={(e) => { setNivel(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              {(["CRITICO", "ERRO", "AVISO", "INFO"] as NivelLog[]).map((n) => (
                <option key={n} value={n}>{NIVEL_CFG[n].label}</option>
              ))}
            </select>
          </div>

          <div className="w-40">
            <label className="block text-xs font-medium text-gray-600 mb-1">Módulo</label>
            <select
              value={tipo}
              onChange={(e) => { setTipo(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              {Object.entries(TIPO_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          <div className="w-36">
            <label className="block text-xs font-medium text-gray-600 mb-1">De</label>
            <input
              type="date"
              value={de}
              onChange={(e) => { setDe(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="w-36">
            <label className="block text-xs font-medium text-gray-600 mb-1">Até</label>
            <input
              type="date"
              value={ate}
              onChange={(e) => { setAte(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2">
            {temFiltro && (
              <button
                onClick={limparFiltros}
                className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Limpar
              </button>
            )}
            <button
              onClick={() => buscar(page)}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </button>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {loading ? "Carregando…" : `${total.toLocaleString("pt-BR")} registro${total !== 1 ? "s" : ""}${temFiltro ? " (filtrado)" : ""}`}
          </p>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Página {page} de {totalPages}</span>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || loading} className="p-1 rounded hover:bg-gray-100 disabled:opacity-30">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages || loading} className="p-1 rounded hover:bg-gray-100 disabled:opacity-30">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide w-36">Data/Hora</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide w-24">Nível</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide w-28">Módulo</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide w-32">Ação</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Descrição</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide w-32">Usuário</th>
                <th className="px-4 py-2.5 w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-sm">
                    {temFiltro ? "Nenhum log encontrado com esses filtros." : "Nenhum log registrado ainda."}
                  </td>
                </tr>
              )}
              {logs.map((log) => {
                const isOpen = expandido === log.id;
                const rowBg = log.nivel === "CRITICO" ? "bg-rose-50/40"
                            : log.nivel === "ERRO"    ? "bg-red-50/30"
                            : log.nivel === "AVISO"   ? "bg-amber-50/20"
                            : "";
                return (
                  <>
                    <tr
                      key={log.id}
                      className={`hover:bg-gray-50 cursor-pointer transition-colors ${rowBg}`}
                      onClick={() => setExpandido(isOpen ? null : log.id)}
                    >
                      <td className="px-4 py-2.5 text-xs text-gray-500 whitespace-nowrap font-mono">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="px-4 py-2.5">
                        <NivelBadge nivel={log.nivel} />
                      </td>
                      <td className="px-4 py-2.5 text-xs text-gray-600 whitespace-nowrap">
                        {TIPO_LABEL[log.tipo] ?? log.tipo}
                      </td>
                      <td className="px-4 py-2.5 text-xs font-mono text-gray-700 whitespace-nowrap">
                        {log.acao}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-gray-800 max-w-xs truncate">
                        {log.descricao}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-gray-500 whitespace-nowrap">
                        {log.nomeUsuario ?? <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-2.5 text-gray-400">
                        {log.detalhes
                          ? isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                          : null}
                      </td>
                    </tr>
                    {isOpen && log.detalhes && (
                      <tr key={`${log.id}-det`} className="bg-gray-50">
                        <td colSpan={7} className="px-4 py-3">
                          <div className="bg-white rounded-lg border border-gray-200 p-3">
                            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Detalhes</p>
                            <pre className="text-xs text-gray-700 whitespace-pre-wrap break-all font-mono leading-relaxed max-h-60 overflow-y-auto">
                              {JSON.stringify(log.detalhes, null, 2)}
                            </pre>
                            {log.ip && (
                              <p className="text-xs text-gray-400 mt-2">IP: {log.ip}</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
            <span>{total.toLocaleString("pt-BR")} registros no total</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Anterior
              </button>
              <span className="px-2">Página {page} de {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-colors"
              >
                Próxima <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Limpar logs antigos */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Manutenção de Logs</h3>
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-gray-600">Excluir logs com mais de</p>
          <select
            value={diasLimpar}
            onChange={(e) => setDiasLimpar(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            <option value="30">30 dias</option>
            <option value="60">60 dias</option>
            <option value="90">90 dias</option>
            <option value="180">180 dias</option>
          </select>
          <button
            onClick={limparLogs}
            disabled={limpando}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {limpando ? "Excluindo…" : "Excluir logs antigos"}
          </button>
          {msgLimpar && (
            <span className="text-sm text-green-700 font-medium">{msgLimpar}</span>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Recomendamos manter logs dos últimos 90 dias para fins de auditoria e conformidade com a LGPD.
        </p>
      </div>

    </div>
  );
}
