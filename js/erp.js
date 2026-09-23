/* ==========================================================================
   PiscinaPro — erp.js
   Produtos & catálogo, estoque, compras & fornecedores, obras & instalação.
   ========================================================================== */
(function () {
'use strict';
const PP = window.PP;
const esc = PP.esc;

/* ============================== PRODUTOS ============================== */

const fProd = { q:'', cat:'', so:'ativos' };

PP.view('produtos', {
  titulo: 'Produtos & catálogo',
  sub: () => `${PP.where('produtos', p => p.ativo).length} itens ativos em ${PP.CATEGORIAS_PROD.length} categorias`,
  render() {
    let rows = PP.all('produtos').slice();
    if (fProd.so === 'ativos') rows = rows.filter(p => p.ativo);
    if (fProd.cat) rows = rows.filter(p => p.categoria === fProd.cat);
    if (fProd.q) {
      const q = PP.norm(fProd.q);
      rows = rows.filter(p => PP.norm(p.nome).includes(q) || PP.norm(p.sku).includes(q));
    }
    rows = PP.sortBy(rows, p => p.categoria + '|' + p.nome);
    const pag = PP.paginar('produtos', rows);

    const piscinas = PP.where('produtos', p => p.categoria === 'Piscina' && p.ativo);
    const margemMedia = rows.length ? PP.soma(rows, p => p.preco ? (p.preco - p.custo) / p.preco * 100 : 0) / rows.length : 0;

    return `
      <div class="kpis mb">
        ${PP.kpi({ cls:'k-teal', lbl:'Itens ativos', val:String(PP.where('produtos', p => p.ativo).length) })}
        ${PP.kpi({ lbl:'Modelos de piscina', val:String(piscinas.length) })}
        ${PP.kpi({ cls:'k-ok', lbl:'Margem média', val:PP.pct(margemMedia, 1), foot:'sobre o preço de tabela' })}
        ${PP.kpi({ cls:'k-ocre', lbl:'Valor do estoque', val:PP.money0(PP.soma(PP.where('produtos', p => p.controlaEstoque), p => PP.n(p.estoque) * PP.n(p.custo))), sm:true, foot:'a preço de custo' })}
      </div>

      <div class="toolbar">
        <div class="mini-search">
          <svg class="ic"><use href="#i-busca"/></svg>
          <input class="inp" type="search" placeholder="Nome ou SKU" value="${esc(fProd.q)}" data-inp="buscaProd" aria-label="Buscar produtos">
        </div>
        <div class="seg">
          <button class="${!fProd.cat ? 'on' : ''}" data-act="filtroProdCat" data-c="">Todas</button>
          ${PP.CATEGORIAS_PROD.map(c => `<button class="${fProd.cat === c ? 'on' : ''}" data-act="filtroProdCat" data-c="${esc(c)}">${esc(c)}</button>`).join('')}
        </div>
        <label class="check" style="margin-left:6px"><input type="checkbox" ${fProd.so === 'todos' ? 'checked' : ''} data-chg="prodInativos"><span class="small">Mostrar inativos</span></label>
        <div class="row-end row">
          <button class="btn btn-primary" data-act="novoProduto"><svg class="ic"><use href="#i-plus"/></svg>Novo produto</button>
        </div>
      </div>

      ${(!fProd.cat || fProd.cat === 'Piscina') && !fProd.q ? `
      <div class="card mb">
        <div class="card-hd"><div><h3>Linha de piscinas</h3><div class="sub">Clique para editar especificações e preços</div></div></div>
        <div class="card-bd">
          <div class="cat-grid">${piscinas.map(p => `
            <button type="button" class="cat-card" data-act="editarProduto" data-id="${p.id}">
              <div class="cat-vis">${silhueta(p.specs)}</div>
              <div class="cat-bd">
                <div class="nm">${esc(p.nome.replace('Piscina ', ''))}</div>
                <div class="dim">${PP.dec(p.specs.compr, 2)} × ${PP.dec(p.specs.larg, 2)} × ${PP.dec(p.specs.prof, 2)} m</div>
                <div class="dim">${PP.dec(p.specs.volume, 1)} mil L · ${PP.dec(p.specs.area, 1)} m²</div>
                <div class="pr">${esc(PP.money0(p.preco))}</div>
                <div class="tiny faint" style="margin-top:3px">margem ${PP.dec(p.preco ? (p.preco - p.custo) / p.preco * 100 : 0, 0)}%${p.controlaEstoque ? ` · ${PP.n(p.estoque)} em estoque` : ' · sob encomenda'}</div>
              </div>
            </button>`).join('')}</div>
        </div>
      </div>` : ''}

      <div class="card">
        <div class="card-hd"><div><h3>Tabela completa</h3><div class="sub">${rows.length} item(ns)</div></div></div>
        ${rows.length ? PP.tabela({
          act:'editarProduto', rows:pag.linhas,
          cols:[
            { h:'SKU', w:'118px', r:p => `<span class="small tnum">${esc(p.sku)}</span>` },
            { h:'Produto', r:p => `<div class="strong">${esc(p.nome)}</div><span class="mini">${esc(p.categoria)}${p.ativo ? '' : ' · INATIVO'}</span>` },
            { h:'Un.', r:p => `<span class="small">${esc(p.unidade)}</span>` },
            { h:'Custo', cls:'num', r:p => esc(PP.money(p.custo)) },
            { h:'Preço', cls:'num', r:p => `<b>${esc(PP.money(p.preco))}</b>` },
            { h:'Margem', cls:'num', r:p => { const m = p.preco ? (p.preco - p.custo) / p.preco * 100 : 0; return PP.badge(PP.dec(m, 0) + '%', m >= 45 ? 'b-ok' : m >= 30 ? 'b-warn' : 'b-dang'); } },
            { h:'Estoque', cls:'num', r:p => p.controlaEstoque
              ? `<b style="${PP.disponivel(p.id) <= PP.n(p.estoqueMin) ? 'color:var(--dang)' : ''}">${PP.disponivel(p.id)}</b><span class="mini">${PP.n(p.estoque)} em casa · mín. ${PP.n(p.estoqueMin)}</span>`
              : '<span class="faint small">não controla</span>' }
          ]
        }) + pag.html : PP.vazio('Nenhum produto encontrado', 'Ajuste os filtros ou cadastre um item.', { act:'novoProduto', txt:'Novo produto' })}
      </div>`;
  }
});

function silhueta(s) {
  s = s || {};
  const r = PP.n(s.larg) / Math.max(PP.n(s.compr), 1);
  const w = 120, h = Math.max(w * r, 26);
  return `<svg viewBox="0 0 140 92" preserveAspectRatio="xMidYMid meet">
    <rect x="${(140 - w) / 2}" y="${(92 - h) / 2}" width="${w}" height="${h}" rx="9" fill="#6FD3D8" fill-opacity=".45" stroke="#0E7C86" stroke-width="2"/>
    <path d="M${(140 - w) / 2 + 8} 46 q 9 -5 18 0 t 18 0 t 18 0 t 18 0 t 18 0" fill="none" stroke="#0E7C86" stroke-width="1.6" stroke-linecap="round" opacity=".55"/>
  </svg>`;
}

PP.on('buscaProd', PP.debounce((d, el) => { fProd.q = el.value; PP.resetPagina('produtos'); PP.render(); }, 250));
PP.on('filtroProdCat', d => { fProd.cat = d.c; PP.resetPagina('produtos'); PP.render(); });
PP.on('prodInativos', (d, el) => { fProd.so = el.checked ? 'todos' : 'ativos'; PP.resetPagina('produtos'); PP.render(); });

function camposProduto(p) {
  const ehPiscina = !p || p.categoria === 'Piscina';
  return [
    { k:'id', t:'hidden' },
    { k:'sku', l:'SKU / código', t:'text', col:4, req:true },
    { k:'nome', l:'Nome do produto', t:'text', col:8, req:true },
    { k:'categoria', l:'Categoria', t:'select', col:4, req:true, vazio:false, opts:PP.CATEGORIAS_PROD },
    { k:'unidade', l:'Unidade', t:'text', col:2, req:true, ph:'un' },
    { k:'fornecedorId', l:'Fornecedor padrão', t:'select', col:6, opts:PP.all('fornecedores').map(f => ({ v:f.id, l:f.nome })) },
    { sep:'Preços' },
    { k:'custo', l:'Custo (R$)', t:'money', col:4, req:true, val:'naoNegativo' },
    { k:'preco', l:'Preço de venda (R$)', t:'money', col:4, req:true, val:'naoNegativo' },
    { k:'ativo', l:'Produto ativo (aparece no catálogo)', t:'checkbox', col:4 },
    { sep:'Estoque' },
    { k:'controlaEstoque', l:'Controlar estoque deste item', t:'checkbox', col:4 },
    { k:'estoque', l:'Estoque atual', t:'number', col:4, step:1, val:'naoNegativo' },
    { k:'estoqueMin', l:'Estoque mínimo', t:'number', col:4, step:1, val:'naoNegativo', hint:'Dispara alerta de reposição' },
    ...(ehPiscina ? [
      { sep:'Especificações da piscina' },
      { k:'specs.compr', l:'Comprimento (m)', t:'pct', col:3, step:0.01,
        hint: PP.cfg().comissaoBase === 'metro' ? 'É este número que paga a comissão do vendedor' : '' },
      { k:'specs.larg', l:'Largura (m)', t:'pct', col:3, step:0.01 },
      { k:'specs.prof', l:'Profundidade (m)', t:'pct', col:3, step:0.01 },
      { k:'specs.volume', l:'Volume (mil L)', t:'pct', col:3, step:0.1 },
      { k:'specs.area', l:'Espelho d’água (m²)', t:'pct', col:3, step:0.1 }
    ] : []),
    { k:'descricao', l:'Descrição comercial', t:'textarea', col:12, rows:3, hint:'Aparece na proposta em PDF' }
  ];
}

PP.on('novoProduto', () => abrirFormProduto(null));
PP.on('editarProduto', d => abrirFormProduto(PP.prod(d.id)));

function abrirFormProduto(p) {
  const novo = !p;
  const v = p ? Object.assign({}, p, {
    'specs.compr':(p.specs || {}).compr, 'specs.larg':(p.specs || {}).larg,
    'specs.prof':(p.specs || {}).prof, 'specs.volume':(p.specs || {}).volume, 'specs.area':(p.specs || {}).area
  }) : { ativo:true, unidade:'un', categoria:'Adicional', controlaEstoque:false, estoque:0, estoqueMin:0 };
  PP.modal({
    title: novo ? 'Novo produto' : p.nome, size:'lg',
    body:`<form data-sub="salvarProduto" id="formProd">${PP.form(camposProduto(p), v)}</form>`,
    actions:[
      { txt:'Salvar', cls:'btn-primary', act:'salvarProdutoBtn' },
      p ? { txt:'Excluir', act:'excluirProduto', data:{ id:p.id } } : null,
      { txt:'Cancelar', act:'fechar' }
    ].filter(Boolean)
  });
}
PP.on('salvarProdutoBtn', (d, el) => salvarProduto(el.closest('.modal-box').querySelector('#formProd')));
PP.on('salvarProduto', (d, el) => salvarProduto(el));
function salvarProduto(form) {
  const { ok, data } = PP.lerForm(form);
  if (!ok) return;
  const specs = {};
  ['compr','larg','prof','volume','area'].forEach(k => {
    if (data['specs.' + k] !== undefined) specs[k] = PP.n(data['specs.' + k]);
    delete data['specs.' + k];
  });
  if (Object.keys(specs).length) data.specs = specs;
  PP.upsert('produtos', data);
  PP.closeTop(); PP.toast('Produto salvo', 'ok'); PP.render();
}

PP.on('excluirProduto', async d => {
  const p = PP.prod(d.id);
  const deps = PP.dependentes('produto', d.id);
  if (deps.some(x => x.bloqueia)) {
    await PP.confirmarExclusao('produto', d.id, p.nome, {
      alternativa:'Desative o produto em vez de apagar: ele some do catálogo e das buscas, mas os documentos antigos continuam íntegros.'
    });
    return;
  }
  if (deps.length) {
    if (!await PP.confirmar(`"${p.nome}" já apareceu em ${listarDeps(deps)}. O recomendado é desativar em vez de excluir.`,
      { title:'Desativar produto', okTxt:'Desativar' })) return;
    p.ativo = false; PP.save('produtos');
    PP.closeTop(); PP.toast('Produto desativado'); PP.render();
    return;
  }
  if (!await PP.confirmarExclusao('produto', d.id, p.nome)) return;
  PP.remove('produtos', d.id);
  PP.closeTop(); PP.toast('Produto excluído'); PP.render();
});

const listarDeps = deps => deps.map(x => `${x.qtd} ${x.qtd === 1 ? x.rotulo : x.plural}`).join(', ');

/* ============================== ESTOQUE ============================== */

PP.view('estoque', {
  titulo: 'Estoque',
  sub: () => {
    const baixos = PP.where('produtos', p => p.controlaEstoque && PP.disponivel(p.id) <= PP.n(p.estoqueMin));
    return baixos.length ? `${baixos.length} item(ns) no ou abaixo do mínimo, já descontando o que está reservado` : 'Todos os itens acima do estoque mínimo';
  },
  render() {
    const itens = PP.where('produtos', p => p.controlaEstoque);
    const baixos = itens.filter(p => PP.disponivel(p.id) <= PP.n(p.estoqueMin));
    const zerados = itens.filter(p => PP.disponivel(p.id) <= 0);
    const valor = PP.soma(itens, p => PP.n(p.estoque) * PP.n(p.custo));
    const totalReservado = PP.soma(itens, p => PP.reservado(p.id));
    const movs = PP.sortBy(PP.all('estoqueMov'), 'data', 'desc').slice(0, 25);

    return `
      <div class="kpis mb">
        ${PP.kpi({ cls:'k-teal', lbl:'Itens controlados', val:String(itens.length) })}
        ${PP.kpi({ cls:'k-ocre', lbl:'Valor em estoque', val:PP.money0(valor), sm:true, foot:'a preço de custo' })}
        ${PP.kpi({ cls: totalReservado ? 'k-warn' : '', lbl:'Reservado em propostas', val:String(totalReservado), foot:'preso em orçamentos na rua' })}
        ${PP.kpi({ cls: baixos.length ? 'k-warn' : 'k-ok', lbl:'Abaixo do mínimo', val:String(baixos.length) })}
        ${PP.kpi({ cls: zerados.length ? 'k-dang' : 'k-ok', lbl:'Sem unidade livre', val:String(zerados.length) })}
      </div>

      ${baixos.length ? `<div class="alert a-warn mb">
        <svg class="ic"><use href="#i-alerta"/></svg>
        <div><b>Reposição necessária.</b> ${esc(baixos.map(p => p.nome).join(', '))}.
        <button class="btn btn-sm" data-act="comprarBaixos" style="margin-left:8px">Gerar pedido de compra</button></div>
      </div>` : ''}

      <div class="alert a-info mb"><svg class="ic"><use href="#i-alerta"/></svg>
        <div class="small"><b>Disponível = em casa − reservado.</b> Uma piscina fica reservada enquanto a proposta está na rua
        (aguardando alçada, enviada ou em negociação), para dois vendedores não prometerem a mesma unidade.</div></div>

      <div class="toolbar">
        <div class="row-end row">
          <button class="btn" data-act="movEstoque" data-t="entrada"><svg class="ic"><use href="#i-plus"/></svg>Entrada manual</button>
          <button class="btn" data-act="movEstoque" data-t="saida">Saída manual</button>
          <button class="btn" data-act="exportarEstoque"><svg class="ic"><use href="#i-down"/></svg>CSV</button>
        </div>
      </div>

      <div class="grid g-2-1">
        <div class="card">
          <div class="card-hd"><div><h3>Posição atual</h3></div></div>
          ${itens.length ? PP.tabela({
            act:'editarProduto', rows:PP.paginar('estoque', PP.sortBy(itens, p => PP.disponivel(p.id) - PP.n(p.estoqueMin))).linhas,
            cols:[
              { h:'Produto', r:p => `<div class="strong">${esc(p.nome)}</div><span class="mini">${esc(p.sku)} · ${esc(p.categoria)}</span>` },
              { h:'Mínimo', cls:'num', r:p => `<span class="small">${PP.n(p.estoqueMin)}</span>` },
              { h:'Em casa', cls:'num', r:p => `<span class="small tnum">${PP.n(p.estoque)}</span>` },
              { h:'Reservado', cls:'num', r:p => { const r = PP.reservado(p.id);
                return r ? `<span class="small tnum" style="color:var(--warn)">− ${r}</span>` : '<span class="faint">—</span>'; } },
              { h:'Disponível', cls:'num', r:p => {
                const d = PP.disponivel(p.id), m = PP.n(p.estoqueMin);
                const cls = d <= 0 ? 'b-dang' : d <= m ? 'b-warn' : 'b-ok';
                return PP.badge(String(d) + ' ' + p.unidade, cls);
              } },
              { h:'Valor', cls:'num', r:p => esc(PP.money0(PP.n(p.estoque) * PP.n(p.custo))) }
            ]
          }) + PP.paginar('estoque', itens).html : '<div class="empty-sm">Nenhum item com controle de estoque.</div>'}
        </div>

        <div class="card">
          <div class="card-hd"><div><h3>Movimentações</h3><div class="sub">Últimas 25</div></div></div>
          <div class="card-bd" style="padding:0">
            ${movs.length ? PP.tabela({ rows:movs, cols:[
              { h:'Data', r:m => `<span class="small">${esc(PP.dtCurto(m.data))}</span>` },
              { h:'Produto', r:m => `<span class="small">${esc(PP.trunc(PP.prodNome(m.produtoId), 22))}</span><span class="mini">${esc(m.motivo || '')}</span>` },
              { h:'Qtd', cls:'num', r:m => `<b style="color:${m.tipo === 'entrada' ? 'var(--ok)' : m.tipo === 'saida' ? 'var(--dang)' : 'var(--t-muted)'}">${m.tipo === 'entrada' ? '+' : m.tipo === 'saida' ? '−' : '='}${PP.n(m.qtd)}</b>` }
            ]}) : '<div class="empty-sm">Nenhuma movimentação registrada.</div>'}
          </div>
        </div>
      </div>`;
  }
});

PP.on('movEstoque', d => {
  const tipo = d.t;
  const key = PP.uid('mv');
  PP.on(key, (dd, el) => {
    const { ok, data } = PP.lerForm(el.closest('.modal-box').querySelector('#formMov'));
    if (!ok) return;
    const p = PP.prod(data.produtoId);
    if (!p) return PP.toast('Escolha o produto', 'err');
    const q = PP.n(data.qtd);
    if (q <= 0) return PP.toast('Quantidade deve ser maior que zero', 'err');
    p.estoque = PP.n(p.estoque) + (tipo === 'entrada' ? q : -q);
    PP.save('produtos');
    PP.upsert('estoqueMov', { produtoId:p.id, tipo, qtd:q, data:data.data || PP.hoje(), motivo:data.motivo || 'Ajuste manual', ref:'' });
    PP.closeTop(); PP.toast(`${tipo === 'entrada' ? 'Entrada' : 'Saída'} registrada`, 'ok'); PP.render();
  });
  PP.modal({
    title: tipo === 'entrada' ? 'Entrada de estoque' : 'Saída de estoque', size:'sm',
    body:`<form id="formMov">${PP.form([
      { k:'produtoId', l:'Produto', t:'select', col:12, req:true, opts:PP.where('produtos', p => p.controlaEstoque).map(p => ({ v:p.id, l:`${p.nome} (atual: ${PP.n(p.estoque)})` })) },
      { k:'qtd', l:'Quantidade', t:'number', col:6, req:true, step:1, min:1 },
      { k:'data', l:'Data', t:'date', col:6 },
      { k:'motivo', l:'Motivo', t:'text', col:12, ph:tipo === 'entrada' ? 'Recebimento, devolução…' : 'Perda, uso em obra…' }
    ], { data:PP.hoje(), qtd:1 })}</form>`,
    actions:[{ txt:'Registrar', cls:'btn-primary', act:key }, { txt:'Cancelar', act:'fechar' }]
  });
});

PP.on('exportarEstoque', () => {
  const linhas = [['SKU','Produto','Categoria','Unidade','Estoque atual','Estoque mínimo','Custo unit.','Valor em estoque','Fornecedor']];
  PP.where('produtos', p => p.controlaEstoque).forEach(p => linhas.push([
    p.sku, p.nome, p.categoria, p.unidade, PP.n(p.estoque), PP.n(p.estoqueMin),
    PP.dec(p.custo), PP.dec(PP.n(p.estoque) * PP.n(p.custo)), PP.fornNome(p.fornecedorId)
  ]));
  PP.baixar(`estoque-${PP.hoje()}.csv`, PP.csv(linhas), 'text/csv;charset=utf-8');
  PP.toast('CSV exportado', 'ok');
});

PP.on('comprarBaixos', () => {
  const baixos = PP.where('produtos', p => p.controlaEstoque && PP.disponivel(p.id) <= PP.n(p.estoqueMin));
  if (!baixos.length) return PP.toast('Nada a repor', 'warn');
  const fid = baixos[0].fornecedorId || (PP.all('fornecedores')[0] || {}).id;
  const itens = baixos.filter(p => (p.fornecedorId || fid) === fid).map(p => ({
    produtoId:p.id, nome:p.nome, qtd:Math.max(PP.n(p.estoqueMin) * 2 - PP.disponivel(p.id), 1), custo:PP.n(p.custo)
  }));
  abrirEditorCompra(null, { fornecedorId:fid, itens, obs:'Reposição automática de estoque mínimo.' });
});

/* ============================== COMPRAS & FORNECEDORES ============================== */

const STATUS_COMPRA = {
  rascunho:  { nome:'Rascunho',  cls:'' },
  enviado:   { nome:'Enviado',   cls:'b-info' },
  recebido:  { nome:'Recebido',  cls:'b-ok' },
  cancelado: { nome:'Cancelado', cls:'b-dang' }
};
PP.compraTotal = c => (c && c.itens || []).reduce((s, i) => s + PP.n(i.qtd) * PP.n(i.custo), 0);

let abaCompras = 'pedidos';

PP.view('compras', {
  titulo: 'Compras & fornecedores',
  sub: () => `${PP.where('compras', c => c.status === 'enviado').length} pedido(s) em trânsito · ${PP.all('fornecedores').length} fornecedores`,
  render() {
    return `
      <div class="tabs">
        <button class="tab ${abaCompras === 'pedidos' ? 'on' : ''}" data-act="abaCompras" data-t="pedidos">Pedidos de compra</button>
        <button class="tab ${abaCompras === 'forn' ? 'on' : ''}" data-act="abaCompras" data-t="forn">Fornecedores</button>
      </div>
      ${abaCompras === 'pedidos' ? abaPedidosCompra() : abaFornecedores()}`;
  }
});
PP.on('abaCompras', d => { abaCompras = d.t; PP.render(); });

function abaPedidosCompra() {
  const rows = PP.sortBy(PP.all('compras'), 'numero', 'desc');
  const emTransito = rows.filter(c => c.status === 'enviado');
  const recebidoMes = rows.filter(c => c.status === 'recebido' && PP.mesKey(c.data) === PP.mesKey(PP.hoje()));

  return `
    <div class="kpis mb">
      ${PP.kpi({ cls:'k-teal', lbl:'Em trânsito', val:PP.money0(PP.soma(emTransito, PP.compraTotal)), sm:true, foot:`${emTransito.length} pedido(s)` })}
      ${PP.kpi({ lbl:'Recebido no mês', val:PP.money0(PP.soma(recebidoMes, PP.compraTotal)), sm:true })}
      ${PP.kpi({ cls:'k-ocre', lbl:'Compras no ano', val:PP.money0(PP.soma(rows.filter(c => c.status === 'recebido'), PP.compraTotal)), sm:true })}
    </div>

    <div class="toolbar">
      <div class="row-end row">
        <button class="btn btn-primary" data-act="novaCompra"><svg class="ic"><use href="#i-plus"/></svg>Novo pedido de compra</button>
      </div>
    </div>

    <div class="card">
      ${rows.length ? PP.tabela({
        act:'abrirCompra', rows:PP.paginar('compras', rows).linhas,
        cols:[
          { h:'Nº', w:'92px', r:c => `<b>#${c.numero}</b><span class="mini">${esc(PP.dt(c.data))}</span>` },
          { h:'Fornecedor', r:c => `<div class="strong">${esc(PP.fornNome(c.fornecedorId))}</div><span class="mini">${c.itens.length} item(ns)</span>` },
          { h:'Previsão', r:c => `<span class="small ${c.status === 'enviado' && c.previsaoEntrega < PP.hoje() ? 'b' : ''}" style="${c.status === 'enviado' && c.previsaoEntrega < PP.hoje() ? 'color:var(--dang)' : ''}">${esc(PP.dt(c.previsaoEntrega))}</span>` },
          { h:'Status', r:c => PP.badge(STATUS_COMPRA[c.status].nome, STATUS_COMPRA[c.status].cls) },
          { h:'Total', cls:'num', r:c => `<b>${esc(PP.money(PP.compraTotal(c)))}</b>` }
        ]
      }) + PP.paginar('compras', rows).html : PP.vazio('Nenhum pedido de compra', 'Crie um pedido para repor estoque.', { act:'novaCompra', txt:'Novo pedido' })}
    </div>`;
}

function abaFornecedores() {
  const rows = PP.all('fornecedores').map(f => {
    const compras = PP.where('compras', c => c.fornecedorId === f.id && c.status === 'recebido');
    const aPagar = PP.soma(PP.where('financeiro', x => x.fornecedorId === f.id && x.status === 'aberto'), 'valor');
    return { id:f.id, f, compras:compras.length, total:PP.soma(compras, PP.compraTotal), aPagar };
  });
  return `
    <div class="toolbar">
      <div class="row-end row">
        <button class="btn btn-primary" data-act="novoFornecedor"><svg class="ic"><use href="#i-plus"/></svg>Novo fornecedor</button>
      </div>
    </div>
    <div class="card">
      ${rows.length ? PP.tabela({
        act:'editarFornecedor', rows,
        cols:[
          { h:'Fornecedor', r:x => `<div class="strong">${esc(x.f.nome)}</div><span class="mini">${esc(x.f.doc ? PP.doc(x.f.doc) : '')}</span>` },
          { h:'Contato', r:x => `<span class="small">${esc(x.f.contato || '—')}</span><span class="mini">${esc(PP.fone(x.f.fone))}</span>` },
          { h:'Cidade', r:x => `<span class="small">${esc(x.f.cidade || '—')}</span>` },
          { h:'Prazo', cls:'num', r:x => `<span class="small">${PP.n(x.f.prazoEntregaDias)} dias</span>` },
          { h:'Compras', cls:'num', r:x => String(x.compras) },
          { h:'Total comprado', cls:'num', r:x => esc(PP.money0(x.total)) },
          { h:'A pagar', cls:'num', r:x => x.aPagar ? `<b style="color:var(--dang)">${esc(PP.money0(x.aPagar))}</b>` : '<span class="faint">—</span>' }
        ]
      }) : PP.vazio('Nenhum fornecedor', 'Cadastre seus fornecedores para controlar compras e contas a pagar.', { act:'novoFornecedor', txt:'Novo fornecedor' })}
    </div>`;
}

PP.on('novoFornecedor', () => abrirFormFornecedor(null));
PP.on('editarFornecedor', d => abrirFormFornecedor(PP.forn(d.id)));
function abrirFormFornecedor(f) {
  PP.modal({
    title: f ? f.nome : 'Novo fornecedor', size:'lg',
    body:`<form data-sub="salvarForn" id="formForn">${PP.form([
      { k:'id', t:'hidden' },
      { k:'nome', l:'Razão social', t:'text', col:8, req:true },
      { k:'doc', l:'CNPJ', t:'text', col:4, val:'doc' },
      { k:'contato', l:'Contato', t:'text', col:4 },
      { k:'fone', l:'Telefone', t:'tel', col:4 },
      { k:'email', l:'E-mail', t:'email', col:4 },
      { k:'cidade', l:'Cidade/UF', t:'text', col:6 },
      { k:'prazoEntregaDias', l:'Prazo médio de entrega (dias)', t:'number', col:6, step:1 },
      { k:'obs', l:'Observações', t:'textarea', col:12, rows:2 }
    ], f || { prazoEntregaDias:10 })}</form>`,
    actions:[
      { txt:'Salvar', cls:'btn-primary', act:'salvarFornBtn' },
      f ? { txt:'Excluir', act:'excluirForn', data:{ id:f.id } } : null,
      { txt:'Cancelar', act:'fechar' }
    ].filter(Boolean)
  });
}
PP.on('salvarFornBtn', (d, el) => salvarForn(el.closest('.modal-box').querySelector('#formForn')));
PP.on('salvarForn', (d, el) => salvarForn(el));
function salvarForn(form) {
  const { ok, data } = PP.lerForm(form);
  if (!ok) return;
  PP.upsert('fornecedores', data);
  PP.closeTop(); PP.toast('Fornecedor salvo', 'ok'); PP.render();
}
PP.on('excluirForn', async d => {
  const f = PP.forn(d.id);
  if (!await PP.confirmarExclusao('fornecedor', d.id, f.nome)) return;
  PP.desvincular('fornecedor', d.id);
  PP.remove('fornecedores', d.id);
  PP.closeTop(); PP.toast('Fornecedor excluído'); PP.render();
});

/* ---------- editor de pedido de compra ---------- */

let CP = null;

PP.on('novaCompra', () => abrirEditorCompra(null, {}));
PP.on('editarCompra', d => { PP.closeAll(); abrirEditorCompra(PP.find('compras', d.id)); });

function abrirEditorCompra(compra, base) {
  CP = compra ? JSON.parse(JSON.stringify(compra)) : Object.assign({
    id:'', numero:0, fornecedorId:(PP.all('fornecedores')[0] || {}).id || '',
    data:PP.hoje(), previsaoEntrega:PP.addDias(PP.hoje(), 10), status:'rascunho', itens:[], obs:''
  }, base || {});
  PP.modal({
    title: compra ? `Pedido de compra #${compra.numero}` : 'Novo pedido de compra', size:'lg',
    body:`<div id="cpRoot">${htmlCompra()}</div>`,
    actions:[{ txt:'Salvar', cls:'btn-primary', act:'cpSalvar' }, { txt:'Cancelar', act:'fechar' }]
  });
}

