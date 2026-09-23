/* ==========================================================================
   PiscinaPro — nuvem.js
   O driver de dados: o Supabase é a fonte da verdade.

   COMO FUNCIONA
   O navegador não guarda nada em disco. Ao entrar, o sistema BAIXA tudo o que
   o papel da pessoa pode ver e trabalha com essa cópia em memória. Toda
   alteração vira gravação no Postgres poucos instantes depois — inclusive as
   exclusões, que a sincronização antiga não sabia propagar.

   Sem rede, o sistema não abre e não grava. É o preço de ter um dado só, igual
   para a equipe inteira, sem cópias divergentes em cada computador.

   Quem manda no acesso é o Supabase Auth + as políticas do banco (RLS): cada
   pessoa entra com a conta dela, e o banco decide o que ela enxerga. O
   `usuarios` daqui guarda nome, papel e vínculo com o vendedor.
   ========================================================================== */
(function () {
'use strict';
const PP = window.PP;

/* Endereço e chave publicável do projeto. Ficam no código de propósito: a
   chave é pública por desenho (quem manda é a política do banco) e assim
   nenhum computador novo precisa ser configurado à mão para começar. */
const URL_SUPABASE = 'https://xxhsyzzcwhtnwljlgops.supabase.co';
const URL_PROJETO = location.protocol === 'https:' ? location.origin + '/sb' : URL_SUPABASE;
const CHAVE_PUB   = 'sb_publishable_ah2Onhgbdu08ztYPOnau4Q_gUHD3iNi';

const PAGINA = 1000;   /* o PostgREST devolve no máximo 1000 por vez */

/* ============================== MAPA DE CAMPOS ==============================

   tabela <- coleção, e a tradução camelCase <-> snake_case.
   Só o que está aqui atravessa: campo novo no cliente exige entrada aqui. */

const MAPA = {
  equipes:      { tabela:'equipes',      campos:{ id:'id', nome:'nome', responsavel:'responsavel' } },
  equipesObra:  { tabela:'equipes_obra', campos:{ id:'id', nome:'nome', cor:'cor', membros:'membros', fone:'fone', ativo:'ativo' } },
  vendedores:   { tabela:'vendedores',   campos:{ id:'id', nome:'nome', email:'email', fone:'fone', equipeId:'equipe_id',
                    meta:'meta', comissaoPct:'comissao_pct', comissaoMetro:'comissao_metro',
                    admissao:'admissao', cargo:'cargo', ativo:'ativo' } },
  usuarios:     { tabela:'usuarios',     campos:{ id:'id', nome:'nome', login:'login', papel:'papel',
                    vendedorId:'vendedor_id', ativo:'ativo' } },
  fornecedores: { tabela:'fornecedores', campos:{ id:'id', nome:'nome', doc:'doc', fone:'fone', email:'email',
                    cidade:'cidade', contato:'contato', prazoEntregaDias:'prazo_entrega_dias', obs:'obs' } },
  produtos:     { tabela:'produtos',     campos:{ id:'id', sku:'sku', nome:'nome', categoria:'categoria', unidade:'unidade',
                    custo:'custo', preco:'preco', controlaEstoque:'controla_estoque', estoque:'estoque',
                    estoqueMin:'estoque_min', fornecedorId:'fornecedor_id', ativo:'ativo', descricao:'descricao', specs:'specs' } },
  clientes:     { tabela:'clientes',     campos:{ id:'id', nome:'nome', tipo:'tipo', doc:'doc', telefone:'telefone',
                    email:'email', cep:'cep', endereco:'endereco', bairro:'bairro', cidade:'cidade', uf:'uf',
                    leadId:'lead_id', obs:'obs' } },
  leads:        { tabela:'leads',        campos:{ id:'id', nome:'nome', telefone:'telefone', email:'email', cidade:'cidade',
                    bairro:'bairro', origem:'origem', etapa:'etapa', vendedorId:'vendedor_id', produtoId:'produto_id',
                    valorEstimado:'valor_estimado', ultimoContato:'ultimo_contato', proximoContato:'proximo_contato',
                    motivoPerda:'motivo_perda', obs:'obs', interacoes:'interacoes' } },
  orcamentos:   { tabela:'orcamentos',   campos:{ id:'id', numero:'numero', leadId:'lead_id', clienteId:'cliente_id',
                    vendedorId:'vendedor_id', data:'data', validade:'validade', status:'status', itens:'itens',
                    descontoPct:'desconto_pct', condicao:'condicao', obs:'obs', pedidoAlcadaPor:'pedido_alcada_por',
                    pedidoAlcadaEm:'pedido_alcada_em', aprovadoPor:'aprovado_por', aprovadoEm:'aprovado_em' } },
  pedidos:      { tabela:'pedidos',      campos:{ id:'id', numero:'numero', orcamentoId:'orcamento_id', clienteId:'cliente_id',
                    vendedorId:'vendedor_id', data:'data', status:'status', obraId:'obra_id', formaPag:'forma_pag',
                    subtotal:'subtotal', descontoPct:'desconto_pct', descontoValor:'desconto_valor', total:'total',
                    custo:'custo', itens:'itens', condicao:'condicao', obs:'obs' } },
  obras:        { tabela:'obras',        campos:{ id:'id', pedidoId:'pedido_id', clienteId:'cliente_id',
                    equipeObraId:'equipe_obra_id', status:'status', dataAgendada:'data_agendada',
                    dataConclusao:'data_conclusao', duracaoDias:'duracao_dias', responsavel:'responsavel',
                    endereco:'endereco', cidade:'cidade', custoPrevisto:'custo_previsto', custoReal:'custo_real',
                    numeroOS:'numero_os', obsOS:'obs_os', checklist:'checklist', notas:'notas' } },
  compras:      { tabela:'compras',      campos:{ id:'id', numero:'numero', fornecedorId:'fornecedor_id', data:'data',
                    previsaoEntrega:'previsao_entrega', status:'status', itens:'itens', obs:'obs' } },
  estoqueMov:   { tabela:'estoque_mov',  campos:{ id:'id', produtoId:'produto_id', tipo:'tipo', qtd:'qtd',
                    data:'data', motivo:'motivo', ref:'ref' } },
  vendas:       { tabela:'vendas',       campos:{ id:'id', numero:'numero', data:'data', clienteId:'cliente_id',
                    clienteNome:'cliente_nome', vendedorId:'vendedor_id', itens:'itens', subtotal:'subtotal',
                    descontoPct:'desconto_pct', descontoValor:'desconto_valor', total:'total', custo:'custo',
                    formaPag:'forma_pag', parcelas:'parcelas', recebido:'recebido', troco:'troco',
                    status:'status', obs:'obs' } },
  contratos:    { tabela:'contratos',    campos:{ id:'id', numero:'numero', clienteId:'cliente_id', vendedorId:'vendedor_id',
                    escopo:'escopo', valor:'valor', periodicidade:'periodicidade', diaVencimento:'dia_vencimento',
                    inicio:'inicio', fim:'fim', status:'status', ultimaCobranca:'ultima_cobranca', obs:'obs' } },
  chamados:     { tabela:'chamados',     campos:{ id:'id', numero:'numero', clienteId:'cliente_id', pedidoId:'pedido_id',
                    equipeObraId:'equipe_obra_id', tipo:'tipo', descricao:'descricao', abertura:'abertura',
                    status:'status', dataVisita:'data_visita', emGarantia:'em_garantia', custo:'custo',
                    valorCobrado:'valor_cobrado', solucao:'solucao', fechamento:'fechamento' } },
  financeiro:   { tabela:'financeiro',   campos:{ id:'id', tipo:'tipo', descricao:'descricao', categoria:'categoria',
                    valor:'valor', vencimento:'vencimento', status:'status', pagoEm:'pago_em', formaPag:'forma_pag',
                    clienteId:'cliente_id', fornecedorId:'fornecedor_id', parcela:'parcela', parcelas:'parcelas', obs:'obs' } },
  comissoes:    { tabela:'comissoes',    campos:{ id:'id', vendedorId:'vendedor_id', pedidoId:'pedido_id', vendaId:'venda_id',
                    clienteId:'cliente_id', base:'base', baseTipo:'base_tipo', faturamento:'faturamento', custo:'custo',
                    pct:'pct', metros:'metros', valorMetro:'valor_metro', valor:'valor',
                    competencia:'competencia', status:'status', pagoEm:'pago_em', origem:'origem' } }
};

/* Ordem de gravação: pai antes de filho, senão a chave estrangeira recusa.
   Exclusão percorre esta mesma lista ao contrário. */
const ORDEM = ['equipes','equipesObra','vendedores','usuarios','fornecedores','produtos',
               'leads','clientes','orcamentos','pedidos','obras','compras','estoqueMov',
               'vendas','contratos','chamados','financeiro','comissoes'];

/* Colunas jsonb: não podem virar null (são NOT NULL no banco, com default). */
const JSONB = {
  specs:'{}', condicao:'{}',
  itens:'[]', interacoes:'[]', checklist:'[]', notas:'[]'
};

/* Colunas numéricas NOT NULL que entraram depois: registro antigo chega
   como undefined e não pode virar null. Vai zero. */
const ZERO = ['metros', 'valorMetro', 'comissaoMetro'];

/* ============================== CONVERSÃO ============================== */

const vazioPraNulo = v => (v === '' || v === undefined ? null : v);

function paraBanco(col, reg) {
  const m = MAPA[col];
  const out = {};
  Object.keys(m.campos).forEach(k => {
    const v = reg[k];
    if (JSONB[k] !== undefined) {
      out[m.campos[k]] = (v === undefined || v === null || v === '') ? JSON.parse(JSONB[k]) : v;
    } else if (ZERO.indexOf(k) >= 0) {
      out[m.campos[k]] = PP.n(v);
    } else {
      out[m.campos[k]] = vazioPraNulo(v);
    }
  });
  /* o financeiro guarda a origem como objeto; no banco vira duas colunas */
  if (col === 'financeiro') {
    out.origem_tipo = (reg.origem && reg.origem.tipo) || null;
    out.origem_id = (reg.origem && reg.origem.id) || null;
  }
  /* `atualizado_em` não vai: quem carimba é o servidor. */
  return out;
}

function doBanco(col, linha) {
  const m = MAPA[col];
  const out = {};
  Object.keys(m.campos).forEach(k => {
    const v = linha[m.campos[k]];
    if (JSONB[k] !== undefined) out[k] = (v === null || v === undefined) ? JSON.parse(JSONB[k]) : v;
    else out[k] = v === null ? '' : v;
  });
  if (col === 'financeiro') out.origem = { tipo: linha.origem_tipo || 'manual', id: linha.origem_id || '' };
  /* só de leitura: quem grava `auth_uid` é a função reivindicar_usuario(),
     no primeiro acesso da pessoa. O cliente nunca escreve esse campo. */
  if (col === 'usuarios') out.vinculada = !!linha.auth_uid;
  /* carimbos do servidor: lidos sempre, nunca enviados. Sem trazer `criadoEm`
     de volta, relatórios por período perderiam a data de criação do lead a
     cada recarga — o localStorage é que segurava isso antes. */
  if (linha.criado_em) out.criadoEm = linha.criado_em;
  out.atualizadoEm = linha.atualizado_em;
  return out;
}

/* ============================== CONEXÃO ============================== */

const N = PP.nuvem = {
  cliente: null,
  sessao: null,
  ligada: false,
  erro: '',
  carregadas: new Set()
};

N.conectar = async () => {
  if (N.cliente) return N.cliente;
  const createClient = window.supabase && window.supabase.createClient;
  if (typeof createClient !== 'function') {
    throw new Error('Cliente Supabase local não foi carregado. Publique novamente todos os arquivos do sistema.');
  }
  N.cliente = createClient(URL_PROJETO, CHAVE_PUB, {
    auth: { persistSession: true, autoRefreshToken: true }
  });
  const { data, error } = await N.cliente.auth.getSession();
  if (error) throw new Error(traduzErro(error.message));
  N.sessao = data && data.session ? data.session : null;
  N.ligada = !!N.sessao;
  return N.cliente;
};

function traduzErro(m) {
  const s = String(m || '');
  if (/Invalid login credentials/i.test(s)) return 'E-mail ou senha incorretos.';
  if (/User already registered/i.test(s)) return 'Já existe conta com esse e-mail — use "Entrar".';
  if (/Signups? not allowed|signup.*disabled|not.*allow.*signup/i.test(s)) return 'O cadastro direto está desativado no servidor. Peça ao administrador para criar sua conta de acesso.';
  if (/Password should be at least/i.test(s)) return 'A senha precisa de ao menos 6 caracteres.';
  if (/Email not confirmed/i.test(s)) return 'Confirme o e-mail antes de entrar.';
  if (/Failed to fetch|NetworkError|fetch failed/i.test(s)) {
    return 'O navegador não conseguiu acessar o servidor. Recarregue com Ctrl+Shift+R. Se persistir, verifique a requisição /sb/ no painel Rede e o bloqueador de conteúdo.';
  }
  if (/row-level security/i.test(s)) return 'Seu perfil não tem permissão para esta alteração.';
  return s;
}
N.traduzErro = traduzErro;

/** Endereço de uma Edge Function do projeto. */
N.urlFuncao = nome => URL_PROJETO + '/functions/v1/' + nome;

/* ============================== O DRIVER ============================== */

function cli() {
  if (!N.cliente) throw new Error('Sem conexão com o servidor.');
  return N.cliente;
}

/** Traz a coleção inteira, em páginas — RLS já filtra o que a pessoa pode ver. */
async function baixarColecao(col) {
  const tabela = MAPA[col].tabela;
  const saida = [];
  for (let de = 0; ; de += PAGINA) {
    const { data, error } = await cli().from(tabela).select('*').order('id').range(de, de + PAGINA - 1);
    if (error) throw new Error(col + ': ' + traduzErro(error.message));
    if (!data || !data.length) break;
    data.forEach(l => saida.push(doBanco(col, l)));
    if (data.length < PAGINA) break;
  }
  return saida;
}

function erroRPC(error) {
  const e = new Error(traduzErro(error.message));
  e.code=error.code;
  e.definitivo=!!error.code && !['57014','57P01','08006','PGRST000','PGRST001','PGRST002','PGRST003'].includes(error.code);
  return e;
}
async function rpc(nome,args) {
  const {data,error}=await cli().rpc(nome,args);
  if (error) throw erroRPC(error);
  return data;
}

PP.driver = {
  nome: 'supabase',

  async carregar() {
    const fora = {};
    /* em paralelo: são 18 consultas independentes */
    const cols = N.carregadas.size ? Array.from(N.carregadas) : [];
    const pares = await Promise.all(cols.map(async col => [col, await baixarColecao(col)]));
    pares.forEach(([col, linhas]) => fora[col] = linhas);

    /* uma config por empresa; a RLS já devolve só a de quem está pedindo */
    const { data, error } = await cli().from('config').select('dados,atualizado_em').limit(1).maybeSingle();
    if (error) throw new Error('config: ' + traduzErro(error.message));
    fora.config = (data && data.dados) || {};
    N.configVersao = data && data.atualizado_em;
    N.epoca = (N.epoca || 0) + 1;
    return fora;
  },

  /**
   * Grava um lote inteiro. Upserts na ordem dos pais para a chave estrangeira
   * aceitar; exclusões na ordem inversa, para o filho sair antes do pai.
   */
  async gravar(lote, id) {
    const pacote = {};
    for (const col of ORDEM) {
      if (!lote[col]) continue;
      const d = lote[col];
      pacote[MAPA[col].tabela] = {
        upserts: (d.upserts || []).map(r => ({ dados:paraBanco(col,r), versao:(d.versoes || {})[r.id] || null })),
        exclusoes: (d.exclusoes || []).map(id => ({ id, versao:(d.versoes || {})[id] || null }))
      };
    }
    if (lote.config) pacote.config = { upserts:[{ dados:{ id:PP.empresaAtual(), dados:lote.config.config }, versao:N.configVersao || null }] };
    const dados = await rpc('gravar_lote', { p_id:id, p_lote:pacote });
    const resultado = {};
    for (const col of ORDEM) if (dados[MAPA[col].tabela]) resultado[col]=dados[MAPA[col].tabela].map(r=>doBanco(col,r));
    if (dados.config && dados.config[0]) N.configVersao=dados.config[0].atualizado_em;
    return resultado;
  },

  async reservarNumeros(campo, qtd) {
    const { data, error } = await cli().rpc('reservar_numeros', { p_campo: campo, p_qtd: qtd });
    if (error) throw new Error('numeração: ' + traduzErro(error.message));
    return PP.n(data);
  },

  /** Apaga tudo e recoloca o conjunto informado. Usado pelo seed e pelo backup. */
  async substituirTudo(pacote, id) {
    PP.validarBackup(pacote);
    const convertido = {};
    for (const col of ORDEM) convertido[MAPA[col].tabela]=(pacote[col] || []).map(r => {
      const linha=paraBanco(col,r);
      if (r.criadoEm) linha.criado_em=r.criadoEm;
      return linha;
    });
    convertido.config=[{ id:PP.empresaAtual(), dados:pacote.config }];
    return rpc('restaurar_empresa', { p_id:id || PP.uid('restaurar'), p_pacote:convertido });
  },

  async fecharVenda(tipo, dados, id) {
    return rpc('fechar_venda', { p_id:id, p_tipo:tipo, p_dados:dados });
  },

  async buscarRegistro(col,id) {
    const { data,error }=await cli().from(MAPA[col].tabela).select('*').eq('id',id).single();
    if (error) throw erroRPC(error);
    return doBanco(col,data);
  },

  async carregarColecoes(cols) {
    return Object.fromEntries(await Promise.all(cols.map(async c=>[c,await baixarColecao(c)])));
  },

  async paginaLeads(filtro,pagina) {
    return rpc('pagina_leads',{p_filtro:filtro,p_pagina:pagina,p_tamanho:60}).then(r=>({ ...r, linhas:r.linhas.map(l=>doBanco('leads',l)) }));
  }

};

/* ============================== STATUS NA BARRA ============================== */

function pintarStatus() {
  const el = document.getElementById('nuvemStatus');
  if (!el) return;
  el.hidden = !N.ligada;
  if (!N.ligada) return;

  const g = PP.gravacao || {};
  const off = !navigator.onLine;
  const estado = off ? 'off' : g.estado === 'erro' || g.diarioErro ? 'erro' : g.estado === 'gravando' ? 'sync' : 'ok';
  el.className = 'nuvem-status ' + estado;
  el.title = off
    ? 'Sem conexão — o sistema não consegue gravar agora'
    : g.diarioErro
      ? 'Não foi possível proteger alterações pendentes neste navegador: ' + g.diarioErro
    : g.estado === 'erro'
      ? 'Não consegui gravar: ' + g.erro + ' — tentando de novo. Não feche a aba.'
      : g.estado === 'gravando'
        ? 'Gravando no servidor…'
        : 'Tudo gravado no servidor';
  el.innerHTML = '<svg class="ic"><use href="#' + (estado === 'erro' ? 'i-alerta' : 'i-nuvem') + '"/></svg>';
}
PP.pintarStatusNuvem = pintarStatus;
PP.on('statusNuvem', () => PP.ir('config'));

})();
