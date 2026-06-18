import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import Header from "@/components/layout/Header";
import FormEditarEmpresa from "./FormEditarEmpresa";
import { Building2, Users, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function EmpresaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const escritorioId = (session.user as any).escritorioId as string;
  const { id } = await params;

  const empresa = await db.empresa.findFirst({
    where: { id, escritorioId },
    include: { _count: { select: { funcionarios: true } } },
  });

  if (!empresa) notFound();

  // Sanitizar certificado — nunca expor pfxBase64 ao cliente
  const cert = empresa.certificadoDigital as {
    pfxBase64?: string;
    senha?: string;
    validade?: string;
    titular?: string;
  } | null;

  const empresaSanitized = {
    ...empresa,
    aliquotaRAT: parseFloat(empresa.aliquotaRAT.toString()),
    fatorMEI: parseFloat(empresa.fatorMEI.toString()),
    certificadoDigital: cert
      ? { configurado: true, validade: cert.validade ?? null, titular: cert.titular ?? null }
      : null,
  } as Parameters<typeof FormEditarEmpresa>[0]["empresa"];

  const totalFunc = empresa._count.funcionarios;

  return (
    <>
      <Header
        title={empresa.nomeFantasia ?? empresa.razaoSocial}
        subtitle={`CNPJ ${empresa.cnpj} • ${totalFunc} funcionário${totalFunc !== 1 ? "s" : ""}`}
      />
      <div className="flex-1 p-3 sm:p-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-sm text-gray-500">
          <Link href="/empresas" className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Empresas
          </Link>
          <span>/</span>
          <span className="text-gray-700 font-medium">{empresa.razaoSocial}</span>
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-gray-500">Funcionários</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalFunc}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-slate-500" />
              <span className="text-xs text-gray-500">Regime</span>
            </div>
            <p className="text-sm font-semibold text-gray-800">
              {{ SIMPLES_NACIONAL: "Simples", LUCRO_PRESUMIDO: "Lucro Presumido", LUCRO_REAL: "Lucro Real", MEI: "MEI" }[empresa.regimeTributario] ?? empresa.regimeTributario}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
            <span className="text-xs text-gray-500 block mb-1">Status</span>
            <span className={`text-sm font-semibold ${empresa.ativa ? "text-green-700" : "text-red-600"}`}>
              {empresa.ativa ? "Ativa" : "Inativa"}
            </span>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
            <span className="text-xs text-gray-500 block mb-1">Certificado A1</span>
            {cert ? (
              <span className={`text-sm font-semibold ${
                cert.validade && new Date(cert.validade + "T23:59:59") < new Date()
                  ? "text-red-600"
                  : "text-green-700"
              }`}>
                {cert.validade && new Date(cert.validade + "T23:59:59") < new Date()
                  ? "Vencido"
                  : "Configurado"}
              </span>
            ) : (
              <span className="text-sm font-semibold text-amber-600">Não configurado</span>
            )}
          </div>
        </div>

        <FormEditarEmpresa empresa={empresaSanitized} />
      </div>
    </>
  );
}
