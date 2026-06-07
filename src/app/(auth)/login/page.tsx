import { Banknote, Lock, Mail, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:flex-1 flex-col justify-between p-12 bg-gradient-to-br from-blue-900 to-slate-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
            <Banknote className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-lg">SYS-DP</p>
            <p className="text-blue-300 text-xs">Departamento Pessoal</p>
          </div>
        </div>

        <div>
          <h1 className="text-4xl font-bold text-white leading-tight">
            Gestão de Folha<br />e DP com<br />
            <span className="text-blue-400">conformidade total</span>
          </h1>
          <p className="text-slate-400 mt-4 text-base leading-relaxed max-w-sm">
            Sistema completo para escritórios contábeis. eSocial, Tabelas INSS/IRRF,
            Rubricas, Rescisão, Férias e muito mais — tudo online.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "eSocial S-1.3", desc: "Envio automático" },
            { label: "CLT Completa", desc: "Cálculos precisos" },
            { label: "LGPD", desc: "100% conforme" },
          ].map((f) => (
            <div key={f.label} className="bg-white/5 rounded-xl p-4">
              <p className="text-white text-sm font-semibold">{f.label}</p>
              <p className="text-slate-400 text-xs mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-[480px] flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
              <Banknote className="w-5 h-5 text-white" />
            </div>
            <p className="text-slate-900 font-bold text-lg">SYS-DP</p>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Bem-vindo de volta</h2>
          <p className="text-gray-500 text-sm mb-8">Entre com suas credenciais para acessar o sistema.</p>

          <form className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  placeholder="seu@escritorio.com.br"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-gray-700">Senha</label>
                <a href="#" className="text-xs text-blue-600 hover:underline">Esqueceu a senha?</a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="lembrar" className="w-4 h-4 rounded border-gray-300 text-blue-600" />
              <label htmlFor="lembrar" className="text-sm text-gray-600">Manter conectado por 7 dias</label>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Entrar no Sistema
            </button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-xs text-blue-700 font-medium">Acesso Multi-Empresa</p>
            <p className="text-xs text-blue-600 mt-0.5">
              Um único login para gerenciar todas as empresas clientes do seu escritório.
            </p>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">
              Ao entrar, você concorda com os <a href="#" className="text-blue-600 hover:underline">Termos de Uso</a> e{" "}
              <a href="#" className="text-blue-600 hover:underline">Política de Privacidade</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