function htmlCompra() {
  const forn = PP.all('fornecedores');
  return `
  <div class="fgrid mb">
    <div class="f f-6"><label for="cpForn">Fornecedor</label>
      <select class="inp" id="cpForn" data-chg="cpCampo" data-k="fornecedorId">
        ${forn.map(f => `<option value="${f.id}"${CP.fornecedorId === f.id ? ' selected' : ''}>${esc(f.nome)}</option>`).join('')}
      </select></div>
    <div class="f f-3"><label for="cpData">Data</label>
      <input class="inp" id="cpData" type="date" value="${esc(CP.data)}" data-chg="cpCampo" data-k="data"></div>
    <div class="f f-3"><label for="cpPrev">Previsão de entrega</label>
      <input class="inp" id="cpPrev" type="date" value="${esc(CP.previsaoEntrega)}" data-chg="cpCampo" data-k="previsaoEntrega"></div>
  </div>

  <div class="card mb">
    <div class="card-hd"><div><h3>Itens</h3></div>
      <select class="inp" style="width:auto;margin-left:auto;max-width:260px" data-chg="cpAdd" aria-label="Adicionar item">
        <option value="">+ adicionar produto…</option>
        ${PP.all('produtos').filter(p => p.ativo).map(p => `<option value="${p.id}">${esc(p.nome)} — custo ${esc(PP.money0(p.custo))}</option>`).join('')}
      </select>
    </div>
    <div class="card-bd" id="cpItens">${cpItensHTML()}</div>
  </div>

  <div class="f"><label for="cpObs">Observações</label>
    <textarea class="inp" id="cpObs" rows="2" data-chg="cpCampo" data-k="obs">${esc(CP.obs || '')}</textarea></div>`;
}

