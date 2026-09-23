/* ==========================================================================
   PiscinaPro — pdv.js
   Venda de balcão: cloro, insumos e acessórios vendidos na hora, na loja.

   É o oposto do pedido de piscina — ali a venda tem orçamento, obra e meses de
   parcela; aqui tem que ser rápida. Uma venda de balcão, ao ser fechada:
     · baixa o estoque e grava a movimentação
     · lança em contas a receber (pago na hora, ou parcelado)
     · registra a comissão do vendedor
     · imprime o cupom
   ========================================================================== */
(function () {
'use strict';
const PP = window.PP;
const esc = PP.esc;

/* ============================== CÁLCULOS ============================== */

PP.vendaSub   = v => (v && v.itens || []).reduce((s, i) => s + PP.n(i.qtd) * PP.n(i.preco), 0);
PP.vendaDesc  = v => PP.cent(PP.vendaSub(v) * PP.n(v && v.descontoPct) / 100);
PP.vendaTotal = v => PP.cent(PP.vendaSub(v) - PP.vendaDesc(v));
PP.vendaCusto = v => (v && v.itens || []).reduce((s, i) => s + PP.n(i.qtd) * PP.n(i.custo), 0);

/** Vendas de balcão válidas de um mês 'YYYY-MM'. */
PP.vendasBalcaoDoMes = mk => PP.where('vendas', v => v.status === 'concluida' && PP.mesKey(v.data) === mk);

/** Produtos que podem ser vendidos no balcão. */
PP.produtosBalcao = () => PP.where('produtos', p => p.ativo && PP.CATEGORIAS_BALCAO.includes(p.categoria));

/* ============================== CARRINHO ============================== */

/* Carrinho aberto. Fica em memória: venda de balcão não se salva pela metade. */
let CX = null;

function novoCarrinho() {
  return {
    operacaoId: PP.uid('carrinho'),
    itens: [],
    clienteId: '',
    clienteNome: '',
    vendedorId: PP.vendedorAtual() || (PP.where('vendedores', v => v.ativo)[0] || {}).id || '',
    descontoPct: 0,
    formaPag: 'PIX',
    parcelas: 1,
    recebido: 0,
    obs: '',
    busca: ''
  };
}

function garantirCarrinho() { if (!CX) CX = novoCarrinho(); return CX; }

/** Quanto deste produto já está no carrinho. */
function noCarrinho(produtoId) {
  const it = CX.itens.find(i => i.produtoId === produtoId);
  return it ? PP.n(it.qtd) : 0;
}

/** Disponível para vender agora, já descontando o que está no carrinho. */
function disponivelAgora(p) {
  if (!p.controlaEstoque) return Infinity;
  return PP.disponivel(p.id) - noCarrinho(p.id);
}

function addItem(produtoId, qtd) {
  const p = PP.prod(produtoId);
  if (!p) return;
  const q = PP.n(qtd) || 1;
  if (p.controlaEstoque && disponivelAgora(p) < q) {
    PP.toast(`${p.nome}: só há ${PP.disponivel(p.id) - noCarrinho(p.id)} disponível`, 'warn');
    if (disponivelAgora(p) <= 0) return;
  }
  const ex = CX.itens.find(i => i.produtoId === produtoId);
  if (ex) ex.qtd = PP.n(ex.qtd) + q;
  else CX.itens.push({ produtoId:p.id, sku:p.sku, nome:p.nome, unidade:p.unidade,
    qtd:q, preco:PP.n(p.preco), custo:PP.n(p.custo) });
  repintarPdv();
}

/* ============================== TELA DO PDV ============================== */

PP.view('pdv', {
  titulo: 'Venda de balcão',
  sub: () => {
    const hoje = PP.where('vendas', v => v.status === 'concluida' && String(v.data).slice(0, 10) === PP.hoje());
    return hoje.length
      ? `${hoje.length} venda(s) hoje · ${PP.money0(PP.soma(hoje, PP.vendaTotal))} no caixa`
      : 'Nenhuma venda hoje ainda — busque o produto e monte o carrinho';
  },
  render() {
    garantirCarrinho();
    return `<div class="pdv">
      <div class="pdv-esq">${htmlCatalogo()}</div>
      <div class="pdv-dir" id="pdvCarrinho">${htmlCarrinho()}</div>
    </div>`;
  },
  depois(root) {
    ajustarAltura();
    const b = root.querySelector('[data-inp="pdvBusca"]');
    if (b) { b.focus(); b.setSelectionRange(b.value.length, b.value.length); }
  }
});

/**
 * Mede onde o caixa realmente começa na tela e transforma o resto da altura
 * disponível em --pdv-alt.
 *
 * Antes isso era `calc(100vh - 78px)` chutado no CSS, o que quebrava sempre que
 * o cabeçalho mudava de altura (subtítulo com duas linhas, aviso na barra) ou
 * quando a barra do navegador móvel aparecia. Medir o topo real do elemento
 * funciona em qualquer resolução sem número mágico nenhum.
 */
function ajustarAltura() {
  const el = document.querySelector('.pdv');
  if (!el) return;
  /* layout empilhado não tem altura fixa: o conteúdo manda */
  if (getComputedStyle(el).getPropertyValue('--pdv-empilhado').trim() === '1') {
    el.style.removeProperty('--pdv-alt');
    return;
  }
  const topo = el.getBoundingClientRect().top;
  /* O respiro do rodapé é o padding real do container, não um número fixo:
     assim o bloco termina exatamente onde a página termina e não sobra
     rolagem de alguns pixels. */
  const pai = el.parentElement;
  const respiro = pai ? (parseFloat(getComputedStyle(pai).paddingBottom) || 0) : 18;
  const disponivel = Math.round(window.innerHeight - topo - respiro);
  el.style.setProperty('--pdv-alt', Math.max(disponivel, 360) + 'px');
}
PP.ajustarAlturaPdv = ajustarAltura;

const reajustar = PP.debounce(() => { if (PP.rotaAtual.nome === 'pdv') ajustarAltura(); }, 120);
window.addEventListener('resize', reajustar);
window.addEventListener('orientationchange', reajustar);

function htmlCatalogo() {
  const q = PP.norm(CX.busca);
  let prods = PP.produtosBalcao();
  if (q) prods = prods.filter(p => PP.norm(p.nome).includes(q) || PP.norm(p.sku).includes(q));
  prods = PP.sortBy(prods, 'nome');

  /* mais vendidos nos últimos 90 dias viram atalho */
  const desde = PP.addDias(PP.hoje(), -90);
  const freq = {};
  PP.where('vendas', v => v.status === 'concluida' && String(v.data).slice(0, 10) >= desde)
    .forEach(v => (v.itens || []).forEach(i => { freq[i.produtoId] = (freq[i.produtoId] || 0) + PP.n(i.qtd); }));
  const topo = PP.sortBy(Object.keys(freq).map(id => ({ id, n:freq[id] })), 'n', 'desc')
    .slice(0, 6).map(x => PP.prod(x.id)).filter(Boolean);

  return `
    <div class="pdv-busca">
      <svg class="ic"><use href="#i-busca"/></svg>
      <input class="inp" type="search" id="pdvBuscaCampo" placeholder="Nome ou código do produto — Enter adiciona o primeiro"
        value="${esc(CX.busca)}" data-inp="pdvBusca" data-act="nada" autocomplete="off" aria-label="Buscar produto">
      ${CX.busca ? `<button class="icon-btn" data-act="pdvLimparBusca" aria-label="Limpar busca"><svg class="ic"><use href="#i-x"/></svg></button>` : ''}
    </div>

    ${!CX.busca && topo.length ? `
    <div class="pdv-atalhos">
      <div class="pdv-rotulo">Mais vendidos</div>
      <div class="pdv-chips">
        ${topo.map(p => `<button class="pdv-chip" data-act="pdvAdd" data-id="${esc(p.id)}">
          <span>${esc(PP.trunc(p.nome, 22))}</span><b>${esc(PP.money0(p.preco))}</b></button>`).join('')}
      </div>
    </div>` : ''}

    <div class="pdv-rotulo">${CX.busca ? `${prods.length} resultado(s)` : 'Catálogo da loja'}</div>
    ${prods.length ? `<div class="pdv-grade">
      ${prods.map(p => {
        const disp = disponivelAgora(p);
        const semEstoque = p.controlaEstoque && disp <= 0;
        return `<button class="pdv-prod ${semEstoque ? 'vazio' : ''}" data-act="pdvAdd" data-id="${esc(p.id)}"
          ${semEstoque ? 'disabled' : ''} title="${esc(p.nome)}">
          <div class="pdv-prod-nm">${esc(p.nome)}</div>
          <div class="pdv-prod-sku">${esc(p.sku)} · ${esc(p.unidade)}</div>
          <div class="pdv-prod-pe">
            <b>${esc(PP.money(p.preco))}</b>
            ${p.controlaEstoque
              ? `<span class="badge ${disp <= 0 ? 'b-dang' : disp <= PP.n(p.estoqueMin) ? 'b-warn' : 'b-ok'}">${disp <= 0 ? 'sem estoque' : disp + ' disp.'}</span>`
              : '<span class="badge b-areia">encomenda</span>'}
          </div>
        </button>`;
      }).join('')}
    </div>` : `<div class="empty-sm">Nenhum produto encontrado para “${esc(CX.busca)}”.</div>`}`;
}

function htmlCarrinho() {
  const cfg = PP.cfg();
  const sub = PP.vendaSub(CX);
  const desc = PP.vendaDesc(CX);
  const tot = PP.vendaTotal(CX);
  const custo = PP.vendaCusto(CX);
  const margem = tot ? (tot - custo) / tot * 100 : 0;
  const nP = Math.max(PP.n(CX.parcelas), 1);
  const aVista = nP <= 1;
  const troco = PP.n(CX.recebido) - tot;
  const foraAlcada = PP.n(CX.descontoPct) > PP.n(cfg.descontoMaxBalcaoPct);
  const vends = PP.where('vendedores', v => v.ativo);

  /* Três zonas: topo e ação ficam FIXOS, só o miolo rola. Assim o botão de
     finalizar continua visível em qualquer altura de tela — inclusive em
     notebook de 768 px com o carrinho cheio. */
  return `
  <div class="pdv-topo">
    <h3>Carrinho</h3>
    ${CX.itens.length ? `<span class="pdv-cont">${PP.dec(PP.soma(CX.itens, 'qtd'), 0)} item(ns)</span>` : ''}
    ${CX.itens.length ? `<button class="btn btn-sm btn-ghost" data-act="pdvLimpar">Limpar</button>` : ''}
  </div>

  <div class="pdv-rolagem">
  <div class="pdv-itens">
    ${CX.itens.length ? CX.itens.map((i, idx) => `
      <div class="pdv-item">
        <div class="pdv-item-nm">
          <b>${esc(i.nome)}</b>
          <span>${esc(PP.money(i.preco))} / ${esc(i.unidade)}</span>
        </div>
        <div class="pdv-qtd">
          <button class="icon-btn" data-act="pdvQtd" data-i="${idx}" data-d="-1" aria-label="Menos um"><svg class="ic ic-sm"><use href="#i-menos"/></svg></button>
          <input class="inp" type="number" min="0" step="1" value="${esc(i.qtd)}" data-inp="pdvQtdCampo" data-i="${idx}" aria-label="Quantidade de ${esc(i.nome)}">
          <button class="icon-btn" data-act="pdvQtd" data-i="${idx}" data-d="1" aria-label="Mais um"><svg class="ic ic-sm"><use href="#i-plus"/></svg></button>
        </div>
        <div class="pdv-item-tot">${esc(PP.money(PP.n(i.qtd) * PP.n(i.preco)))}</div>
        <button class="icon-btn rm" data-act="pdvRm" data-i="${idx}" aria-label="Remover ${esc(i.nome)}"><svg class="ic ic-sm"><use href="#i-lixo"/></svg></button>
      </div>`).join('')
      : `<div class="pdv-vazio">
          <svg class="ic"><use href="#i-caixa"/></svg>
          <p>Carrinho vazio.<br>Busque o produto à esquerda ou use os atalhos.</p>
        </div>`}
  </div>

  <div class="pdv-meio">
    <div class="pdv-total">
      <div class="tot-line"><span class="muted">Subtotal</span><span class="tnum">${esc(PP.money(sub))}</span></div>
      <div class="tot-line">
        <span class="muted">Desconto
          <input class="inp pdv-desc" type="number" min="0" max="100" step="1" value="${esc(CX.descontoPct)}"
            data-inp="pdvDesconto" aria-label="Desconto em porcento">%
        </span>
        <span class="tnum" style="color:var(--dang)">− ${esc(PP.money(desc))}</span>
      </div>
      <div class="tot-line big"><span>Total</span><span class="tnum">${esc(PP.money(tot))}</span></div>
      ${PP.podeVerCusto() && tot ? `<div class="tot-line tiny"><span class="faint">Margem</span>
        <span class="faint">${PP.dec(margem, 1)}% · custo ${esc(PP.money0(custo))}</span></div>` : ''}
    </div>

    ${foraAlcada ? `<div class="alert a-warn" style="margin:0 0 10px">
      <svg class="ic"><use href="#i-alerta"/></svg>
      <div class="small">Desconto acima de ${PP.dec(cfg.descontoMaxBalcaoPct, 0)}% — fica registrado no seu nome.</div></div>` : ''}

    <div class="fgrid" style="gap:10px">
      <div class="f f-6"><label for="pdvVend">Vendedor</label>
        <select class="inp" id="pdvVend" data-chg="pdvCampo" data-k="vendedorId">
          ${vends.map(v => `<option value="${v.id}"${CX.vendedorId === v.id ? ' selected' : ''}>${esc(v.nome)}</option>`).join('')}
        </select></div>
      <div class="f f-6"><label for="pdvCli">Cliente ${PP.cfg().balcaoExigeCliente ? '<span class="req">*</span>' : '<span class="faint">(opcional)</span>'}</label>
        <select class="inp" id="pdvCli" data-chg="pdvCampo" data-k="clienteId">
          <option value="">— consumidor no balcão —</option>
          ${PP.clientesVisiveis().map(c => `<option value="${c.id}"${CX.clienteId === c.id ? ' selected' : ''}>${esc(c.nome)}</option>`).join('')}
        </select></div>
      <div class="f f-6"><label for="pdvForma">Forma de pagamento</label>
        <select class="inp" id="pdvForma" data-chg="pdvCampo" data-k="formaPag">
          ${PP.FORMAS_PAG.map(f => `<option value="${esc(f)}"${CX.formaPag === f ? ' selected' : ''}>${esc(f)}</option>`).join('')}
        </select></div>
      <div class="f f-6"><label for="pdvParc">Parcelas</label>
        <input class="inp" id="pdvParc" type="number" min="1" max="12" value="${esc(nP)}" data-inp="pdvCampoNum" data-k="parcelas">
        ${nP > 1 ? `<span class="hint">${nP}× de ${esc(PP.money(PP.parcelar(tot, nP, 0)[0]))}</span>` : '<span class="hint">À vista</span>'}</div>
      ${aVista && /Dinheiro/i.test(CX.formaPag) ? `
      <div class="f f-6"><label for="pdvRec">Recebido (R$)</label>
        <input class="inp inp-money" id="pdvRec" type="text" inputmode="decimal" value="${CX.recebido ? esc(PP.dec(CX.recebido)) : ''}"
          data-inp="pdvRecebido" placeholder="0,00"></div>
      <div class="f f-6"><label>Troco</label>
        <div style="padding:9px 0"><b style="font-size:17px;color:${troco < 0 ? 'var(--dang)' : 'var(--ok)'}">
          ${CX.recebido ? esc(PP.money(Math.max(troco, 0))) : '—'}</b>
          ${CX.recebido && troco < 0 ? `<span class="small" style="color:var(--dang)"> falta ${esc(PP.money(-troco))}</span>` : ''}</div></div>` : ''}
    </div>
  </div>
  </div>

  <div class="pdv-acao">
    <button class="btn btn-ok btn-block pdv-fechar" data-act="pdvFinalizar" ${CX.itens.length ? '' : 'disabled'}>
      <svg class="ic"><use href="#i-check"/></svg>
      Finalizar venda · ${esc(PP.money(tot))}
    </button>
    <div class="tiny faint tc pdv-atalhos-dica">Atalhos: <b>F2</b> finaliza · <b>Esc</b> limpa a busca</div>
  </div>`;
}

function repintarPdv() {
  const alvo = document.getElementById('pdvCarrinho');
  if (alvo) alvo.innerHTML = htmlCarrinho();
  const esq = document.querySelector('.pdv-esq');
  if (esq) esq.innerHTML = htmlCatalogo();
  const b = document.querySelector('[data-inp="pdvBusca"]');
  if (b) { b.focus(); b.setSelectionRange(b.value.length, b.value.length); }
}

/* ---------------------------- interações ---------------------------- */

PP.on('nada', () => {});
PP.on('pdvAdd', d => addItem(d.id, 1));
PP.on('pdvRm', d => { CX.itens.splice(PP.n(d.i), 1); repintarPdv(); });
PP.on('pdvLimparBusca', () => { CX.busca = ''; repintarPdv(); });

PP.on('pdvLimpar', async () => {
  if (!CX.itens.length) return;
  if (!await PP.confirmar('Limpar o carrinho e começar de novo?', { okTxt:'Limpar' })) return;
  CX = novoCarrinho();
  PP.render();
});

PP.on('pdvQtd', d => {
  const it = CX.itens[PP.n(d.i)];
  if (!it) return;
  const nova = PP.n(it.qtd) + PP.n(d.d);
  if (nova <= 0) CX.itens.splice(PP.n(d.i), 1);
  else {
    const p = PP.prod(it.produtoId);
    if (p && p.controlaEstoque && nova > PP.disponivel(p.id)) {
      PP.toast(`Estoque disponível: ${PP.disponivel(p.id)}`, 'warn');
      return;
    }
    it.qtd = nova;
  }
  repintarPdv();
});

PP.on('pdvQtdCampo', (d, el) => {
  const it = CX.itens[PP.n(d.i)];
  if (!it) return;
  const nova = PP.n(el.value);
  if (nova <= 0) { CX.itens.splice(PP.n(d.i), 1); repintarPdv(); return; }
  const p = PP.prod(it.produtoId);
  if (p && p.controlaEstoque && nova > PP.disponivel(p.id)) {
    PP.toast(`Estoque disponível: ${PP.disponivel(p.id)}`, 'warn');
    el.value = PP.disponivel(p.id);
    it.qtd = PP.disponivel(p.id);
  } else it.qtd = nova;
  const alvo = document.getElementById('pdvCarrinho');
  if (alvo) alvo.innerHTML = htmlCarrinho();
});

PP.on('pdvBusca', PP.debounce((d, el) => {
  CX.busca = el.value;
  const esq = document.querySelector('.pdv-esq');
  if (esq) esq.innerHTML = htmlCatalogo();
  const b = document.querySelector('[data-inp="pdvBusca"]');
  if (b) { b.focus(); b.setSelectionRange(b.value.length, b.value.length); }
}, 180));

PP.on('pdvCampo', (d, el) => { CX[d.k] = el.value; repintarCarrinhoSo(); });
PP.on('pdvCampoNum', (d, el) => { CX[d.k] = PP.n(el.value); repintarCarrinhoSo(); });
PP.on('pdvDesconto', (d, el) => { CX.descontoPct = Math.min(Math.max(PP.n(el.value), 0), 100); repintarCarrinhoSo(true); });
PP.on('pdvRecebido', (d, el) => { CX.recebido = PP.parseMoney(el.value); repintarCarrinhoSo(true); });

function repintarCarrinhoSo(manterFoco) {
  const ativo = document.activeElement;
  const id = ativo && ativo.id;
  const pos = ativo && ativo.selectionStart;
  const alvo = document.getElementById('pdvCarrinho');
  if (alvo) alvo.innerHTML = htmlCarrinho();
  if (manterFoco && id) {
    const novo = document.getElementById(id);
    if (novo) { novo.focus(); try { novo.setSelectionRange(pos, pos); } catch (e) {} }
  }
}

/* Enter na busca adiciona o primeiro resultado — fluxo de balcão é digitar e seguir. */
document.addEventListener('keydown', ev => {
  if (PP.rotaAtual.nome !== 'pdv' || !CX) return;
  const noCampoBusca = ev.target && ev.target.dataset && ev.target.dataset.inp === 'pdvBusca';

  if (ev.key === 'Enter' && noCampoBusca) {
    ev.preventDefault();
    const q = PP.norm(CX.busca);
    if (!q) return;
    const achado = PP.produtosBalcao().filter(p => PP.norm(p.nome).includes(q) || PP.norm(p.sku).includes(q))[0];
    if (!achado) return PP.toast('Nenhum produto com esse termo', 'warn');
    addItem(achado.id, 1);
    CX.busca = '';
    repintarPdv();
    return;
  }
  if (ev.key === 'Escape' && noCampoBusca && CX.busca) {
    ev.preventDefault(); CX.busca = ''; repintarPdv(); return;
  }
  if (ev.key === 'F2') {
    ev.preventDefault();
    if (CX.itens.length) PP.run('pdvFinalizar', { dataset:{} });
  }
});

/* ============================== FECHAMENTO ============================== */

PP.on('pdvFinalizar', async () => {
  const cfg = PP.cfg();
  if (!CX || !CX.itens.length) return PP.toast('Carrinho vazio', 'warn');
  if (!CX.vendedorId) return PP.toast('Escolha o vendedor', 'err');
  if (cfg.balcaoExigeCliente && !CX.clienteId) return PP.toast('Esta loja exige cliente na venda', 'err');

  /* confere estoque uma última vez: outra aba pode ter vendido no meio */
  const semEstoque = CX.itens.filter(i => {
    const p = PP.prod(i.produtoId);
    return p && p.controlaEstoque && PP.disponivel(p.id) < PP.n(i.qtd);
  });
  if (semEstoque.length) {
    return PP.toast(`Estoque insuficiente: ${semEstoque.map(i => i.nome).join(', ')}`, 'err');
  }

  const tot = PP.vendaTotal(CX);
  const nP = Math.max(PP.n(CX.parcelas), 1);
  const aVista = nP <= 1;

  if (aVista && /Dinheiro/i.test(CX.formaPag) && PP.n(CX.recebido) > 0 && PP.n(CX.recebido) < tot) {
    return PP.toast(`Faltam ${PP.money(tot - PP.n(CX.recebido))}`, 'err');
  }

  const ok = await PP.confirmar(
    `Fechar a venda de ${PP.money(tot)}${aVista ? ` em ${CX.formaPag.toLowerCase()}` : ` em ${nP}×`}?`,
    { title:'Finalizar venda', okTxt:'Finalizar',
      aviso:'O estoque será baixado e o valor entra em contas a receber.'
        + (PP.cfg().comissaoBase === 'metro'
          ? ' A comissão está por metro de piscina, então a venda de balcão não gera comissão.'
          : ' A comissão do vendedor é registrada.') });
  if (!ok) return;

  PP.toast('Processando venda no servidor…');
  const r = PP.driver.nome === 'supabase'
    ? await PP.fecharVendaConfirmada('balcao', CX, CX.operacaoId)
    : PP.registrarVendaBalcao(CX);
  CX = novoCarrinho();
  PP.render();
  PP.toast(`Venda #${r.venda.numero} concluída`, 'ok');
  PP.imprimir(cupomHTML(r.venda), `Cupom #${r.venda.numero}`);
});

/**
 * Grava a venda de balcão e tudo que ela dispara.
 * Separado da tela para os testes conseguirem exercitar a regra sem DOM.
 */
PP.registrarVendaBalcao = carrinho => {
  const cfg = PP.cfg();
  const tot = PP.vendaTotal(carrinho);
  const custo = PP.cent(PP.vendaCusto(carrinho));
  const nP = Math.max(PP.n(carrinho.parcelas), 1);
  const aVista = nP <= 1;
  const numero = PP.proximoNumero('proximoNumVenda');

  const vendaId = PP.upsert('vendas', {
    numero, data:PP.agora(),
    clienteId: carrinho.clienteId || '',
    clienteNome: carrinho.clienteId ? PP.cliNome(carrinho.clienteId) : (carrinho.clienteNome || 'Consumidor'),
    vendedorId: carrinho.vendedorId,
    itens: JSON.parse(JSON.stringify(carrinho.itens)),
    subtotal: PP.cent(PP.vendaSub(carrinho)),
    descontoPct: PP.n(carrinho.descontoPct),
    descontoValor: PP.vendaDesc(carrinho),
    total: tot, custo,
    formaPag: carrinho.formaPag, parcelas: nP,
    recebido: PP.cent(carrinho.recebido), troco: PP.cent(Math.max(PP.n(carrinho.recebido) - tot, 0)),
    status: 'concluida', obs: carrinho.obs || ''
  });

  /* estoque */
  carrinho.itens.forEach(i => {
    const p = PP.prod(i.produtoId);
    if (!p || !p.controlaEstoque) return;
    p.estoque = PP.n(p.estoque) - PP.n(i.qtd);
    PP.upsert('estoqueMov', { produtoId:p.id, tipo:'saida', qtd:PP.n(i.qtd), data:PP.hoje(),
      motivo:`Venda de balcão #${numero}`, ref:vendaId });
  });
  PP.save('produtos');

  /* contas a receber — à vista já entra baixado */
  if (aVista) {
    PP.upsert('financeiro', {
      tipo:'receber', descricao:`Venda de balcão #${numero}`, categoria:'Venda de balcão',
      valor:tot, vencimento:PP.hoje(), status:'pago', pagoEm:PP.hoje(), formaPag:carrinho.formaPag,
      clienteId:carrinho.clienteId || '', origem:{ tipo:'venda', id:vendaId }, parcela:1, parcelas:1, obs:''
    });
  } else {
    PP.parcelar(tot, nP, 0).forEach((valor, idx) => {
      PP.upsert('financeiro', {
        tipo:'receber', descricao:`Parcela ${idx + 1}/${nP} — Venda de balcão #${numero}`,
        categoria:'Venda de balcão', valor, vencimento:PP.addMeses(PP.hoje(), idx),
        status: idx === 0 ? 'pago' : 'aberto', pagoEm: idx === 0 ? PP.hoje() : '',
        formaPag:carrinho.formaPag, clienteId:carrinho.clienteId || '',
        origem:{ tipo:'venda', id:vendaId }, parcela:idx + 1, parcelas:nP, obs:''
      });
    });
  }

  /* comissão do balcão — percentual próprio, menor que o de piscina.
     Na regra por metro o balcão não gera comissão nenhuma: o catálogo do
     caixa não vende piscina, e só metro de piscina conta. */
  const com = PP.calcComissao({ itens:carrinho.itens, faturamento:tot, custo,
    vendedorId:carrinho.vendedorId, pct:PP.n(cfg.comissaoBalcaoPct) });
  if (com.valor > 0) {
    PP.upsert('comissoes', Object.assign({
      vendedorId:carrinho.vendedorId, vendaId, clienteId:carrinho.clienteId || '',
      competencia:PP.mesKey(PP.hoje()), status:'liberada', pagoEm:'', origem:'balcao'
    }, com));
  }

  return { venda: PP.find('vendas', vendaId) };
};

/* ============================== HISTÓRICO ============================== */

const fVen = { q:'', periodo:'hoje' };

PP.view('vendas', {
  titulo: 'Vendas da loja',
  sub: () => {
    const mk = PP.mesKey(PP.hoje());
    const mes = PP.vendasBalcaoDoMes(mk);
    return `${mes.length} venda(s) em ${PP.mesNomeLongo(mk)} · ${PP.money0(PP.soma(mes, PP.vendaTotal))}`;
  },
  render() {
    const hoje = PP.hoje();
    const mk = PP.mesKey(hoje);
    let rows = PP.escopo(PP.all('vendas'));

    if (fVen.periodo === 'hoje') rows = rows.filter(v => String(v.data).slice(0, 10) === hoje);
    else if (fVen.periodo === 'semana') rows = rows.filter(v => String(v.data).slice(0, 10) >= PP.addDias(hoje, -7));
    else if (fVen.periodo === 'mes') rows = rows.filter(v => PP.mesKey(v.data) === mk);
    if (fVen.q) {
      const q = PP.norm(fVen.q);
      rows = rows.filter(v => String(v.numero).includes(fVen.q.trim())
        || PP.norm(v.clienteNome || '').includes(q)
        || (v.itens || []).some(i => PP.norm(i.nome).includes(q)));
    }
    rows = PP.sortBy(rows, 'data', 'desc');
    const pag = PP.paginar('vendas', rows);

    const doDia = PP.where('vendas', v => v.status === 'concluida' && String(v.data).slice(0, 10) === hoje);
    const doMes = PP.vendasBalcaoDoMes(mk);
    const totMes = PP.soma(doMes, PP.vendaTotal);
    const custoMes = PP.soma(doMes, PP.vendaCusto);
    const itensMes = PP.soma(doMes, v => PP.soma(v.itens || [], 'qtd'));

    /* o que mais sai no balcão */
    const freq = {};
    doMes.forEach(v => (v.itens || []).forEach(i => {
      freq[i.nome] = freq[i.nome] || { nome:i.nome, qtd:0, total:0 };
      freq[i.nome].qtd += PP.n(i.qtd);
      freq[i.nome].total += PP.n(i.qtd) * PP.n(i.preco);
    }));
    const topo = PP.sortBy(Object.values(freq), 'total', 'desc').slice(0, 8);

    return `
      <div class="kpis kpis-6 mb">
        ${PP.kpi({ cls:'k-teal destaque', lbl:'Caixa de hoje', val:PP.money0(PP.soma(doDia, PP.vendaTotal)),
          foot:`${doDia.length} venda(s)` })}
        ${PP.kpi({ lbl:'No mês', val:PP.money0(totMes), sm:true, foot:`${doMes.length} venda(s)` })}
        ${PP.kpi({ lbl:'Ticket médio', val:PP.money0(doMes.length ? totMes / doMes.length : 0), sm:true })}
        ${PP.kpi({ cls:'k-ocre', lbl:'Itens vendidos', val:PP.dec(itensMes, 0), foot:'no mês' })}
        ${PP.podeVerCusto()
          ? PP.kpi({ cls:'k-ok', lbl:'Margem no mês', val:PP.money0(totMes - custoMes), sm:true,
              foot:PP.pct(totMes ? (totMes - custoMes) / totMes * 100 : 0, 1) })
          : PP.kpi({ cls:'k-ok', lbl:'Minhas vendas no mês', val:String(PP.escopo(doMes).length) })}
        ${PP.kpi({ cls:'k-warn', lbl:'A receber do balcão', sm:true,
          val:PP.money0(PP.soma(PP.where('financeiro', f => f.categoria === 'Venda de balcão' && f.status === 'aberto'), 'valor')),
          foot:'vendas parceladas' })}
      </div>

      <div class="grid g-3-2">
        <div class="card">
          <div class="card-hd">
            <div><h3>Histórico</h3><div class="sub">${rows.length} venda(s) no filtro</div></div>
            <div class="right row">
              <div class="seg">
                <button class="${fVen.periodo === 'hoje' ? 'on' : ''}" data-act="filtroVen" data-p="hoje">Hoje</button>
                <button class="${fVen.periodo === 'semana' ? 'on' : ''}" data-act="filtroVen" data-p="semana">7 dias</button>
                <button class="${fVen.periodo === 'mes' ? 'on' : ''}" data-act="filtroVen" data-p="mes">Mês</button>
                <button class="${!fVen.periodo ? 'on' : ''}" data-act="filtroVen" data-p="">Tudo</button>
              </div>
            </div>
          </div>
          <div class="card-bd" style="padding:12px 16px">
            <div class="mini-search" style="width:100%">
              <svg class="ic"><use href="#i-busca"/></svg>
              <input class="inp" type="search" placeholder="Número, cliente ou produto" value="${esc(fVen.q)}"
                data-inp="buscaVen" aria-label="Buscar vendas">
            </div>
          </div>
          ${rows.length ? PP.tabela({
            act:'abrirVenda', rows:pag.linhas,
            cols:[
              { h:'Nº', w:'96px', r:v => `<b>#${v.numero}</b><span class="mini">${esc(PP.dtHora(v.data).slice(-5))} · ${esc(PP.dtCurto(v.data))}</span>` },
              { h:'Cliente', r:v => `<div class="strong">${esc(v.clienteNome || 'Consumidor')}</div><span class="mini">${esc(PP.trunc((v.itens || []).map(i => i.nome).join(', '), 42))}</span>` },
              { h:'Itens', cls:'num', r:v => PP.dec(PP.soma(v.itens || [], 'qtd'), 0) },
              { h:'Vendedor', r:v => `<span class="small">${esc(PP.vendNome(v.vendedorId).split(' ')[0])}</span>` },
              { h:'Pagamento', r:v => `<span class="small">${esc(v.formaPag)}</span>${PP.n(v.parcelas) > 1 ? `<span class="mini">${v.parcelas}×</span>` : ''}` },
              { h:'Status', r:v => PP.badge(PP.STATUS_VENDA[v.status].nome, PP.STATUS_VENDA[v.status].cls) },
              { h:'Total', cls:'num', r:v => `<b>${esc(PP.money(PP.vendaTotal(v)))}</b>` }
            ]
          }) + pag.html : `<div class="empty-sm">Nenhuma venda nesse filtro.</div>`}
        </div>

        <div class="stack">
          <div class="card">
            <div class="card-hd"><div><h3>Mais vendidos</h3><div class="sub">${esc(PP.mesNomeLongo(mk))}</div></div></div>
            <div class="card-bd">
              ${topo.length ? topo.map(t => `
                <div class="att-item">
                  <svg class="ic"><use href="#i-produto"/></svg>
                  <div class="txt"><b>${esc(PP.trunc(t.nome, 26))}</b><small>${PP.dec(t.qtd, 0)} unidade(s)</small></div>
                  <div class="val">${esc(PP.money0(t.total))}</div>
                </div>`).join('') : '<div class="empty-sm">Nenhuma venda no mês.</div>'}
            </div>
          </div>
          <div class="card"><div class="card-bd">
            <button class="btn btn-ok btn-block" data-act="nav" data-v="pdv">
              <svg class="ic"><use href="#i-caixa"/></svg>Abrir o caixa</button>
          </div></div>
        </div>
      </div>`;
  }
});

PP.on('filtroVen', d => { fVen.periodo = d.p; PP.resetPagina('vendas'); PP.render(); });
PP.on('buscaVen', PP.debounce((d, el) => { fVen.q = el.value; PP.resetPagina('vendas'); PP.render(); }, 250));

PP.on('abrirVenda', d => {
  const v = PP.find('vendas', d.id);
  if (!v) return;
  const com = PP.all('comissoes').find(c => c.vendaId === v.id);
  const fin = PP.where('financeiro', f => f.origem && f.origem.tipo === 'venda' && f.origem.id === v.id);

  const body = `
    <div class="row mb" style="gap:7px">
      ${PP.badge(PP.STATUS_VENDA[v.status].nome, PP.STATUS_VENDA[v.status].cls)}
      ${PP.n(v.parcelas) > 1 ? PP.badge(v.parcelas + '× ' + v.formaPag, 'b-info') : PP.badge(v.formaPag, 'b-teal')}
    </div>

    <div class="card mb"><div class="card-bd">
      <dl class="dl">
        <dt>Data</dt><dd>${esc(PP.dtHora(v.data))}</dd>
        <dt>Cliente</dt><dd><b>${esc(v.clienteNome || 'Consumidor')}</b></dd>
        <dt>Vendedor</dt><dd>${esc(PP.vendNome(v.vendedorId))}</dd>
        ${PP.podeVerCusto() ? `<dt>Custo</dt><dd>${esc(PP.money(v.custo))} <span class="faint small">(margem ${PP.dec(PP.n(v.total) ? (PP.n(v.total) - PP.n(v.custo)) / PP.n(v.total) * 100 : 0, 1)}%)</span></dd>` : ''}
        ${com ? `<dt>Comissão</dt><dd>${esc(PP.money(com.valor))} <span class="faint small">(${esc(PP.comissaoRegra(com))})</span></dd>` : ''}
        ${PP.n(v.recebido) ? `<dt>Recebido</dt><dd>${esc(PP.money(v.recebido))} · troco ${esc(PP.money(v.troco))}</dd>` : ''}
      </dl>
    </div></div>

    <div class="card mb">
      <div class="card-hd"><div><h3>Itens</h3></div></div>
      ${PP.tabela({ rows:v.itens || [], cols:[
        { h:'Produto', r:i => `<span class="small">${esc(i.nome)}</span><span class="mini">${esc(i.sku || '')}</span>` },
        { h:'Qtd', cls:'num', r:i => PP.dec(i.qtd, PP.n(i.qtd) % 1 ? 2 : 0) },
        { h:'Unit.', cls:'num', r:i => esc(PP.money(i.preco)) },
        { h:'Total', cls:'num', r:i => `<b>${esc(PP.money(PP.n(i.qtd) * PP.n(i.preco)))}</b>` }
      ]})}
      <div class="card-ft" style="justify-content:flex-end">
        <div style="min-width:230px">
          <div class="tot-line"><span class="muted">Subtotal</span><span class="tnum">${esc(PP.money(v.subtotal))}</span></div>
          ${PP.n(v.descontoValor) ? `<div class="tot-line"><span class="muted">Desconto ${PP.dec(v.descontoPct, 0)}%</span><span class="tnum" style="color:var(--dang)">− ${esc(PP.money(v.descontoValor))}</span></div>` : ''}
          <div class="tot-line big"><span>Total</span><span class="tnum">${esc(PP.money(v.total))}</span></div>
        </div>
      </div>
    </div>

    ${fin.length ? `<div class="card">
      <div class="card-hd"><div><h3>Financeiro</h3></div></div>
      ${PP.tabela({ rows:PP.sortBy(fin, 'vencimento'), cols:[
        { h:'Descrição', r:f => `<span class="small">${esc(f.descricao)}</span>` },
        { h:'Vencimento', r:f => `<span class="small">${esc(PP.dt(f.vencimento))}</span>` },
        { h:'Situação', r:f => { const s = PP.finSituacao(f); return PP.badge(s.nome, s.cls); } },
        { h:'Valor', cls:'num', r:f => esc(PP.money(f.valor)) }
      ]})}
    </div>` : ''}`;

  const acoes = [{ txt:'Imprimir cupom', cls:'btn-teal', ic:'i-print', act:'imprimirCupom', data:{ id:v.id } }];
  if (v.clienteId) acoes.push({ txt:'WhatsApp', ic:'i-wpp', act:'waCliente', data:{ id:v.clienteId } });
  if (v.status === 'concluida' && PP.ehGestor()) acoes.push({ txt:'Cancelar venda', cls:'btn-dang', act:'cancelarVenda', data:{ id:v.id } });

  PP.drawer({ title:`Venda #${v.numero}`, sub:`${v.clienteNome || 'Consumidor'} · ${PP.money(v.total)}`, body, actions:acoes, wide:true });
});

