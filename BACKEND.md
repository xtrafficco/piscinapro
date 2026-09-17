# PiscinaPro — Backend (Supabase)

| | |
|---|---|
| **Projeto** | `PISCINAPRO` |
| **Ref / ID** | `szjobipenlkfeunmtueh` |
| **URL da API** | `https://szjobipenlkfeunmtueh.supabase.co` |
| **Chave publicável** | em `js/supabase.js` (pública por definição; o acesso é controlado pelo RLS) |
| **Região** | `us-west-2` (Postgres 17) |

> **Nunca** coloque no frontend nem no repositório: `service_role`, `cron_secret`, `intake_key`, chave VAPID privada, segredo do app do WhatsApp.

## 1. Migrations (aplicadas)

| Arquivo | O que faz |
|---|---|
| `20260917000000_reconstrucao_schema_app.sql` | Schema do app: catálogo, perfis, leads, orçamentos, obras, financeiro, tarefas, auditoria, push; RLS; Storage `anexos`; Realtime |
| `20260917100000_melhorias_regras_parcelas_portal.sql` | Numeração de orçamentos, regras por usuário, controle de versão, `ganho_em`, parcelas, links e PDF da proposta, relatório comercial |

## 2. Tabelas

| Tabela | Conteúdo |
|---|---|
| `modelos`, `adicionais`, `vendedores`, `equipes` | catálogo (chave natural `nome`) |
| `perfis` | um por usuário: `papel` (`admin`/`consultor`), vendedor vinculado, `desconto_max`, `pode_aprovar`, `ativo` |
| `leads`, `lead_interacoes` | funil e histórico; `versao` e `ganho_em` mantidos pelo banco |
| `orcamentos`, `orcamento_itens` | propostas; `numero` pela sequência `orcamento_numero_seq`; `versao`; `pdf_path` |
| `proposta_links` | link do cliente: token, validade, revogação, acessos e aceite (nome, documento, IP, navegador, hash) |
| `obras`, `obra_notas` | uma obra por lead ganho |
| `financeiro` | contrato de cada venda e comissão |
| `parcelas` | contas a receber: número (0 = entrada), vencimento, valor, valor pago, data e forma |
| `tarefas`, `auditoria`, `push_subscriptions` | sino, atividade e Web Push |
| `app_config`, `backups_log` | segredos e histórico de backup (sem acesso pela API) |

Views: `vw_metas_vendedor`, `vw_funil_resumo`. RPC: `relatorio_comercial(p_inicio, p_fim)`.
Storage (privados): `anexos` (fotos/PDF de obras), `propostas` (PDFs), `backups`.

## 3. Regras garantidas pelo banco

| Regra | Onde |
|---|---|
| `anon` não lê nem grava nada | RLS + `revoke` |
| Catálogo: só admin altera; leads e orçamentos: só admin exclui | RLS |
| Tarefas e inscrições de push: cada um vê as suas | RLS |
| Ninguém muda o próprio papel, limite, permissão ou status; sempre há um admin ativo | `privado.guard_perfis` |
| Desconto acima de `perfis.desconto_max` é recusado (admin sem limite) | `privado.guard_orcamentos` |
| Aprovar/desfazer proposta e marcar/cancelar venda ganha exigem `pode_aprovar` (ou admin) | `guard_orcamentos`, `guard_leads` |
| Número do orçamento definido no primeiro insert e imutável | `privado.numerar_orcamento` |
| Gravação com versão desatualizada é recusada (HTTP 409, código `PT409`) | `privado.controle_versao` |
| Aceite do cliente não pode ser forjado pelo app (só `revogado` é gravável) | privilégio por coluna |

Os gatilhos comparam com a linha existente também no INSERT do upsert (o app grava via upsert).
Funções usadas pelo RLS ficam no schema `privado` (fora da API).

## 4. Edge Functions

| Função | Acesso | Papel |
|---|---|---|
| `admin-users` | sessão de **admin ativo** | listar, criar (senha provisória), atualizar, nova senha, excluir; desativar bane o login |
| `proposta` | token do link | dados da proposta para `proposta.html`; aceite do cliente (aprova e marca venda) |
| `intake-lead` | `x-intake-key` (+ origens permitidas) | lead do formulário do site/anúncios |
| `whatsapp-webhook` | token de verificação + assinatura HMAC da Meta | cada mensagem recebida vira lead ou interação |
| `backup-diario` | `x-cron-secret` | JSON gzip de todas as tabelas no bucket `backups` (35 dias) |
| `send-reminders` | `x-cron-secret` | Web Push dos follow-ups vencidos |

Fontes em `supabase/functions/` (código compartilhado em `_shared/`). Publicar:
```bash
supabase functions deploy admin-users proposta intake-lead whatsapp-webhook backup-diario send-reminders --project-ref szjobipenlkfeunmtueh
```
A função antiga `portal` não é usada: exclua no painel (*Edge Functions → portal → Delete*).

Agendamentos (pg_cron → `chamar_funcao_cron`): `backup-diario` às 03:00 e `send-reminders` de hora em hora das 08:00 às 19:00 (Brasília).

## 5. Configuração (painel — uma vez)

1. *Authentication → Users → Add user → Create new user* (marque **Auto Confirm User**): a sua conta. O primeiro
   usuário (ou o e-mail em `app_config.admin_email`) vira administrador. Os demais acessos são criados na tela **Usuários**.
2. *Authentication → Sign In / Providers → Email*: desligar **Allow new users to sign up**.
3. *Authentication → URL Configuration*: *Site URL* = URL da Vercel.
4. *Authentication → Attack Protection*: ligar **Leaked Password Protection**.

### Formulário do site
Veja `captacao/formulario-site.html`. Chave: `select valor from app_config where chave = 'intake_key';`
Restrinja os domínios: `insert into app_config (chave, valor) values ('intake_origens', 'https://www.suaempresa.com.br') on conflict (chave) do update set valor = excluded.valor;`

### WhatsApp (Cloud API da Meta)
1. No app da Meta → WhatsApp → Configuração → Webhook:
   URL `https://szjobipenlkfeunmtueh.supabase.co/functions/v1/whatsapp-webhook`,
   token de verificação = `select valor from app_config where chave = 'whatsapp_verify_token';`, assinar o campo **messages**.
2. Grave o segredo do app (Configurações do app → Básico → Chave secreta):
   `insert into app_config (chave, valor) values ('whatsapp_app_secret', '...') on conflict (chave) do update set valor = excluded.valor;`
   Sem ele, as mensagens são recusadas (assinatura não confere).

## 6. Conferência

```sql
select tablename from pg_tables where schemaname = 'public' and not rowsecurity;   -- vazio
select jobname, schedule from cron.job;
select last_value, is_called from public.orcamento_numero_seq;
```

Tipos: `supabase gen types typescript --project-id szjobipenlkfeunmtueh > database.types.ts`.
