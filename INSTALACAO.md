# SYS-DP — Guia de Instalação e Configuração

## Pré-requisitos

- Node.js 20+ (LTS)
- PostgreSQL 15+
- Redis 7+ (para filas eSocial)
- npm 10+

## 1. Instalar Dependências

> **Windows:** Primeiro **desative temporariamente o Antivírus / Windows Defender** (ou exclua a pasta do projeto do monitoramento em tempo real) para evitar o bloqueio de arquivos durante a instalação.

```bash
# Método preferencial — pnpm (mais confiável no Windows):
npm install -g pnpm
pnpm install

# Se pnpm falhar, tente com npm:
npm install
```

## 2. Configurar Variáveis de Ambiente

```bash
cp .env.example .env
```

Edite o `.env` com suas configurações:

```env
DATABASE_URL="postgresql://postgres:senha@localhost:5432/sys_dp"
NEXTAUTH_SECRET="gere-com: openssl rand -base64 32"
ESOCIAL_AMBIENTE="2"  # 2=Homologação, 1=Produção
```

## 3. Criar Banco de Dados

```bash
# Criar o schema no PostgreSQL
npm run db:push

# Populate dados iniciais (tabelas INSS, IRRF, rubricas padrão)
npm run db:seed
```

## 4. Iniciar o Sistema

```bash
# Desenvolvimento
npm run dev

# Produção
npm run build && npm run start
```

## 5. Acesso Inicial

Após o seed, acesse:

- **URL:** http://localhost:3000
- **Login:** admin@escritorioexemplo.com.br
- **Senha:** Admin@2026

> **Importante:** Troque a senha no primeiro acesso!

---

## Arquitetura do Sistema

```
sys-dp/
├── prisma/
│   ├── schema.prisma      # Esquema completo do banco
│   └── seed.ts            # Dados iniciais (tabelas legais, rubricas)
├── src/
│   ├── app/
│   │   ├── (auth)/        # Login/Registro
│   │   ├── (dashboard)/   # Módulos do sistema
│   │   │   ├── dashboard/
│   │   │   ├── empresas/
│   │   │   ├── funcionarios/
│   │   │   ├── folha/
│   │   │   ├── ferias/
│   │   │   ├── rescisao/
│   │   │   ├── rubricas/
│   │   │   ├── tabelas/
│   │   │   ├── esocial/
│   │   │   ├── guias/
│   │   │   ├── relatorios/
│   │   │   ├── lgpd/
│   │   │   └── importacao/
│   │   └── api/           # API Routes (REST)
│   ├── lib/
│   │   ├── db.ts          # Prisma client
│   │   ├── auth.ts        # NextAuth.js v5
│   │   ├── calculos.ts    # Motor CLT (INSS, IRRF, FGTS, Férias, Rescisão)
│   │   ├── esocial.ts     # Gerador XML eSocial S-1.3
│   │   └── utils.ts       # Utilitários
│   ├── services/
│   │   ├── folhaService.ts     # Orquestrador de folha
│   │   └── rescisaoService.ts  # Cálculo de rescisão TRCT
│   └── components/
│       └── layout/        # Sidebar, Header
```

## Módulos Disponíveis

| Módulo | Status | Descrição |
|--------|--------|-----------|
| Empresas | ✅ | Multi-empresa, CNPJ, regime tributário |
| Funcionários | ✅ | CLT completo, dependentes, histórico |
| Folha de Pagamento | ✅ | Cálculo automático INSS/IRRF/FGTS |
| Férias | ✅ | Controle aquisitivo, alerta de vencimento |
| Rescisão (TRCT) | ✅ | Todos os tipos CLT |
| Rubricas | ✅ | Vinculação Tabela 03 eSocial |
| Tabelas Legais | ✅ | INSS/IRRF 2026 (Lei 15.270/2025) |
| eSocial S-1.3 | ✅ | S-1010, S-1200, S-2200, S-2299, S-1299 |
| GPS/DARF | ✅ | Geração automática após fechamento |
| FGTS Digital | ✅ | PIX Copia e Cola |
| DCTFWeb | ✅ | Geração consolidada |
| LGPD | ✅ | Consentimentos, portabilidade, prazo retenção |
| Importação | ✅ | Excel/CSV/XML eSocial/SEFIP |
| Relatórios | ✅ | Holerite, RAIS, DIRF, Informe |

## Legislação Implementada

- **CLT** — Arts. 129-145 (Férias), 467-501 (Rescisão)
- **Previdência** — Portaria MPS/MF nº 13/2026 (INSS progressivo)
- **IRRF** — Lei nº 15.270/2025 (isenção R$5k, redutor gradual até R$7.350)
- **FGTS** — Lei nº 8.036/90 + FGTS Digital (PIX exclusivo 2026)
- **eSocial** — Versão S-1.3 (Nota Técnica 06/2026)
- **LGPD** — Lei nº 13.709/2018
- **DCTFWeb** — Instrução Normativa RFB nº 2.005/2021
