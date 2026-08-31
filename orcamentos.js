/* ============================================================
   PiscinaPro — Módulo Orçamentos & Propostas
   Depende de app.js (MODELOS, VENDEDORES, LEADS, money, esc, uid,
   toast, render, moverLead, initials, vendedorCor, dataBR...)
   ============================================================ */

/* ---------------- Especificações do catálogo ---------------- */
const MODELO_SPECS = {
  'Fiji 4,0m':     { dim: '4,00 × 2,10 m', prof: '1,20 – 1,40 m', volume: '9.000 L',  prazo: '12 dias', pessoas: '4–5' },
  'Atol 5,0m':     { dim: '5,00 × 2,60 m', prof: '1,30 – 1,50 m', volume: '14.000 L', prazo: '14 dias', pessoas: '6–7' },
  'Ibiza 6,0m':    { dim: '6,00 × 2,90 m', prof: '1,30 – 1,55 m', volume: '20.000 L', prazo: '15 dias', pessoas: '8–9' },
  'Cancún 7,0m':   { dim: '7,00 × 3,20 m', prof: '1,40 – 1,60 m', volume: '28.000 L', prazo: '18 dias', pessoas: '10–12' },
  'Maldivas 8,0m': { dim: '8,00 × 3,50 m', prof: '1,40 – 1,70 m', volume: '38.000 L', prazo: '20 dias', pessoas: '12–15' },
  'Lagoa 10m':     { dim: '10,00 × 4,00 m', prof: '1,50 – 1,80 m', volume: '55.000 L', prazo: '25 dias', pessoas: '16+' },
};
const GARANTIA = '15 anos no casco · 1 ano em equipamentos';

/* ---------------- Adicionais / opcionais ---------------- */
const ADICIONAIS = [
  { nome: 'Kit aquecimento solar',      valor: 6900 },
  { nome: 'Aquecedor bomba de calor',   valor: 12500 },
  { nome: 'Iluminação LED (jogo)',      valor: 1800 },
  { nome: 'Hidromassagem / spa',        valor: 4200 },
  { nome: 'Prainha (borda molhada)',    valor: 3500 },
  { nome: 'Cascata em inox',            valor: 2400 },
  { nome: 'Capa térmica',               valor: 1600 },
  { nome: 'Escada em inox',             valor: 1200 },
  { nome: 'Kit filtragem premium',      valor: 3900 },
  { nome: 'Automação (app)',            valor: 2900 },
  { nome: 'Deck de madeira',            valor: 480, unidade: 'm²', qtdPadrao: 15 },
  { nome: 'Borda de acabamento',        valor: 320, unidade: 'm',  qtdPadrao: 24 },
];
const ADIC_MAP = Object.fromEntries(ADICIONAIS.map(a => [a.nome, a]));

const ORC_KEY = 'piscinapro_orcamentos_v1';

/* ---------------- Utilidades ---------------- */
const money2 = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
function pmt(principal, iMesPct, n) {
  const i = iMesPct / 100;
  if (i <= 0) return principal / n;
  return principal * i / (1 - Math.pow(1 + i, -n));
}
function modeloBase(nome) {
  const m = (typeof MODELOS !== 'undefined' ? MODELOS : []).find(x => x.nome === nome);
  return m ? m.base : 0;
}

/* ---------------- Estado ---------------- */
let ORC = [];
let orcView = 'list';   // 'list' | 'builder'
let draft = null;
let seqBase = 143;

function orcLoad() {
  let raw = null;
  try { raw = localStorage.getItem(ORC_KEY); } catch (e) {}
  if (raw) { try { ORC = JSON.parse(raw); } catch (e) { ORC = orcSeed(); orcSave(); } }
  else { ORC = orcSeed(); orcSave(); }
  seqBase = 143 + ORC.length;
}
function orcSave() { try { localStorage.setItem(ORC_KEY, JSON.stringify(ORC)); } catch (e) {} }

function orcSeed() {
  const iso = d => new Date(Date.now() - d * 86400000).toISOString();
  const base = (numero, nome, tel, cidade, modelo, adic, descPct, tipo, status, dias, vend) => {
    const valorBase = modeloBase(modelo);
    const adicionais = adic.map(([n, q]) => ({ nome: n, qtd: q, valor: ADIC_MAP[n].valor }));
    return {
      id: uid(), numero, cliente: { nome, telefone: tel, cidade, email: nome.toLowerCase().replace(/[^a-z]/g, '.') + '@email.com' },
      vendedor: vend, modelo, valorBase, adicionais, descontoPct: descPct, validadeDias: 15,
      observacoes: '', pagamento: { tipo, entradaPct: 20, parcelas: 24, jurosMes: 1.99 },
      status, criadoEm: iso(dias),
    };
  };
  return [
    base('0142', 'Ricardo Bueno', '(11) 97654-2201', 'Jundiaí/SP', 'Cancún 7,0m', [['Iluminação LED (jogo)', 1], ['Capa térmica', 1]], 5, 'financiado', 'enviado', 2, 'Diego Menezes'),
    base('0141', 'André Figueira', '(15) 99310-5567', 'Sorocaba/SP', 'Maldivas 8,0m', [['Kit aquecimento solar', 1], ['Deck de madeira', 20], ['Iluminação LED (jogo)', 1]], 8, 'financiado', 'enviado', 4, 'Camila Rocha'),
    base('0140', 'Paulo Cardoso', '(11) 98890-2214', 'Campinas/SP', 'Cancún 7,0m', [['Hidromassagem / spa', 1], ['Automação (app)', 1]], 3, 'financiado', 'aprovado', 9, 'Diego Menezes'),
  ];
}

