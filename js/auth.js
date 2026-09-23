/* ==========================================================================
   PiscinaPro — auth.js
   Login pelo Supabase Auth, papéis de acesso e escopo de dados por vendedor.

   Quem decide o acesso é o BANCO. A senha é do Supabase Auth, e cada consulta
   é filtrada pelas políticas (RLS) conforme o papel do usuário. O que este
   arquivo faz é esconder da tela o que o banco já não entregaria — conforto,
   não barreira. Mexer no DevTools daqui não abre nada: a barreira está do
   outro lado.

   O vínculo entre a conta da nuvem e a pessoa é o E-MAIL: o administrador
   cadastra o usuário com o e-mail dele em `login`, a pessoa cria a conta com
   esse mesmo e-mail e a função `reivindicar_usuario()` liga os dois na
   primeira entrada.
   ========================================================================== */
(function () {
'use strict';
const PP = window.PP;
const esc = PP.esc;

PP.PAPEIS = {
  admin:    { nome:'Administrador',  desc:'Acesso total, inclusive configurações' },
  gerente:  { nome:'Gerente',        desc:'Vê tudo, aprova descontos fora da alçada' },
  vendedor: { nome:'Vendedor',       desc:'Só a própria carteira; não vê custo nem margem' },
  obra:     { nome:'Equipe de obra', desc:'Agenda, obras, chamados e estoque' },
  provedor: { nome:'Provedor',      desc:'Administra as empresas clientes e a cobrança da licença' }
};

/* Quem entra em cada tela */
const ACESSO = {
  dashboard:  ['admin','gerente','vendedor','obra'],
  funil:      ['admin','gerente','vendedor'],
  leads:      ['admin','gerente','vendedor'],
  orcamentos: ['admin','gerente','vendedor'],
  pedidos:    ['admin','gerente','vendedor'],
  clientes:   ['admin','gerente','vendedor'],
  pdv:        ['admin','gerente','vendedor'],
  vendas:     ['admin','gerente','vendedor'],
  agenda:     ['admin','gerente','obra'],
  obras:      ['admin','gerente','obra'],
  produtos:   ['admin','gerente'],
  estoque:    ['admin','gerente','obra'],
  compras:    ['admin','gerente'],
  contratos:  ['admin','gerente','vendedor'],
  chamados:   ['admin','gerente','obra','vendedor'],
  financeiro: ['admin','gerente'],
  fluxo:      ['admin','gerente'],
  dre:        ['admin','gerente'],
  comissoes:  ['admin','gerente','vendedor'],
  vendedores: ['admin','gerente'],
  relatorios: ['admin','gerente'],
  config:     ['admin'],
  auditoria:  ['admin','gerente'],
  licenca:    ['admin'],
  /* área do provedor: ninguém de dentro das empresas entra */
  empresas:   ['provedor'],
  planos:     ['provedor'],
  faturas:    ['provedor'],
  saude:      ['provedor'],
  trilha:     ['provedor']
};

let SESSAO = null;


/* ============================== SESSÃO ============================== */

PP.usuario = () => SESSAO;
PP.ehGestor = () => !!SESSAO && (SESSAO.papel === 'admin' || SESSAO.papel === 'gerente');
PP.ehAdmin = () => !!SESSAO && SESSAO.papel === 'admin';
PP.ehProvedor = () => !!SESSAO && SESSAO.papel === 'provedor';
PP.empresaAtual = () => (SESSAO && SESSAO.empresaId) || '';
PP.podeVerCusto = () => PP.ehGestor();
PP.vendedorAtual = () => (SESSAO && SESSAO.vendedorId) || '';

PP.podeAcessar = view => {
  if (!SESSAO) return false;
  const lista = ACESSO[view];
  return !lista || lista.includes(SESSAO.papel);
};

/**
 * Filtra uma lista pela carteira do vendedor logado.
 * Gestores recebem a lista inteira.
 */
PP.escopo = (arr, campo) => {
  if (!SESSAO || PP.ehGestor()) return arr;
  const v = PP.vendedorAtual();
  if (!v) return arr;
  return arr.filter(x => x[campo || 'vendedorId'] === v);
};

/** Clientes que passaram pela mão do vendedor logado (lead, orçamento ou pedido). */
PP.clientesVisiveis = () => {
  const todos = PP.all('clientes');
  if (PP.ehGestor()) return todos;
  const v = PP.vendedorAtual();
  if (!v) return todos;
  const ids = new Set();
  PP.where('pedidos', p => p.vendedorId === v).forEach(p => ids.add(p.clienteId));
  PP.where('orcamentos', o => o.vendedorId === v).forEach(o => o.clienteId && ids.add(o.clienteId));
  PP.where('leads', l => l.vendedorId === v).forEach(l => {
    const c = todos.find(x => x.leadId === l.id);
    if (c) ids.add(c.id);
  });
  return todos.filter(c => ids.has(c.id));
};

/**
 * Define quem está logado SEM persistir. É o único ponto que escreve em SESSAO,
 * então permissões e escopo têm uma fonte única — e os testes conseguem simular
 * um papel sem passar pela tela de login.
 */
PP.definirSessao = u => {
  SESSAO = u ? { id:u.id, nome:u.nome, login:u.login, papel:u.papel,
                 vendedorId:u.vendedorId || '', empresaId:u.empresaId || '' } : null;
  return SESSAO;
};

/**
 * Descobre quem é a conta autenticada e liga com o cadastro do sistema.
 * A sessão em si é do Supabase Auth — não guardamos nada aqui.
 */
async function identificar() {
  const cli = await PP.nuvem.conectar();
  if (!PP.nuvem.ligada) { PP.definirSessao(null); return null; }
  const { data, error } = await cli.rpc('reivindicar_usuario');
  if (error) throw new Error(PP.nuvem.traduzErro(error.message));
  const linha = Array.isArray(data) ? data[0] : data;
  if (!linha || !linha.id) { PP.definirSessao(null); return null; }
  const sessao = PP.definirSessao({
    id: linha.id, nome: linha.nome, login: linha.login, papel: linha.papel,
    vendedorId: linha.vendedor_id || '', empresaId: linha.empresa_id || ''
  });
  if (PP.saas) await PP.saas.carregarContexto();
  return sessao;
}
PP.identificar = identificar;

/** Boot: já existe sessão válida do Auth? Então carrega os dados e entra. */
PP.restaurarSessao = async () => {
  const u = await identificar();
  if (!u) return false;
  await PP.recarregarTudo();
  return true;
};

PP.entrar = async (email, senha) => {
  let cli;
  try { cli = await PP.nuvem.conectar(); }
  catch (e) { return { ok:false, erro:PP.nuvem.traduzErro(e.message || e) }; }

  let resposta;
  try {
    resposta = await cli.auth.signInWithPassword({ email: String(email).trim().toLowerCase(), password: senha });
  } catch (e) {
    return { ok:false, erro:PP.nuvem.traduzErro(e && e.message ? e.message : e) };
  }
  const { error } = resposta;
  if (error) return { ok:false, erro: PP.nuvem.traduzErro(error.message) };

  try {
    const { data, error: sessionError } = await cli.auth.getSession();
    if (sessionError) throw sessionError;
    PP.nuvem.sessao = data && data.session ? data.session : null;
    PP.nuvem.ligada = !!PP.nuvem.sessao;

    const u = await identificar();
    if (!u) {
      await cli.auth.signOut();
      PP.nuvem.ligada = false;
      return { ok:false, erro:'Sua conta existe, mas este e-mail não está cadastrado como usuário do sistema. Peça ao administrador para cadastrar você.' };
    }

    await PP.recarregarTudo();
    if (PP.saas) PP.saas.evento('entrou', u.nome + ' entrou no sistema', 'login');
    return { ok:true, usuario:u };
  } catch (e) {
    return { ok:false, erro:PP.nuvem.traduzErro(e.message || e) };
  }
};

PP.criarConta = async (email, senha) => {
  let cli;
  try { cli = await PP.nuvem.conectar(); }
  catch (e) { return { ok:false, erro:'Sem conexão com o servidor.' }; }
  const limpo = String(email).trim().toLowerCase();
  const { data, error } = await cli.auth.signUp({
    email: limpo,
    password: senha,
    options: { emailRedirectTo: location.origin + location.pathname }
  });
  if (error) return { ok:false, erro: PP.nuvem.traduzErro(error.message) };
  if (!data.session) return { ok:true, confirmar:true };
  return PP.entrar(limpo, senha);
};

PP.sair = async () => {
  await PP.db.confirmar();
  try { const cli = await PP.nuvem.conectar(); await cli.auth.signOut(); } catch (e) {}
  PP.nuvem.sessao = null;
  PP.nuvem.ligada = false;
  PP.definirSessao(null);
  PP.closeAll();
  PP.telaLogin();
  location.reload();
};

/* ============================== TELA DE LOGIN ============================== */

PP.telaLogin = () => {
  document.querySelector('.app-shell').style.display = 'none';
  let box = document.getElementById('telaLogin');
  if (box) box.remove();
  const onda = 'M0 60 Q 90 24 180 60 T 360 60 T 540 60 T 720 60 T 900 60 T 1080 60 T 1260 60 T 1440 60 V 140 H 0 Z';
  box = document.createElement('div');
  box.id = 'telaLogin';
  box.className = 'login-wrap';
  box.innerHTML = `
    <div class="login-ondas" aria-hidden="true">
      <svg viewBox="0 0 1440 140" preserveAspectRatio="none"><path d="${onda}"/></svg>
      <svg viewBox="0 0 1440 140" preserveAspectRatio="none"><path d="${onda}"/></svg>
      <svg viewBox="0 0 1440 140" preserveAspectRatio="none"><path d="${onda}"/></svg>
    </div>

    <div class="login-grid">
      <div class="login-marca">
        <div class="brand-mark">
          <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 21c2.6 0 2.6-2.4 5.2-2.4S11.8 21 14.4 21s2.6-2.4 5.2-2.4S22.2 21 24.8 21s2.6-2.4 5.2-2.4"/><path d="M4 27c2.6 0 2.6-2.4 5.2-2.4S11.8 27 14.4 27s2.6-2.4 5.2-2.4S22.2 27 24.8 27s2.6-2.4 5.2-2.4" opacity=".45"/><path d="M8 16V7.5A3.5 3.5 0 0 1 11.5 4h1A3.5 3.5 0 0 1 16 7.5V16M22 16V7.5A3.5 3.5 0 0 0 18.5 4"/></svg>
        </div>
        <h1>Piscina<em>Pro</em></h1>
        <p class="login-emp">${esc(PP.cfg().empresa || 'Gestão & Vendas')}</p>
        <p class="login-frase">Do primeiro contato no WhatsApp até a obra entregue e a parcela quitada — tudo num lugar só.</p>
      </div>

      <div class="login-card">
        <h2>Entrar</h2>
        <form id="formLogin" data-sub="fazerLogin">
          <div class="f"><label for="loginUsr">E-mail</label>
            <input class="inp" id="loginUsr" name="login" type="email" autocomplete="username" autofocus placeholder="voce@empresa.com.br"></div>
          <div class="f"><label for="loginPwd">Senha</label>
            <input class="inp" id="loginPwd" name="senha" type="password" autocomplete="current-password" placeholder="••••••••"></div>
          <div class="login-erro" id="loginErro" role="alert" aria-live="assertive" hidden></div>
          <button class="btn btn-teal btn-block" type="submit" style="margin-top:6px">Entrar</button>
        </form>
        <div class="login-ajuda">
          <button class="btn btn-ghost btn-sm btn-block" data-act="criarConta">Primeiro acesso — criar minha conta</button>
          <button class="btn btn-ghost btn-sm btn-block" data-act="dicaLogin">Esqueci minha senha</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(box);
  setTimeout(() => { const i = document.getElementById('loginUsr'); if (i) i.focus(); }, 60);
};

function entrou() {
  const t = document.getElementById('telaLogin');
  if (t) t.remove();
  document.querySelector('.app-shell').style.display = '';
  try { PP.marcarExpirados(); } catch (e) {}
  PP.aposLogin();
}
PP.aposEntrar = entrou;

PP.on('fazerLogin', async (d, form) => {
  const erro = document.getElementById('loginErro');
  const btn = form.querySelector('button[type="submit"]');
  const login = form.querySelector('#loginUsr').value.trim();
  const senha = form.querySelector('#loginPwd').value;
  if (!login || !senha) {
    erro.textContent = 'Informe e-mail e senha.'; erro.hidden = false; return;
  }
  erro.hidden = true; btn.disabled = true; btn.textContent = 'Entrando…';
  let r;
  try { r = await PP.entrar(login, senha); }
  catch (e) { r = { ok:false, erro:e.message || 'Não foi possível entrar.' }; }
  finally { btn.disabled = false; btn.textContent = 'Entrar'; }
  if (!r.ok) { erro.textContent = r.erro; erro.hidden = false; form.querySelector('#loginPwd').select(); return; }
  entrou();
});

PP.on('criarConta', () => {
  const key = PP.uid('cc');
  PP.on(key, async (d, el) => {
    const box = el.closest('.modal-box');
    const btn = el.tagName === 'BUTTON' ? el : box.querySelector(`[data-act="${key}"]`);
    const email = box.querySelector('#ccEmail').value.trim().toLowerCase();
    const s1 = box.querySelector('#ccSenha').value;
    const s2 = box.querySelector('#ccConf').value;
    if (!email) return PP.toast('Informe o e-mail', 'err');
    if (s1.length < 6) return PP.toast('A senha precisa de ao menos 6 caracteres', 'err');
    if (s1 !== s2) return PP.toast('A confirmação não confere', 'err');
    const txt = btn && btn.textContent;
    if (btn) { btn.disabled = true; btn.textContent = 'Criando…'; }
    try {
      const r = await PP.criarConta(email, s1);
      if (!r.ok) {
        if (btn) { btn.disabled = false; btn.textContent = txt; }
        return PP.toast(r.erro, 'err');
      }
      PP.closeTop();
      if (r.confirmar) return PP.toast('Conta criada. Confirme o e-mail e depois entre.', 'ok');
      entrou();
    } catch (e) {
      if (btn) { btn.disabled = false; btn.textContent = txt; }
      PP.toast(e && e.message ? e.message : 'Não foi possível criar a conta.', 'err');
    }
  });
  PP.modal({
    title:'Criar minha conta', size:'sm',
    body:`<p style="margin-top:0;font-size:13.5px;line-height:1.65">Use o <b>mesmo e-mail</b> que o administrador cadastrou para você no sistema. É ele que liga a conta ao seu acesso.</p>
      <div class="fgrid">
        <div class="f f-12"><label for="ccEmail">E-mail</label><input class="inp" id="ccEmail" type="email" autocomplete="username"></div>
        <div class="f f-12"><label for="ccSenha">Senha</label><input class="inp" id="ccSenha" type="password" autocomplete="new-password"></div>
        <div class="f f-12"><label for="ccConf">Confirme a senha</label><input class="inp" id="ccConf" type="password" autocomplete="new-password"></div>
      </div>`,
    actions:[{ txt:'Criar conta', cls:'btn-primary', act:key }, { txt:'Cancelar', act:'fechar' }]
  });
});

PP.on('dicaLogin', () => {
  const key = PP.uid('rs');
  PP.on(key, async (d, el) => {
    const email = el.closest('.modal-box').querySelector('#rsEmail').value.trim();
    if (!email) return PP.toast('Informe o e-mail', 'err');
    try {
      const cli = await PP.nuvem.conectar();
      const { error } = await cli.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname + '?recuperar=1' });
      if (error) return PP.toast(PP.nuvem.traduzErro(error.message), 'err');
      PP.closeTop();
      PP.toast('Se houver conta com esse e-mail, o link de redefinição foi enviado.', 'ok');
    } catch (e) { PP.toast(PP.nuvem.traduzErro(e.message || e), 'err'); }
  });
  PP.modal({
    title:'Esqueci minha senha', size:'sm',
    body:`<p style="margin-top:0;font-size:13.5px;line-height:1.65">Mandamos um link de redefinição para o seu e-mail.</p>
      <div class="f"><label for="rsEmail">E-mail da conta</label><input class="inp" id="rsEmail" type="email"></div>`,
    actions:[{ txt:'Enviar link', cls:'btn-primary', act:key }, { txt:'Cancelar', act:'fechar' }]
  });
});

PP.telaRecuperarSenha = () => {
  document.querySelector('.app-shell').style.display = 'none';
  const box = document.createElement('div');
  box.id = 'telaRecuperar';
  box.className = 'login-wrap';
  box.innerHTML = `<div class="login-grid"><div class="login-card" style="margin:auto">
    <h2>Definir nova senha</h2>
    <form data-sub="confirmarRecuperacao">
      <div class="f"><label for="recSenha">Nova senha</label><input class="inp" id="recSenha" type="password" autocomplete="new-password" required minlength="6"></div>
      <div class="f"><label for="recConf">Confirme a senha</label><input class="inp" id="recConf" type="password" autocomplete="new-password" required minlength="6"></div>
      <div class="login-erro" id="recErro" role="alert" aria-live="assertive" hidden></div>
      <button class="btn btn-teal btn-block" type="submit">Salvar senha</button>
    </form></div></div>`;
  document.body.appendChild(box);
  box.querySelector('#recSenha').focus();
};

PP.on('confirmarRecuperacao', async (d, form) => {
  const erro = form.querySelector('#recErro');
  const senha = form.querySelector('#recSenha').value;
  const conf = form.querySelector('#recConf').value;
  if (senha.length < 6 || senha !== conf) {
    erro.textContent = senha.length < 6 ? 'Use ao menos 6 caracteres.' : 'As senhas não conferem.';
    erro.hidden = false;
    return;
  }
  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true;
  try {
    const cli = await PP.nuvem.conectar();
    const { error } = await cli.auth.updateUser({ password: senha });
    if (error) throw error;
    await cli.auth.signOut();
    history.replaceState(null, '', location.pathname);
    location.reload();
  } catch (e) {
    erro.textContent = PP.nuvem.traduzErro(e.message || e);
    erro.hidden = false;
  } finally { btn.disabled = false; }
});

/** Chamado depois de um login bem-sucedido e no boot com sessão válida. */
PP.aposLogin = () => {
  PP.montarNav();
  pintarUsuario();
  const atual = (location.hash || '').replace(/^#\/?/, '').split('/')[0];
  if (!atual || !PP.podeAcessar(atual)) {
    const primeira = PP.NAV.flatMap(g => g.itens).filter(i => PP.podeAcessar(i.v))[0];
    location.hash = '#/' + (primeira ? primeira.v : 'dashboard');
  }
  PP.render();
};

function pintarUsuario() {
  const u = PP.usuario();
  if (!u) return;
  /* O provedor não opera nenhuma empresa: busca de lead e botão de novo lead
     não são dele. Deixar os dois ali só convida ao clique que não faz nada. */
  const daOperacao = u.papel !== 'provedor';
  const busca = document.getElementById('buscaWrap');
  const novo = document.getElementById('btnNovoLead');
  const sino = document.getElementById('btnAlertas');
  if (busca) busca.hidden = !daOperacao;
  if (novo) novo.hidden = !daOperacao;
  if (sino) sino.hidden = !daOperacao;
  document.getElementById('usrNome').textContent = u.nome;
  document.getElementById('usrAvatar').textContent = PP.iniciais(u.nome);
  const sub = document.querySelector('.usr-txt span');
  if (sub) sub.textContent = PP.PAPEIS[u.papel] ? PP.PAPEIS[u.papel].nome : u.papel;
}
PP.pintarUsuario = pintarUsuario;

/* ============================== TROCAR SENHA ============================== */

PP.on('trocarSenha', () => {
  const key = PP.uid('ts');
  PP.on(key, async (d, el) => {
    const box = el.closest('.modal-box');
    const nova = box.querySelector('#pwNova').value;
    const conf = box.querySelector('#pwConf').value;
    if (nova.length < 6) return PP.toast('A nova senha precisa de ao menos 6 caracteres', 'err');
    if (nova !== conf) return PP.toast('A confirmação não confere', 'err');
    const cli = await PP.nuvem.conectar();
    const { error } = await cli.auth.updateUser({ password: nova });
    if (error) return PP.toast(PP.nuvem.traduzErro(error.message), 'err');
    PP.closeTop();
    PP.toast('Senha alterada', 'ok');
  });
  PP.modal({
    title:'Trocar senha', sub:PP.usuario().nome, size:'sm',
    body:`<div class="fgrid">
      <div class="f f-12"><label for="pwNova">Nova senha</label><input class="inp" id="pwNova" type="password" autocomplete="new-password"></div>
      <div class="f f-12"><label for="pwConf">Confirme a nova senha</label><input class="inp" id="pwConf" type="password" autocomplete="new-password"></div>
    </div>
    <div class="alert a-info mt"><svg class="ic"><use href="#i-alerta"/></svg>
      <div class="small">A senha é da sua conta no servidor. Vale em qualquer computador onde você entrar.</div></div>`,
    actions:[{ txt:'Salvar senha', cls:'btn-primary', act:key }, { txt:'Cancelar', act:'fechar' }]
  });
});

PP.on('sair', async () => {
  if (await PP.confirmar('Sair do sistema?', { okTxt:'Sair' })) PP.sair();
});

PP.on('menuUsuario', () => {
  const u = PP.usuario();
  PP.modal({
    title:u.nome, sub:PP.PAPEIS[u.papel].nome + ' · ' + PP.PAPEIS[u.papel].desc, size:'sm',
    body:`<div class="stack" style="gap:8px">
      <button class="btn btn-block" data-act="trocarSenha"><svg class="ic"><use href="#i-config"/></svg>Trocar minha senha</button>
      ${PP.ehAdmin() ? '<button class="btn btn-block" data-act="nav" data-v="vendedores"><svg class="ic"><use href="#i-vendedor"/></svg>Gerenciar usuários</button>' : ''}
      <button class="btn btn-block btn-dang" data-act="sair"><svg class="ic"><use href="#i-sair"/></svg>Sair do sistema</button>
    </div>
    <div class="alert a-info mt"><svg class="ic"><use href="#i-alerta"/></svg>
      <div class="small">Quem decide o que você enxerga é o <b>banco</b>, pelo seu papel. Os dados ficam no servidor, não neste computador.</div></div>`
  });
});

/* ============================== GESTÃO DE USUÁRIOS ============================== */

PP.on('novoUsuario', () => abrirFormUsuario(null));
PP.on('editarUsuario', d => abrirFormUsuario(PP.find('usuarios', d.id)));

function abrirFormUsuario(u) {
  if (!PP.ehAdmin()) return PP.toast('Só o administrador gerencia usuários', 'err');
  const novo = !u;
  const key = PP.uid('us');
  PP.on(key, async (d, el) => {
    const { ok, data } = PP.lerForm(el.closest('.modal-box').querySelector('#formUsr'));
    if (!ok) return;
    const dup = PP.all('usuarios').find(x => PP.norm(x.login) === PP.norm(data.login) && x.id !== data.id);
    if (dup) return PP.toast('Já existe um usuário com esse e-mail', 'err');
    PP.upsert('usuarios', data);
    PP.closeTop();
    PP.render();
    if (novo) {
      PP.modal({
        title:'Usuário cadastrado', size:'sm',
        body:`<p style="margin-top:0;font-size:13.5px;line-height:1.65">Falta <b>${esc(data.nome)}</b> criar a própria conta.</p>
          <div class="alert a-info mb"><svg class="ic"><use href="#i-alerta"/></svg>
            <div class="small">Peça para abrir o sistema, clicar em <b>“Primeiro acesso — criar minha conta”</b> e usar exatamente o e-mail <b>${esc(data.login)}</b>. A senha é escolhida por ele e você nunca a vê.</div></div>
          <p class="small muted" style="margin-bottom:0">O vínculo com este cadastro acontece sozinho na primeira entrada.</p>`,
        actions:[{ txt:'Entendi', cls:'btn-primary', act:'fechar' }]
      });
    } else PP.toast('Usuário salvo', 'ok');
  });
  PP.modal({
    title: novo ? 'Novo usuário' : u.nome, size:'lg',
    body:`<form id="formUsr">${PP.form([
      { k:'id', t:'hidden' },
      { k:'nome', l:'Nome', t:'text', col:7, req:true },
      { k:'login', l:'E-mail de acesso', t:'email', col:5, req:true,
        hint:'É por ele que a conta da pessoa liga a este cadastro' },
      { k:'papel', l:'Papel', t:'select', col:6, req:true, vazio:false,
        opts:Object.keys(PP.PAPEIS).map(p => ({ v:p, l:PP.PAPEIS[p].nome + ' — ' + PP.PAPEIS[p].desc })) },
      { k:'vendedorId', l:'Vinculado ao vendedor', t:'select', col:6,
        opts:PP.all('vendedores').map(v => ({ v:v.id, l:v.nome })),
        hint:'Obrigatório para o papel Vendedor: define a carteira que ele enxerga' },
      { k:'ativo', l:'Usuário ativo', t:'checkbox', col:6,
        hint:'Desmarcar tira o acesso na hora, sem apagar o histórico' }
    ], u || { ativo:true, papel:'vendedor' })}</form>`,
    actions:[
      { txt:'Salvar', cls:'btn-primary', act:key },
      u && u.id !== PP.usuario().id ? { txt:'Excluir', act:'excluirUsuario', data:{ id:u.id } } : null,
      { txt:'Cancelar', act:'fechar' }
    ].filter(Boolean)
  });
}

PP.on('excluirUsuario', async d => {
  const u = PP.find('usuarios', d.id);
  if (u.id === PP.usuario().id) return PP.toast('Você não pode excluir o próprio usuário', 'err');
  if (!await PP.confirmar(`Excluir o acesso de "${u.nome}"?`, { perigo:true, okTxt:'Excluir' })) return;
  PP.remove('usuarios', d.id);
  PP.closeTop(); PP.toast('Usuário excluído'); PP.render();
});

})();
