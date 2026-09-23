/* ==========================================================================
   PiscinaPro — orcamentos.js
   Catálogo, construtor de orçamento, proposta imprimível (PDF) e pedidos
   de venda. A aprovação de um orçamento é o "motor" do ERP: gera pedido,
   obra, contas a receber/pagar, comissão e movimento de estoque.
   ========================================================================== */
(function () {
'use strict';
const PP = window.PP;
const esc = PP.esc;

PP.STATUS_PEDIDO = {
  aberto:    { nome:'Aberto',        cls:'b-info' },
  producao:  { nome:'Em produção',   cls:'b-warn' },
  entregue:  { nome:'Entregue',      cls:'b-teal' },
  concluido: { nome:'Concluído',     cls:'b-ok' },
  cancelado: { nome:'Cancelado',     cls:'b-dang' }
};
PP.statusPedidoNome = s => (PP.STATUS_PEDIDO[s] || { nome:s }).nome;
PP.statusPedidoCls  = s => (PP.STATUS_PEDIDO[s] || { cls:'' }).cls;

/* ============================== LISTA DE ORÇAMENTOS ============================== */

const fOrc = { q:'', status:'', vend:'' };

PP.view('orcamentos', {
  titulo: 'Orçamentos & propostas',
  sub: () => {
    const meus = PP.escopo(PP.all('orcamentos'));
    const abertos = meus.filter(o => o.status === 'enviado' || o.status === 'negociando');
    const alcada = meus.filter(o => o.status === 'aprovacao').length;
    return `${meus.length} orçamentos · ${abertos.length} aguardando decisão (${PP.money0(PP.soma(abertos, PP.orcTotal))})`
      + (alcada ? ` · ${alcada} travado(s) na alçada` : '');
  },
  render() {
    let rows = PP.escopo(PP.all('orcamentos')).slice();
    if (fOrc.q) {
      const q = PP.norm(fOrc.q);
      rows = rows.filter(o => String(o.numero).includes(q) || PP.norm(nomeDoOrc(o)).includes(q));
    }
    if (fOrc.status) rows = rows.filter(o => o.status === fOrc.status);
    if (fOrc.vend) rows = rows.filter(o => o.vendedorId === fOrc.vend);
    rows = PP.sortBy(rows, 'numero', 'desc');
    const pag = PP.paginar('orcamentos', rows);

    const todos = PP.escopo(PP.all('orcamentos'));
    const aprov = todos.filter(o => o.status === 'aprovado');
    const decid = todos.filter(o => o.status === 'aprovado' || o.status === 'recusado' || o.status === 'expirado');
    const naAlcada = todos.filter(o => o.status === 'aprovacao');

    return `
      ${naAlcada.length ? `<div class="alert ${PP.ehGestor() ? 'a-dang' : 'a-warn'} mb">
        <svg class="ic"><use href="#i-alerta"/></svg>
        <div>${PP.ehGestor()
          ? `<b>${PP.plural(naAlcada.length, 'proposta travada', 'propostas travadas')} esperando sua aprovação de desconto.</b> Abra e libere ou devolva ao vendedor.`
          : `<b>${PP.plural(naAlcada.length, 'proposta sua está travada', 'propostas suas estão travadas')} na alçada.</b> O desconto passou do limite e o gerente precisa liberar antes do envio.`}
        </div></div>` : ''}

      <div class="kpis mb">
        ${PP.kpi({ cls:'k-teal', lbl:'Em aberto', val:PP.money0(PP.soma(todos.filter(o => o.status === 'enviado' || o.status === 'negociando'), PP.orcTotal)), sm:true,
          foot:`${todos.filter(o => o.status === 'enviado' || o.status === 'negociando').length} proposta(s)` })}
        ${PP.kpi({ cls:'k-ok', lbl:'Aprovados', val:PP.money0(PP.soma(aprov, PP.orcTotal)), sm:true, foot:`${aprov.length} orçamento(s)` })}
        ${PP.kpi({ cls:'k-ocre', lbl:'Taxa de aprovação', val:PP.pct(decid.length ? aprov.length / decid.length * 100 : 0, 0), foot:`${decid.length} decidido(s)` })}
        ${PP.podeVerCusto()
          ? PP.kpi({ lbl:'Margem média', val:PP.pct(aprov.length ? PP.soma(aprov, PP.orcMargem) / aprov.length : 0, 1), foot:'sobre orçamentos aprovados' })
          : PP.kpi({ lbl:'Desconto médio', val:PP.pct(todos.length ? PP.soma(todos, 'descontoPct') / todos.length : 0, 1), foot:`alçada de ${PP.dec(PP.cfg().descontoMaxPct, 0)}%` })}
      </div>

      <div class="toolbar">
        <div class="mini-search">
          <svg class="ic"><use href="#i-busca"/></svg>
          <input class="inp" type="search" placeholder="Número ou cliente" value="${esc(fOrc.q)}" data-inp="buscaOrc" aria-label="Buscar orçamentos">
        </div>
        <select class="inp" style="width:auto" data-chg="filtroOrc" data-f="status" aria-label="Status">
          <option value="">Todos os status</option>
          ${Object.keys(PP.STATUS_ORC).map(k => `<option value="${k}"${fOrc.status === k ? ' selected' : ''}>${esc(PP.STATUS_ORC[k].nome)}</option>`).join('')}
        </select>
        <select class="inp" style="width:auto" data-chg="filtroOrc" data-f="vend" aria-label="Vendedor">
          <option value="">Todos os vendedores</option>
          ${PP.where('vendedores', v => v.ativo).map(v => `<option value="${v.id}"${fOrc.vend === v.id ? ' selected' : ''}>${esc(v.nome)}</option>`).join('')}
        </select>
        <div class="row-end row">
          <span class="small faint">${rows.length} resultado(s)</span>
          <button class="btn btn-primary" data-act="novoOrc"><svg class="ic"><use href="#i-plus"/></svg>Novo orçamento</button>
        </div>
      </div>

      <div class="card">
        ${rows.length ? PP.tabela({
          act:'abrirOrc', rows:pag.linhas,
          cols:[
            { h:'Nº', w:'88px', r:o => `<b>#${o.numero}</b><span class="mini">${esc(PP.dt(o.data))}</span>` },
            { h:'Cliente / lead', r:o => `<div class="strong">${esc(nomeDoOrc(o))}</div><span class="mini">${esc(PP.trunc((o.itens[0] || {}).nome || '', 32))}${o.itens.length > 1 ? ` +${o.itens.length - 1}` : ''}</span>` },
            { h:'Vendedor', r:o => `<span class="small">${esc(PP.vendNome(o.vendedorId).split(' ')[0])}</span>` },
            { h:'Validade', r:o => `<span class="small ${o.validade < PP.hoje() && (o.status === 'enviado' || o.status === 'negociando') ? 'b' : ''}" style="${o.validade < PP.hoje() && (o.status === 'enviado' || o.status === 'negociando') ? 'color:var(--dang)' : ''}">${esc(PP.dt(o.validade))}</span>` },
            { h:'Status', r:o => PP.badge(PP.STATUS_ORC[o.status].nome, PP.STATUS_ORC[o.status].cls) },
            { h:'Desc.', cls:'num', r:o => o.descontoPct
              ? `<span class="small ${PP.n(o.descontoPct) > PP.n(PP.cfg().descontoMaxPct) ? 'b' : ''}" style="${PP.n(o.descontoPct) > PP.n(PP.cfg().descontoMaxPct) ? 'color:var(--dang)' : ''}">${PP.dec(o.descontoPct, 1)}%</span>`
              : '<span class="faint">—</span>' },
            PP.podeVerCusto() ? { h:'Margem', cls:'num', r:o => PP.orcMargem(o) < 25
              ? `<span class="small b" style="color:var(--dang)">${PP.dec(PP.orcMargem(o), 0)}%</span>`
              : `<span class="small">${PP.dec(PP.orcMargem(o), 0)}%</span>` } : null,
            { h:'Total', cls:'num', r:o => `<b>${esc(PP.money(PP.orcTotal(o)))}</b>` }
          ]
        }) + pag.html : PP.vazio('Nenhum orçamento encontrado', 'Crie um orçamento a partir de um lead ou do zero.', { act:'novoOrc', txt:'Novo orçamento' })}
      </div>`;
  }
});

function nomeDoOrc(o) {
  if (o.clienteId) return PP.cliNome(o.clienteId);
  const l = PP.lead(o.leadId);
  return l ? l.nome : 'Sem vínculo';
}
PP.nomeDoOrc = nomeDoOrc;

/**
 * Expira propostas vencidas há mais de 7 dias.
 * Roda no boot e de hora em hora — NÃO durante o render: uma função que desenha
 * a tela não deve alterar e gravar dados como efeito colateral.
 */
PP.marcarExpirados = () => {
  let mudou = 0;
  PP.all('orcamentos').forEach(o => {
    if ((o.status === 'enviado' || o.status === 'negociando') && o.validade && PP.diasEntre(o.validade, PP.hoje()) > 7) {
      o.status = 'expirado'; mudou++;
    }
  });
  if (mudou) PP.save('orcamentos');
  return mudou;
};

PP.on('buscaOrc', PP.debounce((d, el) => { fOrc.q = el.value; PP.resetPagina('orcamentos'); PP.render(); }, 250));
PP.on('filtroOrc', (d, el) => { fOrc[d.f] = el.value; PP.resetPagina('orcamentos'); PP.render(); });

/* ============================== CONSTRUTOR DE ORÇAMENTO ============================== */

let ED = null;   /* orçamento em edição */

PP.on('novoOrc', () => abrirEditor(null, {}));
PP.on('orcDoLead', d => {
  const l = PP.lead(d.id);
  PP.closeAll();
  const itens = [];
  if (l.produtoId) {
    const p = PP.prod(l.produtoId);
    if (p) itens.push({ produtoId:p.id, nome:p.nome, qtd:1, preco:PP.n(p.preco), custo:PP.n(p.custo) });
    const inst = PP.all('produtos').find(x => x.sku === 'SRV-INS-PAD');
    if (inst) itens.push({ produtoId:inst.id, nome:inst.nome, qtd:1, preco:PP.n(inst.preco), custo:PP.n(inst.custo) });
  }
  const cli = PP.all('clientes').find(c => c.leadId === l.id);
  abrirEditor(null, { leadId:l.id, clienteId:cli ? cli.id : '', vendedorId:l.vendedorId, itens });
});
PP.on('orcDoCliente', d => {
  const c = PP.cli(d.id);
  PP.closeAll();
  abrirEditor(null, { clienteId:c.id, leadId:c.leadId || '' });
});
PP.on('editarOrc', d => { PP.closeAll(); abrirEditor(PP.find('orcamentos', d.id)); });

function abrirEditor(orc, base) {
  const cfg = PP.cfg();
  ED = orc ? JSON.parse(JSON.stringify(orc)) : Object.assign({
    id:'', numero:0, leadId:'', clienteId:'',
    vendedorId:(PP.where('vendedores', v => v.ativo)[0] || {}).id || '',
    data:PP.hoje(), validade:PP.addDias(PP.hoje(), PP.n(cfg.validadeProposta)),
    status:'rascunho', itens:[], descontoPct:0, obs:'',
    condicao:{ entrada:0, parcelas:1, juros:PP.n(cfg.jurosMes) }
  }, base || {});
  ED.itens = ED.itens || [];
  ED.condicao = ED.condicao || { entrada:0, parcelas:1, juros:PP.n(cfg.jurosMes) };

  PP.modal({
    title: orc ? `Orçamento #${orc.numero}` : 'Novo orçamento',
    sub: 'Monte a proposta: modelo, adicionais, serviços e condição de pagamento',
    size: 'xl',
    body: `<div id="edRoot">${htmlEditor()}</div>`,
    actions: [
      { txt:'Salvar orçamento', cls:'btn-primary', ic:'i-check', act:'orcSalvar' },
      { txt:'Ver proposta', ic:'i-print', act:'orcPreview' },
      { txt:'Cancelar', act:'fechar' }
    ]
  });
}

