import Header from "@/components/layout/Header";
import { Building2, Users, Shield, Bell, Database, Key, Globe, CreditCard } from "lucide-react";

export default function ConfiguracoesPage() {
  return (
    <>
      <Header title="Configurações" subtitle="Configurações do sistema e do escritório" />
      <div className="flex-1 p-6 space-y-6">

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              icon: Building2, title: "Dados do Escritório",
              desc: "CNPJ, razão social, endereço, contato e logotipo.",
              color: "blue",
            },
            {
              icon: Users, title: "Usuários e Perfis",
              desc: "Gerencie usuários, perfis de acesso (Admin, Gerente, Operador) e MFA.",
              color: "purple",
            },
            {
              icon: Key, title: "Certificado Digital",
              desc: "Importe e gerencie o certificado A1/A3 para assinatura do eSocial.",
              color: "amber",
            },
            {
              icon: Globe, title: "eSocial — Ambiente",
              desc: "Alterne entre Homologação e Produção. Credenciais e proxy.",
              color: "green",
            },
            {
              icon: Bell, title: "Notificações",
              desc: "Configure alertas de vencimento de férias, guias e eSocial.",
              color: "red",
            },
            {
              icon: Database, title: "Backup e Dados",
              desc: "Exportação de dados, backup periódico e retenção conforme LGPD.",
              color: "slate",
            },
            {
              icon: CreditCard, title: "Plano e Faturamento",
              desc: "Gerencie seu plano, número de empresas e faturas.",
              color: "indigo",
            },
            {
              icon: Shield, title: "Segurança",
              desc: "Políticas de senha, sessão, 2FA e log de acessos.",
              color: "rose",
            },
          ].map((card) => {
            const Icon = card.icon;
            const colors: Record<string, { icon: string; btn: string }> = {
              blue: { icon: "bg-blue-50 text-blue-600", btn: "bg-blue-600 hover:bg-blue-700" },
              purple: { icon: "bg-purple-50 text-purple-600", btn: "bg-purple-600 hover:bg-purple-700" },
              amber: { icon: "bg-amber-50 text-amber-600", btn: "bg-amber-600 hover:bg-amber-700" },
              green: { icon: "bg-green-50 text-green-600", btn: "bg-green-600 hover:bg-green-700" },
              red: { icon: "bg-red-50 text-red-600", btn: "bg-red-600 hover:bg-red-700" },
              slate: { icon: "bg-slate-100 text-slate-600", btn: "bg-slate-600 hover:bg-slate-700" },
              indigo: { icon: "bg-indigo-50 text-indigo-600", btn: "bg-indigo-600 hover:bg-indigo-700" },
              rose: { icon: "bg-rose-50 text-rose-600", btn: "bg-rose-600 hover:bg-rose-700" },
            };
            const c = colors[card.color];
            return (
              <div key={card.title} className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${c.icon}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{card.title}</h3>
                <p className="text-sm text-gray-500 flex-1">{card.desc}</p>
                <button className={`mt-4 w-full text-white text-sm py-2 rounded-lg transition-colors ${c.btn}`}>
                  Configurar
                </button>
              </div>
            );
          })}
        </div>

        {/* System Info */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
          <h3 className="font-semibold text-slate-800 mb-3">Informações do Sistema</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            {[
              { label: "Versão", value: "1.0.0" },
              { label: "eSocial", value: "S-1.3" },
              { label: "Tabelas", value: "2026" },
              { label: "Ambiente", value: "Homologação" },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-slate-500 text-xs">{item.label}</p>
                <p className="font-medium text-slate-900 mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}
