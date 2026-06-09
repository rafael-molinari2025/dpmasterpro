"use client";

import { Bell, Search, HelpCircle, ChevronDown, Menu, AlertTriangle, AlertCircle, Info, X, CalendarX, FileText, Send, CheckCheck } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useSidebar } from "./SidebarProvider";
import { useNotificacoes, type Alerta } from "./NotificacoesProvider";
import Link from "next/link";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

const nivelIcon = { critico: AlertCircle, aviso: AlertTriangle, info: Info };
const nivelCor  = { critico: "text-red-500", aviso: "text-amber-500", info: "text-blue-500" };
const tipoCor   = { ferias: "bg-orange-50", guia: "bg-amber-50", esocial: "bg-red-50" };
const tipoIcon  = { ferias: CalendarX, guia: FileText, esocial: Send };

function AlertaItem({ a, onLer }: { a: Alerta; onLer: (id: string) => void }) {
  const NivelIcon = nivelIcon[a.nivel];
  const TipoIcon  = tipoIcon[a.tipo];

  const inner = (
    <div
      className={`px-4 py-3 flex gap-3 hover:brightness-95 transition-all cursor-pointer ${tipoCor[a.tipo]}`}
      onClick={() => onLer(a.id)}
    >
      <TipoIcon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${nivelCor[a.nivel]}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <NivelIcon className={`w-3 h-3 flex-shrink-0 ${nivelCor[a.nivel]}`} />
          <p className="text-xs font-semibold text-gray-900 leading-tight truncate">{a.titulo}</p>
        </div>
        <p className="text-xs text-gray-500 mt-0.5 truncate">{a.descricao}</p>
      </div>
    </div>
  );

  return a.link ? (
    <Link href={a.link}>{inner}</Link>
  ) : (
    <div>{inner}</div>
  );
}

export default function Header({ title, subtitle }: HeaderProps) {
  const [empresa] = useState("Empresa Exemplo Ltda");
  const { toggle } = useSidebar();
  const { alertas, lidos, naoLidos, carregando, marcarLido, marcarTodosLidos } = useNotificacoes();

  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Fecha ao clicar fora
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6 flex-shrink-0 print:hidden">
      {/* Left */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={toggle}
          className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors flex-shrink-0"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <h1 className="text-base md:text-lg font-semibold text-gray-900 truncate">{title}</h1>
          {subtitle && <p className="text-xs text-gray-500 truncate hidden sm:block">{subtitle}</p>}
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Company Selector */}
        <button className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 hover:bg-blue-100 transition-colors">
          <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">E</div>
          <span className="hidden md:inline max-w-[140px] truncate">{empresa}</span>
          <ChevronDown className="w-3 h-3 flex-shrink-0 hidden md:inline" />
        </button>

        {/* Search */}
        <button className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
          <Search className="w-4 h-4" />
        </button>

        {/* Notifications */}
        <div ref={ref} className="relative">
          <button
            onClick={() => setAberto((v) => !v)}
            className={`relative w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
              aberto ? "bg-gray-100 text-gray-700" : "text-gray-500 hover:bg-gray-100"
            }`}
            aria-label="Notificações"
          >
            <Bell className="w-4 h-4" />
            {naoLidos > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-0.5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white leading-none">
                {naoLidos > 9 ? "9+" : naoLidos}
              </span>
            )}
          </button>

          {aberto && (
            <div className="absolute right-0 top-10 w-80 sm:w-96 bg-white rounded-xl border border-gray-200 shadow-lg z-50 overflow-hidden">
              {/* Cabeçalho */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Notificações</p>
                  <p className="text-xs text-gray-400">
                    {carregando ? "Carregando..." : naoLidos === 0 ? "Tudo lido" : `${naoLidos} não lida${naoLidos !== 1 ? "s" : ""}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {naoLidos > 0 && (
                    <button
                      onClick={marcarTodosLidos}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                      title="Marcar todas como lidas"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Ler tudo
                    </button>
                  )}
                  <button onClick={() => setAberto(false)} className="text-gray-400 hover:text-gray-600 ml-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Lista */}
              <div className="max-h-[360px] overflow-y-auto">
                {carregando ? (
                  <div className="py-10 text-center text-sm text-gray-400">Carregando alertas...</div>
                ) : alertas.length === 0 ? (
                  <div className="py-10 text-center">
                    <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Nenhum alerta no momento</p>
                    <p className="text-xs text-gray-300 mt-1">Tudo em dia!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {alertas.map((a) => (
                      <div key={a.id} className={lidos.has(a.id) ? "opacity-50" : ""}>
                        <AlertaItem a={a} onLer={(id) => { marcarLido(id); setAberto(false); }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Rodapé */}
              {alertas.length > 0 && (
                <div className="border-t border-gray-100 px-4 py-2.5 flex items-center justify-between bg-gray-50">
                  <span className="text-xs text-gray-400">{alertas.length} alerta{alertas.length !== 1 ? "s" : ""} no total</span>
                  <Link
                    href="/configuracoes/notificacoes"
                    onClick={() => setAberto(false)}
                    className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Configurar →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Help */}
        <button className="hidden sm:flex w-8 h-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
