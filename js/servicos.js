/* ==========================================================================
   PiscinaPro — servicos.js
   Pós-venda: contratos de manutenção recorrente e chamados de
   assistência técnica / garantia.
   ========================================================================== */
(function () {
'use strict';
const PP = window.PP;
const esc = PP.esc;

/* ============================== GARANTIA ============================== */

/** Data de início da garantia = conclusão da obra (ou, na falta, data do pedido). */
PP.inicioGarantia = pedidoId => {
  const ob = PP.obraDoPedido(pedidoId);
  if (ob && ob.dataConclusao) return ob.dataConclusao;
  const p = PP.find('pedidos', pedidoId);
  return p ? p.data : '';
};

/** { casco:{fim,vigente,diasRestantes}, equip:{...} } */
PP.garantia = pedidoId => {
  const cfg = PP.cfg();
  const ini = PP.inicioGarantia(pedidoId);
  if (!ini) return null;
  const fimCasco = PP.addMeses(ini, PP.n(cfg.garantiaCasco) * 12);
  const fimEquip = PP.addMeses(ini, PP.n(cfg.garantiaEquip) * 12);
  return {
    inicio: ini,
    casco: { fim:fimCasco, vigente: fimCasco >= PP.hoje(), dias: PP.diasEntre(PP.hoje(), fimCasco) },
    equip: { fim:fimEquip, vigente: fimEquip >= PP.hoje(), dias: PP.diasEntre(PP.hoje(), fimEquip) }
  };
};

/* ============================== CONTRATOS ============================== */

PP.contratoMensalizado = c => {
  const per = PP.PERIODICIDADES.find(p => p.v === c.periodicidade) || { meses:1 };
  const mult = c.periodicidade === 'quinzenal' ? 2 : 1;
  return PP.n(c.valor) * mult / (per.meses || 1);
};

/** Receita recorrente mensal (MRR) dos contratos ativos. */
PP.mrr = () => PP.soma(PP.where('contratos', c => c.status === 'ativo'), PP.contratoMensalizado);

/**
 * Contrato ativo, já em vigência e ainda sem cobrança lançada neste mês.
 * Contrato que nunca foi cobrado (ultimaCobranca vazia) conta como pendente —
 * não dá para usar PP.mesKey('') aqui, porque ela devolveria o mês atual.
 */
PP.contratoPendente = c => {
  if (c.status !== 'ativo') return false;
  if (c.inicio && c.inicio > PP.hoje()) return false;
  if (!c.ultimaCobranca) return true;
  return PP.mesKey(c.ultimaCobranca) !== PP.mesKey(PP.hoje());
};

const fCtr = { status:'ativo' };

PP.view('contratos', {
  titulo: 'Contratos de manutenção',
  sub: () => {
    const ativos = PP.where('contratos', c => c.status === 'ativo');
    return `${ativos.length} contrato(s) ativo(s) · ${PP.money0(PP.mrr())} de receita recorrente por mês`;
  },
  render() {
    let rows = PP.escopo(PP.all('contratos'));
    if (fCtr.status) rows = rows.filter(c => c.status === fCtr.status);
    rows = PP.sortBy(rows, 'numero', 'desc');

    const ativos = PP.where('contratos', c => c.status === 'ativo');
    const mrr = PP.mrr();
    const clientesComPiscina = PP.where('pedidos', p => p.status !== 'cancelado').length;
    const cobertura = clientesComPiscina ? ativos.length / clientesComPiscina * 100 : 0;
    const aVencer = ativos.filter(c => c.fim && PP.diasEntre(PP.hoje(), c.fim) <= 45 && c.fim >= PP.hoje());

    /* contratos que ainda não foram faturados no mês corrente.
       Atenção: PP.mesKey('') devolve o mês ATUAL (por causa do `||` interno),
       então contrato sem cobrança precisa ser tratado antes de comparar. */
    const mk = PP.mesKey(PP.hoje());
    const pendentes = ativos.filter(PP.contratoPendente);

    return `
      <div class="kpis mb">
        ${PP.kpi({ cls:'k-teal', lbl:'Receita recorrente (MRR)', val:PP.money0(mrr), sm:true, foot:`${ativos.length} contrato(s) ativo(s)` })}
        ${PP.kpi({ lbl:'Receita anual prevista', val:PP.money0(mrr * 12), sm:true })}
        ${PP.kpi({ cls:'k-ocre', lbl:'Cobertura da base', val:PP.pct(cobertura, 0), foot:`de ${clientesComPiscina} piscina(s) vendida(s)` })}
        ${PP.kpi({ cls: aVencer.length ? 'k-warn' : 'k-ok', lbl:'Vencem em 45 dias', val:String(aVencer.length), foot:'renovação a negociar' })}
      </div>

      ${pendentes.length ? `<div class="alert a-info mb"><svg class="ic"><use href="#i-fin"/></svg>
        <div><b>${PP.plural(pendentes.length, 'contrato', 'contratos')} sem cobrança lançada em ${esc(PP.mesNomeLongo(mk))}.</b>
        <button class="btn btn-sm" data-act="faturarContratos" style="margin-left:8px">Gerar cobranças do mês (${esc(PP.money0(PP.soma(pendentes, PP.contratoMensalizado)))})</button></div></div>` : ''}

      <div class="toolbar">
        <div class="seg">
          <button class="${fCtr.status === 'ativo' ? 'on' : ''}" data-act="filtroCtr" data-s="ativo">Ativos</button>
          <button class="${fCtr.status === 'suspenso' ? 'on' : ''}" data-act="filtroCtr" data-s="suspenso">Suspensos</button>
          <button class="${fCtr.status === 'encerrado' ? 'on' : ''}" data-act="filtroCtr" data-s="encerrado">Encerrados</button>
          <button class="${!fCtr.status ? 'on' : ''}" data-act="filtroCtr" data-s="">Todos</button>
        </div>
        <div class="row-end row">
          <button class="btn" data-act="exportarContratos"><svg class="ic"><use href="#i-down"/></svg>CSV</button>
          <button class="btn btn-primary" data-act="novoContrato"><svg class="ic"><use href="#i-plus"/></svg>Novo contrato</button>
        </div>
      </div>

      <div class="card">
        ${rows.length ? PP.tabela({
          act:'abrirContrato', rows:PP.paginar('contratos', rows).linhas,
          cols:[
            { h:'Nº', w:'88px', r:c => `<b>#${c.numero}</b><span class="mini">desde ${esc(PP.dtCurto(c.inicio))}</span>` },
            { h:'Cliente', r:c => `<div class="strong">${esc(PP.cliNome(c.clienteId))}</div><span class="mini">${esc(c.escopo || 'Manutenção')}</span>` },
            { h:'Periodicidade', r:c => `<span class="small">${esc((PP.PERIODICIDADES.find(p => p.v === c.periodicidade) || {}).l || c.periodicidade)}</span>` },
            { h:'Vencimento', r:c => `<span class="small">dia ${PP.n(c.diaVencimento)}</span>` },
            { h:'Última cobrança', r:c => `<span class="small">${c.ultimaCobranca ? esc(PP.dt(c.ultimaCobranca)) : '<span class="faint">nenhuma</span>'}</span>` },
            { h:'Status', r:c => PP.badge(PP.STATUS_CONTRATO[c.status].nome, PP.STATUS_CONTRATO[c.status].cls) },
            { h:'Valor', cls:'num', r:c => `<b>${esc(PP.money(c.valor))}</b><span class="mini">${esc(PP.money0(PP.contratoMensalizado(c)))}/mês</span>` }
          ]
        }) + PP.paginar('contratos', rows).html : PP.vazio('Nenhum contrato aqui', 'Cada piscina vendida é um contrato de manutenção em potencial.', { act:'novoContrato', txt:'Novo contrato' })}
      </div>`;
  }
});

PP.on('filtroCtr', d => { fCtr.status = d.s; PP.resetPagina('contratos'); PP.render(); });

function camposContrato() {
  return [
    { k:'id', t:'hidden' },
    { k:'clienteId', l:'Cliente', t:'select', col:7, req:true, opts:PP.clientesVisiveis().map(c => ({ v:c.id, l:c.nome })) },
    { k:'vendedorId', l:'Responsável', t:'select', col:5, req:true,
      opts:PP.where('vendedores', v => v.ativo).map(v => ({ v:v.id, l:v.nome })) },
    { k:'escopo', l:'Escopo do serviço', t:'text', col:12, ph:'Limpeza quinzenal, balanceamento químico e checagem de equipamentos' },
    { sep:'Cobrança' },
    { k:'valor', l:'Valor por cobrança (R$)', t:'money', col:4, req:true, val:'positivo' },
    { k:'periodicidade', l:'Periodicidade', t:'select', col:4, req:true, vazio:false, opts:PP.PERIODICIDADES.map(p => ({ v:p.v, l:p.l })) },
    { k:'diaVencimento', l:'Dia do vencimento', t:'number', col:4, min:1, max:28, step:1, hint:'Use no máximo 28 para valer em fevereiro' },
    { k:'inicio', l:'Início', t:'date', col:4, req:true },
    { k:'fim', l:'Fim (opcional)', t:'date', col:4, hint:'Vazio = contrato por prazo indeterminado' },
    { k:'status', l:'Situação', t:'select', col:4, vazio:false, opts:Object.keys(PP.STATUS_CONTRATO).map(k => ({ v:k, l:PP.STATUS_CONTRATO[k].nome })) },
    { k:'obs', l:'Observações', t:'textarea', col:12, rows:2 }
  ];
}

PP.on('novoContrato', () => abrirFormContrato(null, {}));
PP.on('contratoDoCliente', d => { PP.closeAll(); abrirFormContrato(null, { clienteId:d.id }); });

function abrirFormContrato(c, base) {
  const novo = !c;
  const cfg = PP.cfg();
  const manut = PP.all('produtos').find(p => p.sku === 'SRV-MAN-MEN');
  const v = c || Object.assign({
    status:'ativo', periodicidade:'mensal', diaVencimento:10, inicio:PP.hoje(),
    valor: manut ? manut.preco : 420,
    vendedorId: PP.vendedorAtual() || (PP.where('vendedores', x => x.ativo)[0] || {}).id,
    escopo:'Limpeza quinzenal, balanceamento químico e checagem de equipamentos'
  }, base || {});
  const key = PP.uid('ct');
  PP.on(key, (d, el) => {
    const { ok, data } = PP.lerForm(el.closest('.modal-box').querySelector('#formCtr'), { regras:[
      { campo:'fim', msg:'O fim não pode ser antes do início', fn:d => !d.fim || !d.inicio || d.fim >= d.inicio }
    ]});
    if (!ok) return;
    if (novo) data.numero = PP.proximoNumero('proximoNumContrato');
    const id = PP.upsert('contratos', data);
    PP.closeTop(); PP.toast(novo ? `Contrato #${data.numero} criado` : 'Contrato salvo', 'ok');
    PP.render(); abrirContrato(id);
  });
  PP.modal({
    title: novo ? 'Novo contrato de manutenção' : `Contrato #${c.numero}`, size:'lg',
    body:`<form id="formCtr">${PP.form(camposContrato(), v)}</form>`,
    actions:[{ txt:'Salvar', cls:'btn-primary', act:key }, { txt:'Cancelar', act:'fechar' }]
  });
}

