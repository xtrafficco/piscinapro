/* ==========================================================================
   PiscinaPro — main.js
   Inicialização, busca global, central de alertas e atalhos de teclado.
   ========================================================================== */
(function () {
'use strict';
const PP = window.PP;
const esc = PP.esc;

/* ============================== BOOT ============================== */

/* Rede de segurança: erro que escape de tudo ainda avisa em vez de sumir. */
window.addEventListener('error', ev => {
  console.error('[PP] erro não tratado', ev.error || ev.message);
  if (PP.toast) PP.toast('Algo deu errado nesta ação. Se repetir, faça um backup e recarregue a página.', 'err');
});
window.addEventListener('unhandledrejection', ev => {
  console.error('[PP] promessa rejeitada sem tratamento', ev.reason);
  if (PP.toast) PP.toast('Algo deu errado nesta ação. Se repetir, faça um backup e recarregue a página.', 'err');
});

async function boot() {
  registrarOffline();

  /* Os dados vivem no servidor: sem conexão não há o que mostrar. */
  try {
    await PP.nuvem.conectar();
  } catch (e) {
    return telaSemConexao(e.message || 'não consegui falar com o servidor');
  }

  if (new URLSearchParams(location.search).has('recuperar')) {
    if (PP.nuvem.sessao) return PP.telaRecuperarSenha();
    PP.telaLogin();
    const erro = document.getElementById('loginErro');
    erro.textContent = 'Link de redefinição inválido ou expirado. Solicite outro e-mail.';
    erro.hidden = false;
    return;
  }

  let entrou = false;
  try { entrou = await PP.restaurarSessao(); }
  catch (e) { return telaSemConexao(e.message); }

  document.getElementById('brandEmpresa').textContent = PP.cfg().empresa || 'PiscinaPro';

  if (entrou) {
    rotinasPeriodicas();
    PP.aposLogin();
    setTimeout(atualizarSinoAlertas, 60);
  } else {
    PP.telaLogin();
  }
}

/** Falha no carregamento inicial: mantém o erro real disponível para diagnóstico. */
function telaSemConexao(motivo) {
  document.querySelector('.app-shell').style.display = 'none';
  const box = document.createElement('div');
  box.className = 'login-wrap';
  box.innerHTML = `
    <div class="login-grid">
      <div class="login-card" style="margin:auto">
        <h2>Não foi possível carregar</h2>
        <p style="font-size:13.5px;line-height:1.65;color:var(--muted)">
          Não foi possível confirmar sua sessão ou carregar os dados do servidor.</p>
        <p class="small muted">Detalhe técnico: ${PP.esc(motivo || '—')}</p>
        <button class="btn btn-teal btn-block" data-act="recarregarPagina">Tentar de novo</button>
      </div>
    </div>`;
  document.body.appendChild(box);
}

PP.on('recarregarPagina', () => location.reload());

/* ============================== OFFLINE ============================== */

/* Registra o service worker para o sistema abrir sem rede — o vendedor em
   campo não fica na mão. Só funciona em http(s); aberto por file:// é ignorado.
   Se houver versão nova esperando, avisa em vez de trocar por baixo do usuário. */
function registrarOffline() {
  if (!('serviceWorker' in navigator)) return;
  if (location.protocol !== 'http:' && location.protocol !== 'https:') return;
  navigator.serviceWorker.register('sw.js').then(reg => {
    reg.addEventListener('updatefound', () => {
      const novo = reg.installing;
      if (!novo) return;
      novo.addEventListener('statechange', () => {
        if (novo.state === 'installed' && navigator.serviceWorker.controller) {
          PP.toast('Nova versão disponível — recarregue a página para aplicar.', 'warn');
        }
      });
    });
  }).catch(e => console.warn('[PP] service worker não registrado', e));
}

/* Manutenção de dados que não pertence ao render: roda no boot e de hora em hora. */
function rotinasPeriodicas() {
  try { PP.marcarExpirados(); } catch (e) { console.error('[PP] rotina de expiração', e); }
}
setInterval(() => { if (PP.usuario && PP.usuario()) { rotinasPeriodicas(); PP.atualizarSinoAlertas(); } }, 3600000);

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();

/* ============================== BUSCA GLOBAL ============================== */

const inpBusca = () => document.getElementById('globalSearch');
const drop = () => document.getElementById('searchDrop');

const LIMITE_BUSCA = 12;

/* Percorre as coleções parando assim que junta resultados suficientes, em vez
   de varrer a base inteira a cada tecla digitada. */
function buscar(q) {
  const n = PP.norm(q);
  const dig = PP.digitos(q);
  const num = q.trim();
  const hits = [];

  const varrer = (view, lista, casa, montar) => {
    if (hits.length >= LIMITE_BUSCA || !PP.podeAcessar(view)) return;
    const arr = lista();
    for (let i = 0; i < arr.length; i++) {
      if (hits.length >= LIMITE_BUSCA) return;
      if (casa(arr[i])) hits.push(montar(arr[i]));
    }
  };

  varrer('leads', () => PP.escopo(PP.all('leads')),
    l => PP.norm(l.nome).includes(n) || (dig && PP.digitos(l.telefone).includes(dig)),
    l => ({ ic:'i-leads', titulo:l.nome, sub:`Lead · ${PP.etapa(l.etapa).nome} · ${PP.money0(l.valorEstimado)}`, act:'abrirLead', id:l.id }));

  varrer('clientes', () => PP.clientesVisiveis(),
    c => PP.norm(c.nome).includes(n) || (dig && (PP.digitos(c.telefone).includes(dig) || PP.digitos(c.doc).includes(dig))),
    c => ({ ic:'i-cliente', titulo:c.nome, sub:`Cliente · ${c.cidade || ''}`, act:'abrirCliente', id:c.id }));

  varrer('orcamentos', () => PP.escopo(PP.all('orcamentos')),
    o => String(o.numero).includes(num) || PP.norm(PP.nomeDoOrc(o)).includes(n),
    o => ({ ic:'i-orc', titulo:`Orçamento #${o.numero}`, sub:`${PP.nomeDoOrc(o)} · ${PP.money0(PP.orcTotal(o))}`, act:'abrirOrc', id:o.id }));

  varrer('pedidos', () => PP.escopo(PP.all('pedidos')),
    p => String(p.numero).includes(num) || PP.norm(PP.cliNome(p.clienteId)).includes(n),
    p => ({ ic:'i-pedido', titulo:`Pedido #${p.numero}`, sub:`${PP.cliNome(p.clienteId)} · ${PP.money0(PP.pedidoTotal(p))}`, act:'abrirPedido', id:p.id }));

  varrer('chamados', () => PP.all('chamados'),
    c => String(c.numero).includes(num) || PP.norm(PP.cliNome(c.clienteId)).includes(n) || PP.norm(c.descricao || '').includes(n),
    c => ({ ic:'i-suporte', titulo:`Chamado #${c.numero}`, sub:`${PP.cliNome(c.clienteId)} · ${c.tipo}`, act:'abrirChamado', id:c.id }));

  varrer('contratos', () => PP.escopo(PP.all('contratos')),
    c => String(c.numero).includes(num) || PP.norm(PP.cliNome(c.clienteId)).includes(n),
    c => ({ ic:'i-contrato', titulo:`Contrato #${c.numero}`, sub:`${PP.cliNome(c.clienteId)} · ${PP.money0(c.valor)}`, act:'abrirContrato', id:c.id }));

  varrer('produtos', () => PP.all('produtos'),
    p => PP.norm(p.nome).includes(n) || PP.norm(p.sku).includes(n),
    p => ({ ic:'i-produto', titulo:p.nome, sub:`Produto · ${p.sku} · ${PP.money0(p.preco)}`, act:'editarProduto', id:p.id }));

  return hits;
}

async function mostrarBusca() {
  const inp = inpBusca();
  const d = drop();
  if (!inp || !d) return;
  const q = inp.value.trim();
  if (q.length < 2) { d.hidden = true; d.innerHTML = ''; return; }
  try { await PP.garantirDados(); }
  catch(e) { d.hidden=false; d.textContent=e.message; return; }
  if (inp.value.trim()!==q) return;
  const hits = buscar(q);
  d.hidden = false;
  d.innerHTML = hits.length
    ? hits.map(h => `<button class="search-hit" data-act="irBusca" data-a="${esc(h.act)}" data-id="${esc(h.id)}">
        <svg class="ic"><use href="#${h.ic}"/></svg>
        <span style="min-width:0"><b>${esc(h.titulo)}</b><small>${esc(h.sub)}</small></span>
      </button>`).join('')
    : `<div class="search-empty">Nada encontrado para “${esc(q)}”.</div>`;
}

const buscaDebounced = PP.debounce(mostrarBusca, 200);
document.addEventListener('input', e => { if (e.target.id === 'globalSearch') buscaDebounced(); });
document.addEventListener('click', e => {
  if (!e.target.closest('.search-wrap')) { const d = drop(); if (d) d.hidden = true; }
});

/* PP.run lê o dataset do elemento — aqui basta um stub. */
PP.on('irBusca', d => {
  drop().hidden = true;
  inpBusca().value = '';
  PP.run(d.a, { dataset:{ id:d.id } });
});

/* ============================== CENTRAL DE ALERTAS ============================== */

/* A central de alertas varre quase o banco inteiro, e um dos passos compara
   obra contra obra para achar conflito de equipe — custo quadrático. Como isso
   roda depois de cada render, com três anos de operação a conta chegou a 333 ms
   por tela, em todas elas. O resultado é o mesmo enquanto o dado não muda:
   calcula uma vez e guarda. */
PP.registrarDerivado('alertas', ['leads','orcamentos','pedidos','obras','produtos','compras',
                                 'chamados','contratos','comissoes','financeiro','config']);

function coletarAlertas() {
  const u = PP.usuario() || {};
  return PP.cacheDe('alertas', u.id + '|' + PP.hoje(), montarAlertas);
}

function montarAlertas() {
  const out = [];
  const gestor = PP.ehGestor();

  /* --- comercial --- */
  if (PP.podeAcessar('leads')) PP.escopo(PP.where('leads', PP.leadAtrasado)).forEach(l => out.push({
    nivel:'warn', ic:'i-relogio', titulo:`Follow-up vencido — ${l.nome}`,
    sub:`${PP.etapa(l.etapa).nome} · último contato ${PP.tempoRelativo(l.ultimoContato || l.criadoEm)}`,
    act:'abrirLead', id:l.id
  }));

  if (gestor) PP.where('orcamentos', o => o.status === 'aprovacao').forEach(o => out.push({
    nivel:'dang', ic:'i-orc', titulo:`Desconto aguardando sua aprovação — #${o.numero}`,
    sub:`${PP.nomeDoOrc(o)} · ${PP.dec(o.descontoPct, 1)}% de desconto · ${PP.money0(PP.orcTotal(o))}`,
    act:'abrirOrc', id:o.id
  }));

  if (PP.podeAcessar('orcamentos')) PP.escopo(PP.where('orcamentos', o =>
    (o.status === 'enviado' || o.status === 'negociando') && o.validade < PP.hoje())).forEach(o => out.push({
    nivel:'warn', ic:'i-orc', titulo:`Proposta #${o.numero} com validade vencida`,
    sub:`${PP.nomeDoOrc(o)} · ${PP.money0(PP.orcTotal(o))}`, act:'abrirOrc', id:o.id
  }));

  /* --- financeiro --- */
  if (PP.podeAcessar('financeiro')) PP.where('financeiro', f => f.status === 'aberto' && f.vencimento < PP.hoje()).forEach(f => out.push({
    nivel:'dang', ic:'i-fin', titulo:`${f.tipo === 'receber' ? 'Recebimento' : 'Pagamento'} vencido — ${PP.money0(f.valor)}`,
    sub:`${f.descricao} · venceu ${PP.dt(f.vencimento)}`, act:'nav', v:'financeiro'
  }));

  /* --- obras --- */
  if (PP.podeAcessar('obras')) {
    PP.where('obras', o => o.status !== 'concluida' && o.status !== 'cancelada' && !o.dataAgendada).forEach(o => out.push({
      nivel:'warn', ic:'i-obra', titulo:`Obra sem agendamento — ${PP.cliNome(o.clienteId)}`,
      sub:o.endereco || o.cidade || '', act:'abrirObra', id:o.id
    }));
    PP.where('obras', o => o.dataAgendada && o.dataAgendada < PP.hoje() && o.status !== 'concluida'
      && o.status !== 'cancelada' && o.status !== 'acabamento').forEach(o => out.push({
      nivel:'dang', ic:'i-obra', titulo:`Obra atrasada — ${PP.cliNome(o.clienteId)}`,
      sub:`Agendada para ${PP.dt(o.dataAgendada)}`, act:'abrirObra', id:o.id
    }));
  }

  if (PP.podeAcessar('agenda')) {
    const diasComConflito = new Set();
    PP.where('obras', o => o.dataAgendada && o.status !== 'cancelada').forEach(o => {
      if (PP.conflitosNoDia(o.dataAgendada).length) diasComConflito.add(o.dataAgendada);
    });
    diasComConflito.forEach(dia => out.push({
      nivel:'dang', ic:'i-agenda', titulo:`Conflito de equipe em ${PP.dt(dia)}`,
      sub:'Uma equipe está com mais de uma obra no mesmo dia', act:'nav', v:'agenda'
    }));
  }

  /* --- estoque e compras --- */
  if (PP.podeAcessar('estoque')) PP.where('produtos', p => p.controlaEstoque && PP.disponivel(p.id) <= PP.n(p.estoqueMin)).forEach(p => {
    const disp = PP.disponivel(p.id);
    out.push({
      nivel: disp <= 0 ? 'dang' : 'warn', ic:'i-estoque',
      titulo:`Estoque ${disp <= 0 ? 'esgotado' : 'baixo'} — ${p.nome}`,
      sub:`${disp} disponível (${PP.n(p.estoque)} em casa, ${PP.reservado(p.id)} reservado) · mínimo ${PP.n(p.estoqueMin)}`,
      act:'nav', v:'estoque'
    });
  });

  if (PP.podeAcessar('compras')) PP.where('compras', c => c.status === 'enviado' && c.previsaoEntrega < PP.hoje()).forEach(c => out.push({
    nivel:'warn', ic:'i-compras', titulo:`Compra #${c.numero} atrasada`,
    sub:`${PP.fornNome(c.fornecedorId)} · previsão ${PP.dt(c.previsaoEntrega)}`, act:'abrirCompra', id:c.id
  }));

  /* --- pós-venda --- */
  if (PP.podeAcessar('chamados')) PP.where('chamados', c => c.status !== 'resolvido' && c.status !== 'cancelado'
    && PP.diasEntre(String(c.abertura).slice(0, 10), PP.hoje()) > 5).forEach(c => out.push({
    nivel:'dang', ic:'i-suporte', titulo:`Chamado #${c.numero} parado há ${PP.diasEntre(String(c.abertura).slice(0, 10), PP.hoje())} dias`,
    sub:`${PP.cliNome(c.clienteId)} · ${c.tipo}`, act:'abrirChamado', id:c.id
  }));

  if (PP.podeAcessar('contratos')) {
    const mk = PP.mesKey(PP.hoje());
    const pend = PP.where('contratos', PP.contratoPendente);
    if (pend.length) out.push({
      nivel:'warn', ic:'i-contrato', titulo:`${PP.plural(pend.length, 'contrato', 'contratos')} sem cobrança em ${PP.mesNome(mk)}`,
      sub:`${PP.money0(PP.soma(pend, PP.contratoMensalizado))} de receita recorrente a lançar`, act:'nav', v:'contratos'
    });
    PP.where('contratos', c => c.status === 'ativo' && c.fim && c.fim >= PP.hoje() && PP.diasEntre(PP.hoje(), c.fim) <= 45).forEach(c => out.push({
      nivel:'warn', ic:'i-contrato', titulo:`Contrato #${c.numero} vence em ${PP.diasEntre(PP.hoje(), c.fim)} dias`,
      sub:`${PP.cliNome(c.clienteId)} · renovação a negociar`, act:'abrirContrato', id:c.id
    }));
  }

  /* --- comissões --- */
  if (gestor) {
    const lib = PP.where('comissoes', c => c.status === 'liberada');
    if (lib.length) out.push({
      nivel:'warn', ic:'i-comissao', titulo:PP.plural(lib.length, 'comissão liberada', 'comissões liberadas'),
      sub:`${PP.money0(PP.soma(lib, 'valor'))} pronto(s) para pagamento`, act:'nav', v:'comissoes'
    });
  }

  /* --- backup --- */
  if (PP.ehAdmin()) {
    const cfg = PP.cfg();
    const dias = cfg.ultimoBackup ? PP.diasEntre(cfg.ultimoBackup, PP.hoje()) : 999;
    if (dias >= PP.n(cfg.avisoBackupDias)) out.push({
      nivel:'dang', ic:'i-down',
      titulo: cfg.ultimoBackup ? `Último backup há ${dias} dias` : 'Você nunca fez backup',
      sub:'Os dados vivem só neste navegador. Baixe uma cópia agora.', act:'exportarBackup'
    });
  }

  const ordem = { dang:0, warn:1, info:2 };
  return out.sort((a, b) => ordem[a.nivel] - ordem[b.nivel]);
}

function atualizarSinoAlertas() {
  if (!PP.usuario()) return;
  if (PP.driver.nome==='supabase' && PP.COLS.some(c=>c!=='config'&&!PP.nuvem.carregadas.has(c))) {
    const dot=document.getElementById('alertDot');
    if (dot) dot.hidden=true;
    return;
  }
  const n = coletarAlertas().filter(a => a.nivel === 'dang').length;
  const dot = document.getElementById('alertDot');
  if (dot) dot.hidden = n === 0;
}
PP.atualizarSinoAlertas = atualizarSinoAlertas;

PP.on('alertas', () => {
  const lista = coletarAlertas();
  const crit = lista.filter(a => a.nivel === 'dang').length;
  PP.modal({
    title:'Pendências',
    sub: lista.length ? `${lista.length} item(ns) precisam de atenção${crit ? ` · ${crit} crítico(s)` : ''}` : 'Tudo em dia',
    size:'lg',
    body: lista.length ? `<div class="stack" style="gap:0">${lista.map(a => `
      <div class="att-item" tabindex="0" role="button" style="cursor:pointer" data-act="alertaIr" data-a="${esc(a.act)}"${a.id ? ` data-id="${esc(a.id)}"` : ''}${a.v ? ` data-v="${esc(a.v)}"` : ''}>
        <svg class="ic" style="color:${a.nivel === 'dang' ? 'var(--dang)' : 'var(--warn)'}"><use href="#${a.ic}"/></svg>
        <div class="txt"><b>${esc(a.titulo)}</b><small>${esc(a.sub)}</small></div>
        <svg class="ic ic-sm faint"><use href="#i-seta"/></svg>
      </div>`).join('')}</div>`
      : `<div class="empty"><svg class="ic"><use href="#i-check"/></svg><h3>Nada pendente</h3><p>Nenhum follow-up vencido, conta em atraso, obra parada, chamado esquecido ou estoque abaixo do mínimo.</p></div>`
  });
});

/* fecha o painel de alertas antes de abrir o item clicado */
PP.on('alertaIr', d => {
  PP.closeTop();
  PP.run(d.a, { dataset:{ id:d.id, v:d.v } });
});

/* ============================== ATALHOS ============================== */

document.addEventListener('keydown', e => {
  const alvo = e.target;
  const digitando = alvo && (alvo.tagName === 'INPUT' || alvo.tagName === 'TEXTAREA' || alvo.tagName === 'SELECT' || alvo.isContentEditable);

  if (e.key === '/' && !digitando) {
    const i = inpBusca();
    if (i && i.offsetParent !== null) { e.preventDefault(); i.focus(); }
    return;
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    const i = inpBusca();
    if (i && i.offsetParent !== null) { e.preventDefault(); i.focus(); i.select(); }
    return;
  }
  if (e.key === 'Escape' && alvo === inpBusca()) { alvo.value = ''; drop().hidden = true; alvo.blur(); }
});

/* mantém o sino em dia após qualquer render ou navegação */
const renderOriginal = PP.render;
PP.render = async () => { await renderOriginal(); atualizarSinoAlertas(); };
window.addEventListener('hashchange', atualizarSinoAlertas);

})();
