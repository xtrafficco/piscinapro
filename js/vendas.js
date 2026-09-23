/* ==========================================================================
   PiscinaPro — vendas.js
   Visão geral, funil de vendas (kanban), base de leads, clientes e equipe.
   Também define os cálculos de domínio usados pelos outros módulos.
   ========================================================================== */
(function () {
'use strict';
const PP = window.PP;
const esc = PP.esc;

/* ====================== CÁLCULOS DE DOMÍNIO (compartilhados) ====================== */

PP.vend      = id => PP.find('vendedores', id);
PP.vendNome  = id => (PP.vend(id) || {}).nome || '—';
PP.cli       = id => PP.find('clientes', id);
PP.cliNome   = id => (PP.cli(id) || {}).nome || '—';
PP.prod      = id => PP.find('produtos', id);
PP.prodNome  = id => (PP.prod(id) || {}).nome || '—';
PP.forn      = id => PP.find('fornecedores', id);
PP.fornNome  = id => (PP.forn(id) || {}).nome || '—';
PP.lead      = id => PP.find('leads', id);

/* ---------- comissão ----------
   Três regras, escolhidas em Configurações → Parâmetros comerciais:
   faturamento e margem são percentuais; 'metro' paga um valor fixo por
   metro de piscina e ignora todo o resto do pedido. */

/* Metros de piscina de um item: só a categoria Piscina conta, e o que conta
   é o comprimento do modelo vezes a quantidade. Adicional, equipamento,
   insumo e serviço ficam de fora mesmo estando no mesmo pedido. */
PP.metrosItem = it => {
  const p = PP.prod(it && it.produtoId);
  if (!p || p.categoria !== 'Piscina') return 0;
  return PP.n((p.specs || {}).compr) * PP.n(it.qtd);
};
PP.metrosPiscina = itens => PP.cent((itens || []).reduce((s, it) => s + PP.metrosItem(it), 0));

/* Quanto o vendedor recebe por metro: o valor dele, se tiver, senão o da empresa. */
PP.valorMetro = vendedorId => {
  const v = PP.vend(vendedorId);
  const dele = v ? PP.n(v.comissaoMetro) : 0;
  return dele > 0 ? dele : PP.n(PP.cfg().comissaoPorMetro);
};

/* Cálculo único da comissão — pedido e balcão passam por aqui.
   Devolve o registro pronto para gravar em 'comissoes'. */
PP.calcComissao = o => {
  const fat = PP.cent(o.faturamento);
  const custo = PP.cent(o.custo);
  if (PP.cfg().comissaoBase === 'metro') {
    const metros = PP.metrosPiscina(o.itens);
    const valorMetro = PP.valorMetro(o.vendedorId);
    return { baseTipo:'metro', base:fat, faturamento:fat, custo, metros, valorMetro,
             pct:0, valor:PP.cent(metros * valorMetro) };
  }
  const sobreMargem = PP.cfg().comissaoBase === 'margem';
  const pct = PP.n(o.pct);
  const base = PP.cent(sobreMargem ? Math.max(fat - custo, 0) : fat);
  return { baseTipo: sobreMargem ? 'margem' : 'faturamento', base, faturamento:fat, custo,
           metros:0, valorMetro:0, pct, valor:PP.cent(base * pct / 100) };
};

/* Como aquela comissão foi calculada, em texto curto. */
PP.comissaoRegra = c => c && c.baseTipo === 'metro'
  ? PP.money0(c.valorMetro) + '/m'
  : PP.dec(c && c.pct, 1) + '%';
PP.comissaoBaseTxt = c => c && c.baseTipo === 'metro'
  ? PP.dec(c.metros, 2) + ' m'
  : PP.money0(c && c.base);
PP.comissaoBaseNome = t => t === 'metro' ? 'metro de piscina' : t === 'margem' ? 'margem bruta' : 'faturamento';

PP.orcSub    = o => (o && o.itens || []).reduce((s, i) => s + PP.n(i.qtd) * PP.n(i.preco), 0);
PP.orcDesc   = o => PP.orcSub(o) * PP.n(o && o.descontoPct) / 100;
PP.orcTotal  = o => PP.orcSub(o) - PP.orcDesc(o);
PP.orcCusto  = o => (o && o.itens || []).reduce((s, i) => s + PP.n(i.qtd) * PP.n(i.custo), 0);
PP.orcMargem = o => { const t = PP.orcTotal(o); return t ? (t - PP.orcCusto(o)) / t * 100 : 0; };

PP.orcDoPedido   = p => PP.find('orcamentos', p && p.orcamentoId);

/* O pedido guarda a própria foto financeira (total/custo/itens) no momento da
   venda. Só cai no orçamento para registros antigos, anteriores ao snapshot. */
PP.pedidoTotal   = p => p && p.total !== undefined ? PP.n(p.total) : PP.orcTotal(PP.orcDoPedido(p));
PP.pedidoCusto   = p => p && p.custo !== undefined ? PP.n(p.custo) : PP.orcCusto(PP.orcDoPedido(p));
PP.pedidoItens   = p => (p && p.itens) ? p.itens : ((PP.orcDoPedido(p) || {}).itens || []);
PP.pedidoDoOrc   = orcId => PP.all('pedidos').find(p => p.orcamentoId === orcId) || null;
PP.obraDoPedido  = pedId => PP.all('obras').find(o => o.pedidoId === pedId) || null;

/** Vendas (pedidos não cancelados) dentro de um mês 'YYYY-MM' */
PP.pedidosDoMes = mk => PP.where('pedidos', p => p.status !== 'cancelado' && PP.mesKey(p.data) === mk);
PP.vendasDoMes  = mk => PP.soma(PP.pedidosDoMes(mk), PP.pedidoTotal);

/** Realizado x meta do vendedor no mês */
PP.metasDoMes = mk => PP.where('vendedores', v => v.ativo).map(v => {
  const peds = PP.pedidosDoMes(mk).filter(p => p.vendedorId === v.id);
  const realizado = PP.soma(peds, PP.pedidoTotal);
  const meta = PP.n(v.meta) || PP.n(PP.cfg().metaPadrao);
  return { v, realizado, meta, qtd: peds.length, pc: meta ? realizado / meta * 100 : 0 };
});

/** Registra interação na timeline do lead */
PP.interagir = (leadId, tipo, texto, autor) => {
  const l = PP.lead(leadId);
  if (!l) return;
  l.interacoes = l.interacoes || [];
  l.interacoes.push({ data: PP.agora(), tipo, texto, autor: autor || PP.vendNome(l.vendedorId) });
  l.ultimoContato = PP.hoje();
  l.atualizadoEm = PP.agora();
  PP.save('leads');
};

/** Lead precisa de atenção? (follow-up vencido ou parado) */
PP.leadAtrasado = l => {
  if (!PP.ETAPAS_ATIVAS.includes(l.etapa)) return false;
  if (l.proximoContato && l.proximoContato < PP.hoje()) return true;
  const ref = l.ultimoContato || String(l.criadoEm || '').slice(0, 10);
  return PP.diasEntre(ref, PP.hoje()) > 7;
};

/* ============================== VISÃO GERAL ============================== */

PP.view('dashboard', {
  titulo: 'Visão geral',
  sub: () => `${PP.cfg().empresa} — ${PP.mesNomeLongo(PP.mesKey(PP.hoje()))}`,
  render() {
    const mk = PP.mesKey(PP.hoje());
    const mkAnt = PP.ultimosMeses(2)[0];
    const meses = PP.ultimosMeses(6);
    const gestor = PP.ehGestor();

    /* vendedor vê só a própria carteira; gestor vê a empresa inteira */
    const mesPeds = PP.escopo(PP.pedidosDoMes(mk));
    const vendasMes = PP.soma(mesPeds, PP.pedidoTotal);
    const vendasAnt = PP.soma(PP.escopo(PP.pedidosDoMes(mkAnt)), PP.pedidoTotal);
    const qtdMes = mesPeds.length;
    const ticket = qtdMes ? vendasMes / qtdMes : 0;
    const meusLeads = PP.escopo(PP.all('leads'));
    const leadsAtivos = meusLeads.filter(l => PP.ETAPAS_ATIVAS.includes(l.etapa));
    const ganhos = meusLeads.filter(l => l.etapa === 'ganho').length;
    const perdidos = meusLeads.filter(l => l.etapa === 'perdido').length;
    const conv = (ganhos + perdidos) ? ganhos / (ganhos + perdidos) * 100 : 0;
    const aReceber = PP.soma(PP.where('financeiro', f => f.tipo === 'receber' && f.status === 'aberto'), 'valor');
    const atrasado = PP.soma(PP.where('financeiro', f => f.tipo === 'receber' && f.status === 'aberto' && f.vencimento < PP.hoje()), 'valor');
    const obrasAtivas = PP.where('obras', o => o.status !== 'concluida' && o.status !== 'cancelada');
    const minhaComissao = PP.soma(PP.where('comissoes', c => c.competencia === mk
      && c.status !== 'cancelada' && (gestor || c.vendedorId === PP.vendedorAtual())), 'valor');

    const metas = gestor ? PP.metasDoMes(mk) : PP.metasDoMes(mk).filter(m => m.v.id === PP.vendedorAtual());
    const metaTime = PP.soma(metas, 'meta');
    const realTime = PP.soma(metas, 'realizado');

    const delta = vendasAnt ? (vendasMes - vendasAnt) / vendasAnt * 100 : 0;

    const kpis = [
      PP.kpi({ cls:'k-teal destaque', lbl:'Vendas do mês', val:PP.money0(vendasMes),
        foot: vendasAnt
          ? `<span class="delta ${delta >= 0 ? 'up' : 'down'}">${delta >= 0 ? '▲' : '▼'} ${PP.dec(Math.abs(delta), 1)}%</span> vs ${PP.mesNome(mkAnt)}`
          : `<span class="faint">sem vendas em ${PP.mesNome(mkAnt)} para comparar</span>`, footHTML:true }),
      PP.kpi({ lbl:'Pedidos fechados', val:String(qtdMes), foot:`Ticket médio ${PP.money0(ticket)}` }),
      PP.kpi({ lbl:'Leads ativos', val:String(leadsAtivos.length),
        foot:`${PP.money0(PP.soma(leadsAtivos, 'valorEstimado'))} em potencial` }),
      PP.kpi({ cls:'k-ocre', lbl:'Conversão', val:PP.pct(conv, 0), foot:`${ganhos} ganhos · ${perdidos} perdidos` }),
      gestor
        ? PP.kpi({ cls: atrasado > 0 ? 'k-dang' : 'k-ok', lbl:'A receber em aberto', val:PP.money0(aReceber), sm:true,
            foot: atrasado > 0 ? `${PP.money0(atrasado)} em atraso` : 'Nada em atraso' })
        : PP.kpi({ cls:'k-ok', lbl:'Minha comissão no mês', val:PP.money0(minhaComissao), sm:true,
            foot:'prevista + liberada + paga' }),
      gestor
        ? PP.kpi({ cls:'k-warn', lbl:'Obras em andamento', val:String(obrasAtivas.length),
            foot:`${PP.where('obras', o => o.status === 'concluida').length} concluídas no total` })
        : PP.kpi({ cls:'k-warn', lbl:'Propostas na rua', val:String(PP.escopo(PP.where('orcamentos', o => o.status === 'enviado' || o.status === 'negociando')).length),
            foot:PP.money0(PP.soma(PP.escopo(PP.where('orcamentos', o => o.status === 'enviado' || o.status === 'negociando')), PP.orcTotal)) })
    ].join('');

    /* gráfico: vendas x meta nos últimos 6 meses */
    const serieVendas = meses.map(m => PP.soma(PP.escopo(PP.pedidosDoMes(m)), PP.pedidoTotal));
    const serieMeta = meses.map(() => metaTime);

    /* funil agora */
    const funilItens = PP.ETAPAS_ATIVAS.map(id => {
      const e = PP.etapa(id);
      const ls = meusLeads.filter(l => l.etapa === id);
      return { nome:e.nome, cor:e.cor, qtd:ls.length, valor:PP.soma(ls, 'valorEstimado') };
    });

    /* painéis de atenção */
    const followVencidos = meusLeads.filter(PP.leadAtrasado)
      .sort((a, b) => (a.proximoContato || '9') < (b.proximoContato || '9') ? -1 : 1).slice(0, 6);
    const propostas = PP.escopo(PP.where('orcamentos', o => o.status === 'enviado' || o.status === 'negociando'))
      .sort((a, b) => a.validade < b.validade ? -1 : 1).slice(0, 6);
    const meusPedidoIds = new Set(PP.escopo(PP.all('pedidos')).map(p => p.id));
    const agenda = PP.where('obras', o => o.dataAgendada && o.status !== 'concluida' && o.status !== 'cancelada'
        && (gestor || meusPedidoIds.has(o.pedidoId)))
      .sort((a, b) => a.dataAgendada < b.dataAgendada ? -1 : 1).slice(0, 6);
    const emAtraso = PP.where('financeiro', f => f.status === 'aberto' && f.vencimento < PP.hoje())
      .sort((a, b) => a.vencimento < b.vencimento ? -1 : 1).slice(0, 6);
    const meusChamados = PP.where('chamados', c => c.status !== 'resolvido' && c.status !== 'cancelado'
      && (gestor || meusPedidoIds.has(c.pedidoId))).slice(0, 6);

    return `
    <div class="kpis kpis-6 mb">${kpis}</div>

    <div class="grid g-3-2 mb">
      <div class="card">
        <div class="card-hd">
          <div><h3>Vendas por mês</h3><div class="sub">Faturamento fechado x meta do time</div></div>
          <div class="right legend">
            <span><i style="background:var(--teal)"></i>Realizado</span>
            <span><i style="background:var(--areia)"></i>Meta</span>
          </div>
        </div>
        <div class="card-bd">
          ${PP.chart.barras({
            labels: meses.map(PP.mesNome), height: 236, modo:'alvo',
            series: [
              { nome:'Meta', cor:'#B99A6B', values: serieMeta },
              { nome:'Realizado', cor:'#0E7C86', values: serieVendas }
            ]
          })}
        </div>
      </div>

      <div class="card">
        <div class="card-hd"><div><h3>Funil agora</h3><div class="sub">Leads ativos por etapa</div></div></div>
        <div class="card-bd">
          ${PP.chart.funil({ items: funilItens })}
          <div class="sep"></div>
          <button class="btn btn-block" data-act="nav" data-v="funil">Abrir funil completo <svg class="ic"><use href="#i-seta"/></svg></button>
        </div>
      </div>
    </div>

    <div class="grid g-2-1 mb">
      <div class="card">
        <div class="card-hd">
          <div><h3>Metas por vendedor</h3><div class="sub">${PP.mesNomeLongo(mk)}</div></div>
          <div class="right small">
            <span class="faint">Time:</span> <b>${esc(PP.money0(realTime))}</b>
            <span class="faint">/ ${esc(PP.money0(metaTime))}</span>
            ${PP.badge(PP.pct(metaTime ? realTime / metaTime * 100 : 0, 0), metaTime && realTime / metaTime >= 1 ? 'b-ok' : 'b-warn')}
          </div>
        </div>
        <div class="card-bd">
          ${metas.length ? PP.sortBy(metas, 'realizado', 'desc').map(m => `
            <div class="meta-row">
              <div class="who"><span class="av-mini">${esc(PP.iniciais(m.v.nome))}</span><span style="overflow:hidden;text-overflow:ellipsis">${esc(m.v.nome.split(' ')[0])}</span></div>
              <div class="bar"><i class="${m.pc >= 100 ? 'ok' : m.pc >= 60 ? '' : m.pc >= 30 ? 'warn' : 'dang'}" style="width:${Math.min(m.pc, 100)}%"></i></div>
              <div class="pc">${esc(PP.moneyK(m.realizado))}<br><span class="tiny faint">${PP.dec(m.pc, 0)}% da meta</span></div>
            </div>`).join('') : '<div class="empty-sm">Nenhum vendedor ativo.</div>'}
        </div>
      </div>

      <div class="card">
        <div class="card-hd"><div><h3>Follow-ups vencidos</h3><div class="sub">Leads parados ou com retorno atrasado</div></div></div>
        <div class="card-bd">
          ${followVencidos.length ? followVencidos.map(l => `
            <div class="att-item" tabindex="0" role="button" data-act="abrirLead" data-id="${esc(l.id)}" style="cursor:pointer">
              <svg class="ic"><use href="#i-relogio"/></svg>
              <div class="txt"><b>${esc(l.nome)}</b><small>${esc(PP.etapa(l.etapa).nome)} · ${esc(PP.vendNome(l.vendedorId).split(' ')[0])} · ${esc(PP.tempoRelativo(l.ultimoContato || l.criadoEm))}</small></div>
              <div class="val">${esc(PP.moneyK(l.valorEstimado))}</div>
            </div>`).join('') : '<div class="empty-sm">Tudo em dia. Nenhum follow-up vencido.</div>'}
        </div>
      </div>
    </div>

    <div class="grid g-3">
      <div class="card">
        <div class="card-hd"><div><h3>Propostas aguardando</h3><div class="sub">Enviadas e em negociação</div></div></div>
        <div class="card-bd">
          ${propostas.length ? propostas.map(o => {
            const venc = o.validade < PP.hoje();
            return `<div class="att-item" tabindex="0" role="button" data-act="abrirOrc" data-id="${esc(o.id)}" style="cursor:pointer">
              <svg class="ic"><use href="#i-orc"/></svg>
              <div class="txt"><b>#${o.numero} · ${esc(PP.trunc(o.clienteId ? PP.cliNome(o.clienteId) : (PP.lead(o.leadId) || {}).nome || 'Sem cliente', 24))}</b>
                <small>${venc ? '<span style="color:var(--dang);font-weight:700">Validade vencida</span>' : 'Válida até ' + PP.dt(o.validade)}</small></div>
              <div class="val">${esc(PP.moneyK(PP.orcTotal(o)))}</div>
            </div>`;
          }).join('') : '<div class="empty-sm">Nenhuma proposta em aberto.</div>'}
        </div>
      </div>

      <div class="card">
        <div class="card-hd"><div><h3>Agenda de obras</h3><div class="sub">Próximas instalações</div></div></div>
        <div class="card-bd">
          ${agenda.length ? agenda.map(o => {
            const dias = PP.diasEntre(PP.hoje(), o.dataAgendada);
            return `<div class="att-item" tabindex="0" role="button" data-act="abrirObra" data-id="${esc(o.id)}" style="cursor:pointer">
              <svg class="ic"><use href="#i-obra"/></svg>
              <div class="txt"><b>${esc(PP.trunc(PP.cliNome(o.clienteId), 26))}</b><small>${esc(PP.STATUS_OBRA[o.status].nome)} · ${esc(o.cidade || '')}</small></div>
              <div class="val">${dias < 0 ? '<span style="color:var(--dang)">atrasada</span>' : dias === 0 ? 'hoje' : 'em ' + dias + 'd'}</div>
            </div>`;
          }).join('') : '<div class="empty-sm">Nenhuma obra agendada.</div>'}
        </div>
      </div>

      ${gestor ? `
      <div class="card">
        <div class="card-hd"><div><h3>Financeiro em atraso</h3><div class="sub">Vencidos e ainda em aberto</div></div></div>
        <div class="card-bd">
          ${emAtraso.length ? emAtraso.map(f => `
            <div class="att-item" tabindex="0" role="button" data-act="nav" data-v="financeiro" style="cursor:pointer">
              <svg class="ic" style="color:${f.tipo === 'receber' ? 'var(--ok)' : 'var(--dang)'}"><use href="#i-fin"/></svg>
              <div class="txt"><b>${esc(PP.trunc(f.descricao, 30))}</b><small>${f.tipo === 'receber' ? 'A receber' : 'A pagar'} · venceu ${esc(PP.dt(f.vencimento))}</small></div>
              <div class="val" style="color:${f.tipo === 'receber' ? 'var(--ok)' : 'var(--dang)'}">${esc(PP.moneyK(f.valor))}</div>
            </div>`).join('') : '<div class="empty-sm">Nada vencido. Muito bom.</div>'}
        </div>
      </div>` : `
      <div class="card">
        <div class="card-hd"><div><h3>Pós-venda dos meus clientes</h3><div class="sub">Chamados em aberto</div></div></div>
        <div class="card-bd">
          ${meusChamados.length ? meusChamados.map(c => `
            <div class="att-item" tabindex="0" role="button" data-act="abrirChamado" data-id="${esc(c.id)}" style="cursor:pointer">
              <svg class="ic"><use href="#i-suporte"/></svg>
              <div class="txt"><b>${esc(PP.trunc(PP.cliNome(c.clienteId), 26))}</b><small>${esc(c.tipo)} · ${esc(PP.STATUS_CHAMADO[c.status].nome)}</small></div>
              <div class="val">${PP.diasEntre(String(c.abertura).slice(0, 10), PP.hoje())}d</div>
            </div>`).join('') : '<div class="empty-sm">Nenhum chamado aberto nos seus clientes.</div>'}
        </div>
      </div>`}
    </div>`;
  }
});

/* ============================== FUNIL (KANBAN) ============================== */

let filtroVend = '';

PP.view('funil', {
  titulo: 'Funil de vendas',
  sub: () => {
    const ls = PP.escopo(PP.where('leads', l => PP.ETAPAS_ATIVAS.includes(l.etapa)));
    return `${ls.length} leads ativos · ${PP.money0(PP.soma(ls, 'valorEstimado'))} em potencial · arraste os cards entre as colunas`;
  },
  render() {
    const gestor = PP.ehGestor();
    const vends = PP.where('vendedores', v => v.ativo);
    const base = PP.escopo(PP.all('leads'));
    const cols = PP.ETAPAS.map(e => {
      let leads = base.filter(l => l.etapa === e.id && (!filtroVend || l.vendedorId === filtroVend));
      leads = PP.sortBy(leads, 'atualizadoEm', 'desc');
      /* o contador e o valor da coluna usam a etapa INTEIRA; o corte é só de desenho,
         senão uma base grande joga milhares de cards no DOM de uma vez */
      const qtd = leads.length;
      const total = PP.soma(leads, 'valorEstimado');
      const limite = (e.id === 'ganho' || e.id === 'perdido') ? 12 : 40;
      const mostrar = leads.slice(0, limite);
      const ocultos = qtd - mostrar.length;
      return `
      <section class="col" data-etapa="${e.id}">
        <div class="col-hd">
          <span class="nm">${esc(e.nome)}</span>
          <span class="ct">${qtd}</span>
          <span class="vl">${esc(PP.moneyK(total))}</span>
        </div>
        <div class="col-bar" style="background:${e.cor}"></div>
        <div class="col-bd" data-drop="${e.id}">
          ${mostrar.map(cardLead).join('') || `<div class="empty-sm" style="padding:16px 8px">Nenhum lead aqui.</div>`}
          ${ocultos > 0 ? `<button class="btn btn-sm btn-block" data-act="verEtapa" data-e="${e.id}">
            +${ocultos} na lista completa</button>` : ''}
        </div>
      </section>`;
    }).join('');

    return `
      <div class="toolbar">
        ${gestor ? `<div class="seg">
          <button class="${!filtroVend ? 'on' : ''}" data-act="funilVend" data-v="">Todos</button>
          ${vends.map(v => `<button class="${filtroVend === v.id ? 'on' : ''}" data-act="funilVend" data-v="${esc(v.id)}">${esc(v.nome.split(' ')[0])}</button>`).join('')}
        </div>` : `<span class="badge b-teal">Minha carteira</span>`}
        <div class="row-end row">
          <button class="btn" data-act="importarLeads"><svg class="ic"><use href="#i-importar"/></svg>Importar</button>
          <button class="btn" data-act="exportarLeads"><svg class="ic"><use href="#i-down"/></svg>Exportar CSV</button>
          <button class="btn btn-primary" data-act="novoLead"><svg class="ic"><use href="#i-plus"/></svg>Novo lead</button>
        </div>
      </div>
      <div class="funil">${cols}</div>`;
  },
  depois(root) { ligarDnD(root); }
});

function cardLead(l) {
  const e = PP.etapa(l.etapa);
  const atrasado = PP.leadAtrasado(l);
  const prod = l.produtoId ? PP.prodNome(l.produtoId) : '';
  return `
  <article class="lead-card" draggable="true" data-id="${esc(l.id)}" tabindex="0" role="button" data-act="abrirLead">
    <div class="lc-top">
      <div style="min-width:0;flex:1">
        <div class="nm">${esc(l.nome)}</div>
        <div class="sub">${esc([l.cidade, l.bairro].filter(Boolean).join(' · ') || PP.fone(l.telefone))}</div>
      </div>
    </div>
    <div class="lc-mid">
      <span class="vl">${esc(PP.moneyK(l.valorEstimado))}</span>
      ${prod ? `<span class="badge b-teal">${esc(PP.trunc(prod.replace('Piscina ', ''), 14))}</span>` : ''}
    </div>
    <div class="lc-ft">
      <span class="av-mini" title="${esc(PP.vendNome(l.vendedorId))}">${esc(PP.iniciais(PP.vendNome(l.vendedorId)))}</span>
      <span>${esc(l.origem || '—')}</span>
      <span class="tempo ${atrasado ? 'quente' : ''}">
        <svg class="ic" style="width:12px;height:12px"><use href="#i-relogio"/></svg>
        ${esc(PP.tempoRelativo(l.ultimoContato || l.criadoEm))}
      </span>
    </div>
  </article>`;
}

PP.on('funilVend', d => { filtroVend = d.v || ''; PP.render(); });
PP.on('verEtapa', d => {
  fLead.etapa = d.e; fLead.q = ''; fLead.vend = filtroVend; fLead.origem = '';
  PP.resetPagina('leads');
  PP.ir('leads');
});

/* --- drag & drop: mouse (HTML5) + toque --- */
function ligarDnD(root) {
  let arrastando = null;

  root.querySelectorAll('.lead-card').forEach(card => {
    card.addEventListener('dragstart', e => {
      arrastando = card;
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.setData('text/plain', card.dataset.id); } catch (err) {}
    });
    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      root.querySelectorAll('.col').forEach(c => c.classList.remove('drop'));
      arrastando = null;
    });

    /* toque */
    let tocando = false, alvoCol = null, timer = null;
    card.addEventListener('touchstart', e => {
      timer = setTimeout(() => { tocando = true; card.classList.add('dragging'); }, 220);
    }, { passive: true });
    card.addEventListener('touchmove', e => {
      if (!tocando) { clearTimeout(timer); return; }
      e.preventDefault();
      const t = e.touches[0];
      const el = document.elementFromPoint(t.clientX, t.clientY);
      const col = el && el.closest('.col');
      root.querySelectorAll('.col').forEach(c => c.classList.toggle('drop', c === col));
      alvoCol = col;
    }, { passive: false });
    card.addEventListener('touchend', () => {
      clearTimeout(timer);
      card.classList.remove('dragging');
      root.querySelectorAll('.col').forEach(c => c.classList.remove('drop'));
      if (tocando && alvoCol) moverLead(card.dataset.id, alvoCol.dataset.etapa);
      tocando = false; alvoCol = null;
    });
  });

  root.querySelectorAll('.col').forEach(col => {
    col.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; col.classList.add('drop'); });
    col.addEventListener('dragleave', e => { if (!col.contains(e.relatedTarget)) col.classList.remove('drop'); });
    col.addEventListener('drop', e => {
      e.preventDefault();
      col.classList.remove('drop');
      const id = (arrastando && arrastando.dataset.id) || e.dataTransfer.getData('text/plain');
      if (id) moverLead(id, col.dataset.etapa);
    });
  });
}

