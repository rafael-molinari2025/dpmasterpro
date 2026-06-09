"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

export interface Alerta {
  id: string;
  tipo: "ferias" | "guia" | "esocial";
  nivel: "info" | "aviso" | "critico";
  titulo: string;
  descricao: string;
  link?: string;
}

interface NotificacoesCtx {
  alertas: Alerta[];
  lidos: Set<string>;
  naoLidos: number;
  carregando: boolean;
  marcarLido: (id: string) => void;
  marcarTodosLidos: () => void;
  recarregar: () => void;
}

const Ctx = createContext<NotificacoesCtx>({
  alertas: [],
  lidos: new Set(),
  naoLidos: 0,
  carregando: false,
  marcarLido: () => {},
  marcarTodosLidos: () => {},
  recarregar: () => {},
});

const LS_KEY = "dp_notif_lidos";

function getLidos(): Set<string> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}
function salvarLidos(ids: Set<string>) {
  try {
    // Mantém no máximo 200 IDs lidos para não crescer indefinidamente
    const arr = [...ids].slice(-200);
    localStorage.setItem(LS_KEY, JSON.stringify(arr));
  } catch {}
}

export function NotificacoesProvider({ children }: { children: React.ReactNode }) {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [lidos, setLidos] = useState<Set<string>>(new Set());
  const [carregando, setCarregando] = useState(false);
  const carregadoRef = useRef(false);

  // Carrega IDs lidos do localStorage (client-only)
  useEffect(() => {
    setLidos(getLidos());
  }, []);

  const buscar = useCallback(async () => {
    setCarregando(true);
    try {
      const res = await fetch("/api/notificacoes");
      const data = await res.json();
      setAlertas(data.alertas ?? []);
      carregadoRef.current = true;
    } catch {
      setAlertas([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  // Busca ao montar (uma vez por sessão de navegação)
  useEffect(() => {
    if (!carregadoRef.current) {
      buscar();
    }
  }, [buscar]);

  function marcarLido(id: string) {
    setLidos((prev) => {
      const next = new Set(prev);
      next.add(id);
      salvarLidos(next);
      return next;
    });
  }

  function marcarTodosLidos() {
    setLidos((prev) => {
      const next = new Set(prev);
      alertas.forEach((a) => next.add(a.id));
      salvarLidos(next);
      return next;
    });
  }

  const naoLidos = alertas.filter((a) => !lidos.has(a.id)).length;

  return (
    <Ctx.Provider value={{ alertas, lidos, naoLidos, carregando, marcarLido, marcarTodosLidos, recarregar: buscar }}>
      {children}
    </Ctx.Provider>
  );
}

export function useNotificacoes() {
  return useContext(Ctx);
}
