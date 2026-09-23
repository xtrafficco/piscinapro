/* ==========================================================================
   PiscinaPro — core.js
   Núcleo: utilidades, persistência, roteamento, UI (modal/drawer/toast),
   construtor de formulários, tabelas e gráficos SVG.

   ARQUITETURA: nada de onclick inline. Tudo é delegação por [data-act].
   Registre handlers com PP.on('nomeDaAcao', fn) — não existe "esqueci de exportar".
   ========================================================================== */
(function () {
'use strict';

const PP = window.PP = window.PP || {};

/* ============================== UTILIDADES ============================== */

const ESC_MAP = { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' };
const esc = PP.esc = s => String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, c => ESC_MAP[c]);

PP.uid = (p) => (p || 'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

PP.n = v => { const x = Number(v); return isFinite(x) ? x : 0; };

PP.money = v => PP.n(v).toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
PP.money0 = v => PP.n(v).toLocaleString('pt-BR', { style:'currency', currency:'BRL', minimumFractionDigits:0, maximumFractionDigits:0 });
PP.moneyK = v => {
  const x = PP.n(v);
  if (Math.abs(x) >= 1e6) return 'R$ ' + (x/1e6).toLocaleString('pt-BR',{maximumFractionDigits:1}) + 'M';
  if (Math.abs(x) >= 1000) return 'R$ ' + (x/1000).toLocaleString('pt-BR',{maximumFractionDigits:0}) + 'k';
  return PP.money0(x);
};
PP.dec = (v, d) => PP.n(v).toLocaleString('pt-BR', { minimumFractionDigits: d===undefined?2:d, maximumFractionDigits: d===undefined?2:d });
PP.pct = (v, d) => PP.dec(v, d===undefined?1:d) + '%';

PP.parseMoney = s => {
  if (typeof s === 'number') return s;
  let t = String(s || '').trim().replace(/[R$\s ]/gi, '');
  if (!t) return 0;
  const neg = /^-/.test(t);
  t = t.replace(/-/g, '');
  if (t.includes(',')) {
    /* vírgula presente: ponto é separador de milhar. "1.234,56" → 1234.56 */
    t = t.replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}(\.\d{3})+$/.test(t)) {
    /* sem vírgula, mas em grupos de três: é milhar, não decimal.
       "34.500" tem de virar 34500, e não 34,5 — foi assim que o usuário digitou. */
    t = t.replace(/\./g, '');
  }
  const x = parseFloat(t);
  return (isFinite(x) ? x : 0) * (neg ? -1 : 1);
};

/* datas — tudo trafega como 'YYYY-MM-DD' no fuso LOCAL.
   (usar toISOString aqui viraria o dia à noite no Brasil, que é UTC-3) */
const isoLocal = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
PP.isoLocal = isoLocal;
PP.hoje = () => isoLocal(new Date());
PP.agora = () => new Date().toISOString();
PP.dt = iso => {
  if (!iso) return '—';
  const s = String(iso).slice(0, 10).split('-');
  return s.length === 3 ? `${s[2]}/${s[1]}/${s[0]}` : '—';
};
PP.dtCurto = iso => {
  if (!iso) return '—';
  const s = String(iso).slice(0, 10).split('-');
  return s.length === 3 ? `${s[2]}/${s[1]}` : '—';
};
PP.dtHora = iso => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d)) return PP.dt(iso);
  return d.toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
};
PP.addDias = (iso, n) => {
  const d = new Date((iso || PP.hoje()) + 'T12:00:00');
  d.setDate(d.getDate() + PP.n(n));
  return isoLocal(d);
};
PP.addMeses = (iso, n) => {
  const base = (iso || PP.hoje()).slice(0, 10).split('-').map(Number);
  const d = new Date(base[0], base[1] - 1 + PP.n(n), base[2], 12);
  return isoLocal(d);
};
PP.diasEntre = (a, b) => Math.round((new Date((b||PP.hoje())+'T12:00:00') - new Date((a||PP.hoje())+'T12:00:00')) / 864e5);
PP.mesKey = iso => String(iso || PP.hoje()).slice(0, 7);
const MESES = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const MESES_L = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
PP.mesNome = mk => { const p = String(mk).split('-'); return (MESES[PP.n(p[1]) - 1] || '?') + '/' + String(p[0]).slice(2); };
PP.mesNomeLongo = mk => { const p = String(mk).split('-'); return (MESES_L[PP.n(p[1]) - 1] || '?') + ' de ' + p[0]; };
PP.ultimosMeses = n => {
  const out = [], d = new Date();
  d.setDate(1);
  for (let i = n - 1; i >= 0; i--) {
    const x = new Date(d.getFullYear(), d.getMonth() - i, 1);
    out.push(x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0'));
  }
  return out;
};
PP.tempoRelativo = iso => {
  if (!iso) return '—';
  const d = Math.abs(PP.diasEntre(String(iso).slice(0,10), PP.hoje()));
  if (d === 0) return 'hoje';
  if (d === 1) return 'ontem';
  if (d < 30) return `há ${d} dias`;
  if (d < 60) return 'há 1 mês';
  return `há ${Math.floor(d / 30)} meses`;
};

/* texto */
PP.digitos = s => String(s || '').replace(/\D/g, '');
PP.fone = s => {
  const d = PP.digitos(s);
  if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  return s || '—';
};
PP.doc = s => {
  const d = PP.digitos(s);
  if (d.length === 11) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
  if (d.length === 14) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12)}`;
  return s || '—';
};
PP.cep = s => { const d = PP.digitos(s); return d.length === 8 ? `${d.slice(0,5)}-${d.slice(5)}` : (s || '—'); };
PP.iniciais = nome => String(nome || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?';
PP.slug = s => String(s||'').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
PP.norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
PP.trunc = (s, n) => { s = String(s || ''); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
PP.plural = (n, sing, plur) => PP.n(n) === 1 ? `1 ${sing}` : `${PP.n(n)} ${plur || sing + 's'}`;

PP.debounce = (fn, ms) => { let t; return function () { clearTimeout(t); const a = arguments, c = this; t = setTimeout(() => fn.apply(c, a), ms || 220); }; };
PP.sortBy = (arr, key, dir) => arr.slice().sort((a, b) => {
  const x = typeof key === 'function' ? key(a) : a[key];
  const y = typeof key === 'function' ? key(b) : b[key];
  if (x === y) return 0;
  const r = (x > y || x === null || x === undefined) ? 1 : -1;
  return dir === 'desc' ? -r : r;
});
PP.soma = (arr, f) => arr.reduce((s, x) => s + PP.n(typeof f === 'function' ? f(x) : x[f]), 0);
PP.agrupar = (arr, f) => arr.reduce((m, x) => { const k = typeof f === 'function' ? f(x) : x[f]; (m[k] = m[k] || []).push(x); return m; }, {});

/* financeiro: PMT (prestação de financiamento) */
PP.pmt = (valor, jurosMes, n) => {
  const i = PP.n(jurosMes) / 100, p = PP.n(valor), N = PP.n(n);
  if (N <= 0) return 0;
  if (i <= 0) return p / N;
  return p * (i * Math.pow(1 + i, N)) / (Math.pow(1 + i, N) - 1);
};

/* dinheiro sempre em centavos fechados — nada de R$ 2.733,7245 no banco */
PP.cent = v => Math.round(PP.n(v) * 100) / 100;

/**
 * Divide um valor em n parcelas fechadas em centavos. A diferença de
 * arredondamento vai toda para a ÚLTIMA parcela, então a soma bate exatamente.
 */
PP.parcelar = (total, n, jurosMes) => {
  const N = Math.max(PP.n(n), 1);
  const bruta = PP.n(jurosMes) > 0 ? PP.pmt(total, jurosMes, N) : PP.n(total) / N;
  const parcela = PP.cent(bruta);
  const out = [];
  for (let i = 0; i < N - 1; i++) out.push(parcela);
  /* com juros o total contratado é parcela×N; sem juros tem de fechar no valor */
  const ultima = PP.n(jurosMes) > 0 ? parcela : PP.cent(PP.n(total) - parcela * (N - 1));
  out.push(ultima);
  return out;
};

/* ============================== CACHE POR COLEÇÃO ============================== */

/* Índices derivados (ex.: reservas de estoque) são caros de recalcular e eram
   refeitos dezenas de vezes por render. Ficam em cache até a coleção mudar. */
const CACHE = {};
/* Cache derivado: resultado que depende de VÁRIAS coleções ao mesmo tempo
   (a DRE, a lista de alertas). Guardar sem declarar a dependência é como
   servir número velho — por isso o cálculo se registra aqui e cai fora
   sozinho quando qualquer uma das fontes muda. */
const DERIVADOS = {};
PP.registrarDerivado = (nome, fontes) => { DERIVADOS[nome] = fontes; };

PP.invalidarCache = col => {
  if (!col) { Object.keys(CACHE).forEach(k => delete CACHE[k]); return; }
  delete CACHE[col];
  Object.keys(DERIVADOS).forEach(n => { if (DERIVADOS[n].indexOf(col) >= 0) delete CACHE[n]; });
};
PP.cacheDe = (col, chave, calc) => {
  const c = CACHE[col] = CACHE[col] || {};
  if (c[chave] === undefined) c[chave] = calc();
  return c[chave];
};

/* ============================== PERSISTÊNCIA ==============================

   A fonte da verdade é o banco. O navegador mantém a cópia de trabalho e um
   diário local apenas das alterações ainda não confirmadas. Quem conversa com o banco é o
   DRIVER; o resto do sistema continua chamando PP.all/PP.upsert/PP.save sem
   saber de onde o dado vem. Em produção o driver é o Supabase; nos testes é um
   driver de memória. Trocar um pelo outro não muda uma linha das telas.

   `base` guarda a foto do que o banco confirmou. A diferença entre `base` e
   `data` é, por definição, exatamente o que falta gravar — inclusive o que foi
   APAGADO, que é o que a sincronização antiga nunca soube dizer.
   ========================================================================== */

const COLS = ['config','usuarios','vendedores','equipes','equipesObra','produtos','fornecedores','leads','clientes',
              'orcamentos','pedidos','obras','compras','estoqueMov','financeiro','comissoes','contratos','chamados','vendas'];

PP.COLS = COLS;

const base = {};
const clonar = v => JSON.parse(JSON.stringify(v));

/** Driver de memória: usado pelos testes e enquanto o de verdade não entra. */
PP.driver = {
  nome: 'memoria',
  async carregar() { return {}; },
  async gravar() {},
  async reservarNumeros(campo, qtd) {
    PP.driver._n = PP.driver._n || {};
    const atual = PP.driver._n[campo] || 1;
    PP.driver._n[campo] = atual + qtd;
    return atual;
  }
};

/* Estado da gravação, para a barra de status saber o que dizer. */
PP.gravacao = { estado: 'ocioso', pendentes: 0, erro: '' };
function anunciar(estado, erro) {
  PP.gravacao.estado = estado;
  PP.gravacao.erro = erro || '';
  PP.gravacao.pendentes = db.pendentes.size;
  if (PP.pintarStatusNuvem) PP.pintarStatusNuvem();
}

/** O que mudou nesta coleção desde a última confirmação do banco. */
function diferenca(col) {
  if (col === 'config') {
    return JSON.stringify(db.data.config) === JSON.stringify(base.config)
      ? null : { config: clonar(db.data.config) };
  }
  const antes = {};
  (base[col] || []).forEach(r => antes[r.id] = JSON.stringify(r));
  const upserts = [];
  const vivos = new Set();
  (db.data[col] || []).forEach(r => {
    vivos.add(r.id);
    if (antes[r.id] !== JSON.stringify(r)) upserts.push(clonar(r));
  });
  const exclusoes = Object.keys(antes).filter(id => !vivos.has(id));
  const versoes = {};
  (base[col] || []).forEach(r => { versoes[r.id] = r.atualizadoEm || null; });
  return (upserts.length || exclusoes.length) ? { upserts, exclusoes, versoes } : null;
}

let gravando = false, espera = null, tentativas = 0, envio = null, bloqueado = false;
let persistencia = Promise.resolve(), persistencias = 0, avisoJornal = false;

function chaveJornal() {
  const sessao = PP.nuvem && PP.nuvem.sessao;
  const empresa = PP.empresaAtual && PP.empresaAtual();
  return PP.driver.nome === 'supabase' && sessao && sessao.user && empresa
    ? `v1:${sessao.user.id}:${empresa}` : '';
}

function fotografarPendencias() {
  const cols = new Set([...db.pendentes, ...Object.keys(envio ? envio.lote : {})]);
  const data = {}, confirmada = {};
  cols.forEach(c => { data[c] = clonar(db.data[c]); confirmada[c] = clonar(base[c]); });
  return { versao:1, data, base:confirmada, pendentes:[...db.pendentes], envio:envio ? clonar(envio) : null };
}

function avisarFalhaJornal(e) {
  PP.gravacao.diarioErro = e.message || String(e);
  if (!avisoJornal) {
    avisoJornal = true;
    PP.toast('O navegador não conseguiu proteger alterações pendentes. Não feche a aba até confirmar a gravação.', 'err');
  }
  anunciar(PP.gravacao.estado, PP.gravacao.erro);
}

function persistirPendencias() {
  const chave = chaveJornal();
  if (!chave || !PP.jornal) return Promise.resolve();
  const foto = fotografarPendencias();
  persistencias++;
  persistencia = persistencia.catch(() => {}).then(() =>
    foto.pendentes.length || foto.envio ? PP.jornal.salvar(chave, foto) : PP.jornal.apagar(chave)
  ).then(() => { PP.gravacao.diarioErro = ''; avisoJornal = false; })
    .finally(() => { persistencias--; });
  return persistencia;
}

function agendar() {
  if (espera || gravando || bloqueado) return;
  espera = setTimeout(() => { espera = null; descarregar(); }, 250);
}

/** Leva ao banco tudo que está pendente. O ID da operação fica no diário
    antes do envio, para uma repetição após queda continuar idempotente. */
async function descarregar() {
  if (gravando || bloqueado || (!db.pendentes.size && !envio)) return;
  gravando = true;
  anunciar('gravando');

  const cols = COLS.filter(c => db.pendentes.has(c));   /* ordem de FK: pai antes de filho */
  if (!envio) {
    const lote = {}, fotos = {};
    cols.forEach(c => {
      const d = diferenca(c);
      if (d) { lote[c] = d; fotos[c] = clonar(db.data[c]); }
      db.pendentes.delete(c);
    });
    envio = { id:PP.uid('op'), lote, fotos };
  }
  const { lote, fotos } = envio;

  if (!Object.keys(lote).length) { envio = null; gravando = false; anunciar('ocioso'); return; }

  try {
    await persistirPendencias().catch(avisarFalhaJornal);
    const confirmados = await PP.driver.gravar(lote, envio.id);
    Object.keys(fotos).forEach(c => {
      base[c] = fotos[c];
      if (c === 'config') return;
      ((confirmados || {})[c] || []).forEach(r => {
        const foto = base[c].find(x => x.id === r.id);
        const local = db.data[c].find(x => x.id === r.id);
        if (local && foto && JSON.stringify(local) === JSON.stringify(foto)) Object.assign(local, r);
        else if (local) local.atualizadoEm = r.atualizadoEm;
        if (foto) Object.assign(foto, r);
      });
    });
    envio = null;
    await persistirPendencias().catch(avisarFalhaJornal);
    if (PP.nuvem) PP.nuvem.epoca=(PP.nuvem.epoca || 0)+1;
    tentativas = 0;
    gravando = false;
    anunciar(db.pendentes.size ? 'gravando' : 'ocioso');
    if (db.pendentes.size) agendar();
  } catch (e) {
    /* devolve para a fila e tenta de novo; `base` continua onde estava, então
       a diferença é recalculada e nada do que o usuário fez se perde */
    // Mantém o mesmo id e conteúdo nas tentativas, inclusive se a resposta se perder.
    Object.keys(lote).forEach(c => db.pendentes.add(c));
    persistirPendencias().catch(avisarFalhaJornal);
    gravando = false;
    tentativas++;
    anunciar('erro', e.message || String(e));
    console.error('[PP] falha ao gravar no banco', e);
    if (tentativas === 1) PP.toast('Não consegui gravar no servidor: ' + (e.message || e) + ' — tentando de novo.', 'err');
    bloqueado = e.definitivo === true;
    if (!bloqueado) setTimeout(() => { descarregar(); }, Math.min(2000 * tentativas, 30000));
  }
}

const db = PP.db = {
  data: {},
  pendentes: new Set(),

  /** Traz tudo do banco para a memória desta sessão. */
  async carregar() {
    await persistencia.catch(() => {});
    /* O provedor não tem operação: as tabelas de negócio não são dele e a RLS
       devolveria vazio de qualquer forma. Poupa 18 consultas por entrada. */
    const vindo = (PP.ehProvedor && PP.ehProvedor()) ? {} : await PP.driver.carregar();
    COLS.forEach(c => {
      const v = vindo[c];
      db.data[c] = (v !== undefined && v !== null) ? v : (c === 'config' ? {} : []);
      base[c] = clonar(db.data[c]);
    });
    if (!db.data.config || typeof db.data.config !== 'object') db.data.config = {};
    Object.keys(PP.CONFIG_PADRAO).forEach(k => {
      if (db.data.config[k] === undefined) db.data.config[k] = PP.CONFIG_PADRAO[k];
    });
    db.pendentes.clear();
    envio = null; bloqueado = false;
    const chave = chaveJornal();
    if (chave && PP.jornal) {
      const salvo = await PP.jornal.ler(chave).catch(e => { avisarFalhaJornal(e); return null; });
      if (salvo && salvo.versao === 1) {
        Object.keys(salvo.data || {}).filter(c => COLS.includes(c)).forEach(c => {
          db.data[c] = salvo.data[c];
          base[c] = salvo.base[c];
        });
        db.pendentes = new Set((salvo.pendentes || []).filter(c => COLS.includes(c)));
        envio = salvo.envio || null;
        if (db.pendentes.size || envio) {
          PP.toast('Alterações pendentes de uma sessão anterior foram recuperadas.', 'warn');
          agendar();
        }
      }
    }
    PP.invalidarCache();
    anunciar(db.pendentes.size || envio ? 'gravando' : 'ocioso');
  },

  save(col) {
    db.pendentes.add(col);
    PP.invalidarCache(col);
    anunciar('gravando');
    persistirPendencias().catch(avisarFalhaJornal);
    agendar();
  },

  saveAll() { COLS.forEach(c => db.save(c)); },

  /** Espera a fila esvaziar. Usado antes de recarregar e pelos testes. */
  async aguardar() {
    const limite = Date.now() + 15000;
    while ((db.pendentes.size || gravando || envio || persistencias) && Date.now() < limite) {
      if (bloqueado) return false;
      if (!gravando) await descarregar();
      if (PP.gravacao.estado === 'erro') return false;
      await new Promise(r => setTimeout(r, 25));
    }
    return !db.pendentes.size && !gravando && !envio && !persistencias;
  },
  async confirmar() {
    if (!await db.aguardar()) throw new Error(PP.gravacao.erro || 'Ainda há alterações sem confirmação do servidor. Tente novamente.');
  },
  incorporar(col, registros) {
    if (!Array.isArray(db.data[col])) db.data[col] = [];
    if (!Array.isArray(base[col])) base[col] = [];
    registros.forEach(r => {
      [db.data[col],base[col]].forEach(lista => {
        const i=lista.findIndex(x=>x.id===r.id);
        if (i<0) lista.push(clonar(r)); else lista[i]=clonar(r);
      });
    });
    PP.invalidarCache(col);
  }
};

/* Estrutura vazia desde o começo: a tela de login já lê PP.cfg(), e isso
   acontece antes de existir qualquer carga do banco. */
COLS.forEach(c => { db.data[c] = c === 'config' ? {} : []; base[c] = c === 'config' ? {} : []; });

/* Fechar a aba com coisa por gravar significa perder. Avisa. */
window.addEventListener('beforeunload', ev => {
  if (!db.pendentes.size && !gravando && !envio && !persistencias) return;
  ev.preventDefault();
  ev.returnValue = '';
  return '';
});

/* ============================== NUMERAÇÃO ==============================
   O número do documento não pode repetir entre dois caixas. Quem decide é o
   banco: reservamos um bloco pequeno e servimos dele, para a chamada seguir
   síncrona como o resto do sistema. Sobra de bloco vira buraco na numeração —
   por isso o bloco é de 5, e não de 50. */

const BLOCO = 5;
const blocos = {};
const reabastecendo = {};

async function reabastecer(campo) {
  if (reabastecendo[campo]) return;
  reabastecendo[campo] = true;
  try {
    const inicio = await PP.driver.reservarNumeros(campo, BLOCO);
    const b = blocos[campo];
    if (!b || b.proximo >= b.fim) blocos[campo] = { proximo: inicio, fim: inicio + BLOCO };
    else b.reserva = { proximo: inicio, fim: inicio + BLOCO };
  } catch (e) {
    console.warn('[PP] não consegui reservar numeração de ' + campo, e.message);
  } finally { reabastecendo[campo] = false; }
}

PP.CAMPOS_NUMERO = ['proximoNumOrc','proximoNumPedido','proximoNumCompra',
                    'proximoNumContrato','proximoNumChamado','proximoNumVenda'];

/** Reserva o primeiro bloco de cada contador. Roda no boot. */
PP.prepararNumeracao = async () => {
  if (PP.ehProvedor && PP.ehProvedor()) return;   /* provedor não emite documento */
  await Promise.all(PP.CAMPOS_NUMERO.map(c => reabastecer(c)));
};

/** Próximo número livre deste tipo de documento. */
PP.proximoNumero = campo => {
  let b = blocos[campo];
  if (b && b.proximo >= b.fim && b.reserva) b = blocos[campo] = b.reserva;
  if (!b || b.proximo >= b.fim) {
    reabastecer(campo);
    throw new Error('Numeração indisponível no momento — tente de novo em instantes.');
  }
  const n = b.proximo++;
  if (b.fim - b.proximo <= 2) reabastecer(campo);   /* busca o próximo bloco antes de faltar */
  return n;
};

/** Numeração sem ida ao banco — só para os testes, que rodam sem servidor. */
PP.numeracaoDeTeste = () => {
  const inicio = { proximoNumOrc:1001, proximoNumPedido:5001, proximoNumCompra:9001,
                   proximoNumContrato:3001, proximoNumChamado:7001, proximoNumVenda:1 };
  PP.CAMPOS_NUMERO.forEach(c => { blocos[c] = { proximo: inicio[c], fim: inicio[c] + 100000 }; });
};

/**
 * Relê tudo do banco. Ponto ÚNICO usado pelo boot, pelo "restaurar dados de
 * exemplo" e pela restauração de backup. Antes de reler, esvazia a fila de
 * gravação: recarregar por cima de coisa não gravada apagaria o trabalho.
 */
PP.recarregarTudo = async () => {
  await db.confirmar();
  await db.carregar();
  await PP.prepararNumeracao();
};

/* ============================== MIGRAÇÃO DE BACKUP ============================== */

PP.VERSAO_BACKUP = 5;

PP.validarBackup = (pacote, antigo) => {
  if (!pacote || typeof pacote !== 'object' || Array.isArray(pacote)) throw new Error('Backup precisa ser um objeto.');
  if (!pacote.config || typeof pacote.config !== 'object' || Array.isArray(pacote.config)) throw new Error('Configuração do backup inválida.');
  PP.COLS.filter(c=>c!=='config').forEach(col=>{
    if (antigo && pacote[col] === undefined) return;
    if (!Array.isArray(pacote[col])) throw new Error('Coleção inválida: '+col);
    const ids=new Set();
    pacote[col].forEach(r=>{
      if (!r || typeof r!=='object' || Array.isArray(r) || typeof r.id!=='string' || !r.id.trim()) throw new Error('Registro inválido em '+col);
      if (ids.has(r.id)) throw new Error('ID duplicado em '+col+': '+r.id);
      ids.add(r.id);
      ['itens','interacoes','checklist','notas'].forEach(k=>{
        if (r[k]!==undefined && !Array.isArray(r[k])) throw new Error('Campo inválido: '+col+'.'+k);
      });
      if (r.itens) r.itens.forEach(i=>{
        if (!i || typeof i.produtoId!=='string' || !Number.isFinite(Number(i.qtd)) || Number(i.qtd)<=0) throw new Error('Item inválido em '+col);
      });
    });
  });
  return pacote;
};

// Guarda a intenção e sua chave enquanto o resultado for incerto. Repetir a
// ação consulta a mesma operação no banco, sem criar outra venda.
const fechamentos = new Map();
PP.fecharVendaConfirmada = async (tipo,dados,chave) => {
  let op=fechamentos.get(chave);
  if (op && op.executando) throw new Error('Esta venda já está sendo processada.');
  if (!op) { op={ id:PP.uid('venda'), dados:clonar(dados) }; fechamentos.set(chave,op); }
  op.executando=true;
  try {
    await db.confirmar();
    if (!op.resultado) op.resultado=await PP.driver.fecharVenda(tipo,op.dados,op.id);
    const col=tipo==='pedido'?'pedidos':'vendas';
    const documento=await PP.driver.buscarRegistro(col,op.resultado.id);
    db.incorporar(col,[documento]);
    // Recarregar falhou? O documento confirmado continua disponível e não é reenviado.
    try { await PP.recarregarTudo(); }
    catch (e) { PP.toast('Venda gravada. Não foi possível atualizar os outros dados: '+e.message,'warn'); }
    return tipo==='pedido'?{pedido:documento}:{venda:documento};
  } catch(e) {
    if (e.definitivo && !op.resultado) fechamentos.delete(chave);
    throw e;
  } finally { op.executando=false; }
};

/**
 * Converte um pacote de backup antigo para o formato atual, no lugar.
 * O schema já mudou três vezes; sem isso, restaurar um arquivo de semanas atrás
 * traria pedidos sem foto financeira e coleções inexistentes.
 */
PP.migrarBackup = (pacote, de) => {
  /* Garantir que toda coleção exista NÃO pode depender do número de versão:
     arquivos gravados como "v2" existem com e sem as coleções de acesso e
     pós-venda, porque o schema mudou antes de o número ser incrementado.
     Este passo é idempotente, então roda sempre. */
  PP.COLS.forEach(c => {
    if (c === 'config') { if (!pacote.config || typeof pacote.config !== 'object') pacote.config = {}; }
    else if (!Array.isArray(pacote[c])) pacote[c] = [];
  });
  /* v2 → v3: dinheiro fechado em centavos */
  if (de < 3) {
    (pacote.financeiro || []).forEach(f => f.valor = PP.cent(f.valor));
    (pacote.comissoes || []).forEach(c => { c.base = PP.cent(c.base); c.valor = PP.cent(c.valor); });
  }
  /* v4 → v5: entrou a venda de balcão */
  if (de < 5) { if (!Array.isArray(pacote.vendas)) pacote.vendas = []; }
  /* v3 → v4: o pedido passou a guardar a própria foto financeira */
  if (de < 4) {
    const orcs = pacote.orcamentos || [];
    (pacote.pedidos || []).forEach(p => {
      if (p.total !== undefined) return;
      const o = orcs.find(x => x.id === p.orcamentoId);
      if (!o) return;
      const sub = (o.itens || []).reduce((s, i) => s + PP.n(i.qtd) * PP.n(i.preco), 0);
      const desc = sub * PP.n(o.descontoPct) / 100;
      p.subtotal = PP.cent(sub);
      p.descontoPct = PP.n(o.descontoPct);
      p.descontoValor = PP.cent(desc);
      p.total = PP.cent(sub - desc);
      p.custo = PP.cent((o.itens || []).reduce((s, i) => s + PP.n(i.qtd) * PP.n(i.custo), 0));
      p.itens = JSON.parse(JSON.stringify(o.itens || []));
      p.condicao = JSON.parse(JSON.stringify(o.condicao || {}));
    });
    (pacote.obras || []).forEach(o => { if (o.duracaoDias === undefined) o.duracaoDias = 3; });
  }
  pacote._versao = PP.VERSAO_BACKUP;
  return pacote;
};

PP.all = col => db.data[col] || [];
PP.cfg = () => db.data.config;
PP.find = (col, id) => PP.all(col).find(x => x.id === id) || null;
PP.where = (col, fn) => PP.all(col).filter(fn);
PP.save = col => { db.save(col); };

PP.upsert = (col, obj) => {
  const arr = db.data[col];
  if (!obj.id) {
    obj.id = PP.uid(col.slice(0, 3));
    obj.criadoEm = obj.criadoEm || PP.agora();
    obj.atualizadoEm = obj.criadoEm;
    arr.unshift(obj);
  } else {
    const i = arr.findIndex(x => x.id === obj.id);
    obj.atualizadoEm = PP.agora();
    if (i >= 0) arr[i] = Object.assign({}, arr[i], obj); else arr.unshift(obj);
  }
  db.save(col);
  return obj.id;
};
PP.remove = (col, id) => {
  const arr = db.data[col];
  const i = arr.findIndex(x => x.id === id);
  if (i >= 0) { arr.splice(i, 1); db.save(col); return true; }
  return false;
};

PP.CONFIG_PADRAO = {
  empresa: 'PiscinaPro Piscinas de Fibra',
  cnpj: '', fone: '', email: '', site: '', endereco: '',
  metaPadrao: 45000,
  comissaoPct: 3,
  comissaoBase: 'faturamento',      /* 'faturamento' | 'margem' | 'metro' */
  comissaoPorMetro: 100,            /* R$ por metro de piscina, quando a base é 'metro' */
  jurosMes: 1.79,
  parcelasMax: 36,
  validadeProposta: 15,
  descontoMaxPct: 12,
  exigirAprovacaoDesconto: true,
  garantiaCasco: 15,
  garantiaEquip: 1,
  prazoInstalacaoDias: 10,
  ddi: '55',
  avisoBackupDias: 7,
  ultimoBackup: '',
  /* a numeração saiu daqui: quem guarda é a tabela `contadores` no banco */
  /* balcão: comissão menor que a de piscina, e desconto com alçada própria */
  comissaoBalcaoPct: 2,
  descontoMaxBalcaoPct: 10,
  balcaoExigeCliente: false,
  msgPrimeiroContato: 'Olá {cliente}, aqui é {vendedor} da {empresa}. Recebi seu contato sobre a piscina — posso te mandar os modelos e valores por aqui?',
  msgProposta: 'Olá {cliente}! Segue a proposta nº {numero} da {modelo}: {total}, com entrada de {entrada} e {parcelas}. A proposta vale até {validade}. Qualquer dúvida é só chamar. — {vendedor}, {empresa}',
  msgFollowUp: 'Oi {cliente}, tudo bem? Passando pra saber se conseguiu analisar a proposta nº {numero}. Fico à disposição! — {vendedor}',
  msgAgendamento: 'Olá {cliente}! Confirmando a instalação da sua piscina para {data}. A equipe chega pela manhã. Precisamos do acesso liberado para a máquina. — {empresa}',
  msgCobranca: 'Olá {cliente}, tudo bem? Identificamos a parcela de {valor} com vencimento em {vencimento} ainda em aberto. Qualquer coisa me chama por aqui. — {empresa}'
};

/* Os padrões valem já na abertura, antes de o banco responder: a tela de
   login mostra o nome da empresa e a numeração precisa dos campos. */
Object.keys(PP.CONFIG_PADRAO).forEach(k => {
  if (db.data.config[k] === undefined) db.data.config[k] = PP.CONFIG_PADRAO[k];
});


/* A numeração mora no banco (tabela `contadores`), não mais na config: dois
   caixas vendendo ao mesmo tempo não podem receber o mesmo número. Ver o bloco
   NUMERAÇÃO lá em cima. */

/* ============================== DOMÍNIO ============================== */

PP.ETAPAS = [
  { id:'novo',       nome:'Novo',        cor:'#8C9BA1', prob:10 },
  { id:'contato',    nome:'Em contato',  cor:'#2A5D9E', prob:25 },
  { id:'visita',     nome:'Visita téc.', cor:'#12A0A8', prob:45 },
  { id:'proposta',   nome:'Proposta',    cor:'#0E7C86', prob:65 },
  { id:'negociacao', nome:'Negociação',  cor:'#B9812F', prob:82 },
  { id:'ganho',      nome:'Ganho',       cor:'#1E7A4B', prob:100 },
  { id:'perdido',    nome:'Perdido',     cor:'#A8322C', prob:0 }
];
PP.etapa = id => PP.ETAPAS.find(e => e.id === id) || PP.ETAPAS[0];
PP.ETAPAS_ATIVAS = ['novo','contato','visita','proposta','negociacao'];

PP.ORIGENS = ['Instagram','Facebook','Google / Site','Indicação','Loja física','Feira / Evento','WhatsApp','Telefone','Outdoor','Outro'];

PP.MOTIVOS_PERDA = ['Preço acima do orçamento','Comprou do concorrente','Sem espaço / terreno','Adiou o projeto','Não respondeu mais','Não tinha perfil','Outro'];

PP.STATUS_ORC = {
  rascunho:  { nome:'Rascunho',   cls:'' },
  aprovacao: { nome:'Aguardando alçada', cls:'b-areia' },
  enviado:   { nome:'Enviado',    cls:'b-info' },
  negociando:{ nome:'Negociando', cls:'b-warn' },
  aprovado:  { nome:'Aprovado',   cls:'b-ok' },
  recusado:  { nome:'Recusado',   cls:'b-dang' },
  expirado:  { nome:'Expirado',   cls:'b-dang' }
};
/* orçamentos que ainda "seguram" estoque (proposta viva na rua) */
PP.ORC_RESERVA = ['aprovacao','enviado','negociando'];

PP.STATUS_CONTRATO = {
  ativo:     { nome:'Ativo',     cls:'b-ok' },
  suspenso:  { nome:'Suspenso',  cls:'b-warn' },
  encerrado: { nome:'Encerrado', cls:'' }
};
PP.PERIODICIDADES = [
  { v:'mensal',     l:'Mensal',      meses:1 },
  { v:'quinzenal',  l:'Quinzenal',   meses:1 },
  { v:'bimestral',  l:'Bimestral',   meses:2 },
  { v:'trimestral', l:'Trimestral',  meses:3 }
];

/* Venda de balcão: cloro, insumos e acessórios vendidos na hora, na loja.
   Diferente do "pedido", que é a venda de piscina com obra e parcelamento longo. */
PP.STATUS_VENDA = {
  concluida: { nome:'Concluída', cls:'b-ok' },
  cancelada: { nome:'Cancelada', cls:'b-dang' }
};
/* categorias que fazem sentido no balcão — piscina não se vende por impulso */
PP.CATEGORIAS_BALCAO = ['Insumo','Adicional','Equipamento','Serviço'];

PP.TIPOS_CHAMADO = ['Garantia','Manutenção','Reparo','Vazamento','Equipamento','Dúvida técnica','Outro'];
PP.STATUS_CHAMADO = {
  aberto:     { nome:'Aberto',        cls:'b-dang' },
  triagem:    { nome:'Em triagem',    cls:'b-warn' },
  agendado:   { nome:'Visita agendada', cls:'b-info' },
  execucao:   { nome:'Em execução',   cls:'b-teal' },
  resolvido:  { nome:'Resolvido',     cls:'b-ok' },
  cancelado:  { nome:'Cancelado',     cls:'' }
};
PP.STATUS_OBRA = {
  aguardando: { nome:'Aguardando',    cls:'', pc:0 },
  agendada:   { nome:'Agendada',      cls:'b-info', pc:10 },
  escavacao:  { nome:'Escavação',     cls:'b-warn', pc:30 },
  assentamento:{nome:'Assentamento',  cls:'b-warn', pc:55 },
  hidraulica: { nome:'Hidráulica',    cls:'b-teal', pc:75 },
  acabamento: { nome:'Acabamento',    cls:'b-teal', pc:90 },
  concluida:  { nome:'Concluída',     cls:'b-ok', pc:100 },
  cancelada:  { nome:'Cancelada',     cls:'b-dang', pc:0 }
};
PP.ETAPAS_OBRA = ['aguardando','agendada','escavacao','assentamento','hidraulica','acabamento','concluida'];

PP.CHECKLIST_OBRA = [
  'Medição e marcação do terreno',
  'Liberação de acesso para máquina',
  'Escavação concluída',
  'Nivelamento e base de areia',
  'Descarga e assentamento do casco',
  'Instalação hidráulica (sucção/retorno)',
  'Casa de máquinas montada',
  'Reaterro compactado',
  'Teste de estanqueidade',
  'Acabamento de borda',
  'Enchimento e balanceamento químico',
  'Treinamento do cliente',
  'Termo de entrega assinado'
];

/* Implementações neutras — auth.js sobrescreve com as regras de papel.
   Ficam aqui para o núcleo nunca depender da ordem de carga dos scripts. */
PP.podeAcessar   = () => true;
PP.ehGestor      = () => true;
PP.podeVerCusto  = () => true;
PP.vendedorAtual = () => '';
PP.escopo        = arr => arr;

/**
 * Mapa produtoId → quantidade presa em propostas vivas na rua.
 * Calculado UMA vez por mudança em orçamentos, não a cada consulta: antes disso
 * o badge do menu sozinho varria todos os orçamentos 42 vezes por render.
 */
PP.reservasMapa = () => PP.cacheDe('orcamentos', 'reservas', () => {
  const m = {};
  PP.all('orcamentos').forEach(o => {
    if (!PP.ORC_RESERVA.includes(o.status)) return;
    (o.itens || []).forEach(i => { m[i.produtoId] = (m[i.produtoId] || 0) + PP.n(i.qtd); });
  });
  return m;
});

/** Estoque reservado por propostas vivas na rua (não vendido ainda) */
PP.reservado = produtoId => PP.reservasMapa()[produtoId] || 0;

/** Estoque realmente disponível para prometer a um novo cliente */
PP.disponivel = produtoId => {
  const p = PP.find('produtos', produtoId);
  if (!p || !p.controlaEstoque) return 0;
  return PP.n(p.estoque) - PP.reservado(produtoId);
};

/* ============================== INTEGRIDADE REFERENCIAL ============================== */

/**
 * O que depende de um registro antes de apagá-lo.
 * `bloqueia: true` → exclusão proibida (quebraria um documento emitido ou dinheiro em aberto).
 * `bloqueia: false` → vira órfão; o chamador limpa a referência.
 */
PP.dependentes = (tipo, id) => {
  const out = [];
  const add = (col, fn, rotulo, plural, bloqueia) => {
    const itens = PP.where(col, fn);
    if (itens.length) out.push({ col, itens, qtd:itens.length, rotulo, plural:plural || rotulo + 's', bloqueia:!!bloqueia });
  };
  switch (tipo) {
    case 'lead':
      add('clientes',   c => c.leadId === id, 'cliente', 'clientes', true);
      add('orcamentos', o => o.leadId === id, 'orçamento', 'orçamentos', false);
      break;
    case 'cliente':
      add('pedidos',    p => p.clienteId === id, 'pedido', 'pedidos', true);
      add('obras',      o => o.clienteId === id, 'obra', 'obras', true);
      add('contratos',  c => c.clienteId === id && c.status === 'ativo', 'contrato ativo', 'contratos ativos', true);
      add('chamados',   c => c.clienteId === id && c.status !== 'resolvido' && c.status !== 'cancelado', 'chamado aberto', 'chamados abertos', true);
      add('financeiro', f => f.clienteId === id && f.status === 'aberto', 'lançamento em aberto', 'lançamentos em aberto', true);
      add('orcamentos', o => o.clienteId === id, 'orçamento', 'orçamentos', false);
      break;
    case 'produto':
      add('orcamentos', o => (o.itens || []).some(i => i.produtoId === id), 'orçamento', 'orçamentos', false);
      add('pedidos',    p => (p.itens || []).some(i => i.produtoId === id), 'pedido', 'pedidos', true);
      add('compras',    c => c.status !== 'cancelado' && (c.itens || []).some(i => i.produtoId === id), 'pedido de compra', 'pedidos de compra', false);
      add('estoqueMov', m => m.produtoId === id, 'movimentação de estoque', 'movimentações de estoque', false);
      break;
    case 'vendedor':
      add('pedidos',    p => p.vendedorId === id, 'pedido', 'pedidos', true);
      add('comissoes',  c => c.vendedorId === id && c.status !== 'paga' && c.status !== 'cancelada', 'comissão pendente', 'comissões pendentes', true);
      add('usuarios',   u => u.vendedorId === id, 'acesso de usuário', 'acessos de usuário', true);
      add('leads',      l => l.vendedorId === id, 'lead', 'leads', false);
      add('orcamentos', o => o.vendedorId === id, 'orçamento', 'orçamentos', false);
      break;
    case 'fornecedor':
      add('compras',    c => c.fornecedorId === id && c.status !== 'cancelado', 'pedido de compra', 'pedidos de compra', true);
      add('financeiro', f => f.fornecedorId === id && f.status === 'aberto', 'conta a pagar em aberto', 'contas a pagar em aberto', true);
      add('produtos',   p => p.fornecedorId === id, 'produto', 'produtos', false);
      break;
    case 'equipeObra':
      add('obras',      o => o.equipeObraId === id && o.status !== 'concluida' && o.status !== 'cancelada', 'obra em andamento', 'obras em andamento', true);
      add('chamados',   c => c.equipeObraId === id && c.status !== 'resolvido' && c.status !== 'cancelado', 'chamado aberto', 'chamados abertos', true);
      add('obras',      o => o.equipeObraId === id, 'obra no histórico', 'obras no histórico', false);
      break;
    case 'orcamento':
      add('pedidos',    p => p.orcamentoId === id, 'pedido', 'pedidos', true);
      break;
    case 'contrato':
      add('financeiro', f => f.origem && f.origem.tipo === 'contrato' && f.origem.id === id && f.status === 'aberto', 'cobrança em aberto', 'cobranças em aberto', true);
      break;
  }
  return out;
};

const listar = deps => deps.map(d => `${d.qtd} ${d.qtd === 1 ? d.rotulo : d.plural}`).join(', ');

/**
 * Confirmação de exclusão que respeita os vínculos.
 * Retorna Promise<boolean>. Se houver bloqueio, avisa e resolve false.
 */
PP.confirmarExclusao = async (tipo, id, nome, opts) => {
  opts = opts || {};
  const deps = PP.dependentes(tipo, id);
  const bloqueios = deps.filter(d => d.bloqueia);
  const orfaos = deps.filter(d => !d.bloqueia);

  if (bloqueios.length) {
    PP.modal({
      title:'Não dá para excluir', sub:nome, size:'sm',
      body:`<div class="alert a-dang"><svg class="ic"><use href="#i-alerta"/></svg>
        <div>Existe ${esc(listar(bloqueios))} dependendo deste registro. Apagar deixaria documentos e valores sem origem.</div></div>
        ${opts.alternativa ? `<p class="small muted mt" style="margin-bottom:0">${esc(opts.alternativa)}</p>` : ''}`,
      actions:[{ txt:'Entendi', cls:'btn-primary', act:'fechar' }]
    });
    return false;
  }
  return PP.confirmar(
    opts.msg || `Excluir "${nome}"? Essa ação não pode ser desfeita.`,
    { perigo:true, okTxt:'Excluir',
      aviso: orfaos.length ? `Serão desvinculados: ${listar(orfaos)}. Os registros continuam existindo, sem apontar mais para este.` : '' }
  );
};

/** Limpa referências órfãs depois de uma exclusão autorizada. */
PP.desvincular = (tipo, id) => {
  const toca = new Set();
  const limpa = (col, fn, campo) => PP.where(col, fn).forEach(x => { x[campo] = ''; toca.add(col); });
  if (tipo === 'lead') limpa('orcamentos', o => o.leadId === id, 'leadId');
  if (tipo === 'cliente') limpa('orcamentos', o => o.clienteId === id, 'clienteId');
  if (tipo === 'vendedor') { limpa('leads', l => l.vendedorId === id, 'vendedorId'); limpa('orcamentos', o => o.vendedorId === id, 'vendedorId'); }
  if (tipo === 'fornecedor') limpa('produtos', p => p.fornecedorId === id, 'fornecedorId');
  if (tipo === 'equipeObra') { limpa('obras', o => o.equipeObraId === id, 'equipeObraId'); limpa('chamados', c => c.equipeObraId === id, 'equipeObraId'); }
  toca.forEach(col => PP.save(col));
};

PP.CATEGORIAS_PROD = ['Piscina','Adicional','Equipamento','Insumo','Serviço'];
PP.CAT_FIN = {
  receita: ['Venda de piscina','Venda de balcão','Serviço / manutenção','Outras receitas'],
  despesa: ['Compra de piscina','Equipamentos','Mão de obra','Máquinas / escavação','Frete','Comissão','Marketing','Administrativo','Impostos','Outras despesas']
};
PP.FORMAS_PAG = ['Dinheiro','PIX','Boleto','Cartão de crédito','Cartão de débito','Transferência','Financiamento','Cheque'];

/* ============================== AÇÕES (delegação) ============================== */

const ACTS = {};
PP.on = (nome, fn) => { ACTS[nome] = fn; };
/* usado em depuração: PP.acoesFaltando() lista data-act sem handler na tela atual */
PP.acoesRegistradas = () => Object.keys(ACTS);
PP.acoesFaltando = () => Array.from(new Set(
  Array.from(document.querySelectorAll('[data-act],[data-chg],[data-inp],[data-sub]'))
    .flatMap(el => [el.dataset.act, el.dataset.chg, el.dataset.inp, el.dataset.sub])
    .filter(Boolean))).filter(a => !ACTS[a]);
PP.run = (nome, el, ev) => {
  const fn = ACTS[nome];
  if (!fn) { console.warn('[PP] ação não registrada:', nome); return; }
  const falhou = e => {
    console.error('[PP] erro na ação "' + nome + '"', e);
    PP.toast('Erro em "' + nome + '": ' + (e && e.message ? e.message : e), 'err');
  };
  try {
    const r = fn(el ? el.dataset : {}, el, ev);
    /* Handler assíncrono rejeita DEPOIS que o try já retornou: sem este catch o
       erro virava unhandledrejection e a ação falhava em silêncio — justamente
       em baixarFin, pagarCom, receberCompra, liberarAlcada e nos excluir*. */
    if (r && typeof r.catch === 'function') r.catch(falhou);
    return r;
  } catch (e) { falhou(e); }
};

document.addEventListener('click', ev => {
  const el = ev.target.closest('[data-act]');
  if (!el || el.disabled) return;
  if (el.tagName === 'A' && el.getAttribute('href')) return;
  ev.preventDefault();
  PP.run(el.dataset.act, el, ev);
});
document.addEventListener('keydown', ev => {
  if (ev.key !== 'Enter' && ev.key !== ' ') return;
  const el = ev.target.closest('[data-act][tabindex]');
  if (!el || el.tagName === 'BUTTON' || el.tagName === 'A' || el.tagName === 'INPUT') return;
  ev.preventDefault();
  PP.run(el.dataset.act, el, ev);
});
document.addEventListener('change', ev => {
  const el = ev.target.closest('[data-chg]');
  if (!el) return;
  PP.run(el.dataset.chg, el, ev);
});
document.addEventListener('input', ev => {
  const el = ev.target.closest('[data-inp]');
  if (!el) return;
  PP.run(el.dataset.inp, el, ev);
});
document.addEventListener('submit', ev => {
  const el = ev.target.closest('[data-sub]');
  if (!el) return;
  ev.preventDefault();
  PP.run(el.dataset.sub, el, ev);
});

/* ============================== TOAST ============================== */

PP.toast = (msg, tipo) => {
  const box = document.getElementById('toasts');
  if (!box) return;
  const ics = { ok:'#i-check', err:'#i-alerta', warn:'#i-alerta' };
  const t = document.createElement('div');
  t.className = 'toast' + (tipo ? ' t-' + tipo : '');
  t.innerHTML = (ics[tipo] ? `<svg class="ic"><use href="${ics[tipo]}"/></svg>` : '') + `<span>${esc(msg)}</span>`;
  box.appendChild(t);
  setTimeout(() => { t.style.transition = 'opacity .25s, transform .25s'; t.style.opacity = '0'; t.style.transform = 'translateY(10px)'; setTimeout(() => t.remove(), 260); }, 3000);
};

/* ============================== OVERLAYS ============================== */

const overlays = [];
const $ov = () => document.getElementById('overlays');
const $scrim = () => document.getElementById('scrim');

function trapFocus(box) {
  const SEL = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  function onKey(e) {
    if (e.key === 'Escape') { e.stopPropagation(); PP.closeTop(); return; }
    if (e.key !== 'Tab') return;
    const f = Array.from(box.querySelectorAll(SEL)).filter(x => x.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  box.addEventListener('keydown', onKey);
}

function pushOverlay(node, onClose) {
  const prev = document.activeElement;
  overlays.push({ node, onClose, prev });
  $ov().appendChild(node);
  $scrim().hidden = false;
  document.body.style.overflow = 'hidden';
  trapFocus(node);
  setTimeout(() => {
    const f = node.querySelector('[autofocus],.inp,button:not([data-act="fechar"])');
    (f || node).focus({ preventScroll: true });
  }, 40);
}

PP.closeTop = () => {
  const o = overlays.pop();
  if (!o) return;
  o.node.remove();
  if (!overlays.length) { $scrim().hidden = true; document.body.style.overflow = ''; }
  if (o.prev && document.body.contains(o.prev)) try { o.prev.focus({ preventScroll:true }); } catch (e) {}
  if (typeof o.onClose === 'function') o.onClose();
};
PP.closeAll = () => { while (overlays.length) PP.closeTop(); };
PP.on('fechar', () => PP.closeTop());
document.addEventListener('click', e => { if (e.target.id === 'scrim') PP.closeTop(); });

/**
 * PP.modal({title, sub, body, actions:[{txt, cls, act, data}], size, onOpen})
 */
PP.modal = o => {
  const wrap = document.createElement('div');
  wrap.className = 'modal';
  wrap.innerHTML = `
    <div class="modal-box ${o.size ? 'w-' + o.size : ''}" role="dialog" aria-modal="true" aria-label="${esc(o.title || 'Janela')}">
      <div class="modal-hd">
        <div style="min-width:0">
          <h2>${esc(o.title || '')}</h2>
          ${o.sub ? `<div class="sub">${esc(o.sub)}</div>` : ''}
        </div>
        <button class="icon-btn" data-act="fechar" aria-label="Fechar" style="margin-left:auto"><svg class="ic"><use href="#i-x"/></svg></button>
      </div>
      <div class="modal-bd">${o.body || ''}</div>
      ${o.actions ? `<div class="modal-ft">${btns(o.actions)}</div>` : ''}
    </div>`;
  pushOverlay(wrap, o.onClose);
  if (o.onOpen) o.onOpen(wrap);
  return wrap;
};

/**
 * PP.drawer({title, sub, badge, body, actions, wide, onOpen})
 */
PP.drawer = o => {
  const wrap = document.createElement('div');
  wrap.className = 'drawer' + (o.wide ? ' wide' : '');
  wrap.setAttribute('role', 'dialog');
  wrap.setAttribute('aria-modal', 'true');
  wrap.setAttribute('aria-label', o.title || 'Detalhe');
  wrap.innerHTML = `
    <div class="drawer-hd">
      <div style="min-width:0;flex:1">
        <h2>${esc(o.title || '')}</h2>
        ${o.sub ? `<div class="sub">${o.subHTML ? o.sub : esc(o.sub)}</div>` : ''}
      </div>
      <button class="icon-btn" data-act="fechar" aria-label="Fechar"><svg class="ic"><use href="#i-x"/></svg></button>
    </div>
    <div class="drawer-bd">${o.body || ''}</div>
    ${o.actions ? `<div class="drawer-ft">${btns(o.actions)}</div>` : ''}`;
  pushOverlay(wrap, o.onClose);
  if (o.onOpen) o.onOpen(wrap);
  return wrap;
};

function btns(list) {
  return list.filter(Boolean).map(b => {
    const d = Object.keys(b.data || {}).map(k => ` data-${k}="${esc(b.data[k])}"`).join('');
    return `<button class="btn ${b.cls || ''}" data-act="${esc(b.act || 'fechar')}"${d}${b.disabled ? ' disabled' : ''}>${b.ic ? `<svg class="ic"><use href="#${b.ic}"/></svg>` : ''}${esc(b.txt)}</button>`;
  }).join('');
}
PP.btns = btns;

/** Confirmação — retorna Promise<boolean> */
PP.confirmar = (msg, o) => new Promise(res => {
  o = o || {};
  let done = false;
  const finish = v => { if (done) return; done = true; res(v); };
  const key = PP.uid('cf');
  PP.on(key + '_ok', () => { finish(true); PP.closeTop(); });
  PP.modal({
    title: o.title || 'Confirmar',
    size: 'sm',
    body: `<p style="margin:0;font-size:14px;line-height:1.6">${esc(msg)}</p>${o.aviso ? `<div class="alert a-warn mt"><svg class="ic"><use href="#i-alerta"/></svg><div>${esc(o.aviso)}</div></div>` : ''}`,
    actions: [
      { txt: o.okTxt || 'Confirmar', cls: o.perigo ? 'btn-dang' : 'btn-primary', act: key + '_ok' },
      { txt: 'Cancelar', act: 'fechar' }
    ],
    onClose: () => finish(false)
  });
});

/** Prompt simples — Promise<string|null> */
PP.perguntar = (label, o) => new Promise(res => {
  o = o || {};
  let done = false;
  const finish = v => { if (done) return; done = true; res(v); };
  const key = PP.uid('pr');
  PP.on(key + '_ok', (d, el) => {
    const inp = el.closest('.modal-box').querySelector('#' + key);
    finish(inp.value.trim() || null);
    PP.closeTop();
  });
  PP.modal({
    title: o.title || 'Informe',
    size: 'sm',
    body: `<div class="f"><label for="${key}">${esc(label)}</label>
      ${o.multi ? `<textarea class="inp" id="${key}" autofocus>${esc(o.valor || '')}</textarea>`
                : `<input class="inp" id="${key}" type="${o.tipo || 'text'}" value="${esc(o.valor || '')}" autofocus>`}</div>`,
    actions: [{ txt: o.okTxt || 'Salvar', cls: 'btn-primary', act: key + '_ok' }, { txt: 'Cancelar', act: 'fechar' }],
    onClose: () => finish(null)
  });
});

/* ============================== VALIDAÇÃO ============================== */

/** Dígito verificador de CPF. */
function cpfValido(d) {
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  for (let t = 9; t < 11; t++) {
    let s = 0;
    for (let i = 0; i < t; i++) s += PP.n(d[i]) * ((t + 1) - i);
    let dv = (s * 10) % 11;
    if (dv === 10) dv = 0;
    if (dv !== PP.n(d[t])) return false;
  }
  return true;
}

/** Dígito verificador de CNPJ. */
function cnpjValido(d) {
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false;
  const calc = tam => {
    let s = 0, pos = tam - 7;
    for (let i = tam; i >= 1; i--) { s += PP.n(d[tam - i]) * pos--; if (pos < 2) pos = 9; }
    const r = s % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return calc(12) === PP.n(d[12]) && calc(13) === PP.n(d[13]);
}

/**
 * Validadores de campo. Cada um devolve `true` ou a mensagem de erro.
 * Campo vazio passa — quem exige preenchimento é o `req`.
 */
PP.valida = {
  email: v => !v || /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(String(v).trim()) || 'E-mail inválido',
  telefone: v => {
    if (!v) return true;
    const d = PP.digitos(v);
    if (d.length < 10 || d.length > 11) return 'Informe DDD + número (10 ou 11 dígitos)';
    if (/^(\d)\1+$/.test(d)) return 'Telefone inválido';
    return true;
  },
  doc: v => {
    if (!v) return true;
    const d = PP.digitos(v);
    if (d.length === 11) return cpfValido(d) || 'CPF inválido';
    if (d.length === 14) return cnpjValido(d) || 'CNPJ inválido';
    return 'Use 11 dígitos (CPF) ou 14 (CNPJ)';
  },
  cep: v => !v || PP.digitos(v).length === 8 || 'CEP deve ter 8 dígitos',
  uf: v => !v || /^[A-Za-z]{2}$/.test(String(v).trim()) || 'Use a sigla com 2 letras',
  naoNegativo: v => PP.n(v) >= 0 || 'Não pode ser negativo',
  positivo: v => PP.n(v) > 0 || 'Deve ser maior que zero',
  dataRazoavel: v => {
    if (!v) return true;
    const ano = PP.n(String(v).slice(0, 4));
    return (ano >= 1990 && ano <= 2100) || 'Data fora do intervalo esperado';
  },
  percentual: v => { const n = PP.n(v); return (n >= 0 && n <= 100) || 'Informe entre 0 e 100'; }
};

/** Validador padrão por tipo de campo, quando o campo não define um. */
const VAL_POR_TIPO = { email:'email', tel:'telefone', date:'dataRazoavel' };

/** Aplica os validadores de um campo e devolve a mensagem de erro, ou null. */
function erroDoCampo(el, valor) {
  const nomes = (el.dataset.val || '').split(',').filter(Boolean);
  for (const nome of nomes) {
    const fn = PP.valida[nome];
    if (!fn) continue;
    const r = fn(valor);
    if (r !== true) return r;
  }
  return null;
}

/* ============================== FORMULÁRIOS ============================== */

/**
 * Campo: { k, l, t, col, req, opts, hint, ph, min, max, step, ro, rows, val }
 * val nomeia a regra de validacao; o valor inicial vem do segundo argumento.
 * t: text|tel|email|number|money|pct|date|select|textarea|checkbox|static|hidden|color
 */
PP.campo = (f, v) => {
  const val = v === undefined || v === null ? '' : v;
  const col = 'f-' + (f.col || 6);
  const id = 'fld_' + f.k;
  const req = f.req ? ' <span class="req" aria-hidden="true">*</span>' : '';
  const lbl = f.t === 'checkbox' || f.t === 'hidden' ? '' : `<label for="${id}">${esc(f.l)}${req}</label>`;
  const hint = f.hint ? `<span class="hint">${esc(f.hint)}</span>` : '';
  const vals = f.val || VAL_POR_TIPO[f.t] || '';
  const base = `id="${id}" name="${esc(f.k)}" data-k="${esc(f.k)}"${f.req ? ' data-req="1"' : ''}`
    + `${vals ? ` data-val="${esc(vals)}"` : ''}${f.ro ? ' readonly' : ''}`;
  let inner = '';

  switch (f.t) {
    case 'hidden':
      return `<input type="hidden" name="${esc(f.k)}" data-k="${esc(f.k)}" value="${esc(val)}">`;
    case 'static':
      return `<div class="f ${col}"><label>${esc(f.l)}</label><div style="padding:9px 0;font-weight:600">${f.html || esc(val)}</div>${hint}</div>`;
    case 'select':
      inner = `<select class="inp" ${base} data-t="select">` +
        (f.vazio === false ? '' : `<option value="">${esc(f.ph || '— selecione —')}</option>`) +
        (f.opts || []).map(o => {
          const ov = typeof o === 'object' ? o.v : o;
          const ol = typeof o === 'object' ? o.l : o;
          return `<option value="${esc(ov)}"${String(ov) === String(val) ? ' selected' : ''}>${esc(ol)}</option>`;
        }).join('') + '</select>';
      break;
    case 'textarea':
      inner = `<textarea class="inp" ${base} rows="${f.rows || 3}" data-t="text" placeholder="${esc(f.ph || '')}">${esc(val)}</textarea>`;
      break;
    case 'checkbox':
      return `<div class="f ${col}"><label class="check"><input type="checkbox" name="${esc(f.k)}" data-k="${esc(f.k)}" data-t="bool"${val ? ' checked' : ''}><span>${esc(f.l)}</span></label>${hint}</div>`;
    case 'money':
      inner = `<input class="inp inp-money" ${base} type="text" inputmode="decimal" data-t="money" data-money="1" value="${val === '' ? '' : esc(PP.dec(val))}" placeholder="${esc(f.ph || '0,00')}">`;
      break;
    case 'pct':
      inner = `<input class="inp" ${base} type="number" step="${f.step || 0.01}" data-t="num" value="${esc(val)}" placeholder="${esc(f.ph || '')}">`;
      break;
    case 'number':
      inner = `<input class="inp" ${base} type="number" data-t="num"${f.min !== undefined ? ` min="${f.min}"` : ''}${f.max !== undefined ? ` max="${f.max}"` : ''} step="${f.step || 1}" value="${esc(val)}" placeholder="${esc(f.ph || '')}">`;
      break;
    default:
      inner = `<input class="inp" ${base} type="${f.t || 'text'}" data-t="text" value="${esc(val)}" placeholder="${esc(f.ph || '')}"${f.list ? ` list="${esc(f.list)}"` : ''}${f.auto ? ` autocomplete="${esc(f.auto)}"` : ''}>`;
  }
  return `<div class="f ${col}">${lbl}${inner}${hint}<span class="errmsg" hidden></span></div>`;
};

PP.form = (fields, valores) => {
  const v = valores || {};
  return `<div class="fgrid">${fields.filter(Boolean).map(f => f.sep
    ? `<div class="f-12" style="border-top:1px solid var(--line);margin-top:4px;padding-top:12px"><strong style="font-size:11px;text-transform:uppercase;letter-spacing:.09em;color:var(--teal-2)">${esc(f.sep)}</strong></div>`
    : PP.campo(f, v[f.k])).join('')}</div>`;
};

/**
 * Lê e valida um formulário. Retorna {ok, data}.
 * `opts.regras` permite checagens entre campos:
 *   [{ campo:'fim', fn:d => !d.fim || d.fim >= d.inicio, msg:'Fim antes do início' }]
 */
PP.lerForm = (root, opts) => {
  const data = {};
  const campos = {};
  let ok = true, primeiroErro = null;

  const marcar = (el, msg) => {
    ok = false;
    el.classList.add('err');
    const campo = el.closest('.f');
    const err = campo ? campo.querySelector('.errmsg') : null;
    if (err) { err.textContent = msg; err.hidden = false; }
    if (!primeiroErro) primeiroErro = el;
  };

  root.querySelectorAll('[data-k]').forEach(el => {
    const k = el.dataset.k, t = el.dataset.t;
    let val;
    if (t === 'bool') val = el.checked;
    else if (t === 'money') val = PP.parseMoney(el.value);
    else if (t === 'num') val = el.value === '' ? null : PP.n(el.value);
    else val = (el.value || '').trim();

    const campo = el.closest('.f');
    const err = campo ? campo.querySelector('.errmsg') : null;
    el.classList.remove('err');
    if (err) { err.hidden = true; err.textContent = ''; }
    campos[k] = el;

    if (el.dataset.req && (val === '' || val === null || val === undefined || (t === 'money' && !val))) {
      marcar(el, 'Campo obrigatório');
    } else {
      const msg = erroDoCampo(el, val);
      if (msg) marcar(el, msg);
    }
    data[k] = val;
  });

  /* checagens que dependem de mais de um campo */
  (opts && opts.regras || []).forEach(r => {
    if (r.fn(data)) return;
    const el = campos[r.campo];
    if (el) marcar(el, r.msg); else { ok = false; PP.toast(r.msg, 'err'); }
  });

  if (!ok) {
    if (primeiroErro) { primeiroErro.focus(); primeiroErro.scrollIntoView({ block:'center', behavior:'smooth' }); }
    PP.toast('Confira os campos destacados', 'err');
  }
  return { ok, data };
};

/* máscara de moeda ao sair do campo */
document.addEventListener('blur', e => {
  const el = e.target;
  if (el && el.dataset && el.dataset.money && el.value !== '') el.value = PP.dec(PP.parseMoney(el.value));
}, true);

/* ============================== TABELA ============================== */

/**
 * PP.tabela({cols:[{h, k, cls, w, r(row)}], rows, vazio, act, idKey, foot})
 */
PP.tabela = o => {
  const cols = o.cols.filter(Boolean);
  if (!o.rows.length) return `<div class="empty-sm">${esc(o.vazio || 'Nada por aqui ainda.')}</div>`;
  const th = cols.map(c => `<th class="${c.cls || ''}"${c.w ? ` style="width:${c.w}"` : ''}>${esc(c.h)}</th>`).join('');
  const tb = o.rows.map(r => {
    const attrs = o.act ? ` class="clickable" tabindex="0" data-act="${esc(o.act)}" data-id="${esc(r[o.idKey || 'id'])}" role="button"` : '';
    return `<tr${attrs}>` + cols.map(c => `<td class="${c.cls || ''}">${c.r ? c.r(r) : esc(r[c.k])}</td>`).join('') + '</tr>';
  }).join('');
  const tf = o.foot ? `<tfoot><tr>${cols.map(c => `<td class="${c.cls || ''}">${o.foot[c.k] !== undefined ? o.foot[c.k] : ''}</td>`).join('')}</tr></tfoot>` : '';
  return `<div class="tbl-wrap"><table class="tbl"><thead><tr>${th}</tr></thead><tbody>${tb}</tbody>${tf}</table></div>`;
};

/* ============================== PAGINAÇÃO ============================== */

/* Sem isso, 3 anos de operação jogam milhares de <tr> no DOM de uma vez:
   a tela de financeiro chegava a 4.200 linhas, 2,2 MB de HTML e ~870 ms por render. */
PP.PAGS = {};
const POR_PAGINA = 60;

PP.paginar = (nome, rows, porPagina, totalServidor) => {
  const st = PP.PAGS[nome] = PP.PAGS[nome] || { p: 1 };
  const pp = porPagina || POR_PAGINA;
  const total = totalServidor === undefined ? rows.length : totalServidor;
  const nPag = Math.max(Math.ceil(total / pp), 1);
  if (st.p > nPag) st.p = nPag;
  if (st.p < 1) st.p = 1;
  const ini = (st.p - 1) * pp;
  const fim = Math.min(ini + pp, total);
  return {
    linhas: totalServidor === undefined ? rows.slice(ini, fim) : rows,
    total, pagina: st.p, paginas: nPag,
    html: nPag <= 1 ? '' : `
      <div class="pager">
        <span class="pager-info">${ini + 1}–${fim} de ${total}</span>
        <div class="pager-btns">
          <button class="btn btn-sm" data-act="irPagina" data-k="${esc(nome)}" data-p="${st.p - 1}" ${st.p <= 1 ? 'disabled' : ''} aria-label="Página anterior">
            <svg class="ic ic-sm" style="transform:rotate(180deg)"><use href="#i-seta"/></svg></button>
          <span class="pager-pag">${st.p} / ${nPag}</span>
          <button class="btn btn-sm" data-act="irPagina" data-k="${esc(nome)}" data-p="${st.p + 1}" ${st.p >= nPag ? 'disabled' : ''} aria-label="Próxima página">
            <svg class="ic ic-sm"><use href="#i-seta"/></svg></button>
        </div>
      </div>`
  };
};

/** Volta para a primeira página — chamar sempre que um filtro mudar. */
PP.resetPagina = nome => { if (PP.PAGS[nome]) PP.PAGS[nome].p = 1; };

PP.on('irPagina', d => {
  const st = PP.PAGS[d.k];
  if (!st) return;
  st.p = PP.n(d.p);
  PP.render();
  const v = document.getElementById('view');
  if (v) v.scrollIntoView({ block: 'start' });
});

PP.vazio = (titulo, txt, acao) => `
  <div class="empty">
    <div class="empty-marca" aria-hidden="true">
      <svg viewBox="0 0 120 72" fill="none" stroke="currentColor" stroke-linecap="round">
        <path d="M6 24c7 0 7-7 14-7s7 7 14 7 7-7 14-7 7 7 14 7 7-7 14-7 7 7 14 7 7-7 14-7" stroke-width="2.4" opacity=".9"/>
        <path d="M6 40c7 0 7-7 14-7s7 7 14 7 7-7 14-7 7 7 14 7 7-7 14-7 7 7 14 7 7-7 14-7" stroke-width="2.4" opacity=".55"/>
        <path d="M6 56c7 0 7-7 14-7s7 7 14 7 7-7 14-7 7 7 14 7 7-7 14-7 7 7 14 7 7-7 14-7" stroke-width="2.4" opacity=".25"/>
      </svg>
    </div>
    <h3>${esc(titulo)}</h3>
    <p>${esc(txt || '')}</p>
    ${acao ? `<button class="btn btn-primary" data-act="${esc(acao.act)}"><svg class="ic"><use href="#i-plus"/></svg>${esc(acao.txt)}</button>` : ''}
  </div>`;

PP.badge = (txt, cls) => `<span class="badge ${cls || ''}">${esc(txt)}</span>`;
PP.kpi = o => `
  <div class="kpi ${o.cls || ''}">
    <div class="lbl">${esc(o.lbl)}</div>
    <div class="val ${o.sm ? 'sm' : ''}">${o.htmlVal || esc(o.val)}</div>
    ${o.foot ? `<div class="foot">${o.footHTML ? o.foot : esc(o.foot)}</div>` : ''}
  </div>`;

/* ============================== GRÁFICOS SVG ============================== */

const CH = PP.chart = {};

CH.barras = o => {
  const labels = o.labels || [], series = o.series || [];
  const W = 640, H = o.height || 220, ml = 54, mr = 10, mt = 14, mb = 26;
  const iw = W - ml - mr, ih = H - mt - mb;
  let max = 0;
  series.forEach(s => s.values.forEach(v => { if (PP.n(v) > max) max = PP.n(v); }));
  if (o.empilhado) { max = 0; labels.forEach((_, i) => { let t = 0; series.forEach(s => t += PP.n(s.values[i])); if (t > max) max = t; }); }
  max = max || 1;
  const step = iw / (labels.length || 1);
  const bw = Math.min(o.empilhado ? step * .55 : (step * .62) / series.length, 44);
  const y = v => mt + ih - (PP.n(v) / max) * ih;
  let g = '';
  for (let i = 0; i <= 4; i++) {
    const yy = mt + ih - (ih / 4) * i;
    g += `<line class="gl" x1="${ml}" y1="${yy}" x2="${W - mr}" y2="${yy}"/>`;
    g += `<text x="${ml - 7}" y="${yy + 3.5}" text-anchor="end">${esc(o.fmtY ? o.fmtY(max / 4 * i) : PP.moneyK(max / 4 * i))}</text>`;
  }
  /* gradiente vertical por série: a barra fecha mais densa embaixo */
  const uid = 'g' + Math.random().toString(36).slice(2, 7);
  const defs = series.map((s, si) => `
    <linearGradient id="${uid}_${si}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${s.cor}" stop-opacity=".82"/>
      <stop offset="100%" stop-color="${s.cor}" stop-opacity="1"/>
    </linearGradient>`).join('');

  let bars = '';
  labels.forEach((lb, i) => {
    const cx = ml + step * i + step / 2;
    if (o.empilhado) {
      let acc = 0;
      series.forEach((s, si) => {
        const v = PP.n(s.values[i]);
        const y1 = y(acc + v), y2 = y(acc);
        if (v > 0) bars += `<rect x="${cx - bw/2}" y="${y1}" width="${bw}" height="${Math.max(y2 - y1, 0)}" fill="url(#${uid}_${si})" rx="2"><title>${esc(s.nome)}: ${esc(o.fmtT ? o.fmtT(v) : PP.money(v))}</title></rect>`;
        acc += v;
      });
    } else if (o.modo === 'alvo' && series.length === 2) {
      /* Padrão alvo: a meta vira um trilho largo e apagado ATRÁS, e o realizado
         preenche por dentro. Bate o olho e já se vê quanto da meta foi cumprido —
         muito melhor que duas barras lado a lado disputando atenção. */
      const alvo = series[0], real = series[1];
      const lw = Math.min(step * .58, 46), iw2 = lw * .54;
      const va = PP.n(alvo.values[i]), vr = PP.n(real.values[i]);
      bars += `<rect x="${cx - lw/2}" y="${y(va)}" width="${lw}" height="${Math.max(mt + ih - y(va), 0)}"
        fill="${alvo.cor}" opacity=".30" rx="3"><title>${esc(alvo.nome)}: ${esc(o.fmtT ? o.fmtT(va) : PP.money(va))}</title></rect>`;
      bars += `<line x1="${cx - lw/2 - 2}" y1="${y(va)}" x2="${cx + lw/2 + 2}" y2="${y(va)}"
        stroke="${alvo.cor}" stroke-width="2" stroke-linecap="round" opacity=".9"/>`;
      if (vr > 0) bars += `<rect x="${cx - iw2/2}" y="${y(vr)}" width="${iw2}" height="${Math.max(mt + ih - y(vr), 0)}"
        fill="url(#${uid}_1)" rx="2.5"><title>${esc(real.nome)}: ${esc(o.fmtT ? o.fmtT(vr) : PP.money(vr))}</title></rect>`;
    } else {
      const tw = bw * series.length + 3 * (series.length - 1);
      series.forEach((s, si) => {
        const v = PP.n(s.values[i]);
        const x = cx - tw / 2 + si * (bw + 3);
        bars += `<rect x="${x}" y="${y(v)}" width="${bw}" height="${Math.max(mt + ih - y(v), 0)}" fill="url(#${uid}_${si})" rx="2.5"><title>${esc(s.nome)}: ${esc(o.fmtT ? o.fmtT(v) : PP.money(v))}</title></rect>`;
      });
    }
    bars += `<text x="${cx}" y="${H - 8}" text-anchor="middle">${esc(lb)}</text>`;
  });
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="${esc(o.alt || 'Gráfico de barras')}">
    <defs>${defs}</defs>
    ${g}<line class="axis" x1="${ml}" y1="${mt + ih}" x2="${W - mr}" y2="${mt + ih}"/>${bars}</svg>`;
};