function moverLead(id, etapa) {
  const l = PP.lead(id);
  if (!l || l.etapa === etapa) return;
  if (etapa === 'ganho') return marcarGanho(id);
  if (etapa === 'perdido') return marcarPerdido(id);
  const de = PP.etapa(l.etapa).nome;
  l.etapa = etapa;
  l.atualizadoEm = PP.agora();
  PP.save('leads');
  PP.interagir(id, 'Etapa', `Movido de "${de}" para "${PP.etapa(etapa).nome}".`, 'Sistema');
  PP.toast(`${l.nome.split(' ')[0]} → ${PP.etapa(etapa).nome}`, 'ok');
  PP.render();
}
PP.moverLead = moverLead;

/* ============================== BASE DE LEADS ============================== */

const fLead = { q:'', etapa:'', vend:'', origem:'', ord:'atualizadoEm', dir:'desc' };
let paginaRemota=null, chavePagina='';
PP.prepararPaginaLeads=async()=>{
  if (PP.driver.nome!=='supabase') return;
  await PP.db.confirmar();
  const p=(PP.PAGS.leads || {}).p || 1;
  const chave=JSON.stringify([fLead,p,PP.nuvem.epoca]);
  if (chave===chavePagina) return;
  const resultado=await PP.driver.paginaLeads(fLead,p);
  paginaRemota=resultado;
  PP.PAGS.leads={p:resultado.pagina};
  PP.db.incorporar('leads',resultado.linhas);
  chavePagina=chave;
};

