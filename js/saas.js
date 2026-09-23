/* ==========================================================================
   PiscinaPro — saas.js
   O produto por trás do produto: cadastro das empresas clientes, licença,
   cobrança e auditoria.

   COMO ISSO SE SEPARA DO RESTO
   As telas de operação trabalham com `PP.all(col)` — a cópia em memória da
   empresa de quem está logado. Aqui é outra coisa: são tabelas do provedor
   (empresas, planos, faturas, auditoria), consultadas direto no Postgres,
   sob demanda. Por isso este módulo não passa pelo driver nem entra no MAPA.

   O provedor NÃO enxerga o dado de negócio de nenhum cliente. O que ele vê da
   operação alheia são números agregados, devolvidos por função do banco —
   nunca a linha. A diferença entre monitorar e bisbilhotar.
   ========================================================================== */
(function () {
'use strict';
const PP = window.PP;
const esc = PP.esc;

const S = PP.saas = { contexto: null, faturasVencidas: 0 };

function db() {
  if (!PP.nuvem || !PP.nuvem.cliente) throw new Error('Sem conexão com o servidor.');
  return PP.nuvem.cliente;
}

async function consultar(fn) {
  const { data, error } = await fn(db());
  if (error) throw new Error(PP.nuvem.traduzErro(error.message));
  return data || [];
}

/* Cache simples por tela: o provedor troca de aba o tempo todo e não faz
   sentido buscar de novo a cada render. `S.limpar()` derruba depois de gravar. */
const CACHE = {};
S.limpar = chave => { if (chave) delete CACHE[chave]; else Object.keys(CACHE).forEach(k => delete CACHE[k]); };

/**
 * Busca sob demanda: a primeira vez devolve null e dispara o carregamento,
 * que redesenha a tela quando chega. As telas tratam null como "carregando".
 */
function buscar(chave, carregar) {
  if (CACHE[chave] !== undefined) return CACHE[chave];
  if (!CACHE['_carregando_' + chave]) {
    CACHE['_carregando_' + chave] = true;
    carregar()
      .then(d => { CACHE[chave] = d; })
      .catch(e => { CACHE[chave] = []; PP.toast(e.message, 'err'); })
      .finally(() => { delete CACHE['_carregando_' + chave]; PP.render(); });
  }
  return null;
}

const carregando = txt => `<div class="card"><div class="card-bd"><div class="empty-sm">${esc(txt || 'Carregando…')}</div></div></div>`;

/* ============================== CONTEXTO DA EMPRESA ============================== */

/** Ficha da empresa de quem entrou + faturas dela. Alimenta o aviso de vencimento. */
S.carregarContexto = async () => {
  S.contexto = null;
  const u = PP.usuario();
  if (!u) return null;
  try {
    if (u.papel === 'provedor') {
      const vencidas = await consultar(c => c.from('faturas_licenca')
        .select('id', { count:'exact', head:false })
        .in('status', ['aberta','vencida']).lt('vencimento', PP.hoje()));
      S.faturasVencidas = vencidas.length;
      return null;
    }
    const emp = await consultar(c => c.from('empresas').select('*').eq('id', u.empresaId).limit(1));
    const fat = await consultar(c => c.from('faturas_licenca').select('*')
      .eq('empresa_id', u.empresaId).order('vencimento', { ascending:false }).limit(24));
    const e = emp[0] || null;
    S.contexto = e ? {
      empresa: e,
      faturas: fat,
      diasParaVencer: PP.diasEntre(PP.hoje(), e.licenca_ate),
      bloqueada: !(['trial','ativa'].includes(e.status)) || e.licenca_ate < PP.hoje()
    } : null;
  } catch (e) { console.warn('[saas] contexto', e.message); }
  return S.contexto;
};

/** Faixa de aviso no topo quando a licença está perto de vencer ou venceu. */
S.avisoLicenca = () => {
  const c = S.contexto;
  if (!c || PP.ehProvedor()) return '';
  if (c.bloqueada) {
    return `<div class="licenca-faixa bloqueada">
      <svg class="ic"><use href="#i-alerta"/></svg>
      <div><b>Licença vencida em ${esc(PP.dt(c.empresa.licenca_ate))}.</b>
        O sistema está em modo somente leitura: você continua vendo e exportando tudo,
        mas não consegue gravar até regularizar.</div>
      ${PP.ehAdmin() ? '<button class="btn btn-sm" data-act="nav" data-v="licenca">Ver faturas</button>' : ''}
    </div>`;
  }
  if (c.diasParaVencer <= 7) {
    return `<div class="licenca-faixa">
      <svg class="ic"><use href="#i-licenca"/></svg>
      <div>Sua licença vence ${c.diasParaVencer === 0 ? '<b>hoje</b>' : `em <b>${c.diasParaVencer} dia(s)</b>`} (${esc(PP.dt(c.empresa.licenca_ate))}).</div>
      ${PP.ehAdmin() ? '<button class="btn btn-sm" data-act="nav" data-v="licenca">Regularizar</button>' : ''}
    </div>`;
  }
  return '';
};

/* ============================== AUDITORIA (evento do app) ============================== */

/** Registra no banco um evento que só o app conhece: login, exportação, impressão. */
S.evento = (acao, resumo, tabela) => {
  if (!PP.nuvem || !PP.nuvem.ligada) return;
  db().rpc('auditar_evento', { p_acao:acao, p_resumo:resumo, p_tabela:tabela || 'app' })
    .then(({ error }) => { if (error) console.warn('[auditoria]', error.message); })
    .catch(() => {});
};

PP.on('selecionarTudo', (d, el) => { try { el.select(); } catch (e) {} });

/* ============================== EMPRESAS CLIENTES ============================== */

const fEmp = { q:'', status:'' };

PP.view('empresas', {
  titulo: 'Empresas clientes',
  sub: () => {
    const l = CACHE.empresas;
    if (!l) return 'Carregando…';
    const ativas = l.filter(e => ['trial','ativa'].includes(e.status) && e.licenca_ate >= PP.hoje()).length;
    return `${l.length} empresa(s) · ${ativas} com licença em dia`;
  },
  render() {
    const lista = buscar('empresas', () => consultar(c => c.from('empresas')
      .select('*, planos(nome)').order('nome')));
    const planos = buscar('planos', () => consultar(c => c.from('planos').select('*').order('ordem')));
    if (!lista || !planos) return carregando('Buscando as empresas…');

    let rows = lista;
    if (fEmp.q) { const q = PP.norm(fEmp.q);
      rows = rows.filter(e => PP.norm(e.nome).includes(q) || PP.norm(e.email || '').includes(q)
        || PP.digitos(e.cnpj || '').includes(PP.digitos(fEmp.q))); }
    if (fEmp.status) rows = rows.filter(e => situacao(e).chave === fEmp.status);

    const mrr = lista.filter(e => e.status === 'ativa').reduce((s, e) => {
      const p = planos.find(x => x.id === e.plano_id);
      if (!p) return s;
      return s + (e.ciclo === 'anual' ? PP.n(p.preco_ano) / 12 : PP.n(p.preco_mes));
    }, 0);

    return `
      <div class="kpis mb">
        ${PP.kpi({ cls:'k-teal', lbl:'Receita recorrente (MRR)', val:PP.money0(mrr), sm:true,
          foot:'anual dividido por 12' })}
        ${PP.kpi({ cls:'k-ok', lbl:'Licença em dia', sm:true,
          val:String(lista.filter(e => ['trial','ativa'].includes(e.status) && e.licenca_ate >= PP.hoje()).length) })}
        ${PP.kpi({ cls:'k-warn', lbl:'Em teste', sm:true, val:String(lista.filter(e => e.status === 'trial').length),
          foot:'trial ainda válido' })}
        ${PP.kpi({ cls:'k-dang', lbl:'Bloqueadas', sm:true,
          val:String(lista.filter(e => situacao(e).chave === 'bloqueada').length), foot:'vencidas ou suspensas' })}
      </div>

      <div class="toolbar">
        <div class="mini-search">
          <svg class="ic"><use href="#i-busca"/></svg>
          <input class="inp" type="search" placeholder="Nome, e-mail ou CNPJ" value="${esc(fEmp.q)}"
                 data-inp="buscaEmpresa" aria-label="Buscar empresa">
        </div>
        <select class="inp" style="width:auto" data-chg="filtroEmpresa" aria-label="Situação">
          <option value="">Todas as situações</option>
          <option value="ativa"${fEmp.status === 'ativa' ? ' selected' : ''}>Em dia</option>
          <option value="trial"${fEmp.status === 'trial' ? ' selected' : ''}>Em teste</option>
          <option value="bloqueada"${fEmp.status === 'bloqueada' ? ' selected' : ''}>Bloqueadas</option>
        </select>
        <div class="row-end row">
          <button class="btn btn-primary" data-act="novaEmpresa"><svg class="ic"><use href="#i-plus"/></svg>Nova empresa</button>
        </div>
      </div>

      <div class="card">
        ${rows.length ? PP.tabela({
          act:'editarEmpresa', rows,
          cols:[
            { h:'Empresa', r:e => `<div class="row" style="gap:9px;flex-wrap:nowrap">
                <span class="av-mini">${esc(PP.iniciais(e.nome))}</span>
                <div><div class="strong">${esc(e.nome)}</div>
                  <span class="mini">${esc(e.email || '')}${e.cidade ? ' · ' + esc(e.cidade) + '/' + esc(e.uf || '') : ''}</span></div></div>` },
            { h:'Plano', r:e => `<span class="small">${esc((e.planos && e.planos.nome) || '—')}</span>
                <span class="mini">${e.ciclo === 'anual' ? 'anual' : 'mensal'}</span>` },
            { h:'Licença até', r:e => {
                const d = PP.diasEntre(PP.hoje(), e.licenca_ate);
                return `<b class="small">${esc(PP.dt(e.licenca_ate))}</b><span class="mini">${
                  d < 0 ? `vencida há ${-d} dia(s)` : d === 0 ? 'vence hoje' : `faltam ${d} dia(s)`}</span>`;
              } },
            { h:'Situação', r:e => { const s = situacao(e); return PP.badge(s.nome, s.cls); } },
            { h:'', cls:'acts', r:e => `
                <button class="btn btn-sm" data-act="acessosEmpresa" data-id="${esc(e.id)}">Acessos</button>
                <button class="btn btn-sm" data-act="faturasDaEmpresa" data-id="${esc(e.id)}">Faturas</button>
                <button class="btn btn-sm" data-act="gerarFatura" data-id="${esc(e.id)}">Gerar fatura</button>` }
          ]
        }) : '<div class="card-bd"><div class="empty-sm">Nenhuma empresa com esse filtro.</div></div>'}
      </div>`;
  }
});

S.situacaoEmpresa = situacao;

function situacao(e) {
  if (e.status === 'cancelada') return { chave:'bloqueada', nome:'Cancelada', cls:'' };
  if (e.status === 'suspensa')  return { chave:'bloqueada', nome:'Suspensa', cls:'b-dang' };
  if (e.licenca_ate < PP.hoje()) return { chave:'bloqueada', nome:'Vencida', cls:'b-dang' };
  if (e.status === 'inadimplente') return { chave:'bloqueada', nome:'Inadimplente', cls:'b-dang' };
  if (e.status === 'trial') return { chave:'trial', nome:'Em teste', cls:'b-warn' };
  return { chave:'ativa', nome:'Em dia', cls:'b-ok' };
}

PP.on('buscaEmpresa', PP.debounce((d, el) => { fEmp.q = el.value; PP.render(); }, 250));
PP.on('filtroEmpresa', (d, el) => { fEmp.status = el.value; PP.render(); });

PP.on('novaEmpresa', () => formEmpresa(null));
PP.on('editarEmpresa', d => formEmpresa((CACHE.empresas || []).find(e => e.id === d.id)));
PP.on('acessosEmpresa', d => {
  const empresa = (CACHE.empresas || []).find(e => e.id === d.id);
  if (empresa) abrirAcessosEmpresa(empresa);
});

async function abrirAcessosEmpresa(empresa) {
  try {
    const admins = await consultar(c => c.from('usuarios')
      .select('id,nome,login,ativo,auth_uid')
      .eq('empresa_id', empresa.id).eq('papel', 'admin').order('nome'));
    const key = PP.uid('adm');
    PP.on(key, async (d, el) => {
      const box = el.closest('.modal-box');
      const { ok, data } = PP.lerForm(box.querySelector('#formAdminEmpresa'));
      if (!ok) return;
      el.disabled = true;
      try {
        const { error } = await db().rpc('cadastrar_admin_empresa', {
          p_empresa:empresa.id, p_nome:data.nomeAdmin, p_email:data.emailAdmin
        });
        if (error) throw new Error(PP.nuvem.traduzErro(error.message));
        PP.closeTop();
        PP.toast('Administrador cadastrado', 'ok');
        await abrirAcessosEmpresa(empresa);
      } catch (err) { PP.toast(err.message, 'err'); }
      finally { el.disabled = false; }
    });
    PP.modal({
      title:'Acessos de ' + empresa.nome, size:'lg',
      body:`<div class="stack mb">${admins.length ? admins.map(u => `
        <div class="row" style="justify-content:space-between;gap:12px">
          <div><b>${esc(u.nome)}</b><div class="mini">${esc(u.login)}</div></div>
          ${PP.badge(u.ativo ? (u.auth_uid ? 'Conta vinculada' : 'Aguardando acesso') : 'Inativo',
            u.ativo ? (u.auth_uid ? 'b-ok' : 'b-warn') : 'b-dang')}
        </div>`).join('') : '<div class="empty-sm">Nenhum administrador cadastrado.</div>'}</div>
        <form id="formAdminEmpresa">${PP.form([
          { sep:'Novo administrador' },
          { k:'nomeAdmin', l:'Nome', t:'text', col:6, req:true },
          { k:'emailAdmin', l:'E-mail de acesso', t:'email', col:6, req:true }
        ])}</form>
        <div class="alert a-info mt"><svg class="ic"><use href="#i-alerta"/></svg>
          <div class="small">A pessoa cria a própria senha em “Primeiro acesso — criar minha conta”, usando este e-mail. Depois poderá cadastrar a equipe da empresa.</div>
        </div>`,
      actions:[{ txt:'Cadastrar administrador', cls:'btn-primary', act:key },
               { txt:'Fechar', act:'fechar' }]
    });
  } catch (err) { PP.toast(err.message, 'err'); }
}

function formEmpresa(e) {
  const novo = !e;
  const planos = CACHE.planos || [];
  const key = PP.uid('emp');

  PP.on(key, async (d, el) => {
    const { ok, data } = PP.lerForm(el.closest('.modal-box').querySelector('#formEmpresa'));
    if (!ok) return;
    const linha = {
      nome:data.nome, razao_social:data.razaoSocial || null, cnpj:data.cnpj || null,
      email:data.email, telefone:data.telefone || null, cidade:data.cidade || null,
      uf:data.uf || null, plano_id:data.planoId || null, ciclo:data.ciclo || 'mensal',
      status:data.status, licenca_ate:data.licencaAte, obs:data.obs || null
    };
    el.disabled = true;
    try {
      if (novo) {
        const { error } = await db().rpc('criar_empresa_com_admin', {
          p_empresa:linha, p_nome_admin:data.nomeAdmin, p_email_admin:data.emailAdmin
        });
        if (error) throw new Error(PP.nuvem.traduzErro(error.message));
      } else {
        const { error } = await db().from('empresas').update(linha).eq('id', e.id);
        if (error) throw new Error(PP.nuvem.traduzErro(error.message));
      }
      S.limpar('empresas');
      PP.closeTop();
      PP.toast(novo ? 'Empresa cadastrada' : 'Empresa salva', 'ok');
      PP.render();
    } catch (err) { PP.toast(err.message, 'err'); }
    finally { el.disabled = false; }
  });

  const hoje = PP.hoje();
  PP.modal({
    title: novo ? 'Nova empresa cliente' : e.nome, size:'lg',
    body:`<form id="formEmpresa">${PP.form([
      { sep:'Identificação' },
      { k:'nome', l:'Nome fantasia', t:'text', col:7, req:true },
      { k:'cnpj', l:'CNPJ', t:'text', col:5, val:'doc' },
      { k:'razaoSocial', l:'Razão social', t:'text', col:12 },
      { k:'email', l:'E-mail de contato', t:'email', col:6, req:true },
      { k:'telefone', l:'Telefone', t:'tel', col:6 },
      { k:'cidade', l:'Cidade', t:'text', col:8 },
      { k:'uf', l:'UF', t:'text', col:4 },
      { sep:'Licença' },
      { k:'planoId', l:'Plano', t:'select', col:6, vazio:false,
        opts:planos.map(p => ({ v:p.id, l:`${p.nome} — ${PP.money0(p.preco_mes)}/mês` })) },
      { k:'ciclo', l:'Ciclo de cobrança', t:'select', col:6, vazio:false,
        opts:[{ v:'mensal', l:'Mensal' }, { v:'anual', l:'Anual (2 meses de desconto)' }] },
      { k:'status', l:'Situação', t:'select', col:6, vazio:false,
        opts:[{ v:'trial', l:'Em teste' }, { v:'ativa', l:'Ativa' },
              { v:'inadimplente', l:'Inadimplente' }, { v:'suspensa', l:'Suspensa' },
              { v:'cancelada', l:'Cancelada' }] },
      { k:'licencaAte', l:'Licença válida até', t:'date', col:6, req:true,
        hint:'Passou desta data, a empresa entra em somente leitura' },
      { k:'obs', l:'Observações', t:'textarea', col:12, rows:2 },
      ...(novo ? [
        { sep:'Primeiro administrador da empresa' },
        { k:'nomeAdmin', l:'Nome do administrador', t:'text', col:6, req:true },
        { k:'emailAdmin', l:'E-mail do administrador', t:'email', col:6, req:true,
          hint:'É com este e-mail que ele cria a conta e entra pela primeira vez' }
      ] : [])
    ], e ? {
      nome:e.nome, razaoSocial:e.razao_social, cnpj:e.cnpj, email:e.email, telefone:e.telefone,
      cidade:e.cidade, uf:e.uf, planoId:e.plano_id, ciclo:e.ciclo, status:e.status,
      licencaAte:e.licenca_ate, obs:e.obs
    } : { ciclo:'mensal', status:'trial', licencaAte:PP.addDias(hoje, 14),
          planoId:(planos[0] || {}).id })}</form>
    ${novo ? `<div class="alert a-info mt"><svg class="ic"><use href="#i-alerta"/></svg>
      <div class="small">O administrador é cadastrado junto, mas <b>a senha é dele</b>: ele abre o
      sistema, clica em “Primeiro acesso — criar minha conta” e usa esse mesmo e-mail.</div></div>` : ''}`,
    actions:[
      { txt: novo ? 'Cadastrar empresa' : 'Salvar', cls:'btn-primary', act:key },
      !novo ? { txt:'Acessos', act:'acessosEmpresa', data:{ id:e.id } } : null,
      { txt:'Cancelar', act:'fechar' }
    ]
  });
}

PP.on('gerarFatura', async d => {
  try {
    const { data, error } = await db().rpc('gerar_fatura', { p_empresa: d.id, p_dias_antes: 7 });
    if (error) throw new Error(PP.nuvem.traduzErro(error.message));
    const f = Array.isArray(data) ? data[0] : data;
    S.limpar('faturas');
    PP.toast(`Fatura de ${PP.money0(f.valor)} gerada — vence ${PP.dt(f.vencimento)}`, 'ok');
    PP.ir('faturas');
  } catch (e) { PP.toast(e.message, 'err'); }
});

PP.on('faturasDaEmpresa', d => { fFat.empresa = d.id; PP.ir('faturas'); });

/* ============================== PLANOS ============================== */

PP.view('planos', {
  titulo: 'Planos',
  sub: 'O que cada empresa pode contratar',
  render() {
    const planos = buscar('planos', () => consultar(c => c.from('planos').select('*').order('ordem')));
    const empresas = buscar('empresas', () => consultar(c => c.from('empresas').select('*, planos(nome)').order('nome')));
    if (!planos || !empresas) return carregando();

    return `
      <div class="toolbar">
        <div class="row-end row">
          <button class="btn btn-primary" data-act="novoPlano"><svg class="ic"><use href="#i-plus"/></svg>Novo plano</button>
        </div>
      </div>
      <div class="grid g-3">
        ${planos.map(p => {
          const qtd = empresas.filter(e => e.plano_id === p.id).length;
          return `<div class="card">
            <div class="card-hd"><div><h3>${esc(p.nome)}</h3>
              <div class="sub">${esc(p.descricao || '')}</div></div>
              <div class="right">${PP.badge(p.ativo ? 'Ativo' : 'Inativo', p.ativo ? 'b-ok' : '')}</div></div>
            <div class="card-bd">
              <div class="plano-preco">${esc(PP.money0(p.preco_mes))}<small>/mês</small></div>
              <div class="small muted" style="margin-bottom:12px">ou ${esc(PP.money0(p.preco_ano))} por ano</div>
              <ul class="plano-lista">
                ${(p.recursos || []).map(r => `<li><svg class="ic ic-sm"><use href="#i-check"/></svg>${esc(r)}</li>`).join('')}
              </ul>
              <div class="sep"></div>
              <dl class="dl">
                <dt>Usuários</dt><dd>${p.max_usuarios ? p.max_usuarios : 'sem limite'}</dd>
                <dt>Pedidos/mês</dt><dd>${p.max_pedidos_mes ? p.max_pedidos_mes : 'sem limite'}</dd>
                <dt>Empresas neste plano</dt><dd><b>${qtd}</b></dd>
              </dl>
            </div>
            <div class="card-ft"><button class="btn btn-sm" data-act="editarPlano" data-id="${esc(p.id)}">Editar</button></div>
          </div>`;
        }).join('')}
      </div>`;
  }
});

PP.on('novoPlano', () => formPlano(null));
PP.on('editarPlano', d => formPlano((CACHE.planos || []).find(p => p.id === d.id)));

function formPlano(p) {
  const novo = !p;
  const key = PP.uid('pl');
  PP.on(key, async (d, el) => {
    const { ok, data } = PP.lerForm(el.closest('.modal-box').querySelector('#formPlano'));
    if (!ok) return;
    const linha = {
      nome:data.nome, descricao:data.descricao || null,
      preco_mes:PP.n(data.precoMes), preco_ano:PP.n(data.precoAno),
      max_usuarios:PP.n(data.maxUsuarios), max_pedidos_mes:PP.n(data.maxPedidos),
      recursos:String(data.recursos || '').split('\n').map(s => s.trim()).filter(Boolean),
      ativo:!!data.ativo, ordem:PP.n(data.ordem)
    };
    try {
      if (novo) {
        linha.id = 'pl_' + PP.norm(data.nome).replace(/[^a-z0-9]/g, '').slice(0, 20);
        const { error } = await db().from('planos').insert(linha);
        if (error) throw new Error(PP.nuvem.traduzErro(error.message));
      } else {
        const { error } = await db().from('planos').update(linha).eq('id', p.id);
        if (error) throw new Error(PP.nuvem.traduzErro(error.message));
      }
      S.limpar('planos'); PP.closeTop(); PP.toast('Plano salvo', 'ok'); PP.render();
    } catch (err) { PP.toast(err.message, 'err'); }
  });

  PP.modal({
    title: novo ? 'Novo plano' : p.nome, size:'lg',
    body:`<form id="formPlano">${PP.form([
      { k:'nome', l:'Nome do plano', t:'text', col:8, req:true },
      { k:'ordem', l:'Ordem', t:'number', col:4, step:1 },
      { k:'descricao', l:'Descrição curta', t:'text', col:12 },
      { k:'precoMes', l:'Preço mensal (R$)', t:'money', col:6, req:true, val:'naoNegativo' },
      { k:'precoAno', l:'Preço anual (R$)', t:'money', col:6, req:true, val:'naoNegativo' },
      { k:'maxUsuarios', l:'Máximo de usuários', t:'number', col:6, step:1, hint:'0 = sem limite' },
      { k:'maxPedidos', l:'Máximo de pedidos/mês', t:'number', col:6, step:1, hint:'0 = sem limite' },
      { k:'recursos', l:'O que está incluso', t:'textarea', col:12, rows:5, hint:'Um item por linha' },
      { k:'ativo', l:'Plano disponível para contratação', t:'checkbox', col:12 }
    ], p ? {
      nome:p.nome, ordem:p.ordem, descricao:p.descricao, precoMes:p.preco_mes, precoAno:p.preco_ano,
      maxUsuarios:p.max_usuarios, maxPedidos:p.max_pedidos_mes,
      recursos:(p.recursos || []).join('\n'), ativo:p.ativo
    } : { ativo:true, ordem:9, maxUsuarios:0, maxPedidos:0 })}</form>`,
    actions:[{ txt:'Salvar', cls:'btn-primary', act:key }, { txt:'Cancelar', act:'fechar' }]
  });
}

/* ============================== FATURAS DA LICENÇA ============================== */

const fFat = { empresa:'', status:'' };

PP.view('faturas', {
  titulo: 'Faturas da licença',
  sub: () => {
    const l = CACHE.faturas;
    if (!l) return 'Carregando…';
    const ab = l.filter(f => f.status === 'aberta' || f.status === 'vencida');
    return ab.length ? `${ab.length} em aberto — ${PP.money0(ab.reduce((s, f) => s + PP.n(f.valor), 0))}`
                     : 'Nenhuma fatura em aberto';
  },
  render() {
    const lista = buscar('faturas', () => consultar(c => c.from('faturas_licenca')
      .select('*, empresas(nome)').order('vencimento', { ascending:false }).limit(500)));
    if (!lista) return carregando('Buscando as faturas…');

    let rows = lista;
    if (fFat.empresa) rows = rows.filter(f => f.empresa_id === fFat.empresa);
    if (fFat.status) rows = rows.filter(f => f.status === fFat.status);

    const abertas = lista.filter(f => f.status === 'aberta');
    const vencidas = lista.filter(f => f.status === 'vencida' || (f.status === 'aberta' && f.vencimento < PP.hoje()));
    const pagasMes = lista.filter(f => f.status === 'paga' && PP.mesKey(f.pago_em) === PP.mesKey(PP.hoje()));

    return `
      <div class="kpis mb">
        ${PP.kpi({ cls:'k-ok', lbl:'Recebido no mês', sm:true,
          val:PP.money0(pagasMes.reduce((s, f) => s + PP.n(f.valor), 0)), foot:`${pagasMes.length} fatura(s)` })}
        ${PP.kpi({ cls:'k-warn', lbl:'Em aberto', sm:true,
          val:PP.money0(abertas.reduce((s, f) => s + PP.n(f.valor), 0)), foot:`${abertas.length} fatura(s)` })}
        ${PP.kpi({ cls:'k-dang', lbl:'Vencidas', sm:true,
          val:PP.money0(vencidas.reduce((s, f) => s + PP.n(f.valor), 0)), foot:`${vencidas.length} fatura(s)` })}
      </div>

      <div class="toolbar">
        <select class="inp" style="width:auto" data-chg="filtroFatura" data-f="status" aria-label="Situação">
          <option value="">Todas</option>
          <option value="aberta"${fFat.status === 'aberta' ? ' selected' : ''}>Em aberto</option>
          <option value="vencida"${fFat.status === 'vencida' ? ' selected' : ''}>Vencidas</option>
          <option value="paga"${fFat.status === 'paga' ? ' selected' : ''}>Pagas</option>
        </select>
        ${fFat.empresa ? `<button class="btn btn-sm" data-act="limparFiltroFatura">
          Só ${esc((lista.find(f => f.empresa_id === fFat.empresa) || {}).empresas?.nome || 'uma empresa')} ✕</button>` : ''}
        <div class="row-end row">
          <button class="btn" data-act="atualizarLicencas"><svg class="ic"><use href="#i-relogio"/></svg>Atualizar vencimentos</button>
        </div>
      </div>

      <div class="card">
        ${rows.length ? PP.tabela({
          rows:PP.paginar('faturas', rows).linhas,
          cols:[
            { h:'Empresa', r:f => `<div class="strong">${esc((f.empresas && f.empresas.nome) || f.empresa_id)}</div>
              <span class="mini">${esc(f.descricao)}</span>` },
            { h:'Competência', r:f => `<span class="small">${esc(PP.mesNome(f.competencia))}</span>` },
            { h:'Vencimento', r:f => {
                const atraso = f.status !== 'paga' && f.vencimento < PP.hoje();
                return `<b class="small"${atraso ? ' style="color:var(--dang)"' : ''}>${esc(PP.dt(f.vencimento))}</b>`;
              } },
            { h:'Situação', r:f => {
                const m = { aberta:['Em aberto','b-info'], paga:['Paga','b-ok'],
                            vencida:['Vencida','b-dang'], cancelada:['Cancelada',''] }[f.status] || [f.status,''];
                return PP.badge(m[0], m[1]) + (f.gateway ? `<span class="mini">${esc(f.gateway)}</span>` : '');
              } },
            { h:'Valor', cls:'num', r:f => `<b>${esc(PP.money(f.valor))}</b>` },
            { h:'', cls:'acts', r:f => f.status === 'paga'
              ? `<span class="tiny faint">${esc(PP.dt(f.pago_em))}</span>`
              : `${f.gateway_url
                    ? `<a class="btn btn-sm" href="${esc(f.gateway_url)}" target="_blank" rel="noopener">Link</a> `
                    : `<button class="btn btn-sm" data-act="cobrarMP" data-id="${esc(f.id)}">Cobrar</button> `}
                 <button class="btn btn-sm btn-ok" data-act="baixarFatura" data-id="${esc(f.id)}">Dar baixa</button>` }
          ]
        }) + PP.paginar('faturas', rows).html
          : '<div class="card-bd"><div class="empty-sm">Nenhuma fatura com esse filtro.</div></div>'}
      </div>`;
  }
});

PP.on('filtroFatura', (d, el) => { fFat.status = el.value; PP.resetPagina('faturas'); PP.render(); });
PP.on('limparFiltroFatura', () => { fFat.empresa = ''; PP.render(); });

PP.on('atualizarLicencas', async () => {
  try {
    const { data, error } = await db().rpc('atualizar_licencas');
    if (error) throw new Error(PP.nuvem.traduzErro(error.message));
    const r = Array.isArray(data) ? data[0] : data;
    S.limpar();
    PP.toast(`${r.faturas_vencidas} fatura(s) marcada(s) como vencida · ${r.empresas_bloqueadas} empresa(s) bloqueada(s)`, 'ok');
    PP.render();
  } catch (e) { PP.toast(e.message, 'err'); }
});

PP.on('baixarFatura', async d => {
  const f = (CACHE.faturas || []).find(x => x.id === d.id);
  if (!await PP.confirmar(`Dar baixa em ${PP.money(f.valor)} de ${(f.empresas && f.empresas.nome) || ''}?`, {
    title:'Registrar pagamento', okTxt:'Dar baixa',
    aviso:'A licença da empresa é estendida até o fim do período pago.' })) return;
  try {
    const { error } = await db().rpc('baixar_fatura_manual', { p_fatura:d.id, p_pago_em:PP.hoje() });
    if (error) throw new Error(PP.nuvem.traduzErro(error.message));
    S.limpar();
    PP.toast('Pagamento registrado e licença estendida', 'ok');
    PP.render();
  } catch (e) { PP.toast(e.message, 'err'); }
});

PP.on('cobrarMP', async d => {
  PP.toast('Gerando cobrança no Mercado Pago…');
  try {
    const { data: s } = await db().auth.getSession();
    const token = s && s.session ? s.session.access_token : '';
    const r = await fetch(PP.nuvem.urlFuncao('licenca-mercadopago/cobranca'), {
      method:'POST',
      headers:{ 'Content-Type':'application/json', Authorization:'Bearer ' + token },
      body: JSON.stringify({ faturaId: d.id })
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j.erro || 'o Mercado Pago recusou');
    S.limpar('faturas');
    PP.render();
    PP.modal({
      title:'Cobrança criada', size:'sm',
      body:`<p style="margin-top:0;font-size:13.5px;line-height:1.65">Mande este link para a empresa. A baixa é automática assim que o pagamento for aprovado.</p>
        <div class="f"><input class="inp" value="${esc(j.url)}" readonly data-act="selecionarTudo"></div>
        <a class="btn btn-teal btn-block" href="${esc(j.url)}" target="_blank" rel="noopener" style="margin-top:8px">Abrir a página de pagamento</a>`,
      actions:[{ txt:'Fechar', act:'fechar' }]
    });
  } catch (e) {
    PP.toast('Não consegui gerar a cobrança: ' + e.message, 'err');
  }
});

/* ============================== SAÚDE DO SISTEMA ============================== */

PP.view('saude', {
  titulo: 'Saúde do sistema',
  sub: 'Está funcionando? E como cada cliente usa?',
  render() {
    const pulso = buscar('pulso', () => consultar(c => c.rpc('pulso_do_servico')));
    const uso = buscar('uso', () => consultar(c => c.rpc('uso_das_empresas')));
    const saude = buscar('checagens', () => consultar(c => c.rpc('saude_do_sistema')));
    if (!pulso || !uso || !saude) return carregando('Medindo…');

    const problemas = saude.filter(s => s.qtd > 0);
    const erros = problemas.filter(s => s.gravidade === 'erro');
    const tudoOk = problemas.length === 0;

    return `
      <div class="toolbar">
        <div class="row-end row">
          <button class="btn" data-act="remedirSaude"><svg class="ic"><use href="#i-pulso"/></svg>Medir de novo</button>
        </div>
      </div>

      <div class="alert ${tudoOk ? 'a-ok' : erros.length ? 'a-dang' : 'a-warn'} mb">
        <svg class="ic"><use href="#${tudoOk ? 'i-check' : 'i-alerta'}"/></svg>
        <div>${tudoOk
          ? '<b>Nada torto.</b> As oito checagens de integridade passaram em todas as empresas.'
          : `<b>${problemas.length} ponto(s) de atenção${erros.length ? ', sendo ' + erros.length + ' erro(s)' : ''}.</b>
             Erro é bug ou dado inconsistente; aviso é operação parada. Detalhe ao lado.`}</div>
      </div>

      <div class="grid g-2 mb">
        <div class="card">
          <div class="card-hd"><div><h3>Pulso do serviço</h3><div class="sub">Agora</div></div></div>
          <div class="card-bd"><dl class="dl">
            ${pulso.map(p => `<dt>${esc(p.indicador)}</dt><dd><b>${esc(p.valor)}</b></dd>`).join('')}
          </dl></div>
        </div>

        <div class="card">
          <div class="card-hd"><div><h3>Integridade dos dados</h3>
            <div class="sub">Checagens que apontam para bug ou operação parada</div></div></div>
          <div class="card-bd">
            ${problemas.length ? problemas.map(s => `
              <div class="att-item">
                <span class="dot ${s.gravidade === 'erro' ? 'dot-dang' : 'dot-warn'}"></span>
                <div class="txt"><b>${esc(s.checagem)}</b><small>${esc(s.empresa)}</small></div>
                <div class="val">${s.qtd}</div>
              </div>`).join('')
              : '<div class="empty-sm">Tudo certo em todas as empresas.</div>'}
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-hd"><div><h3>Uso por empresa</h3>
          <div class="sub">Quem está usando de verdade e quem parou</div></div></div>
        ${PP.tabela({ rows:uso, cols:[
          { h:'Empresa', r:u => `<div class="strong">${esc(u.empresa)}</div>
            <span class="mini">${esc(u.plano)} · licença até ${esc(PP.dt(u.licenca_ate))}</span>` },
          { h:'Usuários', cls:'num', r:u => `<b>${u.usuarios_com_conta}</b><span class="mini">de ${u.usuarios} cadastrados</span>` },
          { h:'Último acesso', r:u => u.ultimo_acesso
              ? `<span class="small">${esc(PP.tempoRelativo(String(u.ultimo_acesso).slice(0, 10)))}</span>`
              : '<span class="tiny faint">nunca</span>' },
          { h:'Leads', cls:'num', r:u => String(u.leads) },
          { h:'Pedidos no mês', cls:'num', r:u => `<b>${u.pedidos_mes}</b>` },
          { h:'Faturamento no mês', cls:'num', r:u => esc(PP.moneyK(u.faturamento_mes)) },
          { h:'Registros', cls:'num', r:u => `<span class="tnum">${u.registros}</span>` }
        ]})}
      </div>`;
  }
});

PP.on('remedirSaude', () => { S.limpar('pulso'); S.limpar('uso'); S.limpar('checagens'); PP.render(); });

/* ============================== TRILHA DE AUDITORIA ============================== */

const fAud = { q:'', tabela:'', acao:'', empresa:'' };

function telaAuditoria(global) {
  const chave = global ? 'trilhaGlobal' : 'trilhaEmpresa';
  const linhas = buscar(chave, () => consultar(c => {
    let q = c.from('auditoria').select('*').order('em', { ascending:false }).limit(600);
    if (!global) q = q.eq('empresa_id', PP.empresaAtual());
    return q;
  }));
  if (!linhas) return carregando('Lendo a trilha…');

  let rows = linhas;
  if (fAud.tabela) rows = rows.filter(a => a.tabela === fAud.tabela);
  if (fAud.acao) rows = rows.filter(a => a.acao === fAud.acao);
  if (fAud.q) { const q = PP.norm(fAud.q);
    rows = rows.filter(a => PP.norm(a.usuario_nome || '').includes(q)
      || PP.norm(a.resumo || '').includes(q) || PP.norm(a.registro_id || '').includes(q)); }

  const tabelas = Array.from(new Set(linhas.map(a => a.tabela))).sort();
  const ACAO = { insert:['Criou','b-ok'], update:['Alterou','b-info'],
                 delete:['Excluiu','b-dang'], evento:['Evento','b-areia'] };

  return `
    <div class="toolbar">
      <div class="mini-search">
        <svg class="ic"><use href="#i-busca"/></svg>
        <input class="inp" type="search" placeholder="Pessoa, registro ou descrição" value="${esc(fAud.q)}"
               data-inp="buscaAud" aria-label="Buscar na trilha">
      </div>
      <select class="inp" style="width:auto" data-chg="filtroAud" data-f="tabela" aria-label="Tabela">
        <option value="">Todas as tabelas</option>
        ${tabelas.map(t => `<option value="${esc(t)}"${fAud.tabela === t ? ' selected' : ''}>${esc(t)}</option>`).join('')}
      </select>
      <select class="inp" style="width:auto" data-chg="filtroAud" data-f="acao" aria-label="Ação">
        <option value="">Toda ação</option>
        ${Object.keys(ACAO).map(a => `<option value="${a}"${fAud.acao === a ? ' selected' : ''}>${ACAO[a][0]}</option>`).join('')}
      </select>
      <div class="row-end row">
        <button class="btn" data-act="recarregarTrilha" data-g="${global ? 1 : 0}"><svg class="ic"><use href="#i-relogio"/></svg>Atualizar</button>
        <button class="btn" data-act="exportarTrilha"><svg class="ic"><use href="#i-down"/></svg>CSV</button>
      </div>
    </div>

    <div class="card">
      <div class="card-hd"><div><h3>Quem mexeu no quê</h3>
        <div class="sub">${rows.length} registro(s) · os últimos 600 · gravado pelo banco, não pelo navegador</div></div></div>
      ${rows.length ? PP.tabela({
        act:'verAuditoria', rows:PP.paginar('trilha', rows).linhas,
        cols:[
          { h:'Quando', w:'128px', r:a => `<b class="small">${esc(PP.dtHora(a.em))}</b>
            <span class="mini">${esc(PP.tempoRelativo(String(a.em).slice(0, 10)))}</span>` },
          { h:'Quem', r:a => `<div class="strong">${esc(a.usuario_nome || '—')}</div>
            <span class="mini">${esc(PP.PAPEIS[a.papel] ? PP.PAPEIS[a.papel].nome : (a.papel || ''))}</span>` },
          global ? { h:'Empresa', r:a => `<span class="small">${esc(a.empresa_id || '—')}</span>` } : null,
          { h:'Ação', r:a => { const m = ACAO[a.acao] || [a.acao, '']; return PP.badge(m[0], m[1]); } },
          { h:'Onde', r:a => `<span class="small">${esc(a.tabela)}</span>
            <span class="mini">${esc(a.resumo || a.registro_id || '')}</span>` },
          { h:'Campos', r:a => a.campos && a.campos.length
              ? `<span class="small">${esc(a.campos.slice(0, 3).join(', '))}${a.campos.length > 3 ? ` +${a.campos.length - 3}` : ''}</span>`
              : '<span class="tiny faint">—</span>' },
          { h:'Origem', r:a => a.origem === 'banco'
              ? PP.badge('Banco', 'b-teal')
              : PP.badge('App', '') }
        ]
      }) + PP.paginar('trilha', rows).html
        : '<div class="card-bd"><div class="empty-sm">Nada registrado com esse filtro.</div></div>'}
      <div class="card-ft">
        <svg class="ic ic-sm faint"><use href="#i-alerta"/></svg>
        <span class="small muted"><b>Banco</b> é gravado por gatilho e não dá para burlar — nem pelo DevTools.
        <b>App</b> é informado pelo sistema (login, exportação) e serve para acompanhar, não como prova.
        A trilha não pode ser editada nem apagada por ninguém.</span>
      </div>
    </div>`;
}

PP.view('auditoria', { titulo:'Trilha de auditoria', sub:'O que aconteceu na sua empresa',
  render(){ return telaAuditoria(false); } });
PP.view('trilha', { titulo:'Auditoria global', sub:'Todas as empresas',
  render(){ return telaAuditoria(true); } });

PP.on('buscaAud', PP.debounce((d, el) => { fAud.q = el.value; PP.resetPagina('trilha'); PP.render(); }, 250));
PP.on('filtroAud', (d, el) => { fAud[d.f] = el.value; PP.resetPagina('trilha'); PP.render(); });
PP.on('recarregarTrilha', d => { S.limpar(PP.n(d.g) ? 'trilhaGlobal' : 'trilhaEmpresa'); PP.render(); });

PP.on('verAuditoria', d => {
  const fonte = CACHE.trilhaGlobal || CACHE.trilhaEmpresa || [];
  const a = fonte.find(x => String(x.id) === String(d.id));
  if (!a) return;
  const campo = k => {
    const de = a.antes ? a.antes[k] : undefined;
    const para = a.depois ? a.depois[k] : undefined;
    return `<tr><td>${esc(k)}</td>
      <td class="faint">${esc(JSON.stringify(de === undefined ? null : de))}</td>
      <td><b>${esc(JSON.stringify(para === undefined ? null : para))}</b></td></tr>`;
  };
  const chaves = a.campos && a.campos.length ? a.campos
    : Object.keys(a.depois || a.antes || {}).filter(k => k !== 'empresa_id').slice(0, 20);
  PP.modal({
    title:`${a.usuario_nome || '—'} · ${a.acao} em ${a.tabela}`,
    sub:PP.dtHora(a.em), size:'lg',
    body:`<dl class="dl mb">
        <dt>Registro</dt><dd>${esc(a.resumo || a.registro_id || '—')}</dd>
        <dt>Origem</dt><dd>${a.origem === 'banco' ? 'gatilho do banco (não falsificável)' : 'informado pelo app'}</dd>
        ${a.empresa_id ? `<dt>Empresa</dt><dd>${esc(a.empresa_id)}</dd>` : ''}
      </dl>
      ${chaves.length ? `<div class="tbl-wrap"><table class="tbl">
        <thead><tr><th>Campo</th><th>Antes</th><th>Depois</th></tr></thead>
        <tbody>${chaves.map(campo).join('')}</tbody></table></div>`
        : '<div class="empty-sm">Sem detalhe de campo.</div>'}`,
    actions:[{ txt:'Fechar', act:'fechar' }]
  });
});

PP.on('exportarTrilha', () => {
  const fonte = CACHE.trilhaGlobal || CACHE.trilhaEmpresa || [];
  const linhas = [['Quando','Empresa','Quem','Papel','Ação','Tabela','Registro','Campos','Origem']];
  fonte.forEach(a => linhas.push([PP.dtHora(a.em), a.empresa_id || '', a.usuario_nome || '', a.papel || '',
    a.acao, a.tabela, a.resumo || a.registro_id || '', (a.campos || []).join(' '), a.origem]));
  PP.baixar(`auditoria-${PP.hoje()}.csv`, PP.csv(linhas), 'text/csv;charset=utf-8');
  S.evento('exportou', 'Exportou a trilha de auditoria em CSV', 'auditoria');
});

/* ============================== MINHA LICENÇA (lado do cliente) ============================== */

PP.view('licenca', {
  titulo: 'Minha licença',
  sub: () => {
    const c = S.contexto;
    if (!c) return 'Carregando…';
    return c.bloqueada ? 'Licença vencida — o sistema está em somente leitura'
                       : `Válida até ${PP.dt(c.empresa.licenca_ate)}`;
  },
  render() {
    const c = S.contexto;
    if (!c) return carregando('Buscando sua licença…');
    const e = c.empresa;
    const abertas = c.faturas.filter(f => f.status === 'aberta' || f.status === 'vencida');

    return `
      <div class="kpis mb">
        ${PP.kpi({ cls: c.bloqueada ? 'k-dang' : 'k-teal', lbl:'Situação', sm:true,
          val: situacao(e).nome, foot:`licença até ${PP.dt(e.licenca_ate)}` })}
        ${PP.kpi({ lbl:'Dias restantes', sm:true,
          val: c.diasParaVencer < 0 ? 'vencida' : String(c.diasParaVencer) })}
        ${PP.kpi({ cls:'k-warn', lbl:'Faturas em aberto', sm:true, val:String(abertas.length),
          foot:PP.money0(abertas.reduce((s, f) => s + PP.n(f.valor), 0)) })}
      </div>

      ${c.bloqueada ? `<div class="alert a-dang mb"><svg class="ic"><use href="#i-alerta"/></svg>
        <div><b>O sistema está em somente leitura.</b> Você continua vendo tudo e consegue baixar
        o backup em Configurações — mas não dá para gravar até a licença ser renovada.</div></div>` : ''}

      <div class="grid g-1-2">
        <div class="card">
          <div class="card-hd"><div><h3>Contrato</h3></div></div>
          <div class="card-bd"><dl class="dl">
            <dt>Empresa</dt><dd><b>${esc(e.nome)}</b></dd>
            ${e.cnpj ? `<dt>CNPJ</dt><dd>${esc(e.cnpj)}</dd>` : ''}
            <dt>Ciclo</dt><dd>${e.ciclo === 'anual' ? 'Anual' : 'Mensal'}</dd>
            <dt>Licença até</dt><dd><b>${esc(PP.dt(e.licenca_ate))}</b></dd>
            <dt>Contato</dt><dd>${esc(e.email)}</dd>
          </dl></div>
        </div>

        <div class="card">
          <div class="card-hd"><div><h3>Faturas</h3><div class="sub">As mais recentes primeiro</div></div></div>
          ${c.faturas.length ? PP.tabela({ rows:c.faturas, cols:[
            { h:'Competência', r:f => `<b class="small">${esc(PP.mesNome(f.competencia))}</b>
              <span class="mini">${esc(f.descricao)}</span>` },
            { h:'Vencimento', r:f => esc(PP.dt(f.vencimento)) },
            { h:'Situação', r:f => {
                const m = { aberta:['Em aberto','b-info'], paga:['Paga','b-ok'],
                            vencida:['Vencida','b-dang'], cancelada:['Cancelada',''] }[f.status] || [f.status,''];
                return PP.badge(m[0], m[1]); } },
            { h:'Valor', cls:'num', r:f => `<b>${esc(PP.money(f.valor))}</b>` },
            { h:'', cls:'acts', r:f => f.status !== 'paga' && f.gateway_url
                ? `<a class="btn btn-sm btn-teal" href="${esc(f.gateway_url)}" target="_blank" rel="noopener">Pagar</a>`
                : f.status === 'paga' ? `<span class="tiny faint">${esc(PP.dt(f.pago_em))}</span>` : '' }
          ]}) : '<div class="card-bd"><div class="empty-sm">Nenhuma fatura emitida ainda.</div></div>'}
          <div class="card-ft">
            <svg class="ic ic-sm faint"><use href="#i-alerta"/></svg>
            <span class="small muted">Não achou o link de pagamento? Fale com o suporte — a cobrança é emitida por lá.</span>
          </div>
        </div>
      </div>`;
  }
});

})();
