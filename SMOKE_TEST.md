# PiscinaPro — Roteiro de teste com o servidor (~15 min)

Valida o que só roda **conectado ao Supabase**: login, permissões no banco, sincronização, Realtime, portal com
assinatura, anexos e backup. Os testes automáticos (`npm test` e `npm run test:e2e`) cobrem o resto no modo demonstração.

Pré-requisito: usuário administrador criado e Auth configurado ([BACKEND.md](BACKEND.md), seção 1).

## 0. Subir o app
```bash
npm run serve
```
Abra `http://localhost:5177` (ou a URL do Vercel) e faça um hard reload (Ctrl+Shift+R).

## 1. Administrador
- [ ] Entre com a sua conta. O rodapé da barra lateral mostra seu nome e **Administrador**; o indicador fica **Online · sincronizado**.
- [ ] O menu mostra todas as áreas, inclusive **Usuários** e **Configurações**.

## 2. Criar o acesso de um vendedor
- [ ] **Usuários → Novo usuário**: nome, e-mail, "Definir senha provisória", **Vendedor vinculado → + Cadastrar como novo vendedor**, pacote **Vendedor**, desconto máximo 5%.
- [ ] Aparece a janela com e-mail e senha provisória; o vendedor novo surge em Configurações.
- [ ] Numa janela anônima, entre com esse usuário. O menu mostra só Visão Geral, Leads, Orçamentos, Clientes, Obras e Financeiro (só a aba Comissões).

## 3. Permissões garantidas pelo banco
Com o vendedor logado:
- [ ] Ele só vê os leads dele. Crie um lead: o vendedor vem travado nele.
- [ ] Num orçamento, desconto acima de 5% é recusado.
- [ ] Teste direto na API, driblando a interface (console do navegador, logado como vendedor):
  ```js
  const { cliente } = await import('/src/data/cliente.js');
  const sb = cliente();
  (await sb.from('fin_titulos').select('id')).data            // [] — sem acesso ao financeiro
  (await sb.from('perfis').update({ papel: 'admin' }).eq('papel', 'usuario')).error?.message  // permission denied
  (await sb.from('leads').select('vendedor_id')).data         // só leads do próprio vendedor
  ```
- [ ] Como admin, em **Usuários**, desmarque "Acesso ativo" do vendedor: a sessão dele cai com o aviso "acesso desativado".

## 4. Sincronização e tempo real
- [ ] Admin em duas abas. Crie um lead na aba A → aparece na aba B em poucos segundos.
- [ ] Arraste o lead para outra etapa na aba A → muda na aba B.
- [ ] Desligue a internet (DevTools → Network → Offline), edite um lead, recarregue a página → a alteração continua; religue → o indicador volta a **Online** e a outra aba recebe a alteração.

## 5. Financeiro
- [ ] **Cadastros**: confira as contas e o plano de contas criados pela migration 15; ajuste o saldo inicial.
- [ ] **A pagar → Nova conta a pagar → Parcelado** (3×) → baixa parcial da 1ª → a linha fica "Parcial". Recarregue: o banco devolve o mesmo valor pago (trigger).
- [ ] Aprove uma proposta → toast "Gerar parcelas" → **A receber** mostra entrada + parcelas do contrato.
- [ ] **Comissões** → "Fechar comissões do período" → os títulos aparecem em **A pagar**.
- [ ] **Relatórios**: DRE por caixa e por competência, fluxo de caixa mensal e resultado por obra.

## 6. Proposta, PDF e portal do cliente
- [ ] Abra uma proposta → **PDF**: baixa o arquivo e mostra "PDF gerado e salvo no servidor"; o botão **PDF salvo** abre a cópia do Storage.
- [ ] **Link p/ assinar**: o link é copiado. Abra numa janela anônima (ou no celular).
- [ ] No portal: ver proposta completa, **Aprovar e assinar** (nome, CPF, desenho da assinatura, aceite).
- [ ] No app: a proposta fica **Aprovada**, o lead vai para **Ganho**, a interação "assinada eletronicamente" aparece e a atividade surge no sino.
- [ ] Reabra o link: a proposta mostra "Assinada" com o código SHA-256.

## 7. Obras e anexos
- [ ] Abra uma obra → envie uma foto → ela aparece na galeria e no portal do cliente (seção "Sua obra").

## 8. Lembretes (opcional)
- [ ] No sino, **Ativar lembretes** e permita notificações.
- [ ] Crie um follow-up vencido e rode o cron manualmente:
  ```bash
  curl -X POST "https://szjobipenlkfeunmtueh.supabase.co/functions/v1/send-reminders" -H "x-cron-secret: SEU_CRON_SECRET"
  ```

## 9. Backup e erros
- [ ] Rode o backup manualmente:
  ```bash
  curl -X POST "https://szjobipenlkfeunmtueh.supabase.co/functions/v1/backup-diario" -H "x-cron-secret: SEU_CRON_SECRET"
  ```
  Resposta `{"ok":true,...}` e, em **Configurações → Saúde do sistema**, o backup listado.
- [ ] No console: `setTimeout(() => { throw new Error('teste de monitoramento') })` → o erro aparece em "Erros recentes".

> Pegue `cron_secret` e `intake_key` pelo painel: `select chave, valor from app_config;` — nunca salve esses valores em arquivos do repositório.

## Se algo falhar
Console do navegador (F12) e *Edge Functions → Logs* no painel do Supabase. Indicador em **Erro ao salvar** = veja o console; em geral é sessão expirada ou permissão.
