"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, RefreshCw, CheckCircle, AlertCircle, Info } from "lucide-react";

interface Props {
  empresas: Array<{ id: string; razaoSocial: string; nomeFantasia: string | null }>;
  qtdPendente: number;
  modoDemo: boolean;
}

export default function ESocialAcoes({ empresas, qtdPendente, modoDemo }: Props) {
  const router = useRouter();
  const [empresaId, setEmpresaId] = useState(empresas[0]?.id ?? "");
  const [enviando, setEnviando] = useState(false);
  const [consultando, setConsultando] = useState(false);
  const [resultado, setResultado] = useState<{
    tipo: "sucesso" | "erro" | "info";
    mensagem: string;
    protocolo?: string;
    demo?: boolean;
  } | null>(null);

  async function enviarPendentes() {
    if (!empresaId) return;
    setEnviando(true);
    setResultado(null);

    try {
      const res = await fetch("/api/esocial/enviar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empresaId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setResultado({ tipo: "erro", mensagem: data.error ?? "Erro ao transmitir." });
      } else if (data.enviados === 0) {
        setResultado({ tipo: "info", mensagem: "Nenhum evento pendente para esta empresa." });
      } else {
        setResultado({
          tipo: "sucesso",
          mensagem: data.descricao ?? `${data.enviados} evento(s) transmitido(s) com sucesso.`,
          protocolo: data.protocolo,
          demo: data.modoDemo,
        });
        router.refresh();
      }
    } catch {
      setResultado({ tipo: "erro", mensagem: "Erro de conexão. Verifique sua rede." });
    } finally {
      setEnviando(false);
    }
  }

  async function atualizarStatus() {
    setConsultando(true);
    setResultado(null);
    try {
      // Recarrega a página para refletir status atualizado
      router.refresh();
      setResultado({ tipo: "info", mensagem: "Status dos eventos atualizado." });
    } finally {
      setConsultando(false);
    }
  }

  const colorMap = {
    sucesso: "bg-green-50 border-green-200 text-green-800",
    erro: "bg-red-50 border-red-200 text-red-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
  };

  const IconMap = {
    sucesso: CheckCircle,
    erro: AlertCircle,
    info: Info,
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Seletor de empresa + botões */}
      <div className="flex items-center gap-2 flex-wrap">
        {empresas.length > 1 && (
          <select
            value={empresaId}
            onChange={(e) => setEmpresaId(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {empresas.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nomeFantasia ?? e.razaoSocial}
              </option>
            ))}
          </select>
        )}

        <button
          onClick={atualizarStatus}
          disabled={consultando || enviando}
          className="flex items-center gap-2 px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${consultando ? "animate-spin" : ""}`} />
          Atualizar Status
        </button>

        <button
          onClick={enviarPendentes}
          disabled={enviando || consultando || !empresaId || qtdPendente === 0}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send className={`w-4 h-4 ${enviando ? "animate-pulse" : ""}`} />
          {enviando ? "Transmitindo..." : `Enviar Pendentes${qtdPendente > 0 ? ` (${qtdPendente})` : ""}`}
        </button>
      </div>

      {/* Badge modo demo */}
      {modoDemo && (
        <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2.5 rounded-lg">
          <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>
            Modo demonstração ativo — certificado não configurado. Configure{" "}
            <code className="font-mono bg-amber-100 px-1 rounded break-all">ESOCIAL_CERT_BASE64</code>{" "}
            para transmissão real.
          </span>
        </div>
      )}

      {/* Resultado da operação */}
      {resultado && (
        <div className={`flex items-start gap-2.5 border px-4 py-3 rounded-lg text-sm ${colorMap[resultado.tipo]}`}>
          {(() => { const Icon = IconMap[resultado.tipo]; return <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />; })()}
          <div>
            <p className="font-medium">{resultado.mensagem}</p>
            {resultado.protocolo && (
              <p className="mt-1 text-xs font-mono opacity-80">
                Protocolo: {resultado.protocolo}
                {resultado.demo ? " [DEMO]" : ""}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
