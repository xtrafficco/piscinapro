# PiscinaPro — Backend (Supabase)

PostgreSQL + Auth + Realtime + Storage + Edge Functions.

| | |
|---|---|
| **Projeto** | `PISCINAPRO` |
| **Ref / ID** | `szjobipenlkfeunmtueh` |
| **URL da API** | `https://szjobipenlkfeunmtueh.supabase.co` |
| **Chave publicável** | em `src/core/config.js` (pública por definição; o acesso é controlado pelo RLS) |
| **Região** | `us-west-2` (Postgres 17) |

> **Nunca** coloque no frontend nem no repositório: `service_role`, `cron_secret`, `intake_key`, chave VAPID privada.

---

## 1. Estado atual do projeto

Tudo o que está em `supabase/` **já foi aplicado** no projeto `szjobipenlkfeunmtueh` (projeto novo, criado vazio —
os dados do projeto antigo não foram migrados).

### 1.1 Migrations aplicadas
| Arquivo | O que faz |
|---|---|
| `20260916115900_00_base_schema.sql` | Schema base consolidado (antigas 01–12): enums, tabelas comerciais e de operação, views, `app_config`, auditoria, push, catálogo inicial de modelos/adicionais |
| `20260916120000_13_usuarios_permissoes.sql` | `perfis` ganha e-mail, permissões, limites e ativo; trigger cria o perfil quando o usuário nasce no Auth (**o primeiro vira admin**); funções `tem_perm`, `no_escopo`…; RPC `usuarios_resumo()` |
| `20260916120100_14_rls_por_permissao.sql` | RLS de todas as tabelas comerciais/operação por permissão e escopo do vendedor; triggers de aprovação, reversão de venda e limite de desconto; tarefas com responsável e horário |
| `20260916120200_15_financeiro_erp.sql` | ERP (`fin_contas`, `fin_categorias`, `fornecedores`, `fin_titulos`, `fin_movimentos`, `fin_parametros`), trigger de recálculo do título, RLS e plano de contas inicial |
| `20260916120300_16_portal_assinatura_storage.sql` | `portal_tokens`, `assinaturas`, buckets `anexos`, `propostas`, `assinaturas`, `backups` e políticas de Storage |
| `20260916120400_17_monitoramento_backup_realtime.sql` | `erros_app`, `backups_log`, `chamar_funcao_cron()`, agendamentos pg_cron e Realtime |
| `20260916120500_18_endurecimento_advisors.sql` | Funções internas sem EXECUTE pela API, helpers de RLS só para `authenticated`, `pg_net` no schema `extensions` |
| `20260916120600_19_desempenho_rls_indices.sql` | `(select auth.uid())` nas políticas, uma política permissiva por ação, índices nas chaves estrangeiras |

Conferência feita: nenhuma tabela pública sem RLS; 84 políticas; 4 buckets; 21 tabelas no Realtime.

### 1.2 Edge Functions publicadas
`admin-users` (JWT), `portal`, `intake-lead`, `send-reminders` e `backup-diario` (sem JWT, protegidas por token
ou segredo). Para publicar de novo:
```bash
supabase link --project-ref szjobipenlkfeunmtueh
supabase functions deploy admin-users portal intake-lead send-reminders backup-diario
```
(`supabase/config.toml` já define `verify_jwt` de cada uma.)

### 1.3 Agendamentos (pg_cron → `chamar_funcao_cron`)
| Job | Quando (UTC) | Horário de Brasília |
|---|---|---|
| `backup-diario` | `0 6 * * *` | 03:00 todo dia |
| `send-reminders` | `0 11-22 * * *` | de hora em hora, 08:00–19:00 |
| `limpar-erros-app` | `30 6 * * 0` | domingo 03:30 (apaga erros com mais de 90 dias) |

Os segredos (`supabase_url`, `cron_secret`, `intake_key`, VAPID) ficam em `app_config`, que a API nega a todos.

### 1.4 Configuração do Auth (painel — fazer uma vez)
1. *Authentication → Users → Add user → Create new user* (marque **Auto Confirm User**): crie a sua conta.
   **O primeiro usuário criado vira administrador.** Os demais acessos são criados pela tela *Usuários* do app.
2. *Authentication → Sign In / Providers → Email*: **desligar "Allow new users to sign up"**.
3. *Authentication → URL Configuration*: *Site URL* = URL do Vercel; adicionar a mesma URL em *Redirect URLs*.
4. *Authentication → Attack Protection*: ligar **Leaked Password Protection**.

### 1.5 Conferência
```sql
select tablename from pg_tables where schemaname = 'public' and not rowsecurity;   -- vazio
select tablename, count(*) from pg_policies where schemaname = 'public' group by 1 order by 1;
select jobname, schedule from cron.job;
select id, status_code, left(content, 120) from net._http_response order by id desc limit 5;  -- respostas do cron
```

### 1.6 Tipos
`database.types.ts` foi gerado do projeto atual. Depois de novas migrations:
`supabase gen types typescript --project-id szjobipenlkfeunmtueh > database.types.ts`.

---

## 2. Segurança (RLS)

A fronteira de segurança é o banco. A interface só esconde o que o usuário não pode usar.

- **Papéis:** `admin` (tudo) ou `usuario` (lista de permissões em `perfis.permissoes`). Catálogo em
  `src/core/permissoes.js` e espelho em `supabase/functions/_shared/permissoes.ts` — um teste garante que as duas
  listas e as strings usadas nas migrations batem.
