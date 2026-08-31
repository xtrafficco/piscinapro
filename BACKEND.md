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
- **PWA instalável:** `manifest.json` + `sw.js` (service worker) + `icon.svg`. App shell em
  cache (stale-while-revalidate), navegação network-first com fallback offline, CDN da lib/fontes
  em cache runtime, e **API do Supabase sempre pela rede** (nunca cacheia dados). Instalável no
  desktop e no celular; requer http/https (não funciona por `file://`).

> Nota de RLS: mantive o acesso **team-wide** (`authenticated` vê tudo), que é o desenho da
> ferramenta — todos os painéis (metas por vendedor, funil geral, financeiro) agregam dados de
> **todos**. Travar linhas por dono quebraria esses relatórios; por isso a atribuição é por
> `perfis.vendedor_id` + filtro no app, não por política que esconde linhas.

## Migrations adicionais

5. `05_perfis_e_tarefas` — tabelas `perfis` e `tarefas` (+ RLS `authenticated`, índices, trigger)
6. `06_realtime_publication` — adiciona todas as tabelas à publicação `supabase_realtime`

## Pendências de segurança (advisors)

- **Leaked Password Protection** continua desativada no Auth. Ligue em Authentication → Policies.
  [Doc](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)
