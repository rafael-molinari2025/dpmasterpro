import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Header from "@/components/layout/Header";
import { Users, Calculator, Umbrella, Send, Receipt, Clock, TrendingUp, Building2 } from "lucide-react";

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const escritorioId = (session.user as any).escritorioId as string;

  const hoje = new Date();
  const competenciaAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
  const em30dias = new Date(hoje.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [
    totalAtivos,
    totalEmpresas,
    feriasVencer,
    eventosPendentes,
    folhasDoMes,
  ] = await Promise.all([
    db.funcionario.count({ where: { situacao: "ATIVO", empresa: { escritorioId } } }),
    db.empresa.count({ where: { escritorioId, ativa: true } }),
    db.ferias.count({
      where: {
        funcionario: { empresa: { escritorioId } },
        status: { in: ["PROGRAMADA", "PENDENTE"] },
        dataInicio: { lte: em30dias },
      },
    }).catch(() => 0),
    db.eventoEsocial.count({
      where: { empresa: { escritorioId }, status: "PENDENTE" },
    }).catch(() => 0),
    db.folha.findMany({
      where: { empresa: { escritorioId }, competencia: competenciaAtual },
      select: { totalProventos: true, totalDescontos: true, totalLiquido: true, totalINSSPatronal: true },
    }),
  ]);

  const totalProventos = folhasDoMes.reduce((s, f) => s + parseFloat(f.totalProventos.toString()), 0);
  const totalDescontos = folhasDoMes.reduce((s, f) => s + parseFloat(f.totalDescontos.toString()), 0);
  const totalLiquido = folhasDoMes.reduce((s, f) => s + parseFloat(f.totalLiquido.toString()), 0);
  const totalPatronal = folhasDoMes.reduce((s, f) => s + parseFloat(f.totalINSSPatronal.toString()), 0);

  const mesLabel = hoje.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const mesCap = mesLabel.charAt(0).toUpperCase() + mesLabel.slice(1);

  const nextMes = hoje.getMonth() + 2 > 12 ? 1 : hoje.getMonth() + 2;
  const nextAno = hoje.getMonth() + 2 > 12 ? hoje.getFullYear() + 1 : hoje.getFullYear();
  const nextMesPad = String(nextMes).padStart(2, "0");

  const proximosVencimentos = [
    { descricao: "GPS — INSS Empregado/Empregador", data: `20/${nextMesPad}/${nextAno}`, status: "pendente" },
    { descricao: "DARF — IRRF", data: `20/${nextMesPad}/${nextAno}`, status: "pendente" },
    { descricao: "FGTS Digital", data: `07/${nextMesPad}/${nextAno}`, status: "pendente" },
    { descricao: "DCTFWeb", data: `15/${nextMesPad}/${nextAno}`, status: "pendente" },
  ];

  const stats = [
    { label: "Funcionários Ativos", value: String(totalAtivos), icon: Users, color: "blue", change: `${totalEmpresas} empresa${totalEmpresas !== 1 ? "s" : ""}` },
    { label: "Folhas do Mês", value: String(folhasDoMes.length), icon: Calculator, color: "green", change: totalProventos > 0 ? `R$ ${fmt(totalLiquido)} líquido` : "Nenhuma processada" },
    { label: "Férias a Vencer (30d)", value: String(feriasVencer), icon: Umbrella, color: "yellow", change: feriasVencer > 0 ? `${feriasVencer} a programar` : "Nenhuma pendente" },
    { label: "Eventos eSocial", value: String(eventosPendentes), icon: Send, color: "purple", change: eventosPendentes > 0 ? `${eventosPendentes} pendente${eventosPendentes !== 1 ? "s" : ""}` : "Nenhum pendente" },
  ];

  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    yellow: "bg-amber-50 text-amber-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <>
      <Header title="Dashboard" subtitle="Visão geral do Departamento Pessoal" />
      <div className="flex-1 p-6 space-y-6">

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    <p className="text-xs text-gray-400 mt-1">{stat.change}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[stat.color]}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Empresas Ativas</h2>
              <Building2 className="w-4 h-4 text-gray-400" />
            </div>
            <div className="px-5 py-6 text-center">
              <p className="text-4xl font-bold text-blue-600">{totalEmpresas}</p>
              <p className="text-sm text-gray-500 mt-2">empresas cadastradas no escritório</p>
              <a href="/empresas" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
                Ver todas as empresas →
              </a>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Próximos Vencimentos</h2>
              <Receipt className="w-4 h-4 text-gray-400" />
            </div>
            <div className="divide-y divide-gray-50">
              {proximosVencimentos.map((item, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <p className="text-sm text-gray-800">{item.descricao}</p>
                    <p className="text-xs text-gray-400">Vence em {item.data}</p>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Competência Atual — {mesCap}</h2>
            <TrendingUp className="w-4 h-4 text-gray-400" />
          </div>
          {folhasDoMes.length === 0 ? (
            <div className="text-center py-6">
              <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Nenhuma folha processada para {mesCap}.</p>
              <a href="/folha" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
                Processar folha agora →
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Total Proventos", value: `R$ ${fmt(totalProventos)}` },
                { label: "Total Descontos", value: `R$ ${fmt(totalDescontos)}` },
                { label: "Total Líquido", value: `R$ ${fmt(totalLiquido)}` },
                { label: "Encargos Patronais", value: `R$ ${fmt(totalPatronal)}` },
              ].map((item) => (
                <div key={item.label} className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500">{item.label}</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">{item.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </>
  );
}
