"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, Eye, EyeOff, Shield, User, AlertCircle, CheckCircle, Info } from "lucide-react";
import PermissoesSelector from "../PermissoesSelector";
import { PERMISSOES_PADRAO } from "@/lib/permissoes";

const label = "block text-xs font-medium text-gray-600 mb-1";
const input = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";

export default function FormNovoUsuario() {
  const router = useRouter();
  const [salvando, setSalvando] = useState(false);
  const [resultado, setResultado] = useState<{ tipo: "erro"; msg: string } | null>(null);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [perfil, setPerfil] = useState<"ADMIN" | "OPERADOR">("OPERADOR");
  const [permissoes, setPermissoes] = useState<string[]>([...PERMISSOES_PADRAO]);

  const [form, setForm] = useState({
    nome: "",
    email: "",
    senha: "",
    confirmarSenha: "",
  });

  function field(key: keyof typeof form) {
    return {
      value: form[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((f) => ({ ...f, [key]: e.target.value })),
    };
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setResultado(null);

    if (form.senha !== form.confirmarSenha) {
      setResultado({ tipo: "erro", msg: "As senhas não coincidem." });
      return;
    }
    if (form.senha.length < 8) {
      setResultado({ tipo: "erro", msg: "A senha deve ter pelo menos 8 caracteres." });
      return;
    }

    setSalvando(true);
    try {
      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: form.nome,
          email: form.email,
          senha: form.senha,
          perfil,
          permissoes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResultado({ tipo: "erro", msg: data.error ?? "Erro ao criar usuário." });
      } else {
        router.push("/configuracoes/usuarios");
        router.refresh();
      }
    } catch {
      setResultado({ tipo: "erro", msg: "Erro de conexão. Tente novamente." });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="flex-1 p-6 max-w-3xl">
      <div className="mb-5">
        <a href="/configuracoes/usuarios" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4" />
          Voltar para usuários
        </a>
      </div>

      <form onSubmit={salvar} className="space-y-6">

        {/* Dados básicos */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">Dados do Usuário</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={label}>Nome Completo *</label>
              <input className={input} required placeholder="Nome do usuário" {...field("nome")} />
            </div>
            <div className="sm:col-span-2">
              <label className={label}>E-mail *</label>
              <input className={input} type="email" required placeholder="email@exemplo.com" {...field("email")} />
            </div>
            <div>
              <label className={label}>Senha *</label>
              <div className="relative">
                <input
                  className={`${input} pr-10`}
                  type={mostrarSenha ? "text" : "password"}
                  required
                  placeholder="Mínimo 8 caracteres"
                  {...field("senha")}
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className={label}>Confirmar Senha *</label>
              <input
                className={input}
                type="password"
                required
                placeholder="Repita a senha"
                {...field("confirmarSenha")}
              />
            </div>
          </div>
        </section>

        {/* Tipo de perfil */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">Tipo de Acesso</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Usuário */}
            <button
              type="button"
              onClick={() => setPerfil("OPERADOR")}
              className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                perfil === "OPERADOR"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${perfil === "OPERADOR" ? "bg-blue-100" : "bg-gray-100"}`}>
                <User className={`w-5 h-5 ${perfil === "OPERADOR" ? "text-blue-600" : "text-gray-500"}`} />
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-900">Usuário</p>
                <p className="text-xs text-gray-500 mt-0.5">Acesso limitado aos módulos selecionados abaixo.</p>
              </div>
              {perfil === "OPERADOR" && (
                <CheckCircle className="w-4 h-4 text-blue-600 ml-auto flex-shrink-0 mt-0.5" />
              )}
            </button>

            {/* Administrador */}
            <button
              type="button"
              onClick={() => setPerfil("ADMIN")}
              className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                perfil === "ADMIN"
                  ? "border-purple-500 bg-purple-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${perfil === "ADMIN" ? "bg-purple-100" : "bg-gray-100"}`}>
                <Shield className={`w-5 h-5 ${perfil === "ADMIN" ? "text-purple-600" : "text-gray-500"}`} />
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-900">Administrador</p>
                <p className="text-xs text-gray-500 mt-0.5">Acesso total ao sistema, incluindo usuários e configurações.</p>
              </div>
              {perfil === "ADMIN" && (
                <CheckCircle className="w-4 h-4 text-purple-600 ml-auto flex-shrink-0 mt-0.5" />
              )}
            </button>
          </div>
        </section>

        {/* Permissões de módulos (somente para usuários) */}
        {perfil === "OPERADOR" && (
          <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <div>
              <h2 className="font-semibold text-gray-800">Permissões de Acesso</h2>
              <p className="text-xs text-gray-500 mt-0.5">Selecione os módulos que este usuário poderá acessar.</p>
            </div>
            <PermissoesSelector selecionadas={permissoes} onChange={setPermissoes} />
          </section>
        )}

        {perfil === "ADMIN" && (
          <div className="flex items-start gap-2.5 bg-purple-50 border border-purple-200 rounded-xl p-4">
            <Info className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-purple-800">
              Administradores têm acesso irrestrito a todos os módulos, incluindo gerenciamento de usuários e configurações do escritório.
            </p>
          </div>
        )}

        {resultado && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {resultado.msg}
          </div>
        )}

        <div className="flex items-center gap-3 pb-6">
          <button
            type="submit"
            disabled={salvando}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Save className={`w-4 h-4 ${salvando ? "animate-pulse" : ""}`} />
            {salvando ? "Criando usuário..." : "Criar Usuário"}
          </button>
          <a
            href="/configuracoes/usuarios"
            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </a>
        </div>
      </form>
    </div>
  );
}