PP.view('leads', {
  titulo: 'Base de leads',
  sub: () => `${paginaRemota ? paginaRemota.total : PP.escopo(PP.all('leads')).length} leads${PP.ehGestor() ? ' cadastrados' : ' na sua carteira'}`,
  render() {
    let rows = PP.escopo(PP.all('leads')).slice();
    if (fLead.q) {
      const q = PP.norm(fLead.q);
      rows = rows.filter(l => PP.norm(l.nome).includes(q) || PP.digitos(l.telefone).includes(PP.digitos(fLead.q)) ||
        PP.norm(l.email || '').includes(q) || PP.norm(l.cidade || '').includes(q));
    }
    if (fLead.etapa) rows = rows.filter(l => l.etapa === fLead.etapa);
    if (fLead.vend) rows = rows.filter(l => l.vendedorId === fLead.vend);
    if (fLead.origem) rows = rows.filter(l => l.origem === fLead.origem);
    rows = PP.sortBy(rows, fLead.ord, fLead.dir);
    const remoto=PP.driver.nome==='supabase' && paginaRemota;
    if (remoto) rows=remoto.linhas;
    const pag = PP.paginar('leads', rows,60,remoto?remoto.total:undefined);

    const contas = {};
    const base = PP.escopo(PP.all('leads'));
    PP.ETAPAS.forEach(e => contas[e.id] = base.filter(l => l.etapa === e.id).length);
    if (remoto) PP.ETAPAS.forEach(e=>contas[e.id]=remoto.etapas[e.id] || 0);

    return `
      <div class="toolbar">
        <div class="mini-search">
          <svg class="ic"><use href="#i-busca"/></svg>
          <input class="inp" type="search" placeholder="Nome, telefone, e-mail ou cidade" value="${esc(fLead.q)}" data-inp="buscaLead" aria-label="Buscar leads">
        </div>
        <select class="inp" style="width:auto" data-chg="filtroLead" data-f="etapa" aria-label="Etapa">
          <option value="">Todas as etapas</option>
          ${PP.ETAPAS.map(e => `<option value="${e.id}"${fLead.etapa === e.id ? ' selected' : ''}>${esc(e.nome)} (${contas[e.id]})</option>`).join('')}
        </select>
        ${PP.ehGestor() ? `<select class="inp" style="width:auto" data-chg="filtroLead" data-f="vend" aria-label="Vendedor">
          <option value="">Todos os vendedores</option>
          ${PP.where('vendedores', v => v.ativo).map(v => `<option value="${v.id}"${fLead.vend === v.id ? ' selected' : ''}>${esc(v.nome)}</option>`).join('')}
        </select>` : ''}
        <select class="inp" style="width:auto" data-chg="filtroLead" data-f="origem" aria-label="Origem">
          <option value="">Todas as origens</option>
          ${PP.ORIGENS.map(o => `<option value="${esc(o)}"${fLead.origem === o ? ' selected' : ''}>${esc(o)}</option>`).join('')}
        </select>
        <div class="row-end row">
          <span class="small faint">${pag.total} resultado(s) · ${PP.money0(remoto?remoto.valor:PP.soma(rows, 'valorEstimado'))}</span>
          <button class="btn" data-act="importarLeads"><svg class="ic"><use href="#i-importar"/></svg>Importar</button>
          <button class="btn" data-act="exportarLeads"><svg class="ic"><use href="#i-down"/></svg>CSV</button>
          <button class="btn btn-primary" data-act="novoLead"><svg class="ic"><use href="#i-plus"/></svg>Novo lead</button>
        </div>
      </div>

      <div class="card">
        ${rows.length ? PP.tabela({
          act:'abrirLead', rows:pag.linhas,
          cols:[
            { h:'Lead', r:l => `<div class="strong">${esc(l.nome)}</div><span class="mini">${esc(PP.fone(l.telefone))}${l.cidade ? ' · ' + esc(l.cidade) : ''}</span>` },
            { h:'Etapa', r:l => { const e = PP.etapa(l.etapa); return `<span class="badge" style="background:${e.cor}1f;color:${e.cor}"><span class="dt"></span>${esc(e.nome)}</span>`; } },
            { h:'Interesse', r:l => l.produtoId ? esc(PP.prodNome(l.produtoId)) : '<span class="faint">—</span>' },
            { h:'Origem', r:l => `<span class="small">${esc(l.origem || '—')}</span>` },
            { h:'Vendedor', r:l => `<span class="small">${esc(PP.vendNome(l.vendedorId).split(' ')[0])}</span>` },
            { h:'Valor', cls:'num', r:l => `<b>${esc(PP.money0(l.valorEstimado))}</b>` },
            { h:'Últ. contato', cls:'num', r:l => PP.leadAtrasado(l)
              ? `<span class="small b" style="color:var(--dang)">${esc(PP.tempoRelativo(l.ultimoContato || l.criadoEm))}</span>`
              : `<span class="small">${esc(PP.tempoRelativo(l.ultimoContato || l.criadoEm))}</span>` }
          ]
        }) + pag.html : PP.vazio('Nenhum lead encontrado', 'Ajuste os filtros ou cadastre um novo lead.', { act:'novoLead', txt:'Novo lead' })}
      </div>`;
  }
});