function cpItensHTML() {
  if (!CP.itens.length) return '<div class="empty-sm">Nenhum item. Escolha um produto acima.</div>';
  const tot = PP.compraTotal(CP);
  return `<div class="itens">
    <div class="item-row tiny faint" style="font-weight:700;text-transform:uppercase;letter-spacing:.06em">
      <span>Produto</span><span class="tr">Qtd</span><span class="tr">Custo un.</span><span class="tr it-tot">Total</span><span></span>
    </div>
    ${CP.itens.map((it, i) => `
      <div class="item-row">
        <div class="b" style="font-size:13px;min-width:0">${esc(it.nome)}</div>
        <input class="inp" type="number" min="1" step="1" value="${esc(it.qtd)}" data-inp="cpItem" data-i="${i}" data-k="qtd" aria-label="Quantidade">
        <input class="inp inp-money" type="text" inputmode="decimal" value="${esc(PP.dec(it.custo))}" data-inp="cpItem" data-i="${i}" data-k="custo" aria-label="Custo unitário">
        <div class="tr b it-tot tnum" data-cptot="${i}">${esc(PP.money(PP.n(it.qtd) * PP.n(it.custo)))}</div>
        <button class="icon-btn rm" data-act="cpRm" data-i="${i}" aria-label="Remover"><svg class="ic ic-sm"><use href="#i-lixo"/></svg></button>
      </div>`).join('')}
  </div>
  <div class="tot-box mt"><div class="tot-line big"><span>Total do pedido</span><span class="tnum">${esc(PP.money(tot))}</span></div></div>`;
}