CH.linha = o => {
  const labels = o.labels || [], series = o.series || [];
  const W = 640, H = o.height || 220, ml = 54, mr = 12, mt = 14, mb = 26;
  const iw = W - ml - mr, ih = H - mt - mb;
  let max = 0;
  series.forEach(s => s.values.forEach(v => { if (PP.n(v) > max) max = PP.n(v); }));
  max = max * 1.1 || 1;
  const px = i => ml + (labels.length > 1 ? (iw / (labels.length - 1)) * i : iw / 2);
  const py = v => mt + ih - (PP.n(v) / max) * ih;
  let g = '';
  for (let i = 0; i <= 4; i++) {
    const yy = mt + ih - (ih / 4) * i;
    g += `<line class="gl" x1="${ml}" y1="${yy}" x2="${W - mr}" y2="${yy}"/>`;
    g += `<text x="${ml - 7}" y="${yy + 3.5}" text-anchor="end">${esc(o.fmtY ? o.fmtY(max / 4 * i) : PP.moneyK(max / 4 * i))}</text>`;
  }
  let paths = '';
  series.forEach((s, si) => {
    const pts = s.values.map((v, i) => `${px(i)},${py(v)}`).join(' ');
    if (s.area !== false) {
      paths += `<polygon points="${ml},${mt + ih} ${pts} ${px(labels.length - 1)},${mt + ih}" fill="${s.cor}" opacity=".10"/>`;
    }
    paths += `<polyline points="${pts}" fill="none" stroke="${s.cor}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"${s.tracejado ? ' stroke-dasharray="6 5"' : ''}/>`;
    s.values.forEach((v, i) => {
      paths += `<circle cx="${px(i)}" cy="${py(v)}" r="3.6" fill="#fff" stroke="${s.cor}" stroke-width="2.2"><title>${esc(labels[i])} — ${esc(s.nome)}: ${esc(o.fmtT ? o.fmtT(v) : PP.money(v))}</title></circle>`;
    });
  });
  const xl = labels.map((lb, i) => `<text x="${px(i)}" y="${H - 8}" text-anchor="middle">${esc(lb)}</text>`).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="${esc(o.alt || 'Gráfico de linha')}">
    ${g}<line class="axis" x1="${ml}" y1="${mt + ih}" x2="${W - mr}" y2="${mt + ih}"/>${paths}${xl}</svg>`;
};

CH.rosca = o => {
  const items = (o.items || []).filter(x => PP.n(x.valor) > 0);
  const tot = PP.soma(items, 'valor');
  const S = 200, cx = S / 2, cy = S / 2, R = 82, r = 52;
  if (!tot) return `<div class="empty-sm">Sem dados no período.</div>`;
  let a0 = -Math.PI / 2, paths = '';
  items.forEach(it => {
    const ang = (PP.n(it.valor) / tot) * Math.PI * 2;
    const a1 = a0 + ang;
    const big = ang > Math.PI ? 1 : 0;
    const p = (rad, a) => `${(cx + rad * Math.cos(a)).toFixed(2)},${(cy + rad * Math.sin(a)).toFixed(2)}`;
    paths += `<path d="M ${p(R, a0)} A ${R} ${R} 0 ${big} 1 ${p(R, a1)} L ${p(r, a1)} A ${r} ${r} 0 ${big} 0 ${p(r, a0)} Z" fill="${it.cor}" stroke="#fff" stroke-width="1.5"><title>${esc(it.label)}: ${esc(PP.money(it.valor))} (${PP.dec(it.valor / tot * 100, 1)}%)</title></path>`;
    a0 = a1;
  });
  const leg = items.map(it => `<div><i style="background:${it.cor}"></i>${esc(it.label)} <b class="tnum">${esc(PP.moneyK(it.valor))}</b> <span class="faint">${PP.dec(it.valor / tot * 100, 0)}%</span></div>`).join('');
  return `<div class="row" style="gap:20px;align-items:center;flex-wrap:nowrap">
    <svg viewBox="0 0 ${S} ${S}" style="width:170px;height:170px;flex:none" role="img" aria-label="${esc(o.alt || 'Distribuição')}">
      ${paths}
      <text x="${cx}" y="${cy - 3}" text-anchor="middle" style="font-size:9px;fill:var(--t-faint);text-transform:uppercase;letter-spacing:.08em">${esc(o.centroLbl || 'Total')}</text>
      <text x="${cx}" y="${cy + 13}" text-anchor="middle" style="font-size:15px;font-weight:800;fill:var(--ink)">${esc(PP.moneyK(tot))}</text>
    </svg>
    <div class="legend" style="flex-direction:column;gap:7px;flex:1;min-width:0">${leg}</div>
  </div>`;
};

CH.funil = o => {
  const items = o.items || [];
  const W = 620, rowH = 34, H = items.length * rowH + 10;
  const maxQ = Math.max.apply(null, items.map(i => PP.n(i.qtd)).concat([1]));
  let out = '';
  items.forEach((it, i) => {
    const y = i * rowH + 5, w = Math.max((PP.n(it.qtd) / maxQ) * (W - 230), 3);
    out += `<text x="0" y="${y + 17}" style="font-size:11.5px;fill:var(--t-muted);font-weight:600">${esc(it.nome)}</text>`;
    out += `<rect x="112" y="${y + 5}" width="${w}" height="17" rx="4" fill="${it.cor}" opacity=".85"><title>${esc(it.nome)}: ${it.qtd}</title></rect>`;
    out += `<text x="${112 + w + 8}" y="${y + 18}" style="font-size:11.5px;fill:var(--ink);font-weight:700">${it.qtd}</text>`;
    out += `<text x="${W}" y="${y + 18}" text-anchor="end" style="font-size:11.5px;fill:var(--teal-2);font-weight:700">${esc(PP.moneyK(it.valor))}</text>`;
  });
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Funil de vendas">${out}</svg>`;
};