PP.on('buscaLead', PP.debounce((d, el) => { fLead.q = el.value; PP.resetPagina('leads'); PP.render(); }, 250));
PP.on('filtroLead', (d, el) => { fLead[d.f] = el.value; PP.resetPagina('leads'); PP.render(); });

/* ---------- formulário de lead ---------- */

function camposLead() {
  return [
    { k:'id', t:'hidden' },
    { k:'nome', l:'Nome do lead', t:'text', col:7, req:true, ph:'Nome completo ou razão social' },
    { k:'telefone', l:'Telefone / WhatsApp', t:'tel', col:5, req:true, ph:'(00) 00000-0000' },
    { k:'email', l:'E-mail', t:'email', col:7, ph:'nome@email.com' },
    { k:'origem', l:'Origem', t:'select', col:5, opts:PP.ORIGENS, req:true },
    { k:'cidade', l:'Cidade', t:'text', col:6 },
    { k:'bairro', l:'Bairro', t:'text', col:6 },
    { sep:'Qualificação' },
    { k:'produtoId', l:'Modelo de interesse', t:'select', col:6,
      opts:PP.where('produtos', p => p.categoria === 'Piscina' && p.ativo).map(p => ({ v:p.id, l:`${p.nome} — ${p.specs.compr}×${p.specs.larg} m` })) },
    { k:'valorEstimado', l:'Valor estimado', t:'money', col:3, req:true, val:'naoNegativo' },
    { k:'etapa', l:'Etapa', t:'select', col:3, vazio:false, opts:PP.ETAPAS.map(e => ({ v:e.id, l:e.nome })) },
    { k:'vendedorId', l:'Vendedor responsável', t:'select', col:6, req:true,
      opts:PP.where('vendedores', v => v.ativo).map(v => ({ v:v.id, l:v.nome })) },
    { k:'proximoContato', l:'Próximo contato', t:'date', col:6, hint:'Usado para avisar de follow-up vencido' },
    { k:'obs', l:'Observações', t:'textarea', col:12, rows:3, ph:'Acesso ao terreno, expectativa de prazo, restrições…' }
  ];
}

PP.on('novoLead', () => abrirFormLead(null));
PP.on('editarLead', d => { PP.closeTop(); abrirFormLead(PP.lead(d.id)); });

function abrirFormLead(lead) {
  const novo = !lead;
  const v = lead || { etapa:'novo', vendedorId:(PP.where('vendedores', x => x.ativo)[0] || {}).id, origem:'Instagram' };
  PP.modal({
    title: novo ? 'Novo lead' : 'Editar lead',
    sub: novo ? 'Cadastre o contato e ele entra no funil' : v.nome,
    size: 'lg',
    body: `<form data-sub="salvarLead" id="formLead">${PP.form(camposLead(), v)}</form>`,
    actions: [{ txt:novo ? 'Cadastrar lead' : 'Salvar', cls:'btn-primary', act:'salvarLeadBtn' }, { txt:'Cancelar', act:'fechar' }]
  });
}
PP.on('salvarLeadBtn', (d, el) => salvarLead(el.closest('.modal-box').querySelector('#formLead')));
PP.on('salvarLead', (d, el) => salvarLead(el));

function salvarLead(form) {
  const { ok, data } = PP.lerForm(form);
  if (!ok) return;
  const novo = !data.id;
  if (novo) {
    data.criadoEm = PP.agora();
    data.interacoes = [{ data:PP.agora(), tipo:'Sistema', texto:'Lead cadastrado no sistema.', autor:'Sistema' }];
    data.ultimoContato = '';
  }
  const id = PP.upsert('leads', data);
  PP.closeTop();
  PP.toast(novo ? 'Lead cadastrado' : 'Lead atualizado', 'ok');
  PP.render();
  if (novo) abrirLead(id);
}

/* ---------- drawer de detalhe do lead ---------- */

PP.on('abrirLead', d => abrirLead(d.id));

function abrirLead(id) {
  const l = PP.lead(id);
  if (!l) return PP.toast('Lead não encontrado', 'err');
  const e = PP.etapa(l.etapa);
  const orcs = PP.where('orcamentos', o => o.leadId === id);
  const inter = (l.interacoes || []).slice().reverse();
  const cliente = PP.all('clientes').find(c => c.leadId === id);

  const body = `
    <div class="row mb" style="gap:7px">
      <span class="badge" style="background:${e.cor}1f;color:${e.cor}"><span class="dt"></span>${esc(e.nome)}</span>
      ${PP.leadAtrasado(l) ? PP.badge('Follow-up vencido', 'b-dang') : ''}
      ${cliente ? PP.badge('Já é cliente', 'b-ok') : ''}
    </div>

    <div class="card mb"><div class="card-bd">
      <dl class="dl">
        <dt>Telefone</dt><dd>${esc(PP.fone(l.telefone))}</dd>
        <dt>E-mail</dt><dd>${esc(l.email || '—')}</dd>
        <dt>Local</dt><dd>${esc([l.bairro, l.cidade].filter(Boolean).join(' — ') || '—')}</dd>
        <dt>Origem</dt><dd>${esc(l.origem || '—')}</dd>
        <dt>Interesse</dt><dd>${l.produtoId ? esc(PP.prodNome(l.produtoId)) : '—'}</dd>
        <dt>Valor estimado</dt><dd><b>${esc(PP.money(l.valorEstimado))}</b></dd>
        <dt>Vendedor</dt><dd>${esc(PP.vendNome(l.vendedorId))}</dd>
        <dt>Cadastrado</dt><dd>${esc(PP.dt(String(l.criadoEm).slice(0, 10)))} (${esc(PP.tempoRelativo(l.criadoEm))})</dd>
        <dt>Próx. contato</dt><dd>${l.proximoContato ? `<span class="${l.proximoContato < PP.hoje() ? 'b' : ''}" style="${l.proximoContato < PP.hoje() ? 'color:var(--dang)' : ''}">${esc(PP.dt(l.proximoContato))}</span>` : '—'}</dd>
        ${l.motivoPerda ? `<dt>Motivo da perda</dt><dd style="color:var(--dang)">${esc(l.motivoPerda)}</dd>` : ''}
      </dl>
      ${l.obs ? `<div class="sep"></div><div class="small muted">${esc(l.obs)}</div>` : ''}
    </div></div>

    <div class="row mb" style="gap:8px">
      <button class="btn btn-sm btn-ok" data-act="waLead" data-id="${esc(l.id)}" data-tipo="${orcs.length ? 'followup' : 'novo'}">
        <svg class="ic ic-sm"><use href="#i-wpp"/></svg>${orcs.length ? 'Follow-up no WhatsApp' : 'Abrir WhatsApp'}</button>
      <button class="btn btn-sm" data-act="interagirLead" data-id="${esc(l.id)}" data-tipo="Ligação"><svg class="ic ic-sm"><use href="#i-relogio"/></svg>Ligação</button>
      <button class="btn btn-sm" data-act="interagirLead" data-id="${esc(l.id)}" data-tipo="Visita"><svg class="ic ic-sm"><use href="#i-obra"/></svg>Visita</button>
      <button class="btn btn-sm" data-act="agendarLead" data-id="${esc(l.id)}">Agendar retorno</button>
    </div>

    ${orcs.length ? `
    <div class="card mb">
      <div class="card-hd"><div><h3>Orçamentos</h3></div></div>
      <div class="card-bd" style="padding:0">
        ${PP.tabela({
          act:'abrirOrc', rows:orcs,
          cols:[
            { h:'Nº', r:o => `<b>#${o.numero}</b><span class="mini">${esc(PP.dt(o.data))}</span>` },
            { h:'Status', r:o => PP.badge(PP.STATUS_ORC[o.status].nome, PP.STATUS_ORC[o.status].cls) },
            { h:'Total', cls:'num', r:o => `<b>${esc(PP.money(PP.orcTotal(o)))}</b>` }
          ]
        })}
      </div>
    </div>` : ''}

    <div class="card">
      <div class="card-hd"><div><h3>Histórico</h3><div class="sub">${PP.plural(inter.length, 'interação', 'interações')}</div></div>
        <button class="btn btn-sm right" data-act="interagirLead" data-id="${esc(l.id)}" style="margin-left:auto"><svg class="ic ic-sm"><use href="#i-plus"/></svg>Registrar</button>
      </div>
      <div class="card-bd">
        ${inter.length ? `<ul class="tl">${inter.map(i => `
          <li class="${i.tipo === 'Sistema' || i.tipo === 'Etapa' ? 'sys' : ''}">
            <div class="tl-hd"><b>${esc(i.tipo)}</b><time>${esc(PP.dtHora(i.data))}</time><span class="tiny faint">${esc(i.autor || '')}</span></div>
            <p>${esc(i.texto)}</p>
          </li>`).join('')}</ul>` : '<div class="empty-sm">Nenhuma interação registrada.</div>'}
      </div>
    </div>`;

  const acoes = [];
  if (l.etapa !== 'ganho' && l.etapa !== 'perdido') {
    acoes.push({ txt:'Criar orçamento', cls:'btn-teal', ic:'i-orc', act:'orcDoLead', data:{ id:l.id } });
    acoes.push({ txt:'Marcar ganho', cls:'btn-ok', ic:'i-check', act:'ganharLead', data:{ id:l.id } });
    acoes.push({ txt:'Perdido', cls:'btn-dang', act:'perderLead', data:{ id:l.id } });
  } else if (l.etapa === 'perdido') {
    acoes.push({ txt:'Reativar lead', cls:'btn-teal', act:'reativarLead', data:{ id:l.id } });
  }
  acoes.push({ txt:'Editar', ic:'i-edit', act:'editarLead', data:{ id:l.id } });
  acoes.push({ txt:'Excluir', act:'excluirLead', data:{ id:l.id } });

  PP.drawer({ title:l.nome, sub:`${PP.fone(l.telefone)} · ${l.origem || 'origem não informada'}`, body, actions:acoes, wide:true });
}
PP.abrirLead = abrirLead;

