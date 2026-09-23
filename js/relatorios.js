/* ==========================================================================
   PiscinaPro — relatorios.js
   Relatórios gerenciais e configurações do sistema (incl. backup/restauração).
   ========================================================================== */
(function () {
'use strict';
const PP = window.PP;
const esc = PP.esc;

const CORES = ['#0E7C86','#6FD3D8','#B9812F','#2A5D9E','#1E7A4B','#A8322C','#8C9BA1','#D9C7AE','#12A0A8','#A8640A'];

/* ============================== RELATÓRIOS ============================== */

const fRel = { meses:6 };

PP.view('relatorios', {
  titulo: 'Relatórios',
  sub: () => `Análise dos últimos ${fRel.meses} meses`,
  render() {
    const meses = PP.ultimosMeses(fRel.meses);
    const ini = meses[0] + '-01';
    const peds = PP.where('pedidos', p => p.status !== 'cancelado' && p.data >= ini);
    const fat = PP.soma(peds, PP.pedidoTotal);
    const custo = PP.soma(peds, PP.pedidoCusto);
    const leadsPer = PP.where('leads', l => String(l.criadoEm).slice(0, 10) >= ini);

    /* vendas por vendedor */
    const porVend = PP.where('vendedores', v => v.ativo).map(v => {
      const ps = peds.filter(p => p.vendedorId === v.id);
      return { id:v.id, v, qtd:ps.length, total:PP.soma(ps, PP.pedidoTotal),
        ticket:ps.length ? PP.soma(ps, PP.pedidoTotal) / ps.length : 0 };
    }).filter(x => x.qtd > 0);

    /* vendas por modelo de piscina */
    const modelos = {};
    peds.forEach(p => {
      const o = PP.orcDoPedido(p);
      if (!o) return;
      o.itens.forEach(i => {
        const pr = PP.prod(i.produtoId);
        if (!pr || pr.categoria !== 'Piscina') return;
        modelos[pr.nome] = modelos[pr.nome] || { nome:pr.nome, qtd:0, total:0 };
        modelos[pr.nome].qtd += PP.n(i.qtd);
        modelos[pr.nome].total += PP.n(i.qtd) * PP.n(i.preco);
      });
    });
    const rankModelos = PP.sortBy(Object.values(modelos), 'total', 'desc');

    /* origem dos leads */
    const origens = {};
    leadsPer.forEach(l => {
      const k = l.origem || 'Outro';
      origens[k] = origens[k] || { origem:k, qtd:0, ganhos:0, valor:0 };
      origens[k].qtd++;
      if (l.etapa === 'ganho') { origens[k].ganhos++; origens[k].valor += PP.n(l.valorEstimado); }
    });
    const rankOrigens = PP.sortBy(Object.values(origens), 'qtd', 'desc');

    /* funil de conversão */
    const funil = PP.ETAPAS.filter(e => e.id !== 'perdido').map(e => ({
      nome:e.nome, cor:e.cor,
      qtd:PP.where('leads', l => l.etapa === e.id).length,
      valor:PP.soma(PP.where('leads', l => l.etapa === e.id), 'valorEstimado')
    }));

    /* motivos de perda */
    const perdas = {};
    PP.where('leads', l => l.etapa === 'perdido').forEach(l => {
      const k = l.motivoPerda || 'Não informado';
      perdas[k] = perdas[k] || { label:k, valor:0, qtd:0 };
      perdas[k].valor += PP.n(l.valorEstimado);
      perdas[k].qtd++;
    });
    const listaPerdas = PP.sortBy(Object.values(perdas), 'valor', 'desc').map((p, i) => Object.assign(p, { cor:CORES[i % CORES.length] }));

    /* produtos mais vendidos (todas as categorias) */
    const prods = {};
    peds.forEach(p => {
      const o = PP.orcDoPedido(p);
      if (!o) return;
      o.itens.forEach(i => {
        prods[i.nome] = prods[i.nome] || { nome:i.nome, qtd:0, total:0, custo:0 };
        prods[i.nome].qtd += PP.n(i.qtd);
        prods[i.nome].total += PP.n(i.qtd) * PP.n(i.preco);
        prods[i.nome].custo += PP.n(i.qtd) * PP.n(i.custo);
      });
    });
    const rankProds = PP.sortBy(Object.values(prods), 'total', 'desc').slice(0, 12);

    const ganhos = leadsPer.filter(l => l.etapa === 'ganho').length;
    const perdidos = leadsPer.filter(l => l.etapa === 'perdido').length;

    return `
      <div class="toolbar">
        <div class="seg">
          ${[3, 6, 12].map(n => `<button class="${fRel.meses === n ? 'on' : ''}" data-act="relPeriodo" data-n="${n}">${n} meses</button>`).join('')}
        </div>
        <div class="row-end row">
          <button class="btn" data-act="relatorioPDF"><svg class="ic"><use href="#i-print"/></svg>Relatório em PDF</button>
        </div>
      </div>

      <div class="kpis mb">
        ${PP.kpi({ cls:'k-teal', lbl:'Faturamento', val:PP.money0(fat), sm:true, foot:`${peds.length} pedido(s)` })}
        ${PP.kpi({ cls:'k-ok', lbl:'Margem bruta', val:PP.money0(fat - custo), sm:true, foot:PP.pct(fat ? (fat - custo) / fat * 100 : 0, 1) })}
        ${PP.kpi({ lbl:'Ticket médio', val:PP.money0(peds.length ? fat / peds.length : 0), sm:true })}
        ${PP.kpi({ cls:'k-ocre', lbl:'Leads gerados', val:String(leadsPer.length) })}
        ${PP.kpi({ lbl:'Conversão', val:PP.pct((ganhos + perdidos) ? ganhos / (ganhos + perdidos) * 100 : 0, 0), foot:`${ganhos} ganhos · ${perdidos} perdidos` })}
        ${PP.kpi({ cls:'k-warn', lbl:'Custo por lead ganho', val:PP.money0(ganhos ? fat * 0.04 / ganhos : 0), sm:true, foot:'estimativa (4% em marketing)' })}
      </div>

      <div class="card mb">
        <div class="card-hd"><div><h3>Faturamento e margem por mês</h3></div>
          <div class="right legend"><span><i style="background:#0E7C86"></i>Faturamento</span><span><i style="background:#6FD3D8"></i>Margem bruta</span></div>
        </div>
        <div class="card-bd">
          ${PP.chart.barras({
            labels:meses.map(PP.mesNome), height:240,
            series:[
              { nome:'Faturamento', cor:'#0E7C86', values:meses.map(m => PP.vendasDoMes(m)) },
              { nome:'Margem bruta', cor:'#6FD3D8', values:meses.map(m => {
                const ps = PP.pedidosDoMes(m);
                return PP.soma(ps, PP.pedidoTotal) - PP.soma(ps, PP.pedidoCusto);
              }) }
            ]
          })}
        </div>
      </div>

      <div class="grid g-2 mb">
        <div class="card">
          <div class="card-hd"><div><h3>Desempenho por vendedor</h3></div></div>
          ${porVend.length ? PP.tabela({ rows:PP.sortBy(porVend, 'total', 'desc'), cols:[
            { h:'Vendedor', r:x => `<div class="row" style="gap:8px;flex-wrap:nowrap"><span class="av-mini">${esc(PP.iniciais(x.v.nome))}</span><span class="strong">${esc(x.v.nome)}</span></div>` },
            { h:'Pedidos', cls:'num', r:x => String(x.qtd) },
            { h:'Ticket médio', cls:'num', r:x => esc(PP.money0(x.ticket)) },
            { h:'Faturamento', cls:'num', r:x => `<b>${esc(PP.money0(x.total))}</b>` },
            { h:'Share', cls:'num', r:x => PP.badge(PP.dec(fat ? x.total / fat * 100 : 0, 0) + '%', 'b-teal') }
          ]}) : '<div class="empty-sm">Sem vendas no período.</div>'}
        </div>

        <div class="card">
          <div class="card-hd"><div><h3>Funil de conversão</h3><div class="sub">Situação atual da base</div></div></div>
          <div class="card-bd">
            ${PP.chart.funil({ items:funil })}
            <div class="sep"></div>
            <div class="stage-list">
              ${(() => {
                const topo = funil[0] ? funil[0].qtd : 0;
                const total = PP.all('leads').length;
                const g = PP.where('leads', l => l.etapa === 'ganho').length;
                return `<div class="stage-line"><span class="nm">Base total</span><span></span><span class="vv">${total} leads</span></div>
                        <div class="stage-line"><span class="nm">Ganhos</span><span></span><span class="vv">${g} (${PP.dec(total ? g / total * 100 : 0, 1)}%)</span></div>`;
              })()}
            </div>
          </div>
        </div>
      </div>

      <div class="grid g-2 mb">
        <div class="card">
          <div class="card-hd"><div><h3>Origem dos leads</h3><div class="sub">Volume x conversão no período</div></div></div>
          ${rankOrigens.length ? PP.tabela({ rows:rankOrigens, cols:[
            { h:'Origem', r:o => `<span class="strong">${esc(o.origem)}</span>` },
            { h:'Leads', cls:'num', r:o => String(o.qtd) },
            { h:'Ganhos', cls:'num', r:o => String(o.ganhos) },
            { h:'Conversão', cls:'num', r:o => { const c = o.qtd ? o.ganhos / o.qtd * 100 : 0; return PP.badge(PP.dec(c, 0) + '%', c >= 40 ? 'b-ok' : c >= 20 ? 'b-warn' : 'b-dang'); } },
            { h:'Valor ganho', cls:'num', r:o => esc(PP.money0(o.valor)) }
          ]}) : '<div class="empty-sm">Sem leads no período.</div>'}
        </div>

        <div class="card">
          <div class="card-hd"><div><h3>Por que perdemos</h3><div class="sub">Valor em leads perdidos, por motivo</div></div></div>
          <div class="card-bd">${listaPerdas.length ? PP.chart.rosca({ items:listaPerdas, centroLbl:'Perdido' }) : '<div class="empty-sm">Nenhum lead perdido registrado.</div>'}</div>
        </div>
      </div>

      <div class="grid g-2">
        <div class="card">
          <div class="card-hd"><div><h3>Modelos mais vendidos</h3></div></div>
          ${rankModelos.length ? PP.tabela({ rows:rankModelos, cols:[
            { h:'Modelo', r:m => `<span class="strong">${esc(m.nome)}</span>` },
            { h:'Unidades', cls:'num', r:m => String(m.qtd) },
            { h:'Faturamento', cls:'num', r:m => `<b>${esc(PP.money0(m.total))}</b>` }
          ]}) : '<div class="empty-sm">Sem vendas no período.</div>'}
        </div>

        <div class="card">
          <div class="card-hd"><div><h3>Itens mais faturados</h3><div class="sub">Inclui adicionais e serviços</div></div></div>
          ${rankProds.length ? PP.tabela({ rows:rankProds, cols:[
            { h:'Item', r:p => `<span class="small">${esc(p.nome)}</span>` },
            { h:'Qtd', cls:'num', r:p => PP.dec(p.qtd, p.qtd % 1 ? 1 : 0) },
            { h:'Margem', cls:'num', r:p => { const m = p.total ? (p.total - p.custo) / p.total * 100 : 0; return `<span class="small">${PP.dec(m, 0)}%</span>`; } },
            { h:'Total', cls:'num', r:p => `<b>${esc(PP.money0(p.total))}</b>` }
          ]}) : '<div class="empty-sm">Sem dados.</div>'}
        </div>
      </div>`;
  }
});

PP.on('relPeriodo', d => { fRel.meses = PP.n(d.n); PP.render(); });

PP.on('relatorioPDF', () => {
  const cfg = PP.cfg();
  const meses = PP.ultimosMeses(fRel.meses);
  const ini = meses[0] + '-01';
  const peds = PP.where('pedidos', p => p.status !== 'cancelado' && p.data >= ini);
  const fat = PP.soma(peds, PP.pedidoTotal);
  const custo = PP.soma(peds, PP.pedidoCusto);
  const metas = PP.metasDoMes(PP.mesKey(PP.hoje()));

  const linhasMes = meses.map(m => {
    const ps = PP.pedidosDoMes(m);
    const t = PP.soma(ps, PP.pedidoTotal);
    const c = PP.soma(ps, PP.pedidoCusto);
    return `<tr><td>${esc(PP.mesNomeLongo(m))}</td><td class="r">${ps.length}</td><td class="r">${esc(PP.money(t))}</td>
      <td class="r">${esc(PP.money(t - c))}</td><td class="r">${PP.dec(t ? (t - c) / t * 100 : 0, 1)}%</td></tr>`;
  }).join('');

  const linhasVend = PP.sortBy(metas, 'realizado', 'desc').map(m =>
    `<tr><td>${esc(m.v.nome)}</td><td class="r">${m.qtd}</td><td class="r">${esc(PP.money(m.meta))}</td>
     <td class="r">${esc(PP.money(m.realizado))}</td><td class="r">${PP.dec(m.pc, 0)}%</td></tr>`).join('');

  const doc = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Relatório gerencial</title>
  <style>
    @page{ size:A4; margin:15mm 13mm; }
    body{ font-family:'Segoe UI',Arial,sans-serif; color:#12262D; font-size:12px; margin:0; }
    h1{ font-size:20px; color:#0B1F26; margin:0 0 3px; }
    .sub{ color:#55666D; font-size:11px; margin-bottom:18px; }
    h2{ font-size:11px; text-transform:uppercase; letter-spacing:.1em; color:#0E7C86;
        border-bottom:1px solid #E2DCD0; padding-bottom:4px; margin:20px 0 8px; }
    table{ width:100%; border-collapse:collapse; }
    th{ background:#0B1F26; color:#fff; font-size:9.5px; text-transform:uppercase; letter-spacing:.06em; padding:7px 9px; text-align:left; }
    td{ padding:7px 9px; border-bottom:1px solid #E2DCD0; }
    tr:nth-child(even) td{ background:#FBF9F5; }
    .r{ text-align:right; }
    .kpis{ display:flex; gap:9px; margin-bottom:6px; }
    .k{ flex:1; border:1px solid #E2DCD0; border-radius:8px; padding:10px; background:#FBF9F5; }
    .k small{ display:block; font-size:9px; text-transform:uppercase; letter-spacing:.07em; color:#6E7F86; }
    .k b{ font-size:16px; color:#0B1F26; }
    .ft{ margin-top:24px; padding-top:9px; border-top:1px solid #E2DCD0; font-size:9.5px; color:#6E7F86; text-align:center; }
  </style></head><body>
    <h1>Relatório gerencial</h1>
    <div class="sub">${esc(cfg.empresa)} · últimos ${fRel.meses} meses · gerado em ${esc(PP.dt(PP.hoje()))}</div>

    <div class="kpis">
      <div class="k"><small>Faturamento</small><b>${esc(PP.money(fat))}</b></div>
      <div class="k"><small>Margem bruta</small><b>${esc(PP.money(fat - custo))}</b></div>
      <div class="k"><small>Pedidos</small><b>${peds.length}</b></div>
      <div class="k"><small>Ticket médio</small><b>${esc(PP.money(peds.length ? fat / peds.length : 0))}</b></div>
    </div>

    <h2>Faturamento por mês</h2>
    <table><thead><tr><th>Mês</th><th class="r">Pedidos</th><th class="r">Faturamento</th><th class="r">Margem</th><th class="r">%</th></tr></thead>
    <tbody>${linhasMes}</tbody></table>

    <h2>Desempenho da equipe — ${esc(PP.mesNomeLongo(PP.mesKey(PP.hoje())))}</h2>
    <table><thead><tr><th>Vendedor</th><th class="r">Pedidos</th><th class="r">Meta</th><th class="r">Realizado</th><th class="r">% meta</th></tr></thead>
    <tbody>${linhasVend}</tbody></table>

    <h2>Situação do funil</h2>
    <table><thead><tr><th>Etapa</th><th class="r">Leads</th><th class="r">Valor potencial</th></tr></thead><tbody>
      ${PP.ETAPAS.map(e => {
        const ls = PP.where('leads', l => l.etapa === e.id);
        return `<tr><td>${esc(e.nome)}</td><td class="r">${ls.length}</td><td class="r">${esc(PP.money(PP.soma(ls, 'valorEstimado')))}</td></tr>`;
      }).join('')}
    </tbody></table>

    <h2>Posição financeira</h2>
    <table><thead><tr><th>Indicador</th><th class="r">Valor</th></tr></thead><tbody>
      <tr><td>A receber em aberto</td><td class="r">${esc(PP.money(PP.soma(PP.where('financeiro', f => f.tipo === 'receber' && f.status === 'aberto'), 'valor')))}</td></tr>
      <tr><td>A receber vencido</td><td class="r">${esc(PP.money(PP.soma(PP.where('financeiro', f => f.tipo === 'receber' && f.status === 'aberto' && f.vencimento < PP.hoje()), 'valor')))}</td></tr>
      <tr><td>A pagar em aberto</td><td class="r">${esc(PP.money(PP.soma(PP.where('financeiro', f => f.tipo === 'pagar' && f.status === 'aberto'), 'valor')))}</td></tr>
      <tr><td>Obras em andamento</td><td class="r">${PP.where('obras', o => o.status !== 'concluida' && o.status !== 'cancelada').length}</td></tr>
      <tr><td>Valor em estoque (custo)</td><td class="r">${esc(PP.money(PP.soma(PP.where('produtos', p => p.controlaEstoque), p => PP.n(p.estoque) * PP.n(p.custo))))}</td></tr>
    </tbody></table>

    <div class="ft">${esc(cfg.empresa)} — relatório gerado pelo PiscinaPro em ${esc(PP.dt(PP.hoje()))}</div>
  </body></html>`;
  PP.imprimir(doc, 'Relatório gerencial');
});

/* ============================== CONFIGURAÇÕES ============================== */

PP.view('config', {
  titulo: 'Configurações',
  sub: 'Dados da empresa, parâmetros comerciais e backup',
  render() {
    const c = PP.cfg();
    const registros = PP.COLS.reduce((s, col) => s + (col === 'config' ? 0 : PP.all(col).length), 0);

    return `
      <div class="grid g-2 mb">
        <div class="card">
          <div class="card-hd"><div><h3>Dados da empresa</h3><div class="sub">Aparecem nas propostas e relatórios</div></div></div>
          <div class="card-bd">
            <form id="formEmp">${PP.form([
              { k:'empresa', l:'Nome da empresa', t:'text', col:12, req:true },
              { k:'cnpj', l:'CNPJ', t:'text', col:6, val:'doc' },
              { k:'fone', l:'Telefone', t:'tel', col:6 },
              { k:'email', l:'E-mail', t:'email', col:6 },
              { k:'site', l:'Site', t:'text', col:6 },
              { k:'endereco', l:'Endereço', t:'text', col:12 }
            ], c)}</form>
          </div>
          <div class="card-ft"><button class="btn btn-primary" data-act="salvarCfgEmp"><svg class="ic"><use href="#i-check"/></svg>Salvar dados</button></div>
        </div>

        <div class="card">
          <div class="card-hd"><div><h3>Parâmetros comerciais</h3><div class="sub">Valem como padrão em novos orçamentos</div></div></div>
          <div class="card-bd">
            <form id="formPar">${PP.form([
              { k:'metaPadrao', l:'Meta mensal padrão (R$)', t:'money', col:6 },
              { k:'comissaoPct', l:'Comissão padrão (%)', t:'pct', col:6, step:0.1, val:'percentual' },
              { k:'comissaoBase', l:'Comissão calculada sobre', t:'select', col:6, vazio:false,
                opts:[{ v:'faturamento', l:'Faturamento — % do valor total da venda' },
                      { v:'margem', l:'Margem bruta — % de (venda − custo)' },
                      { v:'metro', l:'Metro de piscina — R$ fixos por metro vendido' }],
                hint:'Sobre a margem, quem dá desconto ganha menos. Vale só para vendas novas.' },
              { k:'comissaoPorMetro', l:'Comissão por metro de piscina (R$)', t:'money', col:6, val:'naoNegativo',
                hint:'Vale quando a base é “metro de piscina”: conta só o comprimento do modelo, vezes a quantidade. Adicionais, equipamentos, insumos, serviços e vendas de balcão ficam de fora.' },
              { k:'jurosMes', l:'Juros do financiamento (% a.m.)', t:'pct', col:6, step:0.01 },
              { k:'parcelasMax', l:'Parcelas máximas', t:'number', col:6, step:1, min:1 },
              { k:'validadeProposta', l:'Validade da proposta (dias)', t:'number', col:6, step:1 },
              { k:'descontoMaxPct', l:'Desconto máximo sem alçada (%)', t:'pct', col:6, step:0.5, val:'percentual' },
              { k:'exigirAprovacaoDesconto', l:'Travar proposta acima da alçada até o gerente liberar', t:'checkbox', col:12 },
              { k:'prazoInstalacaoDias', l:'Prazo de instalação (dias úteis)', t:'number', col:4, step:1 },
              { k:'garantiaCasco', l:'Garantia do casco (anos)', t:'number', col:4, step:1 },
              { k:'garantiaEquip', l:'Garantia de equipamentos (anos)', t:'number', col:4, step:1 },
              { sep:'Venda de balcão' },
              { k:'comissaoBalcaoPct', l:'Comissão do balcão (%)', t:'pct', col:4, step:0.1, val:'percentual',
                hint: c.comissaoBase === 'metro'
                  ? 'Sem efeito agora: a comissão está por metro de piscina, e o balcão não vende piscina.'
                  : 'Costuma ser menor que a de piscina' },
              { k:'descontoMaxBalcaoPct', l:'Desconto máximo no balcão (%)', t:'pct', col:4, step:1, val:'percentual' },
              { k:'balcaoExigeCliente', l:'Exigir cliente na venda de balcão', t:'checkbox', col:4 },
              { k:'ddi', l:'DDI para o WhatsApp', t:'text', col:6, ph:'55', hint:'55 = Brasil' },
              { k:'avisoBackupDias', l:'Avisar sobre backup a cada (dias)', t:'number', col:6, step:1, min:1 }
            ], c)}</form>
          </div>
          <div class="card-ft"><button class="btn btn-primary" data-act="salvarCfgPar"><svg class="ic"><use href="#i-check"/></svg>Salvar parâmetros</button></div>
        </div>
      </div>

      <div class="grid g-2 mb">
        <div class="card">
          <div class="card-hd"><div><h3>Backup &amp; restauração</h3><div class="sub">Uma cópia sua, fora do servidor</div></div></div>
          <div class="card-bd">
            ${(() => {
              const dias = c.ultimoBackup ? PP.diasEntre(c.ultimoBackup, PP.hoje()) : null;
              const atrasado = dias === null || dias >= PP.n(c.avisoBackupDias);
              return `<div class="alert ${atrasado ? 'a-dang' : 'a-ok'} mb">
                <svg class="ic"><use href="#${atrasado ? 'i-alerta' : 'i-check'}"/></svg>
                <div>${dias === null
                  ? '<b>Você nunca baixou um backup.</b> O servidor guarda tudo, mas uma cópia própria protege de engano na operação.'
                  : atrasado
                    ? `<b>Último backup há ${dias} dias</b> (${esc(PP.dt(c.ultimoBackup))}). Já passou do intervalo de ${PP.n(c.avisoBackupDias)} dias.`
                    : `<b>Backup em dia.</b> Último em ${esc(PP.dt(c.ultimoBackup))}${dias ? ` (há ${dias} dias)` : ' (hoje)'}.`}</div>
              </div>`;
            })()}
            <div class="alert a-info mb">
              <svg class="ic"><use href="#i-nuvem"/></svg>
              <div><b>Os dados ficam no servidor</b>, não neste navegador — trocar de computador ou limpar o navegador não perde nada. O backup aqui é a sua cópia própria, para guardar fora do Supabase.</div>
            </div>
            <div class="row">
              <button class="btn btn-primary" data-act="exportarBackup"><svg class="ic"><use href="#i-down"/></svg>Baixar backup (.json)</button>
              <label class="btn" style="cursor:pointer">
                <svg class="ic"><use href="#i-copia"/></svg>Restaurar backup
                <input type="file" accept="application/json,.json" style="display:none" data-chg="importarBackup">
              </label>
            </div>
            <div class="sep"></div>
            <dl class="dl">
              ${PP.COLS.map(col => `<dt>${esc(col)}</dt><dd>${Array.isArray(PP.all(col)) ? PP.all(col).length + ' registro(s)' : '1 objeto'}</dd>`).join('')}
              <dt>Total</dt><dd><b>${registros} registro(s)</b> no servidor</dd>
            </dl>
          </div>
        </div>

        <div class="card">
          <div class="card-hd"><div><h3>Numeração de documentos</h3><div class="sub">Controlada pelo servidor</div></div></div>
          <div class="card-bd">
            <div class="alert a-info mb"><svg class="ic"><use href="#i-nuvem"/></svg>
              <div class="small">Quem entrega o número é o banco, um de cada vez. Dois caixas vendendo ao mesmo tempo <b>não recebem o mesmo número</b> — por isso não dá para escolher aqui.</div></div>
            <dl class="dl">
              ${[['orcamentos','Último orçamento'], ['pedidos','Último pedido'], ['vendas','Última venda de balcão'],
                 ['compras','Última compra'], ['contratos','Último contrato'], ['chamados','Último chamado']]
                .map(([col, rot]) => {
                  const m = PP.all(col).reduce((a, r) => Math.max(a, PP.n(r.numero)), 0);
                  return `<dt>${esc(rot)}</dt><dd>${m ? '#' + m : '—'}</dd>`;
                }).join('')}
            </dl>
            <div class="sep"></div>
            <h4 style="font-size:13px;margin-bottom:8px">Zona de risco</h4>
            <p class="small muted" style="margin:0 0 12px">Apaga <b>os dados do servidor</b> e recoloca os de demonstração. Afeta a equipe inteira, não só este computador.</p>
            <button class="btn btn-dang" data-act="resetTudo"><svg class="ic"><use href="#i-lixo"/></svg>Restaurar dados de exemplo</button>
          </div>
        </div>
      </div>

      ${PP.ehAdmin() ? cardNuvem() : ''}

      <div class="card mb">
        <div class="card-hd"><div><h3>Mensagens de WhatsApp</h3>
          <div class="sub">Modelos usados nos botões de envio. Use {cliente}, {vendedor}, {empresa}, {numero}, {modelo}, {total}, {entrada}, {parcelas}, {validade}, {data}, {valor}, {vencimento}</div></div></div>
        <div class="card-bd">
          <form id="formMsg">${PP.form([
            { k:'msgPrimeiroContato', l:'Primeiro contato', t:'textarea', col:6, rows:3 },
            { k:'msgProposta', l:'Envio da proposta', t:'textarea', col:6, rows:3 },
            { k:'msgFollowUp', l:'Follow-up de proposta', t:'textarea', col:6, rows:3 },
            { k:'msgAgendamento', l:'Confirmação de instalação', t:'textarea', col:6, rows:3 },
            { k:'msgCobranca', l:'Cobrança de parcela', t:'textarea', col:12, rows:2 }
          ], c)}</form>
          <div class="alert a-info mt"><svg class="ic"><use href="#i-alerta"/></svg>
            <div class="small">O sistema nunca envia sozinho: ele abre o WhatsApp com o texto pronto e quem aperta enviar é sempre a pessoa.</div></div>
        </div>
        <div class="card-ft"><button class="btn btn-primary" data-act="salvarCfgMsg"><svg class="ic"><use href="#i-check"/></svg>Salvar mensagens</button></div>
      </div>

      <div class="card">
        <div class="card-hd"><div><h3>Etapas do funil</h3><div class="sub">Probabilidade usada para ponderar o pipeline</div></div></div>
        ${PP.tabela({ rows:PP.ETAPAS.map(e => Object.assign({}, e, { leads:PP.where('leads', l => l.etapa === e.id).length })), cols:[
          { h:'Etapa', r:e => `<span class="badge" style="background:${e.cor}1f;color:${e.cor}"><span class="dt"></span>${esc(e.nome)}</span>` },
          { h:'Probabilidade', cls:'num', r:e => PP.dec(e.prob, 0) + '%' },
          { h:'Leads agora', cls:'num', r:e => String(e.leads) },
          { h:'Valor', cls:'num', r:e => esc(PP.money0(PP.soma(PP.where('leads', l => l.etapa === e.id), 'valorEstimado'))) },
          { h:'Ponderado', cls:'num', r:e => `<b>${esc(PP.money0(PP.soma(PP.where('leads', l => l.etapa === e.id), 'valorEstimado') * e.prob / 100))}</b>` }
        ]})}
      </div>`;
  }
});

/* ============================== SERVIDOR ============================== */

function cardNuvem() {
  const N = PP.nuvem || {};
  const g = PP.gravacao || {};
  const email = N.sessao && N.sessao.user ? N.sessao.user.email : '';
  const contas = PP.all('usuarios');
  const semConta = contas.filter(u => u.ativo && !u.vinculada);

  const estado = g.estado === 'erro'
    ? { cls:'a-dang', ic:'i-alerta', txt:`<b>Falha ao gravar.</b> ${esc(g.erro)} — o sistema segue tentando. Não feche a aba.` }
    : g.estado === 'gravando'
      ? { cls:'a-info', ic:'i-nuvem', txt:'<b>Gravando…</b> alterações a caminho do servidor.' }
      : { cls:'a-ok', ic:'i-check', txt:'<b>Tudo gravado.</b> Nada pendente neste aparelho.' };

  return `
    <div class="card mb">
      <div class="card-hd">
        <div><h3>Servidor &amp; acessos</h3>
          <div class="sub">Onde os dados moram e quem entra neles</div></div>
        <div class="right">${PP.badge(N.ligada ? 'Conectado' : 'Sem sessão', N.ligada ? 'b-ok' : 'b-warn')}</div>
      </div>
      <div class="card-bd">
        <div class="alert ${estado.cls} mb"><svg class="ic"><use href="#${estado.ic}"/></svg><div>${estado.txt}</div></div>

        <dl class="dl">
          <dt>Banco</dt><dd>Supabase · Postgres <span class="faint small">(São Paulo)</span></dd>
          <dt>Sua conta</dt><dd>${esc(email || '—')}</dd>
          <dt>Neste navegador</dt><dd>nada é gravado — a cópia local existe só enquanto a aba está aberta</dd>
        </dl>

        <div class="sep"></div>
        <h4 style="font-size:13px;margin-bottom:8px">Como dar acesso a alguém</h4>
        <ol class="small muted" style="margin:0 0 12px;padding-left:18px;line-height:1.7">
          <li>Cadastre a pessoa em <b>Equipe de vendas → Usuários</b>, com o <b>e-mail dela</b>.</li>
          <li>Peça para ela abrir o sistema e clicar em <b>“Primeiro acesso — criar minha conta”</b> usando esse mesmo e-mail.</li>
          <li>Pronto: o banco liga a conta ao cadastro e passa a entregar só o que o papel dela permite.</li>
        </ol>
        ${semConta.length ? `<div class="alert a-warn"><svg class="ic"><use href="#i-alerta"/></svg>
          <div class="small"><b>${semConta.length} usuário(s) ainda sem conta própria.</b> Enquanto não criarem, não conseguem entrar.</div></div>` : ''}
      </div>
      <div class="card-ft row">
        <button class="btn" data-act="recarregarDoServidor"><svg class="ic"><use href="#i-nuvem"/></svg>Recarregar do servidor</button>
        <button class="btn btn-dang" data-act="sair"><svg class="ic"><use href="#i-sair"/></svg>Sair desta conta</button>
      </div>
    </div>`;
}

PP.on('recarregarDoServidor', async () => {
  await PP.recarregarTudo();
  PP.toast('Dados recarregados do servidor', 'ok');
  PP.render();
});

function salvarCfg(formId, msg) {
  const form = document.getElementById(formId);
  const { ok, data } = PP.lerForm(form);
  if (!ok) return;
  Object.assign(PP.cfg(), data);
  PP.save('config');
  PP.toast(msg, 'ok');
  document.getElementById('brandEmpresa').textContent = PP.cfg().empresa;
  PP.render();
}
PP.on('salvarCfgEmp', () => salvarCfg('formEmp', 'Dados da empresa salvos'));
PP.on('salvarCfgPar', () => salvarCfg('formPar', 'Parâmetros salvos'));
PP.on('salvarCfgMsg', () => salvarCfg('formMsg', 'Mensagens salvas'));

PP.on('exportarBackup', () => {
  const pacote = { _app:'PiscinaPro', _versao:PP.VERSAO_BACKUP, _data:PP.agora(), _por:(PP.usuario() || {}).nome || '' };
  PP.COLS.forEach(col => pacote[col] = PP.db.data[col]);
  PP.baixar(`piscinapro-backup-${PP.hoje()}.json`, JSON.stringify(pacote, null, 2));
  PP.cfg().ultimoBackup = PP.hoje();
  PP.save('config');
  PP.toast('Backup baixado — guarde o arquivo fora deste computador', 'ok');
  PP.atualizarSinoAlertas();
  if (PP.rotaAtual.nome === 'config') PP.render();
});

PP.on('importarBackup', (d, el) => {
  const file = el.files && el.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    let pacote;
    try { pacote = JSON.parse(reader.result); }
    catch (e) { return PP.toast('Arquivo inválido (não é JSON)', 'err'); }
    if (pacote._app !== 'PiscinaPro') return PP.toast('Esse arquivo não é um backup do PiscinaPro', 'err');

    const versao = PP.n(pacote._versao) || 1;
    const atual = PP.VERSAO_BACKUP;
    if (versao > atual) {
      el.value = '';
      return PP.toast(`Esse backup é de uma versão mais nova do sistema (v${versao}). Atualize o PiscinaPro antes de restaurar.`, 'err');
    }

    const ok = await PP.confirmar(
      `Restaurar o backup de ${PP.dtHora(pacote._data)}${pacote._por ? ' feito por ' + pacote._por : ''}?`,
      { perigo:true, okTxt:'Restaurar',
        aviso: versao < atual
          ? `Backup no formato v${versao}; o sistema hoje usa v${atual}. Os dados serão convertidos na importação. Todos os dados atuais serão substituídos.`
          : 'Todos os dados atuais serão substituídos. Isso não pode ser desfeito.' });
    if (!ok) { el.value = ''; return; }

    el.value = '';
    try {
      PP.validarBackup(pacote, versao < atual);
      PP.migrarBackup(pacote, versao);
      PP.validarBackup(pacote);
      await PP.db.confirmar();
      PP.toast('Gravando no servidor…');
      await PP.driver.substituirTudo(pacote);
      await PP.recarregarTudo();
    } catch (e) { return PP.toast('Falha ao restaurar: ' + e.message, 'err'); }
    PP.toast(versao < atual ? `Backup v${versao} restaurado e convertido` : 'Backup restaurado', 'ok');
    PP.render();
    document.getElementById('brandEmpresa').textContent = PP.cfg().empresa;
  };
  reader.readAsText(file);
});

PP.on('resetTudo', async () => {
  const ok = await PP.confirmar('Apagar TODOS os dados do servidor e recarregar a demonstração?', {
    perigo:true, okTxt:'Apagar e recarregar',
    aviso:'Isto apaga os dados da EQUIPE INTEIRA, não só deste computador: leads, orçamentos, pedidos, obras e financeiro. Baixe um backup antes se precisar deles.' });
  if (!ok) return;
  const pacote = { config: Object.assign({}, PP.CONFIG_PADRAO) };
  PP.COLS.forEach(col => { if (col !== 'config') pacote[col] = PP.seed[col] ? PP.seed[col]() : []; });
  try {
    await PP.db.confirmar();
    PP.toast('Gravando no servidor…');
    await PP.driver.substituirTudo(pacote);
    await PP.recarregarTudo();
  } catch (e) { return PP.toast('Falha ao restaurar: ' + e.message, 'err'); }
  PP.toast('Dados de exemplo recarregados no servidor', 'ok');
  PP.ir('dashboard');
  PP.render();
  document.getElementById('brandEmpresa').textContent = PP.cfg().empresa;
});

})();