/* ============================== ROTEADOR ============================== */

const VIEWS = {};
PP.view = (nome, def) => { VIEWS[nome] = def; };
PP.rotaAtual = { nome:'dashboard', arg:null };

PP.ir = (nome, arg) => {
  const h = '#/' + nome + (arg ? '/' + encodeURIComponent(arg) : '');
  if (location.hash === h) PP.render(); else location.hash = h;
};

let renderVersao=0;
PP.render = async () => {
  const versao=++renderVersao;
  const raw = (location.hash || '#/dashboard').replace(/^#\/?/, '');
  const parts = raw.split('/');
  let nome = parts[0] || 'dashboard';
  const arg = parts[1] ? decodeURIComponent(parts[1]) : null;
  if (!VIEWS[nome]) nome = 'dashboard';
  if (!PP.podeAcessar(nome)) {
    PP.toast('Seu perfil não tem acesso a essa tela', 'warn');
    nome = PP.podeAcessar('dashboard') ? 'dashboard' : (PP.NAV[0].itens.filter(i => PP.podeAcessar(i.v))[0] || { v:'dashboard' }).v;
  }
  const def = VIEWS[nome] || VIEWS.dashboard;
  PP.rotaAtual = { nome, arg };

  const alvo = document.getElementById('view');
  if (PP.prepararView) {
    try { await PP.prepararView(nome); }
    catch(e) {
      if (versao===renderVersao) alvo.innerHTML='<div class="alert a-dang">'+esc(e.message)+' <button class="btn" data-act="tentarCarregarTela">Tentar novamente</button></div>';
      return;
    }
    if (versao!==renderVersao) return;
  }

  /* O render troca a view inteira, o que mataria o cursor de quem está digitando
     num campo de busca. Guarda quem tinha o foco e devolve depois — assim cada
     tela não precisa repetir o próprio remendo de setSelectionRange. */
  const ativo = document.activeElement;
  const focoId = ativo && alvo.contains(ativo) && ativo.dataset && ativo.dataset.inp ? ativo.dataset.inp : null;
  const focoPos = focoId ? ativo.selectionStart : null;

  document.getElementById('pgTitle').textContent = typeof def.titulo === 'function' ? def.titulo(arg) : def.titulo;
  document.getElementById('pgSub').textContent = typeof def.sub === 'function' ? def.sub(arg) : (def.sub || '');
  /* Entrada escalonada só quando a TELA muda. Repetir isso a cada filtro ou
     tecla de busca (que também chamam render) deixaria a interface piscando. */
  const trocouDeTela = PP._ultimaView !== nome;
  PP._ultimaView = nome;
  alvo.classList.toggle('entrando', trocouDeTela);

  alvo.innerHTML = '';
  try {
    /* Aviso de licença vence antes de qualquer tela: quem está prestes a
       perder o acesso precisa saber disso onde quer que esteja. */
    const aviso = (PP.saas && PP.saas.avisoLicenca) ? PP.saas.avisoLicenca() : '';
    const html = def.render(arg);
    if (typeof html === 'string') alvo.innerHTML = aviso + html;
    if (def.depois) def.depois(alvo, arg);
    if (focoId) {
      const campo = alvo.querySelector(`[data-inp="${focoId}"]`);
      if (campo) {
        campo.focus({ preventScroll: true });
        const p = focoPos === null ? campo.value.length : focoPos;
        try { campo.setSelectionRange(p, p); } catch (e) {}
      }
    }
  } catch (e) {
    console.error('[PP] erro ao renderizar view "' + nome + '"', e);
    alvo.innerHTML = `<div class="alert a-dang"><svg class="ic"><use href="#i-alerta"/></svg><div><b>Erro ao montar a tela.</b><br><span class="small">${esc(e.message)}</span></div></div>`;
  }
  PP.pintarNav();
  document.querySelector('.main').scrollTop = 0;
  window.scrollTo(0, 0);
  const sb = document.getElementById('sidebar');
  if (sb.classList.contains('open')) sb.classList.remove('open');
};

window.addEventListener('hashchange', PP.render);
PP.on('tentarCarregarTela',()=>PP.render());

/* ============================== NAVEGAÇÃO ============================== */

PP.NAV = [
  { sec:'Comercial', itens:[
    { v:'dashboard',  ic:'i-dash',     nm:'Visão geral' },
    { v:'funil',      ic:'i-funil',    nm:'Funil de vendas', badge:() => PP.escopo(PP.where('leads', l => PP.ETAPAS_ATIVAS.includes(l.etapa))).length },
    { v:'leads',      ic:'i-leads',    nm:'Base de leads' },
    { v:'orcamentos', ic:'i-orc',      nm:'Orçamentos', badge:() => PP.escopo(PP.where('orcamentos', o => o.status === 'aprovacao')).length, hot:true },
    { v:'pedidos',    ic:'i-pedido',   nm:'Pedidos de venda' },
    { v:'clientes',   ic:'i-cliente',  nm:'Clientes' }
  ]},
  { sec:'Loja', itens:[
    { v:'pdv',        ic:'i-caixa',    nm:'Venda de balcão' },
    { v:'vendas',     ic:'i-cupom',    nm:'Vendas da loja' }
  ]},
  { sec:'Operação', itens:[
    { v:'agenda',     ic:'i-agenda',   nm:'Agenda de obras' },
    { v:'obras',      ic:'i-obra',     nm:'Obras & instalação', badge:() => PP.where('obras', o => o.status !== 'concluida' && o.status !== 'cancelada').length },
    { v:'produtos',   ic:'i-produto',  nm:'Produtos & catálogo' },
    { v:'estoque',    ic:'i-estoque',  nm:'Estoque', badge:() => PP.where('produtos', p => p.controlaEstoque && PP.disponivel(p.id) <= PP.n(p.estoqueMin)).length, hot:true },
    { v:'compras',    ic:'i-compras',  nm:'Compras & fornecedores' }
  ]},
  { sec:'Pós-venda', itens:[
    { v:'contratos',  ic:'i-contrato', nm:'Contratos de manutenção' },
    { v:'chamados',   ic:'i-suporte',  nm:'Assistência & garantia', badge:() => PP.where('chamados', c => c.status === 'aberto').length, hot:true }
  ]},
  { sec:'Financeiro', itens:[
    { v:'financeiro', ic:'i-fin',      nm:'Contas a pagar/receber', badge:() => PP.where('financeiro', f => f.status === 'aberto' && f.vencimento < PP.hoje()).length, hot:true },
    { v:'fluxo',      ic:'i-rel',      nm:'Fluxo de caixa' },
    { v:'dre',        ic:'i-dre',      nm:'DRE' },
    { v:'comissoes',  ic:'i-comissao', nm:'Comissões' }
  ]},
  { sec:'Gestão', itens:[
    { v:'vendedores', ic:'i-vendedor', nm:'Equipe de vendas' },
    { v:'relatorios', ic:'i-rel',      nm:'Relatórios' },
    { v:'auditoria',  ic:'i-trilha',   nm:'Trilha de auditoria' },
    { v:'licenca',    ic:'i-licenca',  nm:'Minha licença' },
    { v:'config',     ic:'i-config',   nm:'Configurações' }
  ]},
  /* Só o provedor enxerga. É outro produto dentro do mesmo app: aqui ele
     administra as empresas que usam o sistema, não a operação de nenhuma. */
  { sec:'Provedor', itens:[
    { v:'empresas',   ic:'i-empresa',  nm:'Empresas clientes' },
    { v:'planos',     ic:'i-licenca',  nm:'Planos' },
    { v:'faturas',    ic:'i-fin',      nm:'Faturas da licença',
      badge:() => (PP.saas && PP.saas.faturasVencidas) || 0, hot:true },
    { v:'saude',      ic:'i-pulso',    nm:'Saúde do sistema' },
    { v:'trilha',     ic:'i-trilha',   nm:'Auditoria global' }
  ]}
];

PP.montarNav = () => {
  const nav = document.getElementById('nav');
  nav.innerHTML = PP.NAV.map(g => {
    const itens = g.itens.filter(i => PP.podeAcessar(i.v));
    if (!itens.length) return '';
    return `<div class="nav-sec">${esc(g.sec)}</div>` + itens.map(i => `
      <button class="nav-item" data-act="nav" data-v="${i.v}">
        <svg class="ic"><use href="#${i.ic}"/></svg>
        <span>${esc(i.nm)}</span>
        ${i.badge ? `<span class="nav-badge ${i.hot ? 'hot' : ''}" data-badge="${i.v}"></span>` : ''}
      </button>`).join('');
  }).join('');
  PP.pintarNav();
};

PP.pintarNav = () => {
  document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('on', b.dataset.v === PP.rotaAtual.nome));
  PP.NAV.forEach(g => g.itens.forEach(i => {
    if (!i.badge) return;
    const el = document.querySelector(`[data-badge="${i.v}"]`);
    if (!el) return;
    let n = 0;
    try { n = i.badge(); } catch (e) { n = 0; }
    el.textContent = n || '';
    el.style.display = n ? '' : 'none';
  }));
};

