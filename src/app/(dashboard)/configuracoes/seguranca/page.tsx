"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";
import Link from "next/link";
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle, AlertCircle, ShieldCheck, KeyRound } from "lucide-react";

export default function SegurancaPage() {
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [mostrarSenhas, setMostrarSenhas] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [resultado, setResultado] = useState<{ tipo: "sucesso" | "erro"; msg: string } | null>(null);

  function forcaSenha(s: string): { nivel: number; label: string; cor: string } {
    if (!s) return { nivel: 0, label: "", cor: "" };
    let pontos = 0;
    if (s.length >= 8) pontos++;
    if (s.length >= 12) pontos++;
    if (/[A-Z]/.test(s)) pontos++;
    if (/[0-9]/.test(s)) pontos++;
    if (/[^A-Za-z0-9]/.test(s)) pontos++;
    if (pontos <= 2) return { nivel: pontos, label: "Fraca", cor: "bg-red-400" };
    if (pontos <= 3) return { nivel: pontos, label: "Média", cor: "bg-amber-400" };
    return { nivel: pontos, label: "Forte", cor: "bg-green-500" };
  }

  const forca = forcaSenha(novaSenha);

  async function alterarSenha(e: React.FormEvent) {
    e.preventDefault();
    setResultado(null);

    if (novaSenha !== confirmar) {
      setResultado({ tipo: "erro", msg: "A nova senha e a confirmação não coincidem." });
      return;
    }
    if (novaSenha.length < 8) {
      setResultado({ tipo: "erro", msg: "A nova senha deve ter pelo menos 8 caracteres." });
      return;
    }

    setSalvando(true);
    try {
      const res = await fetch("/api/perfil/senha", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senhaAtual, novaSenha }),
      });
      const data = await res.json();
      if (res.ok) {
        setResultado({ tipo: "sucesso", msg: "Senha alterada com sucesso! Faça login novamente se necessário." });
        setSenhaAtual("");
        setNovaSenha("");
        setConfirmar("");
      } else {
        setResultado({ tipo: "erro", msg: data.error ?? "Erro ao alterar senha." });
      }
    } catch {
      setResultado({ tipo: "erro", msg: "Erro de conexão." });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      <Header title="Segurança" subtitle="Senha, sessão e configurações de segurança da conta" />
      <div className="flex-1 p-3 sm:p-6 space-y-6">

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/configuracoes" className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Configurações
          </Link>
          <span>/</span>
          <span className="text-gray-700 font-medium">Segurança</span>
        </div>

        {/* Alterar senha */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Alterar Senha</h2>
              <p className="text-xs text-gray-500">Use uma senha forte e única para esta conta</p>
            </div>
          </div>

          <form onSubmit={alterarSenha} className="space-y-4 max-w-md">
            {/* Senha atual */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha atual</label>
              <div className="relative">
                <input
                  type={mostrarSenhas ? "text" : "password"}
                  value={senhaAtual}
                  onChange={(e) => setSenhaAtual(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenhas(!mostrarSenhas)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {mostrarSenhas ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Nova senha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nova senha</label>
              <div className="relative">
                <input
                  type={mostrarSenhas ? "text" : "password"}
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenhas(!mostrarSenhas)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {mostrarSenhas ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {novaSenha && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${forca.cor}`}
                        style={{ width: `${(forca.nivel / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{forca.label}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirmar */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar nova senha</label>
              <input
                type={mostrarSenhas ? "text" : "password"}
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                required
                autoComplete="new-password"
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                  confirmar && confirmar !== novaSenha ? "border-red-300" : "border-gray-200"
                }`}
              />
              {confirmar && confirmar !== novaSenha && (
                <p className="text-xs text-red-500 mt-1">As senhas não coincidem.</p>
              )}
            </div>

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
              type="submit"
              disabled={salvando || !senhaAtual || !novaSenha || !confirmar}
              className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700 disabled:opacity-50 transition-colors"
            >
              <Lock className="w-4 h-4" />
              {salvando ? "Salvando…" : "Alterar Senha"}
            </button>
          </form>
        </div>

        {/* Boas práticas */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="font-semibold text-gray-900">Boas Práticas de Segurança</h2>
          </div>
          <ul className="space-y-2.5 text-sm text-gray-600">
            {[
              "Use uma senha com pelo menos 12 caracteres, combinando letras, números e símbolos.",
              "Não reutilize senhas de outros serviços ou sistemas.",
              "Nunca compartilhe sua senha com outros colaboradores — cada usuário deve ter seu próprio acesso.",
              "Em computadores compartilhados, sempre encerre sua sessão ao sair.",
              "Se suspeitar que sua senha foi comprometida, altere-a imediatamente.",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

      </div>
    </>
  );
}
