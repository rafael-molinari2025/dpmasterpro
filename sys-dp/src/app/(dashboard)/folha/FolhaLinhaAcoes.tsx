"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Send, Receipt, Loader2 } from "lucide-react";

interface Props {
  folhaId: string;
  status: string;
  empresaId: string;
  competencia: string;
  temGuias: boolean;
}

export default function FolhaLinhaAcoes({ folhaId, status, empresaId, competencia, temGuias }: Props) {
  const router = useRouter();
  const [fechando, setFechando] = useState(false);
  const [gerandoGuias, setGerandoGuias] = useState(false);

  async function fecharFolha() {
    if (!confirm(`Fechar folha de ${competencia}? Esta operação não pode ser desfeita.`)) return;
    setFechando(true);
    try {
      const res = await fetch(`/api/folha/${folhaId}/fechar`, { method: "POST" });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Erro ao fechar folha");
      }
    } finally {
      setFechando(false);
    }
  }

  async function gerarGuias() {
    if (!confirm(`Gerar guias de pagamento para ${competencia}?`)) return;
    setGerandoGuias(true);
    try {
      const res = await fetch("/api/guias/gerar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empresaId, folhaId, competencia }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        router.push("/guias");
        router.refresh();
      } else {
        alert(data.error ?? "Erro ao gerar guias");
        router.refresh();
      }
    } finally {
      setGerandoGuias(false);
    }
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {status !== "FECHADA" && (
        <button
          onClick={fecharFolha}
          disabled={fechando}
          className="flex items-center gap-1.5 text-xs text-amber-600 hover:underline disabled:opacity-50"
        >
          {fechando ? <Loader2 className="w-3 h-3 animate-spin" /> : <Lock className="w-3 h-3" />}
          {fechando ? "Fechando…" : "Fechar"}
        </button>
      )}
      {status === "FECHADA" && !temGuias && (
        <button
          onClick={gerarGuias}
          disabled={gerandoGuias}
          className="flex items-center gap-1.5 text-xs text-green-600 hover:underline disabled:opacity-50"
        >
          {gerandoGuias ? <Loader2 className="w-3 h-3 animate-spin" /> : <Receipt className="w-3 h-3" />}
          {gerandoGuias ? "Gerando…" : "Gerar Guias"}
        </button>
      )}
      {status === "FECHADA" && temGuias && (
        <a
          href={`/guias?competencia=${competencia}&empresaId=${empresaId}`}
          className="flex items-center gap-1.5 text-xs text-green-600 hover:underline"
        >
          <Receipt className="w-3 h-3" />
          Ver Guias
        </a>
      )}
      <a
        href={`/esocial?empresaId=${empresaId}&tipo=S-1200`}
        className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
      >
        <Send className="w-3 h-3" />
        eSocial
      </a>
    </div>
  );
}