PP.on('imprimirCupom', d => PP.imprimir(cupomHTML(PP.find('vendas', d.id)), `Cupom #${PP.find('vendas', d.id).numero}`));

PP.on('cancelarVenda', async d => {
  const v = PP.find('vendas', d.id);
  if (!PP.ehGestor()) return PP.toast('Só gerente ou administrador cancela venda', 'err');
  if (!await PP.confirmar(`Cancelar a venda #${v.numero} de ${PP.money(v.total)}?`, {
    perigo:true, okTxt:'Cancelar venda',
    aviso:'Os itens voltam para o estoque, as parcelas em aberto são canceladas e a comissão é estornada. Baixas já feitas permanecem no caixa.' })) return;

  v.status = 'cancelada';
  PP.save('vendas');

  /* devolve ao estoque */
  (v.itens || []).forEach(i => {
    const p = PP.prod(i.produtoId);
    if (!p || !p.controlaEstoque) return;
    p.estoque = PP.n(p.estoque) + PP.n(i.qtd);
    PP.upsert('estoqueMov', { produtoId:p.id, tipo:'entrada', qtd:PP.n(i.qtd), data:PP.hoje(),
      motivo:`Cancelamento da venda #${v.numero}`, ref:v.id });
  });
  PP.save('produtos');

  PP.where('financeiro', f => f.origem && f.origem.tipo === 'venda' && f.origem.id === v.id && f.status === 'aberto')
    .forEach(f => f.status = 'cancelado');
  PP.save('financeiro');

  const c = PP.all('comissoes').find(x => x.vendaId === v.id);
  if (c && c.status !== 'paga') { c.status = 'cancelada'; PP.save('comissoes'); }

  PP.closeAll(); PP.toast('Venda cancelada'); PP.render();
});