/* ---------------- Cálculos ---------------- */
function calc(o) {
  const valorBase = o.valorBase || modeloBase(o.modelo);
  const adicTotal = (o.adicionais || []).reduce((s, a) => s + a.valor * (a.qtd || 1), 0);
  const subtotal = valorBase + adicTotal;
  const desconto = subtotal * (o.descontoPct || 0) / 100;
  const total = subtotal - desconto;
  const pg = o.pagamento || { tipo: 'avista', entradaPct: 20, parcelas: 24, jurosMes: 1.99 };
  let entrada = 0, financiado = 0, parcela = 0, totalPago = total, avista = total * 0.95;
  if (pg.tipo === 'financiado') {
    entrada = total * (pg.entradaPct || 0) / 100;
    financiado = total - entrada;
    parcela = pmt(financiado, pg.jurosMes || 0, pg.parcelas || 1);
    totalPago = entrada + parcela * (pg.parcelas || 1);
  }
  return { valorBase, adicTotal, subtotal, desconto, total, entrada, financiado, parcela, totalPago, avista };
}

/* ============================================================
   RENDER — Lista de orçamentos
   ============================================================ */
function orcRenderList() {
  const abertos = ORC.filter(o => ['rascunho', 'enviado'].includes(o.status));
  const aprovados = ORC.filter(o => o.status === 'aprovado');
  const valorAbertos = abertos.reduce((s, o) => s + calc(o).total, 0);
  const valorAprov = aprovados.reduce((s, o) => s + calc(o).total, 0);
  const enviados = ORC.filter(o => ['enviado', 'aprovado', 'recusado'].includes(o.status));
  const taxa = enviados.length ? Math.round((aprovados.length / enviados.length) * 100) : 0;
  const ticket = aprovados.length ? valorAprov / aprovados.length : 0;

  const kpi = (ic, l, v, f) => `<div class="kpi"><div class="k-top">${SVG(ic)} ${l}</div><div class="k-val num">${v}</div><div class="k-foot">${f}</div></div>`;
  const kpis = `<div class="kpis">
    ${kpi('<path d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-3" stroke-linecap="round"/><rect x="8" y="2" width="8" height="4" rx="1"/>', 'Orçamentos abertos', abertos.length, `${ORC.filter(o=>o.status==='rascunho').length} rascunhos`)}
    ${kpi('<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 9.5h19" stroke-linecap="round"/>', 'Valor em propostas', moneyK(valorAbertos), `${abertos.length} aguardando`)}
    ${kpi('<path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"/>', 'Taxa de aprovação', taxa + '%', `${aprovados.length} aprovados`)}
    ${kpi('<circle cx="12" cy="12" r="9"/><path d="M12 7v10M9 9.5h4a1.5 1.5 0 0 1 0 3h-2a1.5 1.5 0 0 0 0 3h4" stroke-linecap="round"/>', 'Ticket médio', moneyK(ticket), `por proposta aprovada`)}
    ${kpi('<path d="M3 4h18M6 8h12M9 12h6M11 16h2" stroke-linecap="round"/>', 'Total emitido', ORC.length, `propostas no histórico`)}
  </div>`;

  const rows = ORC.slice().sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm)).map(o => {
    const c = calc(o);
    const stName = { rascunho: 'Rascunho', enviado: 'Enviado', aprovado: 'Aprovado', recusado: 'Recusado' }[o.status];
    return `<tr ${typeof rowA11y === 'function' ? rowA11y('Abrir orçamento ' + o.numero) : ''} onclick="Orc.editar('${o.id}')">
      <td><div class="cell-name">#${o.numero}</div><div class="cell-sub">${dataBR(o.criadoEm)}</div></td>
      <td><div class="cell-name">${esc(o.cliente.nome)}</div><div class="cell-sub">${esc(o.cliente.cidade || '')}</div></td>
      <td><span class="chip">${esc(o.modelo)}</span>${o.adicionais.length ? `<span class="cell-sub"> +${o.adicionais.length} adic.</span>` : ''}</td>
      <td class="num" style="font-weight:700;color:var(--t-strong)">${money(c.total)}</td>
      <td><span class="st st-${o.status}"><span class="bd"></span>${stName}</span></td>
      <td><div style="display:flex;align-items:center;gap:7px"><div class="avatar" style="background:${vendedorCor(o.vendedor)}">${initials(o.vendedor)}</div>${esc((o.vendedor||'').split(' ')[0])}</div></td>
      <td onclick="event.stopPropagation()">
        <div class="row-actions">
          <button class="mini-btn" title="Ver / Imprimir" onclick="Orc.imprimir('${o.id}')">${SVG('<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M6 14h12v8H6z" stroke-linejoin="round"/>')}</button>
          ${o.status === 'rascunho' ? `<button class="mini-btn" title="Marcar enviado" onclick="Orc.setStatus('${o.id}','enviado')">${SVG('<path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke-linejoin="round"/>')}</button>` : ''}
          ${['rascunho','enviado'].includes(o.status) ? `<button class="mini-btn" title="Aprovar (→ Ganho)" onclick="Orc.aprovar('${o.id}')">${SVG('<path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"/>')}</button>` : ''}
          <button class="mini-btn danger" title="Excluir" onclick="Orc.excluir('${o.id}')">${SVG('<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" stroke-linecap="round" stroke-linejoin="round"/>')}</button>
        </div>
      </td>
    </tr>`;
  }).join('');

  return `<div style="padding:24px 28px 32px">
    ${kpis}
    <div class="orc-toolbar">
      <h2>Orçamentos &amp; Propostas</h2>
      <button class="btn btn-primary btn-sm" style="margin-left:auto" onclick="Orc.novo()">${SVG('<path d="M12 5v14M5 12h14" stroke-linecap="round"/>')} Novo orçamento</button>
    </div>
    <div class="panel">
      <table class="tbl">
        <thead><tr><th>Nº / Data</th><th>Cliente</th><th>Modelo</th><th>Valor</th><th>Status</th><th>Vendedor</th><th></th></tr></thead>
        <tbody>${rows || `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--t-faint)">Nenhum orçamento ainda. Clique em “Novo orçamento”.</td></tr>`}</tbody>
      </table>
    </div>
  </div>`;
}

/* ============================================================
   RENDER — Construtor
   ============================================================ */
function orcRenderBuilder() {
  const c = calc(draft);
  const opcoesLeads = (typeof LEADS !== 'undefined' ? LEADS : [])
    .filter(l => !['ganho', 'perdido'].includes(l.etapa))
    .map(l => `<option value="${l.id}" ${draft.leadId === l.id ? 'selected' : ''}>${esc(l.nome)} · ${esc(l.telefone)}</option>`).join('');

  const modelCards = (typeof MODELOS !== 'undefined' ? MODELOS.map(m => m.nome) : Object.keys(MODELO_SPECS)).map(nome => {
    const sp = MODELO_SPECS[nome], sel = draft.modelo === nome;
    return `<div class="mcard ${sel ? 'selected' : ''}" data-nome="${esc(nome)}" onclick="Orc.pickModelo(this.dataset.nome)">
      <div class="mc-check">${SVG('<path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"/>')}</div>
      <div class="mc-visual">${SVG('<path d="M2 16c1.3 0 1.3 1 2.6 1S6 16 7.3 16s1.3 1 2.7 1 1.3-1 2.6-1 1.4 1 2.7 1 1.3-1 2.6-1M7 12V7a1 1 0 0 1 1-1M13 12V7a1 1 0 0 0-1-1" stroke-linecap="round"/>')}</div>
      <div class="mc-name">${esc(nome)}</div>
      <div class="mc-spec">${sp?.dim || 'Sob medida'} · ${sp?.volume || 'A definir'}<br>prof. ${sp?.prof || 'A definir'} · ${sp?.pessoas || 'A definir'} pessoas</div>
      <div class="mc-price">${money(modeloBase(nome))} <small>base</small></div>
    </div>`;
  }).join('');

  const adicItems = ADICIONAIS.map(a => {
    const cur = draft.adicionais.find(x => x.nome === a.nome);
    const on = !!cur;
    const qtd = cur ? cur.qtd : (a.qtdPadrao || 1);
    const unidLabel = a.unidade ? ` / ${a.unidade}` : '';
    return `<div class="adic ${on ? 'on' : ''}" data-nome="${esc(a.nome)}" onclick="Orc.toggleAdic(this.dataset.nome)">
      <div class="chk">${SVG('<path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"/>')}</div>
      <div class="a-body">
        <div class="a-name">${esc(a.nome)}</div>
        <div class="a-price">${money(a.valor)}${unidLabel}</div>
      </div>
      ${a.unidade ? `<input class="a-qty num" type="number" min="1" value="${qtd}" ${on ? '' : 'disabled'} onclick="event.stopPropagation()" oninput="Orc.setQtd(this.closest('.adic').dataset.nome, this.value)" title="Quantidade (${a.unidade})">` : ''}
    </div>`;
  }).join('');

  return `<div style="padding:24px 28px 40px">
    <div class="builder-head">
      <button class="back-btn" onclick="Orc.voltar()">${SVG('<path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round"/>')} Voltar</button>
      <div>
        <div class="bh-num">Orçamento #${draft.numero}</div>
        <div class="bh-sub">${draft.status === 'rascunho' ? 'Novo rascunho' : 'Editando'} · ${dataBR(draft.criadoEm)}</div>
      </div>
    </div>

    <div class="builder">
      <div class="builder-main">
        <!-- Cliente -->
        <div class="b-card">
          <div class="b-step"><span class="n">1</span><h3>Cliente</h3><span class="hint">puxe de um lead ou digite</span></div>
          <div class="field"><label>Selecionar lead existente</label>
            <select onchange="Orc.selecionarLead(this.value)">
              <option value="">— Cliente avulso —</option>${opcoesLeads}
            </select>
          </div>
          <div class="cli-grid">
            <div class="field" style="margin:0"><label>Nome <span class="req">*</span></label><input id="c_nome" value="${esc(draft.cliente.nome)}" oninput="Orc.setCliente('nome', this.value)" placeholder="Nome do cliente"></div>
            <div class="field" style="margin:0"><label>Telefone</label><input id="c_tel" value="${esc(draft.cliente.telefone)}" oninput="Orc.setCliente('telefone', this.value)" placeholder="(00) 00000-0000"></div>
          </div>
          <div class="cli-grid" style="margin-top:12px">
            <div class="field" style="margin:0"><label>Cidade</label><input id="c_cidade" value="${esc(draft.cliente.cidade)}" oninput="Orc.setCliente('cidade', this.value)"></div>
            <div class="field" style="margin:0"><label>Vendedor</label>
              <select onchange="Orc.setCampo('vendedor', this.value)">${(typeof VENDEDORES !== 'undefined' ? VENDEDORES : []).map(v => `<option ${draft.vendedor === v.nome ? 'selected' : ''}>${v.nome}</option>`).join('')}</select>
            </div>
          </div>
        </div>

        <!-- Modelo -->
        <div class="b-card">
          <div class="b-step"><span class="n">2</span><h3>Modelo da piscina</h3><span class="hint">escolha 1</span></div>
          <div class="model-grid">${modelCards}</div>
        </div>

        <!-- Adicionais -->
        <div class="b-card">
          <div class="b-step"><span class="n">3</span><h3>Adicionais &amp; opcionais</h3><span class="hint">clique para incluir</span></div>
          <div class="adic-grid">${adicItems}</div>
        </div>

        <!-- Condições -->
        <div class="b-card">
          <div class="b-step"><span class="n">4</span><h3>Condições comerciais</h3></div>
          <div class="cli-grid">
            <div class="field" style="margin:0"><label>Desconto (%)</label><input class="num" type="number" min="0" max="40" value="${draft.descontoPct}" oninput="Orc.setCampo('descontoPct', this.value)"></div>
            <div class="field" style="margin:0"><label>Validade (dias)</label><input class="num" type="number" min="1" value="${draft.validadeDias}" oninput="Orc.setCampo('validadeDias', this.value)"></div>
          </div>
          <div class="field full" style="margin:14px 0 0"><label>Observações da proposta</label><textarea oninput="Orc.setCampo('observacoes', this.value)" placeholder="Condições de obra, prazo, itens inclusos…">${esc(draft.observacoes)}</textarea></div>
        </div>
      </div>

      <!-- Resumo -->
      <aside class="resumo">
        <div class="resumo-card">
          <div class="resumo-top">
            <div class="rt-l">Total do orçamento</div>
            <div class="rt-total num" id="rtTotal">${money(c.total)}</div>
            <div class="rt-model" id="rtModel">${esc(draft.modelo)}</div>
          </div>
          <div class="resumo-lines" id="resumoBox">${resumoLinesHTML(c)}</div>

          <div class="pg-toggle">
            <button class="${draft.pagamento.tipo === 'avista' ? 'on' : ''}" onclick="Orc.setPagTipo('avista')">À vista</button>
            <button class="${draft.pagamento.tipo === 'financiado' ? 'on' : ''}" onclick="Orc.setPagTipo('financiado')">Financiado</button>
          </div>
          <div class="pg-panel" id="pgPanel">${pgPanelHTML(c)}</div>

          <div class="resumo-actions">
            <button class="btn btn-primary" onclick="Orc.imprimirDraft()">${SVG('<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M6 14h12v8H6z" stroke-linejoin="round"/>')} Visualizar proposta</button>
            <button class="btn btn-ghost" onclick="Orc.salvar()">${SVG('<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM7 3v5h8M7 21v-6h10v6" stroke-linejoin="round"/>')} Salvar rascunho</button>
          </div>
        </div>
      </aside>
    </div>
  </div>`;
}

function resumoLinesHTML(c) {
  return `
    <div class="rline"><span>Piscina ${esc(draft.modelo)}</span><span class="rl-v">${money(c.valorBase)}</span></div>
    ${draft.adicionais.map(a => `<div class="rline"><span style="color:var(--t-muted)">${esc(a.nome)}${a.qtd > 1 ? ` ×${a.qtd}` : ''}</span><span class="rl-v" style="font-weight:600">${money(a.valor * a.qtd)}</span></div>`).join('')}
    <div class="rline sub"><span>Subtotal</span><span class="rl-v">${money(c.subtotal)}</span></div>
    ${c.desconto > 0 ? `<div class="rline desc"><span>Desconto (${draft.descontoPct}%)</span><span class="rl-v">− ${money(c.desconto)}</span></div>` : ''}
    <div class="rline grand"><span>Total</span><span class="rl-v">${money(c.total)}</span></div>`;
}

function pgPanelHTML(c) {
  const pg = draft.pagamento;
  if (pg.tipo === 'avista') {
    return `<div class="pg-avista">
      <div class="pa-v num">${money2(c.avista)}</div>
      <div class="pa-note">≈ 5% de desconto à vista incluso</div>
      <div class="pg-result" style="margin-top:10px;background:var(--surface-2);border-color:var(--line)">
        <div class="pr-sub">Valor cheio: <b>${money(c.total)}</b> · pagamento em até 2× sem juros no cartão</div>
      </div>
    </div>`;
  }
  return `
    <div class="pg-field">
      <label>Entrada <b>${pg.entradaPct}% · ${money(c.entrada)}</b></label>
      <input type="range" min="0" max="60" step="5" value="${pg.entradaPct}" oninput="Orc.setPag('entradaPct', this.value)">
    </div>
    <div class="pg-row">
      <div><label style="font-size:11.5px;font-weight:600;color:var(--t-muted);display:block;margin-bottom:6px">Parcelas</label>
        <select onchange="Orc.setPag('parcelas', this.value)">${[12, 18, 24, 36, 48, 60].map(n => `<option value="${n}" ${pg.parcelas == n ? 'selected' : ''}>${n}×</option>`).join('')}</select>
      </div>
      <div><label style="font-size:11.5px;font-weight:600;color:var(--t-muted);display:block;margin-bottom:6px">Juros (% a.m.)</label>
        <input class="num" type="number" step="0.01" min="0" value="${pg.jurosMes}" oninput="Orc.setPag('jurosMes', this.value)">
      </div>
    </div>
    <div class="pg-result" id="pgResult">${pgResultHTML(c)}</div>`;
}
function pgResultHTML(c) {
  const pg = draft.pagamento;
  return `<div class="pr-parc num">${pg.parcelas}× de <b>${money2(c.parcela)}</b></div>
    <div class="pr-sub">Entrada ${money(c.entrada)} + financiado ${money(c.financiado)} · total ${money(c.totalPago)}</div>`;
}

/* ---------------- Atualização reativa (sem re-render total) ---------------- */
function refreshResumo() {
  const c = calc(draft);
  const box = document.getElementById('resumoBox'); if (box) box.innerHTML = resumoLinesHTML(c);
  const t = document.getElementById('rtTotal'); if (t) t.textContent = money(c.total);
  const m = document.getElementById('rtModel'); if (m) m.textContent = draft.modelo;
  if (draft.pagamento.tipo === 'financiado') {
    const r = document.getElementById('pgResult'); if (r) r.innerHTML = pgResultHTML(c);
    // atualiza rótulo da entrada
    const lbl = document.querySelector('#pgPanel .pg-field label b');
    if (lbl) lbl.textContent = `${draft.pagamento.entradaPct}% · ${money(c.entrada)}`;
  }
}
function refreshPgPanel() {
  const p = document.getElementById('pgPanel'); if (p) p.innerHTML = pgPanelHTML(calc(draft));
  document.querySelectorAll('.pg-toggle button').forEach((b, i) => b.classList.toggle('on', (i === 0) === (draft.pagamento.tipo === 'avista')));
}

/* ============================================================
   Proposta imprimível (PDF via navegador)
   ============================================================ */
function propostaHTML(o) {
  const c = calc(o);
  const pg = o.pagamento;
  const validade = new Date(new Date(o.criadoEm).getTime() + (o.validadeDias || 15) * 86400000);
  const sp = MODELO_SPECS[o.modelo] || {};
  const itens = [`<tr><td><b>Piscina ${esc(o.modelo)}</b><div class="it-sub">${sp.dim} · ${sp.volume} · prof. ${sp.prof}</div></td><td class="r">${money(c.valorBase)}</td></tr>`]
    .concat((o.adicionais || []).map(a => `<tr><td>${esc(a.nome)}${a.qtd > 1 ? ` (${a.qtd})` : ''}</td><td class="r">${money(a.valor * a.qtd)}</td></tr>`)).join('');

  const pagamentoBloco = pg.tipo === 'financiado'
    ? `<div class="pay">
         <div class="pay-big">${pg.parcelas}× de ${money2(c.parcela)}</div>
         <div class="pay-sub">Entrada de ${money(c.entrada)} + ${pg.parcelas} parcelas · juros ${String(pg.jurosMes).replace('.', ',')}% a.m. · total financiado ${money(c.totalPago)}</div>
       </div>`
    : `<div class="pay">
         <div class="pay-big">${money2(c.avista)} à vista</div>
         <div class="pay-sub">≈ 5% de desconto · ou em até 2× sem juros no cartão (${money(c.total)})</div>
       </div>`;

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Proposta ${o.numero} — ${esc(o.cliente.nome)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Manrope',system-ui,sans-serif; color:#1a3438; background:#eef4f3; padding:32px 20px; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    .sheet { max-width:760px; margin:0 auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 20px 50px -20px rgba(9,42,46,.3); }
    .head { background:linear-gradient(150deg,#0e343d,#06202a); color:#fff; padding:34px 40px; display:flex; justify-content:space-between; align-items:flex-start; }
    .brand { display:flex; align-items:center; gap:12px; }
    .bmark { width:44px; height:44px; border-radius:12px; background:linear-gradient(150deg,#2ec7bb,#0a8a89); display:grid; place-items:center; }
    .bmark svg { width:24px; height:24px; }
    .bname { font-family:'Fraunces',serif; font-size:23px; font-weight:600; }
    .bname b { color:#7fe0d6; } .bsub { font-size:10px; letter-spacing:.16em; text-transform:uppercase; color:#8fb3b1; }
    .prop-n { text-align:right; } .prop-n .l { font-size:10px; letter-spacing:.12em; text-transform:uppercase; color:#8fb3b1; }
    .prop-n .v { font-family:'Fraunces',serif; font-size:26px; font-weight:600; }
    .prop-n .d { font-size:11px; color:#8fb3b1; margin-top:2px; }
    .body { padding:32px 40px 40px; }
    .to { display:flex; justify-content:space-between; gap:20px; padding-bottom:22px; border-bottom:1px solid #dce7e5; margin-bottom:24px; }
    .to .l { font-size:10px; letter-spacing:.1em; text-transform:uppercase; color:#607b7e; font-weight:700; margin-bottom:5px; }
    .to .n { font-size:17px; font-weight:700; color:#0c2a2e; }
    .to .s { font-size:13px; color:#607b7e; margin-top:2px; }
    h2 { font-family:'Fraunces',serif; font-size:18px; font-weight:600; margin-bottom:14px; color:#0c2a2e; }
    table { width:100%; border-collapse:collapse; margin-bottom:8px; }
    td { padding:12px 0; border-bottom:1px solid #eef2f2; font-size:14px; vertical-align:top; }
    td.r { text-align:right; font-weight:700; font-variant-numeric:tabular-nums; white-space:nowrap; padding-left:20px; }
    .it-sub { font-size:11.5px; color:#8090a0; margin-top:3px; font-weight:500; }
    .totals { margin-top:10px; margin-left:auto; width:280px; }
    .tl { display:flex; justify-content:space-between; padding:6px 0; font-size:14px; }
    .tl.disc { color:#0f9d6b; } .tl.grand { border-top:2px solid #0c2a2e; margin-top:6px; padding-top:12px; }
    .tl.grand span:first-child { font-weight:700; } .tl.grand .g { font-family:'Fraunces',serif; font-size:24px; font-weight:600; }
    .pay { background:#e6f7f4; border:1px solid #7fe0d6; border-radius:14px; padding:20px 24px; margin:26px 0; text-align:center; }
    .pay-big { font-family:'Fraunces',serif; font-size:28px; font-weight:600; color:#0a6e7a; }
    .pay-sub { font-size:12.5px; color:#4a6b6e; margin-top:5px; }
    .specs { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin:18px 0 6px; }
    .spec { background:#f7faf9; border:1px solid #eef2f2; border-radius:10px; padding:11px 13px; }
    .spec .sl { font-size:10px; text-transform:uppercase; letter-spacing:.06em; color:#8090a0; font-weight:700; }
    .spec .sv { font-size:14px; font-weight:700; color:#0c2a2e; margin-top:3px; }
    .incl { font-size:12.5px; color:#4a6b6e; line-height:1.7; margin-top:6px; }
    .obs { background:#f7faf9; border-left:3px solid #12b0a6; padding:12px 16px; border-radius:0 8px 8px 0; font-size:13px; color:#3a5a5e; margin-top:14px; }
    .foot { margin-top:30px; padding-top:22px; border-top:1px solid #dce7e5; display:flex; justify-content:space-between; align-items:flex-end; }
    .sign { text-align:center; } .sign .line { width:200px; border-top:1.5px solid #0c2a2e; margin-bottom:6px; }
    .sign .sn { font-size:13px; font-weight:700; } .sign .sr { font-size:11px; color:#607b7e; }
    .val { font-size:12px; color:#607b7e; }
    .val b { color:#d4623f; }
    .toolbar { max-width:760px; margin:0 auto 16px; display:flex; gap:10px; justify-content:flex-end; }
    .tb-btn { background:#0e343d; color:#fff; border:none; padding:11px 20px; border-radius:10px; font-family:inherit; font-weight:700; font-size:13px; cursor:pointer; }
    .tb-btn.ghost { background:#fff; color:#0c2a2e; border:1px solid #dce7e5; }
    @media print { body { background:#fff; padding:0; } .sheet { box-shadow:none; border-radius:0; max-width:100%; } }
  </style></head><body>
  <div class="sheet">
    <div class="head">
      <div class="brand"><div class="bmark"><svg viewBox="0 0 24 24" fill="none"><path d="M2 17c1.6 0 1.6 1.2 3.2 1.2S6.8 17 8.4 17s1.6 1.2 3.2 1.2S13.2 17 14.8 17s1.6 1.2 3.2 1.2S19.6 17 22 17" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/><path d="M8 9V5.5A1.5 1.5 0 0 1 9.5 4M15 9V5.5A1.5 1.5 0 0 0 13.5 4" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/></svg></div>
        <div><div class="bname">Piscina<b>Pro</b></div><div class="bsub">Piscinas de Fibra</div></div></div>
      <div class="prop-n"><div class="l">Proposta comercial</div><div class="v">Nº ${o.numero}</div><div class="d">${dataBR(o.criadoEm)}</div></div>
    </div>
    <div class="body">
      <div class="to">
        <div><div class="l">Preparado para</div><div class="n">${esc(o.cliente.nome)}</div><div class="s">${esc(o.cliente.telefone || '')}${o.cliente.cidade ? ' · ' + esc(o.cliente.cidade) : ''}</div></div>
        <div style="text-align:right"><div class="l">Consultor</div><div class="n" style="font-size:15px">${esc(o.vendedor || '')}</div><div class="s">PiscinaPro Vendas</div></div>
      </div>

      <h2>Sua piscina ${esc(o.modelo)}</h2>
      <div class="specs">
        <div class="spec"><div class="sl">Dimensões</div><div class="sv">${sp.dim || '—'}</div></div>
        <div class="spec"><div class="sl">Volume</div><div class="sv">${sp.volume || '—'}</div></div>
        <div class="spec"><div class="sl">Profundidade</div><div class="sv">${sp.prof || '—'}</div></div>
        <div class="spec"><div class="sl">Instalação</div><div class="sv">${sp.prazo || '—'}</div></div>
      </div>

      <h2 style="margin-top:26px">Itens da proposta</h2>
      <table><tbody>${itens}</tbody></table>
      <div class="totals">
        <div class="tl"><span>Subtotal</span><span>${money(c.subtotal)}</span></div>
        ${c.desconto > 0 ? `<div class="tl disc"><span>Desconto (${o.descontoPct}%)</span><span>− ${money(c.desconto)}</span></div>` : ''}
        <div class="tl grand"><span>Total</span><span class="g">${money(c.total)}</span></div>
      </div>

      <h2 style="margin-top:26px">Condições de pagamento</h2>
      ${pagamentoBloco}

      <div class="incl"><b>Inclui:</b> projeto, escavação, nivelamento, assentamento do casco, kit de filtragem, instalação hidráulica e enchimento. <b>Garantia:</b> ${GARANTIA}.</div>
      ${o.observacoes ? `<div class="obs">${esc(o.observacoes)}</div>` : ''}

      <div class="foot">
        <div class="val">Proposta válida até <b>${dataBR(validade.toISOString())}</b><br>Valores sujeitos a vistoria técnica do local.</div>
        <div class="sign"><div class="line"></div><div class="sn">${esc(o.vendedor || 'PiscinaPro')}</div><div class="sr">Consultor comercial</div></div>
      </div>
    </div>
  </div>
  </body></html>`;
}