PP.on('abrirContrato', d => abrirContrato(d.id));

function abrirContrato(id) {
  const c = PP.find('contratos', id);
  if (!c) return;
  const lanc = PP.where('financeiro', f => f.origem && f.origem.tipo === 'contrato' && f.origem.id === id);
  const pago = PP.soma(lanc.filter(f => f.status === 'pago'), 'valor');
  const aberto = PP.soma(lanc.filter(f => f.status === 'aberto'), 'valor');
  const meses = c.inicio ? Math.max(Math.round(PP.diasEntre(c.inicio, PP.hoje()) / 30), 0) : 0;

  const body = `
    <div class="row mb" style="gap:7px">
      ${PP.badge(PP.STATUS_CONTRATO[c.status].nome, PP.STATUS_CONTRATO[c.status].cls)}
      ${c.fim && PP.diasEntre(PP.hoje(), c.fim) <= 45 && c.fim >= PP.hoje() ? PP.badge('Renovação próxima', 'b-warn') : ''}
    </div>

    <div class="kpis mb">
      ${PP.kpi({ cls:'k-teal', lbl:'Valor por cobrança', val:PP.money0(c.valor), sm:true })}
      ${PP.kpi({ cls:'k-ok', lbl:'Já faturado', val:PP.money0(pago), sm:true, foot:`${lanc.filter(f => f.status === 'pago').length} cobrança(s)` })}
      ${PP.kpi({ cls: aberto ? 'k-warn' : '', lbl:'Em aberto', val:PP.money0(aberto), sm:true })}
    </div>

    <div class="card mb"><div class="card-bd">
      <dl class="dl">
        <dt>Cliente</dt><dd><b>${esc(PP.cliNome(c.clienteId))}</b></dd>
        <dt>Responsável</dt><dd>${esc(PP.vendNome(c.vendedorId))}</dd>
        <dt>Escopo</dt><dd>${esc(c.escopo || '—')}</dd>
        <dt>Periodicidade</dt><dd>${esc((PP.PERIODICIDADES.find(p => p.v === c.periodicidade) || {}).l || '')} · vence dia ${PP.n(c.diaVencimento)}</dd>
        <dt>Vigência</dt><dd>${esc(PP.dt(c.inicio))} → ${c.fim ? esc(PP.dt(c.fim)) : 'indeterminado'} <span class="faint small">(${meses} meses)</span></dd>
        <dt>Equivalente mensal</dt><dd><b>${esc(PP.money(PP.contratoMensalizado(c)))}</b></dd>
        <dt>Última cobrança</dt><dd>${c.ultimaCobranca ? esc(PP.dt(c.ultimaCobranca)) : 'nenhuma ainda'}</dd>
      </dl>
      ${c.obs ? `<div class="sep"></div><div class="small muted">${esc(c.obs)}</div>` : ''}
    </div></div>

    <div class="card">
      <div class="card-hd"><div><h3>Cobranças</h3></div></div>
      ${lanc.length ? PP.tabela({ rows:PP.sortBy(lanc, 'vencimento', 'desc'), cols:[
        { h:'Competência', r:f => `<span class="small">${esc(f.descricao)}</span>` },
        { h:'Vencimento', r:f => `<span class="small">${esc(PP.dt(f.vencimento))}</span>` },
        { h:'Situação', r:f => { const s = PP.finSituacao(f); return PP.badge(s.nome, s.cls); } },
        { h:'Valor', cls:'num', r:f => esc(PP.money(f.valor)) }
      ]}) : '<div class="empty-sm">Nenhuma cobrança lançada.</div>'}
    </div>`;

  const acoes = [];
  if (c.status === 'ativo') acoes.push({ txt:'Lançar cobrança agora', cls:'btn-teal', ic:'i-fin', act:'faturarContrato', data:{ id:c.id } });
  acoes.push({ txt:'Editar', ic:'i-edit', act:'editarContrato', data:{ id:c.id } });
  if (c.status === 'ativo') acoes.push({ txt:'Encerrar contrato', cls:'btn-dang', act:'encerrarContrato', data:{ id:c.id } });
  acoes.push({ txt:'WhatsApp', ic:'i-wpp', act:'waCliente', data:{ id:c.clienteId } });

  PP.drawer({ title:`Contrato #${c.numero}`, sub:`${PP.cliNome(c.clienteId)} · ${PP.money(c.valor)} ${(PP.PERIODICIDADES.find(p => p.v === c.periodicidade) || {}).l.toLowerCase()}`, body, actions:acoes, wide:true });
}
PP.abrirContrato = abrirContrato;