PP.on('cpCampo', (d, el) => { CP[d.k] = el.value; });
PP.on('cpAdd', (d, el) => {
  const p = PP.prod(el.value);
  el.value = '';
  if (!p) return;
  const ex = CP.itens.findIndex(i => i.produtoId === p.id);
  if (ex >= 0) CP.itens[ex].qtd = PP.n(CP.itens[ex].qtd) + 1;
  else CP.itens.push({ produtoId:p.id, nome:p.nome, qtd:1, custo:PP.n(p.custo) });
  document.getElementById('cpItens').innerHTML = cpItensHTML();
});
PP.on('cpItem', (d, el) => {
  const it = CP.itens[PP.n(d.i)];
  it[d.k] = d.k === 'custo' ? PP.parseMoney(el.value) : PP.n(el.value);
  document.getElementById('cpItens').innerHTML = cpItensHTML();
});
PP.on('cpRm', d => { CP.itens.splice(PP.n(d.i), 1); document.getElementById('cpItens').innerHTML = cpItensHTML(); });

PP.on('cpSalvar', () => {
  if (!CP.itens.length) return PP.toast('Adicione ao menos um item', 'err');
  if (!CP.fornecedorId) return PP.toast('Escolha o fornecedor', 'err');
  const novo = !CP.id;
  if (novo) { CP.numero = PP.proximoNumero('proximoNumCompra'); CP.status = 'enviado'; }
  const id = PP.upsert('compras', CP);
  PP.closeTop(); PP.toast(novo ? `Pedido de compra #${CP.numero} criado` : 'Pedido atualizado', 'ok');
  PP.render(); abrirCompra(id);
});

