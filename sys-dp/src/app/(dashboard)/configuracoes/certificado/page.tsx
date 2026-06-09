"use client";

import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, ShieldX, ShieldAlert, ChevronRight, UploadCloud } from "lucide-react";

interface EmpresaResumida {
  id: string;
  razaoSocial: string;
  nomeFantasia: string | null;
  cnpj: string;
  certificadoInfo?: {
    configurado: boolean;
    validade?: string | null;
    tipo?: string | null;
  } | null;
}

function statusCert(info: EmpresaResumida["certificadoInfo"]) {
  if (!info?.configurado) {
    return { icon: ShieldX, label: "Não configurado", cor: "text-gray-400 bg-gray-50 border-gray-200" };
  }
  if (!info.validade) {
    return { icon: ShieldCheck, label: "Configurado", cor: "text-green-600 bg-green-50 border-green-200" };
  }
  const vencimento = new Date(info.validade);
  const diff = (vencimento.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (diff < 0) {
    return { icon: ShieldX, label: "Vencido", cor: "text-red-600 bg-red-50 border-red-200" };
  }
  if (diff <= 30) {
    return { icon: ShieldAlert, label: `Vence em ${Math.ceil(diff)}d`, cor: "text-amber-600 bg-amber-50 border-amber-200" };
  }
  return { icon: ShieldCheck, label: `Válido até ${vencimento.toLocaleDateString("pt-BR")}`, cor: "text-green-600 bg-green-50 border-green-200" };
}

export default function CertificadoPage() {
  const [empresas, setEmpresas] = useState<EmpresaResumida[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    fetch("/api/empresas")
      .then((r) => r.json())
      .then((data) => {
        setEmpresas(Array.isArray(data) ? data : []);
      })
      .finally(() => setCarregando(false));
  }, []);

  return (
    <>
      <Header title="Certificado Digital" subtitle="Status dos certificados A1 de todas as empresas" />
      <div className="flex-1 p-3 sm:p-6 space-y-6">

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/configuracoes" className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Configurações
          </Link>
          <span>/</span>
          <span className="text-gray-700 font-medium">Certificado Digital</span>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
          O certificado digital é configurado individualmente em cada empresa. Para fazer upload ou renovar, acesse a empresa desejada e utilize a aba de Certificado.
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Empresas Cadastradas</h2>
            <p className="text-xs text-gray-500 mt-0.5">{empresas.length} empresa{empresas.length !== 1 ? "s" : ""}</p>
          </div>

          {carregando ? (
            <div className="py-16 text-center text-sm text-gray-400">Carregando...</div>
          ) : empresas.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-400">Nenhuma empresa cadastrada.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {empresas.map((emp) => {
                const status = statusCert(emp.certificadoInfo);
                const Icon = status.icon;
                return (
                  <Link
                    key={emp.id}
                    href={`/empresas/${emp.id}`}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group"
                  >
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${status.cor} min-w-[120px]`}>
                      <Icon className="w-3.5 h-3.5" />
                      {status.label}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{emp.nomeFantasia ?? emp.razaoSocial}</p>
                      <p className="text-xs text-gray-500 font-mono">{emp.cnpj}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      <UploadCloud className="w-4 h-4" />
                      Gerenciar
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </>
  );
}