PP.on('interagirLead', async d => {
  const tipo = d.tipo || await escolherTipoInteracao();
  if (!tipo) return;
  const txt = await PP.perguntar('O que aconteceu?', { title:`Registrar ${tipo.toLowerCase()}`, multi:true });
  if (!txt) return;
  PP.interagir(d.id, tipo, txt);
  PP.toast('Interação registrada', 'ok');
  PP.closeAll(); abrirLead(d.id); PP.pintarNav();
});

function escolherTipoInteracao() {
  return new Promise(res => {
    const key = PP.uid('ti');
    PP.on(key, (dd) => { res(dd.t); PP.closeTop(); });
    PP.modal({
      title:'Tipo de interação', size:'sm',
      body:`<div class="pill-list">${['Ligação','WhatsApp','E-mail','Visita','Reunião','Proposta','Outro']
        .map(t => `<button class="chip" data-act="${key}" data-t="${esc(t)}">${esc(t)}</button>`).join('')}</div>`,
      onClose:() => res(null)
    });
  });
}

PP.on('agendarLead', async d => {
  const dt = await PP.perguntar('Data do próximo contato', { title:'Agendar retorno', tipo:'date', valor:PP.addDias(PP.hoje(), 3) });
  if (!dt) return;
  const l = PP.lead(d.id);
  l.proximoContato = dt;
  PP.save('leads');
  PP.interagir(d.id, 'Agenda', `Retorno agendado para ${PP.dt(dt)}.`, 'Sistema');
  PP.toast('Retorno agendado', 'ok');
  PP.closeAll(); abrirLead(d.id);
});

PP.on('ganharLead', d => marcarGanho(d.id));
PP.on('perderLead', d => marcarPerdido(d.id));

function marcarGanho(id) {
  const l = PP.lead(id);
  if (!l) return;
  const orcAprov = PP.where('orcamentos', o => o.leadId === id && o.status === 'aprovado');
  PP.confirmar(`Marcar "${l.nome}" como GANHO?`, {
    title:'Venda fechada',
    okTxt:'Sim, fechou!',
    aviso: orcAprov.length ? '' : 'Esse lead ainda não tem orçamento aprovado. Você poderá criar o pedido depois, pelo orçamento.'
  }).then(ok => {
    if (!ok) return;
    l.etapa = 'ganho';
    l.atualizadoEm = PP.agora();
    PP.save('leads');
    PP.interagir(id, 'Ganho', 'Venda fechada.', 'Sistema');
    if (!PP.all('clientes').some(c => c.leadId === id)) criarClienteDoLead(l);
    PP.toast('Parabéns! Venda registrada.', 'ok');
    PP.closeAll(); PP.render();
  });
}

function criarClienteDoLead(l) {
  PP.upsert('clientes', {
    nome:l.nome, doc:'', tipo:'PF', telefone:l.telefone, email:l.email || '',
    cep:'', endereco:'', bairro:l.bairro || '', cidade:l.cidade || '', uf:'',
    leadId:l.id, obs:l.obs || '', criadoEm:PP.agora()
  });
}

function marcarPerdido(id) {
  const l = PP.lead(id);
  if (!l) return;
  const key = PP.uid('mp');
  PP.on(key, (d, el) => {
    const box = el.closest('.modal-box');
    const motivo = box.querySelector('[data-k="motivoPerda"]').value;
    const det = box.querySelector('[data-k="detalhe"]').value.trim();
    if (!motivo) { PP.toast('Escolha o motivo', 'err'); return; }
    l.etapa = 'perdido'; l.motivoPerda = motivo; l.atualizadoEm = PP.agora();
    PP.save('leads');
    PP.interagir(id, 'Perdido', motivo + (det ? ' — ' + det : ''), 'Sistema');
    PP.closeAll(); PP.toast('Lead marcado como perdido'); PP.render();
  });
  PP.modal({
    title:'Marcar como perdido', sub:l.nome, size:'sm',
    body:PP.form([
      { k:'motivoPerda', l:'Motivo', t:'select', col:12, opts:PP.MOTIVOS_PERDA, req:true },
      { k:'detalhe', l:'Detalhe (opcional)', t:'textarea', col:12, rows:3, ph:'O que pesou na decisão?' }
    ], {}),
    actions:[{ txt:'Confirmar perda', cls:'btn-dang', act:key }, { txt:'Cancelar', act:'fechar' }]
  });
}

PP.on('reativarLead', d => {
  const l = PP.lead(d.id);
  l.etapa = 'contato'; l.motivoPerda = ''; l.proximoContato = PP.addDias(PP.hoje(), 2); l.atualizadoEm = PP.agora();
  PP.save('leads');
  PP.interagir(d.id, 'Etapa', 'Lead reativado e devolvido ao funil.', 'Sistema');
  PP.toast('Lead reativado', 'ok');
  PP.closeAll(); PP.render();
});

PP.on('excluirLead', async d => {
  const l = PP.lead(d.id);
  const ok = await PP.confirmarExclusao('lead', d.id, l.nome, {
    alternativa:'Se a venda não andou, marque o lead como perdido em vez de apagar — o histórico vira informação para os relatórios.'
  });
  if (!ok) return;
  PP.desvincular('lead', d.id);
  PP.remove('leads', d.id);
  PP.closeAll(); PP.toast('Lead excluído'); PP.render();
});

PP.on('exportarLeads', () => {
  const linhas = [['Nome','Telefone','E-mail','Cidade','Bairro','Origem','Etapa','Interesse','Valor estimado','Vendedor','Último contato','Próximo contato','Motivo perda','Observações']];
  PP.all('leads').forEach(l => linhas.push([
    l.nome, l.telefone, l.email || '', l.cidade || '', l.bairro || '', l.origem || '',
    PP.etapa(l.etapa).nome, l.produtoId ? PP.prodNome(l.produtoId) : '',
    PP.dec(l.valorEstimado), PP.vendNome(l.vendedorId), PP.dt(l.ultimoContato), PP.dt(l.proximoContato),
    l.motivoPerda || '', (l.obs || '').replace(/\n/g, ' ')
  ]));
  PP.baixar(`leads-${PP.hoje()}.csv`, PP.csv(linhas), 'text/csv;charset=utf-8');
  PP.toast('CSV exportado', 'ok');
});

/* ============================== IMPORTAR LEADS ============================== */

/* Campos do lead que o importador sabe preencher */
const CAMPOS_IMPORT = [
  { k:'nome',           l:'Nome',              dicas:['nome','cliente','contato','lead','name','full name'] },
  { k:'telefone',       l:'Telefone',          dicas:['telefone','fone','celular','whatsapp','tel','phone'] },
  { k:'email',          l:'E-mail',            dicas:['email','e-mail','mail'] },
  { k:'cidade',         l:'Cidade',            dicas:['cidade','municipio','city'] },
  { k:'bairro',         l:'Bairro',            dicas:['bairro','regiao'] },
  { k:'origem',         l:'Origem',            dicas:['origem','fonte','canal','source'] },
  { k:'produtoId',      l:'Modelo de interesse',dicas:['modelo','produto','piscina','interesse'] },
  { k:'valorEstimado',  l:'Valor estimado',    dicas:['valor','estimado','ticket','orcamento','preco'] },
  { k:'obs',            l:'Observações',       dicas:['obs','observacao','anotacao','mensagem','comentario','nota'] }
];

/** Divide uma linha de CSV respeitando aspas. */
function csvLinha(linha, sep) {
  const out = [];
  let atual = '', aspas = false;
  for (let i = 0; i < linha.length; i++) {
    const c = linha[i];
    if (c === '"') {
      if (aspas && linha[i + 1] === '"') { atual += '"'; i++; }
      else aspas = !aspas;
    } else if (c === sep && !aspas) { out.push(atual); atual = ''; }
    else atual += c;
  }
  out.push(atual);
  return out.map(x => x.trim());
}

function lerCSV(texto) {
  const limpo = texto.replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  const linhas = limpo.split('\n').filter(l => l.trim());
  if (!linhas.length) return { cabecalho:[], dados:[] };
  /* detecta o separador pela primeira linha */
  const cand = [';', ',', '\t'];
  const sep = cand.reduce((melhor, s) =>
    csvLinha(linhas[0], s).length > csvLinha(linhas[0], melhor).length ? s : melhor, ';');
  const cabecalho = csvLinha(linhas[0], sep);
  const dados = linhas.slice(1).map(l => csvLinha(l, sep)).filter(c => c.some(x => x));
  return { cabecalho, dados, sep };
}

let IMP = null;

PP.on('importarLeads', () => {
  IMP = null;
  PP.modal({
    title:'Importar leads', sub:'Traga sua planilha de contatos para dentro do funil', size:'lg',
    body:`
      <label class="drop-zone" id="impDrop">
        <svg class="ic"><use href="#i-importar"/></svg>
        <div><b>Escolha um arquivo CSV</b></div>
        <div class="small muted" style="margin-top:4px">No Excel ou Google Planilhas use <b>Salvar como → CSV</b>. Separador por ponto e vírgula ou vírgula, tanto faz.</div>
        <input type="file" accept=".csv,text/csv,text/plain" style="display:none" data-chg="impArquivo">
      </label>
      <div class="alert a-info mt"><svg class="ic"><use href="#i-alerta"/></svg>
        <div class="small">A primeira linha precisa ser o cabeçalho com os nomes das colunas. O sistema tenta adivinhar o que é cada coluna e você confere antes de importar.</div></div>`,
    actions:[{ txt:'Cancelar', act:'fechar' }]
  });
});

PP.on('impArquivo', (d, el) => {
  const file = el.files && el.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const { cabecalho, dados } = lerCSV(String(reader.result));
    if (!cabecalho.length || !dados.length) { PP.toast('Arquivo vazio ou sem linhas de dados', 'err'); return; }
    if (dados.length > 2000) { PP.toast('Limite de 2000 linhas por importação', 'err'); return; }

    /* tenta casar cada coluna do arquivo com um campo do lead */
    const mapa = {};
    CAMPOS_IMPORT.forEach(c => {
      const idx = cabecalho.findIndex(h => c.dicas.some(dica => PP.norm(h).includes(dica)));
      if (idx >= 0 && !Object.values(mapa).includes(idx)) mapa[c.k] = idx;
    });
    IMP = { cabecalho, dados, mapa };
    PP.closeTop();
    telaMapeamento();
  };
  reader.onerror = () => PP.toast('Não foi possível ler o arquivo', 'err');
  reader.readAsText(file, 'UTF-8');
});