function abrirProposta(o) {
  let ov = document.getElementById('propostaOverlay');
  if (!ov) {
    ov = document.createElement('div');
    ov.id = 'propostaOverlay';
    ov.setAttribute('role', 'dialog');
    ov.setAttribute('aria-modal', 'true');
    ov.setAttribute('aria-label', 'Proposta comercial');
    ov.innerHTML = `<div class="pv-bar">
        <div class="pv-title">Proposta comercial</div>
        <button class="pv-btn ghost" onclick="Orc.fecharProposta()">Fechar</button>
        <button class="pv-btn" onclick="Orc.printProposta()">${SVG('<path d="M12 3v10m0 0l-3.5-3.5M12 13l3.5-3.5M5 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" stroke-linecap="round" stroke-linejoin="round"/>')} Imprimir / Salvar PDF</button>
      </div>
      <div class="pv-body"><iframe id="propostaFrame" title="Proposta"></iframe></div>`;
    document.body.appendChild(ov);
  }
  document.getElementById('propostaFrame').srcdoc = propostaHTML(o);
  ov.classList.add('open');
}

/* ============================================================
   Ações (window.Orc)
   ============================================================ */
function novoDraft(lead) {
  seqBase++;
  const numero = String(seqBase).padStart(4, '0');
  const vendPadrao = (typeof VENDEDORES !== 'undefined' && VENDEDORES[0]) ? VENDEDORES[0].nome : '';
  draft = {
    id: uid(), numero,
    leadId: lead ? lead.id : null,
    cliente: lead ? { nome: lead.nome, telefone: lead.telefone, cidade: lead.cidade || '', email: lead.email || '' } : { nome: '', telefone: '', cidade: '', email: '' },
    vendedor: lead ? lead.vendedor : vendPadrao,
    modelo: lead && lead.modelo ? lead.modelo : 'Ibiza 6,0m',
    adicionais: [], descontoPct: 0, validadeDias: 15, observacoes: '',
    pagamento: { tipo: 'financiado', entradaPct: 20, parcelas: 24, jurosMes: 1.99 },
    status: 'rascunho', criadoEm: new Date().toISOString(),
  };
  orcView = 'builder';
  goOrc();
}

