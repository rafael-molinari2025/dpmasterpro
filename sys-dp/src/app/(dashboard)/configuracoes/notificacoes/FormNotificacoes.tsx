"use client";

import { useState } from "react";
import { Save, CheckCircle, AlertCircle, Bell, Mail } from "lucide-react";

interface ConfigNotif {
  ferias:      { ativo: boolean; diasAntecedencia: number };
  guias:       { ativo: boolean; diasAntecedencia: number };
  certificado: { ativo: boolean; diasAntecedencia: number };
  esocial:     { ativo: boolean; diasPendente: number };
  email:       { ativo: boolean; destinatarios: string };
}

interface Props {
  inicial: ConfigNotif;
}

const DEFAULT: ConfigNotif = {
  ferias:      { ativo: true,  diasAntecedencia: 30 },
  guias:       { ativo: true,  diasAntecedencia: 5  },
  certificado: { ativo: true,  diasAntecedencia: 30 },
  esocial:     { ativo: true,  diasPendente: 3      },
  email:       { ativo: false, destinatarios: ""    },
};

export default function FormNotificacoes({ inicial }: Props) {
  const [cfg, setCfg] = useState<ConfigNotif>({ ...DEFAULT, ...inicial });
  const [salvando, setSalvando] = useState(false);
  const [resultado, setResultado] = useState<{ tipo: "sucesso" | "erro"; msg: string } | null>(null);

  function setNested<K extends keyof ConfigNotif>(
    key: K, field: string, value: unknown
  ) {
    setCfg((c) => ({ ...c, [key]: { ...c[key], [field]: value } }));
  }

  async function salvar() {
    setSalvando(true);
    setResultado(null);
    try {
      const res = await fetch("/api/escritorio", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configuracoes: { notificacoes: cfg } }),
      });
      if (!res.ok) {
        const d = await res.json();
        setResultado({ tipo: "erro", msg: d.error ?? "Erro ao salvar." });
      } else {
        setResultado({ tipo: "sucesso", msg: "Configurações de notificações salvas!" });
      }
    } catch {
      setResultado({ tipo: "erro", msg: "Erro de conexão." });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-5 max-w-2xl">

      {/* Alertas internos */}
      <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
          <Bell className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-semibold text-gray-700">Alertas no Sistema (Dashboard)</span>
        </div>
        <div className="divide-y divide-gray-100">

          {/* Férias */}
          <AlertRow
            label="Férias a vencer"
            desc="Alerta quando funcionários têm período aquisitivo próximo do vencimento."
            ativo={cfg.ferias.ativo}
            onToggle={(v) => setNested("ferias", "ativo", v)}
          >
            <DaysInput
              label="Dias de antecedência"
              value={cfg.ferias.diasAntecedencia}
              onChange={(v) => setNested("ferias", "diasAntecedencia", v)}
              disabled={!cfg.ferias.ativo}
            />
          </AlertRow>

          {/* Guias */}
          <AlertRow
            label="Guias próximas do vencimento"
            desc="Alerta sobre GPS, DARF e FGTS com vencimento próximo."
            ativo={cfg.guias.ativo}
            onToggle={(v) => setNested("guias", "ativo", v)}
          >
            <DaysInput
              label="Dias antes do vencimento"
              value={cfg.guias.diasAntecedencia}
              onChange={(v) => setNested("guias", "diasAntecedencia", v)}
              disabled={!cfg.guias.ativo}
            />
          </AlertRow>

          {/* Certificado */}
          <AlertRow
            label="Certificado digital vencendo"
            desc="Alerta quando o certificado A1 de alguma empresa está prestes a vencer."
            ativo={cfg.certificado.ativo}
            onToggle={(v) => setNested("certificado", "ativo", v)}
          >
            <DaysInput
              label="Dias antes do vencimento"
              value={cfg.certificado.diasAntecedencia}
              onChange={(v) => setNested("certificado", "diasAntecedencia", v)}
              disabled={!cfg.certificado.ativo}
            />
          </AlertRow>

          {/* eSocial */}
          <AlertRow
            label="eSocial com eventos pendentes"
            desc="Alerta quando existem eventos gerados há mais de X dias sem serem transmitidos."
            ativo={cfg.esocial.ativo}
            onToggle={(v) => setNested("esocial", "ativo", v)}
          >
            <DaysInput
              label="Pendente há mais de (dias)"
              value={cfg.esocial.diasPendente}
              onChange={(v) => setNested("esocial", "diasPendente", v)}
              disabled={!cfg.esocial.ativo}
            />
          </AlertRow>
        </div>
      </section>

      {/* Notificações por e-mail */}
      <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
          <Mail className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-semibold text-gray-700">Notificações por E-mail</span>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <Toggle
              ativo={cfg.email.ativo}
              onToggle={(v) => setNested("email", "ativo", v)}
            />
            <div>
              <p className="text-sm font-medium text-gray-800">Enviar alertas por e-mail</p>
              <p className="text-xs text-gray-500">Os mesmos alertas do Dashboard serão enviados para os e-mails abaixo.</p>
            </div>
          </div>
          {cfg.email.ativo && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Destinatários <span className="font-normal text-gray-400">(separados por vírgula)</span>
              </label>
              <input
                type="text"
                value={cfg.email.destinatarios}
                onChange={(e) => setNested("email", "destinatarios", e.target.value)}
                placeholder="email1@exemplo.com, email2@exemplo.com"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          {!cfg.email.ativo && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Notificações por e-mail desativadas. Os alertas continuam aparecendo no Dashboard.
            </p>
          )}
        </div>
      </section>

      {resultado && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm border ${
          resultado.tipo === "sucesso"
            ? "bg-green-50 border-green-200 text-green-800"
            : "bg-red-50 border-red-200 text-red-800"
        }`}>
          {resultado.tipo === "sucesso"
            ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
            : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          {resultado.msg}
        </div>
      )}

      <button
        onClick={salvar}
        disabled={salvando}
        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        <Save className={`w-4 h-4 ${salvando ? "animate-pulse" : ""}`} />
        {salvando ? "Salvando…" : "Salvar Configurações"}
      </button>
    </div>
  );
}

/* Componentes auxiliares */

function Toggle({ ativo, onToggle }: { ativo: boolean; onToggle: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(!ativo)}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${ativo ? "bg-blue-600" : "bg-gray-200"}`}
    >
      <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow ring-0 transition-transform ${ativo ? "translate-x-4" : "translate-x-0"}`} />
    </button>
  );
}

function AlertRow({
  label, desc, ativo, onToggle, children,
}: {
  label: string; desc: string; ativo: boolean; onToggle: (v: boolean) => void; children: React.ReactNode;
}) {
  return (
    <div className="px-5 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-800">{label}</p>
          <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
        </div>
        <Toggle ativo={ativo} onToggle={onToggle} />
      </div>
      {ativo && <div className="mt-3">{children}</div>}
    </div>
  );
}

function DaysInput({ label, value, onChange, disabled }: {
  label: string; value: number; onChange: (v: number) => void; disabled: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-xs text-gray-600 flex-1">{label}</label>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(Math.max(1, value - 1))}
          disabled={disabled}
          className="w-7 h-7 rounded border border-gray-200 text-gray-500 hover:bg-gray-50 text-sm font-bold disabled:opacity-40"
        >−</button>
        <input
          type="number"
          min={1}
          max={90}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value) || 1)}
          disabled={disabled}
          className="w-14 text-center border border-gray-200 rounded text-sm py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-40"
        />
        <button
          type="button"
          onClick={() => onChange(Math.min(90, value + 1))}
          disabled={disabled}
          className="w-7 h-7 rounded border border-gray-200 text-gray-500 hover:bg-gray-50 text-sm font-bold disabled:opacity-40"
        >+</button>
        <span className="text-xs text-gray-400 ml-1">dias</span>
      </div>
    </div>
  );
}
