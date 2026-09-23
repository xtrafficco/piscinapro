/* ==========================================================================
   PiscinaPro — whats.js
   Envio por WhatsApp com mensagem pronta.

   O sistema NUNCA envia sozinho: ele monta o texto, deixa você revisar e
   editar, e abre a conversa no WhatsApp já preenchida. Quem aperta "enviar"
   é sempre a pessoa, dentro do WhatsApp.
   ========================================================================== */
(function () {
'use strict';
const PP = window.PP;
const esc = PP.esc;

/** Monta o número no padrão internacional que o wa.me exige. */
PP.foneInternacional = tel => {
  let d = PP.digitos(tel);
  const ddi = PP.digitos(PP.cfg().ddi) || '55';
  if (!d) return '';
  if (d.length <= 11) d = ddi + d;          /* (43) 99999-8888 → 5543999998888 */
  return d;
};

/** Substitui {variaveis} no template. */
PP.montarMsg = (template, vars) => String(template || '').replace(/\{(\w+)\}/g, (m, k) =>
  vars[k] !== undefined && vars[k] !== null && vars[k] !== '' ? vars[k] : '');

/** Variáveis padrão disponíveis em qualquer template. */
function varsBase(extra) {
  const cfg = PP.cfg();
  const u = PP.usuario && PP.usuario();
  return Object.assign({
    empresa: cfg.empresa,
    vendedor: u ? u.nome.split(' ')[0] : '',
    telefoneEmpresa: cfg.fone,
    site: cfg.site
  }, extra || {});
}
PP.varsBase = varsBase;

/**
 * Abre o compositor: mostra a mensagem, deixa editar, e só então abre o WhatsApp.
 * opts: { tel, msg, titulo, leadId, tipoInteracao }
 */
PP.whatsApp = opts => {
  const tel = PP.foneInternacional(opts.tel);
  if (!tel) return PP.toast('Esse contato não tem telefone cadastrado', 'err');

  const key = PP.uid('wa');
  PP.on(key, (d, el) => {
    const txt = el.closest('.modal-box').querySelector('#waMsg').value;
    const url = 'https://wa.me/' + tel + '?text=' + encodeURIComponent(txt);
    window.open(url, '_blank', 'noopener');
    if (opts.leadId) {
      PP.interagir(opts.leadId, opts.tipoInteracao || 'WhatsApp', txt.length > 160 ? txt.slice(0, 157) + '…' : txt);
    }
    PP.closeTop();
    PP.toast('WhatsApp aberto — revise e envie por lá', 'ok');
    PP.render();
  });

  PP.on(key + '_copiar', (d, el) => {
    const txt = el.closest('.modal-box').querySelector('#waMsg').value;
    if (navigator.clipboard) navigator.clipboard.writeText(txt).then(
      () => PP.toast('Mensagem copiada', 'ok'),
      () => PP.toast('Não foi possível copiar', 'err'));
  });

  PP.modal({
    title: opts.titulo || 'Enviar por WhatsApp',
    sub: PP.fone(opts.tel) + ' · revise antes de abrir a conversa',
    size: 'lg',
    body: `
      <div class="f">
        <label for="waMsg">Mensagem</label>
        <textarea class="inp" id="waMsg" rows="8">${esc(opts.msg || '')}</textarea>
        <span class="hint">O WhatsApp abre com esse texto já digitado. Você ainda precisa apertar enviar lá.</span>
      </div>
      ${opts.anexo ? `<div class="alert a-info mt"><svg class="ic"><use href="#i-alerta"/></svg><div class="small">${esc(opts.anexo)}</div></div>` : ''}`,
    actions: [
      { txt:'Abrir conversa no WhatsApp', cls:'btn-ok', ic:'i-wpp', act:key },
      { txt:'Copiar texto', ic:'i-copia', act:key + '_copiar' },
      { txt:'Cancelar', act:'fechar' }
    ]
  });
};

/* ============================== ATALHOS POR CONTEXTO ============================== */

/** Primeiro contato / follow-up com um lead */
PP.on('waLead', d => {
  const l = PP.lead(d.id);
  if (!l) return;
  const modelo = l.produtoId ? PP.prodNome(l.produtoId) : 'piscina';
  const orc = PP.sortBy(PP.where('orcamentos', o => o.leadId === l.id), 'numero', 'desc')[0];
  const usarFollowUp = d.tipo === 'followup' && orc;
  const tpl = usarFollowUp ? PP.cfg().msgFollowUp : PP.cfg().msgPrimeiroContato;
  PP.whatsApp({
    tel: l.telefone,
    titulo: usarFollowUp ? 'Follow-up por WhatsApp' : 'Primeiro contato por WhatsApp',
    leadId: l.id,
    msg: PP.montarMsg(tpl, varsBase({
      cliente: l.nome.split(' ')[0],
      modelo: modelo,
      numero: orc ? orc.numero : '',
      vendedor: PP.vendNome(l.vendedorId).split(' ')[0]
    }))
  });
});

/** Envio da proposta */
PP.on('waProposta', d => {
  const o = PP.find('orcamentos', d.id);
  if (!o) return;
  const cli = o.clienteId ? PP.cli(o.clienteId) : null;
  const lead = o.leadId ? PP.lead(o.leadId) : null;
  const tel = cli ? cli.telefone : (lead ? lead.telefone : '');
  const nome = cli ? cli.nome : (lead ? lead.nome : 'cliente');
  const piscina = o.itens.map(i => PP.prod(i.produtoId)).find(p => p && p.categoria === 'Piscina');
  const c = o.condicao || {};
  const tot = PP.orcTotal(o);
  const nP = Math.max(PP.n(c.parcelas), 1);
  const parcela = PP.n(c.juros) > 0 ? PP.pmt(tot - PP.n(c.entrada), c.juros, nP) : (tot - PP.n(c.entrada)) / nP;

  PP.whatsApp({
    tel, titulo:`Enviar proposta #${o.numero}`, leadId:o.leadId, tipoInteracao:'Proposta',
    anexo:'Gere o PDF em "Proposta em PDF", salve o arquivo e anexe na conversa — o WhatsApp não aceita anexo por link.',
    msg: PP.montarMsg(PP.cfg().msgProposta, varsBase({
      cliente: nome.split(' ')[0],
      numero: o.numero,
      modelo: piscina ? piscina.nome : 'piscina',
      total: PP.money(tot),
      entrada: PP.money(c.entrada),
      parcelas: nP > 1 ? `${nP}x de ${PP.money(parcela)}` : 'pagamento à vista',
      validade: PP.dt(o.validade),
      vendedor: PP.vendNome(o.vendedorId).split(' ')[0]
    }))
  });
});

/** Confirmação de agendamento de obra */
PP.on('waObra', d => {
  const ob = PP.find('obras', d.id);
  if (!ob) return;
  const cli = PP.cli(ob.clienteId);
  if (!cli) return PP.toast('Obra sem cliente vinculado', 'err');
  PP.whatsApp({
    tel: cli.telefone, titulo:'Confirmar instalação',
    msg: PP.montarMsg(PP.cfg().msgAgendamento, varsBase({
      cliente: cli.nome.split(' ')[0],
      data: ob.dataAgendada ? PP.dt(ob.dataAgendada) : '(a definir)'
    }))
  });
});

/** Cobrança de parcela em atraso */
PP.on('waCobranca', d => {
  const f = PP.find('financeiro', d.id);
  if (!f || !f.clienteId) return PP.toast('Lançamento sem cliente vinculado', 'err');
  const cli = PP.cli(f.clienteId);
  PP.whatsApp({
    tel: cli.telefone, titulo:'Cobrança por WhatsApp',
    msg: PP.montarMsg(PP.cfg().msgCobranca, varsBase({
      cliente: cli.nome.split(' ')[0],
      valor: PP.money(f.valor),
      vencimento: PP.dt(f.vencimento)
    }))
  });
});

/** Conversa livre com um cliente */
PP.on('waCliente', d => {
  const c = PP.cli(d.id);
  if (!c) return;
  PP.whatsApp({
    tel: c.telefone, titulo:'Conversar com ' + c.nome.split(' ')[0],
    msg: PP.montarMsg('Olá {cliente}, aqui é {vendedor} da {empresa}. ', varsBase({ cliente:c.nome.split(' ')[0] }))
  });
});

})();