PP.on('editarContrato', d => { PP.closeAll(); abrirFormContrato(PP.find('contratos', d.id)); });

PP.on('encerrarContrato', async d => {
  const c = PP.find('contratos', d.id);
  if (!await PP.confirmar(`Encerrar o contrato #${c.numero} de ${PP.cliNome(c.clienteId)}?`, { perigo:true, okTxt:'Encerrar',
    aviso:'As cobranças já lançadas continuam no financeiro. Nenhuma nova será gerada.' })) return;
  c.status = 'encerrado';
  c.fim = c.fim || PP.hoje();
  PP.save('contratos');
  PP.closeAll(); PP.toast('Contrato encerrado'); PP.render();
});

function lancarCobranca(c, mk) {
  const dia = String(Math.min(Math.max(PP.n(c.diaVencimento) || 10, 1), 28)).padStart(2, '0');
  const venc = mk + '-' + dia;
  const ja = PP.all('financeiro').some(f => f.origem && f.origem.tipo === 'contrato' && f.origem.id === c.id && PP.mesKey(f.vencimento) === mk);
  if (ja) return null;
  const id = PP.upsert('financeiro', {
    tipo:'receber', descricao:`Manutenção ${PP.mesNome(mk)} — contrato #${c.numero}`,
    categoria:'Serviço / manutenção', valor:PP.contratoMensalizado(c), vencimento:venc,
    status:'aberto', pagoEm:'', formaPag:'PIX', clienteId:c.clienteId,
    origem:{ tipo:'contrato', id:c.id }, parcela:1, parcelas:1, obs:''
  });
  c.ultimaCobranca = venc;
  return id;
}

