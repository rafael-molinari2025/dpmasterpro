import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Header from "@/components/layout/Header";
import Link from "next/link";
import { ArrowLeft, CheckCircle, XCircle, Star, Zap, Building2, Users, FileText } from "lucide-react";

const PLANOS = {
  BASICO: {
    nome: "Básico",
    cor: "blue",
    preco: "Gratuito",
    limites: { empresas: 3, usuarios: 2, funcionarios: 50 },
    recursos: [
      { label: "Até 3 empresas",            ok: true  },
      { label: "Até 50 funcionários",        ok: true  },
      { label: "Até 2 usuários",             ok: true  },
      { label: "Folha de pagamento",         ok: true  },
      { label: "eSocial S-1.3",             ok: true  },
      { label: "Relatórios básicos",         ok: true  },
      { label: "Suporte por e-mail",         ok: true  },
      { label: "Relatórios avançados",       ok: false },
      { label: "API de integração",          ok: false },
      { label: "Suporte prioritário",        ok: false },
    ],
  },
  PROFISSIONAL: {
    nome: "Profissional",
    cor: "purple",
    preco: "R$ 197/mês",
    limites: { empresas: 20, usuarios: 10, funcionarios: 500 },
    recursos: [
      { label: "Até 20 empresas",            ok: true  },
      { label: "Até 500 funcionários",       ok: true  },
      { label: "Até 10 usuários",            ok: true  },
      { label: "Folha de pagamento",         ok: true  },
      { label: "eSocial S-1.3",             ok: true  },
      { label: "Relatórios básicos",         ok: true  },
      { label: "Suporte por e-mail",         ok: true  },
      { label: "Relatórios avançados",       ok: true  },
      { label: "API de integração",          ok: false },
      { label: "Suporte prioritário",        ok: false },
    ],
  },
  ENTERPRISE: {
    nome: "Enterprise",
    cor: "amber",
    preco: "Sob consulta",
    limites: { empresas: 999, usuarios: 999, funcionarios: 99999 },
    recursos: [
      { label: "Empresas ilimitadas",        ok: true  },
      { label: "Funcionários ilimitados",    ok: true  },
      { label: "Usuários ilimitados",        ok: true  },
      { label: "Folha de pagamento",         ok: true  },
      { label: "eSocial S-1.3",             ok: true  },
      { label: "Relatórios básicos",         ok: true  },
      { label: "Suporte por e-mail",         ok: true  },
      { label: "Relatórios avançados",       ok: true  },
      { label: "API de integração",          ok: true  },
      { label: "Suporte prioritário",        ok: true  },
    ],
  },
};

const COR: Record<string, { badge: string; ring: string; btn: string; icon: string }> = {
  blue:   { badge: "bg-blue-100 text-blue-700",   ring: "ring-blue-500",   btn: "bg-blue-600 hover:bg-blue-700",   icon: "bg-blue-50 text-blue-600"   },
  purple: { badge: "bg-purple-100 text-purple-700", ring: "ring-purple-500", btn: "bg-purple-600 hover:bg-purple-700", icon: "bg-purple-50 text-purple-600" },
  amber:  { badge: "bg-amber-100 text-amber-700",  ring: "ring-amber-500",  btn: "bg-amber-600 hover:bg-amber-700",  icon: "bg-amber-50 text-amber-600"  },
};

