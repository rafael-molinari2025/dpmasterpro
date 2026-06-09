"use client";

import { MODULOS, GRUPOS_LABEL, type ModuloKey } from "@/lib/permissoes";

interface Props {
  selecionadas: string[];
  onChange: (perms: string[]) => void;
  disabled?: boolean;
}

export default function PermissoesSelector({ selecionadas, onChange, disabled }: Props) {
  function toggle(key: string) {
    if (disabled) return;
    const existe = selecionadas.includes(key);
    onChange(existe ? selecionadas.filter((k) => k !== key) : [...selecionadas, key]);
  }

  function toggleGrupo(grupo: string) {
    if (disabled) return;
    const modulosGrupo = MODULOS.filter((m) => m.grupo === grupo).map((m) => m.key);
    const todosMarcados = modulosGrupo.every((k) => selecionadas.includes(k));
    if (todosMarcados) {
      onChange(selecionadas.filter((k) => !modulosGrupo.includes(k as ModuloKey)));
    } else {
      const novos = [...selecionadas];
      for (const k of modulosGrupo) {
        if (!novos.includes(k)) novos.push(k);
      }
      onChange(novos);
    }
  }

  function marcarTodos() {
    if (disabled) return;
    onChange(MODULOS.map((m) => m.key as string));
  }

  function desmarcarTodos() {
    if (disabled) return;
    onChange([]);
  }

  const grupos = [...new Set(MODULOS.map((m) => m.grupo))];

  return (
    <div className="space-y-4">
      {/* Ações rápidas */}
      {!disabled && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={marcarTodos}
            className="text-xs text-blue-600 hover:underline"
          >
            Marcar todos
          </button>
          <span className="text-gray-300">|</span>
          <button
            type="button"
            onClick={desmarcarTodos}
            className="text-xs text-gray-500 hover:underline"
          >
            Desmarcar todos
          </button>
          <span className="text-xs text-gray-400 ml-auto">
            {selecionadas.length} de {MODULOS.length} módulos
          </span>
        </div>
      )}

      {/* Grupos */}
      <div className="space-y-3">
        {grupos.map((grupo) => {
          const modulosGrupo = MODULOS.filter((m) => m.grupo === grupo);
          const qtdMarcados = modulosGrupo.filter((m) => selecionadas.includes(m.key)).length;
          const todosMarcados = qtdMarcados === modulosGrupo.length;
          const algumMarcado = qtdMarcados > 0 && !todosMarcados;

          return (
            <div key={grupo} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Cabeçalho do grupo */}
              <div
                className={`flex items-center gap-3 px-4 py-2.5 bg-gray-50 border-b border-gray-200 ${!disabled ? "cursor-pointer hover:bg-gray-100" : ""}`}
                onClick={() => !disabled && toggleGrupo(grupo)}
              >
                <input
                  type="checkbox"
                  checked={todosMarcados}
                  ref={(el) => { if (el) el.indeterminate = algumMarcado; }}
                  onChange={() => toggleGrupo(grupo)}
                  disabled={disabled}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600"
                  onClick={(e) => e.stopPropagation()}
                />
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex-1">
                  {GRUPOS_LABEL[grupo]}
                </span>
                <span className="text-xs text-gray-400">{qtdMarcados}/{modulosGrupo.length}</span>
              </div>

              {/* Módulos */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-0 divide-x divide-y divide-gray-100">
                {modulosGrupo.map((modulo) => {
                  const marcado = selecionadas.includes(modulo.key);
                  return (
                    <label
                      key={modulo.key}
                      className={`flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                        disabled
                          ? "cursor-default"
                          : "cursor-pointer hover:bg-blue-50"
                      } ${marcado ? "bg-blue-50/50" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={marcado}
                        onChange={() => toggle(modulo.key)}
                        disabled={disabled}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 flex-shrink-0"
                      />
                      <span className={`text-sm ${marcado ? "text-blue-800 font-medium" : "text-gray-700"}`}>
                        {modulo.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