PP.on('faturarContrato', d => {
  const c = PP.find('contratos', d.id);
  const r = lancarCobranca(c, PP.mesKey(PP.hoje()));
  if (!r) return PP.toast('Esse contrato já tem cobrança neste mês', 'warn');
  PP.save('contratos'); PP.save('financeiro');
  PP.closeAll(); PP.toast('Cobrança lançada', 'ok'); PP.render();
});

PP.on('faturarContratos', async () => {
  const mk = PP.mesKey(PP.hoje());
  const ativos = PP.where('contratos', PP.contratoPendente);
  if (!ativos.length) return PP.toast('Nenhum contrato pendente neste mês', 'warn');
  const total = PP.soma(ativos, PP.contratoMensalizado);
  if (!await PP.confirmar(`Lançar ${PP.plural(ativos.length, 'cobrança', 'cobranças')} de ${PP.mesNomeLongo(mk)}, somando ${PP.money(total)}?`,
    { title:'Faturar contratos', okTxt:'Lançar cobranças' })) return;
  let n = 0;
  ativos.forEach(c => { if (lancarCobranca(c, mk)) n++; });
  PP.save('contratos'); PP.save('financeiro');
  PP.toast(`${n} cobrança(s) lançada(s)`, 'ok');
  PP.render();
});