function htmlEditor() {
  const cfg = PP.cfg();
  const vends = PP.where('vendedores', v => v.ativo);
  const clientes = PP.all('clientes');
  const leads = PP.where('leads', l => l.etapa !== 'perdido');

  return `
  <div class="fgrid mb">
    <div class="f f-4">
      <label for="edCli">Cliente</label>
      <select class="inp" id="edCli" data-chg="orcCampo" data-k="clienteId">
        <option value="">— sem cliente cadastrado —</option>
        ${clientes.map(c => `<option value="${c.id}"${ED.clienteId === c.id ? ' selected' : ''}>${esc(c.nome)}</option>`).join('')}
      </select>
      <span class="hint">Se ainda for só um lead, deixe vazio e escolha o lead ao lado.</span>
    </div>
    <div class="f f-4">
      <label for="edLead">Lead vinculado</label>
      <select class="inp" id="edLead" data-chg="orcCampo" data-k="leadId">
        <option value="">— nenhum —</option>
        ${leads.map(l => `<option value="${l.id}"${ED.leadId === l.id ? ' selected' : ''}>${esc(l.nome)} (${esc(PP.etapa(l.etapa).nome)})</option>`).join('')}
      </select>
    </div>
    <div class="f f-4">
      <label for="edVend">Vendedor</label>
      <select class="inp" id="edVend" data-chg="orcCampo" data-k="vendedorId">
        ${vends.map(v => `<option value="${v.id}"${ED.vendedorId === v.id ? ' selected' : ''}>${esc(v.nome)}</option>`).join('')}
      </select>
    </div>
    <div class="f f-3">
      <label for="edData">Data</label>
      <input class="inp" id="edData" type="date" value="${esc(ED.data)}" data-chg="orcCampo" data-k="data">
    </div>
    <div class="f f-3">
      <label for="edVal">Validade</label>
      <input class="inp" id="edVal" type="date" value="${esc(ED.validade)}" data-chg="orcCampo" data-k="validade">
    </div>
    <div class="f f-3">
      <label for="edStat">Status</label>
      <select class="inp" id="edStat" data-chg="orcCampo" data-k="status">
        ${Object.keys(PP.STATUS_ORC).map(k => `<option value="${k}"${ED.status === k ? ' selected' : ''}>${esc(PP.STATUS_ORC[k].nome)}</option>`).join('')}
      </select>
    </div>
    <div class="f f-3">
      <label for="edDesc">Desconto (%)</label>
      <input class="inp" id="edDesc" type="number" step="0.5" min="0" max="100" value="${esc(ED.descontoPct)}" data-inp="orcDesconto">
      <span class="hint">Alçada: até ${PP.dec(cfg.descontoMaxPct, 0)}%</span>
    </div>
  </div>

  <fieldset class="fieldset mb">
    <legend>Catálogo — clique para adicionar</legend>
    ${catalogoHTML()}
  </fieldset>

  <div class="grid g-3-2">
    <div class="card">
      <div class="card-hd"><div><h3>Itens da proposta</h3></div>
        <select class="inp right" style="width:auto;margin-left:auto;max-width:240px" data-chg="orcAddSelect" aria-label="Adicionar item">
          <option value="">+ adicionar item…</option>
          ${PP.CATEGORIAS_PROD.map(cat => `<optgroup label="${esc(cat)}">${
            PP.where('produtos', p => p.categoria === cat && p.ativo).map(p => `<option value="${p.id}">${esc(p.nome)} — ${esc(PP.money0(p.preco))}</option>`).join('')
          }</optgroup>`).join('')}
        </select>
      </div>
      <div class="card-bd" id="edItens">${itensHTML()}</div>
    </div>
    <div class="stack">
      <div id="edTotais">${totaisHTML()}</div>
      <div class="card"><div class="card-bd">
        <div class="f"><label for="edObs">Observações da proposta</label>
        <textarea class="inp" id="edObs" rows="4" data-chg="orcCampo" data-k="obs" placeholder="Prazo de entrega, condições de acesso, itens não inclusos…">${esc(ED.obs || '')}</textarea></div>
      </div></div>
    </div>
  </div>`;
}

function catalogoHTML() {
  const piscinas = PP.where('produtos', p => p.categoria === 'Piscina' && p.ativo);
  return `<div class="cat-grid">${piscinas.map(p => {
    const sel = ED.itens.some(i => i.produtoId === p.id);
    const s = p.specs || {};
    /* disponibilidade: desconta o que já está preso em outras propostas vivas */
    const nesta = ED.id && PP.ORC_RESERVA.includes(ED.status)
      ? (PP.find('orcamentos', ED.id) || { itens:[] }).itens.filter(i => i.produtoId === p.id).reduce((a, i) => a + PP.n(i.qtd), 0) : 0;
    const disp = p.controlaEstoque ? PP.disponivel(p.id) + nesta : null;
    const aviso = disp !== null && disp <= 0;
    return `<button type="button" class="cat-card ${sel ? 'on' : ''}" data-act="orcAddProd" data-id="${p.id}">
      <div class="cat-vis">${desenhoPiscina(s)}</div>
      <div class="cat-bd">
        <div class="nm">${esc(p.nome.replace('Piscina ', ''))}</div>
        <div class="dim">${PP.dec(s.compr, 2)} × ${PP.dec(s.larg, 2)} × ${PP.dec(s.prof, 2)} m · ${PP.dec(s.volume, 1)} mil L</div>
        <div class="pr">${esc(PP.money0(p.preco))}</div>
        <div class="tiny" style="margin-top:4px">${p.controlaEstoque
          ? (aviso
            ? '<span class="badge b-dang">sem unidade livre</span>'
            : `<span class="badge ${disp <= 1 ? 'b-warn' : 'b-ok'}">${disp} disponível</span>`)
          : '<span class="badge b-areia">sob encomenda</span>'}</div>
      </div>
    </button>`;
  }).join('')}</div>`;
}

function desenhoPiscina(s) {
  const r = PP.n(s.larg) / Math.max(PP.n(s.compr), 1);
  const w = 118, h = Math.max(w * r, 26);
  return `<svg viewBox="0 0 140 92" preserveAspectRatio="xMidYMid meet">
    <rect x="${(140 - w) / 2}" y="${(92 - h) / 2}" width="${w}" height="${h}" rx="9"
      fill="#6FD3D8" fill-opacity=".45" stroke="#0E7C86" stroke-width="2"/>
    <path d="M${(140 - w) / 2 + 8} ${46} q 9 -5 18 0 t 18 0 t 18 0 t 18 0 t 18 0"
      fill="none" stroke="#0E7C86" stroke-width="1.6" stroke-linecap="round" opacity=".55"/>
  </svg>`;
}

