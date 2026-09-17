# PiscinaPro — Gestão & Vendas

CRM para empresas de piscinas: funil de leads, orçamentos com PDF e link para o cliente aceitar, clientes e
garantia, obras, contas a receber por parcela, comissões, relatórios e gestão de usuários.

- **Frontend:** HTML, CSS e JavaScript puro (scripts clássicos, sem build e sem framework).
- **Backend:** [Supabase](https://supabase.com) — Postgres com RLS e regras em gatilhos, Auth, Realtime, Storage e Edge Functions.
- **Offline-first:** a interface roda em memória, guarda cache no navegador e envia ao servidor só o que mudou.
- **PWA** instalável, tema claro/escuro. **Hospedagem:** site estático (Vercel).

Banco, funções e configuração do Supabase: [BACKEND.md](BACKEND.md) · Roteiro de teste com o servidor: [SMOKE_TEST.md](SMOKE_TEST.md).

## Como rodar

Requisitos: Node.js 20+ e um navegador moderno.

```bash
npm install
```

```bash
npm run serve
```

Abra `http://localhost:5177` (o servidor local aplica a mesma CSP do `vercel.json`). Não abra o `index.html` pelo arquivo.

Na tela de entrada: **Entrar** (conta criada pelo administrador) ou **Continuar offline** (só neste navegador; na
primeira vez com dados de demonstração, que nunca vão para o servidor).

## Estrutura

```
index.html · proposta.html      # app · página pública da proposta (cliente)
styles.css · proposta.css
sw.js · manifest.json · icon.svg · vercel.json · .vercelignore
vendor/                         # supabase-js, jsPDF, html2canvas (versões fixas, SHA-256 conferido)
js/
  pure.js · sync-diff.js        # regras sem DOM, testadas no Node
  proposta-html.js              # cálculo e documento da proposta (app e página pública)
  nucleo.js                     # domínio, estado, persistência, dados derivados, parcelas
  acoes.js                      # delegação de eventos (data-click, data-change…)
  telas/                        # painel, leads, clientes, obras, financeiro, relatorios, configuracoes, usuarios
  backup.js · orcamentos.js · ui.js
  supabase.js                   # login, leitura paginada, sincronização, Realtime, sino, anexos, links, PDF
  proposta-publica.js           # proposta.html
supabase/migrations/            # schema do banco
supabase/functions/             # admin-users, proposta, intake-lead, whatsapp-webhook, backup-diario, send-reminders
captacao/formulario-site.html   # exemplo de formulário para o site da empresa
tests/ · e2e/ · scripts/        # unitários, ponta a ponta (Playwright), servidor local e vendor
.github/workflows/ci.yml
```

## Funcionalidades

- **Funil e base de leads:** kanban com arrastar e soltar (mouse e toque), follow-up, histórico, importação/exportação CSV.
- **Orçamentos:** construtor com modelos, adicionais, desconto (limitado por usuário) e financiamento; número definido
  pelo banco (sem repetição); **PDF gerado no navegador e salvo no servidor**; **link para o cliente ver e aceitar**
  (registra nome, CPF/CNPJ, IP, horário e hash do conteúdo, aprova a proposta e marca a venda).
- **Clientes e obras:** vinculados pelo lead; obra começa em Vistoria sem equipe e só avança quando alguém registra.
- **Financeiro:** parcelas geradas da condição de pagamento (ao aprovar a proposta ou manualmente), vencimento e valor
  editáveis, **recebimento com data, valor e forma**, estorno, atraso real; comissão do vendedor.
- **Relatórios:** indicadores do navegador + **relatório do período calculado no banco** (conversão por origem e por
  vendedor, ciclo de venda, ticket, propostas).
- **Usuários (admin):** criar acesso com senha provisória, papel, vendedor vinculado, desconto máximo, permissão de
  aprovar, desativar, nova senha e excluir.
- **Captação:** formulário do site e WhatsApp (Cloud API) criam leads automaticamente.

## Como os dados fluem

- Toda gravação passa por `persist()`, que atualiza o cache e chama `Supa.onPersist()`.
- A sincronização compara as linhas com a referência da última leitura (hash por linha, `js/sync-diff.js`): envia só o
  que mudou e só apaga no servidor o que este aparelho já tinha lido. Envios em fila serial, com novas tentativas.
- **Edição simultânea:** leads e orçamentos têm versão; se outra pessoa gravou antes, a alteração é recusada, o app
  avisa e recarrega a versão mais recente.
- **Permissão negada pelo banco** (ex.: desconto acima do limite): a alteração local é desfeita com aviso.
- Leitura em páginas de 1.000 linhas (sem limite de volume). Mudanças de outros usuários chegam pelo Realtime.
- Alterações offline sobem no próximo login se o aparelho já sincronizou com a mesma conta. **Ao sair, os dados da
  conta são apagados do aparelho.**

## Qualidade

```bash
npm run check      # lint + testes unitários (inclui conferência de vendor/)
npm run test:e2e   # Playwright (localmente usa o Edge instalado)
npm run vendor     # atualiza vendor/ a partir de node_modules
```

O CI (`.github/workflows/ci.yml`) roda tudo a cada push e pull request.

## Deploy (Vercel)

1. Publique o repositório no GitHub e importe na Vercel (preset **Other**, sem build).
2. `vercel.json` define CSP e cabeçalhos; `.vercelignore` publica só o app.
3. No Supabase, cadastre a URL da Vercel em *Authentication → URL Configuration* ([BACKEND.md](BACKEND.md)).

## Segurança

- CSP `script-src 'self'`: nenhum script inline nem de CDN.
- RLS em todas as tabelas; `anon` não acessa nada. Regras de aprovação, desconto, versão e papel em gatilhos do banco.
- Página do cliente só pelo token do link (expira em 30 dias, pode ser revogado); o token vai no `#` da URL.
- Segredos (`service_role`, `cron_secret`, `intake_key`, VAPID, segredo do WhatsApp) ficam em `app_config`, fora da API.
