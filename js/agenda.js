/* ==========================================================================
   PiscinaPro — agenda.js
   Calendário de obras por equipe (com detecção de conflito), cadastro de
   equipes de instalação e Ordem de Serviço imprimível para levar a campo.
   ========================================================================== */
(function () {
'use strict';
const PP = window.PP;
const esc = PP.esc;

const DIAS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
let mesAtual = null;            /* 'YYYY-MM' */
let filtroEquipe = '';

PP.equipeObra = id => PP.find('equipesObra', id);
PP.equipeObraNome = id => (PP.equipeObra(id) || {}).nome || 'Sem equipe';
PP.equipeObraCor = id => (PP.equipeObra(id) || {}).cor || '#8C9BA1';

/** Duração estimada da obra em dias úteis (usada para ocupar o calendário). */
PP.duracaoObra = o => Math.max(PP.n(o.duracaoDias) || 3, 1);

/** Dias ocupados por uma obra a partir da data agendada. */
function diasDaObra(o) {
  const out = [];
  if (!o.dataAgendada) return out;
  for (let i = 0; i < PP.duracaoObra(o); i++) out.push(PP.addDias(o.dataAgendada, i));
  return out;
}

/** Obras que ocupam um dia específico. */
function obrasNoDia(dia) {
  return PP.where('obras', o => o.status !== 'cancelada' && o.status !== 'concluida' && diasDaObra(o).includes(dia))
    .concat(PP.where('obras', o => o.status === 'concluida' && o.dataAgendada === dia));
}

/** Conflito = mesma equipe com mais de uma obra no mesmo dia. */
function conflitosNoDia(dia) {
  const porEquipe = {};
  obrasNoDia(dia).forEach(o => {
    const k = o.equipeObraId || '';
    if (!k) return;
    (porEquipe[k] = porEquipe[k] || []).push(o);
  });
  return Object.keys(porEquipe).filter(k => porEquipe[k].length > 1).map(k => ({ equipeId:k, obras:porEquipe[k] }));
}
PP.conflitosNoDia = conflitosNoDia;

/* ============================== VIEW: AGENDA ============================== */

PP.view('agenda', {
  titulo: 'Agenda de obras',
  sub: () => {
    const semAgenda = PP.where('obras', o => o.status !== 'concluida' && o.status !== 'cancelada' && !o.dataAgendada).length;
    const semEquipe = PP.where('obras', o => o.dataAgendada && o.status !== 'concluida' && o.status !== 'cancelada' && !o.equipeObraId).length;
    const partes = [];
    if (semAgenda) partes.push(`${semAgenda} obra(s) sem data`);
    if (semEquipe) partes.push(`${semEquipe} sem equipe`);
    return partes.length ? partes.join(' · ') : 'Tudo agendado e com equipe definida';
  },
  render() {
    const mk = mesAtual || PP.mesKey(PP.hoje());
    const [ano, mes] = mk.split('-').map(Number);
    const primeiro = new Date(ano, mes - 1, 1);
    const diasNoMes = new Date(ano, mes, 0).getDate();
    const inicioSemana = primeiro.getDay();

    const equipes = PP.where('equipesObra', e => e.ativo !== false);
    const pendentes = PP.where('obras', o => o.status !== 'concluida' && o.status !== 'cancelada' && !o.dataAgendada);

    /* células do calendário */
    const celulas = [];
    for (let i = 0; i < inicioSemana; i++) celulas.push(null);
    for (let d = 1; d <= diasNoMes; d++) {
      celulas.push(`${ano}-${String(mes).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    }
    while (celulas.length % 7) celulas.push(null);

    let totalConflitos = 0;
    const gridHTML = celulas.map(dia => {
      if (!dia) return '<div class="cal-cel vazio"></div>';
      let obras = obrasNoDia(dia);
      if (filtroEquipe) obras = obras.filter(o => o.equipeObraId === filtroEquipe);
      const conf = conflitosNoDia(dia);
      totalConflitos += conf.length;
      const hoje = dia === PP.hoje();
      const fds = [0, 6].includes(new Date(dia + 'T12:00:00').getDay());
      return `
        <div class="cal-cel ${hoje ? 'hoje' : ''} ${fds ? 'fds' : ''} ${conf.length ? 'conflito' : ''}"
             tabindex="0" role="button" data-act="calDia" data-d="${dia}">
          <div class="cal-num">${PP.n(dia.slice(8))}${conf.length ? '<span class="cal-alerta" title="Conflito de equipe">!</span>' : ''}</div>
          <div class="cal-itens">
            ${obras.slice(0, 3).map(o => `
              <span class="cal-obra" style="border-left-color:${PP.equipeObraCor(o.equipeObraId)};--cor:${PP.equipeObraCor(o.equipeObraId)}"
                    title="${esc(PP.cliNome(o.clienteId))} — ${esc(PP.equipeObraNome(o.equipeObraId))}">
                ${esc(PP.trunc(PP.cliNome(o.clienteId).split(' ')[0], 12))}
              </span>`).join('')}
            ${obras.length > 3 ? `<span class="cal-mais">+${obras.length - 3}</span>` : ''}
          </div>
        </div>`;
    }).join('');

    /* carga por equipe no mês */
    const cargaEquipes = equipes.map(e => {
      const obras = PP.where('obras', o => o.equipeObraId === e.id && o.dataAgendada && PP.mesKey(o.dataAgendada) === mk && o.status !== 'cancelada');
      return { e, qtd:obras.length, dias:PP.soma(obras, PP.duracaoObra) };
    });

    return `
      <div class="toolbar">
        <div class="row" style="gap:6px">
          <button class="icon-btn" data-act="calMes" data-n="-1" aria-label="Mês anterior"><svg class="ic" style="transform:rotate(180deg)"><use href="#i-seta"/></svg></button>
          <strong style="font-family:Fraunces,serif;font-size:17px;min-width:170px;text-align:center">${esc(PP.mesNomeLongo(mk))}</strong>
          <button class="icon-btn" data-act="calMes" data-n="1" aria-label="Próximo mês"><svg class="ic"><use href="#i-seta"/></svg></button>
          <button class="btn btn-sm" data-act="calMes" data-n="0">Hoje</button>
        </div>
        <div class="seg">
          <button class="${!filtroEquipe ? 'on' : ''}" data-act="calEquipe" data-e="">Todas</button>
          ${equipes.map(e => `<button class="${filtroEquipe === e.id ? 'on' : ''}" data-act="calEquipe" data-e="${esc(e.id)}">
            <span style="width:9px;height:9px;border-radius:2px;background:${esc(e.cor)};display:inline-block"></span>${esc(PP.trunc(e.nome, 14))}</button>`).join('')}
        </div>
        <div class="row-end row">
          <button class="btn" data-act="gerirEquipesObra"><svg class="ic"><use href="#i-vendedor"/></svg>Equipes</button>
        </div>
      </div>

      ${totalConflitos ? `<div class="alert a-dang mb"><svg class="ic"><use href="#i-alerta"/></svg>
        <div><b>${PP.plural(totalConflitos, 'conflito de agenda', 'conflitos de agenda')} neste mês.</b> Há equipe com mais de uma obra no mesmo dia — os dias estão marcados em vermelho.</div></div>` : ''}

      <div class="grid g-3-2">
        <div class="card">
          <div class="card-bd" style="padding:12px">
            <div class="cal-head">${DIAS.map(d => `<div>${d}</div>`).join('')}</div>
            <div class="cal-grid">${gridHTML}</div>
            <div class="legend mt">
              ${equipes.map(e => `<span><i style="background:${esc(e.cor)}"></i>${esc(e.nome)}</span>`).join('')}
            </div>
          </div>
        </div>

        <div class="stack">
          <div class="card">
            <div class="card-hd"><div><h3>Aguardando agendamento</h3><div class="sub">${pendentes.length} obra(s) sem data</div></div></div>
            <div class="card-bd">
              ${pendentes.length ? pendentes.map(o => `
                <div class="att-item" tabindex="0" role="button" style="cursor:pointer" data-act="abrirObra" data-id="${esc(o.id)}">
                  <svg class="ic"><use href="#i-obra"/></svg>
                  <div class="txt"><b>${esc(PP.trunc(PP.cliNome(o.clienteId), 24))}</b><small>${esc(o.cidade || o.endereco || '')}</small></div>
                  <button class="btn btn-sm btn-teal" data-act="agendarObra" data-id="${esc(o.id)}">Agendar</button>
                </div>`).join('') : '<div class="empty-sm">Nenhuma obra pendente. Muito bom.</div>'}
            </div>
          </div>

          <div class="card">
            <div class="card-hd"><div><h3>Carga por equipe</h3><div class="sub">${esc(PP.mesNomeLongo(mk))}</div></div></div>
            <div class="card-bd">
              ${cargaEquipes.length ? cargaEquipes.map(c => `
                <div class="att-item">
                  <span style="width:10px;height:10px;border-radius:3px;background:${esc(c.e.cor)};flex:none"></span>
                  <div class="txt"><b>${esc(c.e.nome)}</b><small>${esc(c.e.membros || '')}</small></div>
                  <div class="val">${c.qtd} obra(s)<br><span class="tiny faint">${c.dias} dias de campo</span></div>
                </div>`).join('') : '<div class="empty-sm">Nenhuma equipe cadastrada.</div>'}
            </div>
          </div>
        </div>
      </div>`;
  }
});

PP.on('calMes', d => {
  const n = PP.n(d.n);
  if (n === 0) mesAtual = PP.mesKey(PP.hoje());
  else mesAtual = PP.mesKey(PP.addMeses((mesAtual || PP.mesKey(PP.hoje())) + '-15', n));
  PP.render();
});
PP.on('calEquipe', d => { filtroEquipe = d.e; PP.render(); });

PP.on('calDia', d => {
  const dia = d.d;
  const obras = obrasNoDia(dia);
  const conf = conflitosNoDia(dia);
  PP.modal({
    title: PP.dt(dia),
    sub: obras.length ? `${PP.plural(obras.length, 'obra')} neste dia` : 'Nenhuma obra agendada',
    size:'lg',
    body: `
      ${conf.length ? `<div class="alert a-dang mb"><svg class="ic"><use href="#i-alerta"/></svg>
        <div><b>Conflito de equipe.</b> ${conf.map(c => `${esc(PP.equipeObraNome(c.equipeId))} tem ${c.obras.length} obras neste dia`).join('; ')}.</div></div>` : ''}
      ${obras.length ? `<div class="stack" style="gap:0">${obras.map(o => `
        <div class="att-item" tabindex="0" role="button" style="cursor:pointer" data-act="irObraDoCal" data-id="${esc(o.id)}">
          <span style="width:10px;height:10px;border-radius:3px;background:${PP.equipeObraCor(o.equipeObraId)};flex:none"></span>
          <div class="txt"><b>${esc(PP.cliNome(o.clienteId))}</b>
            <small>${esc(PP.equipeObraNome(o.equipeObraId))} · ${esc(o.endereco || o.cidade || '')} · ${esc(PP.STATUS_OBRA[o.status].nome)}</small></div>
          <div class="val">${PP.duracaoObra(o)}d</div>
        </div>`).join('')}</div>`
        : '<div class="empty-sm">Dia livre. Você pode agendar uma das obras pendentes por aqui.</div>'}`,
    actions:[{ txt:'Fechar', act:'fechar' }]
  });
});
PP.on('irObraDoCal', d => { PP.closeTop(); PP.abrirObra(d.id); });

/* ============================== EQUIPES DE INSTALAÇÃO ============================== */

PP.on('gerirEquipesObra', () => {
  const rows = PP.all('equipesObra');
  PP.modal({
    title:'Equipes de instalação', sub:'Quem executa as obras em campo', size:'lg',
    body:`${rows.length ? PP.tabela({
      act:'editarEquipeObra', rows,
      cols:[
        { h:'', w:'28px', r:e => `<span style="display:inline-block;width:12px;height:12px;border-radius:3px;background:${esc(e.cor)}"></span>` },
        { h:'Equipe', r:e => `<div class="strong">${esc(e.nome)}</div><span class="mini">${esc(e.membros || '')}</span>` },
        { h:'Telefone', r:e => `<span class="small">${esc(PP.fone(e.fone))}</span>` },
        { h:'Obras no mês', cls:'num', r:e => String(PP.where('obras', o => o.equipeObraId === e.id && o.dataAgendada && PP.mesKey(o.dataAgendada) === PP.mesKey(PP.hoje())).length) },
        { h:'Situação', r:e => PP.badge(e.ativo === false ? 'Inativa' : 'Ativa', e.ativo === false ? '' : 'b-ok') }
      ]
    }) : '<div class="empty-sm">Nenhuma equipe cadastrada.</div>'}`,
    actions:[{ txt:'Nova equipe', cls:'btn-primary', ic:'i-plus', act:'novaEquipeObra' }, { txt:'Fechar', act:'fechar' }]
  });
});

PP.on('novaEquipeObra', () => abrirFormEquipeObra(null));
PP.on('editarEquipeObra', d => { PP.closeTop(); abrirFormEquipeObra(PP.equipeObra(d.id)); });

function abrirFormEquipeObra(e) {
  const key = PP.uid('eo');
  PP.on(key, (d, el) => {
    const { ok, data } = PP.lerForm(el.closest('.modal-box').querySelector('#formEqObra'));
    if (!ok) return;
    PP.upsert('equipesObra', data);
    PP.closeTop(); PP.toast('Equipe salva', 'ok'); PP.render();
  });
  PP.modal({
    title: e ? e.nome : 'Nova equipe de instalação', size:'lg',
    body:`<form id="formEqObra">${PP.form([
      { k:'id', t:'hidden' },
      { k:'nome', l:'Nome da equipe', t:'text', col:7, req:true, ph:'Equipe A' },
      { k:'cor', l:'Cor no calendário', t:'select', col:5, vazio:false, opts:[
        { v:'#0E7C86', l:'Petróleo' }, { v:'#B9812F', l:'Ocre' }, { v:'#2A5D9E', l:'Azul' },
        { v:'#1E7A4B', l:'Verde' }, { v:'#A8322C', l:'Vermelho' }, { v:'#6B4E9E', l:'Roxo' } ] },
      { k:'membros', l:'Integrantes', t:'text', col:7, ph:'Jailson, Wesley e Tiago' },
      { k:'fone', l:'Telefone do responsável', t:'tel', col:5 },
      { k:'ativo', l:'Equipe ativa', t:'checkbox', col:12 }
    ], e || { ativo:true, cor:'#0E7C86' })}</form>`,
    actions:[
      { txt:'Salvar', cls:'btn-primary', act:key },
      e ? { txt:'Excluir', act:'excluirEquipeObra', data:{ id:e.id } } : null,
      { txt:'Cancelar', act:'fechar' }
    ].filter(Boolean)
  });
}

PP.on('excluirEquipeObra', async d => {
  const e = PP.equipeObra(d.id);
  if (!await PP.confirmarExclusao('equipeObra', d.id, e.nome, {
    alternativa:'Desmarque "Equipe ativa" em vez de apagar: ela sai do calendário e dos formulários, mas as obras já feitas mantêm o registro de quem executou.'
  })) return;
  PP.desvincular('equipeObra', d.id);
  PP.remove('equipesObra', d.id);
  PP.closeTop(); PP.toast('Equipe excluída'); PP.render();
});

/* ============================== ORDEM DE SERVIÇO ============================== */

PP.on('imprimirOS', d => {
  const o = PP.find('obras', d.id);
  if (!o) return;
  if (!o.numeroOS) { o.numeroOS = gerarNumeroOS(); PP.save('obras'); }
  PP.imprimir(osHTML(o), `Ordem de serviço — ${PP.cliNome(o.clienteId)}`);
});

function gerarNumeroOS() {
  const max = PP.all('obras').reduce((m, o) => Math.max(m, PP.n(o.numeroOS)), 2000);
  return max + 1;
}

function osHTML(o) {
  const cfg = PP.cfg();
  const cli = PP.cli(o.clienteId) || {};
  const ped = PP.find('pedidos', o.pedidoId);
  const orc = ped ? PP.orcDoPedido(ped) : null;
  const piscina = orc ? orc.itens.map(i => PP.prod(i.produtoId)).find(p => p && p.categoria === 'Piscina') : null;
  const s = piscina ? (piscina.specs || {}) : {};
  const itens = orc ? orc.itens.filter(i => { const p = PP.prod(i.produtoId); return !p || p.categoria !== 'Serviço'; }) : [];

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>OS ${o.numeroOS || ''}</title>
<style>
  @page{ size:A4; margin:12mm 11mm; }
  *{ box-sizing:border-box; }
  body{ font-family:'Segoe UI',Arial,sans-serif; color:#12262D; margin:0; font-size:11.5px; line-height:1.45; }
  .hd{ display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid #0B1F26; padding-bottom:10px; margin-bottom:14px; }
  .logo{ font-size:21px; font-weight:800; color:#0B1F26; }
  .logo span{ color:#0E7C86; }
  .emp{ font-size:9.5px; color:#55666D; margin-top:3px; }
  .doc{ text-align:right; }
  .doc h1{ font-size:13px; margin:0; text-transform:uppercase; letter-spacing:.09em; color:#0E7C86; }
  .doc .num{ font-size:25px; font-weight:800; line-height:1; }
  h2{ font-size:9.5px; text-transform:uppercase; letter-spacing:.11em; color:#0E7C86; margin:14px 0 6px;
      border-bottom:1px solid #E2DCD0; padding-bottom:3px; }
  .box{ border:1px solid #D3CABA; border-radius:7px; padding:9px 11px; background:#FBF9F5; }
  .cols{ display:flex; gap:11px; }
  .cols>div{ flex:1; }
  .kv{ display:flex; gap:7px; margin-bottom:2px; }
  .kv b{ min-width:66px; color:#55666D; font-weight:600; font-size:9.5px; text-transform:uppercase; }
  .destaque{ background:#0B1F26; color:#fff; border-radius:7px; padding:10px 13px; display:flex; gap:14px; align-items:center; }
  .destaque .mod{ font-size:18px; font-weight:800; }
  .destaque .med{ margin-left:auto; display:flex; gap:12px; }
  .destaque .med div{ text-align:center; }
  .destaque .med small{ display:block; font-size:8.5px; opacity:.65; text-transform:uppercase; letter-spacing:.07em; }
  .destaque .med b{ font-size:14px; }
  table{ width:100%; border-collapse:collapse; }
  th{ background:#EDE8DF; font-size:9px; text-transform:uppercase; letter-spacing:.06em; padding:5px 8px; text-align:left; color:#55666D; }
  td{ padding:5px 8px; border-bottom:1px solid #E2DCD0; }
  .chk{ display:flex; align-items:center; gap:8px; padding:4px 0; border-bottom:1px dotted #D3CABA; }
  .chk i{ width:13px; height:13px; border:1.6px solid #0B1F26; border-radius:3px; flex:none; display:inline-block; }
  .chk span{ flex:1; }
  .chk em{ font-style:normal; font-size:8.5px; color:#8C9BA1; letter-spacing:.14em; }
  .grid2{ display:grid; grid-template-columns:1fr 1fr; gap:2px 22px; }
  .linhas{ border:1px solid #D3CABA; border-radius:7px; height:74px; background:
    repeating-linear-gradient(#fff 0 23px, #E2DCD0 23px 24px); }
  .assin{ display:flex; gap:26px; margin-top:22px; }
  .assin div{ flex:1; border-top:1px solid #0B1F26; padding-top:4px; text-align:center; font-size:9px; color:#55666D; }
  .ft{ margin-top:14px; font-size:8.5px; color:#8C9BA1; text-align:center; }
  .aviso{ background:#FBEEDA; border:1px solid #EBD3A6; border-radius:7px; padding:8px 11px; font-size:10px; color:#6E4205; margin-top:8px; }
</style></head><body>

  <div class="hd">
    <div>
      <div class="logo">Piscina<span>Pro</span></div>
      <div class="emp">${esc(cfg.empresa)}${cfg.fone ? ' · ' + esc(cfg.fone) : ''}</div>
    </div>
    <div class="doc">
      <h1>Ordem de serviço</h1>
      <div class="num">${esc(o.numeroOS || '—')}</div>
      <div style="font-size:9.5px;color:#55666D">Emitida em ${esc(PP.dt(PP.hoje()))}</div>
    </div>
  </div>

  <div class="cols">
    <div class="box">
      <div class="kv"><b>Cliente</b><span><b>${esc(cli.nome || '—')}</b></span></div>
      <div class="kv"><b>Telefone</b><span>${esc(PP.fone(cli.telefone))}</span></div>
      <div class="kv"><b>Pedido</b><span>${ped ? '#' + ped.numero : '—'}</span></div>
    </div>
    <div class="box">
      <div class="kv"><b>Endereço</b><span>${esc(o.endereco || cli.endereco || '—')}</span></div>
      <div class="kv"><b>Cidade</b><span>${esc(o.cidade || cli.cidade || '—')}</span></div>
      <div class="kv"><b>Data</b><span><b>${o.dataAgendada ? esc(PP.dt(o.dataAgendada)) : 'A DEFINIR'}</b> · ${PP.duracaoObra(o)} dia(s)</span></div>
    </div>
  </div>

  ${piscina ? `
  <h2>Piscina a instalar</h2>
  <div class="destaque">
    <div>
      <div class="mod">${esc(piscina.nome)}</div>
      <div style="font-size:9.5px;opacity:.7">${esc(piscina.sku)}</div>
    </div>
    <div class="med">
      <div><small>Compr.</small><b>${PP.dec(s.compr, 2)} m</b></div>
      <div><small>Larg.</small><b>${PP.dec(s.larg, 2)} m</b></div>
      <div><small>Prof.</small><b>${PP.dec(s.prof, 2)} m</b></div>
      <div><small>Volume</small><b>${PP.dec(s.volume, 1)} mil L</b></div>
    </div>
  </div>` : ''}

  <h2>Equipe e responsabilidades</h2>
  <div class="cols">
    <div class="box">
      <div class="kv"><b>Equipe</b><span><b>${esc(PP.equipeObraNome(o.equipeObraId))}</b></span></div>
      <div class="kv"><b>Integrantes</b><span>${esc((PP.equipeObra(o.equipeObraId) || {}).membros || o.responsavel || '—')}</span></div>
    </div>
    <div class="box">
      <div class="kv"><b>Contato</b><span>${esc(PP.fone((PP.equipeObra(o.equipeObraId) || {}).fone))}</span></div>
      <div class="kv"><b>Escritório</b><span>${esc(cfg.fone || '—')}</span></div>
    </div>
  </div>

  ${itens.length ? `
  <h2>Materiais e itens a levar</h2>
  <table>
    <thead><tr><th style="width:34px">OK</th><th>Item</th><th style="width:52px">Qtd</th><th style="width:80px">Conferido por</th></tr></thead>
    <tbody>${itens.map(i => `<tr>
      <td style="text-align:center">☐</td>
      <td>${esc(i.nome)}</td>
      <td>${PP.dec(i.qtd, PP.n(i.qtd) % 1 ? 2 : 0)}</td>
      <td></td></tr>`).join('')}</tbody>
  </table>` : ''}

  <h2>Checklist de execução</h2>
  <div class="grid2">
    ${PP.CHECKLIST_OBRA.map((t, i) => `<div class="chk"><i></i><span>${esc(t)}</span><em>${(o.checklist || [])[i] ? 'FEITO' : '__/__'}</em></div>`).join('')}
  </div>

  <h2>Ocorrências da obra</h2>
  <div class="linhas"></div>

  ${o.obsOS || cli.obs ? `<div class="aviso"><b>Atenção:</b> ${esc(o.obsOS || cli.obs)}</div>` : ''}

  <div class="assin">
    <div>Responsável pela equipe</div>
    <div>${esc(cli.nome || 'Cliente')} — recebimento</div>
  </div>

  <div class="ft">${esc(cfg.empresa)} · OS ${esc(o.numeroOS || '')} · impressa em ${esc(PP.dt(PP.hoje()))} — este documento acompanha a equipe até o encerramento da obra.</div>
</body></html>`;
}
PP.osHTML = osHTML;

})();
