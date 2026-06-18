"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function CopiarPixButton({ pixCopiaCola }: { pixCopiaCola: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(pixCopiaCola);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      const el = document.createElement("textarea");
      el.value = pixCopiaCola;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  }

  return (
    <button
      onClick={copiar}
      className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${
        copiado
          ? "bg-green-100 text-green-700"
          : "bg-green-50 text-green-700 hover:bg-green-100"
      }`}
    >
      {copiado ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copiado ? "Copiado!" : "Copiar Pix"}
    </button>
  );
}
