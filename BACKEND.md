# PiscinaPro — Backend (Supabase)

Backend relacional em PostgreSQL (Supabase), criado do zero espelhando o domínio do app.

## Conexão

| | |
|---|---|
| **Projeto** | `piscinapro` |
| **Ref / ID** | `tczczahhibqnojlptpyx` |
| **URL da API** | `https://tczczahhibqnojlptpyx.supabase.co` |
| **Publishable key** | `sb_publishable_DBY4Ce1GPxTi5BwiGcSiGQ_5w3cZRs0` |
| **Região** | `ca-central-1` (Postgres 17) |

> A `service_role` key (segredo, ignora RLS) **não** fica aqui — pegue no painel do Supabase (Settings → API) e nunca a exponha no frontend.

## Segurança (RLS)

- **RLS habilitado em todas as 11 tabelas.**
- Política única por tabela: **acesso total para usuários `authenticated`**. O papel `anon` **não** tem acesso.
- Ou seja: só a publishable/anon key **não** lê nem escreve nada até haver uma **sessão de login (Supabase Auth)**. Isso é proposital (ferramenta interna).
- Para usar no app é preciso autenticar (email/senha, magic link ou `signInAnonymously()`).
- Pendência de config (não é do schema): **Leaked Password Protection** está desativada no Auth — dá pra ligar em Authentication → Policies. [Doc](https://supabase.com/docs/guides/auth/password-security)

## Schema

**Enums:** `lead_origem`, `lead_etapa`, `lead_temp`, `orcamento_status`, `pagamento_tipo`, `obra_etapa`.

**Tabelas (11):**

| Tabela | Papel |
|---|---|
| `vendedores` | consultores comerciais + `meta` mensal |
| `equipes` | equipes de obra/instalação |
| `modelos` | catálogo de piscinas (specs + preço base) |
| `adicionais` | opcionais da proposta (valor, unidade, qtd padrão) |
| `leads` | funil de vendas (FK → modelos, vendedores) |
| `lead_interacoes` | timeline/histórico do lead (FK → leads, cascade) |
| `orcamentos` | propostas (FK → leads, modelos, vendedores) |
| `orcamento_itens` | adicionais de cada proposta (snapshot de valor) |
| `obras` | pós-venda/instalação (1:1 com lead ganho) |
| `obra_notas` | notas de execução da obra |
| `financeiro` | recebíveis, parcelas, comissões (1:1 com lead ganho) |
| `perfis` | 1:1 com `auth.users` → vendedor + papel (identidade/atribuição) |
| `tarefas` | follow-ups/lembretes (opcionalmente ligados a um lead) |

**Views (respeitam RLS via `security_invoker`):**
- `vw_metas_vendedor` — realizado × meta, pipeline e leads ativos por vendedor.
- `vw_funil_resumo` — contagem e valor por etapa do funil.

**Extras:** `updated_at` automático via trigger `set_updated_at()`, índices em todas as FKs e filtros comuns (etapa, status, temperatura), constraints de integridade (checks de faixa, `not null`, `unique`).

## Seed (dados de demonstração)

4 vendedores · 4 equipes · 6 modelos · 12 adicionais · 14 leads · 32 interações · 3 orçamentos (7 itens) · 2 obras (2 notas) · 2 contratos financeiros.

## Migrations aplicadas

1. `01_schema_piscinapro` — enums, tabelas, triggers, índices
2. `02_rls_policies` — RLS + políticas `authenticated`
3. `03_reporting_views` — views de relatório
4. `04_drop_legacy_erp_keep_piscinapro` — remoção do ERP legado (ver nota abaixo)

## Nota importante (ERP legado removido)

Este projeto continha um **ERP/CRM de terceiros com dados reais** (51 tabelas: customers, orders, products, invoices, receivables, suppliers, warehouses, profiles…). A pedido explícito e confirmado do usuário, **todo esse ERP foi apagado** para o projeto ficar somente com o PiscinaPro. **Essa ação foi irreversível.**

## Integração com o app (FEITO — `supabase.js`)

O frontend **já está conectado** ao Supabase pela camada [`supabase.js`](supabase.js), carregada
depois de `app.js`/`orcamentos.js`. Arquitetura (sem build, sem framework):

- **Cache offline:** o app continua 100% síncrono em memória e usa o `localStorage` como
  cache/fallback. Toda a UX é instantânea; o Supabase é a fonte da verdade.
- **Portão de login:** como o RLS só libera `authenticated`, ao abrir o app aparece uma tela de
  login (Supabase Auth, email/senha). Há um "Continuar offline" que usa só o cache local.
  A sessão é persistida (sobrevive a reload) — nas próximas vezes entra direto.
- **Hidratação (banco → memória):** após logar, o app puxa as 11 tabelas, converte para o formato
  nativo do app (leads desnormalizados, orçamentos, obras/financeiro por cliente, config) e reusa
  os loaders existentes. Os nomes de modelo/vendedor/equipe são resolvidos a partir dos UUIDs.
- **Write-through (memória → banco):** toda escrita passa pelo único ponto `persist(key, value)`
  do `app.js`; `supabase.js` intercepta esse seam (`window.Supa.onPersist`) e reconcilia a tabela
  correspondente (upsert + remoção do que sumiu), com debounce. Os ids gerados no app agora são
  UUID v4 (`uid()`), alinhando com as PKs do Postgres.
- **Indicador de status:** um "pill" no canto inferior direito mostra Online / Sincronizando /
  Offline / Erro.

**Config no topo de `supabase.js`:** `url`, `key` (publishable) e a CDN da lib. A `service_role`
**nunca** entra no frontend.

Rodar localmente (precisa de um servidor HTTP por causa do `import()` de módulo — não abra por
`file://`):

```bash
node .claude/static-server.js   # http://localhost:5177
```

Regerar os tipos TypeScript: painel do Supabase (API Docs → Tables) ou `supabase gen types typescript --project-id tczczahhibqnojlptpyx`.

## Recursos adicionais (frontend)

Implementados sobre a integração, todos em `supabase.js` (exceto o WhatsApp, em `orcamentos.js`):

- **Realtime:** o app assina `postgres_changes` (canal `piscinapro-db`) e re-hidrata sozinho quando
  outro usuário altera algo — sem recarregar. Ecos das próprias escritas são ignorados por uma
  janela de "mute"; a atualização espera modal/drawer/painel abertos fecharem para não atropelar
  edição. Requer as tabelas na publicação `supabase_realtime` (migration `06`).
- **Identidade:** ao logar, garante um `perfis` para `auth.uid()`, mostra o usuário no rodapé da
  sidebar e um seletor "sou o vendedor…" que grava `perfis.vendedor_id` — habilitando o atalho
  **"meus leads"** no painel de notificações.
- **Follow-ups (sino):** painel de notificações com **leads parados** (sem interação há 5+ dias,
  calculado do estado em memória) e **tarefas** (`tarefas`) com vencimento — criar, concluir e
  remover. Funciona offline em modo leitura (leads parados vêm do cache; criar exige login).
- **WhatsApp na proposta:** botão que abre o chat do cliente com uma mensagem pronta referenciando
  a proposta (o envio é feito pelo vendedor).
- **Relatórios do servidor:** a tela de Relatórios ganhou o card **"Metas por vendedor · servidor"**,
  alimentado pelas views `vw_metas_vendedor` / `vw_funil_resumo` (numeração feita no banco). Puxadas
  na hidratação e expostas em `window.__supaViews`; offline mostram um aviso e somem graciosamente.
- **PWA instalável:** `manifest.json` + `sw.js` (service worker) + `icon.svg`. App shell
  **network-first** (sempre pega a versão nova online; cache só como fallback offline — evita
  código velho após deploy), CDN da lib/fontes em cache runtime, e **API do Supabase sempre pela
  rede** (nunca cacheia dados). Instalável no desktop e no celular; requer http/https (não `file://`).
- **Drag & drop em Obras:** os cards da tela Obras & Instalação são arrastáveis entre as etapas
  (mesmo padrão mouse+toque do funil de leads); soltar chama `moverObra`, que grava a etapa e
  sincroniza. Ver `bindObraDnD` em `app.js`.
- **Drag & drop em Orçamentos:** a tela de Orçamentos ganhou um toggle **Lista ⇄ Quadro**; no
  quadro (kanban por status), arrastar move a proposta entre rascunho/enviado/aprovado/recusado.
  Soltar em "Aprovado" também marca o lead como ganho. Ver `orcRenderBoard`/`bindOrcDnD` em
  `orcamentos.js`.
- **Exportar CSV:** na tela de Relatórios, botões para exportar **Leads, Clientes e Funil** em CSV
  (separador `;` + BOM UTF-8, abre no Excel pt-BR). Ver `exportLeadsCSV` etc. em `app.js`.
- **Anexos/fotos (Storage):** bucket privado `anexos` (migration `07`); no drawer de obra dá pra
  enviar fotos (terreno/andamento) e o contrato em PDF, com galeria e remoção. URLs assinadas
  (1h). Ver `mountAnexos` em `supabase.js`. Só online.
- **Lembretes (notificações):** botão "🔔 lembretes" no sino pede permissão e passa a **notificar
  follow-ups vencidos** (checagem de minuto em minuto) enquanto o app está aberto/em segundo plano.
  O `sw.js` já tem handlers de `push`/`notificationclick` prontos para push do servidor. Para
  notificação com o app **fechado** falta o trio VAPID + Edge Function + `pg_cron` (não incluso).

## Migrations adicionais (cont.)

7. `07_storage_anexos` — bucket privado `anexos` + policies `authenticated` em `storage.objects`

> Nota de RLS: mantive o acesso **team-wide** (`authenticated` vê tudo), que é o desenho da
> ferramenta — todos os painéis (metas por vendedor, funil geral, financeiro) agregam dados de
> **todos**. Travar linhas por dono quebraria esses relatórios; por isso a atribuição é por
> `perfis.vendedor_id` + filtro no app, não por política que esconde linhas.

## Migrations adicionais

5. `05_perfis_e_tarefas` — tabelas `perfis` e `tarefas` (+ RLS `authenticated`, índices, trigger)
6. `06_realtime_publication` — adiciona todas as tabelas à publicação `supabase_realtime`

- **Analytics com período:** card **"Comparativo do mês"** em Relatórios — leads novos, vendas
  ganhas, contratos e propostas do mês atual × anterior, com variação %. Ver `renderComparativo`.
- **Papéis & permissões:** `perfis.papel` (`admin`/`consultor`). O dono (`OWNER_EMAIL`) e o 1º
  usuário viram admin; os demais, consultor. Consultor vê **Configurações em modo leitura** e não
  exclui orçamento nem cancela venda. É camada de UX (a fronteira dura é o RLS). `Supa.isAdmin()`.
- **Captação de leads (Edge Function `intake-lead`, pública):** `POST /functions/v1/intake-lead`
  com header `x-intake-key`. Cria lead + interação; resolve modelo por nome; origem validada.
  Como `leads` está no Realtime, o lead aparece **na hora** no app. Segredo em `app_config.intake_key`.
- **Web Push (app fechado):** chaves VAPID em `app_config`; assinaturas em `push_subscriptions`;
  Edge Function `send-reminders` (protegida por `app_config.cron_secret`) envia push de follow-ups
  vencidos via `npm:web-push`; `pg_cron` chama de hora em hora (11–22 UTC) por `pg_net`. O cliente
  se inscreve ao ativar "🔔 lembretes". `push_em` evita repetir o aviso no mesmo dia.

### Como plugar a captação no seu site

```html
<script>
fetch('https://tczczahhibqnojlptpyx.supabase.co/functions/v1/intake-lead', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-intake-key': 'SUA_INTAKE_KEY' },
  body: JSON.stringify({ nome, telefone, email, cidade, origem: 'site', modelo, observacoes }),
});
</script>
```

> Pegue a `intake_key` e os segredos com: `select chave, valor from app_config;` (só via painel/
> service_role). **Não** exponha `cron_secret`, `vapid_private` nem `service_role` no frontend.

- **Testes automatizados:** `pure.js` (utilidades puras: telefone/CSV) com suíte em
  `tests/pure.test.mjs`. Rodar: **`npm test`** (15 casos, sem dependências).
- **Validação + máscara + anti-duplicidade:** o cadastro de lead mascara o telefone ao digitar,
  valida DDD+número e **avisa se já existe lead com o mesmo telefone** (via `PP.phoneKeyPure`).
- **Fila offline persistente:** as tabelas com escrita pendente são guardadas em `localStorage`
  (`piscinapro_dirty`) e **drenadas no próximo login, antes da hidratação** — edições feitas
  offline não são mais perdidas ao recarregar.
- **Auditoria:** tabela `auditoria` (migration `12`) + `Supa.logAudit`; registra criar/mover/
  aprovar/cancelar/importar (lead, orçamento, obra, venda). Aparece em **"Atividade recente"** no
  sino, ao vivo (Realtime).
- **Papéis (reforço):** consultor não importa/edita config nem exclui; admin sim.
- **E-mail da proposta:** botão **E-mail** na proposta abre o cliente de e-mail com assunto/corpo
  prontos (o vendedor anexa o PDF gerado e envia) — irmão do botão WhatsApp.
- **Import de leads via CSV:** em Relatórios, **"Importar leads"** lê um CSV (colunas por cabeçalho),
  ignora duplicados por telefone e cria os leads. Contraparte do export.
- **Dark mode:** toggle ☀/🌙 na topbar; tema salvo em `localStorage` e aplicado sem flash (script
  no `<head>`). Paleta escura por variáveis (`:root[data-theme="dark"]`).

## Edge Functions

| Função | Auth | Papel |
|---|---|---|
| `intake-lead` | pública (`x-intake-key`) | cria lead a partir do site/WhatsApp/Ads |
| `send-reminders` | `x-cron-secret` | envia Web Push de follow-ups vencidos (via pg_cron) |

## Migrations adicionais (cont.)

8. `08_intake_e_push` — `app_config`, `push_subscriptions`, `tarefas.push_em`
9. `09_vapid_cron_config` — chaves VAPID + `cron_secret`; habilita `pg_net`/`pg_cron`
10. `10_cron_send_reminders` — agenda `send-reminders` (`0 11-22 * * *`)
11. `11_app_config_deny_policy` — nega explicitamente anon/authenticated em `app_config`
12. `12_auditoria` — tabela `auditoria` (+ RLS, índice, Realtime)

## Pendências de segurança (advisors)

- **Leaked Password Protection** continua desativada no Auth. Ligue em Authentication → Policies.
  [Doc](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)
