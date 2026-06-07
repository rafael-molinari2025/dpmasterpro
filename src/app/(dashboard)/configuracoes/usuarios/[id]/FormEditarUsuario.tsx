"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Eye, EyeOff, Shield, User, AlertCircle, CheckCircle, Info, Trash2 } from "lucide-react";
import PermissoesSelector from "../PermissoesSelector";

const label = "block text-xs font-medium text-gray-600 mb-1";
const input = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";

interface Props {
  usuario: {
    id: string;
    nome: string;
    email: string;
    perfil: string;
    permissoes: string[];
    ativo: boolean;
  };
  isSelf: boolean;
}

export default function FormEditarUsuario({ usuario, isSelf }: Props) {
  const router = useRouter();
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);
  const [resultado, setResultado] = useState<{ tipo: "sucesso" | "erro"; msg: string } | null>(null);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [perfil, setPerfil] = useState<"ADMIN" | "OPERADOR">(
    usuario.perfil === "ADMIN" ? "ADMIN" : "OPERADOR"
  );
  const [permissoes, setPermissoes] = useState<string[]>(usuario.permissoes ?? []);
  const [form, setForm] = useState({
    nome: usuario.nome,
    email: usuario.email,
    novaSenha: "",
    ativo: usuario.ativo,
  });

  function field(key: keyof typeof form) {
    return {
      value: String(form[key]),
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((f) => ({ ...f, [key]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value })),
    };
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setResultado(null);
    setSalvando(true);
    try {
      const payload: Record<string, unknown> = {
        nome: form.nome,
        email: form.email,
        perfil,
        permissoes,
        ativo: form.ativo,
      };
      if (form.novaSenha) {
        if (form.novaSenha.length < 8) {
          setResultado({ tipo: "erro", msg: "A nova senha deve ter pelo menos 8 caracteres." });
          setSalvando(false);
          return;
        }
        payload.senha = form.novaSenha;
      }

      const res = await fetch(`/api/usuarios/${usuario.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setResultado({ tipo: "erro", msg: data.error ?? "Erro ao salvar." });
      } else {
        setResultado({ tipo: "sucesso", msg: "Usuário atualizado com sucesso!" });
        router.refresh();
      }
    } catch {
      setResultado({ tipo: "erro", msg: "Erro de conexão." });
    } finally {
      setSalvando(false);
    }
  }

  async function excluir() {
    setExcluindo(true);
    try {
      const res = await fetch(`/api/usuarios/${usuario.id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/configuracoes/usuarios");
        router.refresh();
      } else {
        const data = await res.json();
        setResultado({ tipo: "erro", msg: data.error ?? "Erro ao excluir." });
        setConfirmarExclusao(false);
      }
    } catch {
      setResultado({ tipo: "erro", msg: "Erro de conexão." });
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <div className="flex-1 p-6 max-w-3xl">
      <form onSubmit={salvar} className="space-y-6">

        {/* Dados básicos */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">Dados do Usuário</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={label}>Nome Completo *</label>
              <input className={input} required {...field("nome")} />
            </div>
            <div className="sm:col-span-2">
              <label className={label}>E-mail *</label>
              <input className={input} type="email" required {...field("email")} />
            </div>
            <div className="sm:col-span-2">
              <label className={label}>Nova Senha <span className="text-gray-400 font-normal">(deixe em branco para manter)</span></label>
              <div className="relative">
                <input
                  className={`${input} pr-10`}
                  type={mostrarSenha ? "text" : "password"}
                  placeholder="Mínimo 8 caracteres"
                  {...field("novaSenha")}
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
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="ativo"
                checked={form.ativo}
                onChange={(e) => setForm((f) => ({ ...f, ativo: e.target.checked }))}
                disabled={isSelf}
                className="w-4 h-4 rounded border-gray-300 text-blue-600"
              />
              <label htmlFor="ativo" className="text-sm text-gray-700">
                Usuário ativo
                {isSelf && <span className="text-xs text-gray-400 ml-1">(não pode desativar a si mesmo)</span>}
              </label>
            </div>
          </div>
        </section>

        {/* Tipo de perfil */}
        {!isSelf && (
          <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-800">Tipo de Acesso</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPerfil("OPERADOR")}
                className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                  perfil === "OPERADOR" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${perfil === "OPERADOR" ? "bg-blue-100" : "bg-gray-100"}`}>
                  <User className={`w-5 h-5 ${perfil === "OPERADOR" ? "text-blue-600" : "text-gray-500"}`} />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900">Usuário</p>
                  <p className="text-xs text-gray-500 mt-0.5">Acesso limitado aos módulos selecionados.</p>
                </div>
                {perfil === "OPERADOR" && <CheckCircle className="w-4 h-4 text-blue-600 ml-auto flex-shrink-0 mt-0.5" />}
              </button>

              <button
                type="button"
                onClick={() => setPerfil("ADMIN")}
                className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                  perfil === "ADMIN" ? "border-purple-500 bg-purple-50" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${perfil === "ADMIN" ? "bg-purple-100" : "bg-gray-100"}`}>
                  <Shield className={`w-5 h-5 ${perfil === "ADMIN" ? "text-purple-600" : "text-gray-500"}`} />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900">Administrador</p>
                  <p className="text-xs text-gray-500 mt-0.5">Acesso total ao sistema.</p>
                </div>
                {perfil === "ADMIN" && <CheckCircle className="w-4 h-4 text-purple-600 ml-auto flex-shrink-0 mt-0.5" />}
              </button>
            </div>
          </section>
        )}

        {/* Permissões */}
        {perfil === "OPERADOR" && (
          <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <div>
              <h2 className="font-semibold text-gray-800">Permissões de Acesso</h2>
              <p className="text-xs text-gray-500 mt-0.5">Módulos que este usuário pode acessar.</p>
            </div>
            <PermissoesSelector selecionadas={permissoes} onChange={setPermissoes} />
          </section>
        )}

        {perfil === "ADMIN" && (
          <div className="flex items-start gap-2.5 bg-purple-50 border border-purple-200 rounded-xl p-4">
            <Info className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-purple-800">Administrador tem acesso irrestrito a todos os módulos.</p>
          </div>
        )}

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

        <div className="flex items-center justify-between pb-6">
          <button
            type="submit"
            disabled={salvando}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Save className={`w-4 h-4 ${salvando ? "animate-pulse" : ""}`} />
            {salvando ? "Salvando…" : "Salvar Alterações"}
          </button>

          {!isSelf && (
            <div>
              {!confirmarExclusao ? (
                <button
                  type="button"
                  onClick={() => setConfirmarExclusao(true)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir usuário
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-red-700 font-medium">Confirmar exclusão?</span>
                  <button
                    type="button"
                    onClick={excluir}
                    disabled={excluindo}
                    className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {excluindo ? "Excluindo…" : "Confirmar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmarExclusao(false)}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
