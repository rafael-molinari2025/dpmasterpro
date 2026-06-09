"use client";

import { useState } from "react";
import { Download, Building2, Users, FileText, Send, Shield, Package, AlertCircle, CheckCircle } from "lucide-react";

interface Stats {
  totalEmpresas: number;
  totalFuncionarios: number;
  totalFolhas: number;
  totalEventos: number;
  totalUsuarios: number;
}

interface Props { stats: Stats }

const TIPOS = [
  {
    key: "empresas",
    label: "Empresas",
    desc: "Dados cadastrais de todas as empresas.",
    icon: Building2,
    cor: "blue",
    stat: (s: Stats) => `${s.totalEmpresas} empresa${s.totalEmpresas !== 1 ? "s" : ""}`,
  },
  {
    key: "funcionarios",
    label: "Funcionários",
    desc: "Dados pessoais, contratuais e bancários de todos os funcionários.",
    icon: Users,
    cor: "purple",
    stat: (s: Stats) => `${s.totalFuncionarios} funcionário${s.totalFuncionarios !== 1 ? "s" : ""}`,
  },
  {
    key: "folha",
    label: "Folha de Pagamento",
    desc: "Histórico de folhas processadas e itens de cada competência.",
    icon: FileText,
    cor: "green",
    stat: (s: Stats) => `${s.totalFolhas} folha${s.totalFolhas !== 1 ? "s" : ""}`,
  },
  {
    key: "esocial",
    label: "Eventos eSocial",
    desc: "Histórico de eventos gerados e transmitidos ao governo.",
    icon: Send,
    cor: "amber",
    stat: (s: Stats) => `${s.totalEventos} evento${s.totalEventos !== 1 ? "s" : ""}`,
  },
  {
    key: "usuarios",
    label: "Usuários",
    desc: "Lista de usuários do escritório e suas permissões.",
    icon: Shield,
    cor: "slate",
    stat: (s: Stats) => `${s.totalUsuarios} usuário${s.totalUsuarios !== 1 ? "s" : ""}`,
  },
] as const;

const COR: Record<string, { icon: string; btn: string; border: string }> = {
  blue:   { icon: "bg-blue-50 text-blue-600",   btn: "bg-blue-600 hover:bg-blue-700",     border: "border-blue-200"   },
  purple: { icon: "bg-purple-50 text-purple-600", btn: "bg-purple-600 hover:bg-purple-700", border: "border-purple-200" },
  green:  { icon: "bg-green-50 text-green-600",  btn: "bg-green-600 hover:bg-green-700",   border: "border-green-200"  },
  amber:  { icon: "bg-amber-50 text-amber-600",  btn: "bg-amber-600 hover:bg-amber-700",   border: "border-amber-200"  },
  slate:  { icon: "bg-slate-100 text-slate-600", btn: "bg-slate-600 hover:bg-slate-700",   border: "border-slate-200"  },
};

export default function BotoesBackup({ stats }: Props) {
  const [baixando, setBaixando] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{ tipo: "sucesso" | "erro"; msg: string } | null>(null);

  async function baixar(tipo: string) {
    setBaixando(tipo);
    setResultado(null);
    try {
      const res = await fetch(`/api/backup?tipo=${tipo}`);
      if (!res.ok) {
        const d = await res.json();
        setResultado({ tipo: "erro", msg: d.error ?? "Erro ao gerar backup." });
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const cd = res.headers.get("content-disposition") ?? "";
      const match = cd.match(/filename="([^"]+)"/);
      a.href = url;
      a.download = match?.[1] ?? `backup-${tipo}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setResultado({ tipo: "sucesso", msg: `Backup de "${tipo}" baixado com sucesso!` });
    } catch {
      setResultado({ tipo: "erro", msg: "Erro de conexão ao gerar backup." });
    } finally {
      setBaixando(null);
    }
  }

  return (
    <div className="space-y-6">

      {/* Aviso LGPD */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 flex items-start gap-3">
        <Shield className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Dados sensíveis — LGPD</p>
          <p className="mt-0.5 text-xs">
            Os arquivos de backup contêm dados pessoais (CPF, endereços, dados bancários). Armazene-os em local seguro, com acesso restrito, conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018). Não compartilhe os arquivos por canais inseguros.
          </p>
        </div>
      </div>

      {/* Backup completo */}
      <div className="bg-white rounded-xl border-2 border-blue-200 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Backup Completo</p>
              <p className="text-sm text-gray-500">
                Exporta todos os dados em um único arquivo JSON —&nbsp;
                empresas, funcionários, folhas, eSocial e usuários.
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {stats.totalEmpresas} empresas • {stats.totalFuncionarios} funcionários • {stats.totalFolhas} folhas • {stats.totalEventos} eventos eSocial
              </p>
            </div>
          </div>
          <button
            onClick={() => baixar("completo")}
            disabled={!!baixando}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex-shrink-0"
          >
            <Download className={`w-4 h-4 ${baixando === "completo" ? "animate-bounce" : ""}`} />
            {baixando === "completo" ? "Gerando…" : "Baixar Tudo"}
          </button>
        </div>
      </div>

      {/* Backups individuais */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Exportar por Módulo</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TIPOS.map((t) => {
            const c = COR[t.cor];
            const Icon = t.icon;
            return (
              <div key={t.key} className={`bg-white rounded-xl border p-4 flex items-center gap-4 ${c.border}`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${c.icon}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{t.label}</p>
                  <p className="text-xs text-gray-500 truncate">{t.desc}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{t.stat(stats)}</p>
                </div>
                <button
                  onClick={() => baixar(t.key)}
                  disabled={!!baixando}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-white text-xs rounded-lg disabled:opacity-50 transition-colors flex-shrink-0 ${c.btn}`}
                >
                  <Download className={`w-3.5 h-3.5 ${baixando === t.key ? "animate-bounce" : ""}`} />
                  {baixando === t.key ? "Gerando…" : "Baixar"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feedback */}
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

      {/* Info formato */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-500 space-y-1">
        <p className="font-medium text-gray-700">Sobre o formato de exportação</p>
        <p>• Os arquivos são exportados no formato <strong>JSON</strong>, compatível com planilhas e ferramentas de migração.</p>
        <p>• O certificado digital (pfx/p12) <strong>não é incluído</strong> nos backups por segurança.</p>
        <p>• As senhas de usuários também <strong>não são exportadas</strong> (armazenadas como hash irreversível).</p>
        <p>• Recomendamos realizar backup completo <strong>mensalmente</strong> ou antes de grandes atualizações.</p>
      </div>

    </div>
  );
}
