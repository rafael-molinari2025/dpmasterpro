"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, CheckCircle } from "lucide-react";

interface Props {
  funcionarioId: string;
  tipoRescisao: string;
  dataDemissao: string;
}

export default function RescisaoAcoes({ funcionarioId, tipoRescisao, dataDemissao }: Props) {
  const router = useRouter();
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [erro, setErro] = useState("");

  async function salvar() {
    if (!confirm("Confirmar rescisão? O funcionário será marcado como DEMITIDO.")) return;
    setSalvando(true);
    setErro("");
    try {
      const res = await fetch("/api/rescisao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ funcionarioId, tipoRescisao, dataDemissao }),
      });
      if (res.ok) {
        setSalvo(true);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setErro(data.error ?? "Erro ao registrar rescisão");
      }
    } finally {
      setSalvando(false);
    }
  }

  if (salvo) {
    return (
      <span className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
        <CheckCircle className="w-4 h-4" />
        Rescisão registrada
      </span>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {erro && <span className="text-xs text-red-600">{erro}</span>}
      <button
        onClick={salvar}
        disabled={salvando}
        className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-700 transition-colors disabled:opacity-50"
      >
        <Save className="w-4 h-4" />
        {salvando ? "Salvando…" : "Registrar Rescisão"}
      </button>
    </div>
  );
}
