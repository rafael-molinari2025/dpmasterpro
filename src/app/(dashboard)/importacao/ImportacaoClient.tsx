"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, FileSpreadsheet, FileCode, CheckCircle, AlertTriangle, X, Download } from "lucide-react";

interface Empresa { id: string; razaoSocial: string; nomeFantasia: string | null; }
interface ResultadoItem { linha: number; status: "ok" | "erro" | "ignorado"; mensagem?: string; nome?: string; }

function baixarModeloCSV() {
  const cabecalho = "nome;cpf;data_admissao;salario;data_nascimento;sexo;estado_civil;tipo_contrato;matricula;email;celular;pis_pasep;cargo;setor";
  const exemplo = "João da Silva;123.456.789-00;01/03/2024;3500,00;15/06/1985;M;CASADO;CLT;;joao@empresa.com;11999998888;;Analista;TI";
  const blob = new Blob(["﻿" + cabecalho + "\n" + exemplo], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "modelo_funcionarios.csv"; a.click();
  URL.revokeObjectURL(url);
}

export default function ImportacaoClient({ empresas }: { empresas: Empresa[] }) {
  const [empresaId, setEmpresaId] = useState(empresas[0]?.id ?? "");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<{ criados: number; erros: number; ignorados: number; resultados: ResultadoItem[] } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    setArquivo(f);
    setResultado(null);
    setErro(null);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  async function handleImportar() {
    if (!arquivo || !empresaId) return;
    setLoading(true);
    setErro(null);
    const fd = new FormData();
    fd.append("file", arquivo);
    fd.append("empresaId", empresaId);
    try {
      const res = await fetch("/api/importacao/funcionarios", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setErro(data.error ?? "Erro ao importar"); }
      else { setResultado(data); }
    } catch { setErro("Erro de conexão"); }
    finally { setLoading(false); }
  }

  return (
    <div className="space-y-6">
      {/* Configuração */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Importar Funcionários via CSV</h2>

        <div>
          <label className="text-xs text-gray-500 block mb-1">Empresa de destino *</label>
          <select
            value={empresaId}
            onChange={(e) => setEmpresaId(e.target.value)}
            className="w-full sm:w-72 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {empresas.map((e) => (
              <option key={e.id} value={e.id}>{e.nomeFantasia ?? e.razaoSocial}</option>
            ))}
          </select>
        </div>

        {/* Drop Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center text-center transition-colors cursor-pointer ${
            dragOver ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"
          }`}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className={`w-10 h-10 mb-3 ${dragOver ? "text-blue-500" : "text-gray-400"}`} />
          {arquivo ? (
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-gray-700">{arquivo.name}</span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setArquivo(null); setResultado(null); }}
                className="ml-1 text-gray-400 hover:text-red-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm font-medium text-gray-700">Arraste o arquivo CSV aqui</p>
              <p className="text-xs text-gray-500 mt-1">ou clique para selecionar</p>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.txt"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </div>

        {erro && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {erro}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleImportar}
            disabled={!arquivo || !empresaId || loading}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Upload className="w-4 h-4" />
            {loading ? "Importando..." : "Importar Funcionários"}
          </button>
          <button
            onClick={baixarModeloCSV}
            className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Baixar Modelo CSV
          </button>
        </div>
      </div>

      {/* Instruções */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
        <h3 className="text-sm font-semibold text-slate-800">Formato do arquivo CSV</h3>
        <p className="text-xs text-slate-600">Separador: <code className="bg-white border border-slate-200 px-1 rounded">;</code> (ponto e vírgula) ou <code className="bg-white border border-slate-200 px-1 rounded">,</code> (vírgula)</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
          <div>
            <p className="font-medium text-slate-700 mb-1">Campos obrigatórios:</p>
            <ul className="space-y-0.5">
              {["nome", "cpf", "data_admissao (dd/mm/aaaa)", "salario (ex: 3500,00)"].map(f => (
                <li key={f} className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-500" />{f}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-medium text-slate-700 mb-1">Campos opcionais:</p>
            <ul className="space-y-0.5">
              {["data_nascimento", "sexo (M/F)", "estado_civil", "email", "celular", "cargo", "setor", "pis_pasep"].map(f => (
                <li key={f} className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-gray-400" />{f}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Resultado */}
      {resultado && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
            <h2 className="font-semibold text-gray-900">Resultado da Importação</h2>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5 text-green-700">
                <CheckCircle className="w-4 h-4" />
                {resultado.criados} criados
              </span>
              {resultado.ignorados > 0 && (
                <span className="text-amber-600">{resultado.ignorados} ignorados</span>
              )}
              {resultado.erros > 0 && (
                <span className="flex items-center gap-1.5 text-red-600">
                  <AlertTriangle className="w-4 h-4" />
                  {resultado.erros} erros
                </span>
              )}
            </div>
          </div>

          {resultado.resultados.filter(r => r.status !== "ok").length > 0 && (
            <div className="divide-y divide-gray-50">
              {resultado.resultados.filter(r => r.status !== "ok").map((r) => (
                <div key={r.linha} className="px-5 py-3 flex items-start gap-3 text-sm">
                  <span className="text-xs text-gray-400 w-12 flex-shrink-0">Linha {r.linha}</span>
                  {r.status === "erro" ? (
                    <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    {r.nome && <span className="font-medium text-gray-700">{r.nome} — </span>}
                    <span className={r.status === "erro" ? "text-red-600" : "text-amber-600"}>{r.mensagem}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {resultado.criados === resultado.resultados.filter(r => r.status !== "ignorado" && r.status !== "erro").length && resultado.erros === 0 && (
            <div className="px-5 py-4 flex items-center gap-2 text-sm text-green-700">
              <CheckCircle className="w-4 h-4" />
              Importação concluída com sucesso! {resultado.criados} funcionário{resultado.criados !== 1 ? "s" : ""} importado{resultado.criados !== 1 ? "s" : ""}.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
