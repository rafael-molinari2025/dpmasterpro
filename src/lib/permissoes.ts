// Módulos do sistema e suas permissões granulares
export const MODULOS = [
  { key: "dashboard",    label: "Dashboard",          grupo: "geral" },
  { key: "empresas",     label: "Empresas",           grupo: "cadastros" },
  { key: "funcionarios", label: "Funcionários",       grupo: "cadastros" },
  { key: "folha",        label: "Folha de Pagamento", grupo: "folha" },
  { key: "ferias",       label: "Férias",             grupo: "folha" },
  { key: "rescisao",     label: "Rescisão",           grupo: "folha" },
  { key: "rubricas",     label: "Rubricas",           grupo: "tabelas" },
  { key: "tabelas",      label: "Tabelas Legais",     grupo: "tabelas" },
  { key: "esocial",      label: "eSocial",            grupo: "obrigacoes" },
  { key: "guias",        label: "Guias de Pagamento", grupo: "obrigacoes" },
  { key: "relatorios",   label: "Relatórios",         grupo: "relatorios" },
  { key: "lgpd",         label: "LGPD",               grupo: "outros" },
  { key: "importacao",   label: "Importação",         grupo: "outros" },
] as const;

export type ModuloKey = typeof MODULOS[number]["key"];

export const GRUPOS_LABEL: Record<string, string> = {
  geral:       "Geral",
  cadastros:   "Cadastros",
  folha:       "Folha e RH",
  tabelas:     "Tabelas",
  obrigacoes:  "Obrigações Fiscais",
  relatorios:  "Relatórios",
  outros:      "Outros",
};

// Todos os módulos habilitados por padrão para novos usuários
export const PERMISSOES_PADRAO: ModuloKey[] = [
  "dashboard",
  "empresas",
  "funcionarios",
  "folha",
  "ferias",
  "rescisao",
];

export function hasPermissao(
  perfil: string,
  permissoes: string[],
  modulo: ModuloKey
): boolean {
  if (perfil === "ADMIN") return true;
  return permissoes.includes(modulo);
}

export function getPermissoes(usuario: { perfil: string; permissoes: unknown }): string[] {
  if (usuario.perfil === "ADMIN") return MODULOS.map((m) => m.key);
  if (!Array.isArray(usuario.permissoes)) return [];
  return usuario.permissoes as string[];
}