/* ============================== CUPOM ============================== */

function cupomHTML(v) {
  const cfg = PP.cfg();
  const linha = '------------------------------------------';
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Cupom ${v.numero}</title>
<style>
  @page{ size:80mm auto; margin:4mm; }
  body{ font-family:'Consolas','Courier New',monospace; font-size:11.5px; line-height:1.45;
        color:#111; margin:0 auto; max-width:74mm; }
  .c{ text-align:center; }
  .g{ font-size:15px; font-weight:700; letter-spacing:.04em; }
  .pq{ font-size:10px; color:#444; }
  table{ width:100%; border-collapse:collapse; margin:6px 0; }
  td{ padding:1.5px 0; vertical-align:top; }
  .r{ text-align:right; white-space:nowrap; }
  .sep{ border-top:1px dashed #999; margin:6px 0; }
  .tot{ font-size:15px; font-weight:700; }
  .rod{ margin-top:10px; font-size:9.5px; color:#555; text-align:center; line-height:1.5; }
</style></head><body>
  <div class="c">
    <div class="g">${esc(cfg.empresa)}</div>
    <div class="pq">${cfg.cnpj ? 'CNPJ ' + esc(cfg.cnpj) + '<br>' : ''}${esc(cfg.endereco || '')}<br>${esc(cfg.fone || '')}</div>
  </div>
  <div class="sep"></div>
  <div class="c pq">CUPOM NÃO FISCAL</div>
  <div class="pq">Venda nº <b>${esc(v.numero)}</b><br>
    ${esc(PP.dtHora(v.data))}<br>
    Cliente: ${esc(v.clienteNome || 'Consumidor')}<br>
    Vendedor: ${esc(PP.vendNome(v.vendedorId))}</div>
  <div class="sep"></div>
  <table>
    ${(v.itens || []).map(i => `
      <tr><td colspan="2">${esc(i.nome)}</td></tr>
      <tr>
        <td class="pq">${PP.dec(i.qtd, PP.n(i.qtd) % 1 ? 2 : 0)} ${esc(i.unidade || 'un')} × ${esc(PP.money(i.preco))}</td>
        <td class="r">${esc(PP.money(PP.n(i.qtd) * PP.n(i.preco)))}</td>
      </tr>`).join('')}
  </table>
  <div class="sep"></div>
  <table>
    <tr><td>Subtotal</td><td class="r">${esc(PP.money(v.subtotal))}</td></tr>
    ${PP.n(v.descontoValor) ? `<tr><td>Desconto ${PP.dec(v.descontoPct, 0)}%</td><td class="r">- ${esc(PP.money(v.descontoValor))}</td></tr>` : ''}
    <tr class="tot"><td>TOTAL</td><td class="r">${esc(PP.money(v.total))}</td></tr>
    <tr><td>${esc(v.formaPag)}${PP.n(v.parcelas) > 1 ? ` ${v.parcelas}×` : ''}</td><td class="r">${esc(PP.money(v.total))}</td></tr>
    ${PP.n(v.recebido) ? `<tr><td>Recebido</td><td class="r">${esc(PP.money(v.recebido))}</td></tr>
    <tr><td>Troco</td><td class="r">${esc(PP.money(v.troco))}</td></tr>` : ''}
  </table>
  <div class="sep"></div>
  <div class="rod">
    ${esc(linha)}<br>
    Obrigado pela preferência!<br>
    ${cfg.site ? esc(cfg.site) + '<br>' : ''}
    Trocas em até 7 dias com este cupom.
  </div>
</body></html>`;
}
PP.cupomHTML = cupomHTML;

})();