PP.on('nav', d => PP.ir(d.v));
PP.on('toggleNav', () => document.getElementById('sidebar').classList.toggle('open'));

/* ============================== IMPRESSÃO / PDF ============================== */

/* Renderiza HTML completo num iframe isolado dentro de um overlay.
   Evita window.open (bloqueadores de pop-up). */
PP.imprimir = (htmlDoc, titulo) => {
  const wrap = document.createElement('div');
  wrap.className = 'print-overlay';
  wrap.setAttribute('role', 'dialog');
  wrap.setAttribute('aria-modal', 'true');
  wrap.setAttribute('aria-label', titulo || 'Documento');
  wrap.innerHTML = `
    <div class="print-bar">
      <strong>${esc(titulo || 'Documento')}</strong>
      <div style="margin-left:auto;display:flex;gap:8px">
        <button class="btn btn-teal" data-act="doPrint"><svg class="ic"><use href="#i-print"/></svg>Imprimir / salvar PDF</button>
        <button class="btn" data-act="fechar"><svg class="ic"><use href="#i-x"/></svg>Fechar</button>
      </div>
    </div>
    <div class="print-body"><iframe class="print-frame" title="${esc(titulo || 'Documento')}"></iframe></div>`;
  pushOverlay(wrap);
  const fr = wrap.querySelector('iframe');
  const doc = fr.contentDocument || fr.contentWindow.document;
  doc.open(); doc.write(htmlDoc); doc.close();
  PP.on('doPrint', () => { try { fr.contentWindow.focus(); fr.contentWindow.print(); } catch (e) { PP.toast('Não foi possível abrir a impressão', 'err'); } });
};

PP.baixar = (nome, conteudo, mime) => {
  const blob = new Blob([conteudo], { type: mime || 'application/json;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = nome;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 400);
};

PP.csv = (linhas) => '﻿' + linhas.map(l => l.map(c => {
  const s = String(c === null || c === undefined ? '' : c);
  return /[";\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}).join(';')).join('\n');

})();