PP.on('exportarContratos', () => {
  const linhas = [['Número','Cliente','Escopo','Periodicidade','Valor','Equivalente mensal','Dia venc.','Início','Fim','Status','Última cobrança']];
  PP.all('contratos').forEach(c => linhas.push([c.numero, PP.cliNome(c.clienteId), c.escopo || '',
    (PP.PERIODICIDADES.find(p => p.v === c.periodicidade) || {}).l || '', PP.dec(c.valor), PP.dec(PP.contratoMensalizado(c)),
    PP.n(c.diaVencimento), PP.dt(c.inicio), c.fim ? PP.dt(c.fim) : '', c.status, c.ultimaCobranca ? PP.dt(c.ultimaCobranca) : '']));
  PP.baixar(`contratos-${PP.hoje()}.csv`, PP.csv(linhas), 'text/csv;charset=utf-8');
  PP.toast('CSV exportado', 'ok');
});

/* ============================== CHAMADOS / GARANTIA ============================== */

const fCha = { status:'abertos' };

PP.view('chamados', {
  titulo: 'Assistência & garantia',
  sub: () => {
    const abertos = PP.where('chamados', c => c.status !== 'resolvido' && c.status !== 'cancelado');
    return abertos.length ? `${abertos.length} chamado(s) em aberto` : 'Nenhum chamado em aberto';
  },
  render() {
    let rows = PP.all('chamados').slice();
    if (fCha.status === 'abertos') rows = rows.filter(c => c.status !== 'resolvido' && c.status !== 'cancelado');
    else if (fCha.status) rows = rows.filter(c => c.status === fCha.status);
    rows = PP.sortBy(rows, 'abertura', 'desc');

    const abertos = PP.where('chamados', c => c.status !== 'resolvido' && c.status !== 'cancelado');
    const emGarantia = PP.where('chamados', c => c.emGarantia && c.status !== 'cancelado');
    const resolvidos = PP.where('chamados', c => c.status === 'resolvido');
    const tempoMedio = resolvidos.length
      ? PP.soma(resolvidos, c => Math.max(PP.diasEntre(String(c.abertura).slice(0, 10), c.fechamento || PP.hoje()), 0)) / resolvidos.length
      : 0;
    const custoGarantia = PP.soma(emGarantia, 'custo');

    return `
      <div class="kpis mb">
        ${PP.kpi({ cls: abertos.length ? 'k-warn' : 'k-ok', lbl:'Chamados abertos', val:String(abertos.length) })}
        ${PP.kpi({ cls:'k-teal', lbl:'Tempo médio de solução', val:PP.dec(tempoMedio, 1) + ' dias', sm:true, foot:`${resolvidos.length} resolvido(s)` })}
        ${PP.kpi({ cls:'k-dang', lbl:'Custo de garantia', val:PP.money0(custoGarantia), sm:true, foot:`${emGarantia.length} atendimento(s) sem cobrança` })}
        ${PP.kpi({ cls:'k-ocre', lbl:'Faturado em assistência', val:PP.money0(PP.soma(PP.where('chamados', c => !c.emGarantia && c.status === 'resolvido'), 'valorCobrado')), sm:true })}
      </div>

      <div class="toolbar">
        <div class="seg">
          <button class="${fCha.status === 'abertos' ? 'on' : ''}" data-act="filtroCha" data-s="abertos">Em aberto</button>
          ${Object.keys(PP.STATUS_CHAMADO).map(k => `<button class="${fCha.status === k ? 'on' : ''}" data-act="filtroCha" data-s="${k}">${esc(PP.STATUS_CHAMADO[k].nome)}</button>`).join('')}
          <button class="${!fCha.status ? 'on' : ''}" data-act="filtroCha" data-s="">Todos</button>
        </div>
        <div class="row-end row">
          <button class="btn btn-primary" data-act="novoChamado"><svg class="ic"><use href="#i-plus"/></svg>Abrir chamado</button>
        </div>
      </div>

      <div class="card">
        ${rows.length ? PP.tabela({
          act:'abrirChamado', rows:PP.paginar('chamados', rows).linhas,
          cols:[
            { h:'Nº', w:'88px', r:c => `<b>#${c.numero}</b><span class="mini">${esc(PP.dtCurto(c.abertura))}</span>` },
            { h:'Cliente', r:c => `<div class="strong">${esc(PP.cliNome(c.clienteId))}</div><span class="mini">${esc(PP.trunc(c.descricao || '', 40))}</span>` },
            { h:'Tipo', r:c => `<span class="small">${esc(c.tipo)}</span>` },
            { h:'Garantia', r:c => c.emGarantia ? PP.badge('Em garantia', 'b-ok') : PP.badge('Cobrado', 'b-areia') },
            { h:'Status', r:c => PP.badge(PP.STATUS_CHAMADO[c.status].nome, PP.STATUS_CHAMADO[c.status].cls) },
            { h:'Aberto há', cls:'num', r:c => { const dias = PP.diasEntre(String(c.abertura).slice(0, 10), c.fechamento || PP.hoje());
              return `<span class="small ${!c.fechamento && dias > 5 ? 'b' : ''}" style="${!c.fechamento && dias > 5 ? 'color:var(--dang)' : ''}">${dias}d</span>`; } },
            { h:'Valor', cls:'num', r:c => c.emGarantia ? `<span class="faint small">sem cobrança</span>` : `<b>${esc(PP.money0(c.valorCobrado))}</b>` }
          ]
        }) + PP.paginar('chamados', rows).html : PP.vazio('Nenhum chamado', 'Registre aqui vazamentos, problemas de equipamento e acionamentos de garantia.', { act:'novoChamado', txt:'Abrir chamado' })}
      </div>`;
  }
});

PP.on('filtroCha', d => { fCha.status = d.s; PP.resetPagina('chamados'); PP.render(); });

PP.on('novoChamado', () => abrirFormChamado(null, {}));
PP.on('chamadoDoCliente', d => { PP.closeAll(); abrirFormChamado(null, { clienteId:d.id }); });

function abrirFormChamado(ch, base) {
  const novo = !ch;
  const v = ch || Object.assign({ tipo:'Garantia', status:'aberto', abertura:PP.agora(), emGarantia:true, custo:0, valorCobrado:0 }, base || {});
  const key = PP.uid('ch');
  PP.on(key, (d, el) => {
    const { ok, data } = PP.lerForm(el.closest('.modal-box').querySelector('#formCha'));
    if (!ok) return;
    if (novo) { data.numero = PP.proximoNumero('proximoNumChamado'); data.abertura = PP.agora(); data.historico = []; }
    if (data.status === 'resolvido' && !data.fechamento) data.fechamento = PP.hoje();
    const id = PP.upsert('chamados', data);
    PP.closeTop(); PP.toast(novo ? `Chamado #${data.numero} aberto` : 'Chamado salvo', 'ok');
    PP.render(); abrirChamado(id);
  });

  /* pedidos do cliente escolhido, para vincular garantia */
  const pedidosOpts = PP.all('pedidos').filter(p => p.status !== 'cancelado')
    .map(p => ({ v:p.id, l:`#${p.numero} — ${PP.cliNome(p.clienteId)} (${PP.dt(p.data)})` }));

  PP.modal({
    title: novo ? 'Abrir chamado' : `Chamado #${ch.numero}`, size:'lg',
    body:`<form id="formCha">${PP.form([
      { k:'id', t:'hidden' },
      { k:'clienteId', l:'Cliente', t:'select', col:7, req:true, opts:PP.clientesVisiveis().map(c => ({ v:c.id, l:c.nome })) },
      { k:'tipo', l:'Tipo', t:'select', col:5, req:true, vazio:false, opts:PP.TIPOS_CHAMADO },
      { k:'pedidoId', l:'Pedido / piscina relacionada', t:'select', col:12, opts:pedidosOpts,
        hint:'Vincule para o sistema calcular se ainda está na garantia' },
      { k:'descricao', l:'Relato do cliente', t:'textarea', col:12, rows:3, req:true, ph:'O que está acontecendo?' },
      { sep:'Atendimento' },
      { k:'status', l:'Situação', t:'select', col:4, vazio:false, opts:Object.keys(PP.STATUS_CHAMADO).map(k => ({ v:k, l:PP.STATUS_CHAMADO[k].nome })) },
      { k:'equipeObraId', l:'Equipe responsável', t:'select', col:4, opts:PP.all('equipesObra').map(e => ({ v:e.id, l:e.nome })) },
      { k:'dataVisita', l:'Visita agendada', t:'date', col:4 },
      { k:'emGarantia', l:'Atendimento coberto pela garantia (sem cobrança)', t:'checkbox', col:12 },
      { k:'custo', l:'Custo da empresa (R$)', t:'money', col:6, hint:'Peças e mão de obra gastos no atendimento' },
      { k:'valorCobrado', l:'Valor cobrado do cliente (R$)', t:'money', col:6, hint:'Deixe zero quando estiver em garantia' },
      { k:'solucao', l:'Solução aplicada', t:'textarea', col:12, rows:2 }
    ], v)}</form>`,
    actions:[{ txt:'Salvar', cls:'btn-primary', act:key }, { txt:'Cancelar', act:'fechar' }]
  });
}