function itensHTML() {
  if (!ED.itens.length) return '<div class="empty-sm">Nenhum item. Escolha um modelo no catálogo acima.</div>';
  return `<div class="itens">
    <div class="item-row tiny faint" style="font-weight:700;text-transform:uppercase;letter-spacing:.06em">
      <span>Item</span><span class="tr">Qtd</span><span class="tr">Preço un.</span><span class="tr it-tot">Total</span><span></span>
    </div>
    ${ED.itens.map((it, i) => `
      <div class="item-row">
        <div style="min-width:0">
          <div class="b" style="font-size:13px">${esc(it.nome)}</div>
          <div class="tiny faint">custo ${esc(PP.money0(it.custo))} · margem ${PP.dec(it.preco ? (it.preco - it.custo) / it.preco * 100 : 0, 0)}%</div>
        </div>
        <input class="inp" type="number" min="0" step="0.5" value="${esc(it.qtd)}" data-inp="orcItem" data-i="${i}" data-k="qtd" aria-label="Quantidade de ${esc(it.nome)}">
        <input class="inp inp-money" type="text" inputmode="decimal" value="${esc(PP.dec(it.preco))}" data-inp="orcItem" data-i="${i}" data-k="preco" aria-label="Preço de ${esc(it.nome)}">
        <div class="tr b it-tot tnum" data-tot="${i}">${esc(PP.money(PP.n(it.qtd) * PP.n(it.preco)))}</div>
        <button class="icon-btn rm" data-act="orcRmItem" data-i="${i}" aria-label="Remover ${esc(it.nome)}"><svg class="ic ic-sm"><use href="#i-lixo"/></svg></button>
      </div>`).join('')}
  </div>`;
}

function totaisHTML() {
  const sub = PP.orcSub(ED);
  const desc = PP.orcDesc(ED);
  const tot = sub - desc;
  const custo = PP.orcCusto(ED);
  const margem = tot ? (tot - custo) / tot * 100 : 0;
  const c = ED.condicao;
  const entrada = Math.min(PP.n(c.entrada), tot);
  const saldo = tot - entrada;
  const nP = Math.max(PP.n(c.parcelas), 1);
  const juros = PP.n(c.juros);
  const parcela = juros > 0 ? PP.pmt(saldo, juros, nP) : saldo / nP;
  const totalFin = entrada + parcela * nP;
  const cfg = PP.cfg();

  return `
  <div class="card">
    <div class="card-hd"><div><h3>Resumo</h3></div></div>
    <div class="card-bd">
      <div class="tot-box mb">
        <div class="tot-line"><span class="muted">Subtotal</span><b class="tnum">${esc(PP.money(sub))}</b></div>
        <div class="tot-line"><span class="muted">Desconto (${PP.dec(ED.descontoPct, 1)}%)</span><b class="tnum" style="color:var(--dang)">− ${esc(PP.money(desc))}</b></div>
        <div class="tot-line big"><span>Total</span><span class="tnum">${esc(PP.money(tot))}</span></div>
      </div>
      ${PP.podeVerCusto() ? `<div class="row" style="justify-content:space-between">
        <span class="small muted">Custo ${esc(PP.money0(custo))}</span>
        ${PP.badge('Margem ' + PP.dec(margem, 1) + '%', margem >= 40 ? 'b-ok' : margem >= 25 ? 'b-warn' : 'b-dang')}
      </div>` : ''}
      ${PP.n(ED.descontoPct) > PP.n(cfg.descontoMaxPct) ? `<div class="alert ${PP.ehGestor() ? 'a-warn' : 'a-dang'} mt">
        <svg class="ic"><use href="#i-alerta"/></svg>
        <div>${PP.ehGestor()
          ? `Desconto acima da alçada de ${PP.dec(cfg.descontoMaxPct, 0)}%. Como gestor, você pode salvar assim mesmo — fica registrado no seu nome.`
          : `Desconto acima da alçada de ${PP.dec(cfg.descontoMaxPct, 0)}%. Ao salvar, a proposta vai para <b>aprovação do gerente</b> e não pode ser enviada antes da liberação.`}</div></div>` : ''}
      ${faltaEstoque().length ? `<div class="alert a-warn mt"><svg class="ic"><use href="#i-estoque"/></svg>
        <div><b>Sem unidade livre em estoque:</b> ${esc(faltaEstoque().map(x => x.nome).join(', '))}. Dá para vender, mas é preciso comprar do fornecedor — confirme o prazo antes de prometer a data.</div></div>` : ''}
    </div>
    <div class="card-hd" style="border-top:1px solid var(--line)"><div><h3>Condição de pagamento</h3></div></div>
    <div class="card-bd">
      <div class="fgrid">
        <div class="f f-6"><label for="edEnt">Entrada (R$)</label>
          <input class="inp inp-money" id="edEnt" type="text" inputmode="decimal" value="${esc(PP.dec(c.entrada))}" data-inp="orcCond" data-k="entrada"></div>
        <div class="f f-6"><label for="edParc">Parcelas</label>
          <input class="inp" id="edParc" type="number" min="1" max="${PP.n(cfg.parcelasMax)}" value="${esc(nP)}" data-inp="orcCond" data-k="parcelas"></div>
        <div class="f f-6"><label for="edJur">Juros a.m. (%)</label>
          <input class="inp" id="edJur" type="number" step="0.01" min="0" value="${esc(juros)}" data-inp="orcCond" data-k="juros"></div>
        <div class="f f-6"><label>Parcela</label>
          <div style="padding:9px 0"><b style="font-size:17px;color:var(--teal-2)">${esc(PP.money(parcela))}</b></div></div>
      </div>
      <div class="tot-box">
        <div class="tot-line"><span class="muted">Entrada</span><span class="tnum">${esc(PP.money(entrada))}</span></div>
        <div class="tot-line"><span class="muted">${nP}× de</span><span class="tnum">${esc(PP.money(parcela))}</span></div>
        <div class="tot-line"><span class="muted">Total financiado</span><span class="tnum">${esc(PP.money(totalFin))}</span></div>
        ${totalFin > tot + 0.5 ? `<div class="tot-line"><span class="muted">Custo do crédito</span><span class="tnum" style="color:var(--warn)">+ ${esc(PP.money(totalFin - tot))}</span></div>` : ''}
      </div>
    </div>
  </div>`;
}

/** Itens do orçamento que não têm unidade livre em estoque hoje. */
function faltaEstoque() {
  const jaMeu = ED.id && PP.ORC_RESERVA.includes(ED.status)
    ? (PP.find('orcamentos', ED.id) || { itens:[] }).itens : [];
  return ED.itens.filter(i => {
    const p = PP.prod(i.produtoId);
    if (!p || !p.controlaEstoque) return false;
    const meu = jaMeu.filter(x => x.produtoId === i.produtoId).reduce((a, x) => a + PP.n(x.qtd), 0);
    return PP.disponivel(p.id) + meu < PP.n(i.qtd);
  });
}

function repintarItens() {
  const el = document.getElementById('edItens');
  if (el) el.innerHTML = itensHTML();
  repintarTotais();
  const cat = document.querySelector('.cat-grid');
  if (cat) cat.outerHTML = catalogoHTML();
}
function repintarTotais() {
  const el = document.getElementById('edTotais');
  if (el) el.innerHTML = totaisHTML();
}

PP.on('orcCampo', (d, el) => {
  ED[d.k] = el.value;
  if (d.k === 'clienteId' && el.value) {
    const c = PP.cli(el.value);
    if (c && c.leadId && !ED.leadId) ED.leadId = c.leadId;
  }
});
PP.on('orcDesconto', (d, el) => { ED.descontoPct = PP.n(el.value); repintarTotais(); });
PP.on('orcCond', (d, el) => {
  ED.condicao[d.k] = d.k === 'entrada' ? PP.parseMoney(el.value) : PP.n(el.value);
  repintarTotais();
});
PP.on('orcItem', (d, el) => {
  const it = ED.itens[PP.n(d.i)];
  if (!it) return;
  it[d.k] = d.k === 'preco' ? PP.parseMoney(el.value) : PP.n(el.value);
  const tot = document.querySelector(`[data-tot="${d.i}"]`);
  if (tot) tot.textContent = PP.money(PP.n(it.qtd) * PP.n(it.preco));
  repintarTotais();
});
PP.on('orcRmItem', d => { ED.itens.splice(PP.n(d.i), 1); repintarItens(); });
PP.on('orcAddProd', d => addProduto(d.id));
PP.on('orcAddSelect', (d, el) => { if (el.value) { addProduto(el.value); el.value = ''; } });

function addProduto(id) {
  const p = PP.prod(id);
  if (!p) return;
  const ex = ED.itens.findIndex(i => i.produtoId === id);
  if (ex >= 0) {
    if (p.categoria === 'Piscina') { ED.itens.splice(ex, 1); repintarItens(); return; }
    ED.itens[ex].qtd = PP.n(ED.itens[ex].qtd) + 1;
  } else {
    ED.itens.push({ produtoId:p.id, nome:p.nome, qtd:1, preco:PP.n(p.preco), custo:PP.n(p.custo) });
    /* ao escolher uma piscina, já sugere a instalação */
    if (p.categoria === 'Piscina' && !ED.itens.some(i => i.produtoId === 'sv1')) {
      const inst = PP.all('produtos').find(x => x.sku === 'SRV-INS-PAD');
      if (inst) ED.itens.push({ produtoId:inst.id, nome:inst.nome, qtd:1, preco:PP.n(inst.preco), custo:PP.n(inst.custo) });
    }
  }
  repintarItens();
}