const Orc = {
  renderView() { return orcView === 'builder' ? orcRenderBuilder() : orcRenderList(); },
  afterRender() { /* handlers são inline; nada a fazer */ },

  novo() { novoDraft(null); },
  novoDeLead(id) {
    const l = (typeof LEADS !== 'undefined' ? LEADS : []).find(x => x.id === id);
    if (typeof closeAll === 'function') closeAll();
    if (window.setView) window.setView('orcamentos', { skipRender: true });
    novoDraft(l || null);
  },
  editar(id) {
    const o = ORC.find(x => x.id === id); if (!o) return;
    draft = JSON.parse(JSON.stringify(o));
    orcView = 'builder'; goOrc();
  },
  voltar() { orcView = 'list'; draft = null; goOrc(); },

  pickModelo(nome) {
    draft.modelo = nome;
    document.querySelectorAll('.mcard').forEach(c => c.classList.toggle('selected', c.dataset.nome === nome));
    refreshResumo();
  },
  toggleAdic(nome) {
    const i = draft.adicionais.findIndex(a => a.nome === nome);
    const meta = ADIC_MAP[nome];
    if (i >= 0) draft.adicionais.splice(i, 1);
    else draft.adicionais.push({ nome, qtd: meta.qtdPadrao || 1, valor: meta.valor });
    const el = document.querySelector(`.adic[data-nome="${nome}"]`);
    if (el) { const on = i < 0; el.classList.toggle('on', on); const q = el.querySelector('.a-qty'); if (q) q.disabled = !on; }
    refreshResumo();
  },
  setQtd(nome, val) {
    const a = draft.adicionais.find(x => x.nome === nome);
    if (a) { a.qtd = Math.max(1, parseInt(val, 10) || 1); refreshResumo(); }
  },
  setCliente(k, v) { draft.cliente[k] = v; },
  setCampo(k, v) {
    if (k === 'descontoPct') v = Math.min(40, Math.max(0, parseFloat(v) || 0));
    if (k === 'validadeDias') v = Math.max(1, parseInt(v, 10) || 1);
    draft[k] = v;
    if (k === 'descontoPct') refreshResumo();
  },
  selecionarLead(id) {
    const l = (typeof LEADS !== 'undefined' ? LEADS : []).find(x => x.id === id);
    if (l) { draft.leadId = l.id; draft.cliente = { nome: l.nome, telefone: l.telefone, cidade: l.cidade || '', email: l.email || '' }; draft.vendedor = l.vendedor; if (l.modelo) draft.modelo = l.modelo; }
    else { draft.leadId = null; }
    goOrc();
  },
  setPagTipo(t) { draft.pagamento.tipo = t; refreshPgPanel(); },
  setPag(k, v) {
    draft.pagamento[k] = (k === 'jurosMes') ? (parseFloat(v) || 0) : parseInt(v, 10) || 0;
    refreshResumo();
    if (k === 'entradaPct') { const lbl = document.querySelector('#pgPanel .pg-field label b'); if (lbl) lbl.textContent = `${draft.pagamento.entradaPct}% · ${money(calc(draft).entrada)}`; }
  },

  salvar() {
    if (!draft.cliente.nome.trim()) { toast('Informe o nome do cliente', true); return; }
    upsert(); toast(`Orçamento #${draft.numero} salvo ✓`);
    orcView = 'list'; draft = null; goOrc();
  },
  imprimirDraft() {
    if (!draft.cliente.nome.trim()) { toast('Informe o nome do cliente', true); return; }
    upsert(); abrirProposta(draft);
  },
  imprimir(id) { const o = ORC.find(x => x.id === id); if (o) abrirProposta(o); },
  fecharProposta() { const ov = document.getElementById('propostaOverlay'); if (ov) ov.classList.remove('open'); },
  printProposta() { const f = document.getElementById('propostaFrame'); if (f && f.contentWindow) { f.contentWindow.focus(); f.contentWindow.print(); } },

  setStatus(id, st) {
    const o = ORC.find(x => x.id === id); if (!o) return;
    o.status = st; orcSave(); goOrc();
    toast(`Orçamento #${o.numero} → ${st}`);
  },
  aprovar(id) {
    const o = ORC.find(x => x.id === id); if (!o) return;
    o.status = 'aprovado'; orcSave();
    // move o lead vinculado para "Ganho"
    if (o.leadId && typeof LEADS !== 'undefined') {
      const l = LEADS.find(x => x.id === o.leadId);
      if (l && l.etapa !== 'ganho' && typeof moverLead === 'function') moverLead(o.leadId, 'ganho');
    }
    goOrc();
    toast(`Proposta #${o.numero} aprovada!`);
  },
  excluir(id) {
    const o = ORC.find(x => x.id === id); if (!o) return;
    ORC = ORC.filter(x => x.id !== id); orcSave(); goOrc();
    toast(`Orçamento #${o.numero} excluído`);
  },
};

function upsert() {
  draft.valorBase = modeloBase(draft.modelo);
  const i = ORC.findIndex(x => x.id === draft.id);
  const clean = JSON.parse(JSON.stringify(draft));
  if (i >= 0) ORC[i] = clean; else ORC.unshift(clean);
  orcSave();
}

/* re-render dentro da view de orçamentos */
function goOrc() {
  const el = document.getElementById('view');
  el.className = 'view no-pad';
  el.innerHTML = Orc.renderView();
}

const SVG = inner => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true" focusable="false">${inner}</svg>`;

window.Orc = Orc;
window.orcInit = orcLoad;
window.orcRenderView = () => Orc.renderView();