PP.on('abrirChamado', d => abrirChamado(d.id));

function abrirChamado(id) {
  const c = PP.find('chamados', id);
  if (!c) return;
  const g = c.pedidoId ? PP.garantia(c.pedidoId) : null;
  const cli = PP.cli(c.clienteId);
  const dias = PP.diasEntre(String(c.abertura).slice(0, 10), c.fechamento || PP.hoje());

  const body = `
    <div class="row mb" style="gap:7px">
      ${PP.badge(PP.STATUS_CHAMADO[c.status].nome, PP.STATUS_CHAMADO[c.status].cls)}
      ${c.emGarantia ? PP.badge('Em garantia', 'b-ok') : PP.badge('Serviço cobrado', 'b-areia')}
      ${!c.fechamento && dias > 5 ? PP.badge(`${dias} dias em aberto`, 'b-dang') : ''}
    </div>

    ${g ? `<div class="card mb"><div class="card-bd">
      <b class="small" style="display:block;margin-bottom:8px">Situação da garantia</b>
      <dl class="dl">
        <dt>Início</dt><dd>${esc(PP.dt(g.inicio))} <span class="faint small">(entrega da obra)</span></dd>
        <dt>Casco</dt><dd>${g.casco.vigente
          ? `<span class="badge b-ok">Vigente até ${esc(PP.dt(g.casco.fim))}</span> <span class="faint small">faltam ${Math.round(g.casco.dias / 365)} anos</span>`
          : `<span class="badge b-dang">Vencida em ${esc(PP.dt(g.casco.fim))}</span>`}</dd>
        <dt>Equipamentos</dt><dd>${g.equip.vigente
          ? `<span class="badge b-ok">Vigente até ${esc(PP.dt(g.equip.fim))}</span>`
          : `<span class="badge b-dang">Vencida em ${esc(PP.dt(g.equip.fim))}</span>`}</dd>
      </dl>
    </div></div>` : `<div class="alert a-warn mb"><svg class="ic"><use href="#i-alerta"/></svg>
      <div>Chamado sem pedido vinculado — não dá para conferir a garantia automaticamente.</div></div>`}

    <div class="card mb"><div class="card-bd">
      <dl class="dl">
        <dt>Cliente</dt><dd><b>${esc(PP.cliNome(c.clienteId))}</b></dd>
        <dt>Telefone</dt><dd>${esc(PP.fone(cli && cli.telefone))}</dd>
        <dt>Endereço</dt><dd>${esc(cli ? [cli.endereco, cli.bairro, cli.cidade].filter(Boolean).join(', ') : '—')}</dd>
        <dt>Tipo</dt><dd>${esc(c.tipo)}</dd>
        <dt>Aberto em</dt><dd>${esc(PP.dtHora(c.abertura))}</dd>
        <dt>Equipe</dt><dd>${esc(PP.equipeObraNome(c.equipeObraId))}</dd>
        <dt>Visita</dt><dd>${c.dataVisita ? esc(PP.dt(c.dataVisita)) : '<span class="faint">não agendada</span>'}</dd>
        ${c.fechamento ? `<dt>Resolvido em</dt><dd>${esc(PP.dt(c.fechamento))} <span class="faint small">(${dias} dias)</span></dd>` : ''}
        <dt>Custo</dt><dd>${esc(PP.money(c.custo))}</dd>
        <dt>Cobrado</dt><dd>${c.emGarantia ? '<span class="faint">sem cobrança (garantia)</span>' : `<b>${esc(PP.money(c.valorCobrado))}</b>`}</dd>
      </dl>
      <div class="sep"></div>
      <b class="small">Relato</b>
      <p class="small muted" style="white-space:pre-wrap;margin:4px 0 0">${esc(c.descricao || '—')}</p>
      ${c.solucao ? `<div class="sep"></div><b class="small">Solução</b><p class="small muted" style="white-space:pre-wrap;margin:4px 0 0">${esc(c.solucao)}</p>` : ''}
    </div></div>`;

  const acoes = [];
  if (c.status !== 'resolvido' && c.status !== 'cancelado') {
    acoes.push({ txt:'Registrar solução', cls:'btn-ok', ic:'i-check', act:'resolverChamado', data:{ id:c.id } });
  }
  acoes.push({ txt:'Editar', ic:'i-edit', act:'editarChamado', data:{ id:c.id } });
  if (cli) acoes.push({ txt:'WhatsApp', ic:'i-wpp', act:'waCliente', data:{ id:cli.id } });

  PP.drawer({ title:`Chamado #${c.numero}`, sub:`${PP.cliNome(c.clienteId)} · ${c.tipo}`, body, actions:acoes, wide:true });
}
PP.abrirChamado = abrirChamado;

