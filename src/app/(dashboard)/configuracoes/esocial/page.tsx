"use client";

import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Link from "next/link";
import { ArrowLeft, Save, CheckCircle, AlertCircle, FlaskConical, Rocket, Info } from "lucide-react";

type Ambiente = "1" | "2";

export default function EsocialAmbientePage() {
  const [ambienteDB, setAmbienteDB] = useState<Ambiente>("2");
  const [ambienteVar, setAmbienteVar] = useState<string>("2");
  const [salvando, setSalvando] = useState(false);
  const [resultado, setResultado] = useState<{ tipo: "sucesso" | "erro"; msg: string } | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [acessoNegado, setAcessoNegado] = useState(false);

  useEffect(() => {
    fetch("/api/escritorio")
      .then((r) => {
        if (r.status === 403) { setAcessoNegado(true); return null; }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        const cfg = data?.configuracoes as Record<string, unknown> | null;
        const amb = (cfg?.esocial as Record<string, unknown>)?.ambiente as Ambiente | undefined;
        setAmbienteDB(amb === "1" ? "1" : "2");
        setAmbienteVar(data?.esocialAmbienteVar ?? "2");
      })
      .finally(() => setCarregando(false));
  }, []);

  async function salvar() {
    setSalvando(true);
    setResultado(null);
    try {
      const res = await fetch("/api/escritorio", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          configuracoes: { esocial: { ambiente: ambienteDB } },
        }),
      });
      if (res.ok) {
        setResultado({ tipo: "sucesso", msg: "Preferência salva. Lembre-se de atualizar ESOCIAL_AMBIENTE na Vercel para a mudança ter efeito nos envios." });
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

  return (
    <>
      <Header title="eSocial — Ambiente" subtitle="Configuração de ambiente de transmissão" />
      <div className="flex-1 p-3 sm:p-6 space-y-6">

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/configuracoes" className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Configurações
          </Link>
          <span>/</span>
          <span className="text-gray-700 font-medium">eSocial — Ambiente</span>
        </div>

        {acessoNegado && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-800">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            Acesso restrito a administradores.
          </div>
        )}

        {/* Aviso informativo */}
        <div className="flex gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium mb-1">Como funciona</p>
            <p>O ambiente efetivo de transmissão é controlado pela variável <code className="font-mono bg-blue-100 px-1 rounded">ESOCIAL_AMBIENTE</code> configurada na Vercel. Esta tela registra a preferência no banco de dados para referência e futura integração automática.</p>
          </div>
        </div>

        {/* Seletor de ambiente */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
          <h2 className="font-semibold text-gray-900">Selecionar Ambiente</h2>

          {carregando ? (
            <div className="py-8 text-center text-sm text-gray-400">Carregando...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Homologação */}
              <button
                onClick={() => setAmbienteDB("2")}
                className={`text-left p-4 rounded-xl border-2 transition-all ${
                  ambienteDB === "2"
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${ambienteDB === "2" ? "bg-green-100" : "bg-gray-100"}`}>
                    <FlaskConical className={`w-5 h-5 ${ambienteDB === "2" ? "text-green-600" : "text-gray-500"}`} />
                  </div>
                  <div>
                    <p className={`font-semibold ${ambienteDB === "2" ? "text-green-800" : "text-gray-900"}`}>Homologação</p>
                    <p className="text-xs text-gray-500">Código: 2</p>
                  </div>
                  {ambienteDB === "2" && (
                    <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Selecionado</span>
                  )}
                </div>
                <p className="text-xs text-gray-600">Ambiente de testes. Eventos são aceitos mas não geram obrigações. Ideal para validação de integrações.</p>
              </button>

              {/* Produção */}
              <button
                onClick={() => setAmbienteDB("1")}
                className={`text-left p-4 rounded-xl border-2 transition-all ${
                  ambienteDB === "1"
                    ? "border-red-500 bg-red-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${ambienteDB === "1" ? "bg-red-100" : "bg-gray-100"}`}>
                    <Rocket className={`w-5 h-5 ${ambienteDB === "1" ? "text-red-600" : "text-gray-500"}`} />
                  </div>
                  <div>
                    <p className={`font-semibold ${ambienteDB === "1" ? "text-red-800" : "text-gray-900"}`}>Produção</p>
                    <p className="text-xs text-gray-500">Código: 1</p>
                  </div>
                  {ambienteDB === "1" && (
                    <span className="ml-auto text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Selecionado</span>
                  )}
                </div>
                <p className="text-xs text-gray-600">Ambiente oficial. Eventos enviados têm validade legal e geram obrigações fiscais e trabalhistas.</p>
              </button>
            </div>
          )}

          {resultado && (
            <div className={`flex items-start gap-2 px-4 py-3 rounded-lg text-sm border ${
              resultado.tipo === "sucesso"
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}>
              {resultado.tipo === "sucesso"
                ? <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                : <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
              {resultado.msg}
            </div>
          )}

          <button
            onClick={salvar}
            disabled={salvando || carregando}
            className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            {salvando ? "Salvando…" : "Salvar Preferência"}
          </button>
        </div>

        {/* Variável de ambiente atual */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Variável de Ambiente Ativa</h2>
          <p className="text-sm text-gray-600 mb-3">
            A transmissão real usa a variável <code className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-xs">ESOCIAL_AMBIENTE</code> definida nas configurações do servidor (Vercel).
          </p>
          <div className="flex items-center gap-3">
            <code className="font-mono bg-gray-100 px-3 py-1.5 rounded text-sm">ESOCIAL_AMBIENTE={ambienteVar === "1" ? '"1"' : '"2"'}</code>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${ambienteVar === "1" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
              {ambienteVar === "1" ? "Produção" : "Homologação"}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Para alterar o ambiente efetivo, acesse o painel da Vercel → Settings → Environment Variables e atualize <code className="font-mono">ESOCIAL_AMBIENTE</code> para <code className="font-mono">1</code> (Produção) ou <code className="font-mono">2</code> (Homologação), depois faça um Redeploy.
          </p>
        </div>

      </div>
    </>
  );
}
