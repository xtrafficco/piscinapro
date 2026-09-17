# PiscinaPro — Roteiro de teste com o servidor (~20 min)

Os testes automáticos (`npm run check` e `npm run test:e2e`) cobrem o modo offline. Este roteiro valida o que depende
do Supabase. Pré-requisito: sua conta criada no painel ([BACKEND.md](BACKEND.md), seção 5).

```bash
npm run serve
```
Abra `http://localhost:5177` (ou a URL da Vercel) e faça um hard reload (Ctrl+Shift+R).

## 1. Administrador
- [ ] Entre. Indicador **Online · Supabase**; barra lateral com seu nome e **Administrador**; menu **Usuários** visível.
- [ ] Funil e orçamentos vazios (demonstração do navegador não sobe); Configurações com 6 modelos, 12 adicionais, 4 equipes.
- [ ] Configurações → adicione um vendedor.

## 2. Usuários
- [ ] Usuários → **Novo usuário** (consultor, vendedor vinculado, desconto máximo 5%, sem "Aprova") → aparece a senha provisória.
- [ ] Numa janela anônima, entre com esse usuário: barra mostra **Consultor**; menu Usuários oculto.

## 3. Regras no servidor (como consultor)
- [ ] Crie um lead e um orçamento para ele: ao salvar, o número vira **#0001** (sequência do banco).
- [ ] Desconto de 10%: a tela limita a 5% com aviso.
- [ ] Botão **Aprovar**: "Sem permissão". Arrastar o lead para Ganho: "Sem permissão".
- [ ] Como admin, em Usuários, marque **Aprova** para o consultor; depois de atualizar a página, o consultor aprova.

## 4. Edição simultânea
- [ ] Mesmo lead aberto em duas abas (desligue a internet da aba B, edite; na aba A edite o mesmo lead e salve; religue a B).
      A aba B avisa que o lead foi alterado por outra pessoa e carrega a versão mais recente.

## 5. Proposta: PDF e link do cliente
- [ ] Abra a proposta → **Gerar PDF**: baixa o arquivo e mostra "PDF gerado e salvo no servidor"; **PDF salvo** abre a cópia.
- [ ] **Link p/ cliente**: link copiado. Abra numa janela anônima (ou no celular): proposta completa, botão Baixar PDF.
- [ ] Aceite com nome, CPF e confirmação → "Proposta aceita". No app: proposta **Aprovada**, lead **Ganho**, interação e atividade no sino.

## 6. Financeiro
- [ ] Financeiro → contrato do cliente → **Gerar parcelas** (se não geradas ao aprovar): entrada + parcelas mensais.
- [ ] Registre o recebimento da entrada (data, valor, Pix) → "Pago"; recarregue: continua. Estorne → "Em aberto".
- [ ] Edite o vencimento de uma parcela futura para ontem → contrato fica **Atrasado**.

## 7. Obras e relatórios
- [ ] Obras: a venda nova aparece em **Vistoria**, equipe "a definir". Mude a etapa e envie uma foto.
- [ ] Relatórios → **Relatório do período (servidor)**: vendas, conversão por origem/vendedor e ciclo de venda.

## 8. Sair
- [ ] **Sair**: tela de login aparece e, ao "Continuar offline", nenhum dado da conta aparece (foi apagado do aparelho).

## 9. Captação (opcional)
- [ ] Publique `captacao/formulario-site.html` (com a `intake_key`) numa página de teste e envie: o lead aparece no funil.
- [ ] WhatsApp: configure o webhook ([BACKEND.md](BACKEND.md)) e mande uma mensagem ao número: vira lead de origem WhatsApp.

## Se algo falhar
Console do navegador (F12) e *Edge Functions → Logs* no painel do Supabase.