PP.on('editarChamado', d => { PP.closeAll(); abrirFormChamado(PP.find('chamados', d.id)); });

PP.on('resolverChamado', d => {
  const c = PP.find('chamados', d.id);
  PP.closeAll();
  const key = PP.uid('rc');
  PP.on(key, (dd, el) => {
    const { ok, data } = PP.lerForm(el.closest('.modal-box').querySelector('#formRes'));
    if (!ok) return;
    c.solucao = data.solucao;
    c.custo = data.custo;
    c.valorCobrado = data.emGarantia ? 0 : data.valorCobrado;
    c.emGarantia = data.emGarantia;
    c.status = 'resolvido';
    c.fechamento = PP.hoje();
    PP.save('chamados');
    /* atendimento cobrado vira receita; custo sempre vira despesa */
    if (!c.emGarantia && PP.n(c.valorCobrado) > 0) {
      PP.upsert('financeiro', {
        tipo:'receber', descricao:`Assistência técnica — chamado #${c.numero}`, categoria:'Serviço / manutenção',
        valor:PP.n(c.valorCobrado), vencimento:PP.addDias(PP.hoje(), 7), status:'aberto', pagoEm:'', formaPag:'PIX',
        clienteId:c.clienteId, origem:{ tipo:'chamado', id:c.id }, parcela:1, parcelas:1, obs:''
      });
    }
    if (PP.n(c.custo) > 0) {
      PP.upsert('financeiro', {
        tipo:'pagar', descricao:`Custo de atendimento — chamado #${c.numero}${c.emGarantia ? ' (garantia)' : ''}`,
        categoria:'Mão de obra', valor:PP.n(c.custo), vencimento:PP.hoje(), status:'aberto', pagoEm:'',
        formaPag:'Transferência', origem:{ tipo:'chamado', id:c.id }, parcela:1, parcelas:1, obs:''
      });
    }
    PP.closeTop(); PP.toast('Chamado resolvido', 'ok'); PP.render(); abrirChamado(c.id);
  });
  PP.modal({
    title:'Registrar solução', sub:`Chamado #${c.numero} — ${PP.cliNome(c.clienteId)}`, size:'lg',
    body:`<form id="formRes">${PP.form([
      { k:'solucao', l:'O que foi feito', t:'textarea', col:12, rows:3, req:true },
      { k:'emGarantia', l:'Atendimento coberto pela garantia (não cobrar do cliente)', t:'checkbox', col:12 },
      { k:'custo', l:'Custo da empresa (R$)', t:'money', col:6, hint:'Vira despesa em contas a pagar' },
      { k:'valorCobrado', l:'Valor cobrado (R$)', t:'money', col:6, hint:'Vira receita em contas a receber' }
    ], c)}</form>`,
    actions:[{ txt:'Concluir chamado', cls:'btn-ok', act:key }, { txt:'Cancelar', act:'fechar' }]
  });
});

})();