function telaMapeamento() {
  const vends = PP.where('vendedores', v => v.ativo);
  PP.modal({
    title:'Conferir colunas', sub:`${IMP.dados.length} linha(s) encontradas em ${IMP.cabecalho.length} coluna(s)`, size:'xl',
    body:`
      <div class="grid g-2">
        <div class="card"><div class="card-hd"><div><h3>De → para</h3><div class="sub">Confira o que o sistema adivinhou</div></div></div>
          <div class="card-bd">
            ${CAMPOS_IMPORT.map(c => `
              <div class="imp-map">
                <div class="de">${esc(c.l)}${c.k === 'nome' ? ' <span style="color:var(--dang)">*</span>' : ''}</div>
                <div class="seta"><svg class="ic ic-sm"><use href="#i-seta"/></svg></div>
                <select class="inp" data-chg="impMapa" data-k="${esc(c.k)}" aria-label="Coluna para ${esc(c.l)}">
                  <option value="">— não importar —</option>
                  ${IMP.cabecalho.map((h, i) => `<option value="${i}"${IMP.mapa[c.k] === i ? ' selected' : ''}>${esc(h || 'coluna ' + (i + 1))}</option>`).join('')}
                </select>
              </div>`).join('')}
          </div>
        </div>
        <div class="stack">
          <div class="card"><div class="card-hd"><div><h3>Padrões</h3><div class="sub">Aplicados a todos os leads importados</div></div></div>
            <div class="card-bd">
              <div class="fgrid">
                <div class="f f-12"><label for="impVend">Vendedor responsável</label>
                  <select class="inp" id="impVend">${vends.map(v => `<option value="${v.id}"${v.id === (PP.vendedorAtual() || '') ? ' selected' : ''}>${esc(v.nome)}</option>`).join('')}</select></div>
                <div class="f f-6"><label for="impOrigem">Origem padrão</label>
                  <select class="inp" id="impOrigem">${PP.ORIGENS.map(o => `<option value="${esc(o)}">${esc(o)}</option>`).join('')}</select>
                  <span class="hint">Usada quando a planilha não trouxer origem</span></div>
                <div class="f f-6"><label for="impEtapa">Etapa inicial</label>
                  <select class="inp" id="impEtapa">${PP.ETAPAS.filter(e => PP.ETAPAS_ATIVAS.includes(e.id)).map(e => `<option value="${e.id}">${esc(e.nome)}</option>`).join('')}</select></div>
                <div class="f f-12"><label class="check"><input type="checkbox" id="impDedupe" checked>
                  <span>Ignorar contatos cujo telefone já existe na base</span></label></div>
              </div>
            </div>
          </div>
          <div class="card"><div class="card-hd"><div><h3>Prévia</h3><div class="sub">Primeiras 5 linhas como serão gravadas</div></div></div>
            <div class="card-bd" id="impPrevia">${previaHTML()}</div>
          </div>
        </div>
      </div>`,
    actions:[
      { txt:`Importar ${IMP.dados.length} lead(s)`, cls:'btn-primary', ic:'i-importar', act:'impConfirmar' },
      { txt:'Cancelar', act:'fechar' }
    ]
  });
}

function valorMapeado(linha, k) {
  const i = IMP.mapa[k];
  return i === undefined || i === null ? '' : (linha[i] || '').trim();
}

function previaHTML() {
  const amostra = IMP.dados.slice(0, 5);
  if (!amostra.length) return '<div class="empty-sm">Sem linhas.</div>';
  return PP.tabela({
    rows: amostra.map((l, i) => ({ id:'p' + i, l })),
    cols:[
      { h:'Nome', r:x => `<span class="strong">${esc(valorMapeado(x.l, 'nome') || '— vazio —')}</span>` },
      { h:'Telefone', r:x => `<span class="small">${esc(PP.fone(valorMapeado(x.l, 'telefone')))}</span>` },
      { h:'Cidade', r:x => `<span class="small">${esc(valorMapeado(x.l, 'cidade') || '—')}</span>` },
      { h:'Valor', cls:'num', r:x => esc(PP.money0(PP.parseMoney(valorMapeado(x.l, 'valorEstimado')))) }
    ]
  });
}

PP.on('impMapa', (d, el) => {
  IMP.mapa[d.k] = el.value === '' ? undefined : PP.n(el.value);
  const box = document.getElementById('impPrevia');
  if (box) box.innerHTML = previaHTML();
});

PP.on('impConfirmar', async (d, el) => {
  const box = el.closest('.modal-box');
  const vendedorId = box.querySelector('#impVend').value;
  const origemPadrao = box.querySelector('#impOrigem').value;
  const etapa = box.querySelector('#impEtapa').value;
  const dedupe = box.querySelector('#impDedupe').checked;

  if (IMP.mapa.nome === undefined) return PP.toast('A coluna de nome é obrigatória', 'err');

  const existentes = new Set(PP.all('leads').map(l => PP.digitos(l.telefone)).filter(Boolean));
  const piscinas = PP.where('produtos', p => p.categoria === 'Piscina');
  let criados = 0, pulados = 0, semNome = 0;

  IMP.dados.forEach(linha => {
    const nome = valorMapeado(linha, 'nome');
    if (!nome) { semNome++; return; }
    const tel = valorMapeado(linha, 'telefone');
    const dig = PP.digitos(tel);
    if (dedupe && dig && existentes.has(dig)) { pulados++; return; }
    if (dig) existentes.add(dig);

    /* tenta casar o texto do modelo com um produto do catálogo */
    const txtModelo = PP.norm(valorMapeado(linha, 'produtoId'));
    const prod = txtModelo ? piscinas.find(p => PP.norm(p.nome).includes(txtModelo) || txtModelo.includes(PP.norm(p.nome.replace('Piscina ', '')))) : null;
    const valor = PP.parseMoney(valorMapeado(linha, 'valorEstimado'));

    PP.upsert('leads', {
      nome,
      telefone: tel,
      email: valorMapeado(linha, 'email'),
      cidade: valorMapeado(linha, 'cidade'),
      bairro: valorMapeado(linha, 'bairro'),
      origem: valorMapeado(linha, 'origem') || origemPadrao,
      produtoId: prod ? prod.id : '',
      valorEstimado: valor || (prod ? PP.n(prod.preco) : 0),
      etapa, vendedorId,
      obs: valorMapeado(linha, 'obs'),
      proximoContato: PP.addDias(PP.hoje(), 1),
      ultimoContato: '',
      criadoEm: PP.agora(),
      interacoes: [{ data:PP.agora(), tipo:'Sistema', texto:'Lead importado de planilha.', autor:PP.usuario().nome }]
    });
    criados++;
  });

  PP.closeTop();
  IMP = null;
  PP.toast(`${criados} lead(s) importado(s)`, 'ok');
  if (pulados || semNome) {
    PP.modal({
      title:'Importação concluída', size:'sm',
      body:`<dl class="dl">
        <dt>Importados</dt><dd><b style="color:var(--ok)">${criados}</b></dd>
        ${pulados ? `<dt>Duplicados</dt><dd>${pulados} <span class="faint small">(telefone já existia)</span></dd>` : ''}
        ${semNome ? `<dt>Ignorados</dt><dd>${semNome} <span class="faint small">(linha sem nome)</span></dd>` : ''}
      </dl>`,
      actions:[{ txt:'Ver no funil', cls:'btn-primary', act:'alertaIr', data:{ a:'nav', v:'funil' } }, { txt:'Fechar', act:'fechar' }]
    });
  }
  PP.render();
});

/* ============================== CLIENTES ============================== */

const fCli = { q:'' };

PP.view('clientes', {
  titulo: 'Clientes',
  sub: () => `${PP.clientesVisiveis().length} clientes${PP.ehGestor() ? ' na base' : ' seus'}`,
  render() {
    let rows = PP.clientesVisiveis().slice();
    if (fCli.q) {
      const q = PP.norm(fCli.q);
      rows = rows.filter(c => PP.norm(c.nome).includes(q) || PP.digitos(c.telefone).includes(PP.digitos(fCli.q)) ||
        PP.norm(c.cidade || '').includes(q) || PP.digitos(c.doc).includes(PP.digitos(fCli.q)));
    }

    const comp = rows.map(c => {
      const peds = PP.where('pedidos', p => p.clienteId === c.id && p.status !== 'cancelado');
      return { id:c.id, c, peds, total:PP.soma(peds, PP.pedidoTotal) };
    });
    const faturamento = PP.soma(comp, 'total');
    const pag = PP.paginar('clientes', comp);

    return `
      <div class="kpis mb">
        ${PP.kpi({ cls:'k-teal', lbl:'Clientes', val:String(comp.length) })}
        ${PP.kpi({ lbl:'Faturamento acumulado', val:PP.money0(faturamento), sm:true })}
        ${PP.kpi({ lbl:'Ticket médio', val:PP.money0(comp.length ? faturamento / Math.max(PP.soma(comp, x => x.peds.length), 1) : 0), sm:true })}
        ${PP.kpi({ cls:'k-ocre', lbl:'Recompra', val:String(comp.filter(x => x.peds.length > 1).length), foot:'clientes com 2+ pedidos' })}
      </div>

      <div class="toolbar">
        <div class="mini-search">
          <svg class="ic"><use href="#i-busca"/></svg>
          <input class="inp" type="search" placeholder="Nome, documento, telefone ou cidade" value="${esc(fCli.q)}" data-inp="buscaCli" aria-label="Buscar clientes">
        </div>
        <div class="row-end row">
          <button class="btn" data-act="exportarClientes"><svg class="ic"><use href="#i-down"/></svg>CSV</button>
          <button class="btn btn-primary" data-act="novoCliente"><svg class="ic"><use href="#i-plus"/></svg>Novo cliente</button>
        </div>
      </div>

      <div class="card">
        ${comp.length ? PP.tabela({
          act:'abrirCliente', rows:pag.linhas, idKey:'id',
          cols:[
            { h:'Cliente', r:x => `<div class="strong">${esc(x.c.nome)}</div><span class="mini">${esc(x.c.doc ? PP.doc(x.c.doc) : x.c.tipo === 'PJ' ? 'CNPJ não informado' : 'CPF não informado')}</span>` },
            { h:'Contato', r:x => `<span class="small">${esc(PP.fone(x.c.telefone))}</span><span class="mini">${esc(x.c.email || '')}</span>` },
            { h:'Cidade', r:x => `<span class="small">${esc([x.c.cidade, x.c.uf].filter(Boolean).join('/') || '—')}</span>` },
            { h:'Pedidos', cls:'num', r:x => String(x.peds.length) },
            { h:'Total comprado', cls:'num', r:x => `<b>${esc(PP.money0(x.total))}</b>` },
            { h:'Cliente desde', cls:'num', r:x => `<span class="small">${esc(PP.dt(String(x.c.criadoEm).slice(0, 10)))}</span>` }
          ]
        }) + pag.html : PP.vazio('Nenhum cliente ainda', 'Clientes são criados automaticamente quando um lead é marcado como ganho.', { act:'novoCliente', txt:'Cadastrar cliente' })}
      </div>`;
  }
});

PP.on('buscaCli', PP.debounce((d, el) => { fCli.q = el.value; PP.resetPagina('clientes'); PP.render(); }, 250));