PP.on('orcSalvar', () => {
  if (!ED.itens.length) return PP.toast('Adicione ao menos um item', 'err');
  if (!ED.clienteId && !ED.leadId) return PP.toast('Vincule a um cliente ou lead', 'err');
  const cfg = PP.cfg();
  const novo = !ED.id;
  if (novo) ED.numero = PP.proximoNumero('proximoNumOrc');

  /* ---- alçada de desconto: trava de verdade, não é só aviso ---- */
  const foraDaAlcada = PP.n(ED.descontoPct) > PP.n(cfg.descontoMaxPct);
  if (foraDaAlcada && cfg.exigirAprovacaoDesconto && !PP.ehGestor()) {
    if (ED.status !== 'aprovacao' && ED.status !== 'aprovado') {
      ED.status = 'aprovacao';
      ED.pedidoAlcadaPor = PP.usuario().nome;
      ED.pedidoAlcadaEm = PP.agora();
      ED.aprovadoPor = ''; ED.aprovadoEm = '';
      PP.toast('Desconto acima da alçada — enviado para aprovação do gerente', 'warn');
    }
  } else if (foraDaAlcada && PP.ehGestor()) {
    ED.aprovadoPor = PP.usuario().nome;
    ED.aprovadoEm = PP.agora();
  } else if (!foraDaAlcada && ED.status === 'aprovacao') {
    ED.status = 'rascunho';   /* baixou o desconto: destrava sozinho */
  }

  const id = PP.upsert('orcamentos', ED);
  if (ED.leadId) {
    const l = PP.lead(ED.leadId);
    if (l && PP.ETAPAS_ATIVAS.includes(l.etapa)) {
      const idx = PP.ETAPAS.findIndex(e => e.id === l.etapa);
      if (idx < 3) { l.etapa = 'proposta'; PP.save('leads'); }
    }
    PP.interagir(ED.leadId, 'Proposta', `Orçamento #${ED.numero} ${novo ? 'criado' : 'atualizado'} — ${PP.money(PP.orcTotal(ED))}.`, 'Sistema');
  }
  PP.closeTop();
  PP.toast(novo ? `Orçamento #${ED.numero} criado` : 'Orçamento atualizado', 'ok');
  PP.render();
  abrirOrc(id);
});

PP.on('orcPreview', () => {
  if (!ED.itens.length) return PP.toast('Adicione itens antes de gerar a proposta', 'err');
  PP.imprimir(propostaHTML(ED), `Proposta #${ED.numero || 'rascunho'}`);
});

/* ============================== DRAWER DO ORÇAMENTO ============================== */

PP.on('abrirOrc', d => abrirOrc(d.id));

function abrirOrc(id) {
  const o = PP.find('orcamentos', id);
  if (!o) return PP.toast('Orçamento não encontrado', 'err');
  const st = PP.STATUS_ORC[o.status];
  const ped = PP.pedidoDoOrc(o.id);
  const c = o.condicao || {};
  const tot = PP.orcTotal(o);
  const saldo = tot - PP.n(c.entrada);
  const nP = Math.max(PP.n(c.parcelas), 1);
  const parcela = PP.n(c.juros) > 0 ? PP.pmt(saldo, c.juros, nP) : saldo / nP;

  const foraAlcada = PP.n(o.descontoPct) > PP.n(PP.cfg().descontoMaxPct);

  const body = `
    <div class="row mb" style="gap:7px">
      ${PP.badge(st.nome, st.cls)}
      ${o.validade < PP.hoje() && (o.status === 'enviado' || o.status === 'negociando') ? PP.badge('Validade vencida', 'b-dang') : ''}
      ${ped ? PP.badge(`Pedido #${ped.numero}`, 'b-ink') : ''}
      ${PP.ORC_RESERVA.includes(o.status) ? PP.badge('Reservando estoque', 'b-teal') : ''}
    </div>

    ${o.status === 'aprovacao' ? `<div class="alert a-dang mb"><svg class="ic"><use href="#i-alerta"/></svg>
      <div><b>Travado na alçada.</b> Desconto de ${PP.dec(o.descontoPct, 1)}% (limite ${PP.dec(PP.cfg().descontoMaxPct, 0)}%),
      pedido por ${esc(o.pedidoAlcadaPor || '—')} em ${esc(PP.dtHora(o.pedidoAlcadaEm))}.
      ${PP.ehGestor() ? 'Libere ou devolva usando os botões abaixo.' : 'Aguardando decisão do gerente.'}</div></div>` : ''}

    ${o.aprovadoPor && foraAlcada ? `<div class="alert a-ok mb"><svg class="ic"><use href="#i-check"/></svg>
      <div>Desconto de ${PP.dec(o.descontoPct, 1)}% liberado por <b>${esc(o.aprovadoPor)}</b> em ${esc(PP.dtHora(o.aprovadoEm))}.</div></div>` : ''}

    <div class="card mb"><div class="card-bd">
      <dl class="dl">
        <dt>Cliente / lead</dt><dd><b>${esc(nomeDoOrc(o))}</b></dd>
        <dt>Vendedor</dt><dd>${esc(PP.vendNome(o.vendedorId))}</dd>
        <dt>Emissão</dt><dd>${esc(PP.dt(o.data))}</dd>
        <dt>Validade</dt><dd>${esc(PP.dt(o.validade))}</dd>
        <dt>Margem</dt><dd>${PP.dec(PP.orcMargem(o), 1)}% (custo ${esc(PP.money0(PP.orcCusto(o)))})</dd>
      </dl>
    </div></div>

    <div class="card mb">
      <div class="card-hd"><div><h3>Itens</h3></div></div>
      ${PP.tabela({ rows:o.itens, cols:[
        { h:'Descrição', r:i => `<span class="small">${esc(i.nome)}</span>` },
        { h:'Qtd', cls:'num', r:i => PP.dec(i.qtd, PP.n(i.qtd) % 1 ? 2 : 0) },
        { h:'Unit.', cls:'num', r:i => esc(PP.money(i.preco)) },
        { h:'Total', cls:'num', r:i => `<b>${esc(PP.money(PP.n(i.qtd) * PP.n(i.preco)))}</b>` }
      ]})}
      <div class="card-ft" style="justify-content:flex-end">
        <div class="tot-box" style="min-width:250px;background:transparent;border:0;padding:0">
          <div class="tot-line"><span class="muted">Subtotal</span><span class="tnum">${esc(PP.money(PP.orcSub(o)))}</span></div>
          ${o.descontoPct ? `<div class="tot-line"><span class="muted">Desconto ${PP.dec(o.descontoPct, 1)}%</span><span class="tnum" style="color:var(--dang)">− ${esc(PP.money(PP.orcDesc(o)))}</span></div>` : ''}
          <div class="tot-line big"><span>Total</span><span class="tnum">${esc(PP.money(tot))}</span></div>
        </div>
      </div>
    </div>

    <div class="card mb">
      <div class="card-hd"><div><h3>Condição de pagamento</h3></div></div>
      <div class="card-bd">
        <dl class="dl">
          <dt>Entrada</dt><dd>${esc(PP.money(c.entrada))}</dd>
          <dt>Parcelamento</dt><dd><b>${nP}× de ${esc(PP.money(parcela))}</b>${PP.n(c.juros) ? ` <span class="faint small">(juros ${PP.dec(c.juros, 2)}% a.m.)</span>` : ' <span class="faint small">(sem juros)</span>'}</dd>
          <dt>Total a prazo</dt><dd>${esc(PP.money(PP.n(c.entrada) + parcela * nP))}</dd>
        </dl>
      </div>
    </div>

    ${o.obs ? `<div class="card"><div class="card-hd"><div><h3>Observações</h3></div></div><div class="card-bd small muted" style="white-space:pre-wrap">${esc(o.obs)}</div></div>` : ''}`;

  const acoes = [{ txt:'Proposta em PDF', cls:'btn-teal', ic:'i-print', act:'imprimirOrc', data:{ id:o.id } }];
  if (o.status !== 'aprovacao') acoes.push({ txt:'Enviar por WhatsApp', cls:'btn-ok', ic:'i-wpp', act:'waProposta', data:{ id:o.id } });
  if (o.status === 'aprovacao' && PP.ehGestor()) {
    acoes.push({ txt:'Liberar desconto', cls:'btn-ok', ic:'i-check', act:'liberarAlcada', data:{ id:o.id } });
    acoes.push({ txt:'Devolver ao vendedor', cls:'btn-dang', act:'negarAlcada', data:{ id:o.id } });
  }
  if (o.status === 'rascunho') acoes.push({ txt:'Marcar enviado', ic:'i-check', act:'statusOrc', data:{ id:o.id, s:'enviado' } });
  if (o.status === 'enviado' || o.status === 'negociando' || o.status === 'expirado') {
    acoes.push({ txt:'Aprovar e gerar pedido', cls:'btn-ok', ic:'i-check', act:'aprovarOrc', data:{ id:o.id } });
    acoes.push({ txt:'Recusado', cls:'btn-dang', act:'statusOrc', data:{ id:o.id, s:'recusado' } });
  }
  if (o.status === 'aprovado' && !ped) acoes.push({ txt:'Gerar pedido', cls:'btn-ok', ic:'i-pedido', act:'gerarPedido', data:{ id:o.id } });
  if (ped) acoes.push({ txt:`Abrir pedido #${ped.numero}`, ic:'i-pedido', act:'abrirPedido', data:{ id:ped.id } });
  acoes.push({ txt:'Duplicar', ic:'i-copia', act:'duplicarOrc', data:{ id:o.id } });
  if (!ped) acoes.push({ txt:'Editar', ic:'i-edit', act:'editarOrc', data:{ id:o.id } });
  acoes.push({ txt:'Excluir', act:'excluirOrc', data:{ id:o.id } });

  PP.drawer({ title:`Orçamento #${o.numero}`, sub:`${nomeDoOrc(o)} · ${PP.money(tot)}`, body, actions:acoes, wide:true });
}
PP.abrirOrc = abrirOrc;

