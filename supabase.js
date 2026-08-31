/* ============================================================
   PiscinaPro — Camada de dados Supabase (sem build)
   -----------------------------------------------------------
   Estratégia:
   - O app continua 100% síncrono em memória (UX instantânea) e
     usa o localStorage como CACHE OFFLINE.
   - O Supabase é a fonte da verdade: ao logar, o app é
     hidratado com os dados reais do banco (escrevemos no cache
     no formato nativo do app e reusamos os loaders existentes).
   - Toda escrita passa pelo ÚNICO ponto `persist(key,value)` do
     app.js; aqui interceptamos esse seam (window.Supa.onPersist)
     e reconciliamos a tabela correspondente no Postgres
     (upsert + remoção do que sumiu).
   - RLS exige sessão `authenticated`: há um portão de login.
   ============================================================ */
(function () {
  'use strict';

  const CFG = {
    url: 'https://tczczahhibqnojlptpyx.supabase.co',
    key: 'sb_publishable_DBY4Ce1GPxTi5BwiGcSiGQ_5w3cZRs0',
    lib: 'https://esm.sh/@supabase/supabase-js@2',
  };

  let sb = null;
  const state = {
    session: null,
    hydrating: false,   // true = ignora onPersist (evita eco da hidratação)
    ready: false,       // true = cliente + sessão prontos p/ escrever
    online: false,
    maps: emptyMaps(),
    dirty: new Set(),   // chaves que falharam e precisam re-sincronizar
    timers: {},         // debounce por chave
    // Identidade
    user: null,         // usuário do Auth (id, email)
    perfil: null,       // linha de public.perfis do usuário
    // Realtime
    channel: null,
    muteUntil: 0,       // ignora ecos das nossas próprias escritas até este instante
    refreshTimer: null,
    // Follow-ups
    tarefas: [],        // linhas de public.tarefas
  };
  const STALE_DIAS = 5; // lead "parado" sem interação há N dias

  /* ------------------------------------------------------------------ utils */
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const isUuid = v => typeof v === 'string' && UUID_RE.test(v);
  const num = (v, d = 0) => { const n = Number(v); return Number.isFinite(n) ? n : d; };
  const nowISO = () => new Date().toISOString();
  const dateOnly = iso => { if (!iso) return null; const d = new Date(iso); return Number.isNaN(+d) ? null : d.toISOString().slice(0, 10); };
  const dateToISO = d => d ? new Date(`${d}T12:00:00`).toISOString() : '';
  function emptyMaps() {
    return { modeloById: {}, modeloByName: {}, vendById: {}, vendByName: {}, equipeById: {}, equipeByName: {} };
  }
  // chave de cache: usa as constantes reais do app quando existirem
  const KEYS = {
    leads: (typeof STORAGE_KEY !== 'undefined' ? STORAGE_KEY : 'piscinapro_leads_v1'),
    obras: (typeof OBRAS_KEY !== 'undefined' ? OBRAS_KEY : 'piscinapro_obras_v1'),
    fin: (typeof FIN_KEY !== 'undefined' ? FIN_KEY : 'piscinapro_financeiro_v1'),
    config: (typeof CONFIG_KEY !== 'undefined' ? CONFIG_KEY : 'piscinapro_config_v1'),
    orc: (typeof ORC_KEY !== 'undefined' ? ORC_KEY : 'piscinapro_orcamentos_v1'),
  };
  function writeCache(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* cache best-effort */ } }
  function log(...a) { console.log('%c[Supa]', 'color:#0ea5a4', ...a); }
  function err(...a) { console.error('[Supa]', ...a); }

  /* ------------------------------------------------------------------ client */
  async function ensureClient() {
    if (sb) return sb;
    const mod = await import(CFG.lib);
    sb = mod.createClient(CFG.url, CFG.key, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    });
    return sb;
  }

  /* ------------------------------------------------------------------ boot */
  async function boot() {
    injectStyles();
    mountPill();
    mountBell();
    renderBell(); // sino já funciona offline (leads parados vêm do cache)
    try {
      await ensureClient();
    } catch (e) {
      err('Falha ao carregar a biblioteca do Supabase (offline?).', e);
      setPill('offline', 'Offline — usando cache local');
      return;
    }
    let session = null;
    try { ({ data: { session } } = await sb.auth.getSession()); } catch (e) { err(e); }
    sb.auth.onAuthStateChange((_evt, s) => {
      state.session = s || null;
      state.ready = !!s;
      if (s) hideLogin();
    });
    if (session) {
      state.session = session; state.ready = true;
      hideLogin();
      await afterLogin();
    } else {
      showLogin();
    }
  }

  async function afterLogin() {
    setPill('syncing', 'Sincronizando…');
    try {
      await loadIdentity();
      await hydrate();
      state.online = true;
      setPill('online', 'Online · Supabase');
      subscribeRealtime();
      renderIdentity();
      renderBell();
      // reprocessa o que ficou pendente enquanto estava offline
      if (state.dirty.size) { const ks = [...state.dirty]; state.dirty.clear(); ks.forEach(k => scheduleSync(k, 0)); }
    } catch (e) {
      err('Falha na hidratação:', e);
      setPill('error', 'Erro ao sincronizar — cache local ativo');
    }
  }

  /* ------------------------------------------------------------------ identidade */
  async function loadIdentity() {
    const { data: { user } } = await sb.auth.getUser();
    state.user = user || null;
    if (!user) return;
    // garante um perfil para o usuário (papel padrão "consultor")
    const { data: perfil } = await sb.from('perfis').select('*').eq('id', user.id).maybeSingle();
    if (perfil) {
      state.perfil = perfil;
    } else {
      const nome = (user.email || '').split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      const { data: novo } = await sb.from('perfis').insert({ id: user.id, nome }).select('*').maybeSingle();
      state.perfil = novo || { id: user.id, nome, vendedor_id: null, papel: 'consultor' };
    }
  }

  function meuVendedorNome() {
    if (state.perfil && state.perfil.vendedor_id) return state.maps.vendById[state.perfil.vendedor_id] || '';
    return '';
  }
  function displayName() {
    return (state.perfil && state.perfil.nome) || (state.user && state.user.email) || 'Usuário';
  }
  function initialsOf(nome) {
    const p = (nome || '?').trim().split(/\s+/);
    return ((p[0] && p[0][0]) || '' + (p[1] && p[1][0] || '')).toUpperCase().slice(0, 2) || 'U';
  }

  function renderIdentity() {
    const box = document.querySelector('.side-user');
    if (!box) return;
    const nm = box.querySelector('.nm');
    const rl = box.querySelector('.rl');
    const av = box.querySelector('.avatar');
    const nome = displayName();
    const vend = meuVendedorNome();
    if (nm) nm.textContent = nome;
    if (rl) rl.textContent = vend ? `Vendedor · ${vend}` : (state.perfil?.papel || 'Consultor');
    if (av) av.textContent = initialsOf(nome);
    // seletor "sou o vendedor" (liga o usuário a um vendedor -> habilita "meus leads")
    if (!box.querySelector('.side-vend') && typeof VENDEDORES !== 'undefined') {
      const sel = document.createElement('select');
      sel.className = 'side-vend';
      sel.title = 'Vincular meu usuário a um vendedor';
      sel.innerHTML = '<option value="">— sou o vendedor… —</option>' +
        VENDEDORES.map(v => `<option value="${v.nome}">${v.nome}</option>`).join('');
      sel.value = vend || '';
      sel.addEventListener('click', e => e.stopPropagation());
      sel.addEventListener('change', () => vincularVendedor(sel.value));
      const inner = box.querySelector('div:not(.avatar)');
      if (inner) inner.appendChild(sel);
    }
  }

  async function vincularVendedor(nome) {
    if (!state.user) return;
    const vid = nome ? (state.maps.vendByName[nome] || null) : null;
    state.perfil = { ...(state.perfil || {}), vendedor_id: vid };
    try {
      await sb.from('perfis').update({ vendedor_id: vid }).eq('id', state.user.id);
      renderIdentity();
      if (typeof toast === 'function') toast(nome ? `Vinculado a ${nome} — filtro "meus leads" disponível` : 'Vínculo removido');
      renderBell();
    } catch (e) { err('vincularVendedor', e); }
  }

  /* ------------------------------------------------------------------ hidratação (banco -> memória) */
  async function fetchAll() {
    const q = (t, sel) => sb.from(t).select(sel);
    const [modelos, vendedores, equipes, adicionais, leads, orcamentos, obras, financeiro, tarefas, vw_metas_vendedor, vw_funil_resumo] = await Promise.all([
      q('modelos', '*'),
      q('vendedores', '*'),
      q('equipes', '*'),
      q('adicionais', '*'),
      q('leads', '*, lead_interacoes(*)'),
      q('orcamentos', '*, orcamento_itens(*)'),
      q('obras', '*, obra_notas(*), leads(id, telefone)'),
      q('financeiro', '*, leads(id, telefone)'),
      q('tarefas', '*'),
      q('vw_metas_vendedor', '*'),
      q('vw_funil_resumo', '*'),
    ]);
    for (const r of [modelos, vendedores, equipes, adicionais, leads, orcamentos, obras, financeiro, tarefas]) {
      if (r.error) throw r.error;
    }
    return {
      modelos: modelos.data || [], vendedores: vendedores.data || [], equipes: equipes.data || [],
      adicionais: adicionais.data || [], leads: leads.data || [], orcamentos: orcamentos.data || [],
      obras: obras.data || [], financeiro: financeiro.data || [], tarefas: tarefas.data || [],
      // views de relatório (numeração feita no servidor). Não bloqueiam a hidratação se falharem.
      vwMetas: (vw_metas_vendedor && vw_metas_vendedor.data) || [],
      vwFunil: (vw_funil_resumo && vw_funil_resumo.data) || [],
    };
  }

  function buildMaps(d) {
    const m = emptyMaps();
    d.modelos.forEach(x => { m.modeloById[x.id] = x.nome; m.modeloByName[x.nome] = x.id; });
    d.vendedores.forEach(x => { m.vendById[x.id] = x.nome; m.vendByName[x.nome] = x.id; });
    d.equipes.forEach(x => { m.equipeById[x.id] = x.nome; m.equipeByName[x.nome] = x.id; });
    return m;
  }

  function toNativeConfig(d) {
    // popula specs do catálogo direto no objeto global (usado pelos orçamentos)
    if (typeof MODELO_SPECS !== 'undefined') {
      d.modelos.forEach(m => {
        MODELO_SPECS[m.nome] = {
          dim: m.dim || 'Sob medida', prof: m.prof || 'A definir', volume: m.volume || 'A definir',
          prazo: m.prazo || 'A combinar', pessoas: m.pessoas || 'A definir',
        };
      });
    }
    return {
      modelos: d.modelos.slice().sort(byCreated).map(m => ({ nome: m.nome, base: num(m.base) })),
      vendedores: d.vendedores.slice().sort(byCreated).map(v => ({ nome: v.nome, cor: v.cor || '#0ea5a4', meta: num(v.meta, 150000) })),
      equipes: d.equipes.slice().sort(byCreated).map(e => e.nome),
      adicionais: d.adicionais.slice().sort(byCreated).map(a => ({
        nome: a.nome, valor: num(a.valor), unidade: a.unidade || '', qtdPadrao: Math.max(1, num(a.qtd_padrao, 1)),
      })),
    };
  }
  const byCreated = (a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0);

  function toNativeLeads(d, maps) {
    return d.leads.map(l => ({
      id: l.id, nome: l.nome, telefone: l.telefone || '', email: l.email || '',
      origem: l.origem, modelo: maps.modeloById[l.modelo_id] || '', valor: num(l.valor),
      vendedor: maps.vendById[l.vendedor_id] || '', etapa: l.etapa, temperatura: l.temperatura,
      cidade: l.cidade || '', criadoEm: l.created_at, atualizadoEm: l.updated_at, observacoes: l.observacoes || '',
      interacoes: (l.lead_interacoes || [])
        .slice().sort((a, b) => new Date(b.quando) - new Date(a.quando))
        .map(it => ({ id: it.id, quando: it.quando, tipo: it.tipo, texto: it.texto })),
    })).sort((a, b) => new Date(b.atualizadoEm || b.criadoEm) - new Date(a.atualizadoEm || a.criadoEm));
  }

  function toNativeOrc(d, maps) {
    return d.orcamentos.map(o => ({
      id: o.id, numero: o.numero,
      cliente: { nome: o.cliente_nome, telefone: o.cliente_telefone || '', cidade: o.cliente_cidade || '', email: o.cliente_email || '' },
      vendedor: maps.vendById[o.vendedor_id] || '', modelo: maps.modeloById[o.modelo_id] || '',
      valorBase: num(o.valor_base),
      adicionais: (o.orcamento_itens || []).map(i => ({ nome: i.nome, qtd: num(i.qtd, 1), valor: num(i.valor) })),
      descontoPct: num(o.desconto_pct), validadeDias: num(o.validade_dias, 15), observacoes: o.observacoes || '',
      pagamento: { tipo: o.pagamento_tipo, entradaPct: num(o.entrada_pct, 20), parcelas: num(o.parcelas, 24), jurosMes: num(o.juros_mes, 1.99) },
      status: o.status, criadoEm: o.created_at, leadId: o.lead_id || undefined,
    })).sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));
  }

  function toNativeObras(d, maps) {
    const out = {};
    d.obras.forEach(o => {
      const lead = o.leads; if (!lead) return;
      const key = clienteKey({ telefone: lead.telefone, id: lead.id });
      out[key] = {
        etapa: o.etapa, responsavel: maps.equipeById[o.equipe_id] || '',
        inicio: dateToISO(o.inicio), previsao: dateToISO(o.previsao),
        notas: (o.obra_notas || []).slice().sort((a, b) => new Date(b.quando) - new Date(a.quando))
          .map(n => ({ id: n.id, quando: n.quando, texto: n.texto })),
      };
    });
    return out;
  }

  function toNativeFin(d) {
    const out = {};
    d.financeiro.forEach(f => {
      const lead = f.leads; if (!lead) return;
      const key = clienteKey({ telefone: lead.telefone, id: lead.id });
      out[key] = {
        entradaPaga: !!f.entrada_paga, parcelasPagas: num(f.parcelas_pagas),
        comissaoPct: num(f.comissao_pct, 4), comissaoPaga: !!f.comissao_paga,
      };
    });
    return out;
  }

  async function hydrate() {
    const d = await fetchAll();
    state.maps = buildMaps(d);
    state.tarefas = d.tarefas || [];
    // views de relatório (fonte da verdade no servidor) ficam acessíveis ao app
    window.__supaViews = { metas: d.vwMetas || [], funil: d.vwFunil || [], em: Date.now() };
    // escreve no cache no formato nativo do app e reusa os loaders existentes
    writeCache(KEYS.config, toNativeConfig(d));
    writeCache(KEYS.leads, toNativeLeads(d, state.maps));
    writeCache(KEYS.orc, toNativeOrc(d, state.maps));
    writeCache(KEYS.obras, toNativeObras(d, state.maps));
    writeCache(KEYS.fin, toNativeFin(d));

    state.hydrating = true;
    try {
      if (typeof loadConfig === 'function') loadConfig();
      if (typeof load === 'function') load();
      if (typeof loadOps === 'function') loadOps();
      if (typeof orcLoad === 'function') orcLoad();
    } finally {
      state.hydrating = false;
    }
    if (typeof render === 'function') render();
    renderBell();
    log('Hidratado:', {
      leads: d.leads.length, orcamentos: d.orcamentos.length, obras: d.obras.length,
      financeiro: d.financeiro.length, modelos: d.modelos.length, vendedores: d.vendedores.length,
    });
  }

  async function refreshMaps() {
    const [m, v, e] = await Promise.all([
      sb.from('modelos').select('id,nome'),
      sb.from('vendedores').select('id,nome'),
      sb.from('equipes').select('id,nome'),
    ]);
    const d = { modelos: m.data || [], vendedores: v.data || [], equipes: e.data || [] };
    state.maps = buildMaps(d);
  }

  /* ------------------------------------------------------------------ seam de escrita */
  // chamado pelo persist() do app.js após gravar no cache local
  function onPersist(key) {
    if (state.hydrating) return;
    if (!state.ready) { state.dirty.add(key); return; }
    scheduleSync(key, 450);
  }

  function scheduleSync(key, delay) {
    clearTimeout(state.timers[key]);
    state.timers[key] = setTimeout(() => runSync(key), delay);
  }

  async function runSync(key) {
    if (!state.ready || !sb) { state.dirty.add(key); return; }
    setPill('syncing', 'Salvando…');
    state.muteUntil = Date.now() + 3000; // ignora ecos das próprias escritas no Realtime
    try {
      if (key === KEYS.config) await syncConfig();
      else if (key === KEYS.leads) await syncLeads();
      else if (key === KEYS.orc) await syncOrcamentos();
      else if (key === KEYS.obras) await syncObras();
      else if (key === KEYS.fin) await syncFinanceiro();
      state.dirty.delete(key);
      state.muteUntil = Date.now() + 3000;
      setPill('online', 'Online · Supabase');
    } catch (e) {
      err('sync falhou para', key, e);
      state.dirty.add(key);
      setPill('error', 'Erro ao salvar no servidor');
    }
  }

  /* ------------------------------------------------------------------ Realtime */
  function subscribeRealtime() {
    if (state.channel) return;
    state.channel = sb.channel('piscinapro-db')
      .on('postgres_changes', { event: '*', schema: 'public' }, payload => onRemoteChange(payload))
      .subscribe(status => { if (status === 'SUBSCRIBED') log('Realtime conectado'); });
  }

  function onRemoteChange(payload) {
    if (state.hydrating) return;
    if (Date.now() < state.muteUntil) return; // eco da nossa própria escrita
    const table = payload && payload.table;
    if (table === 'tarefas') { scheduleTarefasRefresh(); return; }
    scheduleRefresh();
  }

  function overlaysOpen() {
    return document.querySelector('#modal.open, #drawer.open, .supa-login.open, .supa-bell-panel.open') != null;
  }
  function scheduleRefresh() {
    clearTimeout(state.refreshTimer);
    state.refreshTimer = setTimeout(async () => {
      // não interrompe uma edição em andamento: espera fechar modal/drawer/painel
      if (overlaysOpen()) { scheduleRefresh(); return; }
      try {
        setPill('syncing', 'Atualizando…');
        await hydrate();
        setPill('online', 'Online · Supabase');
      } catch (e) { err('refresh realtime', e); setPill('error', 'Erro ao atualizar'); }
    }, 700);
  }
  async function scheduleTarefasRefresh() {
    try {
      const { data } = await sb.from('tarefas').select('*');
      state.tarefas = data || [];
      renderBell();
    } catch (e) { err('tarefas refresh', e); }
  }

  // upsert tolerante + remoção do que não está mais presente (por nome)
  async function reconcileByName(table, rows, cols) {
    if (rows.length) {
      const { error } = await sb.from(table).upsert(rows, { onConflict: 'nome' });
      if (error) throw error;
    }
    const keep = rows.map(r => r.nome);
    const { data } = await sb.from(table).select('nome');
    const toDel = (data || []).map(r => r.nome).filter(n => !keep.includes(n));
    for (const n of toDel) { // um a um: ignora falha por FK (registro em uso)
      const { error } = await sb.from(table).delete().eq('nome', n);
      if (error) log(`mantido "${n}" em ${table} (em uso):`, error.message);
    }
  }

  async function deleteMissingById(table, keepIds, col = 'id') {
    const { data, error } = await sb.from(table).select(col);
    if (error) throw error;
    const set = new Set(keepIds);
    const toDel = (data || []).map(r => r[col]).filter(id => !set.has(id));
    if (!toDel.length) return;
    const { error: delErr } = await sb.from(table).delete().in(col, toDel);
    if (delErr) log(`remoção parcial em ${table}:`, delErr.message);
  }

  async function syncConfig() {
    const cfg = (typeof defaultConfig === 'function') ? defaultConfig() : null;
    if (!cfg) return;
    const specs = (typeof MODELO_SPECS !== 'undefined') ? MODELO_SPECS : {};
    await reconcileByName('modelos', cfg.modelos.map(m => ({
      nome: m.nome, base: num(m.base), ...(specs[m.nome] || {}),
    })));
    await reconcileByName('vendedores', cfg.vendedores.map(v => ({
      nome: v.nome, cor: v.cor || '#0ea5a4', meta: num(v.meta, 150000),
    })));
    await reconcileByName('equipes', cfg.equipes.filter(Boolean).map(nome => ({ nome })));
    await reconcileByName('adicionais', cfg.adicionais.map(a => ({
      nome: a.nome, valor: num(a.valor), unidade: a.unidade || '', qtd_padrao: Math.max(1, num(a.qtdPadrao, 1)),
    })));
    await refreshMaps();
    // nomes podem ter mudado -> reprocessa leads/orçamentos que dependem deles
    scheduleSync(KEYS.leads, 200);
    scheduleSync(KEYS.orc, 200);
  }

  async function syncLeads() {
    const M = state.maps;
    const rows = LEADS.filter(l => isUuid(l.id)).map(l => ({
      id: l.id, nome: l.nome || '', telefone: l.telefone || '', email: l.email || null,
      cidade: l.cidade || null, origem: l.origem || 'site', modelo_id: M.modeloByName[l.modelo] || null,
      valor: num(l.valor), vendedor_id: M.vendByName[l.vendedor] || null, etapa: l.etapa || 'novo',
      temperatura: l.temperatura || 'morno', observacoes: l.observacoes || null,
      created_at: l.criadoEm || nowISO(), updated_at: l.atualizadoEm || nowISO(),
    }));
    if (rows.length) { const { error } = await sb.from('leads').upsert(rows); if (error) throw error; }

    const inter = [];
    LEADS.forEach(l => {
      if (!isUuid(l.id)) return;
      (l.interacoes || []).forEach(it => {
        if (!isUuid(it.id)) return;
        inter.push({ id: it.id, lead_id: l.id, tipo: it.tipo || 'Nota', texto: it.texto || '', quando: it.quando || nowISO() });
      });
    });
    if (inter.length) { const { error } = await sb.from('lead_interacoes').upsert(inter); if (error) throw error; }
    // remoções (filhos antes dos pais p/ respeitar FK)
    await deleteMissingById('lead_interacoes', inter.map(i => i.id));
    await deleteMissingById('leads', rows.map(r => r.id));
  }

  async function syncOrcamentos() {
    const M = state.maps;
    const list = (typeof ORC !== 'undefined' ? ORC : []).filter(o => isUuid(o.id));
    const rows = list.map(o => ({
      id: o.id, numero: o.numero, lead_id: isUuid(o.leadId) ? o.leadId : null,
      cliente_nome: o.cliente?.nome || '', cliente_telefone: o.cliente?.telefone || '',
      cliente_cidade: o.cliente?.cidade || '', cliente_email: o.cliente?.email || '',
      vendedor_id: M.vendByName[o.vendedor] || null, modelo_id: M.modeloByName[o.modelo] || null,
      valor_base: num(o.valorBase), desconto_pct: num(o.descontoPct), validade_dias: num(o.validadeDias, 15),
      observacoes: o.observacoes || null, pagamento_tipo: o.pagamento?.tipo || 'financiado',
      entrada_pct: num(o.pagamento?.entradaPct, 20), parcelas: num(o.pagamento?.parcelas, 24),
      juros_mes: num(o.pagamento?.jurosMes, 1.99), status: o.status || 'rascunho', created_at: o.criadoEm || nowISO(),
    }));
    if (rows.length) { const { error } = await sb.from('orcamentos').upsert(rows); if (error) throw error; }

    const ids = rows.map(r => r.id);
    // itens são snapshots sem id estável: substitui o conjunto de cada orçamento
    if (ids.length) await sb.from('orcamento_itens').delete().in('orcamento_id', ids);
    const items = [];
    list.forEach(o => (o.adicionais || []).forEach(a => items.push({ orcamento_id: o.id, nome: a.nome, qtd: num(a.qtd, 1), valor: num(a.valor) })));
    if (items.length) { const { error } = await sb.from('orcamento_itens').insert(items); if (error) throw error; }
    await deleteMissingById('orcamentos', ids);
  }

  function ganhoLeadsByKey() {
    const map = {};
    LEADS.filter(l => l.etapa === 'ganho' && isUuid(l.id)).forEach(l => { map[clienteKey(l)] = l; });
    return map;
  }

  async function syncObras() {
    const M = state.maps;
    const byKey = ganhoLeadsByKey();
    const resolved = (typeof obrasData === 'function') ? obrasData() : [];
    const rows = [];
    resolved.forEach(o => {
      const lead = byKey[o.id];
      if (!lead || !(o.id in OBRAS)) return; // só obras com lead ganho e com estado salvo/hidratado
      rows.push({
        lead_id: lead.id, equipe_id: M.equipeByName[o.responsavel] || null, etapa: o.etapa,
        inicio: dateOnly(o.inicio), previsao: dateOnly(o.previsao), updated_at: nowISO(),
      });
    });
    let obraRows = [];
    if (rows.length) {
      const { data, error } = await sb.from('obras').upsert(rows, { onConflict: 'lead_id' }).select('id, lead_id');
      if (error) throw error;
      obraRows = data || [];
    }
    const obraIdByLead = {}; obraRows.forEach(r => { obraIdByLead[r.lead_id] = r.id; });
    const keepObraIds = obraRows.map(r => r.id);
    if (keepObraIds.length) await sb.from('obra_notas').delete().in('obra_id', keepObraIds);
    const notas = [];
    resolved.forEach(o => {
      const lead = byKey[o.id]; if (!lead) return;
      const oid = obraIdByLead[lead.id]; if (!oid) return;
      ((OBRAS[o.id] || {}).notas || []).forEach(n => {
        const row = { obra_id: oid, texto: n.texto || '', quando: n.quando || nowISO() };
        if (isUuid(n.id)) row.id = n.id;
        notas.push(row);
      });
    });
    if (notas.length) { const { error } = await sb.from('obra_notas').insert(notas); if (error) throw error; }
    await deleteMissingById('obras', rows.map(r => r.lead_id), 'lead_id');
  }

  async function syncFinanceiro() {
    const byKey = ganhoLeadsByKey();
    const resolved = (typeof financeiroData === 'function') ? financeiroData() : [];
    const rows = [];
    resolved.forEach(f => {
      const lead = byKey[f.id];
      if (!lead || !(f.id in FIN)) return;
      rows.push({
        lead_id: lead.id, orcamento_id: (f.o && isUuid(f.o.id)) ? f.o.id : null,
        total: num(f.total), entrada: num(f.entrada), financiado: num(f.financiado),
        parcelas: Math.max(1, num(f.parcelas, 1)), valor_parcela: num(f.parcela),
        entrada_paga: !!f.entradaPaga, parcelas_pagas: Math.max(0, num(f.parcelasPagas)),
        comissao_pct: num(f.comissaoPct, 4), comissao_paga: !!f.comissaoPaga, updated_at: nowISO(),
      });
    });
    if (rows.length) { const { error } = await sb.from('financeiro').upsert(rows, { onConflict: 'lead_id' }); if (error) throw error; }
    await deleteMissingById('financeiro', rows.map(r => r.lead_id), 'lead_id');
  }

  /* ------------------------------------------------------------------ follow-ups / sino */
  const diasDesdeISO = iso => Math.floor((Date.now() - new Date(iso)) / 86400000);
  function ultimaInteracao(l) {
    const arr = l.interacoes || [];
    if (!arr.length) return l.atualizadoEm || l.criadoEm;
    return arr.reduce((mx, it) => (new Date(it.quando) > new Date(mx) ? it.quando : mx), arr[0].quando);
  }
  function leadsParados() {
    if (typeof LEADS === 'undefined') return [];
    return LEADS.filter(l => !['ganho', 'perdido'].includes(l.etapa))
      .map(l => ({ lead: l, dias: diasDesdeISO(ultimaInteracao(l)) }))
      .filter(x => x.dias >= STALE_DIAS)
      .sort((a, b) => b.dias - a.dias);
  }
  function tarefasPendentes() {
    const hoje = new Date(); hoje.setHours(23, 59, 59, 999);
    return state.tarefas.filter(t => !t.feito)
      .map(t => ({ ...t, atrasada: t.vencimento ? new Date(t.vencimento) < new Date(new Date().toDateString()) : false }))
      .sort((a, b) => (a.vencimento || '9999').localeCompare(b.vencimento || '9999'));
  }
  function leadNome(id) {
    if (typeof LEADS === 'undefined') return '';
    const l = LEADS.find(x => x.id === id); return l ? l.nome : '';
  }

  let bellPanel = null;
  function mountBell() {
    const btn = document.querySelector('.topbar .icon-btn[title="Notificações"]');
    if (!btn || btn._supaWired) return;
    btn._supaWired = true;
    btn.addEventListener('click', e => { e.stopPropagation(); toggleBell(); });
    document.addEventListener('click', ev => {
      if (bellPanel && bellPanel.classList.contains('open') && !bellPanel.contains(ev.target) && !btn.contains(ev.target)) {
        bellPanel.classList.remove('open');
      }
    });
  }
  function toggleBell() {
    if (!bellPanel) { renderBell(); }
    if (bellPanel) { bellPanel.classList.toggle('open'); renderBell(); }
  }
  function renderBell() {
    mountBell();
    const parados = leadsParados();
    const pend = tarefasPendentes();
    const total = parados.length + pend.length;
    // badge no botão do sino
    const dot = document.querySelector('.topbar .icon-btn[title="Notificações"] .dot');
    if (dot) {
      if (total > 0) { dot.textContent = total > 9 ? '9+' : String(total); dot.classList.add('has-count'); }
      else { dot.textContent = ''; dot.classList.remove('has-count'); }
    }
    if (!bellPanel) {
      bellPanel = document.createElement('div');
      bellPanel.className = 'supa-bell-panel';
      document.body.appendChild(bellPanel);
    }
    const podeCriar = state.ready;
    const meu = meuVendedorNome();
    const tItem = t => `
      <div class="sb-item ${t.atrasada ? 'atras' : ''}">
        <button class="sb-check" title="Concluir" data-done="${t.id}"></button>
        <div class="sb-main">
          <div class="sb-title">${escapeHtml(t.titulo)}</div>
          <div class="sb-sub">${t.lead_id ? escapeHtml(leadNome(t.lead_id)) + ' · ' : ''}${t.vencimento ? (t.atrasada ? 'venceu ' : 'vence ') + fmtData(t.vencimento) : 'sem prazo'}</div>
        </div>
        <button class="sb-del" title="Remover" data-del="${t.id}">×</button>
      </div>`;
    const pItem = x => `
      <div class="sb-item">
        <span class="sb-ico">⏳</span>
        <div class="sb-main">
          <div class="sb-title">${escapeHtml(x.lead.nome)}</div>
          <div class="sb-sub">${x.dias} dias sem contato · ${escapeHtml(x.lead.etapa)}</div>
        </div>
        <button class="sb-open" data-lead="${x.lead.id}">abrir</button>
      </div>`;
    bellPanel.innerHTML = `
      <div class="sb-head">
        <b>Notificações</b>
        ${meu ? `<button class="sb-mine" title="Filtrar meus leads">meus leads</button>` : ''}
      </div>
      <div class="sb-new">
        <input id="sbTarefa" placeholder="${podeCriar ? 'Nova tarefa / follow-up…' : 'Entre para criar tarefas'}" ${podeCriar ? '' : 'disabled'} />
        <input id="sbData" type="date" ${podeCriar ? '' : 'disabled'} />
        <button id="sbAdd" ${podeCriar ? '' : 'disabled'}>+</button>
      </div>
      <div class="sb-sec">Tarefas${pend.length ? ` · ${pend.length}` : ''}</div>
      <div class="sb-list">${pend.length ? pend.map(tItem).join('') : '<div class="sb-empty">Nenhuma tarefa pendente.</div>'}</div>
      <div class="sb-sec">Leads parados (${STALE_DIAS}+ dias)${parados.length ? ` · ${parados.length}` : ''}</div>
      <div class="sb-list">${parados.length ? parados.slice(0, 8).map(pItem).join('') : '<div class="sb-empty">Nenhum lead parado. 👏</div>'}</div>`;

    const add = () => {
      const inp = bellPanel.querySelector('#sbTarefa');
      const dt = bellPanel.querySelector('#sbData');
      const titulo = inp.value.trim(); if (!titulo) return;
      addTarefa(null, titulo, dt.value || null); inp.value = ''; dt.value = '';
    };
    const addBtn = bellPanel.querySelector('#sbAdd');
    if (addBtn) addBtn.addEventListener('click', add);
    const tInp = bellPanel.querySelector('#sbTarefa');
    if (tInp) tInp.addEventListener('keydown', e => { if (e.key === 'Enter') add(); });
    bellPanel.querySelectorAll('[data-done]').forEach(b => b.addEventListener('click', () => toggleTarefa(b.dataset.done, true)));
    bellPanel.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => delTarefa(b.dataset.del)));
    bellPanel.querySelectorAll('[data-lead]').forEach(b => b.addEventListener('click', () => {
      bellPanel.classList.remove('open');
      if (window.App && App.openDetalhe) App.openDetalhe(b.dataset.lead);
    }));
    const mineBtn = bellPanel.querySelector('.sb-mine');
    if (mineBtn) mineBtn.addEventListener('click', () => {
      bellPanel.classList.remove('open');
      if (window.App && App.setFiltro) App.setFiltro('vendedor', meu);
      if (typeof setView === 'function') setView('lista'); else if (typeof render === 'function') render();
    });
  }

  async function addTarefa(leadId, titulo, vencimento) {
    if (!state.ready) return;
    const row = { lead_id: leadId || null, titulo, vencimento: vencimento || null, feito: false };
    try {
      state.muteUntil = Date.now() + 3000;
      const { data, error } = await sb.from('tarefas').insert(row).select('*').maybeSingle();
      if (error) throw error;
      if (data) state.tarefas = [...state.tarefas, data];
      renderBell();
      if (typeof toast === 'function') toast('Tarefa criada');
    } catch (e) { err('addTarefa', e); if (typeof toast === 'function') toast('Não foi possível criar a tarefa', true); }
  }
  async function toggleTarefa(id, feito) {
    if (!state.ready) return;
    state.tarefas = state.tarefas.map(t => t.id === id ? { ...t, feito } : t);
    renderBell();
    try { state.muteUntil = Date.now() + 3000; await sb.from('tarefas').update({ feito }).eq('id', id); }
    catch (e) { err('toggleTarefa', e); }
  }
  async function delTarefa(id) {
    if (!state.ready) return;
    state.tarefas = state.tarefas.filter(t => t.id !== id);
    renderBell();
    try { state.muteUntil = Date.now() + 3000; await sb.from('tarefas').delete().eq('id', id); }
    catch (e) { err('delTarefa', e); }
  }

  // helpers locais de formatação/escape (independentes do app)
  function escapeHtml(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function fmtData(d) { try { return new Date(`${d}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }); } catch (e) { return d; } }

  /* ------------------------------------------------------------------ status pill */
  let pillEl = null;
  function mountPill() {
    if (pillEl) return;
    pillEl = document.createElement('div');
    pillEl.className = 'supa-pill offline';
    pillEl.innerHTML = '<span class="supa-dot"></span><span class="supa-txt">Conectando…</span>';
    document.body.appendChild(pillEl);
  }
  function setPill(kind, txt) {
    if (!pillEl) return;
    pillEl.className = 'supa-pill ' + kind;
    pillEl.querySelector('.supa-txt').textContent = txt;
  }

  /* ------------------------------------------------------------------ login gate */
  let loginEl = null;
  function showLogin() {
    if (loginEl) { loginEl.classList.add('open'); return; }
    loginEl = document.createElement('div');
    loginEl.className = 'supa-login open';
    const prefill = 'ramon.sfarias@hotmail.com';
    loginEl.innerHTML = `
      <div class="supa-card" role="dialog" aria-modal="true" aria-label="Entrar">
        <div class="supa-brand">
          <div class="supa-logo">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 17c1.6 0 1.6 1.2 3.2 1.2S6.8 17 8.4 17s1.6 1.2 3.2 1.2S13.2 17 14.8 17s1.6 1.2 3.2 1.2S19.6 17 22 17" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/>
              <path d="M8 9V5.5A1.5 1.5 0 0 1 9.5 4M15 9V5.5A1.5 1.5 0 0 0 13.5 4" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/>
            </svg>
          </div>
          <div><div class="supa-t">Piscina<b>Pro</b></div><div class="supa-s">Entre para sincronizar com o Supabase</div></div>
        </div>
        <form id="supaForm">
          <label>E-mail</label>
          <input id="supaEmail" type="email" autocomplete="username" value="${prefill}" required />
          <label>Senha</label>
          <input id="supaPass" type="password" autocomplete="current-password" placeholder="••••••••" required />
          <div class="supa-msg" id="supaMsg"></div>
          <button class="supa-btn" type="submit" id="supaSubmit">Entrar</button>
          <button class="supa-link" type="button" id="supaOffline">Continuar offline (só cache local)</button>
        </form>
      </div>`;
    document.body.appendChild(loginEl);
    const form = loginEl.querySelector('#supaForm');
    const msg = loginEl.querySelector('#supaMsg');
    const submit = loginEl.querySelector('#supaSubmit');
    form.addEventListener('submit', async ev => {
      ev.preventDefault();
      const email = loginEl.querySelector('#supaEmail').value.trim();
      const password = loginEl.querySelector('#supaPass').value;
      msg.textContent = ''; submit.disabled = true; submit.textContent = 'Entrando…';
      try {
        const { data, error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        state.session = data.session; state.ready = true;
        hideLogin();
        await afterLogin();
      } catch (e) {
        msg.textContent = traduzErro(e);
        submit.disabled = false; submit.textContent = 'Entrar';
      }
    });
    loginEl.querySelector('#supaOffline').addEventListener('click', () => {
      hideLogin();
      setPill('offline', 'Offline — usando cache local');
    });
    setTimeout(() => loginEl.querySelector('#supaPass').focus(), 60);
  }
  function hideLogin() { if (loginEl) loginEl.classList.remove('open'); }
  function traduzErro(e) {
    const m = (e && e.message || '').toLowerCase();
    if (m.includes('invalid login')) return 'E-mail ou senha inválidos.';
    if (m.includes('email not confirmed')) return 'E-mail ainda não confirmado.';
    if (m.includes('failed to fetch') || m.includes('network')) return 'Sem conexão com o servidor.';
    return e && e.message ? e.message : 'Não foi possível entrar.';
  }
  async function logout() {
    // UI responde na hora; o signOut é local (sem round-trip que pode travar).
    state.session = null; state.ready = false; state.online = false;
    state.user = null; state.perfil = null; state.tarefas = [];
    try { if (state.channel) { sb.removeChannel(state.channel); state.channel = null; } } catch (e) { /* noop */ }
    renderBell();
    setPill('offline', 'Desconectado');
    showLogin();
    try { if (sb) await sb.auth.signOut({ scope: 'local' }); } catch (e) { /* noop */ }
  }

  /* ------------------------------------------------------------------ estilos */
  function injectStyles() {
    if (document.getElementById('supa-styles')) return;
    const css = `
    .supa-pill{position:fixed;right:14px;bottom:14px;z-index:60;display:flex;align-items:center;gap:8px;
      padding:7px 12px;border-radius:999px;font:600 12px/1 'Manrope',system-ui,sans-serif;color:#0f172a;
      background:rgba(255,255,255,.9);backdrop-filter:blur(8px);box-shadow:0 6px 24px rgba(15,23,42,.14);
      border:1px solid rgba(15,23,42,.08);user-select:none}
    .supa-pill .supa-dot{width:8px;height:8px;border-radius:50%;background:#94a3b8;box-shadow:0 0 0 3px rgba(148,163,184,.2)}
    .supa-pill.online .supa-dot{background:#12b886;box-shadow:0 0 0 3px rgba(18,184,134,.2)}
    .supa-pill.syncing .supa-dot{background:#e6a532;box-shadow:0 0 0 3px rgba(230,165,50,.2);animation:supaPulse 1s infinite}
    .supa-pill.error .supa-dot{background:#e8734a;box-shadow:0 0 0 3px rgba(232,115,74,.2)}
    @keyframes supaPulse{0%,100%{opacity:1}50%{opacity:.35}}
    @media (prefers-color-scheme: dark){.supa-pill{background:rgba(15,23,42,.82);color:#e2e8f0;border-color:rgba(255,255,255,.08)}}
    .supa-login{position:fixed;inset:0;z-index:120;display:none;align-items:center;justify-content:center;
      background:radial-gradient(120% 120% at 50% 0%, #0b3b46 0%, #071f26 60%, #04141a 100%);padding:24px}
    .supa-login.open{display:flex}
    .supa-card{width:min(400px,94vw);background:#fff;border-radius:20px;padding:26px 24px;
      box-shadow:0 30px 80px rgba(0,0,0,.4);font-family:'Manrope',system-ui,sans-serif;animation:supaUp .35s ease}
    @keyframes supaUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
    .supa-brand{display:flex;align-items:center;gap:12px;margin-bottom:20px}
    .supa-logo{width:44px;height:44px;border-radius:13px;display:grid;place-items:center;
      background:linear-gradient(150deg,#0ea5a4,#0b7c86)}
    .supa-logo svg{width:26px;height:26px}
    .supa-t{font-family:'Fraunces',Georgia,serif;font-size:21px;color:#0f172a;font-weight:600}
    .supa-t b{color:#0ea5a4}
    .supa-s{font-size:12.5px;color:#64748b;margin-top:2px}
    .supa-card label{display:block;font-size:12px;font-weight:600;color:#475569;margin:12px 0 6px}
    .supa-card input{width:100%;box-sizing:border-box;padding:11px 13px;border:1px solid #dbe2ea;border-radius:11px;
      font-size:14px;color:#0f172a;background:#f8fafc;transition:.15s}
    .supa-card input:focus{outline:none;border-color:#0ea5a4;background:#fff;box-shadow:0 0 0 3px rgba(14,165,164,.14)}
    .supa-msg{min-height:16px;color:#dc2626;font-size:12.5px;margin:10px 0 2px}
    .supa-btn{width:100%;margin-top:8px;padding:12px;border:0;border-radius:11px;cursor:pointer;
      background:linear-gradient(150deg,#0ea5a4,#0b7c86);color:#fff;font-size:14.5px;font-weight:700;transition:.15s}
    .supa-btn:hover{filter:brightness(1.05)}.supa-btn:disabled{opacity:.7;cursor:default}
    .supa-link{width:100%;margin-top:10px;padding:8px;border:0;background:none;cursor:pointer;
      color:#64748b;font-size:12.5px;text-decoration:underline}
    .supa-link:hover{color:#0ea5a4}
    /* seletor "sou o vendedor" no rodapé da sidebar */
    .side-vend{margin-top:6px;width:100%;font:600 11px/1 'Manrope',system-ui,sans-serif;color:#e2e8f0;
      background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:8px;padding:5px 7px;cursor:pointer}
    .side-vend option{color:#0f172a}
    /* badge de contagem no sino */
    .topbar .icon-btn .dot.has-count{width:auto;min-width:16px;height:16px;padding:0 4px;border-radius:9px;
      display:grid;place-items:center;font:700 10px/1 'Manrope',system-ui,sans-serif;color:#fff;background:#e8734a;top:6px;right:6px}
    /* painel de notificações */
    .supa-bell-panel{position:fixed;top:64px;right:20px;z-index:80;width:min(360px,92vw);max-height:74vh;overflow:auto;
      background:#fff;border:1px solid rgba(15,23,42,.1);border-radius:16px;box-shadow:0 24px 60px rgba(15,23,42,.22);
      font-family:'Manrope',system-ui,sans-serif;display:none;animation:supaUp .2s ease}
    .supa-bell-panel.open{display:block}
    .sb-head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px 8px;font-size:15px;color:#0f172a}
    .sb-mine{border:1px solid #0ea5a4;color:#0b7c86;background:#eafcfb;border-radius:999px;padding:4px 10px;font-size:11.5px;font-weight:700;cursor:pointer}
    .sb-new{display:flex;gap:6px;padding:4px 12px 10px}
    .sb-new input#sbTarefa{flex:1;min-width:0}
    .sb-new input{padding:8px 10px;border:1px solid #dbe2ea;border-radius:9px;font-size:12.5px;background:#f8fafc;color:#0f172a}
    .sb-new input:focus{outline:none;border-color:#0ea5a4;background:#fff}
    .sb-new #sbAdd{border:0;background:#0ea5a4;color:#fff;border-radius:9px;width:34px;font-size:18px;font-weight:700;cursor:pointer}
    .sb-new #sbAdd:disabled,.sb-new input:disabled{opacity:.5;cursor:default}
    .sb-sec{padding:10px 16px 4px;font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:#94a3b8}
    .sb-list{padding:0 8px 4px}
    .sb-item{display:flex;align-items:center;gap:9px;padding:9px 10px;border-radius:11px}
    .sb-item:hover{background:#f1f5f9}
    .sb-item.atras{background:#fff2ee}
    .sb-check{flex:none;width:18px;height:18px;border:2px solid #cbd5e1;border-radius:6px;background:#fff;cursor:pointer}
    .sb-check:hover{border-color:#12b886;background:#eafaf3}
    .sb-ico{flex:none;font-size:15px}
    .sb-main{flex:1;min-width:0}
    .sb-title{font-size:13px;font-weight:600;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .sb-sub{font-size:11.5px;color:#64748b;margin-top:1px}
    .sb-del{flex:none;border:0;background:none;color:#94a3b8;font-size:18px;line-height:1;cursor:pointer;padding:0 4px}
    .sb-del:hover{color:#e8734a}
    .sb-open{flex:none;border:1px solid #dbe2ea;background:#fff;color:#0b7c86;border-radius:8px;padding:4px 9px;font-size:11.5px;font-weight:700;cursor:pointer}
    .sb-open:hover{border-color:#0ea5a4;background:#eafcfb}
    .sb-empty{padding:10px 12px;font-size:12.5px;color:#94a3b8}
    @media (prefers-color-scheme: dark){
      .supa-bell-panel{background:#0f1e26;border-color:rgba(255,255,255,.1);color:#e2e8f0}
      .sb-head,.sb-title{color:#e2e8f0}.sb-item:hover{background:rgba(255,255,255,.05)}
      .sb-item.atras{background:rgba(232,115,74,.14)}
      .sb-new input{background:rgba(255,255,255,.05);border-color:rgba(255,255,255,.12);color:#e2e8f0}
    }`;
    const s = document.createElement('style');
    s.id = 'supa-styles'; s.textContent = css;
    document.head.appendChild(s);
  }

  /* ------------------------------------------------------------------ API pública */
  window.Supa = {
    boot, onPersist, logout,
    isOnline: () => state.online,
    resync: () => { Object.values(KEYS).forEach(k => scheduleSync(k, 0)); },
    // Identidade
    user: () => state.user,
    perfil: () => state.perfil,
    meuVendedor: meuVendedorNome,
    // Follow-ups (útil para criar tarefa a partir de um lead, futuramente)
    addTarefa,
    renderBell,
    _state: state,
  };
})();