PP.on('abrirCompra', d => abrirCompra(d.id));

function abrirCompra(id) {
  const c = PP.find('compras', id);
  if (!c) return;
  const tot = PP.compraTotal(c);
  const body = `
    <div class="row mb" style="gap:7px">${PP.badge(STATUS_COMPRA[c.status].nome, STATUS_COMPRA[c.status].cls)}</div>
    <div class="card mb"><div class="card-bd">
      <dl class="dl">
        <dt>Fornecedor</dt><dd><b>${esc(PP.fornNome(c.fornecedorId))}</b></dd>
        <dt>Emissão</dt><dd>${esc(PP.dt(c.data))}</dd>
        <dt>Previsão</dt><dd>${esc(PP.dt(c.previsaoEntrega))}</dd>
        <dt>Total</dt><dd><b>${esc(PP.money(tot))}</b></dd>
      </dl>
      ${c.obs ? `<div class="sep"></div><div class="small muted">${esc(c.obs)}</div>` : ''}
    </div></div>
    <div class="card">
      <div class="card-hd"><div><h3>Itens</h3></div></div>
      ${PP.tabela({ rows:c.itens, cols:[
        { h:'Produto', r:i => `<span class="small">${esc(i.nome)}</span>` },
        { h:'Qtd', cls:'num', r:i => PP.n(i.qtd) },
        { h:'Custo un.', cls:'num', r:i => esc(PP.money(i.custo)) },
        { h:'Total', cls:'num', r:i => `<b>${esc(PP.money(PP.n(i.qtd) * PP.n(i.custo)))}</b>` }
      ]})}
    </div>`;
  const acoes = [];
  if (c.status === 'enviado' || c.status === 'rascunho') {
    acoes.push({ txt:'Receber mercadoria', cls:'btn-ok', ic:'i-check', act:'receberCompra', data:{ id:c.id } });
    acoes.push({ txt:'Editar', ic:'i-edit', act:'editarCompra', data:{ id:c.id } });
    acoes.push({ txt:'Cancelar pedido', cls:'btn-dang', act:'cancelarCompra', data:{ id:c.id } });
  }
  PP.drawer({ title:`Compra #${c.numero}`, sub:`${PP.fornNome(c.fornecedorId)} · ${PP.money(tot)}`, body, actions:acoes });
}