PP.on('imprimirOrc', d => PP.imprimir(propostaHTML(PP.find('orcamentos', d.id)), `Proposta #${PP.find('orcamentos', d.id).numero}`));

PP.on('statusOrc', d => {
  const o = PP.find('orcamentos', d.id);
  o.status = d.s;
  PP.save('orcamentos');
  if (o.leadId) PP.interagir(o.leadId, 'Proposta', `Orçamento #${o.numero} marcado como "${PP.STATUS_ORC[d.s].nome}".`, 'Sistema');
  if (d.s === 'recusado' && o.leadId) {
    const l = PP.lead(o.leadId);
    if (l && PP.ETAPAS_ATIVAS.includes(l.etapa)) { l.etapa = 'negociacao'; PP.save('leads'); }
  }
  PP.closeAll(); PP.toast('Status atualizado', 'ok'); PP.render();
});

PP.on('liberarAlcada', async d => {
  const o = PP.find('orcamentos', d.id);
  if (!PP.ehGestor()) return PP.toast('Só gerente ou administrador libera desconto', 'err');
  if (!await PP.confirmar(
    `Liberar ${PP.dec(o.descontoPct, 1)}% de desconto na proposta #${o.numero}?\n\nIsso reduz ${PP.money(PP.orcDesc(o))} do valor cheio.`,
    { title:'Aprovar desconto', okTxt:'Liberar' })) return;
  o.status = 'enviado';
  o.aprovadoPor = PP.usuario().nome;
  o.aprovadoEm = PP.agora();
  PP.save('orcamentos');
  if (o.leadId) PP.interagir(o.leadId, 'Proposta', `Desconto de ${PP.dec(o.descontoPct, 1)}% liberado por ${o.aprovadoPor}.`, 'Sistema');
  PP.closeAll(); PP.toast('Desconto liberado — proposta pronta para envio', 'ok'); PP.render();
});

PP.on('negarAlcada', async d => {
  const o = PP.find('orcamentos', d.id);
  if (!PP.ehGestor()) return PP.toast('Só gerente ou administrador decide alçada', 'err');
  const motivo = await PP.perguntar('Por que está devolvendo? (o vendedor vê essa mensagem)', {
    title:'Devolver ao vendedor', multi:true, valor:`Desconto máximo autorizado: ${PP.dec(PP.cfg().descontoMaxPct, 0)}%.`
  });
  if (!motivo) return;
  o.status = 'rascunho';
  o.obs = (o.obs ? o.obs + '\n\n' : '') + `[Alçada negada por ${PP.usuario().nome} em ${PP.dt(PP.hoje())}] ${motivo}`;
  PP.save('orcamentos');
  PP.closeAll(); PP.toast('Proposta devolvida ao vendedor'); PP.render();
});

PP.on('duplicarOrc', d => {
  const o = PP.find('orcamentos', d.id);
  const copia = JSON.parse(JSON.stringify(o));
  delete copia.id;
  copia.numero = PP.proximoNumero('proximoNumOrc');
  copia.data = PP.hoje();
  copia.validade = PP.addDias(PP.hoje(), PP.n(PP.cfg().validadeProposta));
  copia.status = 'rascunho';
  const id = PP.upsert('orcamentos', copia);
  PP.closeAll(); PP.toast(`Orçamento #${copia.numero} criado por cópia`, 'ok'); PP.render(); abrirOrc(id);
});

PP.on('excluirOrc', async d => {
  const o = PP.find('orcamentos', d.id);
  if (!await PP.confirmarExclusao('orcamento', d.id, `Orçamento #${o.numero}`, {
    msg:`Excluir o orçamento #${o.numero}? Essa ação não pode ser desfeita.`,
    alternativa:'Marque como recusado em vez de apagar — a taxa de aprovação nos relatórios depende desse histórico.'
  })) return;
  PP.remove('orcamentos', d.id);
  PP.closeAll(); PP.toast('Orçamento excluído'); PP.render();
});

/* ============================== APROVAÇÃO → PEDIDO ============================== */

PP.on('aprovarOrc', d => aprovarOrc(d.id));
PP.on('gerarPedido', d => aprovarOrc(d.id));

async function aprovarOrc(id) {
  const o = PP.find('orcamentos', id);
  if (!o) return;
  if (PP.pedidoDoOrc(id)) return PP.toast('Esse orçamento já virou pedido.', 'warn');
  if (o.status === 'aprovacao') return PP.toast('O desconto ainda não foi liberado pelo gerente.', 'err');

  const falta = o.itens.filter(i => {
    const p = PP.prod(i.produtoId);
    if (!p || !p.controlaEstoque) return false;
    const meu = PP.ORC_RESERVA.includes(o.status)
      ? o.itens.filter(x => x.produtoId === i.produtoId).reduce((a, x) => a + PP.n(x.qtd), 0) : 0;
    return PP.disponivel(p.id) + meu < PP.n(i.qtd);
  });

  const ok = await PP.confirmar(
    `Aprovar o orçamento #${o.numero} (${PP.money(PP.orcTotal(o))}) e gerar o pedido de venda?`,
    { title:'Fechar venda', okTxt:'Aprovar e gerar',
      aviso: falta.length
        ? `Atenção: ${falta.map(i => i.nome).join(', ')} vai ficar com estoque negativo. Gere um pedido de compra antes de prometer a data de instalação.`
        : 'Isso cria o pedido, abre a obra, lança as parcelas no financeiro, registra a comissão e baixa o estoque dos itens.' });
  if (!ok) return;

  PP.toast('Processando venda no servidor…');
  const r = PP.driver.nome === 'supabase'
    ? await PP.fecharVendaConfirmada('pedido', { orcamentoId:id, versao:o.atualizadoEm }, 'pedido:'+id)
    : PP.gerarPedido(id);
  PP.closeAll();
  PP.toast(`Pedido #${r.pedido.numero} gerado`, 'ok');
  PP.render();
  abrirPedido(r.pedido.id);
}

/**
 * Converte um orçamento aprovado em pedido + obra + financeiro + comissão + estoque.
 * Retorna {pedido, obra}.
 */
