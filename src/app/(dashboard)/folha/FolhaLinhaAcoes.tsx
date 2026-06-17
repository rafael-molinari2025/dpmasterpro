"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Send } from "lucide-react";

interface Props {
  folhaId: string;
  status: string;
  empresaId: string;
  competencia: string;
}

export default function FolhaLinhaAcoes({ folhaId, status, empresaId, competencia }: Props) {
  const router = useRouter();
  const [fechando, setFechando] = useState(false);

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

  return (
    <div className="flex items-center gap-3">
      {status !== "FECHADA" && (
        <button
          onClick={fecharFolha}
          disabled={fechando}
          className="flex items-center gap-1.5 text-xs text-amber-600 hover:underline disabled:opacity-50"
        >
          <Lock className="w-3 h-3" />
          {fechando ? "Fechando…" : "Fechar"}
        </button>
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
