"use client";

import { useState } from "react";
import { CheckCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  guiaId: string;
  status: string;
}

export default function GuiaLinhaAcoes({ guiaId, status }: Props) {
  const router = useRouter();
  const [marking, setMarking] = useState(false);

  if (status === "PAGO") return null;

  async function marcarPago() {
    if (!confirm("Confirmar o pagamento desta guia?")) return;
    setMarking(true);
    try {
      const res = await fetch(`/api/guias/${guiaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PAGO", dataPagamento: new Date().toISOString() }),
      });
      if (res.ok) router.refresh();
    } finally {
      setMarking(false);
    }
  }

  return (
    <button
      onClick={marcarPago}
      disabled={marking}
      className="flex items-center gap-1.5 text-xs text-green-700 hover:text-green-900 px-2 py-1.5 rounded-lg border border-green-200 hover:bg-green-50 transition-colors disabled:opacity-50 whitespace-nowrap"
    >
      {marking
        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
        : <CheckCircle className="w-3.5 h-3.5" />}
      Marcar Pago
    </button>
  );
}