PP.gerarPedido = orcId => {
  const o = PP.find('orcamentos', orcId);
  const cfg = PP.cfg();
  /* O número vem ANTES de qualquer alteração: quem entrega é o banco e pode
     faltar. Falhando aqui, nada foi tocado; falhando no meio, sobraria um
     cliente criado e um lead marcado como ganho sem pedido nenhum. */
  const numero = PP.proximoNumero('proximoNumPedido');
  o.status = 'aprovado';
  PP.save('orcamentos');

  /* 1. garante cliente */
  let clienteId = o.clienteId;
  if (!clienteId && o.leadId) {
    const l = PP.lead(o.leadId);
    const ex = PP.all('clientes').find(c => c.leadId === l.id || PP.digitos(c.telefone) === PP.digitos(l.telefone));
    if (ex) clienteId = ex.id;
    else clienteId = PP.upsert('clientes', {
      nome:l.nome, tipo:'PF', doc:'', telefone:l.telefone, email:l.email || '',
      cep:'', endereco:'', bairro:l.bairro || '', cidade:l.cidade || '', uf:'',
      leadId:l.id, obs:l.obs || '', criadoEm:PP.agora()
    });
    o.clienteId = clienteId;
    PP.save('orcamentos');
  }

  /* 2. lead vira "ganho" */
  if (o.leadId) {
    const l = PP.lead(o.leadId);
    if (l && l.etapa !== 'ganho') { l.etapa = 'ganho'; l.atualizadoEm = PP.agora(); PP.save('leads'); }
    PP.interagir(o.leadId, 'Ganho', `Orçamento #${o.numero} aprovado. Venda fechada.`, 'Sistema');
  }

  /* 3. pedido — com FOTO do estado financeiro no momento da venda.
     Documento emitido não pode mudar porque o cadastro ou o orçamento mudou depois. */
  const cli = PP.cli(clienteId) || {};
  const totalVenda = PP.cent(PP.orcTotal(o));
  const custoVenda = PP.cent(PP.orcCusto(o));
  const pedidoId = PP.upsert('pedidos', {
    numero, orcamentoId:o.id, clienteId, vendedorId:o.vendedorId, data:PP.hoje(),
    status:'aberto', obraId:'', formaPag:PP.n(o.condicao.parcelas) > 1 ? 'Financiamento' : 'PIX', obs:'',
    /* snapshot imutável */
    total: totalVenda,
    custo: custoVenda,
    subtotal: PP.cent(PP.orcSub(o)),
    descontoPct: PP.n(o.descontoPct),
    descontoValor: PP.cent(PP.orcDesc(o)),
    itens: JSON.parse(JSON.stringify(o.itens)),
    condicao: JSON.parse(JSON.stringify(o.condicao || {}))
  });

  /* 4. obra */
  const obraId = PP.upsert('obras', {
    pedidoId, clienteId, status:'aguardando', dataAgendada:'', dataConclusao:'',
    endereco:[cli.endereco, cli.bairro].filter(Boolean).join(' — '), cidade:cli.cidade || '',
    responsavel:'', equipeObraId:'', duracaoDias:3,
    custoPrevisto:PP.orcCusto(o), custoReal:0,
    checklist:PP.CHECKLIST_OBRA.map(() => false),
    notas:[{ data:PP.agora(), texto:`Obra aberta a partir do pedido #${numero}.`, autor:'Sistema' }]
  });
  const ped = PP.find('pedidos', pedidoId);
  ped.obraId = obraId;
  PP.save('pedidos');

  /* 5. financeiro — a receber.
     Valores fechados em centavos: a diferença de arredondamento vai para a última
     parcela, então a soma dos lançamentos bate exatamente com o contratado. */
  const tot = totalVenda;
  const c = o.condicao || { entrada:0, parcelas:1, juros:0 };
  const entrada = PP.cent(Math.min(PP.n(c.entrada), tot));
  const nP = Math.max(PP.n(c.parcelas), 1);
  const valores = PP.parcelar(tot - entrada, nP, c.juros);

  if (entrada > 0) {
    PP.upsert('financeiro', {
      tipo:'receber', descricao:`Entrada — Pedido #${numero}`, categoria:'Venda de piscina',
      valor:entrada, vencimento:PP.hoje(), status:'aberto', pagoEm:'', formaPag:'PIX',
      clienteId, origem:{ tipo:'pedido', id:pedidoId }, parcela:0, parcelas:nP, obs:''
    });
  }
  valores.forEach((valor, idx) => {
    const i = idx + 1;
    PP.upsert('financeiro', {
      tipo:'receber', descricao:`Parcela ${i}/${nP} — Pedido #${numero}`, categoria:'Venda de piscina',
      valor, vencimento:PP.addMeses(PP.hoje(), entrada > 0 ? i : i - 1),
      status:'aberto', pagoEm:'', formaPag:ped.formaPag,
      clienteId, origem:{ tipo:'pedido', id:pedidoId }, parcela:i, parcelas:nP, obs:''
    });
  });

  /* 6. financeiro — a pagar (custo do produto e da obra) */
  const custo = custoVenda;
  if (custo > 0) {
    PP.upsert('financeiro', {
      tipo:'pagar', descricao:`Custo de produto — Pedido #${numero}`, categoria:'Compra de piscina',
      valor:PP.cent(custo * 0.62), vencimento:PP.addDias(PP.hoje(), 30), status:'aberto', pagoEm:'', formaPag:'Boleto',
      fornecedorId:'fo1', origem:{ tipo:'pedido', id:pedidoId }, parcela:1, parcelas:1, obs:''
    });
    PP.upsert('financeiro', {
      tipo:'pagar', descricao:`Mão de obra e escavação — Pedido #${numero}`, categoria:'Mão de obra',
      valor:PP.cent(custo * 0.24), vencimento:PP.addDias(PP.hoje(), 15), status:'aberto', pagoEm:'', formaPag:'Transferência',
      origem:{ tipo:'pedido', id:pedidoId }, parcela:1, parcelas:1, obs:''
    });
  }

  /* 7. comissão — percentual ou por metro de piscina, conforme a configuração */
  const v = PP.vend(o.vendedorId);
  PP.upsert('comissoes', Object.assign({
    vendedorId:o.vendedorId, pedidoId, clienteId,
    competencia:PP.mesKey(PP.hoje()), status:'prevista', pagoEm:''
  }, PP.calcComissao({
    itens:o.itens, faturamento:tot, custo, vendedorId:o.vendedorId,
    pct: v ? PP.n(v.comissaoPct) : PP.n(cfg.comissaoPct)
  })));

  /* 8. estoque */
  o.itens.forEach(it => {
    const p = PP.prod(it.produtoId);
    if (!p || !p.controlaEstoque) return;
    p.estoque = PP.n(p.estoque) - PP.n(it.qtd);
    PP.upsert('estoqueMov', {
      produtoId:p.id, tipo:'saida', qtd:PP.n(it.qtd), data:PP.hoje(),
      motivo:`Pedido #${numero}`, ref:pedidoId
    });
  });
  PP.save('produtos');

  return { pedido:PP.find('pedidos', pedidoId), obra:PP.find('obras', obraId) };
};

/* ============================== PEDIDOS DE VENDA ============================== */

const fPed = { status:'' };