PP.on('receberCompra', async d => {
  const c = PP.find('compras', d.id);
  const tot = PP.compraTotal(c);
  if (!await PP.confirmar(`Confirmar o recebimento da compra #${c.numero} (${PP.money(tot)})?`, {
    title:'Receber mercadoria', okTxt:'Receber',
    aviso:'O estoque será atualizado e será criada uma conta a pagar com vencimento em 28 dias.' })) return;

  c.status = 'recebido';
  PP.save('compras');
  c.itens.forEach(it => {
    const p = PP.prod(it.produtoId);
    if (!p) return;
    if (p.controlaEstoque) p.estoque = PP.n(p.estoque) + PP.n(it.qtd);
    /* atualiza o custo de referência pelo último preço pago */
    p.custo = PP.n(it.custo);
    PP.upsert('estoqueMov', { produtoId:p.id, tipo:'entrada', qtd:PP.n(it.qtd), data:PP.hoje(), motivo:`Compra #${c.numero}`, ref:c.id });
  });
  PP.save('produtos');
  PP.upsert('financeiro', {
    tipo:'pagar', descricao:`Compra #${c.numero} — ${PP.fornNome(c.fornecedorId)}`, categoria:'Compra de piscina',
    valor:tot, vencimento:PP.addDias(PP.hoje(), 28), status:'aberto', pagoEm:'', formaPag:'Boleto',
    fornecedorId:c.fornecedorId, origem:{ tipo:'compra', id:c.id }, parcela:1, parcelas:1, obs:''
  });
  PP.closeAll(); PP.toast('Mercadoria recebida e estoque atualizado', 'ok'); PP.render();
});

PP.on('cancelarCompra', async d => {
  if (!await PP.confirmar('Cancelar esse pedido de compra?', { perigo:true, okTxt:'Cancelar pedido' })) return;
  const c = PP.find('compras', d.id);
  c.status = 'cancelado';
  PP.save('compras');
  PP.closeAll(); PP.toast('Pedido cancelado'); PP.render();
});

/* ============================== OBRAS & INSTALAÇÃO ============================== */

const fObra = { status:'' };

PP.view('obras', {
  titulo: 'Obras & instalação',
  sub: () => {
    const ativas = PP.where('obras', o => o.status !== 'concluida' && o.status !== 'cancelada');
    return `${ativas.length} obra(s) em andamento · ${PP.where('obras', o => o.status === 'concluida').length} concluída(s)`;
  },
  render() {
    let rows = PP.all('obras').slice();
    if (fObra.status) rows = rows.filter(o => o.status === fObra.status);
    rows = PP.sortBy(rows, o => (o.dataAgendada || '9999') + o.status);

    const ativas = PP.where('obras', o => o.status !== 'concluida' && o.status !== 'cancelada');
    const semAgenda = ativas.filter(o => !o.dataAgendada);
    const atrasadas = ativas.filter(o => o.dataAgendada && o.dataAgendada < PP.hoje() && o.status !== 'acabamento');
    const concl = PP.where('obras', o => o.status === 'concluida');
    const desvio = concl.length ? PP.soma(concl, o => PP.n(o.custoReal) - PP.n(o.custoPrevisto)) : 0;

    const proximas = PP.sortBy(ativas.filter(o => o.dataAgendada), 'dataAgendada').slice(0, 8);

    return `
      <div class="kpis mb">
        ${PP.kpi({ cls:'k-teal', lbl:'Em andamento', val:String(ativas.length) })}
        ${PP.kpi({ cls: semAgenda.length ? 'k-warn' : 'k-ok', lbl:'Sem agendamento', val:String(semAgenda.length) })}
        ${PP.kpi({ cls: atrasadas.length ? 'k-dang' : 'k-ok', lbl:'Atrasadas', val:String(atrasadas.length) })}
        ${PP.kpi({ cls: desvio > 0 ? 'k-dang' : 'k-ok', lbl:'Desvio de custo', val:(desvio >= 0 ? '+' : '−') + PP.money0(Math.abs(desvio)), sm:true, foot:'em obras concluídas' })}
      </div>

      <div class="grid g-2-1 mb">
        <div class="card">
          <div class="card-hd">
            <div><h3>Carteira de obras</h3></div>
            <div class="seg right" style="margin-left:auto">
              <button class="${!fObra.status ? 'on' : ''}" data-act="filtroObra" data-s="">Todas</button>
              <button class="${fObra.status === 'aguardando' ? 'on' : ''}" data-act="filtroObra" data-s="aguardando">Aguardando</button>
              <button class="${fObra.status === 'agendada' ? 'on' : ''}" data-act="filtroObra" data-s="agendada">Agendadas</button>
              <button class="${fObra.status === 'concluida' ? 'on' : ''}" data-act="filtroObra" data-s="concluida">Concluídas</button>
            </div>
          </div>
          ${rows.length ? PP.tabela({
            act:'abrirObra', rows:PP.paginar('obras', rows).linhas,
            cols:[
              { h:'Cliente / local', r:o => `<div class="strong">${esc(PP.cliNome(o.clienteId))}</div><span class="mini">${esc(PP.trunc(o.endereco || o.cidade || '—', 36))}</span>` },
              { h:'Status', r:o => PP.badge(PP.STATUS_OBRA[o.status].nome, PP.STATUS_OBRA[o.status].cls) },
              { h:'Progresso', w:'130px', r:o => {
                const done = (o.checklist || []).filter(Boolean).length;
                const pc = PP.CHECKLIST_OBRA.length ? done / PP.CHECKLIST_OBRA.length * 100 : 0;
                return `<div class="bar thin"><i class="${pc >= 100 ? 'ok' : ''}" style="width:${pc}%"></i></div><span class="mini">${done}/${PP.CHECKLIST_OBRA.length} etapas</span>`;
              } },
              { h:'Agendada', cls:'num', r:o => o.dataAgendada
                ? `<span class="small ${o.dataAgendada < PP.hoje() && o.status !== 'concluida' ? 'b' : ''}" style="${o.dataAgendada < PP.hoje() && o.status !== 'concluida' ? 'color:var(--dang)' : ''}">${esc(PP.dt(o.dataAgendada))}</span>`
                : '<span class="badge b-warn">a agendar</span>' },
              { h:'Equipe', r:o => o.equipeObraId
                ? `<span class="badge" style="background:${PP.equipeObraCor(o.equipeObraId)}1f;color:${PP.equipeObraCor(o.equipeObraId)}"><span class="dt"></span>${esc(PP.equipeObraNome(o.equipeObraId))}</span>`
                : (o.responsavel ? `<span class="small">${esc(o.responsavel)}</span>` : '<span class="badge b-warn">sem equipe</span>') }
            ]
          }) + PP.paginar('obras', rows).html : '<div class="empty-sm">Nenhuma obra nesse filtro.</div>'}
        </div>

        <div class="card">
          <div class="card-hd"><div><h3>Próximas instalações</h3></div></div>
          <div class="card-bd">
            ${proximas.length ? proximas.map(o => {
              const dias = PP.diasEntre(PP.hoje(), o.dataAgendada);
              return `<div class="att-item" tabindex="0" role="button" data-act="abrirObra" data-id="${esc(o.id)}" style="cursor:pointer">
                <svg class="ic"><use href="#i-obra"/></svg>
                <div class="txt"><b>${esc(PP.trunc(PP.cliNome(o.clienteId), 24))}</b><small>${esc(PP.dt(o.dataAgendada))} · ${esc(o.cidade || '')}</small></div>
                <div class="val" style="${dias < 0 ? 'color:var(--dang)' : dias <= 2 ? 'color:var(--warn)' : ''}">${dias < 0 ? Math.abs(dias) + 'd atraso' : dias === 0 ? 'hoje' : 'em ' + dias + 'd'}</div>
              </div>`;
            }).join('') : '<div class="empty-sm">Nenhuma obra agendada.</div>'}
          </div>
        </div>
      </div>`;
  }
});