function camposCliente() {
  return [
    { k:'id', t:'hidden' },
    { k:'nome', l:'Nome / Razão social', t:'text', col:8, req:true },
    { k:'tipo', l:'Tipo', t:'select', col:4, vazio:false, opts:[{ v:'PF', l:'Pessoa física' }, { v:'PJ', l:'Pessoa jurídica' }] },
    { k:'doc', l:'CPF / CNPJ', t:'text', col:4, val:'doc', hint:'Conferimos o dígito verificador' },
    { k:'telefone', l:'Telefone', t:'tel', col:4, req:true },
    { k:'email', l:'E-mail', t:'email', col:4 },
    { sep:'Endereço de instalação' },
    { k:'cep', l:'CEP', t:'text', col:3, val:'cep' },
    { k:'endereco', l:'Logradouro e número', t:'text', col:9 },
    { k:'bairro', l:'Bairro', t:'text', col:5 },
    { k:'cidade', l:'Cidade', t:'text', col:5 },
    { k:'uf', l:'UF', t:'text', col:2, val:'uf' },
    { k:'obs', l:'Observações', t:'textarea', col:12, rows:2, ph:'Acesso para máquina, restrições do condomínio…' }
  ];
}

PP.on('novoCliente', () => abrirFormCliente(null));
PP.on('editarCliente', d => { PP.closeTop(); abrirFormCliente(PP.cli(d.id)); });

function abrirFormCliente(c) {
  const novo = !c;
  PP.modal({
    title: novo ? 'Novo cliente' : 'Editar cliente', size:'lg',
    body: `<form data-sub="salvarCliente" id="formCli">${PP.form(camposCliente(), c || { tipo:'PF', uf:'PR' })}</form>`,
    actions:[{ txt:'Salvar', cls:'btn-primary', act:'salvarClienteBtn' }, { txt:'Cancelar', act:'fechar' }]
  });
}
PP.on('salvarClienteBtn', (d, el) => salvarCliente(el.closest('.modal-box').querySelector('#formCli')));
PP.on('salvarCliente', (d, el) => salvarCliente(el));
function salvarCliente(form) {
  const { ok, data } = PP.lerForm(form);
  if (!ok) return;
  if (!data.id) data.criadoEm = PP.agora();
  PP.upsert('clientes', data);
  PP.closeTop(); PP.toast('Cliente salvo', 'ok'); PP.render();
}

PP.on('abrirCliente', d => abrirCliente(d.id));

