/* ==========================================================================
   PiscinaPro — financeiro.js
   Contas a receber e a pagar, fluxo de caixa e comissões.
   ========================================================================== */
(function () {
'use strict';
const PP = window.PP;
const esc = PP.esc;

const CORES_CAT = ['#0E7C86','#6FD3D8','#B9812F','#2A5D9E','#1E7A4B','#A8322C','#8C9BA1','#D9C7AE','#12A0A8','#A8640A'];

PP.finSituacao = f => {
  if (f.status === 'pago') return { nome:'Pago', cls:'b-ok' };
  if (f.status === 'cancelado') return { nome:'Cancelado', cls:'' };
  if (f.vencimento < PP.hoje()) return { nome:'Vencido', cls:'b-dang' };
  if (PP.diasEntre(PP.hoje(), f.vencimento) <= 7) return { nome:'Vence em breve', cls:'b-warn' };
  return { nome:'Em aberto', cls:'b-info' };
};

/* ============================== CONTAS ============================== */

const fFin = { tipo:'receber', status:'', mes:'', q:'' };

PP.view('financeiro', {
  titulo: 'Contas a pagar e receber',
  sub: () => {
    const venc = PP.where('financeiro', f => f.status === 'aberto' && f.vencimento < PP.hoje());
    return venc.length ? `${venc.length} lançamento(s) vencido(s) — ${PP.money0(PP.soma(venc, 'valor'))}` : 'Nenhum lançamento vencido';
  },
  render() {
    const todos = PP.where('financeiro', f => f.status !== 'cancelado');
    const rec = todos.filter(f => f.tipo === 'receber');
    const pag = todos.filter(f => f.tipo === 'pagar');
    const recAberto = rec.filter(f => f.status === 'aberto');
    const pagAberto = pag.filter(f => f.status === 'aberto');
    const recVenc = recAberto.filter(f => f.vencimento < PP.hoje());
    const pagVenc = pagAberto.filter(f => f.vencimento < PP.hoje());

    let rows = PP.all('financeiro').filter(f => f.status !== 'cancelado');
    if (fFin.tipo !== 'todos') rows = rows.filter(f => f.tipo === fFin.tipo);
    if (fFin.status === 'aberto') rows = rows.filter(f => f.status === 'aberto');
    if (fFin.status === 'vencido') rows = rows.filter(f => f.status === 'aberto' && f.vencimento < PP.hoje());
    if (fFin.status === 'pago') rows = rows.filter(f => f.status === 'pago');
    if (fFin.mes) rows = rows.filter(f => PP.mesKey(f.vencimento) === fFin.mes);
    if (fFin.q) {
      const q = PP.norm(fFin.q);
      rows = rows.filter(f => PP.norm(f.descricao).includes(q) || PP.norm(f.categoria || '').includes(q) ||
        PP.norm(f.clienteId ? PP.cliNome(f.clienteId) : '').includes(q));
    }
    rows = PP.sortBy(rows, 'vencimento');
    const pgn = PP.paginar('financeiro', rows);

    const meses = PP.ultimosMeses(6).concat(PP.ultimosMeses(1).map(m => PP.mesKey(PP.addMeses(m + '-01', 1))),
      [PP.mesKey(PP.addMeses(PP.hoje(), 2)), PP.mesKey(PP.addMeses(PP.hoje(), 3))]);
    const mesesUnicos = meses.filter((m, i) => meses.indexOf(m) === i);

    const totalRows = PP.soma(rows, 'valor');

    return `
      <div class="kpis mb">
        ${PP.kpi({ cls:'k-ok', lbl:'A receber em aberto', val:PP.money0(PP.soma(recAberto, 'valor')), sm:true,
          foot:recVenc.length ? `${PP.money0(PP.soma(recVenc, 'valor'))} vencido` : 'nada vencido' })}
        ${PP.kpi({ cls:'k-dang', lbl:'A pagar em aberto', val:PP.money0(PP.soma(pagAberto, 'valor')), sm:true,
          foot:pagVenc.length ? `${PP.money0(PP.soma(pagVenc, 'valor'))} vencido` : 'nada vencido' })}
        ${PP.kpi({ cls:'k-teal', lbl:'Saldo projetado', val:PP.money0(PP.soma(recAberto, 'valor') - PP.soma(pagAberto, 'valor')), sm:true, foot:'receber − pagar' })}
        ${PP.kpi({ lbl:'Recebido no mês', val:PP.money0(PP.soma(rec.filter(f => f.status === 'pago' && PP.mesKey(f.pagoEm) === PP.mesKey(PP.hoje())), 'valor')), sm:true })}
        ${PP.kpi({ lbl:'Pago no mês', val:PP.money0(PP.soma(pag.filter(f => f.status === 'pago' && PP.mesKey(f.pagoEm) === PP.mesKey(PP.hoje())), 'valor')), sm:true })}
      </div>

      <div class="toolbar">
        <div class="seg">
          <button class="${fFin.tipo === 'receber' ? 'on' : ''}" data-act="finTipo" data-t="receber">A receber</button>
          <button class="${fFin.tipo === 'pagar' ? 'on' : ''}" data-act="finTipo" data-t="pagar">A pagar</button>
          <button class="${fFin.tipo === 'todos' ? 'on' : ''}" data-act="finTipo" data-t="todos">Todos</button>
        </div>
        <select class="inp" style="width:auto" data-chg="finFiltro" data-f="status" aria-label="Situação">
          <option value="">Todas as situações</option>
          <option value="aberto"${fFin.status === 'aberto' ? ' selected' : ''}>Em aberto</option>
          <option value="vencido"${fFin.status === 'vencido' ? ' selected' : ''}>Vencidos</option>
          <option value="pago"${fFin.status === 'pago' ? ' selected' : ''}>Pagos / recebidos</option>
        </select>
        <select class="inp" style="width:auto" data-chg="finFiltro" data-f="mes" aria-label="Mês de vencimento">
          <option value="">Todos os meses</option>
          ${mesesUnicos.map(m => `<option value="${m}"${fFin.mes === m ? ' selected' : ''}>${esc(PP.mesNomeLongo(m))}</option>`).join('')}
        </select>
        <div class="mini-search">
          <svg class="ic"><use href="#i-busca"/></svg>
          <input class="inp" type="search" placeholder="Descrição ou categoria" value="${esc(fFin.q)}" data-inp="buscaFin" aria-label="Buscar lançamentos">
        </div>
        <div class="row-end row">
          <button class="btn" data-act="exportarFin"><svg class="ic"><use href="#i-down"/></svg>CSV</button>
          <button class="btn btn-primary" data-act="novoFin"><svg class="ic"><use href="#i-plus"/></svg>Lançamento</button>
        </div>
      </div>

      <div class="card">
        <div class="card-hd"><div><h3>${fFin.tipo === 'receber' ? 'Contas a receber' : fFin.tipo === 'pagar' ? 'Contas a pagar' : 'Todos os lançamentos'}</h3>
          <div class="sub">${rows.length} lançamento(s) · ${PP.money(totalRows)}</div></div></div>
        ${rows.length ? PP.tabela({
          act:'editarFin', rows:pgn.linhas,
          cols:[
            { h:'Vencimento', w:'112px', r:f => {
              const s = PP.finSituacao(f);
              return `<b class="small" style="${s.nome === 'Vencido' ? 'color:var(--dang)' : ''}">${esc(PP.dt(f.vencimento))}</b><span class="mini">${f.status === 'pago' ? 'baixa ' + PP.dt(f.pagoEm) : PP.tempoRelativo(f.vencimento)}</span>`;
            } },
            { h:'Descrição', r:f => `<div class="strong">${esc(f.descricao)}</div><span class="mini">${esc(f.categoria || '')}${f.clienteId ? ' · ' + esc(PP.cliNome(f.clienteId)) : ''}${f.fornecedorId ? ' · ' + esc(PP.fornNome(f.fornecedorId)) : ''}</span>` },
            fFin.tipo === 'todos' ? { h:'Tipo', r:f => PP.badge(f.tipo === 'receber' ? 'Receber' : 'Pagar', f.tipo === 'receber' ? 'b-ok' : 'b-dang') } : null,
            { h:'Forma', r:f => `<span class="small">${esc(f.formaPag || '—')}</span>` },
            { h:'Situação', r:f => { const s = PP.finSituacao(f); return PP.badge(s.nome, s.cls); } },
            { h:'Valor', cls:'num', r:f => `<b style="color:${f.tipo === 'receber' ? 'var(--ok)' : 'var(--dang)'}">${f.tipo === 'receber' ? '' : '− '}${esc(PP.money(f.valor))}</b>` },
            { h:'', cls:'acts', r:f => f.status === 'aberto'
              ? `${f.tipo === 'receber' && f.clienteId && f.vencimento < PP.hoje()
                  ? `<button class="btn btn-sm" data-act="waCobranca" data-id="${esc(f.id)}" title="Cobrar por WhatsApp"><svg class="ic ic-sm"><use href="#i-wpp"/></svg></button> ` : ''}`
                + `<button class="btn btn-sm ${f.tipo === 'receber' ? 'btn-ok' : ''}" data-act="baixarFin" data-id="${esc(f.id)}">${f.tipo === 'receber' ? 'Receber' : 'Pagar'}</button>`
              : `<span class="tiny faint">${esc(PP.dt(f.pagoEm))}</span>` }
          ],
          foot:{ }
        }) + pgn.html : '<div class="empty-sm">Nenhum lançamento nesse filtro.</div>'}
      </div>`;
  }
});

PP.on('finTipo', d => { fFin.tipo = d.t; PP.resetPagina('financeiro'); PP.render(); });
PP.on('finFiltro', (d, el) => { fFin[d.f] = el.value; PP.resetPagina('financeiro'); PP.render(); });
PP.on('buscaFin', PP.debounce((d, el) => { fFin.q = el.value; PP.resetPagina('financeiro'); PP.render(); }, 250));

PP.on('baixarFin', async (d, el) => {
  const f = PP.find('financeiro', d.id);
  if (!f || f.status !== 'aberto') return;
  const ok = await PP.confirmar(
    `Confirmar ${f.tipo === 'receber' ? 'o recebimento' : 'o pagamento'} de ${PP.money(f.valor)}?\n\n${f.descricao}`,
    { title:f.tipo === 'receber' ? 'Baixar recebimento' : 'Baixar pagamento', okTxt:'Confirmar baixa' });
  if (!ok) return;
  f.status = 'pago';
  f.pagoEm = PP.hoje();
  PP.save('financeiro');

  /* se todas as parcelas do pedido foram quitadas, conclui o pedido */
  if (f.origem && f.origem.tipo === 'pedido') {
    const irmaos = PP.where('financeiro', x => x.tipo === 'receber' && x.origem && x.origem.id === f.origem.id && x.status !== 'cancelado');
    if (irmaos.length && irmaos.every(x => x.status === 'pago')) {
      const p = PP.find('pedidos', f.origem.id);
      if (p && p.status !== 'cancelado' && p.status !== 'concluido') { p.status = 'concluido'; PP.save('pedidos'); }
      const c = PP.all('comissoes').find(x => x.pedidoId === f.origem.id);
      if (c && c.status === 'prevista') { c.status = 'liberada'; PP.save('comissoes'); }
      PP.toast('Pedido quitado — comissão liberada', 'ok');
    }
  }
  PP.closeAll();
  PP.toast('Baixa registrada', 'ok');
  PP.render();
});

function camposFin(tipo) {
  return [
    { k:'id', t:'hidden' },
    { k:'tipo', l:'Tipo', t:'select', col:4, req:true, vazio:false, opts:[{ v:'receber', l:'A receber' }, { v:'pagar', l:'A pagar' }] },
    { k:'descricao', l:'Descrição', t:'text', col:8, req:true },
    { k:'categoria', l:'Categoria', t:'select', col:6, req:true, opts:PP.CAT_FIN.receita.concat(PP.CAT_FIN.despesa) },
    { k:'valor', l:'Valor (R$)', t:'money', col:3, req:true, val:'positivo' },
    { k:'vencimento', l:'Vencimento', t:'date', col:3, req:true },
    { k:'formaPag', l:'Forma de pagamento', t:'select', col:4, opts:PP.FORMAS_PAG },
    { k:'clienteId', l:'Cliente', t:'select', col:4, opts:PP.all('clientes').map(c => ({ v:c.id, l:c.nome })) },
    { k:'fornecedorId', l:'Fornecedor', t:'select', col:4, opts:PP.all('fornecedores').map(f => ({ v:f.id, l:f.nome })) },
    { k:'obs', l:'Observações', t:'textarea', col:12, rows:2 }
  ];
}

PP.on('novoFin', () => abrirFormFin(null));
PP.on('editarFin', d => abrirFormFin(PP.find('financeiro', d.id)));

function abrirFormFin(f) {
  const novo = !f;
  PP.modal({
    title: novo ? 'Novo lançamento' : 'Editar lançamento',
    sub: f && f.origem && f.origem.tipo === 'pedido' ? 'Lançamento gerado por um pedido de venda' : '',
    size:'lg',
    body:`<form data-sub="salvarFin" id="formFin">${PP.form(camposFin(), f || { tipo:fFin.tipo === 'pagar' ? 'pagar' : 'receber', vencimento:PP.hoje(), formaPag:'PIX', parcela:1, parcelas:1 })}</form>
      ${novo ? `<div class="alert a-info mt"><svg class="ic"><use href="#i-alerta"/></svg><div class="small">Para parcelar, crie o lançamento e depois use <b>Duplicar</b>, ou gere as parcelas automaticamente aprovando um orçamento.</div></div>` : ''}`,
    actions:[
      { txt:'Salvar', cls:'btn-primary', act:'salvarFinBtn' },
      f && f.status === 'aberto' ? { txt:f.tipo === 'receber' ? 'Receber agora' : 'Pagar agora', cls:'btn-ok', act:'baixarFin', data:{ id:f.id } } : null,
      f ? { txt:'Excluir', act:'excluirFin', data:{ id:f.id } } : null,
      { txt:'Cancelar', act:'fechar' }
    ].filter(Boolean)
  });
}
PP.on('salvarFinBtn', (d, el) => salvarFin(el.closest('.modal-box').querySelector('#formFin')));
PP.on('salvarFin', (d, el) => salvarFin(el));
function salvarFin(form) {
  const { ok, data } = PP.lerForm(form);
  if (!ok) return;
  if (!data.id) { data.status = 'aberto'; data.pagoEm = ''; data.origem = { tipo:'manual' }; data.parcela = 1; data.parcelas = 1; }
  PP.upsert('financeiro', data);
  PP.closeTop(); PP.toast('Lançamento salvo', 'ok'); PP.render();
}

PP.on('excluirFin', async d => {
  const f = PP.find('financeiro', d.id);
  if (!await PP.confirmar(`Excluir o lançamento "${f.descricao}"?`, { perigo:true, okTxt:'Excluir',
    aviso: f.origem && f.origem.tipo === 'pedido' ? 'Esse lançamento veio de um pedido de venda. Excluir vai desalinhar o total recebido do pedido.' : '' })) return;
  PP.remove('financeiro', d.id);
  PP.closeTop(); PP.toast('Lançamento excluído'); PP.render();
});

PP.on('exportarFin', () => {
  const linhas = [['Tipo','Descrição','Categoria','Cliente','Fornecedor','Vencimento','Situação','Pago em','Forma','Valor']];
  PP.all('financeiro').forEach(f => linhas.push([
    f.tipo === 'receber' ? 'A receber' : 'A pagar', f.descricao, f.categoria || '',
    f.clienteId ? PP.cliNome(f.clienteId) : '', f.fornecedorId ? PP.fornNome(f.fornecedorId) : '',
    PP.dt(f.vencimento), PP.finSituacao(f).nome, f.pagoEm ? PP.dt(f.pagoEm) : '', f.formaPag || '', PP.dec(f.valor)
  ]));
  PP.baixar(`financeiro-${PP.hoje()}.csv`, PP.csv(linhas), 'text/csv;charset=utf-8');
  PP.toast('CSV exportado', 'ok');
});

/* ============================== FLUXO DE CAIXA ============================== */

PP.view('fluxo', {
  titulo: 'Fluxo de caixa',
  sub: 'Realizado dos últimos meses e projeção pelos lançamentos em aberto',
  render() {
    const meses = PP.ultimosMeses(6);
    const futuros = [1, 2, 3].map(n => PP.mesKey(PP.addMeses(PP.hoje(), n)));
    const todos = meses.concat(futuros);
    const hojeMes = PP.mesKey(PP.hoje());

    const dados = todos.map(mk => {
      const passado = mk < hojeMes;
      const ent = PP.soma(PP.where('financeiro', f => f.tipo === 'receber' && f.status !== 'cancelado' &&
        (passado ? (f.status === 'pago' && PP.mesKey(f.pagoEm) === mk) : PP.mesKey(f.vencimento) === mk)), 'valor');
      const sai = PP.soma(PP.where('financeiro', f => f.tipo === 'pagar' && f.status !== 'cancelado' &&
        (passado ? (f.status === 'pago' && PP.mesKey(f.pagoEm) === mk) : PP.mesKey(f.vencimento) === mk)), 'valor');
      return { mk, ent, sai, saldo:ent - sai, projetado:!passado };
    });

    let acum = 0;
    const acumulado = dados.map(d => { acum += d.saldo; return acum; });

    /* DRE simplificado do mês corrente */
    const recMes = PP.where('financeiro', f => f.tipo === 'receber' && f.status === 'pago' && PP.mesKey(f.pagoEm) === hojeMes);
    const pagMes = PP.where('financeiro', f => f.tipo === 'pagar' && f.status === 'pago' && PP.mesKey(f.pagoEm) === hojeMes);
    const receita = PP.soma(recMes, 'valor');
    const custoVenda = PP.soma(pagMes.filter(f => ['Compra de piscina','Equipamentos','Mão de obra','Máquinas / escavação','Frete'].includes(f.categoria)), 'valor');
    const comissao = PP.soma(pagMes.filter(f => f.categoria === 'Comissão'), 'valor');
    const despOper = PP.soma(pagMes.filter(f => ['Administrativo','Marketing','Outras despesas'].includes(f.categoria)), 'valor');
    const impostos = PP.soma(pagMes.filter(f => f.categoria === 'Impostos'), 'valor');
    const lucro = receita - custoVenda - comissao - despOper - impostos;

    /* despesas por categoria (12 meses) */
    const catMap = {};
    PP.where('financeiro', f => f.tipo === 'pagar' && f.status === 'pago').forEach(f => {
      catMap[f.categoria || 'Outras despesas'] = (catMap[f.categoria || 'Outras despesas'] || 0) + PP.n(f.valor);
    });
    const cats = PP.sortBy(Object.keys(catMap).map((k, i) => ({ label:k, valor:catMap[k] })), 'valor', 'desc')
      .slice(0, 8).map((c, i) => Object.assign(c, { cor:CORES_CAT[i % CORES_CAT.length] }));

    return `
      <div class="kpis mb">
        ${PP.kpi({ cls:'k-ok', lbl:'Entradas no mês', val:PP.money0(receita), sm:true })}
        ${PP.kpi({ cls:'k-dang', lbl:'Saídas no mês', val:PP.money0(PP.soma(pagMes, 'valor')), sm:true })}
        ${PP.kpi({ cls: lucro >= 0 ? 'k-teal' : 'k-dang', lbl:'Resultado do mês', val:PP.money0(lucro), sm:true,
          foot:receita ? PP.pct(lucro / receita * 100, 1) + ' de margem líquida' : '—' })}
        ${PP.kpi({ cls:'k-ocre', lbl:'Saldo acumulado projetado', val:PP.money0(acumulado[acumulado.length - 1]), sm:true, foot:'até ' + PP.mesNome(todos[todos.length - 1]) })}
      </div>

      <div class="card mb">
        <div class="card-hd">
          <div><h3>Entradas x saídas</h3><div class="sub">Meses passados = realizado · meses futuros = projeção pelos vencimentos</div></div>
          <div class="right legend">
            <span><i style="background:#1E7A4B"></i>Entradas</span>
            <span><i style="background:#A8322C"></i>Saídas</span>
          </div>
        </div>
        <div class="card-bd">
          ${PP.chart.barras({
            labels:todos.map(m => PP.mesNome(m) + (m > hojeMes ? '*' : '')), height:250,
            series:[
              { nome:'Entradas', cor:'#1E7A4B', values:dados.map(d => d.ent) },
              { nome:'Saídas', cor:'#A8322C', values:dados.map(d => d.sai) }
            ]
          })}
          <div class="tiny faint mt">* meses marcados são projeção, não realizado.</div>
        </div>
      </div>

      <div class="grid g-2 mb">
        <div class="card">
          <div class="card-hd"><div><h3>Saldo acumulado</h3><div class="sub">Efeito caixa mês a mês</div></div></div>
          <div class="card-bd">
            ${PP.chart.linha({
              labels:todos.map(PP.mesNome), height:220,
              series:[{ nome:'Saldo acumulado', cor:'#0E7C86', values:acumulado }]
            })}
          </div>
        </div>
        <div class="card">
          <div class="card-hd"><div><h3>Para onde vai o dinheiro</h3><div class="sub">Despesas pagas por categoria</div></div></div>
          <div class="card-bd">${PP.chart.rosca({ items:cats, centroLbl:'Pago' })}</div>
        </div>
      </div>

      <div class="grid g-2">
        <div class="card">
          <div class="card-hd"><div><h3>Resultado do mês</h3><div class="sub">${PP.mesNomeLongo(hojeMes)} — regime de caixa</div></div></div>
          <div class="card-bd">
            <div class="tot-box">
              <div class="tot-line"><span class="muted">Receita recebida</span><b class="tnum" style="color:var(--ok)">${esc(PP.money(receita))}</b></div>
              <div class="tot-line"><span class="muted">(−) Custo de produto e obra</span><span class="tnum">${esc(PP.money(custoVenda))}</span></div>
              <div class="tot-line"><span class="muted">(−) Comissões</span><span class="tnum">${esc(PP.money(comissao))}</span></div>
              <div class="tot-line"><span class="muted">(−) Despesas operacionais</span><span class="tnum">${esc(PP.money(despOper))}</span></div>
              <div class="tot-line"><span class="muted">(−) Impostos</span><span class="tnum">${esc(PP.money(impostos))}</span></div>
              <div class="tot-line big"><span>Resultado</span><span class="tnum" style="color:${lucro >= 0 ? 'var(--ok)' : 'var(--dang)'}">${esc(PP.money(lucro))}</span></div>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-hd"><div><h3>Mês a mês</h3></div></div>
          ${PP.tabela({ rows:dados.map((d, i) => Object.assign({ id:d.mk, acum:acumulado[i] }, d)), cols:[
            { h:'Mês', r:d => `<b>${esc(PP.mesNome(d.mk))}</b>${d.projetado ? ' <span class="badge b-info">proj.</span>' : ''}` },
            { h:'Entradas', cls:'num', r:d => `<span style="color:var(--ok)">${esc(PP.moneyK(d.ent))}</span>` },
            { h:'Saídas', cls:'num', r:d => `<span style="color:var(--dang)">${esc(PP.moneyK(d.sai))}</span>` },
            { h:'Saldo', cls:'num', r:d => `<b style="color:${d.saldo >= 0 ? 'var(--ok)' : 'var(--dang)'}">${esc(PP.moneyK(d.saldo))}</b>` },
            { h:'Acumulado', cls:'num', r:d => `<span class="tnum">${esc(PP.moneyK(d.acum))}</span>` }
          ]})}
        </div>
      </div>`;
  }
});

/* ============================== DRE ==============================

   Demonstração do Resultado do Exercício, por COMPETÊNCIA: o resultado é do
   mês em que a venda aconteceu, não do mês em que o dinheiro entrou. Quem
   mostra o dinheiro entrando é o Fluxo de caixa, ao lado.

   O risco de uma DRE montada em cima de contas a pagar/receber é contar a
   mesma coisa duas vezes: aprovar um orçamento já lança o custo do produto em
   contas a pagar, e pagar a comissão lança outra despesa. Por isso a receita e
   o custo saem dos DOCUMENTOS (pedido e venda guardam a própria foto), e os
   lançamentos que são só a contrapartida financeira deles ficam de fora — com
   o total de cada exclusão à vista, no rodapé, para a conta fechar na mão de
   quem conferir.
   ========================================================================== */

/* Categorias que são custo do que foi vendido, e não despesa do mês. */
const CAT_CUSTO = ['Compra de piscina','Equipamentos','Mão de obra','Máquinas / escavação','Frete'];

/** Período fechado a partir de um mês âncora. */
PP.periodoDRE = (ancora, tipo) => {
  const [a, m] = ancora.split('-').map(Number);
  let ini, fim;
  if (tipo === 'ano')            { ini = 1;  fim = 12; }
  else if (tipo === 'trimestre') { ini = Math.floor((m - 1) / 3) * 3 + 1; fim = ini + 2; }
  else                           { ini = m;  fim = m; }
  const meses = [];
  for (let i = ini; i <= fim; i++) meses.push(a + '-' + String(i).padStart(2, '0'));
  const ultimo = new Date(a, fim, 0).getDate();
  return {
    tipo, ancora, meses,
    de: meses[0] + '-01',
    ate: meses[meses.length - 1] + '-' + String(ultimo).padStart(2, '0'),
    nome: tipo === 'ano' ? String(a)
        : tipo === 'trimestre' ? Math.ceil(ini / 3) + 'º trimestre de ' + a
        : PP.mesNomeLongo(meses[0])
  };
};

/** Desloca o período em n unidades (mês, trimestre ou ano). */
PP.deslocarPeriodo = (p, n) => {
  const passo = p.tipo === 'ano' ? 12 : p.tipo === 'trimestre' ? 3 : 1;
  return PP.periodoDRE(PP.mesKey(PP.addMeses(p.de, passo * n)), p.tipo);
};

/**
 * Monta a DRE do período. Devolve as linhas prontas para a tela e o bloco de
 * conciliação — o que ficou de fora e por quê.
 */
/* A tela pede a DRE nove vezes por render: o período, o anterior, os seis
   meses do gráfico e o subtítulo. Cada uma varre pedidos, vendas, comissões e
   financeiro inteiros — com três anos de operação isso pesa. O resultado é
   memoizado por período e cai fora assim que qualquer uma das quatro coleções
   de origem muda. */
PP.registrarDerivado('dre', ['pedidos', 'vendas', 'comissoes', 'financeiro']);

PP.dre = periodo => PP.cacheDe('dre', periodo.de + '|' + periodo.ate, () => calcularDRE(periodo));

function calcularDRE(periodo) {
  const { de, ate, meses } = periodo;
  const noPeriodo = d => { const s = String(d || '').slice(0, 10); return s >= de && s <= ate; };
  const som = (arr, fn) => PP.cent(arr.reduce((s, x) => s + PP.n(typeof fn === 'function' ? fn(x) : x[fn]), 0));

  /* ---------- receita: dos documentos, não dos recebimentos ---------- */
  const pedidos = PP.where('pedidos', p => noPeriodo(p.data) && p.status !== 'cancelado');
  const cancelados = PP.where('pedidos', p => noPeriodo(p.data) && p.status === 'cancelado');
  const vendas = PP.where('vendas', v => noPeriodo(v.data) && v.status === 'concluida');

  /* receber que NÃO é contrapartida de pedido/venda é receita própria:
     contrato de manutenção, chamado cobrado, avulso */
  const outrasRec = PP.where('financeiro', f => f.tipo === 'receber' && f.status !== 'cancelado' &&
    noPeriodo(f.vencimento) && !['pedido','venda'].includes((f.origem || {}).tipo || ''));

  const recPiscinas = som(pedidos, PP.pedidoTotal);
  const recBalcao   = som(vendas, 'total');
  const recServicos = som(outrasRec, 'valor');
  const receitaBruta = PP.cent(recPiscinas + recBalcao + recServicos);

  /* ---------- deduções ---------- */
  const pagar = PP.where('financeiro', f => f.tipo === 'pagar' && f.status !== 'cancelado' && noPeriodo(f.vencimento));
  const origemDe = f => (f.origem || {}).tipo || '';

  const impostos = som(pagar.filter(f => f.categoria === 'Impostos'), 'valor');
  const devolucoes = som(cancelados, PP.pedidoTotal);
  const deducoes = PP.cent(impostos + devolucoes);
  const receitaLiquida = PP.cent(receitaBruta - deducoes);

  /* ---------- custo do que foi vendido ---------- */
  const cpvPiscinas = som(pedidos, PP.pedidoCusto);
  const cpvBalcao   = som(vendas, 'custo');
  /* custo direto lançado à mão, sem pedido e sem compra de estoque por trás */
  const cpvAvulso = som(pagar.filter(f => CAT_CUSTO.includes(f.categoria) &&
    !['pedido','compra'].includes(origemDe(f))), 'valor');
  const cpv = PP.cent(cpvPiscinas + cpvBalcao + cpvAvulso);
  const lucroBruto = PP.cent(receitaLiquida - cpv);

  /* ---------- despesas operacionais ---------- */
  /* comissão por competência, não por pagamento */
  const comissoes = som(PP.where('comissoes', c => meses.includes(c.competencia) && c.status !== 'cancelada'), 'valor');

  const operacional = pagar.filter(f =>
    !['pedido','comissao','compra'].includes(origemDe(f)) &&
    f.categoria !== 'Impostos' &&
    !CAT_CUSTO.includes(f.categoria));

  const marketing   = som(operacional.filter(f => f.categoria === 'Marketing'), 'valor');
  const administrat = som(operacional.filter(f => f.categoria === 'Administrativo'), 'valor');
  const assistencia = som(pagar.filter(f => origemDe(f) === 'chamado'), 'valor');
  const outras      = som(operacional.filter(f =>
    !['Marketing','Administrativo'].includes(f.categoria) && origemDe(f) !== 'chamado'), 'valor');

  const despOper = PP.cent(comissoes + marketing + administrat + assistencia + outras);
  const resultadoOper = PP.cent(lucroBruto - despOper);

  /* ---------- o que ficou fora, e por quê ---------- */
  const fora = [
    { nome:'Custo de produto e obra já contado no CPV',
      valor: som(pagar.filter(f => origemDe(f) === 'pedido'), 'valor'),
      porque:'é a contrapartida financeira do custo que já saiu dos pedidos' },
    { nome:'Comissões pagas neste período',
      valor: som(pagar.filter(f => origemDe(f) === 'comissao'), 'valor'),
      porque:'a comissão entra por competência, no mês da venda' },
    { nome:'Compras de estoque',
      valor: som(pagar.filter(f => origemDe(f) === 'compra'), 'valor'),
      porque:'vira estoque; só afeta o resultado quando o produto é vendido' },
    { nome:'Parcelas recebidas de vendas de outros períodos',
      valor: som(PP.where('financeiro', f => f.tipo === 'receber' && f.status === 'pago' &&
        noPeriodo(f.pagoEm) && ['pedido','venda'].includes(origemDe(f))), 'valor'),
      porque:'a receita já foi reconhecida no mês da venda' }
  ].filter(x => x.valor > 0);

  const pct = v => receitaLiquida ? v / receitaLiquida * 100 : 0;

  return {
    periodo, receitaLiquida,
    linhas: [
      { k:'receitaBruta',   nome:'RECEITA OPERACIONAL BRUTA', valor:receitaBruta, nivel:'total' },
      { k:'recPiscinas',    nome:'Venda de piscinas',      valor:recPiscinas, nivel:'item', qtd:pedidos.length },
      { k:'recBalcao',      nome:'Venda de balcão',        valor:recBalcao,   nivel:'item', qtd:vendas.length },
      { k:'recServicos',    nome:'Serviços e manutenção',  valor:recServicos, nivel:'item', qtd:outrasRec.length },

      { k:'deducoes',       nome:'(−) Deduções sobre vendas', valor:-deducoes || 0, nivel:'sub' },
      { k:'impostos',       nome:'Impostos sobre vendas',  valor:-impostos || 0,   nivel:'item' },
      { k:'devolucoes',     nome:'Pedidos cancelados',     valor:-devolucoes || 0, nivel:'item', qtd:cancelados.length },

      { k:'receitaLiquida', nome:'= RECEITA LÍQUIDA', valor:receitaLiquida, nivel:'total', destaque:true },

      { k:'cpv',            nome:'(−) Custo dos produtos e serviços vendidos', valor:-cpv || 0, nivel:'sub' },
      { k:'cpvPiscinas',    nome:'Piscinas, equipamentos e instalação', valor:-cpvPiscinas || 0, nivel:'item' },
      { k:'cpvBalcao',      nome:'Mercadorias do balcão',  valor:-cpvBalcao || 0,  nivel:'item' },
      { k:'cpvAvulso',      nome:'Custos diretos avulsos', valor:-cpvAvulso || 0,  nivel:'item' },

      { k:'lucroBruto',     nome:'= LUCRO BRUTO', valor:lucroBruto, nivel:'total', destaque:true, margem:pct(lucroBruto) },

      { k:'despOper',       nome:'(−) Despesas operacionais', valor:-despOper || 0, nivel:'sub' },
      { k:'comissoes',      nome:'Comissões de vendas',   valor:-comissoes || 0,   nivel:'item' },
      { k:'marketing',      nome:'Marketing',             valor:-marketing || 0,   nivel:'item' },
      { k:'administrat',    nome:'Administrativas',       valor:-administrat || 0, nivel:'item' },
      { k:'assistencia',    nome:'Assistência e garantia', valor:-assistencia || 0, nivel:'item' },
      { k:'outras',         nome:'Outras despesas',       valor:-outras || 0,      nivel:'item' },

      { k:'resultadoOper',  nome:'= RESULTADO DO PERÍODO', valor:resultadoOper, nivel:'total',
        destaque:true, margem:pct(resultadoOper) }
    ].map(l => Object.assign(l, { vertical: pct(l.valor) })),
    fora,
    totais: { receitaBruta, deducoes, receitaLiquida, cpv, lucroBruto, despOper, resultado:resultadoOper,
              margemBruta:pct(lucroBruto), margemLiquida:pct(resultadoOper) }
  };
}

/* ------------------------------ tela ------------------------------ */

const fDre = { ancora:'', tipo:'mes', comparar:true };

function periodoAtual() {
  return PP.periodoDRE(fDre.ancora || PP.mesKey(PP.hoje()), fDre.tipo);
}

PP.view('dre', {
  titulo: 'DRE',
  sub: () => {
    const d = PP.dre(periodoAtual());
    return `${d.periodo.nome} — resultado de ${PP.money0(d.totais.resultado)} (${PP.dec(d.totais.margemLiquida, 1)}% da receita líquida)`;
  },
  render() {
    const p = periodoAtual();
    const d = PP.dre(p);
    const ant = fDre.comparar ? PP.dre(PP.deslocarPeriodo(p, -1)) : null;
    const antPorK = {};
    if (ant) ant.linhas.forEach(l => antPorK[l.k] = l.valor);

    /* A seta diz se a LINHA cresceu; a cor diz se isso é bom. Não é a mesma
       pergunta: custo crescendo é ▲ e vermelho. Quando o sinal vira (prejuízo
       que virou lucro), percentual não significa nada — mostra a diferença. */
    const comparar = l => {
      if (!ant) return '';
      const a = antPorK[l.k] || 0;
      const v = l.valor || 0;
      if (!a && !v) return '<span class="faint">—</span>';
      if (!a) return '<span class="dre-novo">novo</span>';
      if ((v < 0) !== (a < 0)) {
        const dif = v - a;
        return `<span class="dre-var ${dif > 0 ? 'up' : 'down'}">${dif > 0 ? '+' : '−'}${esc(PP.money0(Math.abs(dif)))}</span>`;
      }
      const cresc = (Math.abs(v) - Math.abs(a)) / Math.abs(a) * 100;
      if (Math.abs(cresc) < 0.05) return '<span class="faint">=</span>';
      const bom = v >= 0 ? cresc > 0 : cresc < 0;
      return `<span class="dre-var ${bom ? 'up' : 'down'}">${cresc > 0 ? '▲' : '▼'} ${PP.dec(Math.abs(cresc), 1)}%</span>`;
    };

    /* Linha zerada continua na tela — demonstração financeira tem estrutura
       fixa, some conta e ninguém acha o que sumiu —, mas some do olho. */
    const num = (v, cls) => (v === 0 || v === undefined)
      ? '<span class="faint">—</span>'
      : `<span class="${cls || ''}">${esc(PP.money(v))}</span>`;

    const linha = l => {
      const cls = 'dre-l dre-' + l.nivel + (l.destaque ? ' dre-forte' : '');
      const negativo = l.nivel === 'total' && l.valor < 0;
      return `<tr class="${cls}">
        <th scope="row">${esc(l.nome)}${l.qtd ? ` <span class="dre-qtd">${l.qtd}</span>` : ''}</th>
        <td class="num tnum"${negativo ? ' style="color:var(--dang)"' : ''}>${num(l.valor)}</td>
        <td class="num tnum faint">${l.k === 'receitaBruta' || !d.receitaLiquida || !l.valor ? '—' : PP.dec(l.vertical, 1) + '%'}</td>
        ${ant ? `<td class="num tnum faint">${num(antPorK[l.k])}</td><td class="num">${comparar(l)}</td>` : ''}
      </tr>`;
    };

    const meses = p.meses.length > 1 ? p.meses : PP.ultimosMeses(6);
    const serie = meses.map(m => PP.dre(PP.periodoDRE(m, 'mes')).totais);

    return `
      <div class="toolbar">
        <div class="seg">
          ${[['mes','Mês'], ['trimestre','Trimestre'], ['ano','Ano']].map(([v, l]) =>
            `<button class="${fDre.tipo === v ? 'on' : ''}" data-act="drePeriodo" data-t="${v}">${l}</button>`).join('')}
        </div>
        <div class="row" style="gap:4px">
          <button class="btn btn-sm" data-act="dreAndar" data-n="-1" aria-label="Período anterior"><svg class="ic"><use href="#i-voltar"/></svg></button>
          <span class="dre-periodo">${esc(p.nome)}</span>
          <button class="btn btn-sm" data-act="dreAndar" data-n="1" aria-label="Próximo período"><svg class="ic"><use href="#i-seta"/></svg></button>
        </div>
        <label class="check small"><input type="checkbox" data-chg="dreComparar"${fDre.comparar ? ' checked' : ''}><span>Comparar com o período anterior</span></label>
        <div class="row-end row">
          <button class="btn" data-act="dreCSV"><svg class="ic"><use href="#i-down"/></svg>CSV</button>
          <button class="btn" data-act="drePDF"><svg class="ic"><use href="#i-print"/></svg>Imprimir</button>
        </div>
      </div>

      <div class="kpis mb">
        ${PP.kpi({ cls:'k-teal', lbl:'Receita líquida', val:PP.money0(d.totais.receitaLiquida), sm:true,
          foot:`bruta ${PP.money0(d.totais.receitaBruta)}` })}
        ${PP.kpi({ cls:'k-ok', lbl:'Lucro bruto', val:PP.money0(d.totais.lucroBruto), sm:true,
          foot:PP.dec(d.totais.margemBruta, 1) + '% de margem bruta' })}
        ${PP.kpi({ cls:'k-warn', lbl:'Despesas operacionais', val:PP.money0(d.totais.despOper), sm:true,
          foot:d.receitaLiquida ? PP.dec(d.totais.despOper / d.receitaLiquida * 100, 1) + '% da receita líquida' : '—' })}
        ${PP.kpi({ cls: d.totais.resultado >= 0 ? 'k-teal' : 'k-dang', lbl:'Resultado do período',
          val:PP.money0(d.totais.resultado), sm:true,
          foot:PP.dec(d.totais.margemLiquida, 1) + '% de margem líquida' })}
      </div>

      <div class="card mb">
          <div class="card-hd">
            <div><h3>Demonstração do resultado</h3>
              <div class="sub">${esc(p.nome)} — regime de competência</div></div>
          </div>
          <div class="card-bd" style="padding:0">
            <div class="tbl-wrap">
              <table class="tbl dre-tbl">
                <thead><tr>
                  <th scope="col">Conta</th>
                  <th scope="col" class="num">Valor</th>
                  <th scope="col" class="num">% RL</th>
                  ${ant ? `<th scope="col" class="num">${esc(ant.periodo.nome)}</th><th scope="col" class="num">Var.</th>` : ''}
                </tr></thead>
                <tbody>${d.linhas.map(linha).join('')}</tbody>
              </table>
            </div>
          </div>
          <div class="card-ft">
            <svg class="ic ic-sm faint"><use href="#i-alerta"/></svg>
            <span class="small muted"><b>% RL</b> é a participação de cada conta na receita líquida — quanto de cada R$ 100 vendidos aquela linha consome.</span>
          </div>
      </div>

      <div class="grid g-2">
          <div class="card">
            <div class="card-hd"><div><h3>Resultado mês a mês</h3><div class="sub">Lucro bruto e resultado</div></div></div>
            <div class="card-bd">
              ${PP.chart.barras({
                labels:meses.map(PP.mesNome), height:200,
                series:[
                  { nome:'Lucro bruto', cor:'#0E7C86', values:serie.map(s => s.lucroBruto) },
                  { nome:'Resultado',   cor:'#B9812F', values:serie.map(s => s.resultado) }
                ]
              })}
            </div>
          </div>

          <div class="card">
            <div class="card-hd"><div><h3>O que ficou fora</h3><div class="sub">Para a conta fechar na conferência</div></div></div>
            <div class="card-bd">
              ${d.fora.length ? d.fora.map(f => `
                <div class="att-item">
                  <div class="txt"><b>${esc(f.nome)}</b><small>${esc(f.porque)}</small></div>
                  <div class="val">${esc(PP.money0(f.valor))}</div>
                </div>`).join('')
                : '<div class="empty-sm">Nada foi excluído neste período.</div>'}
              <div class="sep"></div>
              <p class="small muted" style="margin:0">A DRE é por <b>competência</b>: conta a venda no mês em que ela aconteceu.
              O dinheiro entrando e saindo está no <button class="btn btn-sm btn-ghost" data-act="nav" data-v="fluxo">Fluxo de caixa</button>.</p>
            </div>
          </div>
      </div>`;
  }
});

PP.on('drePeriodo', d => { fDre.tipo = d.t; PP.render(); });
PP.on('dreAndar', d => {
  const p = PP.deslocarPeriodo(periodoAtual(), PP.n(d.n));
  fDre.ancora = p.meses[0];
  PP.render();
});
PP.on('dreComparar', (d, el) => { fDre.comparar = el.checked; PP.render(); });

PP.on('dreCSV', () => {
  const p = periodoAtual();
  const d = PP.dre(p);
  const linhas = [['Conta', 'Valor', '% da receita líquida']];
  d.linhas.forEach(l => linhas.push([l.nome, PP.dec(l.valor),
    l.k === 'receitaBruta' || !d.receitaLiquida || !l.valor ? '' : PP.dec(l.vertical, 1)]));
  linhas.push([], ['Fora da DRE', 'Valor', 'Motivo']);
  d.fora.forEach(f => linhas.push([f.nome, PP.dec(f.valor), f.porque]));
  PP.baixar(`dre-${p.meses[0]}${p.meses.length > 1 ? '-a-' + p.meses[p.meses.length - 1] : ''}.csv`,
    PP.csv(linhas), 'text/csv;charset=utf-8');
});

PP.on('drePDF', () => {
  const p = periodoAtual();
  const d = PP.dre(p);
  const c = PP.cfg();
  const l = x => `<tr class="${x.nivel}${x.destaque ? ' forte' : ''}">
    <td>${esc(x.nome)}</td>
    <td class="r">${x.valor ? esc(PP.money(x.valor)) : '—'}</td>
    <td class="r">${x.k === 'receitaBruta' || !d.receitaLiquida || !x.valor ? '—' : PP.dec(x.vertical, 1) + '%'}</td></tr>`;
  PP.imprimir(`
    <style>
      body{ font:12px/1.5 system-ui, sans-serif; color:#12262C; }
      h1{ font-size:18px; margin:0 0 2px }
      .sub{ color:#55666D; font-size:11.5px; margin-bottom:16px }
      table{ width:100%; border-collapse:collapse }
      td{ padding:5px 8px; border-bottom:1px solid #EDE7DD }
      .r{ text-align:right; font-variant-numeric:tabular-nums }
      tr.item td:first-child{ padding-left:22px; color:#55666D }
      tr.total td, tr.forte td{ font-weight:700; background:#F7F3EC }
      tr.sub td{ font-weight:600 }
      .rod{ margin-top:18px; font-size:10.5px; color:#55666D }
    </style>
    <h1>Demonstração do Resultado — ${esc(p.nome)}</h1>
    <div class="sub">${esc(c.empresa || '')}${c.cnpj ? ' · CNPJ ' + esc(c.cnpj) : ''} · regime de competência · emitido em ${esc(PP.dt(PP.hoje()))}</div>
    <table><tbody>${d.linhas.map(l).join('')}</tbody></table>
    ${d.fora.length ? `<div class="rod"><b>Não entram no resultado:</b> ${d.fora.map(f =>
      esc(f.nome) + ' (' + esc(PP.money0(f.valor)) + ') — ' + esc(f.porque)).join(' · ')}</div>` : ''}
  `, 'DRE ' + p.nome);
});

/* ============================== COMISSÕES ============================== */

const fCom = { comp:'' };

PP.view('comissoes', {
  titulo: 'Comissões',
  sub: () => {
    const ab = PP.where('comissoes', c => c.status === 'liberada');
    return ab.length ? `${ab.length} comissão(ões) liberada(s) para pagamento — ${PP.money0(PP.soma(ab, 'valor'))}` : 'Nenhuma comissão pendente de pagamento';
  },
  render() {
    const minhas = PP.escopo(PP.all('comissoes'));
    const comps = Array.from(new Set(minhas.map(c => c.competencia))).sort().reverse();
    const comp = fCom.comp || comps[0] || PP.mesKey(PP.hoje());
    const rows = minhas.filter(c => c.competencia === comp && c.status !== 'cancelada');
    const baseAtual = PP.cfg().comissaoBase;
    const porMetro = rows.some(c => c.baseTipo === 'metro');

    const prev = rows.filter(c => c.status === 'prevista');
    const lib = rows.filter(c => c.status === 'liberada');
    const paga = rows.filter(c => c.status === 'paga');

    const porVend = PP.where('vendedores', v => v.ativo && (PP.ehGestor() || v.id === PP.vendedorAtual())).map(v => {
      const cs = rows.filter(c => c.vendedorId === v.id);
      return { id:v.id, v, qtd:cs.length, base:PP.soma(cs, 'base'), metros:PP.cent(PP.soma(cs, 'metros')),
        valor:PP.soma(cs, 'valor'),
        pago:PP.soma(cs.filter(c => c.status === 'paga'), 'valor'),
        pendente:PP.soma(cs.filter(c => c.status !== 'paga'), 'valor') };
    }).filter(x => x.qtd > 0);

    return `
      <div class="kpis mb">
        ${PP.kpi({ cls:'k-teal', lbl:'Total da competência', val:PP.money0(PP.soma(rows, 'valor')), sm:true, foot:`${rows.length} comissão(ões)` })}
        ${PP.kpi({ lbl:'Prevista', val:PP.money0(PP.soma(prev, 'valor')), sm:true, foot:'pedido ainda em aberto' })}
        ${PP.kpi({ cls:'k-warn', lbl:'Liberada', val:PP.money0(PP.soma(lib, 'valor')), sm:true, foot:'pronta para pagar' })}
        ${PP.kpi({ cls:'k-ok', lbl:'Paga', val:PP.money0(PP.soma(paga, 'valor')), sm:true })}
      </div>

      <div class="toolbar">
        <select class="inp" style="width:auto" data-chg="comComp" aria-label="Competência">
          ${comps.map(c => `<option value="${c}"${comp === c ? ' selected' : ''}>${esc(PP.mesNomeLongo(c))}</option>`).join('')}
        </select>
        <span class="badge b-teal">Base: ${esc(PP.comissaoBaseNome(baseAtual))}${
          baseAtual === 'metro' ? ` · ${esc(PP.money0(PP.cfg().comissaoPorMetro))}/m` : ''}</span>
        <div class="row-end row">
          ${lib.length && PP.ehGestor() ? `<button class="btn btn-ok" data-act="pagarTodasCom" data-c="${esc(comp)}"><svg class="ic"><use href="#i-check"/></svg>Pagar todas as liberadas (${PP.money0(PP.soma(lib, 'valor'))})</button>` : ''}
          <button class="btn" data-act="exportarComissoes" data-c="${esc(comp)}"><svg class="ic"><use href="#i-down"/></svg>CSV</button>
        </div>
      </div>

      <div class="grid g-1-2 mb">
        <div class="card">
          <div class="card-hd"><div><h3>Por vendedor</h3><div class="sub">${esc(PP.mesNomeLongo(comp))}</div></div></div>
          <div class="card-bd">
            ${porVend.length ? porVend.map(x => `
              <div class="att-item">
                <span class="av-mini">${esc(PP.iniciais(x.v.nome))}</span>
                <div class="txt"><b>${esc(x.v.nome)}</b><small>${x.qtd} venda(s) · ${porMetro
                  ? `${PP.dec(x.metros, 2)} m de piscina` : `base ${esc(PP.moneyK(x.base))}`}</small></div>
                <div class="val">${esc(PP.money0(x.valor))}${x.pendente ? `<br><span class="tiny" style="color:var(--warn)">${esc(PP.money0(x.pendente))} pendente</span>` : ''}</div>
              </div>`).join('') : '<div class="empty-sm">Nenhuma comissão nessa competência.</div>'}
          </div>
        </div>

        <div class="card">
          <div class="card-hd"><div><h3>Detalhamento</h3></div></div>
          ${rows.length ? PP.tabela({
            rows:PP.sortBy(rows, 'valor', 'desc'),
            cols:[
              { h:'Vendedor', r:c => `<div class="strong">${esc(PP.vendNome(c.vendedorId))}</div><span class="mini">${esc(PP.cliNome(c.clienteId))}</span>` },
              { h:'Origem', r:c => {
                  if (c.vendaId) { const v = PP.find('vendas', c.vendaId);
                    return v ? `<button class="btn btn-sm btn-ghost" data-act="abrirVenda" data-id="${esc(v.id)}">Balcão #${v.numero}</button>` : 'Balcão'; }
                  const p = PP.find('pedidos', c.pedidoId);
                  return p ? `<button class="btn btn-sm btn-ghost" data-act="abrirPedido" data-id="${esc(p.id)}">Pedido #${p.numero}</button>` : '—'; } },
              { h:'Base', cls:'num', r:c => c.baseTipo === 'metro'
                ? `${PP.dec(c.metros, 2)} m<span class="mini">só piscina</span>`
                : `${esc(PP.money0(c.base))}<span class="mini">${esc(c.baseTipo === 'margem' ? 'margem' : 'faturamento')}</span>` },
              { h:'Regra', cls:'num', r:c => esc(PP.comissaoRegra(c)) },
              { h:'Situação', r:c => PP.badge(
                  c.status === 'paga' ? 'Paga' : c.status === 'liberada' ? 'Liberada' : 'Prevista',
                  c.status === 'paga' ? 'b-ok' : c.status === 'liberada' ? 'b-warn' : 'b-info') },
              { h:'Valor', cls:'num', r:c => `<b>${esc(PP.money(c.valor))}</b>` },
              { h:'', cls:'acts', r:c => c.status === 'liberada' && PP.ehGestor()
                ? `<button class="btn btn-sm btn-ok" data-act="pagarCom" data-id="${esc(c.id)}">Pagar</button>`
                : c.status === 'paga' ? `<span class="tiny faint">${esc(PP.dt(c.pagoEm))}</span>`
                : c.status === 'liberada' ? '<span class="tiny faint">liberada</span>' : '<span class="tiny faint">aguarda quitação</span>' }
            ]
          }) : '<div class="empty-sm">Nenhuma comissão nessa competência.</div>'}
        </div>
      </div>

      <div class="alert a-info">
        <svg class="ic"><use href="#i-alerta"/></svg>
        <div><b>Como funciona.</b> A comissão nasce <b>prevista</b> quando o orçamento é aprovado, vira <b>liberada</b> quando o pedido é concluído ou todas as parcelas são quitadas, e vira <b>paga</b> quando você registra o pagamento — o que cria automaticamente uma despesa em contas a pagar.${
          baseAtual === 'metro'
            ? ` Hoje a regra é <b>por metro de piscina</b>: ${esc(PP.money0(PP.cfg().comissaoPorMetro))} por metro de comprimento do modelo vendido. Adicionais, equipamentos, insumos, serviços e vendas de balcão <b>não entram na conta</b>.`
            : ''}</div>
      </div>`;
  }
});

PP.on('comComp', (d, el) => { fCom.comp = el.value; PP.render(); });

PP.on('pagarCom', async d => {
  const c = PP.find('comissoes', d.id);
  if (!await PP.confirmar(`Pagar ${PP.money(c.valor)} de comissão para ${PP.vendNome(c.vendedorId)}?`, {
    title:'Pagar comissão', okTxt:'Pagar',
    aviso:'Será criada uma despesa já baixada em contas a pagar.' })) return;
  pagarComissao(c);
  PP.toast('Comissão paga', 'ok');
  PP.render();
});

PP.on('pagarTodasCom', async d => {
  const lib = PP.where('comissoes', c => c.competencia === d.c && c.status === 'liberada');
  if (!lib.length) return;
  if (!await PP.confirmar(`Pagar ${PP.plural(lib.length, 'comissão', 'comissões')} no total de ${PP.money(PP.soma(lib, 'valor'))}?`, {
    title:'Pagar comissões', okTxt:'Pagar todas',
    aviso:'Será criada uma despesa já baixada em contas a pagar para cada vendedor.' })) return;
  lib.forEach(pagarComissao);
  PP.toast(`${lib.length} comissão(ões) paga(s)`, 'ok');
  PP.render();
});

function pagarComissao(c) {
  c.status = 'paga';
  c.pagoEm = PP.hoje();
  PP.save('comissoes');
  PP.upsert('financeiro', {
    tipo:'pagar', descricao:`Comissão ${PP.mesNome(c.competencia)} — ${PP.vendNome(c.vendedorId)}`,
    categoria:'Comissão', valor:PP.n(c.valor), vencimento:PP.hoje(), status:'pago', pagoEm:PP.hoje(),
    formaPag:'Transferência', origem:{ tipo:'comissao', id:c.id }, parcela:1, parcelas:1, obs:''
  });
}

PP.on('exportarComissoes', d => {
  const linhas = [['Competência','Vendedor','Cliente','Pedido','Regra','Base','%','Metros de piscina','R$/metro','Valor','Situação','Pago em']];
  PP.where('comissoes', c => c.competencia === d.c).forEach(c => {
    const p = PP.find('pedidos', c.pedidoId);
    linhas.push([PP.mesNomeLongo(c.competencia), PP.vendNome(c.vendedorId), PP.cliNome(c.clienteId),
      p ? '#' + p.numero : '', PP.comissaoBaseNome(c.baseTipo), PP.dec(c.base), PP.dec(c.pct, 2),
      PP.dec(c.metros, 2), PP.dec(c.valorMetro), PP.dec(c.valor), c.status, c.pagoEm ? PP.dt(c.pagoEm) : '']);
  });
  PP.baixar(`comissoes-${d.c}.csv`, PP.csv(linhas), 'text/csv;charset=utf-8');
  PP.toast('CSV exportado', 'ok');
});

})();
