import Header from "@/components/layout/Header";
import BotaoPDF from "./BotaoPDF";

export default function ManualPage() {
  return (
    <>
      <Header title="Manual de Utilização" subtitle="DP Master Pro — Departamento Pessoal" />

      {/* Print styles */}
      <style>{`
        @media print {
          @page { size: A4; margin: 20mm 15mm; }
          body { font-size: 11pt; color: #000; }
          .page-break { page-break-before: always; }
          .no-break { page-break-inside: avoid; }
          a { color: #000; text-decoration: none; }
        }
      `}</style>

      <div className="flex-1 p-3 sm:p-6 print:p-0">
        {/* Toolbar — oculta ao imprimir */}
        <div className="flex items-center justify-between mb-6 print:hidden">
          <p className="text-sm text-gray-500">
            Versão 1.0 — Junho/2026 • Leiaute eSocial S-1.3
          </p>
          <BotaoPDF />
        </div>

        {/* ── MANUAL CONTENT ──────────────────────────────────────────────── */}
        <article className="max-w-4xl mx-auto bg-white rounded-xl border border-gray-200 print:border-0 print:rounded-none print:max-w-none print:mx-0">

          {/* CAPA */}
          <div className="px-12 py-16 text-center border-b border-gray-200 print:border-0 print:py-20">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-6">
              <span className="text-white text-2xl font-bold">DP</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">DP Master Pro</h1>
            <p className="text-lg text-blue-600 font-medium mb-6">Manual de Utilização do Sistema</p>
            <div className="inline-block bg-gray-50 border border-gray-200 rounded-lg px-6 py-3 text-sm text-gray-600">
              <p>Departamento Pessoal para Escritórios Contábeis</p>
              <p className="mt-1">Versão 1.0 • Leiaute eSocial S-1.3 • Junho/2026</p>
            </div>
          </div>

          <div className="px-10 py-8 space-y-10">

            {/* SUMÁRIO */}
            <section className="no-break">
              <h2 className="text-xl font-bold text-gray-900 border-b-2 border-blue-600 pb-2 mb-4">Sumário</h2>
              <div className="space-y-1 text-sm">
                {[
                  ["1", "Introdução ao Sistema"],
                  ["2", "Acesso e Login"],
                  ["3", "Dashboard — Visão Geral"],
                  ["4", "Gestão de Empresas"],
                  ["5", "Gestão de Funcionários"],
                  ["6", "Folha de Pagamento"],
                  ["7", "Férias"],
                  ["8", "Rescisão Contratual"],
                  ["9", "eSocial — Geração e Transmissão"],
                  ["10", "Guias de Pagamento"],
                  ["11", "Relatórios"],
                  ["12", "Configurações — Usuários e Permissões"],
                  ["13", "Suporte Técnico"],
                ].map(([num, titulo]) => (
                  <div key={num} className="flex items-center gap-2 py-1 border-b border-dotted border-gray-200">
                    <span className="text-blue-600 font-semibold w-6">{num}.</span>
                    <span className="flex-1 text-gray-700">{titulo}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* 1. INTRODUÇÃO */}
            <section className="page-break">
              <SectionTitle num="1" title="Introdução ao Sistema" />
              <p className="text-sm text-gray-700 leading-relaxed mb-4">
                O <strong>DP Master Pro</strong> é um sistema web completo de <strong>Departamento Pessoal (DP)</strong> desenvolvido para escritórios de contabilidade que gerenciam múltiplas empresas clientes. Centraliza em uma única plataforma todos os processos de RH e DP exigidos pela legislação trabalhista brasileira.
              </p>
              <InfoBox title="Principais recursos">
                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                  <li>Cadastro e gestão de empresas e funcionários</li>
                  <li>Processamento de folha de pagamento mensal, 13º salário e adiantamento</li>
                  <li>Controle de férias e geração de recibos</li>
                  <li>Cálculo de rescisão contratual</li>
                  <li>Geração e transmissão de eventos eSocial (leiaute S-1.3)</li>
                  <li>Emissão de guias GPS, DARF e FGTS Digital</li>
                  <li>Relatórios: holerite, RAIS, DIRF e Informe de Rendimentos</li>
                  <li>Controle de usuários com permissões por módulo</li>
                </ul>
              </InfoBox>
              <p className="text-sm text-gray-700 leading-relaxed mt-4">
                O sistema opera em ambiente <strong>multi-tenant</strong>: cada escritório tem seu próprio espaço isolado, com seus usuários, empresas e dados independentes dos demais escritórios.
              </p>
              <h3 className="font-semibold text-gray-800 mt-5 mb-2">Requisitos Mínimos</h3>
              <table className="w-full text-sm border-collapse">
                <tbody>
                  {[
                    ["Navegador", "Google Chrome 100+, Firefox 100+, Edge 100+ (mais recentes recomendados)"],
                    ["Conexão", "Internet banda larga (mínimo 5 Mbps)"],
                    ["Tela", "Resolução mínima de 1280 × 768 pixels"],
                    ["PDF", "Leitor de PDF para visualizar relatórios exportados"],
                  ].map(([req, val]) => (
                    <tr key={req} className="border-b border-gray-100">
                      <td className="py-2 pr-4 font-medium text-gray-700 w-32">{req}</td>
                      <td className="py-2 text-gray-600">{val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {/* 2. ACESSO */}
            <section className="page-break">
              <SectionTitle num="2" title="Acesso e Login" />
              <p className="text-sm text-gray-700 leading-relaxed mb-4">
                Acesse o sistema pelo endereço fornecido pelo seu administrador. A tela de login solicita <strong>e-mail</strong> e <strong>senha</strong>.
              </p>
              <Steps items={[
                { n: "1", t: "Acesse o endereço do sistema no navegador." },
                { n: "2", t: "Informe seu e-mail cadastrado e a senha." },
                { n: "3", t: "Clique em Entrar." },
                { n: "4", t: "Você será redirecionado automaticamente para o Dashboard." },
              ]} />
              <InfoBox title="Sessão e segurança" type="warn">
                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                  <li>A sessão expira após período de inatividade. Ao expirar, o sistema redireciona para a tela de login.</li>
                  <li>Nunca compartilhe sua senha. Cada usuário deve ter seu próprio acesso.</li>
                  <li>Em caso de esquecimento da senha, contacte o administrador do seu escritório para redefinição.</li>
                </ul>
              </InfoBox>
              <h3 className="font-semibold text-gray-800 mt-5 mb-2">Encerramento de Sessão</h3>
              <p className="text-sm text-gray-700">
                Para sair do sistema, clique no ícone de <strong>seta de saída</strong> no rodapé da barra lateral esquerda. Sempre encerre a sessão ao terminar o uso, especialmente em computadores compartilhados.
              </p>
            </section>

            {/* 3. DASHBOARD */}
            <section className="page-break">
              <SectionTitle num="3" title="Dashboard — Visão Geral" />
              <p className="text-sm text-gray-700 leading-relaxed mb-4">
                O Dashboard é a tela inicial apresentada após o login. Exibe um resumo executivo das principais informações do escritório em tempo real.
              </p>
              <h3 className="font-semibold text-gray-800 mb-2">Indicadores exibidos</h3>
              <table className="w-full text-sm border-collapse mb-4">
                <thead><tr className="bg-gray-50"><Th>Indicador</Th><Th>Descrição</Th></tr></thead>
                <tbody>
                  {[
                    ["Total de Empresas", "Número de empresas clientes ativas cadastradas"],
                    ["Total de Funcionários", "Soma de funcionários ativos em todas as empresas"],
                    ["Folhas do Mês", "Folhas de pagamento processadas no mês atual"],
                    ["Eventos eSocial Pendentes", "Eventos gerados aguardando transmissão ao governo"],
                    ["Alertas", "Férias a vencer, guias próximas do prazo, certificados vencendo"],
                  ].map(([ind, desc]) => (
                    <tr key={ind} className="border-b border-gray-100">
                      <td className="py-2 pr-4 font-medium text-gray-700 align-top">{ind}</td>
                      <td className="py-2 text-gray-600">{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <InfoBox title="Dica">
                <p className="text-sm text-gray-700">O Dashboard é atualizado automaticamente a cada carregamento da página. Para ver dados mais recentes, pressione <kbd className="bg-gray-100 border border-gray-300 rounded px-1 text-xs">F5</kbd> ou clique em recarregar no navegador.</p>
              </InfoBox>
            </section>

            {/* 4. EMPRESAS */}
            <section className="page-break">
              <SectionTitle num="4" title="Gestão de Empresas" />
              <p className="text-sm text-gray-700 leading-relaxed mb-4">
                O módulo de Empresas permite cadastrar e gerenciar todas as empresas clientes do escritório. Cada empresa tem dados fiscais, tributários, de contato e certificado digital próprios.
              </p>
              <h3 className="font-semibold text-gray-800 mb-2">Cadastrar Nova Empresa</h3>
              <Steps items={[
                { n: "1", t: "No menu lateral, clique em Empresas." },
                { n: "2", t: 'Clique no botão "Nova Empresa" (canto superior direito).' },
                { n: "3", t: "Preencha os dados obrigatórios: Razão Social, CNPJ e Regime Tributário." },
                { n: "4", t: "Informe opcionalmente: Nome Fantasia, Inscrição Estadual/Municipal, CNAE, responsável e endereço." },
                { n: "5", t: 'Clique em "Cadastrar Empresa" para salvar.' },
              ]} />
              <h3 className="font-semibold text-gray-800 mt-5 mb-2">Editar Empresa e Configurar Certificado Digital</h3>
              <Steps items={[
                { n: "1", t: 'Na lista de empresas, clique em "Editar" na linha da empresa desejada.' },
                { n: "2", t: 'Na aba "Dados da Empresa", altere os dados necessários e clique em "Salvar Alterações".' },
                { n: "3", t: 'Para configurar o certificado eSocial, acesse a aba "Certificado Digital / eSocial".' },
                { n: "4", t: "Clique na área de upload e selecione o arquivo .pfx ou .p12 do certificado A1." },
                { n: "5", t: "Informe a senha do certificado e clique em Salvar Alterações." },
              ]} />
              <InfoBox title="Certificado Digital" type="warn">
                <p className="text-sm text-gray-700">
                  O certificado A1 é obrigatório para transmissão real ao eSocial. Sem certificado, o sistema opera em <strong>Modo Demonstração</strong> — os eventos são gerados corretamente, mas a transmissão é simulada localmente com número de protocolo fictício.
                </p>
              </InfoBox>
              <h3 className="font-semibold text-gray-800 mt-5 mb-2">Regimes Tributários Suportados</h3>
              <table className="w-full text-sm border-collapse">
                <thead><tr className="bg-gray-50"><Th>Regime</Th><Th>Classificação eSocial</Th></tr></thead>
                <tbody>
                  {[
                    ["Simples Nacional", "Empresa tributada pelo Simples (classTrib 03)"],
                    ["MEI", "Microempreendedor Individual (classTrib 03)"],
                    ["Lucro Presumido", "Tributação pelo lucro presumido (classTrib 01)"],
                    ["Lucro Real", "Tributação pelo lucro real (classTrib 01)"],
                  ].map(([r, d]) => (
                    <tr key={r} className="border-b border-gray-100">
                      <td className="py-2 pr-4 font-medium text-gray-700">{r}</td>
                      <td className="py-2 text-gray-600">{d}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {/* 5. FUNCIONÁRIOS */}
            <section className="page-break">
              <SectionTitle num="5" title="Gestão de Funcionários" />
              <p className="text-sm text-gray-700 leading-relaxed mb-4">
                O módulo de Funcionários centraliza o cadastro completo de colaboradores vinculados a cada empresa.
              </p>
              <h3 className="font-semibold text-gray-800 mb-2">Cadastrar Funcionário</h3>
              <Steps items={[
                { n: "1", t: "No menu lateral, clique em Funcionários → Cadastro." },
                { n: "2", t: 'Clique em "Novo Funcionário".' },
                { n: "3", t: "Selecione a Empresa. O sistema sugere automaticamente a próxima matrícula disponível." },
                { n: "4", t: "Preencha os dados obrigatórios: Nome, CPF, Data de Nascimento, Sexo, Data de Admissão e Salário." },
                { n: "5", t: "Preencha opcionalmente: RG, CTPS, PIS/PASEP, endereço, contato e dados bancários." },
                { n: "6", t: 'Clique em "Cadastrar Funcionário".' },
              ]} />
              <InfoBox title="Matrícula Única">
                <p className="text-sm text-gray-700">
                  A matrícula é gerada automaticamente em sequência por empresa (00001, 00002...) e não pode ser duplicada. O campo é editável caso seja necessário usar uma numeração diferente.
                </p>
              </InfoBox>
              <h3 className="font-semibold text-gray-800 mt-5 mb-2">Cargos e Setores</h3>
              <p className="text-sm text-gray-700 mb-3">
                Cargos e Setores são cadastrados por empresa e vinculados aos funcionários. Acesse pelo menu <strong>Funcionários → Cargos</strong> ou <strong>Funcionários → Setores</strong>.
              </p>
              <h3 className="font-semibold text-gray-800 mt-4 mb-2">Categorias eSocial Suportadas</h3>
              <table className="w-full text-sm border-collapse">
                <thead><tr className="bg-gray-50"><Th>Código</Th><Th>Categoria</Th></tr></thead>
                <tbody>
                  {[
                    ["101", "Empregado Geral (CLT)"],
                    ["102", "Empregado Doméstico"],
                    ["103", "Trabalhador Avulso"],
                    ["105", "Aprendiz"],
                    ["106", "Estagiário"],
                    ["111", "Contribuinte Individual / Autônomo"],
                    ["301", "Servidor Público Efetivo"],
                    ["901", "Estagiário (Lei 11.788/08)"],
                  ].map(([cod, cat]) => (
                    <tr key={cod} className="border-b border-gray-100">
                      <td className="py-2 pr-4 font-mono font-semibold text-blue-700">{cod}</td>
                      <td className="py-2 text-gray-700">{cat}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {/* 6. FOLHA */}
            <section className="page-break">
              <SectionTitle num="6" title="Folha de Pagamento" />
              <p className="text-sm text-gray-700 leading-relaxed mb-4">
                O módulo de Folha de Pagamento permite processar a folha mensal de cada empresa, aplicando automaticamente os cálculos de INSS, IRRF, FGTS e demais descontos e proventos conforme a legislação vigente.
              </p>
              <h3 className="font-semibold text-gray-800 mb-2">Processar Folha Mensal</h3>
              <Steps items={[
                { n: "1", t: "Acesse Folha de Pagamento → Processar Folha." },
                { n: "2", t: "Selecione a Empresa e informe a Competência (mês/ano)." },
                { n: "3", t: 'Clique em "Processar Folha". O sistema calculará os valores para todos os funcionários ativos.' },
                { n: "4", t: "Revise os valores calculados. É possível adicionar rubricas extras (horas extras, faltas, benefícios)." },
                { n: "5", t: 'Clique em "Fechar Folha" para finalizar. Após o fechamento, os eventos S-1200 são gerados para o eSocial.' },
              ]} />
              <InfoBox title="Tabelas atualizadas automaticamente">
                <p className="text-sm text-gray-700">As tabelas de INSS, IRRF e salário mínimo são atualizadas conforme a legislação. Consulte o módulo <strong>Tabelas Legais</strong> para verificar os valores vigentes.</p>
              </InfoBox>
              <h3 className="font-semibold text-gray-800 mt-5 mb-2">13º Salário</h3>
              <p className="text-sm text-gray-700 mb-2">Disponível em <strong>Folha → 13º Salário</strong>. Permite calcular e registrar a 1ª e 2ª parcelas do décimo terceiro para todos os funcionários de uma empresa.</p>
              <h3 className="font-semibold text-gray-800 mt-4 mb-2">Adiantamento de Salário</h3>
              <p className="text-sm text-gray-700">Disponível em <strong>Folha → Adiantamento</strong>. Registra o pagamento de adiantamento quinzenal, que será descontado automaticamente na folha do mês.</p>
            </section>

            {/* 7. FÉRIAS */}
            <section className="page-break">
              <SectionTitle num="7" title="Férias" />
              <p className="text-sm text-gray-700 leading-relaxed mb-4">
                O módulo de Férias controla o período aquisitivo, programa concessões e gera o recibo de férias conforme a CLT e a Reforma Trabalhista.
              </p>
              <Steps items={[
                { n: "1", t: "Acesse Férias no menu lateral." },
                { n: "2", t: "Selecione a empresa e o funcionário." },
                { n: "3", t: "Informe o período de gozo e se haverá abono pecuniário (venda de até 10 dias)." },
                { n: "4", t: 'Clique em "Calcular". O sistema aplica o 1/3 constitucional e demais verbas.' },
                { n: "5", t: 'Confirme e clique em "Registrar Férias" para salvar e gerar o recibo.' },
              ]} />
              <InfoBox title="Alertas de vencimento" type="warn">
                <p className="text-sm text-gray-700">O sistema alerta no Dashboard quando funcionários estão com período aquisitivo a vencer nos próximos 30 dias.</p>
              </InfoBox>
            </section>

            {/* 8. RESCISÃO */}
            <section className="page-break">
              <SectionTitle num="8" title="Rescisão Contratual" />
              <p className="text-sm text-gray-700 leading-relaxed mb-4">
                O módulo de Rescisão calcula todas as verbas rescisórias conforme o tipo de demissão, incluindo saldo de salário, aviso prévio, FGTS + multa, férias proporcionais e 13º proporcional.
              </p>
              <Steps items={[
                { n: "1", t: "Acesse Rescisão no menu lateral." },
                { n: "2", t: "Selecione a empresa e o funcionário a ser desligado." },
                { n: "3", t: "Informe a data de demissão e o motivo (dispensa sem justa causa, pedido de demissão, justa causa, acordo, etc.)." },
                { n: "4", t: "O sistema calcula automaticamente todas as verbas conforme a CLT." },
                { n: "5", t: 'Revise os valores e clique em "Registrar Rescisão". O evento S-2299 é gerado para o eSocial.' },
              ]} />
              <table className="w-full text-sm border-collapse mt-4">
                <thead><tr className="bg-gray-50"><Th>Motivo</Th><Th>Principais Verbas</Th></tr></thead>
                <tbody>
                  {[
                    ["Sem Justa Causa", "Saldo, AP trabalhado, férias + 1/3, 13º prop., FGTS + 40%"],
                    ["Pedido de Demissão", "Saldo, férias + 1/3, 13º prop. (sem FGTS multado)"],
                    ["Justa Causa", "Apenas saldo de salário e férias vencidas + 1/3"],
                    ["Acordo (§484-A)", "Metade do AP, metade da multa FGTS + 80% do saldo FGTS"],
                  ].map(([mot, verb]) => (
                    <tr key={mot} className="border-b border-gray-100">
                      <td className="py-2 pr-4 font-medium text-gray-700 align-top">{mot}</td>
                      <td className="py-2 text-gray-600">{verb}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {/* 9. ESOCIAL */}
            <section className="page-break">
              <SectionTitle num="9" title="eSocial — Geração e Transmissão" />
              <p className="text-sm text-gray-700 leading-relaxed mb-4">
                O módulo eSocial gerencia a geração de eventos XML e a transmissão ao gateway do governo federal, conforme o leiaute <strong>S-1.3</strong>.
              </p>
              <h3 className="font-semibold text-gray-800 mb-2">Eventos Suportados</h3>
              <table className="w-full text-sm border-collapse mb-5">
                <thead><tr className="bg-gray-50"><Th>Evento</Th><Th>Descrição</Th><Th>Gerado quando</Th></tr></thead>
                <tbody>
                  {[
                    ["S-1000", "Cadastro do Empregador", "Manual, pelo botão Gerar Evento"],
                    ["S-1010", "Tabela de Rubricas", "Manual, após configurar rubricas"],
                    ["S-1200", "Remuneração do Trabalhador", "Automático ao fechar folha"],
                    ["S-1299", "Fechamento do Período", "Automático ao fechar folha"],
                    ["S-2200", "Admissão do Trabalhador", "Automático ao cadastrar funcionário"],
                    ["S-2299", "Desligamento do Trabalhador", "Automático ao registrar rescisão"],
                  ].map(([ev, desc, quando]) => (
                    <tr key={ev} className="border-b border-gray-100">
                      <td className="py-2 pr-3 font-mono font-bold text-blue-700">{ev}</td>
                      <td className="py-2 pr-3 text-gray-700">{desc}</td>
                      <td className="py-2 text-gray-500 text-xs">{quando}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <h3 className="font-semibold text-gray-800 mb-2">Ordem Obrigatória de Envio</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 mb-5">
                <p><strong>S-1000</strong> (empregador) → <strong>S-1010</strong> (rubricas) → <strong>S-2200</strong> (admissão) → <strong>S-1200</strong> (remuneração) → <strong>S-1299</strong> (fechamento)</p>
                <p className="mt-1 text-xs text-blue-600">O governo rejeita eventos enviados fora de ordem. O sistema sinaliza a sequência correta na tela eSocial.</p>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Transmitir Eventos</h3>
              <Steps items={[
                { n: "1", t: "Acesse eSocial no menu lateral." },
                { n: "2", t: "Verifique os eventos com status Pendente." },
                { n: "3", t: "Selecione a empresa (se houver mais de uma) e clique em Enviar Pendentes." },
                { n: "4", t: "O sistema assina os XMLs com o certificado digital e transmite ao gateway." },
                { n: "5", t: "Ao concluir, o status muda para Enviado e o número de protocolo é exibido." },
              ]} />
              <InfoBox title="Modo Demonstração" type="warn">
                <p className="text-sm text-gray-700">
                  Quando nenhum certificado A1 está configurado, o sistema opera em <strong>Modo Demonstração</strong>: os XMLs são gerados corretamente, mas a transmissão é simulada — um protocolo fictício é gerado localmente. Ideal para treinamentos e demonstrações ao cliente. Configure o certificado na tela de edição da empresa para ativar a transmissão real.
                </p>
              </InfoBox>
            </section>

            {/* 10. GUIAS */}
            <section className="page-break">
              <SectionTitle num="10" title="Guias de Pagamento" />
              <p className="text-sm text-gray-700 leading-relaxed mb-4">
                O módulo de Guias de Pagamento gera as obrigações fiscais derivadas da folha: GPS (INSS), DARF (IRRF), FGTS Digital e DCTFWeb.
              </p>
              <table className="w-full text-sm border-collapse">
                <thead><tr className="bg-gray-50"><Th>Guia</Th><Th>Tributo</Th><Th>Vencimento</Th></tr></thead>
                <tbody>
                  {[
                    ["GPS", "INSS Empregado + Patronal + RAT + Terceiros", "Dia 20 do mês seguinte"],
                    ["DARF", "IRRF sobre salários e pró-labore", "Dia 20 do mês seguinte"],
                    ["FGTS Digital", "FGTS 8% sobre remuneração", "Dia 7 do mês seguinte"],
                    ["DCTFWeb", "Declaração consolidada das contribuições", "Dia 15 do mês seguinte"],
                  ].map(([g, t, v]) => (
                    <tr key={g} className="border-b border-gray-100">
                      <td className="py-2 pr-4 font-bold text-gray-700">{g}</td>
                      <td className="py-2 pr-4 text-gray-600">{t}</td>
                      <td className="py-2 text-gray-500 text-xs">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <InfoBox title="Atenção aos prazos" type="warn" className="mt-4">
                <p className="text-sm text-gray-700">As guias com vencimento próximo são sinalizadas com alerta no Dashboard. Sempre verifique o calendário de obrigações após processar a folha.</p>
              </InfoBox>
            </section>

            {/* 11. RELATÓRIOS */}
            <section className="page-break">
              <SectionTitle num="11" title="Relatórios" />
              <p className="text-sm text-gray-700 leading-relaxed mb-4">
                O módulo de Relatórios oferece os principais documentos trabalhistas e declarações exigidas pela legislação.
              </p>
              <table className="w-full text-sm border-collapse">
                <thead><tr className="bg-gray-50"><Th>Relatório</Th><Th>Descrição</Th></tr></thead>
                <tbody>
                  {[
                    ["Holerite", "Comprovante individual de pagamento. Pode ser enviado por e-mail ou impresso."],
                    ["Resumo da Folha", "Totais de proventos, descontos e líquido por empresa, por competência."],
                    ["RAIS", "Relação Anual de Informações Sociais — gerada para entrega ao MTE."],
                    ["DIRF", "Declaração de Imposto Retido na Fonte — gerada para entrega à Receita Federal."],
                    ["Informe de Rendimentos", "Documento entregue aos funcionários para declaração do IRPF."],
                  ].map(([r, d]) => (
                    <tr key={r} className="border-b border-gray-100">
                      <td className="py-2 pr-4 font-medium text-gray-700 align-top w-44">{r}</td>
                      <td className="py-2 text-gray-600">{d}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-sm text-gray-600 mt-4">Todos os relatórios podem ser exportados em PDF. Na tela do relatório, clique no botão <strong>Exportar PDF</strong> ou use a impressão do navegador.</p>
            </section>

            {/* 12. CONFIGURAÇÕES */}
            <section className="page-break">
              <SectionTitle num="12" title="Configurações — Usuários e Permissões" />
              <p className="text-sm text-gray-700 leading-relaxed mb-4">
                O módulo de Configurações é acessível <strong>somente por Administradores</strong>. Permite gerenciar os usuários do escritório e suas permissões de acesso.
              </p>
              <h3 className="font-semibold text-gray-800 mb-2">Tipos de Acesso</h3>
              <table className="w-full text-sm border-collapse mb-5">
                <thead><tr className="bg-gray-50"><Th>Tipo</Th><Th>Permissões</Th></tr></thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 pr-4 font-semibold text-purple-700 align-top">Administrador</td>
                    <td className="py-2 text-gray-600">Acesso total ao sistema, incluindo criação e gestão de usuários, configurações e todos os módulos. Não pode ser restringido por permissões.</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 pr-4 font-semibold text-blue-700 align-top">Usuário</td>
                    <td className="py-2 text-gray-600">Acesso limitado aos módulos explicitamente autorizados pelo administrador. Não visualiza Configurações nem Usuários.</td>
                  </tr>
                </tbody>
              </table>
              <h3 className="font-semibold text-gray-800 mb-2">Cadastrar Usuário</h3>
              <Steps items={[
                { n: "1", t: "Acesse Configurações → Usuários e Perfis." },
                { n: "2", t: 'Clique em "Novo Usuário".' },
                { n: "3", t: "Informe Nome, E-mail e Senha (mínimo 8 caracteres)." },
                { n: "4", t: "Selecione o Tipo de Acesso: Administrador ou Usuário." },
                { n: "5", t: "Para Usuário, selecione os módulos que ele poderá acessar nos checkboxes de permissão." },
                { n: "6", t: 'Clique em "Criar Usuário".' },
              ]} />
              <h3 className="font-semibold text-gray-800 mt-5 mb-2">Módulos com Controle de Permissão</h3>
              <div className="grid grid-cols-3 gap-1 text-xs">
                {["Dashboard","Empresas","Funcionários","Folha de Pagamento","Férias","Rescisão","Rubricas","Tabelas Legais","eSocial","Guias de Pagamento","Relatórios","LGPD","Importação"].map((m) => (
                  <div key={m} className="bg-gray-50 border border-gray-200 rounded px-2 py-1 text-gray-700">{m}</div>
                ))}
              </div>
              <InfoBox title="Atualização de permissões" type="warn" className="mt-4">
                <p className="text-sm text-gray-700">As permissões são carregadas no momento do login. Após alterar permissões de um usuário, este deve fazer logout e login novamente para que as mudanças tenham efeito.</p>
              </InfoBox>
            </section>

            {/* 13. SUPORTE */}
            <section className="page-break">
              <SectionTitle num="13" title="Suporte Técnico" />
              <p className="text-sm text-gray-700 leading-relaxed mb-4">
                Em caso de dúvidas, falhas ou solicitações de suporte ao sistema DP Master Pro, entre em contato pelos canais abaixo:
              </p>
              <table className="w-full text-sm border-collapse">
                <tbody>
                  {[
                    ["E-mail", "sm.servicosetecnologia@gmail.com"],
                    ["Assunto", "DP Master Pro — [descreva o problema brevemente]"],
                    ["Horário", "Segunda a Sexta, 08h às 18h (horário de Brasília)"],
                    ["Sistema", "dpmasterpro.primetitec.com.br"],
                  ].map(([k, v]) => (
                    <tr key={k} className="border-b border-gray-100">
                      <td className="py-2 pr-4 font-medium text-gray-700 w-28">{k}</td>
                      <td className="py-2 text-gray-600">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <InfoBox title="Ao entrar em contato, informe sempre:" className="mt-4">
                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                  <li>Nome do escritório e e-mail de acesso</li>
                  <li>Descrição detalhada do problema ou da dúvida</li>
                  <li>Capturas de tela (se possível) da tela onde ocorreu o problema</li>
                  <li>Horário aproximado em que o problema ocorreu</li>
                </ul>
              </InfoBox>

              {/* Rodapé do manual */}
              <div className="mt-12 pt-6 border-t border-gray-200 text-center text-xs text-gray-400">
                <p className="font-semibold text-gray-500">DP Master Pro — Manual de Utilização</p>
                <p>Versão 1.0 • Junho/2026 • Leiaute eSocial S-1.3</p>
                <p className="mt-1">Documento gerado pelo sistema. As informações são válidas para a versão indicada.</p>
              </div>
            </section>

          </div>
        </article>
      </div>
    </>
  );
}

/* ── Componentes auxiliares ──────────────────────────────────────────────── */

function SectionTitle({ num, title }: { num: string; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="w-8 h-8 rounded-lg bg-blue-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0 print:rounded">
        {num}
      </span>
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
    </div>
  );
}

function InfoBox({
  title,
  children,
  type = "info",
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  type?: "info" | "warn";
  className?: string;
}) {
  const colors = type === "warn"
    ? "bg-amber-50 border-amber-200"
    : "bg-blue-50 border-blue-200";
  const titleColor = type === "warn" ? "text-amber-800" : "text-blue-800";
  return (
    <div className={`rounded-lg border p-4 ${colors} ${className}`}>
      <p className={`text-xs font-semibold uppercase tracking-wide mb-1.5 ${titleColor}`}>{title}</p>
      {children}
    </div>
  );
}

function Steps({ items }: { items: { n: string; t: string }[] }) {
  return (
    <ol className="space-y-2 mb-4">
      {items.map((item) => (
        <li key={item.n} className="flex items-start gap-3 text-sm">
          <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
            {item.n}
          </span>
          <span className="text-gray-700">{item.t}</span>
        </li>
      ))}
    </ol>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wide border-b border-gray-200">
      {children}
    </th>
  );
}
