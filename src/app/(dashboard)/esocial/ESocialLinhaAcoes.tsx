"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, RotateCcw } from "lucide-react";

interface Props {
  eventoId: string;
  status: string;
  xmlGerado: string | null;
  tipoEvento: string;
  descricao: string;
}

export default function ESocialLinhaAcoes({ eventoId, status, xmlGerado, tipoEvento, descricao }: Props) {
  const router = useRouter();
  const [reenviando, setReenviando] = useState(false);

  function verXml() {
    if (!xmlGerado) return;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(
        `<pre style="font-family:monospace;font-size:12px;padding:16px;white-space:pre-wrap">${xmlGerado.replace(/</g, "&lt;")}</pre>`
      );
      win.document.title = `${tipoEvento} — ${descricao}`;
    }
  }

  async function reenviar() {
    setReenviando(true);
    try {
      const res = await fetch("/api/esocial/enviar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventoId }),
      });
      if (res.ok) router.refresh();
    } finally {
      setReenviando(false);
    }
  }

  return (
    <div className="flex items-center gap-1">
      {xmlGerado && (
        <button
          title="Ver XML"
          onClick={verXml}
          className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
      )}
      {(status === "ERRO" || status === "REJEITADO") && (
        <button
          title="Reenviar"
          onClick={reenviar}
          disabled={reenviando}
          className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:text-amber-600 hover:bg-amber-50 disabled:opacity-50"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${reenviando ? "animate-spin" : ""}`} />
        </button>
      )}
    </div>
  );
}