PP.view('pedidos', {
  titulo: 'Pedidos de venda',
  sub: () => `${PP.escopo(PP.where('pedidos', p => p.status !== 'cancelado')).length} pedidos ativos`,
  render() {
    let rows = PP.escopo(PP.all('pedidos')).slice();
    if (fPed.status) rows = rows.filter(p => p.status === fPed.status);
    rows = PP.sortBy(rows, 'numero', 'desc');
    const pag = PP.paginar('pedidos', rows);

    const validos = PP.escopo(PP.where('pedidos', p => p.status !== 'cancelado'));
    const fat = PP.soma(validos, PP.pedidoTotal);
    const custo = PP.soma(validos, PP.pedidoCusto);

    return `
      <div class="kpis mb">
        ${PP.kpi({ cls:'k-teal', lbl:'Faturamento total', val:PP.money0(fat), sm:true, foot:`${validos.length} pedidos` })}
        ${PP.kpi({ lbl:'Ticket médio', val:PP.money0(validos.length ? fat / validos.length : 0), sm:true })}
        ${PP.podeVerCusto()
          ? PP.kpi({ cls:'k-ok', lbl:'Margem bruta', val:PP.money0(fat - custo), sm:true, foot:PP.pct(fat ? (fat - custo) / fat * 100 : 0, 1) })
          : PP.kpi({ cls:'k-ok', lbl:'Concluídos', val:String(validos.filter(p => p.status === 'concluido').length), foot:'venda paga e entregue' })}
        ${PP.kpi({ cls:'k-warn', lbl:'Em produção/aberto', val:String(validos.filter(p => p.status === 'aberto' || p.status === 'producao').length) })}
      </div>

      <div class="toolbar">
        <div class="seg">
          <button class="${!fPed.status ? 'on' : ''}" data-act="filtroPed" data-s="">Todos</button>
          ${Object.keys(PP.STATUS_PEDIDO).map(k => `<button class="${fPed.status === k ? 'on' : ''}" data-act="filtroPed" data-s="${k}">${esc(PP.STATUS_PEDIDO[k].nome)}</button>`).join('')}
        </div>
        <div class="row-end row">
          <button class="btn" data-act="exportarPedidos"><svg class="ic"><use href="#i-down"/></svg>CSV</button>
        </div>
      </div>

      <div class="card">
        ${rows.length ? PP.tabela({
          act:'abrirPedido', rows:pag.linhas,
          cols:[
            { h:'Nº', w:'92px', r:p => `<b>#${p.numero}</b><span class="mini">${esc(PP.dt(p.data))}</span>` },
            { h:'Cliente', r:p => `<div class="strong">${esc(PP.cliNome(p.clienteId))}</div><span class="mini">Orç. #${(PP.orcDoPedido(p) || {}).numero || '—'}</span>` },
            { h:'Vendedor', r:p => `<span class="small">${esc(PP.vendNome(p.vendedorId).split(' ')[0])}</span>` },
            { h:'Obra', r:p => { const ob = PP.find('obras', p.obraId); return ob ? PP.badge(PP.STATUS_OBRA[ob.status].nome, PP.STATUS_OBRA[ob.status].cls) : '<span class="faint small">—</span>'; } },
            { h:'Pagamento', r:p => `<span class="small">${esc(p.formaPag || '—')}</span>` },
            { h:'Status', r:p => PP.badge(PP.statusPedidoNome(p.status), PP.statusPedidoCls(p.status)) },
            { h:'Total', cls:'num', r:p => `<b>${esc(PP.money(PP.pedidoTotal(p)))}</b>` }
          ]
        }) + pag.html : PP.vazio('Nenhum pedido', 'Pedidos nascem da aprovação de um orçamento.')}
      </div>`;
  }
});

PP.on('filtroPed', d => { fPed.status = d.s; PP.resetPagina('pedidos'); PP.render(); });

PP.on('abrirPedido', d => abrirPedido(d.id));

function abrirPedido(id) {
  const p = PP.find('pedidos', id);
  if (!p) return PP.toast('Pedido não encontrado', 'err');
  const o = PP.orcDoPedido(p);
  const obra = PP.find('obras', p.obraId);
  const fin = PP.where('financeiro', f => f.origem && f.origem.id === p.id);
  const receber = fin.filter(f => f.tipo === 'receber');
  const recebido = PP.soma(receber.filter(f => f.status === 'pago'), 'valor');
  const aReceber = PP.soma(receber.filter(f => f.status === 'aberto'), 'valor');
  const com = PP.all('comissoes').find(c => c.pedidoId === p.id);
  const tot = PP.pedidoTotal(p);

  const body = `
    <div class="row mb" style="gap:7px">
      ${PP.badge(PP.statusPedidoNome(p.status), PP.statusPedidoCls(p.status))}
      ${obra ? PP.badge('Obra: ' + PP.STATUS_OBRA[obra.status].nome, PP.STATUS_OBRA[obra.status].cls) : ''}
    </div>

    <div class="kpis mb">
      ${PP.kpi({ cls:'k-teal', lbl:'Valor do pedido', val:PP.money0(tot), sm:true })}
      ${PP.kpi({ cls:'k-ok', lbl:'Recebido', val:PP.money0(recebido), sm:true, foot:PP.pct(tot ? recebido / tot * 100 : 0, 0) })}
      ${PP.kpi({ cls: aReceber ? 'k-warn' : '', lbl:'A receber', val:PP.money0(aReceber), sm:true })}
    </div>

    <div class="card mb"><div class="card-bd">
      <dl class="dl">
        <dt>Cliente</dt><dd><b>${esc(PP.cliNome(p.clienteId))}</b></dd>
        <dt>Vendedor</dt><dd>${esc(PP.vendNome(p.vendedorId))}</dd>
        <dt>Data</dt><dd>${esc(PP.dt(p.data))}</dd>
        <dt>Orçamento</dt><dd>#${o ? o.numero : '—'}</dd>
        <dt>Pagamento</dt><dd>${esc(p.formaPag || '—')}</dd>
        ${PP.podeVerCusto() ? `<dt>Custo previsto</dt><dd>${esc(PP.money(PP.pedidoCusto(p)))} <span class="faint small">(margem ${PP.dec(tot ? (tot - PP.pedidoCusto(p)) / tot * 100 : 0, 1)}%)</span></dd>` : ''}
        ${com ? `<dt>Comissão</dt><dd>${esc(PP.money(com.valor))} <span class="faint small">(${com.baseTipo === 'metro'
            ? `${esc(PP.money0(com.valorMetro))} × ${PP.dec(com.metros, 2)} m de piscina`
            : `${PP.dec(com.pct, 1)}% sobre ${esc(com.baseTipo === 'margem' ? 'a margem' : 'o faturamento')}`} · ${esc(com.status)})</span></dd>` : ''}
      </dl>
      ${p.obs ? `<div class="sep"></div><div class="small muted">${esc(p.obs)}</div>` : ''}
    </div></div>

    ${PP.pedidoItens(p).length ? `<div class="card mb">
      <div class="card-hd"><div><h3>Itens</h3><div class="sub">Como estavam no fechamento da venda</div></div></div>
      ${PP.tabela({ rows:PP.pedidoItens(p), cols:[
        { h:'Descrição', r:i => `<span class="small">${esc(i.nome)}</span>` },
        { h:'Qtd', cls:'num', r:i => PP.dec(i.qtd, PP.n(i.qtd) % 1 ? 2 : 0) },
        { h:'Unit.', cls:'num', r:i => esc(PP.money(i.preco)) },
        { h:'Total', cls:'num', r:i => `<b>${esc(PP.money(PP.n(i.qtd) * PP.n(i.preco)))}</b>` }
      ] })}
    </div>` : ''}

    <div class="card mb">
      <div class="card-hd"><div><h3>Parcelas</h3><div class="sub">Lançamentos a receber deste pedido</div></div></div>
      ${receber.length ? PP.tabela({ rows:PP.sortBy(receber, 'vencimento'), cols:[
        { h:'Descrição', r:f => `<span class="small">${esc(f.descricao)}</span>` },
        { h:'Vencimento', r:f => `<span class="small ${f.status === 'aberto' && f.vencimento < PP.hoje() ? 'b' : ''}" style="${f.status === 'aberto' && f.vencimento < PP.hoje() ? 'color:var(--dang)' : ''}">${esc(PP.dt(f.vencimento))}</span>` },
        { h:'Status', r:f => PP.badge(f.status === 'pago' ? 'Pago' : 'Aberto', f.status === 'pago' ? 'b-ok' : (f.vencimento < PP.hoje() ? 'b-dang' : 'b-warn')) },
        { h:'Valor', cls:'num', r:f => esc(PP.money(f.valor)) },
        { h:'', cls:'acts', r:f => f.status === 'aberto' ? `<button class="btn btn-sm btn-ok" data-act="baixarFin" data-id="${esc(f.id)}">Baixar</button>` : '' }
      ]}) : '<div class="empty-sm">Sem lançamentos.</div>'}
    </div>`;

  const acoes = [];
  const prox = { aberto:'producao', producao:'entregue', entregue:'concluido' };
  if (prox[p.status]) acoes.push({ txt:`Avançar para "${PP.statusPedidoNome(prox[p.status])}"`, cls:'btn-primary', ic:'i-seta', act:'avancarPedido', data:{ id:p.id } });
  if (obra) acoes.push({ txt:'Abrir obra', ic:'i-obra', act:'abrirObra', data:{ id:obra.id } });
  if (o) acoes.push({ txt:'Ver orçamento', ic:'i-orc', act:'abrirOrc', data:{ id:o.id } });
  if (p.status !== 'cancelado' && p.status !== 'concluido') acoes.push({ txt:'Cancelar pedido', cls:'btn-dang', act:'cancelarPedido', data:{ id:p.id } });

  PP.drawer({ title:`Pedido #${p.numero}`, sub:`${PP.cliNome(p.clienteId)} · ${PP.money(tot)}`, body, actions:acoes, wide:true });
}
PP.abrirPedido = abrirPedido;

PP.on('avancarPedido', d => {
  const p = PP.find('pedidos', d.id);
  const prox = { aberto:'producao', producao:'entregue', entregue:'concluido' };
  const novo = prox[p.status];
  if (!novo) return;
  p.status = novo;
  PP.save('pedidos');
  if (novo === 'concluido') {
    const c = PP.all('comissoes').find(x => x.pedidoId === p.id);
    if (c && c.status === 'prevista') { c.status = 'liberada'; PP.save('comissoes'); }
  }
  PP.closeAll(); PP.toast(`Pedido → ${PP.statusPedidoNome(novo)}`, 'ok'); PP.render(); abrirPedido(d.id);
});

PP.on('cancelarPedido', async d => {
  const p = PP.find('pedidos', d.id);
  if (!await PP.confirmar(`Cancelar o pedido #${p.numero}?`, {
    perigo:true, okTxt:'Cancelar pedido',
    aviso:'As parcelas em aberto e a comissão prevista também serão canceladas. Baixas já feitas permanecem.' })) return;
  p.status = 'cancelado';
  PP.save('pedidos');
  PP.where('financeiro', f => f.origem && f.origem.id === p.id && f.status === 'aberto').forEach(f => f.status = 'cancelado');
  PP.save('financeiro');
  const c = PP.all('comissoes').find(x => x.pedidoId === p.id);
  if (c && c.status !== 'paga') { c.status = 'cancelada'; PP.save('comissoes'); }
  const ob = PP.find('obras', p.obraId);
  if (ob && ob.status !== 'concluida') { ob.status = 'cancelada'; PP.save('obras'); }
  PP.closeAll(); PP.toast('Pedido cancelado'); PP.render();
});

PP.on('exportarPedidos', () => {
  const linhas = [['Número','Data','Cliente','Vendedor','Status','Forma de pagamento','Total','Custo','Margem %','Obra']];
  PP.all('pedidos').forEach(p => {
    const t = PP.pedidoTotal(p), c = PP.pedidoCusto(p);
    const ob = PP.find('obras', p.obraId);
    linhas.push([p.numero, PP.dt(p.data), PP.cliNome(p.clienteId), PP.vendNome(p.vendedorId),
      PP.statusPedidoNome(p.status), p.formaPag || '', PP.dec(t), PP.dec(c),
      PP.dec(t ? (t - c) / t * 100 : 0, 1), ob ? PP.STATUS_OBRA[ob.status].nome : '']);
  });
  PP.baixar(`pedidos-${PP.hoje()}.csv`, PP.csv(linhas), 'text/csv;charset=utf-8');
  PP.toast('CSV exportado', 'ok');
});

/* ============================== PROPOSTA IMPRIMÍVEL ============================== */

