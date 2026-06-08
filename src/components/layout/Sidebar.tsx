"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard, Building2, Users, FileText, BookOpen,
  Calculator, Umbrella, UserMinus, Send, Receipt, BarChart3,
  Shield, Upload, Settings, ChevronDown, ChevronRight, LogOut,
  Banknote, BookMarked, Activity,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { ModuloKey } from "@/lib/permissoes";

type NavChild = { label: string; href: string };
type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  modulo?: ModuloKey;
  adminOnly?: boolean;
  children?: NavChild[];
};

const navItems: NavItem[] = [
  { label: "Dashboard",        href: "/dashboard",     icon: LayoutDashboard, modulo: "dashboard" },
  { label: "Empresas",         href: "/empresas",      icon: Building2,       modulo: "empresas" },
  {
    label: "Funcionários",     href: "/funcionarios",  icon: Users,           modulo: "funcionarios",
    children: [
      { label: "Cadastro",  href: "/funcionarios" },
      { label: "Cargos",    href: "/funcionarios/cargos" },
      { label: "Setores",   href: "/funcionarios/setores" },
    ],
  },
  {
    label: "Folha de Pagamento", href: "/folha",       icon: Calculator,      modulo: "folha",
    children: [
      { label: "Processar Folha",  href: "/folha" },
      { label: "13º Salário",      href: "/folha/decimo-terceiro" },
      { label: "Adiantamento",     href: "/folha/adiantamento" },
    ],
  },
  { label: "Férias",            href: "/ferias",       icon: Umbrella,        modulo: "ferias" },
  { label: "Rescisão",          href: "/rescisao",     icon: UserMinus,       modulo: "rescisao" },
  {
    label: "Rubricas",          href: "/rubricas",     icon: BookOpen,        modulo: "rubricas",
    children: [
      { label: "Configurar Rubricas", href: "/rubricas" },
      { label: "Eventos eSocial",     href: "/rubricas/eventos" },
    ],
  },
  {
    label: "Tabelas Legais",    href: "/tabelas",      icon: FileText,        modulo: "tabelas",
    children: [
      { label: "INSS",           href: "/tabelas/inss" },
      { label: "IRRF",           href: "/tabelas/irrf" },
      { label: "FGTS",           href: "/tabelas/fgts" },
      { label: "Salário Mínimo", href: "/tabelas/salario-minimo" },
    ],
  },
  {
    label: "eSocial",           href: "/esocial",      icon: Send,            modulo: "esocial",
    children: [
      { label: "Eventos Pendentes", href: "/esocial" },
      { label: "Histórico de Envios", href: "/esocial/historico" },
      { label: "Monitor",           href: "/esocial/monitor" },
    ],
  },
  {
    label: "Guias de Pagamento", href: "/guias",       icon: Receipt,         modulo: "guias",
    children: [
      { label: "GPS / INSS",  href: "/guias/gps" },
      { label: "DARF / IRRF", href: "/guias/darf" },
      { label: "FGTS Digital", href: "/guias/fgts" },
      { label: "DCTFWeb",     href: "/guias/dctfweb" },
    ],
  },
  {
    label: "Relatórios",        href: "/relatorios",   icon: BarChart3,       modulo: "relatorios",
    children: [
      { label: "Holerite",              href: "/relatorios/holerite" },
      { label: "Resumo da Folha",       href: "/relatorios/resumo" },
      { label: "RAIS",                  href: "/relatorios/rais" },
      { label: "DIRF",                  href: "/relatorios/dirf" },
      { label: "Informe de Rendimentos", href: "/relatorios/informe" },
    ],
  },
  { label: "LGPD",              href: "/lgpd",         icon: Shield,          modulo: "lgpd" },
  { label: "Importação",        href: "/importacao",   icon: Upload,          modulo: "importacao" },
  { label: "Manual",            href: "/manual",       icon: BookMarked },
  { label: "Logs do Sistema",   href: "/configuracoes/logs", icon: Activity, adminOnly: true },
  { label: "Configurações",     href: "/configuracoes", icon: Settings,       adminOnly: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<string[]>([]);
  const { data: session } = useSession();

  const userName = session?.user?.name ?? "Usuário";
  const userEmail = session?.user?.email ?? "—";
  const perfil = (session?.user as any)?.perfil ?? "OPERADOR";
  const permissoes: string[] = (session?.user as any)?.permissoes ?? [];
  const isAdmin = perfil === "ADMIN";

  const userInitials = userName
    .split(" ")
    .filter(Boolean)
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  function podeVer(item: NavItem): boolean {
    if (isAdmin) return true;
    if (item.adminOnly) return false;
    if (!item.modulo) return true;
    return permissoes.includes(item.modulo);
  }

  function toggleExpand(label: string) {
    setExpanded((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  const itensFiltrados = navItems.filter(podeVer);

  return (
    <aside className="fixed left-0 top-0 h-full w-[260px] bg-slate-900 flex flex-col z-30 print:hidden">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-700">
        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
          <Banknote className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-tight">DP Master Pro</p>
          <p className="text-slate-400 text-[11px]">Departamento Pessoal</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-4 px-3">
        <ul className="space-y-0.5">
          {itensFiltrados.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const open = expanded.includes(item.label);
            const hasChildren = !!item.children;

            return (
              <li key={item.label}>
                {hasChildren ? (
                  <>
                    <button
                      onClick={() => toggleExpand(item.label)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                        active
                          ? "bg-blue-600 text-white"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      )}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="flex-1 text-left">{item.label}</span>
                      {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    </button>
                    {open && (
                      <ul className="mt-0.5 ml-4 pl-3 border-l border-slate-700 space-y-0.5">
                        {item.children!.map((child) => (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              className={cn(
                                "block px-3 py-1.5 rounded-lg text-sm transition-colors",
                                pathname === child.href
                                  ? "text-blue-400 font-medium"
                                  : "text-slate-400 hover:text-white"
                              )}
                            >
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                      active
                        ? "bg-blue-600 text-white"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Footer */}
      <div className="p-3 border-t border-slate-700">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${isAdmin ? "bg-purple-500" : "bg-blue-500"}`}>
            {userInitials || "US"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">{userName}</p>
            <p className={`text-[11px] truncate ${isAdmin ? "text-purple-300" : "text-slate-400"}`}>
              {isAdmin ? "Administrador" : "Usuário"}
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Sair do sistema"
            className="text-slate-400 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
