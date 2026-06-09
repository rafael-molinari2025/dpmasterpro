"use client";

import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Link from "next/link";
import { ArrowLeft, Save, CheckCircle, AlertCircle, Building2 } from "lucide-react";

interface EscritorioData {
  id: string;
  nome: string;
  cnpj: string;
  email: string;
  telefone: string | null;
  plano: string;
  createdAt: string;
}

export default function EscritorioPage() {
  const [dados, setDados] = useState<EscritorioData | null>(null);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [resultado, setResultado] = useState<{ tipo: "sucesso" | "erro"; msg: string } | null>(null);
  const [acessoNegado, setAcessoNegado] = useState(false);

  useEffect(() => {
    fetch("/api/escritorio")
      .then((r) => {
        if (r.status === 403) { setAcessoNegado(true); return null; }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        setDados(data);
        setNome(data.nome ?? "");
        setEmail(data.email ?? "");
        setTelefone(data.telefone ?? "");
      });
  }, []);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setResultado(null);
    try {
      const res = await fetch("/api/escritorio", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, telefone }),
      });
      if (res.ok) {
        setResultado({ tipo: "sucesso", msg: "Dados do escritório atualizados com sucesso!" });
      } else {
        const d = await res.json();
        setResultado({ tipo: "erro", msg: d.error ?? "Erro ao salvar." });
      }
    } catch {
      setResultado({ tipo: "erro", msg: "Erro de conexão." });
    } finally {
      setSalvando(false);
    }
  }

  const planoLabel: Record<string, string> = {
    BASICO: "Básico",
    PROFISSIONAL: "Profissional",
    ENTERPRISE: "Enterprise",
  };

  return (
    <>
      <Header title="Dados do Escritório" subtitle="CNPJ, razão social, contato e informações do plano" />
      <div className="flex-1 p-3 sm:p-6 space-y-6">

        {acessoNegado && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-800">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            Acesso restrito a administradores.
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/configuracoes" className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Configurações
          </Link>
          <span>/</span>
          <span className="text-gray-700 font-medium">Dados do Escritório</span>
        </div>

        {/* Info somente-leitura */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">{dados?.nome ?? "Carregando..."}</h2>
              <p className="text-xs text-gray-500">Plano: {planoLabel[dados?.plano ?? ""] ?? dados?.plano}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-500 mb-1">CNPJ</p>
              <p className="font-mono font-medium text-gray-800">{dados?.cnpj ?? "—"}</p>
              <p className="text-xs text-gray-400 mt-0.5">Não editável</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Cadastrado em</p>
              <p className="font-medium text-gray-800">
                {dados?.createdAt
                  ? new Date(dados.createdAt).toLocaleDateString("pt-BR")
                  : "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Formulário editável */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Informações de Contato</h2>
          <form onSubmit={salvar} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Razão Social / Nome</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <input
                type="text"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(27) 99999-9999"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

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
              type="submit"
              disabled={salvando}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4" />
              {salvando ? "Salvando…" : "Salvar Alterações"}
            </button>
          </form>
        </div>

      </div>
    </>
  );
}
