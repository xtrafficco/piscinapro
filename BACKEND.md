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

## Como conectar no app (quando for integrar)

O app hoje usa `localStorage`. Para plugar o Supabase (exemplo com CDN, sem build):

```html
<script type="module">
  import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
  const supabase = createClient(
    'https://tczczahhibqnojlptpyx.supabase.co',
    'sb_publishable_DBY4Ce1GPxTi5BwiGcSiGQ_5w3cZRs0'
  );
  // precisa de sessão autenticada por causa do RLS:
  await supabase.auth.signInWithPassword({ email, password });
  const { data: leads } = await supabase.from('leads').select('*, vendedores(nome), modelos(nome)');
</script>
```

Regerar os tipos TypeScript: painel do Supabase (API Docs → Tables) ou `supabase gen types typescript --project-id tczczahhibqnojlptpyx`.