export default async function PlanoPage() {
  const session = await auth();
  const user = session?.user as any;
  if (!session?.user) redirect("/login");
  if (user?.perfil !== "ADMIN") redirect("/dashboard");

  const escritorioId = user.escritorioId as string;

  const [escritorio, totalEmpresas, totalUsuarios, totalFuncionarios] = await Promise.all([
    db.escritorio.findUnique({
      where: { id: escritorioId },
      select: { nome: true, cnpj: true, plano: true, createdAt: true },
    }),
    db.empresa.count({ where: { escritorioId, ativa: true } }),
    db.usuario.count({ where: { escritorioId, ativo: true } }),
    db.funcionario.count({ where: { empresa: { escritorioId }, situacao: "ATIVO" } }),
  ]);

  const planoAtual = escritorio?.plano ?? "BASICO";
  const planoInfo = PLANOS[planoAtual];
  const cor = COR[planoInfo.cor];

  return (
    <>
      <Header title="Plano e Faturamento" subtitle="Seu plano atual, uso e opções de upgrade" />
      <div className="flex-1 p-3 sm:p-6 space-y-6">
        <div className="flex items-center gap-2 mb-2 text-sm text-gray-500">
          <Link href="/configuracoes" className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Configurações
          </Link>
          <span>/</span>
          <span className="text-gray-700 font-medium">Plano e Faturamento</span>
        </div>

        {/* Plano atual + uso */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Card plano */}
          <div className={`bg-white rounded-xl border-2 p-6 col-span-1 ${cor.ring} ring-2`}>
            <div className="flex items-center gap-2 mb-4">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cor.badge}`}>
                PLANO ATUAL
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">{planoInfo.nome}</h2>
            <p className="text-lg font-semibold text-gray-600 mt-1">{planoInfo.preco}</p>
            <p className="text-xs text-gray-400 mt-1">
              Cliente desde {escritorio?.createdAt
                ? new Date(escritorio.createdAt).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
                : "—"}
            </p>
            <div className="mt-5 space-y-2">
              {planoInfo.recursos.slice(0, 6).map((r) => (
                <div key={r.label} className="flex items-center gap-2 text-sm">
                  {r.ok
                    ? <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    : <XCircle className="w-4 h-4 text-gray-300 flex-shrink-0" />}
                  <span className={r.ok ? "text-gray-700" : "text-gray-400"}>{r.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Uso atual */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 col-span-2 space-y-5">
            <h3 className="font-semibold text-gray-800">Uso Atual</h3>
            <UsageBar
              icon={Building2}
              label="Empresas"
              atual={totalEmpresas}
              limite={planoInfo.limites.empresas}
              cor="blue"
            />
            <UsageBar
              icon={Users}
              label="Usuários"
              atual={totalUsuarios}
              limite={planoInfo.limites.usuarios}
              cor="purple"
            />
            <UsageBar
              icon={Users}
              label="Funcionários"
              atual={totalFuncionarios}
              limite={planoInfo.limites.funcionarios}
              cor="green"
            />
            {planoAtual !== "ENTERPRISE" && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800 flex items-start gap-2">
                <Zap className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Precisa de mais recursos?</p>
                  <p className="text-xs mt-0.5">
                    Entre em contato para fazer upgrade do seu plano e ter acesso a mais empresas, usuários e recursos avançados.
                  </p>
                  <a
                    href="mailto:sm.servicosetecnologia@gmail.com?subject=Upgrade%20de%20Plano%20-%20DP%20Master%20Pro"
                    className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-amber-800 underline hover:text-amber-900"
                  >
                    Solicitar upgrade →
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Comparação de planos */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              Comparação de Planos
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Recurso</th>
                  {(["BASICO", "PROFISSIONAL", "ENTERPRISE"] as const).map((p) => (
                    <th key={p} className={`px-6 py-3 text-center text-xs font-medium uppercase tracking-wide ${
                      p === planoAtual ? `${COR[PLANOS[p].cor].badge} font-bold` : "text-gray-500"
                    }`}>
                      {PLANOS[p].nome}
                      {p === planoAtual && <span className="block text-[10px] normal-case font-normal mt-0.5">Seu plano</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-6 py-3 text-sm text-gray-600">Empresas</td>
                  <td className="px-6 py-3 text-center text-sm font-medium">3</td>
                  <td className="px-6 py-3 text-center text-sm font-medium">20</td>
                  <td className="px-6 py-3 text-center text-sm font-medium">Ilimitado</td>
                </tr>
                <tr>
                  <td className="px-6 py-3 text-sm text-gray-600">Funcionários</td>
                  <td className="px-6 py-3 text-center text-sm">50</td>
                  <td className="px-6 py-3 text-center text-sm">500</td>
                  <td className="px-6 py-3 text-center text-sm">Ilimitado</td>
                </tr>
                <tr>
                  <td className="px-6 py-3 text-sm text-gray-600">Usuários</td>
                  <td className="px-6 py-3 text-center text-sm">2</td>
                  <td className="px-6 py-3 text-center text-sm">10</td>
                  <td className="px-6 py-3 text-center text-sm">Ilimitado</td>
                </tr>
                {PLANOS.ENTERPRISE.recursos.map((r) => (
                  <tr key={r.label}>
                    <td className="px-6 py-3 text-sm text-gray-600">{r.label}</td>
                    {(["BASICO", "PROFISSIONAL", "ENTERPRISE"] as const).map((p) => {
                      const ok = PLANOS[p].recursos.find((x) => x.label === r.label)?.ok ?? false;
                      return (
                        <td key={p} className="px-6 py-3 text-center">
                          {ok
                            ? <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                            : <XCircle className="w-4 h-4 text-gray-200 mx-auto" />}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                <tr className="bg-gray-50">
                  <td className="px-6 py-3 text-sm font-semibold text-gray-700">Preço</td>
                  <td className="px-6 py-3 text-center text-sm font-bold text-blue-600">Gratuito</td>
                  <td className="px-6 py-3 text-center text-sm font-bold text-purple-600">R$ 197/mês</td>
                  <td className="px-6 py-3 text-center text-sm font-bold text-amber-600">Sob consulta</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-500 text-center">
              Para alterar seu plano, entre em contato:{" "}
              <a href="mailto:sm.servicosetecnologia@gmail.com" className="text-blue-600 hover:underline">
                sm.servicosetecnologia@gmail.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function UsageBar({
  icon: Icon, label, atual, limite, cor,
}: {
  icon: React.ElementType; label: string; atual: number; limite: number; cor: string;
}) {
  const pct = limite >= 999 ? 0 : Math.min(100, Math.round((atual / limite) * 100));
  const barCor = pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : cor === "blue" ? "bg-blue-500" : cor === "purple" ? "bg-purple-500" : "bg-green-500";
  const isUnlimited = limite >= 999;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Icon className="w-4 h-4 text-gray-400" />
          {label}
        </div>
        <span className="text-sm font-semibold text-gray-900">
          {atual} {isUnlimited ? "" : `/ ${limite}`}
        </span>
      </div>
      {!isUnlimited && (
        <>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div className={`h-2 rounded-full transition-all ${barCor}`} style={{ width: `${pct}%` }} />
          </div>
          <p className={`text-xs mt-1 ${pct >= 90 ? "text-red-600 font-medium" : "text-gray-400"}`}>
            {pct}% utilizado {pct >= 90 && "— limite próximo"}
          </p>
        </>
      )}
    </div>
  );
}