- **Escopo do vendedor:** sem `comercial.todos`, o usuário só lê/grava leads, propostas, clientes, obras e contratos
  cujo `vendedor_id` é o dele (`perfis.vendedor_id`). `leads.sem_dono` libera os leads sem vendedor.
- **Regras que dependem do valor anterior** ficam em triggers: aprovar proposta (`orcamentos.aprovar`), desfazer
  aprovação ou reverter venda ganha (`clientes.cancelar`), desconto acima de `limites.desconto_max`.
- **Perfis:** ninguém grava pela API pública. Criação pelo trigger do Auth; alterações pela Edge Function
  `admin-users` (só admin ou `usuarios.gerir`; só admin concede `usuarios.gerir`/`sistema.ver` ou papel admin; o
  sistema nunca fica sem administrador ativo).
- **Anon:** sem acesso a nenhuma tabela. O portal do cliente passa pela Edge Function `portal` (service_role) com
  link secreto que expira e pode ser revogado.

---

## 3. Modelo de dados

**Comercial e operação:** `vendedores`, `equipes`, `modelos`, `adicionais`, `leads`, `lead_interacoes`, `orcamentos`,
`orcamento_itens`, `obras`, `obra_notas`, `financeiro` (contrato de venda simples), `tarefas`, `perfis`, `auditoria`,
`push_subscriptions`, `app_config` (segredos; negado a todos pela API).

**ERP financeiro:**

| Tabela | Papel |
|---|---|
| `fin_contas` | caixas, bancos, cartões e aplicações, com saldo inicial e data |
| `fin_categorias` | plano de contas; `grupo` define a linha do DRE |
| `fornecedores` | cadastro de fornecedores e prestadores |
| `fin_titulos` | contas a receber e a pagar: parcelas (`grupo_id`), recorrência, competência, desconto/acréscimo, vínculo com cliente/obra (`lead_id`), vendedor (comissão) e origem (`manual`, `contrato`, `comissao`, `recorrencia`) |
| `fin_movimentos` | entradas e saídas realizadas; baixa de título (`titulo_id`), transferências (`transferencia_id`), conciliação |
| `fin_parametros` | base da comissão (`venda`/`recebimento`), dia de pagamento, gerar títulos ao fechar venda |

`valor_pago`, `status` e `pago_em` do título são recalculados por trigger a cada movimento — o app faz o mesmo
cálculo localmente (`src/core/financeiro.js`, testado).

**Portal e arquivos:** `portal_tokens`, `assinaturas` (nome, documento, IP, user agent, hash SHA-256 do conteúdo da
proposta e imagem da assinatura), `erros_app`, `backups_log`. Buckets privados: `anexos`, `propostas`, `assinaturas`, `backups`.

**Views:** `vw_metas_vendedor`, `vw_funil_resumo` (`security_invoker`, respeitam o RLS).

---

## 4. Edge Functions

| Função | Acesso | Papel |
|---|---|---|
| `admin-users` | JWT de admin ou `usuarios.gerir` | listar, criar (senha provisória ou convite, com opção de cadastrar o vendedor), alterar permissões/limites/vendedor/papel, desativar, nova senha, link de recuperação, excluir |
| `portal` | pública, por token | carrega propostas, obra, fotos e parcelas; registra a assinatura eletrônica e aprova a proposta |
| `backup-diario` | `x-cron-secret` | exporta todas as tabelas em JSON gzip para o bucket `backups` (retenção de 35 dias) |
| `intake-lead` | `x-intake-key` | cria lead a partir do site/WhatsApp/anúncios |
| `send-reminders` | `x-cron-secret` | Web Push de follow-ups vencidos |

### Captação de leads pelo site
```html
<script>
fetch('https://szjobipenlkfeunmtueh.supabase.co/functions/v1/intake-lead', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-intake-key': 'SUA_INTAKE_KEY' },
  body: JSON.stringify({ nome, telefone, email, cidade, origem: 'site', modelo, observacoes }),
});
</script>
```
Pegue a chave com `select valor from app_config where chave = 'intake_key';` (painel). Se ela já esteve em algum
arquivo publicado, gere outra: `update app_config set valor = encode(extensions.gen_random_bytes(24), 'hex') where chave = 'intake_key';`

---

## 5. Como o app conversa com o banco

- **Offline-first:** o estado fica em memória e no `localStorage`; a interface nunca espera a rede.
- **Sincronização por diferença** (`src/data/sync.js`): guarda um hash por linha da última sincronização e envia só
  o que mudou; só apaga no servidor o que existia no último snapshot e foi removido localmente. Registros de outros
  usuários ou fora do seu escopo nunca são apagados.
- **Fila persistente:** alterações feitas sem conexão ficam em `piscinapro_dirty` e sobem no próximo login.
- **Permissão negada** (RLS/trigger): a alteração local é descartada, a fatia é recarregada do servidor e aparece um aviso.
- **Realtime:** mudanças de outros usuários recarregam só a parte afetada, sem atropelar formulários abertos.
- **Paginação:** leituras de 1.000 em 1.000 linhas (limite padrão do PostgREST).
- **Ao sair:** o cache do usuário é apagado do aparelho.

---

## 6. Histórico de migrations

O projeto antigo tinha 12 migrations aplicadas pelo painel e nunca versionadas. No projeto novo elas foram
consolidadas em `00_base_schema`; em seguida vieram 13–19 (seção 1.1). Todas estão em `supabase/migrations/`.
