"use client";

import { Bell, Search, HelpCircle, ChevronDown, Menu, AlertTriangle, AlertCircle, Info, X, CalendarX, FileText, Send } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useSidebar } from "./SidebarProvider";
import Link from "next/link";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

interface Alerta {
  id: string;
  tipo: "ferias" | "guia" | "esocial";
  nivel: "info" | "aviso" | "critico";
  titulo: string;
  descricao: string;
  link?: string;
}

const nivelIcon = {
  critico: AlertCircle,
  aviso: AlertTriangle,
  info: Info,
};
const nivelCor = {
  critico: "text-red-500",
  aviso: "text-amber-500",
  info: "text-blue-500",
};
const tipoCor = {
  ferias: "bg-orange-50 border-orange-100",
  guia: "bg-amber-50 border-amber-100",
  esocial: "bg-red-50 border-red-100",
};
const tipoIcon = {
  ferias: CalendarX,
  guia: FileText,
  esocial: Send,
};

export default function Header({ title, subtitle }: HeaderProps) {
  const [empresa] = useState("Empresa Exemplo Ltda");
  const { toggle } = useSidebar();

  const [abrirSino, setAbrirSino] = useState(false);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [carregado, setCarregado] = useState(false);
  const sinoRef = useRef<HTMLDivElement>(null);

  // Fecha ao clicar fora
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (sinoRef.current && !sinoRef.current.contains(e.target as Node)) {
        setAbrirSino(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function toggleSino() {
    setAbrirSino((v) => !v);
    if (!carregado) {
      setCarregando(true);
      try {
        const res = await fetch("/api/notificacoes");
        const data = await res.json();
        setAlertas(data.alertas ?? []);
        setCarregado(true);
      } catch {
        setAlertas([]);
      } finally {
        setCarregando(false);
      }
    }
  }

  const total = alertas.length;

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
        <div ref={sinoRef} className="relative">
          <button
            onClick={toggleSino}
            className={`relative w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
              abrirSino ? "bg-gray-100 text-gray-700" : "text-gray-500 hover:bg-gray-100"
            }`}
            aria-label="Notificações"
          >
            <Bell className="w-4 h-4" />
            {(carregado ? total > 0 : true) && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>

          {abrirSino && (
            <div className="absolute right-0 top-10 w-80 sm:w-96 bg-white rounded-xl border border-gray-200 shadow-lg z-50 overflow-hidden">
              {/* Header do dropdown */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Notificações</p>
                  {carregado && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {total === 0 ? "Nenhum alerta no momento" : `${total} alerta${total !== 1 ? "s" : ""}`}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setAbrirSino(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Conteúdo */}
              <div className="max-h-96 overflow-y-auto">
                {carregando ? (
                  <div className="py-10 text-center text-sm text-gray-400">Carregando...</div>
                ) : alertas.length === 0 ? (
                  <div className="py-10 text-center">
                    <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Nenhum alerta no momento</p>
                    <p className="text-xs text-gray-300 mt-1">Tudo em dia!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {alertas.map((a) => {
                      const NivelIcon = nivelIcon[a.nivel];
                      const TipoIcon = tipoIcon[a.tipo];
                      const content = (
                        <div className={`px-4 py-3 flex gap-3 hover:bg-gray-50 transition-colors ${tipoCor[a.tipo]}`}>
                          <div className="flex-shrink-0 mt-0.5">
                            <TipoIcon className={`w-4 h-4 ${nivelCor[a.nivel]}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-1.5">
                              <NivelIcon className={`w-3 h-3 mt-0.5 flex-shrink-0 ${nivelCor[a.nivel]}`} />
                              <p className="text-xs font-semibold text-gray-900 leading-tight">{a.titulo}</p>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5 truncate">{a.descricao}</p>
                          </div>
                        </div>
                      );
                      return a.link ? (
                        <Link key={a.id} href={a.link} onClick={() => setAbrirSino(false)}>
                          {content}
                        </Link>
                      ) : (
                        <div key={a.id}>{content}</div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              {carregado && alertas.length > 0 && (
                <div className="border-t border-gray-100 px-4 py-2.5">
                  <Link
                    href="/configuracoes/notificacoes"
                    onClick={() => setAbrirSino(false)}
                    className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Configurar notificações →
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