PP.on('filtroObra', d => { fObra.status = d.s; PP.resetPagina('obras'); PP.render(); });

PP.on('abrirObra', d => abrirObra(d.id));

function abrirObra(id) {
  const o = PP.find('obras', id);
  if (!o) return PP.toast('Obra não encontrada', 'err');
  const ped = PP.find('pedidos', o.pedidoId);
  const orc = ped ? PP.orcDoPedido(ped) : null;
  const done = (o.checklist || []).filter(Boolean).length;
  const pc = done / PP.CHECKLIST_OBRA.length * 100;
  const notas = (o.notas || []).slice().reverse();

  const body = `
    <div class="row mb" style="gap:7px">
      ${PP.badge(PP.STATUS_OBRA[o.status].nome, PP.STATUS_OBRA[o.status].cls)}
      ${ped ? PP.badge('Pedido #' + ped.numero, 'b-ink') : ''}
      ${o.dataAgendada && o.dataAgendada < PP.hoje() && o.status !== 'concluida' ? PP.badge('Atrasada', 'b-dang') : ''}
    </div>

    <div class="card mb"><div class="card-bd">
      <div class="row mb" style="justify-content:space-between">
        <b class="small">Progresso da obra</b>
        <span class="small faint">${done} de ${PP.CHECKLIST_OBRA.length} etapas · ${PP.dec(pc, 0)}%</span>
      </div>
      <div class="bar"><i class="${pc >= 100 ? 'ok' : pc >= 50 ? '' : 'warn'}" style="width:${pc}%"></i></div>
    </div></div>

    <div class="card mb"><div class="card-bd">
      <dl class="dl">
        <dt>Cliente</dt><dd><b>${esc(PP.cliNome(o.clienteId))}</b></dd>
        <dt>Endereço</dt><dd>${esc(o.endereco || '—')}</dd>
        <dt>Cidade</dt><dd>${esc(o.cidade || '—')}</dd>
        <dt>Equipe</dt><dd>${o.equipeObraId
          ? `<span class="badge" style="background:${PP.equipeObraCor(o.equipeObraId)}1f;color:${PP.equipeObraCor(o.equipeObraId)}"><span class="dt"></span>${esc(PP.equipeObraNome(o.equipeObraId))}</span>`
          : (o.responsavel ? esc(o.responsavel) : '<span class="badge b-warn">sem equipe</span>')}</dd>
        <dt>Agendada</dt><dd>${o.dataAgendada
          ? `${esc(PP.dt(o.dataAgendada))} <span class="faint small">(${PP.duracaoObra(o)} dia(s))</span>`
          : '<span class="badge b-warn">a agendar</span>'}</dd>
        ${o.numeroOS ? `<dt>Nº da OS</dt><dd>${esc(o.numeroOS)}</dd>` : ''}
        ${o.dataConclusao ? `<dt>Concluída</dt><dd>${esc(PP.dt(o.dataConclusao))}</dd>` : ''}
        <dt>Custo previsto</dt><dd>${esc(PP.money(o.custoPrevisto))}</dd>
        <dt>Custo real</dt><dd>${PP.n(o.custoReal) ? `${esc(PP.money(o.custoReal))} <span class="small" style="color:${PP.n(o.custoReal) > PP.n(o.custoPrevisto) ? 'var(--dang)' : 'var(--ok)'}">(${PP.n(o.custoReal) > PP.n(o.custoPrevisto) ? '+' : '−'}${esc(PP.money0(Math.abs(PP.n(o.custoReal) - PP.n(o.custoPrevisto))))})</span>` : '<span class="faint">não lançado</span>'}</dd>
        ${orc ? `<dt>Modelo</dt><dd>${esc((orc.itens.map(i => PP.prod(i.produtoId)).find(p => p && p.categoria === 'Piscina') || {}).nome || '—')}</dd>` : ''}
      </dl>
    </div></div>

    <div class="card mb">
      <div class="card-hd"><div><h3>Checklist de execução</h3><div class="sub">Marque conforme a obra avança</div></div></div>
      <div class="card-bd">
        <div class="chk-list">
          ${PP.CHECKLIST_OBRA.map((t, i) => `
            <label class="chk ${(o.checklist || [])[i] ? 'done' : ''}">
              <input type="checkbox" ${(o.checklist || [])[i] ? 'checked' : ''} data-chg="obraCheck" data-id="${esc(o.id)}" data-i="${i}">
              <span>${esc(t)}</span>
            </label>`).join('')}
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-hd"><div><h3>Diário de obra</h3></div>
        <button class="btn btn-sm" data-act="notaObra" data-id="${esc(o.id)}" style="margin-left:auto"><svg class="ic ic-sm"><use href="#i-plus"/></svg>Nota</button>
      </div>
      <div class="card-bd">
        ${notas.length ? `<ul class="tl">${notas.map(n => `
          <li><div class="tl-hd"><b>${esc(n.autor || 'Equipe')}</b><time>${esc(PP.dtHora(n.data))}</time></div><p>${esc(n.texto)}</p></li>`).join('')}</ul>`
          : '<div class="empty-sm">Nenhuma anotação ainda.</div>'}
      </div>
    </div>`;

  const acoes = [];
  const idx = PP.ETAPAS_OBRA.indexOf(o.status);
  if (idx >= 0 && idx < PP.ETAPAS_OBRA.length - 1) {
    acoes.push({ txt:`Avançar para "${PP.STATUS_OBRA[PP.ETAPAS_OBRA[idx + 1]].nome}"`, cls:'btn-primary', ic:'i-seta', act:'avancarObra', data:{ id:o.id } });
  }
  acoes.push({ txt:'Ordem de serviço', cls:'btn-teal', ic:'i-os', act:'imprimirOS', data:{ id:o.id } });
  acoes.push({ txt:o.dataAgendada ? 'Reagendar' : 'Agendar', ic:'i-relogio', act:'agendarObra', data:{ id:o.id } });
  if (o.dataAgendada) acoes.push({ txt:'Avisar cliente', cls:'btn-ok', ic:'i-wpp', act:'waObra', data:{ id:o.id } });
  acoes.push({ txt:'Editar', ic:'i-edit', act:'editarObra', data:{ id:o.id } });
  if (ped) acoes.push({ txt:'Abrir pedido', ic:'i-pedido', act:'abrirPedido', data:{ id:ped.id } });
  acoes.push({ txt:'Abrir chamado', ic:'i-suporte', act:'chamadoDoCliente', data:{ id:o.clienteId } });

  PP.drawer({ title:PP.cliNome(o.clienteId), sub:`Obra · ${o.endereco || o.cidade || ''}`, body, actions:acoes, wide:true });
}
PP.abrirObra = abrirObra;