function abrirCliente(id) {
  const c = PP.cli(id);
  if (!c) return PP.toast('Cliente não encontrado', 'err');
  const peds = PP.where('pedidos', p => p.clienteId === id);
  const orcs = PP.where('orcamentos', o => o.clienteId === id);
  const obras = PP.where('obras', o => o.clienteId === id);
  const fin = PP.where('financeiro', f => f.clienteId === id && f.tipo === 'receber');
  const aberto = PP.soma(fin.filter(f => f.status === 'aberto'), 'valor');
  const pago = PP.soma(fin.filter(f => f.status === 'pago'), 'valor');

  const body = `
    <div class="kpis mb">
      ${PP.kpi({ cls:'k-teal', lbl:'Total comprado', val:PP.money0(PP.soma(peds.filter(p => p.status !== 'cancelado'), PP.pedidoTotal)), sm:true })}
      ${PP.kpi({ cls:'k-ok', lbl:'Já pago', val:PP.money0(pago), sm:true })}
      ${PP.kpi({ cls: aberto ? 'k-warn' : '', lbl:'Em aberto', val:PP.money0(aberto), sm:true })}
    </div>

    <div class="card mb"><div class="card-bd">
      <dl class="dl">
        <dt>${c.tipo === 'PJ' ? 'CNPJ' : 'CPF'}</dt><dd>${esc(c.doc ? PP.doc(c.doc) : '—')}</dd>
        <dt>Telefone</dt><dd>${esc(PP.fone(c.telefone))}</dd>
        <dt>E-mail</dt><dd>${esc(c.email || '—')}</dd>
        <dt>Endereço</dt><dd>${esc([c.endereco, c.bairro].filter(Boolean).join(' — ') || '—')}</dd>
        <dt>Cidade</dt><dd>${esc([c.cidade, c.uf].filter(Boolean).join('/') || '—')}${c.cep ? ' · CEP ' + esc(PP.cep(c.cep)) : ''}</dd>
        <dt>Cliente desde</dt><dd>${esc(PP.dt(String(c.criadoEm).slice(0, 10)))}</dd>
      </dl>
      ${c.obs ? `<div class="sep"></div><div class="small muted">${esc(c.obs)}</div>` : ''}
    </div></div>

    <div class="card mb">
      <div class="card-hd"><div><h3>Pedidos</h3></div></div>
      ${peds.length ? PP.tabela({ act:'abrirPedido', rows:peds, cols:[
        { h:'Nº', r:p => `<b>#${p.numero}</b><span class="mini">${esc(PP.dt(p.data))}</span>` },
        { h:'Status', r:p => PP.badge(PP.statusPedidoNome(p.status), PP.statusPedidoCls(p.status)) },
        { h:'Total', cls:'num', r:p => `<b>${esc(PP.money(PP.pedidoTotal(p)))}</b>` }
      ]}) : '<div class="empty-sm">Nenhum pedido.</div>'}
    </div>

    <div class="card mb">
      <div class="card-hd"><div><h3>Orçamentos</h3></div></div>
      ${orcs.length ? PP.tabela({ act:'abrirOrc', rows:orcs, cols:[
        { h:'Nº', r:o => `<b>#${o.numero}</b><span class="mini">${esc(PP.dt(o.data))}</span>` },
        { h:'Status', r:o => PP.badge(PP.STATUS_ORC[o.status].nome, PP.STATUS_ORC[o.status].cls) },
        { h:'Total', cls:'num', r:o => esc(PP.money(PP.orcTotal(o))) }
      ]}) : '<div class="empty-sm">Nenhum orçamento.</div>'}
    </div>

    <div class="card mb">
      <div class="card-hd"><div><h3>Obras</h3></div></div>
      ${obras.length ? PP.tabela({ act:'abrirObra', rows:obras, cols:[
        { h:'Endereço', r:o => `<span class="small">${esc(PP.trunc(o.endereco || '—', 34))}</span>` },
        { h:'Status', r:o => PP.badge(PP.STATUS_OBRA[o.status].nome, PP.STATUS_OBRA[o.status].cls) },
        { h:'Agendada', cls:'num', r:o => esc(PP.dt(o.dataAgendada)) }
      ]}) : '<div class="empty-sm">Nenhuma obra.</div>'}
    </div>

    <div class="card">
      <div class="card-hd"><div><h3>Financeiro</h3><div class="sub">Lançamentos a receber</div></div></div>
      ${fin.length ? PP.tabela({ rows:PP.sortBy(fin, 'vencimento'), cols:[
        { h:'Descrição', r:f => `<span class="small">${esc(f.descricao)}</span>` },
        { h:'Vencimento', r:f => `<span class="small ${f.status === 'aberto' && f.vencimento < PP.hoje() ? 'b' : ''}" style="${f.status === 'aberto' && f.vencimento < PP.hoje() ? 'color:var(--dang)' : ''}">${esc(PP.dt(f.vencimento))}</span>` },
        { h:'Status', r:f => PP.badge(f.status === 'pago' ? 'Pago' : 'Aberto', f.status === 'pago' ? 'b-ok' : (f.vencimento < PP.hoje() ? 'b-dang' : 'b-warn')) },
        { h:'Valor', cls:'num', r:f => esc(PP.money(f.valor)) }
      ]}) : '<div class="empty-sm">Nenhum lançamento.</div>'}
    </div>`;

  PP.drawer({
    title:c.nome, sub:`${PP.fone(c.telefone)}${c.cidade ? ' · ' + c.cidade : ''}`, body, wide:true,
    actions:[
      { txt:'WhatsApp', cls:'btn-ok', ic:'i-wpp', act:'waCliente', data:{ id:c.id } },
      { txt:'Novo orçamento', cls:'btn-teal', ic:'i-orc', act:'orcDoCliente', data:{ id:c.id } },
      { txt:'Contrato de manutenção', ic:'i-contrato', act:'contratoDoCliente', data:{ id:c.id } },
      { txt:'Abrir chamado', ic:'i-suporte', act:'chamadoDoCliente', data:{ id:c.id } },
      { txt:'Editar', ic:'i-edit', act:'editarCliente', data:{ id:c.id } },
      PP.ehGestor() ? { txt:'Excluir', act:'excluirCliente', data:{ id:c.id } } : null
    ].filter(Boolean)
  });
}
PP.abrirCliente = abrirCliente;

PP.on('excluirCliente', async d => {
  const c = PP.cli(d.id);
  if (!await PP.confirmarExclusao('cliente', d.id, c.nome)) return;
  PP.desvincular('cliente', d.id);
  PP.remove('clientes', d.id);
  PP.closeAll(); PP.toast('Cliente excluído'); PP.render();
});

PP.on('exportarClientes', () => {
  const linhas = [['Nome','Tipo','Documento','Telefone','E-mail','CEP','Endereço','Bairro','Cidade','UF','Pedidos','Total comprado','Cliente desde']];
  PP.all('clientes').forEach(c => {
    const peds = PP.where('pedidos', p => p.clienteId === c.id && p.status !== 'cancelado');
    linhas.push([c.nome, c.tipo, c.doc, c.telefone, c.email || '', c.cep || '', c.endereco || '', c.bairro || '', c.cidade || '', c.uf || '',
      peds.length, PP.dec(PP.soma(peds, PP.pedidoTotal)), PP.dt(String(c.criadoEm).slice(0, 10))]);
  });
  PP.baixar(`clientes-${PP.hoje()}.csv`, PP.csv(linhas), 'text/csv;charset=utf-8');
  PP.toast('CSV exportado', 'ok');
});

/* ============================== EQUIPE DE VENDAS ============================== */

PP.view('vendedores', {
  titulo: 'Equipe de vendas',
  sub: () => `${PP.where('vendedores', v => v.ativo).length} vendedores ativos · metas e desempenho do mês`,
  render() {
    const mk = PP.mesKey(PP.hoje());
    const metas = PP.sortBy(PP.metasDoMes(mk), 'realizado', 'desc');
    const equipes = PP.all('equipes');

    const porEquipe = equipes.map(eq => {
      const ms = metas.filter(m => m.v.equipeId === eq.id);
      return { eq, realizado:PP.soma(ms, 'realizado'), meta:PP.soma(ms, 'meta'), qtd:PP.soma(ms, 'qtd') };
    });

    const linhas = PP.all('vendedores').map(v => {
      const m = metas.find(x => x.v.id === v.id) || { realizado:0, meta:PP.n(v.meta), qtd:0, pc:0 };
      const leadsAtivos = PP.where('leads', l => l.vendedorId === v.id && PP.ETAPAS_ATIVAS.includes(l.etapa));
      const ganhos = PP.where('leads', l => l.vendedorId === v.id && l.etapa === 'ganho').length;
      const perdidos = PP.where('leads', l => l.vendedorId === v.id && l.etapa === 'perdido').length;
      const conv = (ganhos + perdidos) ? ganhos / (ganhos + perdidos) * 100 : 0;
      const comis = PP.soma(PP.where('comissoes', c => c.vendedorId === v.id && c.competencia === mk), 'valor');
      return { id:v.id, v, m, leadsAtivos:leadsAtivos.length, pipeline:PP.soma(leadsAtivos, 'valorEstimado'), conv, comis };
    });

    return `
      <div class="grid g-2 mb">
        <div class="card">
          <div class="card-hd"><div><h3>Ranking do mês</h3><div class="sub">${PP.mesNomeLongo(mk)}</div></div></div>
          <div class="card-bd">
            ${metas.length ? metas.map((m, i) => `
              <div class="meta-row">
                <div class="who">
                  <span style="width:19px;font-weight:800;color:${i === 0 ? 'var(--ocre)' : 'var(--t-faint)'};font-size:13px">${i + 1}º</span>
                  <span class="av-mini">${esc(PP.iniciais(m.v.nome))}</span>
                  <span style="overflow:hidden;text-overflow:ellipsis">${esc(m.v.nome.split(' ')[0])}</span>
                </div>
                <div class="bar"><i class="${m.pc >= 100 ? 'ok' : m.pc >= 60 ? '' : m.pc >= 30 ? 'warn' : 'dang'}" style="width:${Math.min(m.pc, 100)}%"></i></div>
                <div class="pc">${esc(PP.moneyK(m.realizado))}<br><span class="tiny faint">${PP.dec(m.pc, 0)}%</span></div>
              </div>`).join('') : '<div class="empty-sm">Sem vendedores ativos.</div>'}
          </div>
        </div>
        <div class="card">
          <div class="card-hd"><div><h3>Equipes</h3><div class="sub">Realizado x meta consolidados</div></div>
            <button class="btn btn-sm" data-act="novaEquipe" style="margin-left:auto"><svg class="ic ic-sm"><use href="#i-plus"/></svg>Equipe</button>
          </div>
          <div class="card-bd">
            ${porEquipe.length ? porEquipe.map(x => `
              <div class="meta-row">
                <div class="who"><span style="overflow:hidden;text-overflow:ellipsis">${esc(x.eq.nome)}</span></div>
                <div class="bar"><i class="${x.meta && x.realizado / x.meta >= 1 ? 'ok' : 'warn'}" style="width:${Math.min(x.meta ? x.realizado / x.meta * 100 : 0, 100)}%"></i></div>
                <div class="pc">${esc(PP.moneyK(x.realizado))}<br><span class="tiny faint">de ${esc(PP.moneyK(x.meta))}</span></div>
              </div>`).join('') : '<div class="empty-sm">Nenhuma equipe cadastrada.</div>'}
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-hd">
          <div><h3>Vendedores</h3><div class="sub">Clique para editar meta, comissão e dados</div></div>
          <button class="btn btn-primary right" data-act="novoVendedor" style="margin-left:auto"><svg class="ic"><use href="#i-plus"/></svg>Novo vendedor</button>
        </div>
        ${PP.tabela({
          act:'editarVendedor', rows:linhas, idKey:'id',
          cols:[
            { h:'Vendedor', r:x => `<div class="row" style="gap:9px;flex-wrap:nowrap"><span class="av-mini">${esc(PP.iniciais(x.v.nome))}</span><div><div class="strong">${esc(x.v.nome)}</div><span class="mini">${esc(x.v.cargo || '')}${x.v.ativo ? '' : ' · INATIVO'}</span></div></div>` },
            { h:'Equipe', r:x => `<span class="small">${esc((PP.find('equipes', x.v.equipeId) || {}).nome || '—')}</span>` },
            { h:'Meta', cls:'num', r:x => esc(PP.money0(x.m.meta)) },
            { h:'Realizado', cls:'num', r:x => `<b>${esc(PP.money0(x.m.realizado))}</b><span class="mini">${PP.dec(x.m.pc, 0)}% · ${x.m.qtd} pedido(s)</span>` },
            { h:'Pipeline', cls:'num', r:x => `${esc(PP.money0(x.pipeline))}<span class="mini">${x.leadsAtivos} lead(s)</span>` },
            { h:'Conversão', cls:'num', r:x => PP.badge(PP.pct(x.conv, 0), x.conv >= 50 ? 'b-ok' : x.conv >= 30 ? 'b-warn' : 'b-dang') },
            { h:'Comissão mês', cls:'num', r:x => esc(PP.money0(x.comis)) }
          ]
        })}
      </div>

      ${PP.ehAdmin() ? `
      <div class="card mt">
        <div class="card-hd">
          <div><h3>Acessos ao sistema</h3><div class="sub">Quem entra, com qual papel e vendo o quê</div></div>
          <button class="btn btn-primary right" data-act="novoUsuario" style="margin-left:auto"><svg class="ic"><use href="#i-plus"/></svg>Novo usuário</button>
        </div>
        ${PP.tabela({
          act:'editarUsuario', rows:PP.all('usuarios'),
          cols:[
            { h:'Usuário', r:u => `<div class="row" style="gap:9px;flex-wrap:nowrap"><span class="av-mini">${esc(PP.iniciais(u.nome))}</span><div><div class="strong">${esc(u.nome)}</div><span class="mini">${esc(u.login)}</span></div></div>` },
            { h:'Papel', r:u => PP.badge(PP.PAPEIS[u.papel] ? PP.PAPEIS[u.papel].nome : u.papel, u.papel === 'admin' ? 'b-ink' : u.papel === 'gerente' ? 'b-teal' : u.papel === 'obra' ? 'b-areia' : 'b-info') },
            { h:'Enxerga', r:u => `<span class="small">${esc(PP.PAPEIS[u.papel] ? PP.PAPEIS[u.papel].desc : '')}</span>` },
            { h:'Vendedor', r:u => `<span class="small">${u.vendedorId ? esc(PP.vendNome(u.vendedorId)) : '<span class="faint">—</span>'}</span>` },
            { h:'Situação', r:u => PP.badge(u.ativo ? 'Ativo' : 'Inativo', u.ativo ? 'b-ok' : '') },
            { h:'Conta', r:u => u.vinculada ? PP.badge('Conta criada', 'b-ok') : PP.badge('Falta criar conta', 'b-warn') }
          ]
        })}
        <div class="card-ft">
          <svg class="ic ic-sm faint"><use href="#i-alerta"/></svg>
          <span class="small muted">Quem aplica a regra é o banco: cada pessoa entra com a conta dela e só recebe o que o papel permite. Cadastrar aqui não cria a conta — a pessoa cria a dela no primeiro acesso, com este mesmo e-mail.</span>
        </div>
      </div>` : ''}`;
  }
});

function camposVendedor() {
  return [
    { k:'id', t:'hidden' },
    { k:'nome', l:'Nome completo', t:'text', col:8, req:true },
    { k:'cargo', l:'Cargo', t:'text', col:4, ph:'Consultor de vendas' },
    { k:'email', l:'E-mail', t:'email', col:6 },
    { k:'fone', l:'Telefone', t:'tel', col:6 },
    { k:'equipeId', l:'Equipe', t:'select', col:6, opts:PP.all('equipes').map(e => ({ v:e.id, l:e.nome })) },
    { k:'admissao', l:'Admissão', t:'date', col:6 },
    { sep:'Metas e remuneração' },
    { k:'meta', l:'Meta mensal (R$)', t:'money', col:6, req:true, val:'naoNegativo' },
    { k:'comissaoPct', l:'Comissão (%)', t:'pct', col:6, step:0.1, val:'percentual', hint:`Padrão da empresa: ${PP.n(PP.cfg().comissaoPct)}%` },
    { k:'comissaoMetro', l:'Comissão por metro de piscina (R$)', t:'money', col:6, val:'naoNegativo',
      hint: PP.cfg().comissaoBase === 'metro'
        ? `Em uso. Vazio ou zero usa o da empresa: ${PP.money0(PP.cfg().comissaoPorMetro)}/m`
        : 'Só entra em jogo se a base da comissão virar “metro de piscina”' },
    { k:'ativo', l:'Vendedor ativo', t:'checkbox', col:12 }
  ];
}

PP.on('novoVendedor', () => abrirFormVendedor(null));
PP.on('editarVendedor', d => abrirFormVendedor(PP.vend(d.id)));

function abrirFormVendedor(v) {
  const novo = !v;
  PP.modal({
    title: novo ? 'Novo vendedor' : 'Editar vendedor', size:'lg',
    body:`<form data-sub="salvarVendedor" id="formVend">${PP.form(camposVendedor(), v || { ativo:true, meta:PP.cfg().metaPadrao, comissaoPct:PP.cfg().comissaoPct, admissao:PP.hoje() })}</form>`,
    actions:[
      { txt:'Salvar', cls:'btn-primary', act:'salvarVendedorBtn' },
      v ? { txt:'Excluir', act:'excluirVendedor', data:{ id:v.id } } : null,
      { txt:'Cancelar', act:'fechar' }
    ].filter(Boolean)
  });
}
PP.on('salvarVendedorBtn', (d, el) => salvarVendedor(el.closest('.modal-box').querySelector('#formVend')));
PP.on('salvarVendedor', (d, el) => salvarVendedor(el));
function salvarVendedor(form) {
  const { ok, data } = PP.lerForm(form);
  if (!ok) return;
  PP.upsert('vendedores', data);
  PP.closeTop(); PP.toast('Vendedor salvo', 'ok'); PP.render();
}

PP.on('excluirVendedor', async d => {
  const v = PP.vend(d.id);
  const deps = PP.dependentes('vendedor', d.id);
  /* histórico de vendas nunca some: nesse caso o caminho é desativar */
  if (deps.some(x => x.bloqueia)) {
    const ok = await PP.confirmar(
      `${v.nome} tem histórico de vendas e não pode ser apagado — isso deixaria pedidos e comissões sem responsável.\n\nDesativar tira do sistema sem perder o histórico.`,
      { title:'Desativar vendedor', okTxt:'Desativar' });
    if (!ok) return;
    v.ativo = false; PP.save('vendedores');
    PP.where('usuarios', u => u.vendedorId === d.id).forEach(u => u.ativo = false);
    PP.save('usuarios');
    PP.closeTop(); PP.toast('Vendedor e acesso desativados'); PP.render();
    return;
  }
  if (!await PP.confirmarExclusao('vendedor', d.id, v.nome)) return;
  PP.desvincular('vendedor', d.id);
  PP.remove('vendedores', d.id);
  PP.closeTop(); PP.toast('Vendedor excluído'); PP.render();
});

PP.on('novaEquipe', async () => {
  const nome = await PP.perguntar('Nome da equipe', { title:'Nova equipe' });
  if (!nome) return;
  PP.upsert('equipes', { nome, responsavel:'' });
  PP.toast('Equipe criada', 'ok'); PP.render();
});

})();
