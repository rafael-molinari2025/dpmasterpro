import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Header from "@/components/layout/Header";
import { Shield, Users, FileText, Download, Eye, AlertTriangle, CheckCircle } from "lucide-react";

export default async function LGPDPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const escritorioId = (session.user as any).escritorioId as string;

  const empresaIds = await db.empresa.findMany({
    where: { escritorioId },
    select: { id: true },
  }).then((es) => es.map((e) => e.id));

  const funcionarioIds = await db.funcionario.findMany({
    where: { empresaId: { in: empresaIds } },
    select: { id: true },
  }).then((fs) => fs.map((f) => f.id));

  const [comConsentimento, pendentes] = await Promise.all([
    db.consentimentoLGPD.count({
      where: { funcionarioId: { in: funcionarioIds }, concedido: true },
    }).catch(() => 0),
    db.consentimentoLGPD.count({
      where: { funcionarioId: { in: funcionarioIds }, concedido: false },
    }).catch(() => 0),
  ]);

  const totalFuncionarios = funcionarioIds.length;

  return (
    <>
      <Header title="LGPD" subtitle="Gestão de dados pessoais conforme Lei nº 13.709/2018" />
      <div className="flex-1 p-3 sm:p-6 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Consentimentos Concedidos", value: String(comConsentimento), icon: CheckCircle, color: "text-green-600" },
            { label: "Pendentes de Consentimento", value: String(pendentes), icon: AlertTriangle, color: "text-amber-600" },
            { label: "Total de Titulares", value: String(totalFuncionarios), icon: Users, color: "text-blue-600" },
            { label: "Relatórios Gerados", value: "0", icon: FileText, color: "text-gray-600" },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-white rounded-lg border border-gray-200 px-4 py-4">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`w-4 h-4 ${s.color}`} />
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            );
          })}
        </div>

        {/* Actions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              title: "Consentimentos",
              desc: "Registre e gerencie os consentimentos de tratamento de dados de cada titular (funcionário/dependente).",
              icon: CheckCircle,
              action: "Gerenciar Consentimentos",
              color: "blue",
            },
            {
              title: "Portabilidade de Dados",
              desc: "Atenda solicitações de portabilidade. Gere arquivo JSON/XML com todos os dados do titular.",
              icon: Download,
              action: "Exportar Dados do Titular",
              color: "green",
            },
            {
              title: "Exclusão e Anonimização",
              desc: "Anonimize ou exclua dados de funcionários demitidos conforme os prazos legais de retenção.",
              icon: Shield,
              action: "Anonimizar Dados",
              color: "amber",
            },
            {
              title: "Relatório de Impacto (DPIA)",
              desc: "Gere o Relatório de Impacto à Proteção de Dados conforme art. 38 da LGPD.",
              icon: FileText,
              action: "Gerar DPIA",
              color: "purple",
            },
            {
              title: "Log de Acesso",
              desc: "Visualize todas as operações de acesso, modificação e exclusão de dados pessoais.",
              icon: Eye,
              action: "Ver Auditoria",
              color: "slate",
            },
            {
              title: "Titulares",
              desc: "Gerencie as solicitações dos titulares (acesso, correção, exclusão, oposição).",
              icon: Users,
              action: "Solicitações",
              color: "red",
            },
          ].map((card) => {
            const Icon = card.icon;
            const colorMap: Record<string, string> = {
              blue: "text-blue-600 bg-blue-50",
              green: "text-green-600 bg-green-50",
              amber: "text-amber-600 bg-amber-50",
              purple: "text-purple-600 bg-purple-50",
              slate: "text-slate-600 bg-slate-100",
              red: "text-red-600 bg-red-50",
            };
            const btnMap: Record<string, string> = {
              blue: "bg-blue-600 hover:bg-blue-700",
              green: "bg-green-600 hover:bg-green-700",
              amber: "bg-amber-600 hover:bg-amber-700",
              purple: "bg-purple-600 hover:bg-purple-700",
              slate: "bg-slate-600 hover:bg-slate-700",
              red: "bg-red-600 hover:bg-red-700",
            };
            return (
              <div key={card.title} className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${colorMap[card.color]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{card.title}</h3>
                <p className="text-sm text-gray-500 flex-1">{card.desc}</p>
                <button className={`mt-4 w-full text-white text-sm py-2 rounded-lg transition-colors ${btnMap[card.color]}`}>
                  {card.action}
                </button>
              </div>
            );
          })}
        </div>

        {/* LGPD Reference */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
          <h3 className="font-semibold text-slate-800 mb-3">Prazos de Retenção de Dados (CLT + LGPD)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            {[
              { dado: "Folha de Pagamento", prazo: "10 anos", base: "Art. 225 CLT" },
              { dado: "FGTS / SEFIP", prazo: "30 anos", base: "Art. 23 §5 LCFGTS" },
              { dado: "Documentos Trabalhistas", prazo: "5 anos após rescisão", base: "Art. 11 CLT" },
              { dado: "eSocial / DCTFWeb", prazo: "10 anos", base: "Instrução Normativa RFB" },
              { dado: "Dados Médicos (PCMSO)", prazo: "20 anos", base: "NR-7" },
              { dado: "Dados Biométricos", prazo: "Enquanto necessário", base: "Art. 15 LGPD" },
            ].map((item) => (
              <div key={item.dado} className="bg-white border border-slate-200 rounded-lg p-3">
                <p className="font-medium text-slate-800">{item.dado}</p>
                <p className="text-slate-600 text-xs mt-1">{item.prazo}</p>
                <p className="text-slate-400 text-[11px]">{item.base}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}