PP.on('obraCheck', (d, el) => {
  const o = PP.find('obras', d.id);
  o.checklist = o.checklist || PP.CHECKLIST_OBRA.map(() => false);
  o.checklist[PP.n(d.i)] = el.checked;
  PP.save('obras');
  el.closest('.chk').classList.toggle('done', el.checked);
  /* avanço automático de status pelo progresso */
  const done = o.checklist.filter(Boolean).length;
  const alvo = done >= 13 ? 'concluida' : done >= 10 ? 'acabamento' : done >= 8 ? 'hidraulica' : done >= 5 ? 'assentamento' : done >= 3 ? 'escavacao' : o.status;
  if (alvo !== o.status && o.status !== 'cancelada' && PP.ETAPAS_OBRA.indexOf(alvo) > PP.ETAPAS_OBRA.indexOf(o.status)) {
    o.status = alvo;
    if (alvo === 'concluida' && !o.dataConclusao) o.dataConclusao = PP.hoje();
    PP.save('obras');
    PP.toast('Obra avançou para ' + PP.STATUS_OBRA[alvo].nome, 'ok');
  }
  PP.pintarNav();
});

PP.on('avancarObra', d => {
  const o = PP.find('obras', d.id);
  const idx = PP.ETAPAS_OBRA.indexOf(o.status);
  const novo = PP.ETAPAS_OBRA[idx + 1];
  if (!novo) return;
  o.status = novo;
  if (novo === 'concluida') {
    o.dataConclusao = PP.hoje();
    o.checklist = PP.CHECKLIST_OBRA.map(() => true);
    const ped = PP.find('pedidos', o.pedidoId);
    if (ped && ped.status !== 'concluido' && ped.status !== 'cancelado') {
      ped.status = 'entregue';
      PP.save('pedidos');
    }
  }
  o.notas = o.notas || [];
  o.notas.push({ data:PP.agora(), texto:`Status alterado para "${PP.STATUS_OBRA[novo].nome}".`, autor:'Sistema' });
  PP.save('obras');
  PP.closeAll(); PP.toast('Obra → ' + PP.STATUS_OBRA[novo].nome, 'ok'); PP.render(); abrirObra(d.id);
});

PP.on('agendarObra', async d => {
  const o = PP.find('obras', d.id);
  const dt = await PP.perguntar('Data de início da obra', { title:'Agendar instalação', tipo:'date', valor:o.dataAgendada || PP.addDias(PP.hoje(), 7) });
  if (!dt) return;
  o.dataAgendada = dt;
  if (o.status === 'aguardando') o.status = 'agendada';
  o.notas = o.notas || [];
  o.notas.push({ data:PP.agora(), texto:`Obra agendada para ${PP.dt(dt)}.`, autor:'Sistema' });
  PP.save('obras');
  PP.closeAll(); PP.toast('Obra agendada', 'ok'); PP.render(); abrirObra(d.id);
});

PP.on('notaObra', async d => {
  const txt = await PP.perguntar('O que aconteceu na obra?', { title:'Nota de obra', multi:true });
  if (!txt) return;
  const o = PP.find('obras', d.id);
  o.notas = o.notas || [];
  o.notas.push({ data:PP.agora(), texto:txt, autor:o.responsavel || 'Equipe' });
  PP.save('obras');
  PP.closeAll(); PP.toast('Nota registrada', 'ok'); abrirObra(d.id);
});

PP.on('editarObra', d => {
  const o = PP.find('obras', d.id);
  PP.closeAll();
  const key = PP.uid('ob');
  PP.on(key, (dd, el) => {
    const { ok, data } = PP.lerForm(el.closest('.modal-box').querySelector('#formObra'), { regras:[
      { campo:'dataConclusao', msg:'A conclusão não pode ser antes do agendamento', fn:d => !d.dataConclusao || !d.dataAgendada || d.dataConclusao >= d.dataAgendada },
      { campo:'duracaoDias', msg:'A obra precisa durar ao menos 1 dia', fn:d => d.duracaoDias === null || PP.n(d.duracaoDias) >= 1 }
    ]});
    if (!ok) return;
    data.id = o.id;
    PP.upsert('obras', data);
    PP.closeTop(); PP.toast('Obra atualizada', 'ok'); PP.render(); abrirObra(o.id);
  });
  PP.modal({
    title:'Editar obra', sub:PP.cliNome(o.clienteId), size:'lg',
    body:`<form id="formObra">${PP.form([
      { k:'endereco', l:'Endereço da instalação', t:'text', col:8 },
      { k:'cidade', l:'Cidade', t:'text', col:4 },
      { k:'equipeObraId', l:'Equipe de instalação', t:'select', col:6,
        opts:PP.where('equipesObra', e => e.ativo !== false).map(e => ({ v:e.id, l:e.nome + (e.membros ? ' — ' + e.membros : '') })) },
      { k:'status', l:'Status', t:'select', col:6, vazio:false, opts:Object.keys(PP.STATUS_OBRA).map(k => ({ v:k, l:PP.STATUS_OBRA[k].nome })) },
      { k:'dataAgendada', l:'Data agendada', t:'date', col:4 },
      { k:'duracaoDias', l:'Duração (dias)', t:'number', col:4, min:1, step:1, hint:'Ocupa a equipe no calendário' },
      { k:'dataConclusao', l:'Data de conclusão', t:'date', col:4 },
      { k:'custoPrevisto', l:'Custo previsto (R$)', t:'money', col:6 },
      { k:'custoReal', l:'Custo real (R$)', t:'money', col:6, hint:'Lance ao final para medir o desvio' },
      { k:'obsOS', l:'Aviso para a equipe (sai na OS)', t:'textarea', col:12, rows:2,
        ph:'Portão estreito, cão solto, acesso só pela manhã…' }
    ], Object.assign({ duracaoDias:3 }, o))}</form>`,
    actions:[{ txt:'Salvar', cls:'btn-primary', act:key }, { txt:'Cancelar', act:'fechar' }]
  });
});

})();
