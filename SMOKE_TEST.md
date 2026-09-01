# PiscinaPro — Primeiro login + smoke test (~5 min)

Valida os caminhos que só rodam **autenticado** (login, hidratação, write-through, Realtime,
anexos, push). Marque cada item; o que falhar, me manda o print/erro do console (F12).

## 0. Subir o app (30s)
```bash
node .claude/static-server.js       # http://localhost:5177
```
Abra **http://localhost:5177** e dê um **hard reload** (Ctrl+Shift+R) para pegar o service worker novo.

> Precisa ser `http://localhost` (ou https). Por `file://` o PWA e os módulos não funcionam.

---

## Núcleo (≈5 min)

### 1. Login → vira admin
- [ ] Na tela de login, entre com **o seu e-mail** (`ramon.sfarias@hotmail.com`) e senha.
- [ ] O portão some, o **pill** no canto vira **“Online · Supabase”**.
- [ ] No rodapé da barra lateral aparece **seu nome** (não mais “Ramon Farias” fixo) e o papel.

### 2. Hidratação (dados reais do banco)
- [ ] A Visão Geral mostra os números vindos do Supabase (14 leads, funil, etc.).
- [ ] Em **Relatórios**, o card **“Metas por vendedor · servidor”** agora mostra barras
      realizado/meta (não mais o aviso “Disponível ao conectar”).

### 3. Identidade / “meus leads”
- [ ] No rodapé, no seletor **“sou o vendedor…”**, escolha um vendedor → toast confirma.
- [ ] Abra o **sino** (🔔) → botão **“meus leads”** aparece e filtra a Base de Leads por você.

### 4. Write-through (a prova principal)
- [ ] Crie um lead novo (**+ Novo Lead**), salve.
- [ ] Abra **uma 2ª aba** em http://localhost:5177 (já logada). **O lead aparece lá sozinho**
      (Realtime). ✅ Isso prova gravação no banco **e** sync ao vivo de uma vez.
- [ ] Mova o lead de etapa (arrastando no funil) na aba A → muda na aba B.

### 5. Drag & drop que persiste
- [ ] **Orçamentos → Quadro**: arraste uma proposta para outro status → o toast confirma e,
      recarregando (F5), o status **permanece** (veio do banco).
- [ ] **Obras**: arraste um card entre etapas → idem.

### 6. Anexos (Storage)
- [ ] Abra uma **Obra** → seção **“Anexos & fotos”** → **Adicionar foto ou PDF** → escolha uma imagem.
- [ ] A miniatura aparece; recarregue (F5) e reabra a obra → **continua lá** (está no Storage).
- [ ] Clique no **×** de um anexo → some.

### 7. Follow-ups
- [ ] No sino, crie uma **tarefa** com vencimento **de ontem** (fica “atrasada”).
- [ ] Marque como concluída (✔) → some da lista.

---

## Push real (opcional, +2 min)

### 8. Ativar lembretes
- [ ] No sino, clique **“🔔 lembretes”** e **permita** notificações no navegador.
      (O botão vira “🔔 on”.)

### 9. Disparar o push manualmente (simula o cron)
- [ ] Crie uma tarefa com vencimento **de ontem** (e **não** conclua).
- [ ] Rode (pega o `cron_secret` no painel: `select valor from app_config where chave='cron_secret'`):
```bash
curl -X POST "https://tczczahhibqnojlptpyx.supabase.co/functions/v1/send-reminders" \
  -H "x-cron-secret: SEU_CRON_SECRET"
```
- [ ] Resposta tipo `{"ok":true,"tarefas":1,"enviadas":1}` **e** chega uma **notificação**
      “Follow-up: …”. (Rodar de novo no mesmo dia dá `enviadas:0` — dedup por `push_em`.)

---

## Extras rápidos

### 10. Captação de lead (webhook do site)
```bash
curl -X POST "https://tczczahhibqnojlptpyx.supabase.co/functions/v1/intake-lead" \
  -H "Content-Type: application/json" \
  -H "x-intake-key: 0b9466095cdba068096c36deca809a07fb23e7294d507c57" \
  -d '{"nome":"Lead do site","telefone":"(19) 90000-0000","origem":"site","modelo":"Ibiza 6,0m"}'
```
- [ ] Retorna `{"ok":true,"id":"…"}` e o lead **aparece na hora** na Base de Leads (Realtime).

### 11. Exportar CSV
- [ ] **Relatórios → Exportar CSV → Leads** baixa um `.csv` que abre certinho no Excel (acentos ok).

### 12. Papéis (se tiver um 2º usuário)
- [ ] Logando com um usuário **consultor**, **Configurações** aparece em **modo leitura**
      (banner + campos travados) e não dá pra excluir orçamento.

---

## Se algo falhar
- Abra o **console** (F12 → Console) e me mande a mensagem em vermelho.
- Pill em **“Erro ao sincronizar”** = veja o console; normalmente é sessão expirada (relogar).
- Anexos/push **exigem estar logado e online** — offline eles ficam desabilitados de propósito.