function propostaHTML(o) {
  const cfg = PP.cfg();
  const cli = o.clienteId ? PP.cli(o.clienteId) : null;
  const lead = o.leadId ? PP.lead(o.leadId) : null;
  const nome = cli ? cli.nome : (lead ? lead.nome : 'Cliente');
  const contato = cli ? PP.fone(cli.telefone) : (lead ? PP.fone(lead.telefone) : '');
  const local = cli ? [cli.endereco, cli.bairro, cli.cidade].filter(Boolean).join(', ') : (lead ? [lead.bairro, lead.cidade].filter(Boolean).join(', ') : '');
  const v = PP.vend(o.vendedorId) || {};
  const sub = PP.orcSub(o), desc = PP.orcDesc(o), tot = sub - desc;
  const c = o.condicao || {};
  const entrada = Math.min(PP.n(c.entrada), tot);
  const nP = Math.max(PP.n(c.parcelas), 1);
  const parcela = PP.n(c.juros) > 0 ? PP.pmt(tot - entrada, c.juros, nP) : (tot - entrada) / nP;
  const piscina = o.itens.map(i => PP.prod(i.produtoId)).find(p => p && p.categoria === 'Piscina');

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Proposta ${o.numero}</title>
<style>
  @page{ size:A4; margin:14mm 12mm; }
  *{ box-sizing:border-box; }
  body{ font-family:'Segoe UI',Helvetica,Arial,sans-serif; color:#12262D; margin:0; font-size:12px; line-height:1.5; }
  .wrap{ max-width:186mm; margin:0 auto; padding:10px 4px; }
  .hd{ display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid #0E7C86; padding-bottom:14px; margin-bottom:18px; }
  .logo{ font-size:24px; font-weight:800; color:#0B1F26; letter-spacing:-.5px; }
  .logo span{ color:#0E7C86; }
  .emp{ font-size:10.5px; color:#55666D; margin-top:5px; line-height:1.55; }
  .doc{ text-align:right; }
  .doc h1{ font-size:15px; margin:0 0 4px; color:#0E7C86; letter-spacing:.06em; text-transform:uppercase; }
  .doc .num{ font-size:26px; font-weight:800; color:#0B1F26; line-height:1; }
  .doc .dt{ font-size:10.5px; color:#55666D; margin-top:5px; }
  h2.sec{ font-size:10.5px; text-transform:uppercase; letter-spacing:.11em; color:#0E7C86; margin:20px 0 8px; padding-bottom:4px; border-bottom:1px solid #E2DCD0; }
  .box{ background:#FBF9F5; border:1px solid #E2DCD0; border-radius:8px; padding:12px 14px; }
  .cols{ display:flex; gap:14px; }
  .cols > div{ flex:1; }
  .kv{ display:flex; gap:8px; margin-bottom:3px; }
  .kv b{ min-width:74px; color:#55666D; font-weight:600; font-size:10.5px; text-transform:uppercase; letter-spacing:.04em; }
  table{ width:100%; border-collapse:collapse; margin-top:4px; }
  th{ background:#0B1F26; color:#fff; font-size:9.5px; text-transform:uppercase; letter-spacing:.07em; padding:8px 10px; text-align:left; }
  th.r,td.r{ text-align:right; }
  td{ padding:8px 10px; border-bottom:1px solid #E2DCD0; }
  tr:nth-child(even) td{ background:#FBF9F5; }
  .tot{ margin-top:12px; margin-left:auto; width:260px; }
  .tot div{ display:flex; justify-content:space-between; padding:4px 0; }
  .tot .big{ border-top:2px solid #0B1F26; margin-top:6px; padding-top:8px; font-size:17px; font-weight:800; color:#0B1F26; }
  .pag{ display:flex; gap:10px; margin-top:8px; }
  .pag .cel{ flex:1; background:#E3F5F5; border:1px solid #9FDCDF; border-radius:8px; padding:11px; text-align:center; }
  .pag .cel small{ display:block; font-size:9.5px; text-transform:uppercase; letter-spacing:.07em; color:#0A616A; margin-bottom:3px; }
  .pag .cel b{ font-size:16px; color:#0B1F26; }
  ul.terms{ margin:6px 0 0; padding-left:16px; color:#55666D; font-size:10.5px; }
  ul.terms li{ margin-bottom:3px; }
  .assin{ display:flex; gap:34px; margin-top:34px; }
  .assin div{ flex:1; border-top:1px solid #0B1F26; padding-top:5px; text-align:center; font-size:10px; color:#55666D; }
  .ft{ margin-top:22px; padding-top:10px; border-top:1px solid #E2DCD0; font-size:9.5px; color:#6E7F86; text-align:center; }
  .spec{ display:flex; gap:8px; margin-top:8px; }
  .spec div{ flex:1; text-align:center; background:#fff; border:1px solid #E2DCD0; border-radius:6px; padding:8px 4px; }
  .spec small{ display:block; font-size:9px; color:#6E7F86; text-transform:uppercase; letter-spacing:.05em; }
  .spec b{ font-size:14px; color:#0B1F26; }
</style></head><body><div class="wrap">

  <div class="hd">
    <div>
      <div class="logo">Piscina<span>Pro</span></div>
      <div class="emp">
        ${esc(cfg.empresa)}<br>
        ${cfg.cnpj ? 'CNPJ ' + esc(cfg.cnpj) + '<br>' : ''}
        ${esc(cfg.endereco || '')}<br>
        ${esc(cfg.fone || '')}${cfg.email ? ' · ' + esc(cfg.email) : ''}
      </div>
    </div>
    <div class="doc">
      <h1>Proposta comercial</h1>
      <div class="num">Nº ${esc(o.numero || '—')}</div>
      <div class="dt">Emitida em ${esc(PP.dt(o.data))}<br><b>Válida até ${esc(PP.dt(o.validade))}</b></div>
    </div>
  </div>

  <h2 class="sec">Cliente</h2>
  <div class="box cols">
    <div>
      <div class="kv"><b>Nome</b><span>${esc(nome)}</span></div>
      <div class="kv"><b>Contato</b><span>${esc(contato)}</span></div>
    </div>
    <div>
      <div class="kv"><b>Local</b><span>${esc(local || '—')}</span></div>
      <div class="kv"><b>Consultor</b><span>${esc(v.nome || '—')}${v.fone ? ' · ' + esc(v.fone) : ''}</span></div>
    </div>
  </div>

  ${piscina ? `
  <h2 class="sec">Modelo selecionado — ${esc(piscina.nome)}</h2>
  <div class="box">
    <div style="font-size:11.5px;color:#55666D">${esc(piscina.descricao || '')}</div>
    <div class="spec">
      <div><small>Comprimento</small><b>${PP.dec(piscina.specs.compr, 2)} m</b></div>
      <div><small>Largura</small><b>${PP.dec(piscina.specs.larg, 2)} m</b></div>
      <div><small>Profundidade</small><b>${PP.dec(piscina.specs.prof, 2)} m</b></div>
      <div><small>Volume</small><b>${PP.dec(piscina.specs.volume, 1)} mil L</b></div>
      <div><small>Espelho d'água</small><b>${PP.dec(piscina.specs.area, 1)} m²</b></div>
    </div>
  </div>` : ''}

  <h2 class="sec">Itens inclusos</h2>
  <table>
    <thead><tr><th>Descrição</th><th class="r" style="width:56px">Qtd</th><th class="r" style="width:96px">Unitário</th><th class="r" style="width:104px">Total</th></tr></thead>
    <tbody>${o.itens.map(i => `<tr>
      <td>${esc(i.nome)}</td>
      <td class="r">${PP.dec(i.qtd, PP.n(i.qtd) % 1 ? 2 : 0)}</td>
      <td class="r">${esc(PP.money(i.preco))}</td>
      <td class="r"><b>${esc(PP.money(PP.n(i.qtd) * PP.n(i.preco)))}</b></td>
    </tr>`).join('')}</tbody>
  </table>

  <div class="tot">
    <div><span>Subtotal</span><span>${esc(PP.money(sub))}</span></div>
    ${desc ? `<div><span>Desconto (${PP.dec(o.descontoPct, 1)}%)</span><span>− ${esc(PP.money(desc))}</span></div>` : ''}
    <div class="big"><span>Total</span><span>${esc(PP.money(tot))}</span></div>
  </div>

  <h2 class="sec">Condição de pagamento</h2>
  <div class="pag">
    <div class="cel"><small>Entrada</small><b>${esc(PP.money(entrada))}</b></div>
    <div class="cel"><small>Parcelas</small><b>${nP}× ${esc(PP.money(parcela))}</b></div>
    <div class="cel"><small>Total a prazo</small><b>${esc(PP.money(entrada + parcela * nP))}</b></div>
  </div>
  ${PP.n(c.juros) ? `<div style="font-size:10px;color:#6E7F86;margin-top:6px">Financiamento com juros de ${PP.dec(c.juros, 2)}% ao mês (Tabela Price). Sujeito a análise de crédito.</div>` : ''}

  <h2 class="sec">Condições gerais</h2>
  <ul class="terms">
    <li>Prazo de instalação: até ${PP.n(cfg.prazoInstalacaoDias)} dias úteis após a liberação do terreno e confirmação da entrada.</li>
    <li>Garantia de ${PP.n(cfg.garantiaCasco)} anos contra defeitos de fabricação do casco e 1 ano para equipamentos.</li>
    <li>Valores válidos até ${esc(PP.dt(o.validade))}. Após essa data, sujeitos a reajuste.</li>
    <li>Não inclusos: alvenaria de acabamento, paisagismo, ponto de energia trifásico e taxas de alvará/licença, salvo se descritos acima.</li>
    <li>O acesso para máquina e caminhão é de responsabilidade do contratante. Obstruções podem gerar custo adicional.</li>
    <li>A retirada e o descarte do material escavado estão inclusos apenas quando o item "Escavação com máquina" constar na proposta.</li>
  </ul>

  ${o.obs ? `<h2 class="sec">Observações</h2><div class="box" style="white-space:pre-wrap;font-size:11px">${esc(o.obs)}</div>` : ''}

  <div class="assin">
    <div>${esc(cfg.empresa)}</div>
    <div>${esc(nome)}</div>
  </div>

  <div class="ft">${esc(cfg.empresa)}${cfg.site ? ' · ' + esc(cfg.site) : ''}${cfg.fone ? ' · ' + esc(cfg.fone) : ''} — Proposta nº ${esc(o.numero || '')} gerada em ${esc(PP.dt(PP.hoje()))}</div>
</div></body></html>`;
}
PP.propostaHTML = propostaHTML;

})();
