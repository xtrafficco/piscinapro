/* ============================================================
   PiscinaPro — App (vanilla JS, sem build)
   Módulo: Leads & Funil de Vendas
   Persistência: localStorage
   ============================================================ */

/* ---------------- Configuração de domínio ---------------- */
const ETAPAS = [
  { id: 'novo',       nome: 'Novo lead',   cor: '#3b82f6' },
  { id: 'contato',    nome: 'Em contato',  cor: '#0ea5a4' },
  { id: 'qualificado',nome: 'Qualificado', cor: '#8b6cf6' },
  { id: 'proposta',   nome: 'Proposta',    cor: '#e6a532' },
  { id: 'negociacao', nome: 'Negociação',  cor: '#e8734a' },
  { id: 'ganho',      nome: 'Ganho',       cor: '#12b886' },
  { id: 'perdido',    nome: 'Perdido',     cor: '#b0567a' },
];
const ETAPA_MAP = Object.fromEntries(ETAPAS.map(e => [e.id, e]));

const ORIGENS = {
  whatsapp:  { nome: 'WhatsApp',  icon: '<path d="M3 21l1.7-4.9A8 8 0 1 1 8 20.3L3 21z" stroke-linejoin="round" stroke-linecap="round"/>' },
  site:      { nome: 'Site',      icon: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" stroke-linecap="round"/>' },
  indicacao: { nome: 'Indicação', icon: '<circle cx="9" cy="8" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0M17 9l1.6 1.6L21 8" stroke-linecap="round" stroke-linejoin="round"/>' },
  feira:     { nome: 'Feira/Evento', icon: '<path d="M3 21V7l9-4 9 4v14M3 21h18M9 21v-6h6v6" stroke-linecap="round" stroke-linejoin="round"/>' },
  instagram: { nome: 'Instagram', icon: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="3.5"/><circle cx="17" cy="7" r="1"/>' },
  google:    { nome: 'Google Ads', icon: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8" stroke-linecap="round"/>' },
};

const MODELOS = [
  { nome: 'Fiji 4,0m',     base: 21900 },
  { nome: 'Atol 5,0m',     base: 27900 },
  { nome: 'Ibiza 6,0m',    base: 34900 },
  { nome: 'Cancún 7,0m',   base: 42900 },
  { nome: 'Maldivas 8,0m', base: 54900 },
  { nome: 'Lagoa 10m',     base: 72900 },
];

const VENDEDORES = [
  { nome: 'Camila Rocha',   cor: '#0ea5a4', meta: 160000 },
  { nome: 'Diego Menezes',  cor: '#e8734a', meta: 180000 },
  { nome: 'Paula Andrade',  cor: '#8b6cf6', meta: 140000 },
  { nome: 'Rafael Lima',    cor: '#e6a532', meta: 150000 },
];
const META_PADRAO = 150000;

const TEMPS = {
  quente: { nome: 'Quente', cor: '#e8734a' },
  morno:  { nome: 'Morno',  cor: '#e6a532' },
  frio:   { nome: 'Frio',   cor: '#3b82f6' },
};

const OBRA_ETAPAS = [
  { id: 'vistoria',   nome: 'Vistoria',     cor: '#3b82f6', dias: 1 },
  { id: 'escavacao',  nome: 'Escavação',    cor: '#e6a532', dias: 3 },
  { id: 'instalacao', nome: 'Instalação',   cor: '#0ea5a4', dias: 4 },
  { id: 'acabamento', nome: 'Acabamento',   cor: '#8b6cf6', dias: 3 },
  { id: 'entrega',    nome: 'Entrega',      cor: '#12b886', dias: 1 },
];
const OBRA_MAP = Object.fromEntries(OBRA_ETAPAS.map(e => [e.id, e]));

const EQUIPES = ['Equipe Norte', 'Equipe Sul', 'Equipe Técnica 1', 'Equipe Técnica 2'];

const STORAGE_KEY = 'piscinapro_leads_v1';
const OBRAS_KEY = 'piscinapro_obras_v1';
const FIN_KEY = 'piscinapro_financeiro_v1';
const CONFIG_KEY = 'piscinapro_config_v1';

/* ---------------- Utilidades ---------------- */
const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const money = v => BRL.format(v || 0);
const moneyK = v => (v >= 1000 ? 'R$ ' + (v / 1000).toFixed(v >= 100000 ? 0 : 1).replace('.', ',') + ' mil' : money(v));
// UUID v4 quando disponível: alinha os ids gerados no app com as PKs (uuid) do Supabase.
const uid = () => (globalThis.crypto && crypto.randomUUID)
  ? crypto.randomUUID()
  : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
// escapa TODOS os caracteres sensíveis, inclusive aspas simples (`'`) e crase (`` ` ``),
// deixando o texto seguro tanto em conteúdo quanto em atributos com aspas simples/duplas.
const ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' };
const esc = s => String(s ?? '').replace(/[&<>"'`]/g, c => ESC_MAP[c]);

/* Acessibilidade: torna um elemento clicável também acionável por teclado */
function keyActivate(e) {
  if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
    e.preventDefault();
    e.currentTarget.click();
  }
}
/* Atributos p/ tornar cards e linhas de tabela focáveis e acionáveis via teclado */
function rowA11y(label) {
  return `tabindex="0" role="button" aria-label="${esc(label)}" onkeydown="App.keyActivate(event)"`;
}

function initials(nome) {
  const p = (nome || '?').trim().split(/\s+/);
  return ((p[0]?.[0] || '') + (p[1]?.[0] || '')).toUpperCase();
}
function vendedorCor(nome) {
  const v = VENDEDORES.find(x => x.nome === nome);
  if (v) return v.cor;
  let h = 0; for (const c of (nome || '')) h = c.charCodeAt(0) + ((h << 5) - h);
  return `hsl(${Math.abs(h) % 360} 45% 45%)`;
}
function diasAtras(iso) {
  const d = Math.floor((Date.now() - new Date(iso)) / 86400000);
  if (d <= 0) return 'hoje';
  if (d === 1) return 'ontem';
  if (d < 30) return `${d}d`;
  return `${Math.floor(d / 30)}mês`;
}
function dataBR(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}
function dataHoraBR(iso) {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}
function daysAgoISO(n) { return new Date(Date.now() - n * 86400000).toISOString(); }

/* ---------------- Seed (dados de demonstração) ---------------- */
function seed() {
  const mk = (nome, tel, origem, modeloIdx, etapa, temp, vend, dias, obs, inter) => {
    const m = MODELOS[modeloIdx];
    const valor = Math.round((m.base * (1 + (modeloIdx % 3) * 0.06)) / 100) * 100;
    return {
      id: uid(), nome, telefone: tel, email: nome.toLowerCase().replace(/[^a-z]/g, '.') + '@email.com',
      origem, modelo: m.nome, valor, vendedor: vend, etapa, temperatura: temp,
      cidade: ['Campinas/SP', 'Sorocaba/SP', 'Jundiaí/SP', 'Valinhos/SP', 'Indaiatuba/SP'][modeloIdx % 5],
      criadoEm: daysAgoISO(dias + 3), atualizadoEm: daysAgoISO(dias), observacoes: obs || '',
      interacoes: (inter || []).map((it, i) => ({ id: uid(), quando: daysAgoISO(dias + i), tipo: it[0], texto: it[1] })),
    };
  };
  return [
    mk('Marcos Tavares', '(19) 99812-4471', 'whatsapp', 2, 'novo', 'morno', 'Camila Rocha', 1, 'Quer piscina pro quintal, casa nova.', [['Lead', 'Lead recebido pelo WhatsApp']]),
    mk('Juliana Prado', '(19) 99745-2203', 'site', 1, 'novo', 'frio', 'Rafael Lima', 2, 'Pediu catálogo pelo formulário do site.', [['Lead', 'Formulário do site preenchido']]),
    mk('Eduardo Nunes', '(11) 98123-8890', 'indicacao', 4, 'contato', 'quente', 'Diego Menezes', 0, 'Indicado pelo cliente Sr. Aldo. Alta intenção.', [['Lead', 'Indicação do cliente Aldo'], ['Ligação', 'Primeiro contato feito, muito interessado']]),
    mk('Fernanda Dias', '(19) 99988-1120', 'instagram', 3, 'contato', 'morno', 'Paula Andrade', 2, 'Veio de anúncio no Instagram.', [['Lead', 'Clicou no anúncio do Instagram'], ['WhatsApp', 'Respondeu, pediu mais fotos']]),
    mk('Sérgio Almeida', '(15) 99671-4432', 'feira', 5, 'qualificado', 'quente', 'Camila Rocha', 1, 'Visitou o stand na feira. Tem terreno pronto.', [['Lead', 'Contato na feira da construção'], ['Ligação', 'Confirmou orçamento e visita técnica'], ['Nota', 'Terreno já preparado, obra rápida']]),
    mk('Beatriz Campos', '(19) 99534-7781', 'site', 2, 'qualificado', 'morno', 'Rafael Lima', 3, 'Comparando 2 modelos.', [['Lead', 'Formulário do site'], ['E-mail', 'Enviado comparativo de modelos']]),
    mk('Ricardo Bueno', '(11) 97654-2201', 'whatsapp', 4, 'proposta', 'quente', 'Diego Menezes', 1, 'Proposta enviada, aguardando retorno.', [['Lead', 'WhatsApp'], ['Ligação', 'Levantamento das necessidades'], ['Proposta', 'Proposta #0142 enviada — R$ 45.400']]),
    mk('Larissa Moraes', '(19) 99420-9987', 'indicacao', 3, 'proposta', 'morno', 'Paula Andrade', 4, 'Quer incluir aquecimento na proposta.', [['Lead', 'Indicação'], ['Proposta', 'Proposta enviada com kit aquecimento']]),
    mk('André Figueira', '(15) 99310-5567', 'feira', 5, 'negociacao', 'quente', 'Camila Rocha', 0, 'Negociando desconto e prazo de entrega.', [['Lead', 'Feira'], ['Proposta', 'Proposta enviada'], ['Negociação', 'Cliente pediu 8% de desconto — em análise']]),
    mk('Tânia Ribeiro', '(19) 99101-3345', 'google', 3, 'negociacao', 'morno', 'Rafael Lima', 2, 'Definindo forma de pagamento (financiamento).', [['Lead', 'Google Ads'], ['Proposta', 'Proposta enviada'], ['Negociação', 'Avaliando financiamento em 24x']]),
    mk('Paulo Cardoso', '(11) 98890-2214', 'indicacao', 4, 'ganho', 'quente', 'Diego Menezes', 5, 'Fechado! Instalação agendada.', [['Lead', 'Indicação'], ['Proposta', 'Proposta aprovada'], ['Ganho', 'Contrato assinado — R$ 45.400'], ['Nota', 'Instalação agendada para o próximo mês']]),
    mk('Gabriela Souza', '(19) 99777-6654', 'site', 2, 'ganho', 'quente', 'Paula Andrade', 8, 'Fechado. Sinal pago.', [['Lead', 'Site'], ['Proposta', 'Proposta aprovada'], ['Ganho', 'Contrato assinado, sinal de 30% pago']]),
    mk('Henrique Vaz', '(15) 99223-8876', 'whatsapp', 1, 'contato', 'frio', 'Camila Rocha', 6, 'Ainda pesquisando, sem pressa.', [['Lead', 'WhatsApp'], ['Ligação', 'Só pesquisando preço por enquanto']]),
    mk('Cláudia Nogueira', '(19) 99456-1120', 'instagram', 3, 'novo', 'morno', 'Diego Menezes', 0, 'Pediu simulação de financiamento.', [['Lead', 'Instagram — pediu simulação']]),
  ];
}

/* ---------------- Estado / storage ---------------- */
let LEADS = [];
let OBRAS = {};
let FIN = {};
let FILTROS = { vendedor: '', origem: '', busca: '' };
let VIEW = 'dashboard';

/* ---------------- Persistência resiliente ----------------
   Um único ponto de escrita que NÃO engole falhas em silêncio:
   avisa o usuário quando o navegador recusa a gravação (cota
   cheia, aba anônima, storage bloqueado) para que ele exporte
   um backup antes de perder dados. */
let STORAGE_OK = true;       // false = a última escrita falhou
let STORAGE_WARNED = false;  // evita repetir o toast a cada tecla

function storageWritable() {
  try {
    const k = '__pp_test__';
    localStorage.setItem(k, '1');
    localStorage.removeItem(k);
    return true;
  } catch (e) { return false; }
}
function readStore(key) {
  try { return localStorage.getItem(key); } catch (e) { return null; }
}
function persist(key, value) {
  let payload;
  try { payload = JSON.stringify(value); } catch (e) { return false; }
  try {
    localStorage.setItem(key, payload);
    if (!STORAGE_OK) { STORAGE_OK = true; STORAGE_WARNED = false; } // recuperou
    // Write-through para o Supabase (quando conectado). O cache local acima
    // segue como fallback offline; o Supa reconcilia a tabela correspondente.
    if (window.Supa && typeof window.Supa.onPersist === 'function') {
      try { window.Supa.onPersist(key); } catch (e) { /* nunca quebra a gravação local */ }
    }
    return true;
  } catch (e) {
    STORAGE_OK = false;
    const quota = e && (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014);
    if (!STORAGE_WARNED && typeof toast === 'function') {
      STORAGE_WARNED = true;
      toast(quota
        ? 'Armazenamento cheio: as últimas mudanças podem não ter sido salvas. Exporte um backup e libere espaço.'
        : 'Não foi possível salvar neste navegador (aba anônima ou storage bloqueado). Exporte um backup para não perder dados.',
        true);
    }
    return false;
  }
}

function load() {
  const raw = readStore(STORAGE_KEY);
  if (raw != null) {
    try {
      const parsed = JSON.parse(raw);
      LEADS = Array.isArray(parsed) ? parsed : seed();   // valida o formato
    } catch (e) { LEADS = seed(); }
  } else {
    LEADS = seed();
  }
  save();
}
function save() { return persist(STORAGE_KEY, LEADS); }
function loadObject(key) {
  const raw = readStore(key);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : {};
  } catch (e) { return {}; }
}
function loadOps() {
  OBRAS = loadObject(OBRAS_KEY);
  FIN = loadObject(FIN_KEY);
}
function saveObras() { return persist(OBRAS_KEY, OBRAS); }
function saveFin() { return persist(FIN_KEY, FIN); }
function replaceArray(target, items) {
  target.splice(0, target.length, ...items);
}
function defaultConfig() {
  return {
    modelos: MODELOS.map(m => ({ ...m })),
    vendedores: VENDEDORES.map(v => ({ ...v })),
    equipes: EQUIPES.slice(),
    adicionais: (typeof ADICIONAIS !== 'undefined' ? ADICIONAIS : []).map(a => ({ ...a })),
  };
}
function ensureModeloSpec(nome) {
  if (typeof MODELO_SPECS === 'undefined' || MODELO_SPECS[nome]) return;
  MODELO_SPECS[nome] = { dim: 'Sob medida', prof: 'A definir', volume: 'A definir', prazo: 'A combinar', pessoas: 'A definir' };
}
function syncAdicionais(items) {
  if (typeof ADICIONAIS === 'undefined' || typeof ADIC_MAP === 'undefined') return;
  replaceArray(ADICIONAIS, items.map(a => ({ ...a })));
  Object.keys(ADIC_MAP).forEach(k => delete ADIC_MAP[k]);
  ADICIONAIS.forEach(a => { ADIC_MAP[a.nome] = a; });
}
function applyConfig(cfg) {
  replaceArray(MODELOS, (cfg.modelos || []).filter(m => m.nome).map(m => ({ nome: m.nome, base: Math.max(0, parseInt(m.base, 10) || 0) })));
  MODELOS.forEach(m => ensureModeloSpec(m.nome));
  replaceArray(VENDEDORES, (cfg.vendedores || []).filter(v => v.nome).map(v => ({
    nome: v.nome, cor: v.cor || '#0ea5a4',
    meta: v.meta != null ? Math.max(0, parseInt(v.meta, 10) || 0) : META_PADRAO,
  })));
  replaceArray(EQUIPES, (cfg.equipes || []).filter(Boolean));
  syncAdicionais((cfg.adicionais || []).filter(a => a.nome).map(a => ({
    nome: a.nome,
    valor: Math.max(0, parseInt(a.valor, 10) || 0),
    unidade: a.unidade || '',
    qtdPadrao: Math.max(1, parseInt(a.qtdPadrao, 10) || 1),
  })));
}
function loadConfig() {
  const base = defaultConfig();
  const saved = loadObject(CONFIG_KEY);
  const cfg = {
    modelos: saved.modelos || base.modelos,
    vendedores: saved.vendedores || base.vendedores,
    equipes: saved.equipes || base.equipes,
    adicionais: saved.adicionais || base.adicionais,
  };
  applyConfig(cfg);
}
function saveConfig() { return persist(CONFIG_KEY, defaultConfig()); }

function filtrados() {
  const b = FILTROS.busca.trim().toLowerCase();
  return LEADS.filter(l => {
    if (FILTROS.vendedor && l.vendedor !== FILTROS.vendedor) return false;
    if (FILTROS.origem && l.origem !== FILTROS.origem) return false;
    if (b) {
      const hay = `${l.nome} ${l.telefone} ${l.modelo} ${l.cidade} ${l.email}`.toLowerCase();
      if (!hay.includes(b)) return false;
    }
    return true;
  });
}

function leadAtivo(l) { return !['ganho', 'perdido'].includes(l.etapa); }
function phoneKey(tel) { return (tel || '').replace(/\D/g, ''); }
function orcTotal(o) { return (typeof calc === 'function') ? calc(o).total : (o.valorBase || 0); }
function orcCriadoEm(o) { return o?.criadoEm || new Date().toISOString(); }
function addDaysISO(iso, n) {
  const d = iso ? new Date(iso) : new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
}
function dateInput(iso) {
  if (!iso) return '';
  return new Date(iso).toISOString().slice(0, 10);
}
function fromDateInput(v) {
  return v ? new Date(`${v}T12:00:00`).toISOString() : '';
}

function clienteKey(lead, orc) {
  // Telefone primeiro: unifica o lead ganho e seu orçamento aprovado (que pode não ter leadId),
  // evitando o mesmo cliente aparecer duplicado em Clientes/Obras/Financeiro.
  const tel = phoneKey(lead?.telefone || orc?.cliente?.telefone);
  if (tel) return `tel:${tel}`;
  const lid = lead?.id || orc?.leadId;
  if (lid) return `lead:${lid}`;
  return `nome:${(lead?.nome || orc?.cliente?.nome || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

function clientesData() {
  const mapa = new Map();
  const aprovados = (typeof ORC !== 'undefined' ? ORC : []).filter(o => o.status === 'aprovado');
  const upsertCliente = (key, base) => {
    const cur = mapa.get(key) || {
      id: key, nome: '', telefone: '', email: '', cidade: '', modelo: '', vendedor: '',
      origem: '', valor: 0, vendaEm: '', lead: null, orcamentos: [],
    };
    mapa.set(key, { ...cur, ...base, orcamentos: cur.orcamentos });
    return mapa.get(key);
  };

  LEADS.filter(l => l.etapa === 'ganho').forEach(l => {
    upsertCliente(clienteKey(l), {
      nome: l.nome, telefone: l.telefone, email: l.email, cidade: l.cidade,
      modelo: l.modelo, vendedor: l.vendedor, origem: l.origem,
      valor: l.valor, vendaEm: l.atualizadoEm || l.criadoEm, lead: l,
    });
  });

  aprovados.forEach(o => {
    const linkedLead = o.leadId ? LEADS.find(l => l.id === o.leadId) : null;
    const key = clienteKey(linkedLead, o);
    const cliente = upsertCliente(key, {
      nome: linkedLead?.nome || o.cliente.nome,
      telefone: linkedLead?.telefone || o.cliente.telefone,
      email: linkedLead?.email || o.cliente.email,
      cidade: linkedLead?.cidade || o.cliente.cidade,
      modelo: o.modelo,
      vendedor: o.vendedor || linkedLead?.vendedor || '',
      origem: linkedLead?.origem || '',
      valor: orcTotal(o),
      vendaEm: orcCriadoEm(o),
      lead: linkedLead || mapa.get(key)?.lead || null,
    });
    cliente.orcamentos.push(o);
  });

  return [...mapa.values()].sort((a, b) => new Date(b.vendaEm) - new Date(a.vendaEm));
}

function garantiaInfo(vendaEm) {
  const inicio = vendaEm ? new Date(vendaEm) : new Date();
  const fim = new Date(inicio);
  fim.setFullYear(fim.getFullYear() + 15);
  const dias = Math.ceil((fim - new Date()) / 86400000);
  return { fim, dias, status: dias > 0 ? 'Ativa' : 'Encerrada' };
}

function diasDesde(iso) {
  return Math.max(0, Math.floor((Date.now() - new Date(iso)) / 86400000));
}

function clienteOrcamento(c) {
  return (c.orcamentos || []).slice().sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm))[0] || null;
}

function defaultObraEtapa(c) {
  const passados = diasDesde(c.vendaEm);
  let soma = 0;
  for (const etapa of OBRA_ETAPAS) {
    soma += etapa.dias;
    if (passados <= soma + 1) return etapa.id;
  }
  return 'entrega';
}

function obraCronograma(obra) {
  let cursor = addDaysISO(obra.inicio, 0);
  const atual = OBRA_ETAPAS.findIndex(e => e.id === obra.etapa);
  return OBRA_ETAPAS.map((et, i) => {
    const inicio = cursor;
    const fim = addDaysISO(inicio, et.dias);
    cursor = fim;
    const status = i < atual ? 'concluido' : i === atual ? 'andamento' : 'pendente';
    return { ...et, inicio, fim, status };
  });
}

function obrasData() {
  return clientesData().map((c, i) => {
    const saved = OBRAS[c.id] || {};
    const inicio = saved.inicio || addDaysISO(c.vendaEm, 2);
    const base = {
      id: c.id,
      cliente: c,
      etapa: saved.etapa || defaultObraEtapa(c),
      responsavel: saved.responsavel || EQUIPES[i % EQUIPES.length],
      inicio,
      previsao: saved.previsao || addDaysISO(inicio, 13),
      notas: saved.notas || [],
    };
    return { ...base, cronograma: obraCronograma(base) };
  }).sort((a, b) => new Date(a.previsao) - new Date(b.previsao));
}

function financeBase(c) {
  const o = clienteOrcamento(c);
  const valores = o ? calc(o) : null;
  const pg = o?.pagamento || { tipo: 'avista', entradaPct: 100, parcelas: 1, jurosMes: 0 };
  const total = valores ? valores.total : c.valor;
  const entrada = pg.tipo === 'financiado' ? valores.entrada : total;
  const parcelas = pg.tipo === 'financiado' ? (pg.parcelas || 1) : 1;
  const parcela = pg.tipo === 'financiado' ? valores.parcela : total;
  const financiado = pg.tipo === 'financiado' ? valores.financiado : 0;
  return { o, pg, total, entrada, parcelas, parcela, financiado };
}

function financeiroData() {
  return clientesData().map(c => {
    const base = financeBase(c);
    const saved = FIN[c.id] || {};
    const passados = diasDesde(c.vendaEm);
    const vencidas = Math.min(base.parcelas, Math.max(0, Math.floor((passados - 25) / 30) + 1));
    const parcelasPagas = Math.min(base.parcelas, saved.parcelasPagas ?? Math.min(vencidas, Math.max(0, Math.floor(passados / 45))));
    const entradaPaga = saved.entradaPaga ?? passados >= 2;
    const comissaoPct = saved.comissaoPct ?? 4;
    const comissaoPaga = saved.comissaoPaga ?? false;
    const pago = (entradaPaga ? base.entrada : 0) + parcelasPagas * base.parcela;
    const saldo = Math.max(0, base.entrada + base.financiado - pago);
    const atrasado = (!entradaPaga && passados > 3) || vencidas > parcelasPagas;
    const status = saldo <= 0 ? 'quitado' : atrasado ? 'atrasado' : 'pendente';
    return {
      id: c.id, cliente: c, ...base, entradaPaga, parcelasPagas, vencidas,
      comissaoPct, comissao: base.total * comissaoPct / 100, comissaoPaga,
      pago, saldo, status,
    };
  }).sort((a, b) => {
    const peso = { atrasado: 0, pendente: 1, quitado: 2 };
    return peso[a.status] - peso[b.status] || new Date(a.cliente.vendaEm) - new Date(b.cliente.vendaEm);
  });
}

function statusFinLabel(st) {
  return { pendente: 'Pendente', pago: 'Pago', atrasado: 'Atrasado', quitado: 'Quitado' }[st] || st;
}

function statusFinClass(st) {
  return st === 'quitado' || st === 'pago' ? 'st-aprovado' : st === 'atrasado' ? 'st-recusado' : 'st-enviado';
}

/* ---------------- Ícones ---------------- */
const svgWrap = inner => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true" focusable="false">${inner}</svg>`;
function origemIcon(o) { return svgWrap(ORIGENS[o]?.icon || ''); }

/* ============================================================
   RENDER — DASHBOARD (Visão geral) + Metas por vendedor
   ============================================================ */
function metasData() {
  const clientes = clientesData();
  return VENDEDORES.map(v => {
    const realizado = clientes.filter(c => c.vendedor === v.nome).reduce((s, c) => s + (c.valor || 0), 0);
    const pipeline = LEADS.filter(l => l.vendedor === v.nome && ['proposta', 'negociacao'].includes(l.etapa)).reduce((s, l) => s + l.valor, 0);
    const ativos = LEADS.filter(l => l.vendedor === v.nome && leadAtivo(l)).length;
    const meta = v.meta || 0;
    const pctMeta = meta ? Math.round(realizado / meta * 100) : 0;
    return { nome: v.nome, cor: v.cor, meta, realizado, pipeline, ativos, pct: pctMeta };
  }).sort((a, b) => b.pct - a.pct || b.realizado - a.realizado);
}

function renderDashboard() {
  const clientes = clientesData();
  const fin = financeiroData();
  const obras = obrasData();
  const metas = metasData();
  const ativos = LEADS.filter(leadAtivo).length;
  const emNeg = LEADS.filter(l => ['proposta', 'negociacao'].includes(l.etapa));
  const valorNeg = emNeg.reduce((s, l) => s + l.valor, 0);
  const valorGanho = clientes.reduce((s, c) => s + c.valor, 0);
  const aReceber = fin.reduce((s, f) => s + f.saldo, 0);
  const obrasExec = obras.filter(o => o.etapa !== 'entrega').length;
  const novosHoje = LEADS.filter(l => diasAtras(l.criadoEm) === 'hoje').length;

  const metaTotal = metas.reduce((s, m) => s + m.meta, 0);
  const realizadoTotal = metas.reduce((s, m) => s + m.realizado, 0);
  const pctTime = metaTotal ? Math.round(realizadoTotal / metaTotal * 100) : 0;

  const kpi = (icon, label, val, foot) => `
    <div class="kpi"><div class="k-top">${svgWrap(icon)} ${label}</div>
    <div class="k-val num">${val}</div><div class="k-foot">${foot}</div></div>`;

  const heroKpis = `<div class="dash-kpis">
    ${kpi('<path d="M3 4h18M6 8h12M9 12h6M11 16h2" stroke-linecap="round"/>', 'Leads ativos', ativos, `${novosHoje} novos hoje`)}
    ${kpi('<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 9.5h19" stroke-linecap="round"/>', 'Em negociação', moneyK(valorNeg), `${emNeg.length} oportunidades`)}
    ${kpi('<path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"/>', 'Vendas ganhas', moneyK(valorGanho), `${clientes.length} clientes`)}
    ${kpi('<circle cx="12" cy="12" r="9"/><path d="M12 7v10M9 9.5h4a1.5 1.5 0 0 1 0 3h-2a1.5 1.5 0 0 0 0 3h4" stroke-linecap="round"/>', 'A receber', moneyK(aReceber), `${fin.filter(f => f.status === 'atrasado').length} em atraso`)}
    ${kpi('<path d="M3 20h18M5 20V9l7-5 7 5v11M9 20v-6h6v6" stroke-linecap="round" stroke-linejoin="round"/>', 'Obras em execução', obrasExec, `${obras.length} no pós-venda`)}
    ${kpi('<path d="M3 3v18h18M7 14l3-3 3 3 5-6" stroke-linecap="round" stroke-linejoin="round"/>', 'Conversão', pct(clientes.length, LEADS.length) + '%', `de ${LEADS.length} leads`)}
  </div>`;

  const funilSnap = ETAPAS.filter(e => e.id !== 'perdido').map(et => {
    const items = LEADS.filter(l => l.etapa === et.id);
    const val = items.reduce((s, l) => s + l.valor, 0);
    return `<div class="stage-item"><span class="col-dot" style="background:${et.cor}"></span><b>${et.nome}</b><span>${items.length}</span><em>${moneyK(val)}</em></div>`;
  }).join('');

  const metaRows = metas.map(m => `
    <div class="meta-row">
      <div class="avatar" style="background:${m.cor}" title="${esc(m.nome)}">${initials(m.nome)}</div>
      <div class="meta-main">
        <div class="meta-top"><b>${esc(m.nome)}</b><span class="num">${money(m.realizado)} <em>/ ${money(m.meta)}</em></span></div>
        <div class="bar-track"><span style="width:${Math.min(100, m.pct)}%;background:${m.cor}"></span></div>
        <div class="meta-sub">${moneyK(m.pipeline)} em negociação · ${m.ativos} leads ativos</div>
      </div>
      <div class="meta-pct ${m.pct >= 100 ? 'hit' : ''}">${m.pct}%</div>
    </div>`).join('');

  // Painéis "precisa de atenção"
  const propAguardando = (typeof ORC !== 'undefined' ? ORC : []).filter(o => o.status === 'enviado')
    .sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm)).slice(0, 4);
  const obrasAgenda = obras.filter(o => o.etapa !== 'entrega').slice(0, 4);
  const finAtraso = fin.filter(f => f.status === 'atrasado').slice(0, 4);
  const now = new Date();

  const attItem = (label, onclick, nome, right, sub, warn) => `
    <div class="att-item" ${rowA11y(label)} onclick="${onclick}">
      <div class="att-body"><div class="att-name">${esc(nome)}</div><div class="att-sub ${warn ? 'warn' : ''}">${sub}</div></div>
      <div class="att-right num">${right}</div>
    </div>`;

  const propList = propAguardando.length
    ? propAguardando.map(o => attItem('Abrir proposta ' + o.numero, `App.verOrcamento('${o.id}')`, o.cliente.nome, money(orcTotal(o)), `Proposta #${esc(o.numero)} · ${dataBR(o.criadoEm)}`, false)).join('')
    : `<div class="att-empty">Nenhuma proposta aguardando resposta.</div>`;
  const obraList = obrasAgenda.length
    ? obrasAgenda.map(o => { const atrasada = new Date(o.previsao) < now; return attItem('Abrir obra de ' + o.cliente.nome, `App.openObra('${o.id}')`, o.cliente.nome, dataBR(o.previsao), `${OBRA_MAP[o.etapa]?.nome || o.etapa}${atrasada ? ' · atrasada' : ''}`, atrasada); }).join('')
    : `<div class="att-empty">Nenhuma obra em andamento.</div>`;
  const finList = finAtraso.length
    ? finAtraso.map(f => attItem('Abrir financeiro de ' + f.cliente.nome, `App.openFinanceiro('${f.id}')`, f.cliente.nome, money(f.saldo), `${f.vencidas} parcela(s) vencida(s)`, true)).join('')
    : `<div class="att-empty">Nenhum contrato em atraso.</div>`;

  return `<div style="padding:24px 28px 32px">
    ${heroKpis}
    <div class="dash-grid">
      <section class="report-card">
        <div class="report-head"><h2>Funil agora</h2><span>${ativos} ativos</span></div>
        <div class="stage-list">${funilSnap}</div>
      </section>
      <section class="report-card">
        <div class="report-head"><h2>Metas por vendedor</h2><span>período atual</span></div>
        <div class="meta-team">
          <div class="mt-top"><span>Meta do time</span><b class="num">${money(realizadoTotal)} <em>/ ${money(metaTotal)}</em></b></div>
          <div class="bar-track big"><span style="width:${Math.min(100, pctTime)}%"></span></div>
          <div class="mt-sub">${pctTime}% da meta · ${clientes.length} vendas no período</div>
        </div>
        <div class="meta-list">${metaRows}</div>
      </section>
    </div>
    <div class="att-grid">
      <section class="report-card">
        <div class="report-head"><h2>Propostas aguardando</h2><span>${propAguardando.length}</span></div>
        <div class="att-list">${propList}</div>
      </section>
      <section class="report-card">
        <div class="report-head"><h2>Agenda de obras</h2><span>${obrasAgenda.length}</span></div>
        <div class="att-list">${obraList}</div>
      </section>
      <section class="report-card">
        <div class="report-head"><h2>Financeiro em atraso</h2><span>${finAtraso.length}</span></div>
        <div class="att-list">${finList}</div>
      </section>
    </div>
  </div>`;
}

/* ============================================================
   RENDER — KPIs
   ============================================================ */
function renderKPIs() {
  const ativos = LEADS.filter(leadAtivo);
  const ganhos = LEADS.filter(l => l.etapa === 'ganho');
  const emNeg = LEADS.filter(l => ['proposta', 'negociacao'].includes(l.etapa));
  const valorPipe = emNeg.reduce((s, l) => s + l.valor, 0);
  const valorGanho = ganhos.reduce((s, l) => s + l.valor, 0);
  const total = LEADS.length;
  const conv = total ? Math.round((ganhos.length / total) * 100) : 0;
  const ticket = ganhos.length ? valorGanho / ganhos.length : 0;

  const kpi = (icon, label, val, foot) => `
    <div class="kpi">
      <div class="k-top">${svgWrap(icon)} ${label}</div>
      <div class="k-val num">${val}</div>
      <div class="k-foot">${foot}</div>
    </div>`;

  return `<div class="kpis">
    ${kpi('<path d="M3 4h18M6 8h12M9 12h6M11 16h2" stroke-linecap="round"/>', 'Leads ativos', ativos.length, `${LEADS.filter(l=>diasAtras(l.criadoEm)==='hoje').length} novos hoje`)}
    ${kpi('<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 9.5h19" stroke-linecap="round"/>', 'Em negociação', moneyK(valorPipe), `${emNeg.length} oportunidades`)}
    ${kpi('<path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"/>', 'Ganhos', `${ganhos.length} <small>· ${moneyK(valorGanho)}</small>`, `<span class="trend-up">▲ meta 62%</span> atingida`)}
    ${kpi('<path d="M3 3v18h18M7 14l3-3 3 3 5-6" stroke-linecap="round" stroke-linejoin="round"/>', 'Conversão', conv + '%', `de ${total} leads no total`)}
    ${kpi('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2" stroke-linecap="round"/>', 'Ticket médio', moneyK(ticket), `por venda fechada`)}
  </div>`;
}

/* ============================================================
   RENDER — FUNIL (Kanban)
   ============================================================ */
function cardHTML(l) {
  const o = ORIGENS[l.origem] || { nome: l.origem };
  return `<div class="card" draggable="true" data-id="${l.id}" ${rowA11y('Lead ' + l.nome + ', ' + l.modelo)} onclick="App.openDetalhe('${l.id}')">
    <span class="temp ${l.temperatura}" title="${TEMPS[l.temperatura]?.nome}"></span>
    <div class="c-name">${esc(l.nome)}</div>
    <div class="c-model">${svgWrap('<path d="M2 16c1.3 0 1.3 1 2.6 1S6 16 7.3 16s1.3 1 2.7 1 1.3-1 2.6-1 1.4 1 2.7 1 1.3-1 2.6-1M7 12V7a1 1 0 0 1 1-1M13 12V7a1 1 0 0 0-1-1" stroke-linecap="round"/>')} ${esc(l.modelo)}</div>
    <div class="c-val num">${money(l.valor)}</div>
    <div class="c-foot">
      <span class="src">${origemIcon(l.origem)} ${esc(o.nome)}</span>
      <div class="avatar" style="background:${vendedorCor(l.vendedor)}" title="${esc(l.vendedor)}">${initials(l.vendedor)}</div>
      <span class="age" title="Atualizado ${dataBR(l.atualizadoEm)}">${diasAtras(l.atualizadoEm)}</span>
    </div>
  </div>`;
}

function renderFunil() {
  const data = filtrados();
  const cols = ETAPAS.map(et => {
    const items = data.filter(l => l.etapa === et.id);
    const soma = items.reduce((s, l) => s + l.valor, 0);
    const body = items.length
      ? items.map(cardHTML).join('')
      : `<div class="col-empty">Sem leads aqui</div>`;
    return `<div class="col" data-etapa="${et.id}">
      <div class="col-head">
        <span class="col-dot" style="background:${et.cor}"></span>
        <span class="col-name">${et.nome}</span>
        <span class="col-count">${items.length}</span>
        <span class="col-sum num">${moneyK(soma)}</span>
      </div>
      <div class="col-body" data-etapa="${et.id}">${body}</div>
      ${et.id !== 'perdido' ? `<button class="col-add" onclick="App.openNovoLead('${et.id}')">${svgWrap('<path d="M12 5v14M5 12h14" stroke-linecap="round"/>')} Adicionar lead</button>` : ''}
    </div>`;
  }).join('');

  return `${renderKPIs()}
    <div class="funnel-head">
      <h2>Funil de vendas</h2>
      <div class="filters">
        <select class="filter-sel" id="fVend" onchange="App.setFiltro('vendedor', this.value)">
          <option value="">Todos vendedores</option>
          ${VENDEDORES.map(v => `<option ${FILTROS.vendedor === v.nome ? 'selected' : ''}>${v.nome}</option>`).join('')}
        </select>
        <select class="filter-sel" id="fOrig" onchange="App.setFiltro('origem', this.value)">
          <option value="">Todas origens</option>
          ${Object.entries(ORIGENS).map(([k, v]) => `<option value="${k}" ${FILTROS.origem === k ? 'selected' : ''}>${v.nome}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="board-wrap"><div class="board" id="board">${cols}</div></div>`;
}

/* ============================================================
   RENDER — LISTA (tabela)
   ============================================================ */
function renderLista() {
  const data = filtrados().slice().sort((a, b) => new Date(b.atualizadoEm) - new Date(a.atualizadoEm));
  const rows = data.map(l => {
    const et = ETAPA_MAP[l.etapa];
    const o = ORIGENS[l.origem] || { nome: l.origem };
    return `<tr ${rowA11y('Abrir lead ' + l.nome)} onclick="App.openDetalhe('${l.id}')">
      <td>
        <div class="cell-name">${esc(l.nome)}</div>
        <div class="cell-sub">${esc(l.telefone)} · ${esc(l.cidade)}</div>
      </td>
      <td><span class="chip">${esc(l.modelo)}</span></td>
      <td class="num" style="font-weight:700;color:var(--t-strong)">${money(l.valor)}</td>
      <td><span class="badge" style="background:${et.cor}1a;color:${et.cor}"><span class="bd" style="background:${et.cor}"></span>${et.nome}</span></td>
      <td><span class="chip">${o.nome}</span></td>
      <td><div style="display:flex;align-items:center;gap:7px"><div class="avatar" style="background:${vendedorCor(l.vendedor)}">${initials(l.vendedor)}</div>${esc(l.vendedor.split(' ')[0])}</div></td>
      <td><span class="temp ${l.temperatura}" style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${TEMPS[l.temperatura].cor}"></span> ${TEMPS[l.temperatura].nome}</td>
      <td class="cell-sub">${diasAtras(l.atualizadoEm)}</td>
    </tr>`;
  }).join('');

  return `<div style="padding:24px 28px 32px">
    ${renderKPIs()}
    <div class="funnel-head">
      <h2>Base de leads <span style="color:var(--t-muted);font-family:var(--font-ui);font-size:14px;font-weight:600">· ${data.length}</span></h2>
      <div class="filters">
        <select class="filter-sel" onchange="App.setFiltro('vendedor', this.value)">
          <option value="">Todos vendedores</option>
          ${VENDEDORES.map(v => `<option ${FILTROS.vendedor === v.nome ? 'selected' : ''}>${v.nome}</option>`).join('')}
        </select>
        <select class="filter-sel" onchange="App.setFiltro('origem', this.value)">
          <option value="">Todas origens</option>
          ${Object.entries(ORIGENS).map(([k, v]) => `<option value="${k}" ${FILTROS.origem === k ? 'selected' : ''}>${v.nome}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="panel">
      <table class="tbl">
        <thead><tr>
          <th>Cliente</th><th>Modelo</th><th>Valor</th><th>Etapa</th><th>Origem</th><th>Vendedor</th><th>Temp.</th><th>Atualiz.</th>
        </tr></thead>
        <tbody>${rows || `<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--t-faint)">Nenhum lead encontrado com esses filtros.</td></tr>`}</tbody>
      </table>
    </div>
  </div>`;
}

/* ============================================================
   RENDER — CLIENTES
   ============================================================ */
function renderClientes() {
  const busca = FILTROS.busca.trim().toLowerCase();
  const todos = clientesData();
  const data = busca ? todos.filter(c => {
    const hay = `${c.nome} ${c.telefone} ${c.email} ${c.cidade} ${c.modelo} ${c.vendedor}`.toLowerCase();
    return hay.includes(busca);
  }) : todos;
  const valorTotal = data.reduce((s, c) => s + (c.valor || 0), 0);
  const ticket = data.length ? valorTotal / data.length : 0;
  const garantiasAtivas = data.filter(c => garantiaInfo(c.vendaEm).status === 'Ativa').length;
  const comProposta = data.filter(c => c.orcamentos.length).length;

  const kpi = (icon, label, val, foot) => `
    <div class="kpi">
      <div class="k-top">${svgWrap(icon)} ${label}</div>
      <div class="k-val num">${val}</div>
      <div class="k-foot">${foot}</div>
    </div>`;

  const rows = data.map(c => {
    const g = garantiaInfo(c.vendaEm);
    const origem = c.origem ? ORIGENS[c.origem]?.nome || c.origem : 'Venda direta';
    const ultimoOrc = c.orcamentos.slice().sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm))[0];
    return `<tr ${rowA11y('Abrir cliente ' + c.nome)} onclick="App.openCliente('${c.id}')">
      <td>
        <div class="client-cell">
          <div class="avatar client-avatar" style="background:${vendedorCor(c.nome)}">${initials(c.nome)}</div>
          <div><div class="cell-name">${esc(c.nome)}</div><div class="cell-sub">${esc(c.telefone || 'Sem telefone')} · ${esc(c.cidade || '—')}</div></div>
        </div>
      </td>
      <td><span class="chip">${esc(c.modelo || 'Modelo não informado')}</span></td>
      <td><div class="cell-name num">${money(c.valor)}</div><div class="cell-sub">${dataBR(c.vendaEm)}</div></td>
      <td><span class="st ${g.status === 'Ativa' ? 'st-aprovado' : 'st-recusado'}"><span class="bd"></span>${g.status}</span><div class="cell-sub">até ${dataBR(g.fim.toISOString())}</div></td>
      <td><span class="chip">${esc(origem)}</span>${ultimoOrc ? `<div class="cell-sub">Proposta #${esc(ultimoOrc.numero)}</div>` : ''}</td>
      <td><div style="display:flex;align-items:center;gap:7px"><div class="avatar" style="background:${vendedorCor(c.vendedor)}">${initials(c.vendedor)}</div>${esc((c.vendedor || '—').split(' ')[0])}</div></td>
      <td onclick="event.stopPropagation()">
        <div class="row-actions">
          ${ultimoOrc ? `<button class="mini-btn" title="Ver proposta" onclick="Orc.imprimir('${ultimoOrc.id}')">${svgWrap('<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M6 14h12v8H6z" stroke-linejoin="round"/>')}</button>` : ''}
          ${c.telefone ? `<a class="mini-btn" href="https://wa.me/55${phoneKey(c.telefone)}" target="_blank" rel="noopener" title="Abrir WhatsApp">${origemIcon('whatsapp')}</a>` : ''}
          <button class="mini-btn" title="Abrir cadastro" onclick="App.openCliente('${c.id}')">${svgWrap('<circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01" stroke-linecap="round"/>')}</button>
        </div>
      </td>
    </tr>`;
  }).join('');

  return `<div style="padding:24px 28px 32px">
    <div class="kpis">
      ${kpi('<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 6.5a3 3 0 0 1 0 5.8M18 19a5 5 0 0 0-2.5-4.2" stroke-linecap="round"/>', 'Clientes', data.length, `${todos.length} no cadastro ativo`)}
      ${kpi('<path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"/>', 'Garantias ativas', garantiasAtivas, '15 anos no casco')}
      ${kpi('<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 9.5h19" stroke-linecap="round"/>', 'Valor vendido', moneyK(valorTotal), `${data.length} contratos`)}
      ${kpi('<circle cx="12" cy="12" r="9"/><path d="M12 7v10M9 9.5h4a1.5 1.5 0 0 1 0 3h-2a1.5 1.5 0 0 0 0 3h4" stroke-linecap="round"/>', 'Ticket médio', moneyK(ticket), 'por cliente')}
      ${kpi('<path d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-3" stroke-linecap="round"/><rect x="8" y="2" width="8" height="4" rx="1"/>', 'Com proposta', comProposta, 'aprovada ou vinculada')}
    </div>

    <div class="funnel-head">
      <h2>Clientes <span style="color:var(--t-muted);font-family:var(--font-ui);font-size:14px;font-weight:600">· ${data.length}</span></h2>
      <div class="client-hint">Criados automaticamente a partir de vendas ganhas e propostas aprovadas</div>
    </div>

    <div class="panel">
      <table class="tbl">
        <thead><tr>
          <th>Cliente</th><th>Piscina</th><th>Venda</th><th>Garantia</th><th>Origem</th><th>Consultor</th><th></th>
        </tr></thead>
        <tbody>${rows || `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--t-faint)">Nenhum cliente ainda. Aprove uma proposta ou mova um lead para Ganho.</td></tr>`}</tbody>
      </table>
    </div>
  </div>`;
}

/* ============================================================
   RENDER — OBRAS & INSTALAÇÃO
   ============================================================ */
function obraCardHTML(o) {
  const et = OBRA_MAP[o.etapa];
  const atrasada = new Date(o.previsao) < new Date() && o.etapa !== 'entrega';
  return `<div class="obra-card" ${rowA11y('Obra de ' + o.cliente.nome)} onclick="App.openObra('${o.id}')">
    <div class="obra-top">
      <span class="badge" style="background:${et.cor}1a;color:${et.cor}"><span class="bd" style="background:${et.cor}"></span>${et.nome}</span>
      ${atrasada ? '<span class="st st-recusado"><span class="bd"></span>Atrasada</span>' : ''}
    </div>
    <div class="obra-client">${esc(o.cliente.nome)}</div>
    <div class="obra-sub">${esc(o.cliente.modelo)} · ${esc(o.cliente.cidade || '—')}</div>
    <div class="obra-meta">
      <span>${svgWrap('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2" stroke-linecap="round"/>')} ${dataBR(o.previsao)}</span>
      <span>${esc(o.responsavel)}</span>
    </div>
  </div>`;
}

function renderObras() {
  const busca = FILTROS.busca.trim().toLowerCase();
  const todos = obrasData();
  const data = busca ? todos.filter(o => {
    const c = o.cliente;
    const hay = `${c.nome} ${c.telefone} ${c.cidade} ${c.modelo} ${o.responsavel} ${OBRA_MAP[o.etapa]?.nome}`.toLowerCase();
    return hay.includes(busca);
  }) : todos;
  const emExec = data.filter(o => o.etapa !== 'entrega').length;
  const entregues = data.filter(o => o.etapa === 'entrega').length;
  const atrasadas = data.filter(o => new Date(o.previsao) < new Date() && o.etapa !== 'entrega').length;
  const valorExec = data.filter(o => o.etapa !== 'entrega').reduce((s, o) => s + o.cliente.valor, 0);

  const kpi = (icon, label, val, foot) => `
    <div class="kpi">
      <div class="k-top">${svgWrap(icon)} ${label}</div>
      <div class="k-val num">${val}</div>
      <div class="k-foot">${foot}</div>
    </div>`;

  const cols = OBRA_ETAPAS.map(et => {
    const items = data.filter(o => o.etapa === et.id);
    return `<div class="obra-col">
      <div class="col-head">
        <span class="col-dot" style="background:${et.cor}"></span>
        <span class="col-name">${et.nome}</span>
        <span class="col-count">${items.length}</span>
      </div>
      <div class="obra-col-body">${items.map(obraCardHTML).join('') || `<div class="col-empty">Sem obras</div>`}</div>
    </div>`;
  }).join('');

  return `<div style="padding:24px 28px 32px">
    <div class="kpis">
      ${kpi('<path d="M3 20h18M5 20V9l7-5 7 5v11M9 20v-6h6v6" stroke-linecap="round" stroke-linejoin="round"/>', 'Obras ativas', emExec, `${data.length} no pós-venda`)}
      ${kpi('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2" stroke-linecap="round"/>', 'Valor em execução', moneyK(valorExec), 'contratos em obra')}
      ${kpi('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2" stroke-linecap="round"/>', 'Atrasadas', atrasadas, 'previsão vencida')}
      ${kpi('<path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"/>', 'Entregues', entregues, 'pipeline concluído')}
      ${kpi('<path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>', 'Próxima entrega', data[0] ? dataBR(data[0].previsao) : '—', data[0] ? data[0].cliente.nome : 'sem obras')}
    </div>
    <div class="funnel-head">
      <h2>Obras &amp; Instalação <span style="color:var(--t-muted);font-family:var(--font-ui);font-size:14px;font-weight:600">· ${data.length}</span></h2>
      <div class="client-hint">Pipeline gerado a partir dos clientes conquistados</div>
    </div>
    <div class="obra-board">${cols}</div>
  </div>`;
}

/* ============================================================
   RENDER — FINANCEIRO
   ============================================================ */
function renderFinanceiro() {
  const busca = FILTROS.busca.trim().toLowerCase();
  const todos = financeiroData();
  const data = busca ? todos.filter(f => {
    const c = f.cliente;
    const hay = `${c.nome} ${c.telefone} ${c.cidade} ${c.modelo} ${c.vendedor} ${statusFinLabel(f.status)}`.toLowerCase();
    return hay.includes(busca);
  }) : todos;
  const receber = data.reduce((s, f) => s + f.saldo, 0);
  const recebido = data.reduce((s, f) => s + f.pago, 0);
  const atrasado = data.filter(f => f.status === 'atrasado').reduce((s, f) => s + f.saldo, 0);
  const comissoes = data.filter(f => !f.comissaoPaga).reduce((s, f) => s + f.comissao, 0);
  const quitados = data.filter(f => f.status === 'quitado').length;

  const kpi = (icon, label, val, foot) => `
    <div class="kpi">
      <div class="k-top">${svgWrap(icon)} ${label}</div>
      <div class="k-val num">${val}</div>
      <div class="k-foot">${foot}</div>
    </div>`;

  const rows = data.map(f => {
    const c = f.cliente;
    const num = f.o ? `#${f.o.numero}` : 'Funil';
    return `<tr ${rowA11y('Abrir financeiro de ' + c.nome)} onclick="App.openFinanceiro('${f.id}')">
      <td><div class="cell-name">${esc(c.nome)}</div><div class="cell-sub">${esc(c.modelo)} · ${num}</div></td>
      <td><div class="cell-name num">${money(f.total)}</div><div class="cell-sub">${dataBR(c.vendaEm)}</div></td>
      <td onclick="event.stopPropagation()">
        <label class="check-line"><input type="checkbox" ${f.entradaPaga ? 'checked' : ''} onchange="App.setFinEntrada('${f.id}', this.checked)"> ${money(f.entrada)}</label>
      </td>
      <td onclick="event.stopPropagation()">
        <div class="parcel-control">
          <input type="number" min="0" max="${f.parcelas}" value="${f.parcelasPagas}" onchange="App.setFinParcelas('${f.id}', this.value)">
          <span>de ${f.parcelas} · ${money(f.parcela)}</span>
        </div>
      </td>
      <td><div class="cell-name num">${money(f.saldo)}</div><div class="cell-sub">${f.vencidas} vencida(s)</div></td>
      <td><div class="cell-name num">${money(f.comissao)}</div><div class="cell-sub">${f.comissaoPct}% · ${f.comissaoPaga ? 'paga' : 'pendente'}</div></td>
      <td><span class="st ${statusFinClass(f.status)}"><span class="bd"></span>${statusFinLabel(f.status)}</span></td>
    </tr>`;
  }).join('');

  return `<div style="padding:24px 28px 32px">
    <div class="kpis">
      ${kpi('<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 9.5h19" stroke-linecap="round"/>', 'A receber', moneyK(receber), `${data.length} contratos`)}
      ${kpi('<path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"/>', 'Recebido', moneyK(recebido), `${quitados} quitados`)}
      ${kpi('<circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01" stroke-linecap="round"/>', 'Em atraso', moneyK(atrasado), `${data.filter(f => f.status === 'atrasado').length} contratos`)}
      ${kpi('<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6" stroke-linecap="round"/>', 'Comissões', moneyK(comissoes), 'pendentes de pagamento')}
      ${kpi('<path d="M3 3v18h18M7 14l3-3 3 3 5-6" stroke-linecap="round" stroke-linejoin="round"/>', 'Fluxo total', moneyK(receber + recebido), 'carteira contratada')}
    </div>
    <div class="funnel-head">
      <h2>Financeiro <span style="color:var(--t-muted);font-family:var(--font-ui);font-size:14px;font-weight:600">· ${data.length}</span></h2>
      <div class="client-hint">Entradas, parcelas, saldo restante e comissões</div>
    </div>
    <div class="panel">
      <table class="tbl">
        <thead><tr>
          <th>Cliente</th><th>Contrato</th><th>Entrada</th><th>Parcelas</th><th>Saldo</th><th>Comissão</th><th>Status</th>
        </tr></thead>
        <tbody>${rows || `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--t-faint)">Nenhum contrato financeiro ainda.</td></tr>`}</tbody>
      </table>
    </div>
  </div>`;
}

/* ============================================================
   RENDER — RELATÓRIOS
   ============================================================ */
function pct(n, d) { return d ? Math.round((n / d) * 100) : 0; }
function groupRows(items, keyFn, valFn) {
  const map = new Map();
  items.forEach(it => {
    const k = keyFn(it) || '—';
    const cur = map.get(k) || { nome: k, qtd: 0, valor: 0 };
    cur.qtd += 1;
    cur.valor += valFn ? valFn(it) : 0;
    map.set(k, cur);
  });
  return [...map.values()].sort((a, b) => b.valor - a.valor || b.qtd - a.qtd);
}
function barRows(rows, max, rightFn) {
  return rows.map(r => {
    const value = typeof r.valor === 'number' ? r.valor : r.qtd;
    return `<div class="bar-row">
    <div class="bar-head"><span>${esc(r.nome)}</span><b>${rightFn(r)}</b></div>
    <div class="bar-track"><span style="width:${max && value ? Math.max(4, Math.round(value / max * 100)) : 0}%"></span></div>
  </div>`;
  }).join('');
}

function renderRelatorios() {
  const clientes = clientesData();
  const financeiros = financeiroData();
  const propostas = (typeof ORC !== 'undefined' ? ORC : []);
  const ganhos = LEADS.filter(l => l.etapa === 'ganho');
  const emNeg = LEADS.filter(l => ['proposta', 'negociacao'].includes(l.etapa));
  const valorNeg = emNeg.reduce((s, l) => s + l.valor, 0);
  const valorGanho = clientes.reduce((s, c) => s + c.valor, 0);
  const propostasEnviadas = propostas.filter(o => ['enviado', 'aprovado', 'recusado'].includes(o.status));
  const vendedorRows = VENDEDORES.map(v => {
    const leads = LEADS.filter(l => l.vendedor === v.nome);
    const win = leads.filter(l => l.etapa === 'ganho');
    return { nome: v.nome, qtd: leads.length, ganhos: win.length, valor: pct(win.length, leads.length) };
  }).sort((a, b) => b.valor - a.valor);
  const origemRows = groupRows(ganhos, l => ORIGENS[l.origem]?.nome || l.origem, l => l.valor);
  const modeloRows = groupRows(clientes, c => c.modelo, c => c.valor).map(r => ({ ...r, ticket: r.valor / r.qtd }));
  const maxVend = Math.max(1, ...vendedorRows.map(r => r.valor));
  const maxOrigem = Math.max(1, ...origemRows.map(r => r.valor));
  const maxModelo = Math.max(1, ...modeloRows.map(r => r.ticket));
  const aReceber = financeiros.reduce((s, f) => s + f.saldo, 0);

  const kpi = (icon, label, val, foot) => `
    <div class="kpi">
      <div class="k-top">${svgWrap(icon)} ${label}</div>
      <div class="k-val num">${val}</div>
      <div class="k-foot">${foot}</div>
    </div>`;

  const modeloBars = modeloRows.map(r => ({ nome: r.nome, qtd: r.qtd, valor: r.ticket }));

  return `<div style="padding:24px 28px 32px">
    <div class="kpis">
      ${kpi('<path d="M3 3v18h18M7 14l3-3 3 3 5-6" stroke-linecap="round" stroke-linejoin="round"/>', 'Conversão geral', pct(ganhos.length, LEADS.length) + '%', `${ganhos.length} ganhos de ${LEADS.length} leads`)}
      ${kpi('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2" stroke-linecap="round"/>', 'Em negociação', moneyK(valorNeg), `${emNeg.length} oportunidades`)}
      ${kpi('<path d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-3" stroke-linecap="round"/><rect x="8" y="2" width="8" height="4" rx="1"/>', 'Propostas enviadas', propostasEnviadas.length, `${propostas.filter(o => o.status === 'aprovado').length} aprovadas`)}
      ${kpi('<path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"/>', 'Vendas ganhas', moneyK(valorGanho), `${clientes.length} clientes`)}
      ${kpi('<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 9.5h19" stroke-linecap="round"/>', 'Recebíveis', moneyK(aReceber), 'saldo em aberto')}
    </div>

    <div class="report-grid">
      <section class="report-card">
        <div class="report-head"><h2>Conversão por vendedor</h2><span>ganhos / leads</span></div>
        ${barRows(vendedorRows, maxVend, r => `${r.valor}% · ${r.ganhos}/${r.qtd}`)}
      </section>
      <section class="report-card">
        <div class="report-head"><h2>Origem que mais vende</h2><span>valor ganho</span></div>
        ${barRows(origemRows, maxOrigem, r => `${moneyK(r.valor)} · ${r.qtd}`) || '<div class="client-empty-note">Sem vendas por origem.</div>'}
      </section>
      <section class="report-card">
        <div class="report-head"><h2>Ticket médio por modelo</h2><span>clientes ganhos</span></div>
        ${barRows(modeloBars, maxModelo, r => `${moneyK(r.valor)} · ${r.qtd}`) || '<div class="client-empty-note">Sem vendas por modelo.</div>'}
      </section>
      <section class="report-card">
        <div class="report-head"><h2>Resumo do funil</h2><span>posição atual</span></div>
        <div class="stage-list">
          ${ETAPAS.map(et => {
            const items = LEADS.filter(l => l.etapa === et.id);
            const val = items.reduce((s, l) => s + l.valor, 0);
            return `<div class="stage-item"><span class="col-dot" style="background:${et.cor}"></span><b>${et.nome}</b><span>${items.length}</span><em>${moneyK(val)}</em></div>`;
          }).join('')}
        </div>
      </section>
      ${renderMetasServidor()}
    </div>
  </div>`;
}

/* Card de metas por vendedor calculado NO SERVIDOR (view vw_metas_vendedor).
   Preenchido por supabase.js em window.__supaViews; some graciosamente offline. */
function renderMetasServidor() {
  const vw = (typeof window !== 'undefined' && window.__supaViews) ? window.__supaViews : null;
  const metas = (vw && Array.isArray(vw.metas)) ? vw.metas.slice() : [];
  const head = `<div class="report-head"><h2>Metas por vendedor <span class="live-tag">● servidor</span></h2><span>realizado / meta</span></div>`;
  if (!metas.length) {
    return `<section class="report-card"><div class="report-head"><h2>Metas por vendedor <span class="live-tag off">● servidor</span></h2><span>realizado / meta</span></div>
      <div class="client-empty-note">Disponível ao conectar no Supabase (dados calculados no banco).</div></section>`;
  }
  metas.sort((a, b) => (b.realizado || 0) - (a.realizado || 0));
  const rows = metas.map(m => {
    const meta = Number(m.meta) || 0;
    const real = Number(m.realizado) || 0;
    const pipe = Number(m.pipeline) || 0;
    const p = meta > 0 ? Math.min(100, Math.round(real / meta * 100)) : (real > 0 ? 100 : 0);
    const cor = m.cor || '#0ea5a4';
    return `<div class="meta-row">
      <div class="meta-top"><span class="meta-nome"><span class="col-dot" style="background:${cor}"></span>${esc(m.nome || '—')}</span>
        <span class="meta-pct">${p}%</span></div>
      <div class="meta-bar"><div class="meta-fill" style="width:${p}%;background:${cor}"></div></div>
      <div class="meta-foot">${moneyK(real)} de ${moneyK(meta)} · pipeline ${moneyK(pipe)} · ${m.leads_ativos || 0} ativos</div>
    </div>`;
  }).join('');
  return `<section class="report-card">${head}<div class="meta-list">${rows}</div></section>`;
}

/* ============================================================
   RENDER — CONFIGURAÇÕES
   ============================================================ */
function configInput(id, value, type = 'text', extra = '') {
  return `<input class="cfg-inp${type === 'color' ? ' cfg-inp-color' : ''}" id="${id}" type="${type}" value="${esc(String(value ?? ''))}" ${extra}>`;
}
function renderConfigTable(title, hint, headers, rows, addHtml) {
  return `<section class="report-card cfg-card">
    <div class="report-head"><h2>${title}</h2><span>${hint}</span></div>
    <div class="cfg-table-wrap">
      <table class="tbl cfg-tbl">
        <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}<th class="cfg-act-col" colspan="2">Ações</th></tr></thead>
        <tbody>${rows}${addHtml}</tbody>
      </table>
    </div>
  </section>`;
}
function renderConfiguracoes() {
  const modeloRows = MODELOS.map((m, i) => `<tr>
    <td>${configInput(`cfg_mod_nome_${i}`, m.nome)}</td>
    <td>${configInput(`cfg_mod_base_${i}`, m.base, 'number', 'min="0" step="100"')}</td>
    <td><button class="mini-btn" title="Salvar modelo" onclick="App.saveModelo(${i})">${svgWrap('<path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"/>')}</button></td>
    <td><button class="mini-btn danger" title="Remover modelo" onclick="App.delModelo(${i})">${svgWrap('<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" stroke-linecap="round" stroke-linejoin="round"/>')}</button></td>
  </tr>`).join('');
  const modeloAdd = `<tr class="cfg-add-row">
    <td>${configInput('cfg_mod_nome_new', '', 'text', 'placeholder="Novo modelo"')}</td>
    <td>${configInput('cfg_mod_base_new', '', 'number', 'min="0" step="100" placeholder="Preço base"')}</td>
    <td colspan="2"><button class="btn btn-primary btn-sm" onclick="App.addModelo()">Adicionar</button></td>
  </tr>`;

  const adicionais = typeof ADICIONAIS !== 'undefined' ? ADICIONAIS : [];
  const adicionalRows = adicionais.map((a, i) => `<tr>
    <td>${configInput(`cfg_ad_nome_${i}`, a.nome)}</td>
    <td>${configInput(`cfg_ad_valor_${i}`, a.valor, 'number', 'min="0" step="50"')}</td>
    <td>${configInput(`cfg_ad_un_${i}`, a.unidade || '', 'text', 'placeholder="un."')}</td>
    <td>${configInput(`cfg_ad_qtd_${i}`, a.qtdPadrao || 1, 'number', 'min="1"')}</td>
    <td><button class="mini-btn" title="Salvar adicional" onclick="App.saveAdicional(${i})">${svgWrap('<path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"/>')}</button></td>
    <td><button class="mini-btn danger" title="Remover adicional" onclick="App.delAdicional(${i})">${svgWrap('<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" stroke-linecap="round" stroke-linejoin="round"/>')}</button></td>
  </tr>`).join('');
  const adicionalAdd = `<tr class="cfg-add-row">
    <td>${configInput('cfg_ad_nome_new', '', 'text', 'placeholder="Novo adicional"')}</td>
    <td>${configInput('cfg_ad_valor_new', '', 'number', 'min="0" step="50" placeholder="Valor"')}</td>
    <td>${configInput('cfg_ad_un_new', '', 'text', 'placeholder="m², m..."')}</td>
    <td>${configInput('cfg_ad_qtd_new', '1', 'number', 'min="1"')}</td>
    <td colspan="2"><button class="btn btn-primary btn-sm" onclick="App.addAdicional()">Adicionar</button></td>
  </tr>`;

  const vendedorRows = VENDEDORES.map((v, i) => `<tr>
    <td>${configInput(`cfg_v_nome_${i}`, v.nome)}</td>
    <td><div class="cfg-color-field">${configInput(`cfg_v_cor_${i}`, v.cor, 'color')}<span>${esc(v.cor)}</span></div></td>
    <td>${configInput(`cfg_v_meta_${i}`, v.meta ?? META_PADRAO, 'number', 'min="0" step="10000"')}</td>
    <td><button class="mini-btn" title="Salvar vendedor" onclick="App.saveVendedor(${i})">${svgWrap('<path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"/>')}</button></td>
    <td><button class="mini-btn danger" title="Remover vendedor" onclick="App.delVendedor(${i})">${svgWrap('<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" stroke-linecap="round" stroke-linejoin="round"/>')}</button></td>
  </tr>`).join('');
  const vendedorAdd = `<tr class="cfg-add-row">
    <td>${configInput('cfg_v_nome_new', '', 'text', 'placeholder="Novo vendedor"')}</td>
    <td><div class="cfg-color-field">${configInput('cfg_v_cor_new', '#0ea5a4', 'color')}<span>#0ea5a4</span></div></td>
    <td>${configInput('cfg_v_meta_new', META_PADRAO, 'number', 'min="0" step="10000"')}</td>
    <td colspan="2"><button class="btn btn-primary btn-sm" onclick="App.addVendedor()">Adicionar</button></td>
  </tr>`;

  const equipeRows = EQUIPES.map((eq, i) => `<tr>
    <td>${configInput(`cfg_eq_nome_${i}`, eq)}</td>
    <td><button class="mini-btn" title="Salvar equipe" onclick="App.saveEquipe(${i})">${svgWrap('<path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"/>')}</button></td>
    <td><button class="mini-btn danger" title="Remover equipe" onclick="App.delEquipe(${i})">${svgWrap('<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" stroke-linecap="round" stroke-linejoin="round"/>')}</button></td>
  </tr>`).join('');
  const equipeAdd = `<tr class="cfg-add-row">
    <td>${configInput('cfg_eq_nome_new', '', 'text', 'placeholder="Nova equipe"')}</td>
    <td colspan="2"><button class="btn btn-primary btn-sm" onclick="App.addEquipe()">Adicionar</button></td>
  </tr>`;

  const adicionaisCount = adicionais.length;
  const metaTotal = VENDEDORES.reduce((s, v) => s + (v.meta ?? META_PADRAO), 0);

  const kpi = (icon, label, val, foot) => `
    <div class="kpi">
      <div class="k-top">${svgWrap(icon)} ${label}</div>
      <div class="k-val num">${val}</div>
      <div class="k-foot">${foot}</div>
    </div>`;

  return `<div style="padding:24px 28px 32px">
    <div class="kpis">
      ${kpi('<path d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-3" stroke-linecap="round"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M8 12h8M8 16h5" stroke-linecap="round"/>', 'Modelos', MODELOS.length, 'no catálogo')}
      ${kpi('<path d="M12 5v14M5 12h14" stroke-linecap="round"/>', 'Adicionais', adicionaisCount, 'opcionais da proposta')}
      ${kpi('<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 6.5a3 3 0 0 1 0 5.8" stroke-linecap="round"/>', 'Vendedores', VENDEDORES.length, 'no time comercial')}
      ${kpi('<path d="M3 20h18M5 20V9l7-5 7 5v11M9 20v-6h6v6" stroke-linecap="round" stroke-linejoin="round"/>', 'Equipes', EQUIPES.length, 'de instalação')}
      ${kpi('<path d="M3 3v18h18M7 14l3-3 3 3 5-6" stroke-linecap="round" stroke-linejoin="round"/>', 'Meta do time', moneyK(metaTotal), 'somatório mensal')}
    </div>

    <div class="funnel-head">
      <h2>Catálogo &amp; Operação</h2>
      <div class="client-hint">Modelos, adicionais, vendedores e equipes usados em todo o sistema</div>
    </div>

    <div class="report-grid cfg-grid">
      ${renderConfigTable('Modelos de piscina', 'catálogo e preço base', ['Modelo', 'Preço base'], modeloRows, modeloAdd)}
      ${renderConfigTable('Adicionais', 'opcionais da proposta', ['Item', 'Valor', 'Unidade', 'Qtd. padrão'], adicionalRows, adicionalAdd)}
      ${renderConfigTable('Vendedores', 'responsáveis e metas mensais', ['Nome', 'Cor', 'Meta mensal (R$)'], vendedorRows, vendedorAdd)}
      ${renderConfigTable('Equipes', 'operação e instalação', ['Equipe'], equipeRows, equipeAdd)}
    </div>

    <div class="funnel-head" style="margin-top:24px">
      <h2>Dados do sistema</h2>
      <div class="client-hint">Backup e restauração de todos os registros</div>
    </div>

    <section class="report-card cfg-backup">
      <div class="report-head"><h2>Backup &amp; Restauração</h2><span>exporte ou importe tudo</span></div>
      <p class="cfg-backup-text">Todos os dados do sistema ficam salvos apenas neste navegador. Exporte um backup com frequência (e antes de limpar o navegador ou trocar de computador) para não perder nada. A importação substitui os dados atuais.</p>
      <div class="cfg-backup-actions">
        <button class="btn btn-primary btn-sm" onclick="App.exportarBackup()">${svgWrap('<path d="M12 3v10m0 0l-3.5-3.5M12 13l3.5-3.5M5 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" stroke-linecap="round" stroke-linejoin="round"/>')} Exportar backup (.json)</button>
        <label class="btn btn-ghost btn-sm">
          ${svgWrap('<path d="M12 13V3m0 0L8.5 6.5M12 3l3.5 3.5M5 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" stroke-linecap="round" stroke-linejoin="round"/>')} Importar backup
          <input type="file" accept="application/json,.json" style="display:none" onchange="App.importarBackup(this)">
        </label>
      </div>
    </section>
  </div>`;
}

function cfgVal(id) { return document.getElementById(id)?.value.trim() || ''; }
function cfgNum(id) { return parseInt((document.getElementById(id)?.value || '0').replace(/\D/g, ''), 10) || 0; }
function configDone(msg) {
  saveConfig();
  render();
  toast(msg);
}
function saveModelo(i) {
  const old = MODELOS[i]?.nome; if (!old) return;
  const nome = cfgVal(`cfg_mod_nome_${i}`);
  const base = cfgNum(`cfg_mod_base_${i}`);
  if (!nome) { toast('Informe o nome do modelo', true); return; }
  MODELOS[i] = { nome, base };
  ensureModeloSpec(nome);
  if (old !== nome) {
    LEADS.forEach(l => { if (l.modelo === old) l.modelo = nome; });
    if (typeof ORC !== 'undefined') ORC.forEach(o => { if (o.modelo === old) o.modelo = nome; });
    save(); if (typeof orcSave === 'function') orcSave();
  }
  configDone('Modelo salvo');
}
function addModelo() {
  const nome = cfgVal('cfg_mod_nome_new');
  const base = cfgNum('cfg_mod_base_new');
  if (!nome) { toast('Informe o nome do modelo', true); return; }
  MODELOS.push({ nome, base });
  ensureModeloSpec(nome);
  configDone('Modelo adicionado');
}
function delModelo(i) {
  const nome = MODELOS[i]?.nome; if (!nome) return;
  const emUso = LEADS.some(l => l.modelo === nome) || (typeof ORC !== 'undefined' && ORC.some(o => o.modelo === nome));
  if (emUso) { toast('Modelo em uso: renomeie ou ajuste os registros antes de remover', true); return; }
  if (MODELOS.length <= 1) { toast('Mantenha pelo menos um modelo', true); return; }
  MODELOS.splice(i, 1);
  configDone('Modelo removido');
}
function saveAdicional(i) {
  if (typeof ADICIONAIS === 'undefined') return;
  const old = ADICIONAIS[i]?.nome; if (!old) return;
  const item = {
    nome: cfgVal(`cfg_ad_nome_${i}`),
    valor: cfgNum(`cfg_ad_valor_${i}`),
    unidade: cfgVal(`cfg_ad_un_${i}`),
    qtdPadrao: Math.max(1, cfgNum(`cfg_ad_qtd_${i}`) || 1),
  };
  if (!item.nome) { toast('Informe o nome do adicional', true); return; }
  ADICIONAIS[i] = item;
  syncAdicionais(ADICIONAIS);
  if (old !== item.nome && typeof ORC !== 'undefined') {
    ORC.forEach(o => (o.adicionais || []).forEach(a => { if (a.nome === old) a.nome = item.nome; }));
    if (typeof orcSave === 'function') orcSave();
  }
  configDone('Adicional salvo');
}
function addAdicional() {
  if (typeof ADICIONAIS === 'undefined') return;
  const item = {
    nome: cfgVal('cfg_ad_nome_new'),
    valor: cfgNum('cfg_ad_valor_new'),
    unidade: cfgVal('cfg_ad_un_new'),
    qtdPadrao: Math.max(1, cfgNum('cfg_ad_qtd_new') || 1),
  };
  if (!item.nome) { toast('Informe o nome do adicional', true); return; }
  ADICIONAIS.push(item);
  syncAdicionais(ADICIONAIS);
  configDone('Adicional adicionado');
}
function delAdicional(i) {
  if (typeof ADICIONAIS === 'undefined') return;
  const nome = ADICIONAIS[i]?.nome; if (!nome) return;
  const emUso = typeof ORC !== 'undefined' && ORC.some(o => (o.adicionais || []).some(a => a.nome === nome));
  if (emUso) { toast('Adicional em uso em orçamento: mantenha ou renomeie', true); return; }
  ADICIONAIS.splice(i, 1);
  syncAdicionais(ADICIONAIS);
  configDone('Adicional removido');
}
function saveVendedor(i) {
  const old = VENDEDORES[i]?.nome; if (!old) return;
  const nome = cfgVal(`cfg_v_nome_${i}`);
  const cor = cfgVal(`cfg_v_cor_${i}`) || '#0ea5a4';
  const meta = cfgNum(`cfg_v_meta_${i}`);
  if (!nome) { toast('Informe o nome do vendedor', true); return; }
  VENDEDORES[i] = { nome, cor, meta };
  if (old !== nome) {
    LEADS.forEach(l => { if (l.vendedor === old) l.vendedor = nome; });
    if (typeof ORC !== 'undefined') ORC.forEach(o => { if (o.vendedor === old) o.vendedor = nome; });
    save(); if (typeof orcSave === 'function') orcSave();
  }
  configDone('Vendedor salvo');
}
function addVendedor() {
  const nome = cfgVal('cfg_v_nome_new');
  const cor = cfgVal('cfg_v_cor_new') || '#0ea5a4';
  const meta = cfgNum('cfg_v_meta_new') || META_PADRAO;
  if (!nome) { toast('Informe o nome do vendedor', true); return; }
  VENDEDORES.push({ nome, cor, meta });
  configDone('Vendedor adicionado');
}
function delVendedor(i) {
  const nome = VENDEDORES[i]?.nome; if (!nome) return;
  const emUso = LEADS.some(l => l.vendedor === nome) || (typeof ORC !== 'undefined' && ORC.some(o => o.vendedor === nome));
  if (emUso) { toast('Vendedor em uso: renomeie ou ajuste os registros antes de remover', true); return; }
  if (VENDEDORES.length <= 1) { toast('Mantenha pelo menos um vendedor', true); return; }
  VENDEDORES.splice(i, 1);
  configDone('Vendedor removido');
}
function saveEquipe(i) {
  const old = EQUIPES[i]; if (!old) return;
  const nome = cfgVal(`cfg_eq_nome_${i}`);
  if (!nome) { toast('Informe o nome da equipe', true); return; }
  EQUIPES[i] = nome;
  if (old !== nome) {
    Object.keys(OBRAS).forEach(k => { if (OBRAS[k].responsavel === old) OBRAS[k].responsavel = nome; });
    saveObras();
  }
  configDone('Equipe salva');
}
function addEquipe() {
  const nome = cfgVal('cfg_eq_nome_new');
  if (!nome) { toast('Informe o nome da equipe', true); return; }
  EQUIPES.push(nome);
  configDone('Equipe adicionada');
}
function delEquipe(i) {
  const nome = EQUIPES[i]; if (!nome) return;
  const emUso = Object.values(OBRAS).some(o => o.responsavel === nome);
  if (emUso) { toast('Equipe em uso em obra: renomeie ou ajuste a obra antes de remover', true); return; }
  if (EQUIPES.length <= 1) { toast('Mantenha pelo menos uma equipe', true); return; }
  EQUIPES.splice(i, 1);
  configDone('Equipe removida');
}

/* ============================================================
   BACKUP — exportar / importar todos os dados (JSON)
   ============================================================ */
function coletarBackup() {
  return {
    _app: 'PiscinaPro', _versao: 1, _exportadoEm: new Date().toISOString(),
    leads: LEADS,
    orcamentos: (typeof ORC !== 'undefined' ? ORC : []),
    obras: OBRAS,
    financeiro: FIN,
    config: {
      modelos: MODELOS,
      vendedores: VENDEDORES,
      equipes: EQUIPES,
      adicionais: (typeof ADICIONAIS !== 'undefined' ? ADICIONAIS : []),
    },
  };
}
function exportarBackup() {
  try {
    const blob = new Blob([JSON.stringify(coletarBackup(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `piscinapro-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    toast('Backup exportado ✓');
  } catch (e) { toast('Não foi possível exportar o backup', true); }
}
function importarBackup(input) {
  const file = input.files && input.files[0];
  input.value = ''; // permite reimportar o mesmo arquivo depois
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    let data;
    try { data = JSON.parse(reader.result); }
    catch (e) { toast('Arquivo inválido: não é um JSON válido', true); return; }
    if (!data || data._app !== 'PiscinaPro' || !Array.isArray(data.leads)) {
      toast('Este arquivo não é um backup do PiscinaPro', true); return;
    }
    const resumo = `${data.leads.length} leads · ${(data.orcamentos || []).length} orçamentos`;
    if (!confirm(`Restaurar este backup vai SUBSTITUIR todos os dados atuais por:\n\n${resumo}\n(exportado em ${data._exportadoEm ? dataBR(data._exportadoEm) : '—'})\n\nEsta ação não pode ser desfeita. Continuar?`)) return;
    aplicarBackup(data);
  };
  reader.onerror = () => toast('Falha ao ler o arquivo', true);
  reader.readAsText(file);
}
function aplicarBackup(data) {
  // Leads
  LEADS = Array.isArray(data.leads) ? data.leads : [];
  save();
  // Configurações (modelos, vendedores, equipes, adicionais)
  if (data.config) {
    applyConfig({
      modelos: data.config.modelos, vendedores: data.config.vendedores,
      equipes: data.config.equipes, adicionais: data.config.adicionais,
    });
    saveConfig();
  }
  // Orçamentos (mantém a referência do array de orcamentos.js)
  if (typeof ORC !== 'undefined' && Array.isArray(data.orcamentos)) {
    ORC.splice(0, ORC.length, ...data.orcamentos);
    if (typeof orcSave === 'function') orcSave();
  }
  // Operação
  OBRAS = (data.obras && typeof data.obras === 'object') ? data.obras : {};
  saveObras();
  FIN = (data.financeiro && typeof data.financeiro === 'object') ? data.financeiro : {};
  saveFin();

  closeAll();
  setView('configuracoes');
  toast('Backup restaurado com sucesso ✓');
}

/* ============================================================
   RENDER — Placeholder "em breve"
   ============================================================ */
function renderSoon(titulo) {
  const desc = {
    'Orçamentos & Propostas': 'Gere propostas com catálogo, tabela de preços e simulação de financiamento — e envie direto pro cliente.',
    'Clientes': 'Cadastro completo, histórico de compras, garantia, documentos e manutenção recorrente num só lugar.',
    'Obras & Instalação': 'Agende instalações, acompanhe cada etapa da obra (escavação → assentamento → acabamento) e gerencie equipes.',
    'Financeiro': 'Contas a receber, parcelas, comissões de vendedores e fluxo de caixa integrados ao funil.',
    'Relatórios & Metas': 'Dashboards de desempenho, metas por vendedor e indicadores do funil em tempo real.',
    'Configurações': 'Etapas do funil, modelos de piscina, tabela de preços, usuários e permissões.',
  }[titulo] || 'Módulo em construção.';
  return `<div style="padding:24px 28px"><div class="empty-state">
    <span class="es-tag">Próximo módulo</span>
    <div class="es-icon">${svgWrap('<path d="M12 2l2.5 5 5.5.8-4 3.9.9 5.5L12 14.6 7.1 17.2l.9-5.5-4-3.9L9.5 7z" stroke-linejoin="round" stroke-linecap="round"/>')}</div>
    <h2>${esc(titulo)}</h2>
    <p>${esc(desc)}</p>
    <button class="btn btn-ghost" onclick="App.go('funil')">← Voltar ao funil</button>
  </div></div>`;
}

/* ============================================================
   RENDER dispatcher
   ============================================================ */
const PAGE_INFO = {
  dashboard: ['Visão Geral', 'O panorama do negócio e as metas do time num só lugar'],
  funil: ['Leads & Funil de Vendas', 'Acompanhe cada oportunidade da captação ao fechamento'],
  lista: ['Base de Leads', 'Todos os leads em formato de lista, com filtros e busca'],
  orcamentos: ['Orçamentos & Propostas', 'Monte propostas, simule financiamento e gere o PDF'],
  clientes: ['Clientes', 'Clientes conquistados, garantias e histórico pós-venda'],
  obras: ['Obras & Instalação', 'Vistoria, execução, acabamento e entrega por cliente'],
  financeiro: ['Financeiro', 'Recebíveis, parcelas, saldos e comissões'],
  relatorios: ['Relatórios & Metas', 'Desempenho comercial, origem, ticket e funil'],
  configuracoes: ['Configurações', 'Catálogo, preços, vendedores e equipes'],
};

function render() {
  const el = document.getElementById('view');
  if (VIEW === 'dashboard') { el.className = 'view no-pad'; el.innerHTML = renderDashboard(); }
  else if (VIEW === 'funil') { el.className = 'view'; el.innerHTML = renderFunil(); bindDnD(); }
  else if (VIEW === 'lista') { el.className = 'view no-pad'; el.innerHTML = renderLista(); }
  else if (VIEW === 'clientes') { el.className = 'view no-pad'; el.innerHTML = renderClientes(); }
  else if (VIEW === 'obras') { el.className = 'view no-pad'; el.innerHTML = renderObras(); }
  else if (VIEW === 'financeiro') { el.className = 'view no-pad'; el.innerHTML = renderFinanceiro(); }
  else if (VIEW === 'relatorios') { el.className = 'view no-pad'; el.innerHTML = renderRelatorios(); }
  else if (VIEW === 'configuracoes') { el.className = 'view no-pad'; el.innerHTML = renderConfiguracoes(); }
  else if (VIEW === 'orcamentos' && window.Orc) { el.className = 'view no-pad'; el.innerHTML = Orc.renderView(); Orc.afterRender(); }
  else { el.className = 'view no-pad'; el.innerHTML = renderSoon(VIEW); }

  document.getElementById('nav-count').textContent = LEADS.filter(leadAtivo).length;
  const info = PAGE_INFO[VIEW];
  if (info) { document.getElementById('pageTitle').innerHTML = info[0]; document.getElementById('pageSub').textContent = info[1]; }
}

/* troca de view a partir de outros módulos (mantém destaque do menu) */
function setView(v, opts) {
  VIEW = v;
  if (v === 'orcamentos' && typeof orcView !== 'undefined') orcView = 'list';
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.view === v));
  if (!(opts && opts.skipRender)) render();
}
window.setView = setView;

/* abre um orçamento existente vindo de outro módulo (ex.: dashboard) */
function verOrcamento(id) {
  setView('orcamentos', { skipRender: true });
  if (window.Orc) Orc.editar(id);
}

/* ============================================================
   DRAG & DROP
   ============================================================ */
let dragId = null;
function bindDnD() {
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('dragstart', e => {
      dragId = card.dataset.id;
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    card.addEventListener('dragend', () => { card.classList.remove('dragging'); dragId = null; });
  });
  document.querySelectorAll('.col').forEach(col => {
    const etapa = col.dataset.etapa;
    col.addEventListener('dragover', e => { e.preventDefault(); col.classList.add('drag-over'); });
    col.addEventListener('dragleave', e => { if (!col.contains(e.relatedTarget)) col.classList.remove('drag-over'); });
    col.addEventListener('drop', e => {
      e.preventDefault();
      col.classList.remove('drag-over');
      if (!dragId) return;
      moverLead(dragId, etapa);
    });
  });
  bindTouchDnD();
}

/* Drag-and-drop por toque (mobile) — o DnD nativo do HTML5 não dispara em telas de toque.
   Distingue toque-arrastar (move) de toque-tap (abre o lead) por um limiar de movimento. */
function bindTouchDnD() {
  const board = document.getElementById('board');
  if (!board) return;
  let el = null, id = null, active = false, sx = 0, sy = 0, lastCol = null;
  const clear = () => {
    lastCol && lastCol.classList.remove('drag-over');
    el && el.classList.remove('dragging');
    el = id = lastCol = null; active = false;
  };
  board.addEventListener('touchstart', e => {
    const card = e.target.closest('.card'); if (!card) return;
    el = card; id = card.dataset.id; active = false;
    const t = e.touches[0]; sx = t.clientX; sy = t.clientY;
  }, { passive: true });
  board.addEventListener('touchmove', e => {
    if (!el) return;
    const t = e.touches[0];
    if (!active) {
      if (Math.hypot(t.clientX - sx, t.clientY - sy) < 10) return; // ainda pode ser tap
      active = true; el.classList.add('dragging');
    }
    e.preventDefault(); // trava o scroll enquanto arrasta
    const col = document.elementFromPoint(t.clientX, t.clientY)?.closest('.col');
    if (col !== lastCol) { lastCol && lastCol.classList.remove('drag-over'); lastCol = col; col && col.classList.add('drag-over'); }
  }, { passive: false });
  board.addEventListener('touchend', e => {
    if (el && active) {
      e.preventDefault(); // impede o "click" fantasma (abriria o detalhe)
      const etapa = lastCol && lastCol.dataset.etapa;
      const dragId = id;
      clear();
      if (etapa) moverLead(dragId, etapa);
      return;
    }
    clear();
  });
  board.addEventListener('touchcancel', clear);
}
function moverLead(id, etapa) {
  const l = LEADS.find(x => x.id === id);
  if (!l || l.etapa === etapa) return;
  const de = ETAPA_MAP[l.etapa]?.nome, para = ETAPA_MAP[etapa]?.nome;
  l.etapa = etapa;
  l.atualizadoEm = new Date().toISOString();
  l.interacoes.unshift({ id: uid(), quando: new Date().toISOString(), tipo: etapa === 'ganho' ? 'Ganho' : 'Etapa', texto: `Movido de "${de}" para "${para}"` });
  save(); render();
  toast(etapa === 'ganho' ? `${l.nome} — venda ganha!` : `${l.nome} → ${para}`);
}

/* ============================================================
   MODAL — Novo / editar lead
   ============================================================ */
let tempSel = 'morno';
function openNovoLead(etapa) {
  tempSel = 'morno';
  const m = document.getElementById('modal');
  m.innerHTML = `
    <button class="x-btn" aria-label="Fechar" onclick="App.closeAll()">${svgWrap('<path d="M6 6l12 12M18 6L6 18" stroke-linecap="round"/>')}</button>
    <div class="modal-head"><h3>Novo lead</h3><p>Cadastre uma nova oportunidade no funil</p></div>
    <div class="modal-body">
      <div class="field"><label>Nome do cliente <span class="req">*</span></label><input id="f_nome" placeholder="Ex.: Marcos Tavares" autofocus /></div>
      <div class="field row2">
        <div><label>Telefone / WhatsApp <span class="req">*</span></label><input id="f_tel" placeholder="(19) 99999-0000" /></div>
        <div><label>Cidade</label><input id="f_cidade" placeholder="Campinas/SP" /></div>
      </div>
      <div class="field"><label>E-mail</label><input id="f_email" placeholder="cliente@email.com" /></div>
      <div class="field row2">
        <div><label>Modelo de interesse</label><select id="f_modelo">${MODELOS.map(m => `<option value="${m.nome}" data-base="${m.base}">${m.nome} — a partir de ${money(m.base)}</option>`).join('')}</select></div>
        <div><label>Valor estimado</label><input id="f_valor" class="num" placeholder="R$ 0" /></div>
      </div>
      <div class="field row2">
        <div><label>Origem</label><select id="f_origem">${Object.entries(ORIGENS).map(([k, v]) => `<option value="${k}">${v.nome}</option>`).join('')}</select></div>
        <div><label>Vendedor responsável</label><select id="f_vend">${VENDEDORES.map(v => `<option>${v.nome}</option>`).join('')}</select></div>
      </div>
      <div class="field">
        <label>Etapa inicial</label>
        <select id="f_etapa">${ETAPAS.filter(e => e.id !== 'perdido').map(e => `<option value="${e.id}" ${e.id === (etapa || 'novo') ? 'selected' : ''}>${e.nome}</option>`).join('')}</select>
      </div>
      <div class="field">
        <label>Temperatura do lead</label>
        <div class="temp-pick" id="tempPick">
          ${Object.entries(TEMPS).map(([k, v]) => `<button type="button" data-temp="${k}" class="${k === 'morno' ? 'on' : ''}" onclick="App.pickTemp('${k}')"><span class="d" style="background:${v.cor}"></span>${v.nome}</button>`).join('')}
        </div>
      </div>
      <div class="field"><label>Observações</label><textarea id="f_obs" placeholder="Contexto, necessidades, terreno, prazo…"></textarea></div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" onclick="App.closeAll()">Cancelar</button>
      <button class="btn btn-primary" onclick="App.salvarLead()">${svgWrap('<path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"/>')} Salvar lead</button>
    </div>`;
  // sugestão de valor a partir do modelo + foco no primeiro campo
  setTimeout(() => {
    const mod = document.getElementById('f_modelo'), val = document.getElementById('f_valor');
    if (!mod || !val) return; // modal já foi fechado/substituído
    const setV = () => { const b = mod.selectedOptions[0]?.dataset.base; if (b != null) val.value = money(+b); };
    setV(); mod.addEventListener('change', setV);
    document.getElementById('f_nome')?.focus();
  }, 0);
  openOverlay(); m.classList.add('open');
}
function pickTemp(k) {
  tempSel = k;
  document.querySelectorAll('#tempPick button').forEach(b => b.classList.toggle('on', b.dataset.temp === k));
}
function salvarLead() {
  const g = id => document.getElementById(id);
  const nome = g('f_nome').value.trim();
  const tel = g('f_tel').value.trim();
  if (!nome || !tel) { toast('Preencha nome e telefone', true); return; }
  const valor = parseInt((g('f_valor').value || '0').replace(/\D/g, ''), 10) || 0;
  const lead = {
    id: uid(), nome, telefone: tel, email: g('f_email').value.trim(),
    cidade: g('f_cidade').value.trim() || '—', modelo: g('f_modelo').value, valor,
    origem: g('f_origem').value, vendedor: g('f_vend').value, etapa: g('f_etapa').value,
    temperatura: tempSel, criadoEm: new Date().toISOString(), atualizadoEm: new Date().toISOString(),
    observacoes: g('f_obs').value.trim(),
    interacoes: [{ id: uid(), quando: new Date().toISOString(), tipo: 'Lead', texto: 'Lead cadastrado no sistema' }],
  };
  LEADS.unshift(lead); save(); closeAll(); render();
  toast(`Lead "${nome}" adicionado ✓`);
}
function openEditarLead(id) {
  const l = LEADS.find(x => x.id === id); if (!l) return;
  tempSel = l.temperatura || 'morno';
  const m = document.getElementById('modal');
  m.innerHTML = `
    <button class="x-btn" aria-label="Fechar" onclick="App.closeAll()">${svgWrap('<path d="M6 6l12 12M18 6L6 18" stroke-linecap="round"/>')}</button>
    <div class="modal-head"><h3>Editar lead</h3><p>Atualize dados comerciais, responsável e etapa</p></div>
    <div class="modal-body">
      <div class="field"><label>Nome do cliente <span class="req">*</span></label><input id="e_nome" value="${esc(l.nome)}" /></div>
      <div class="field row2">
        <div><label>Telefone / WhatsApp <span class="req">*</span></label><input id="e_tel" value="${esc(l.telefone)}" /></div>
        <div><label>Cidade</label><input id="e_cidade" value="${esc(l.cidade || '')}" /></div>
      </div>
      <div class="field"><label>E-mail</label><input id="e_email" value="${esc(l.email || '')}" /></div>
      <div class="field row2">
        <div><label>Modelo de interesse</label><select id="e_modelo">${MODELOS.map(m => `<option value="${esc(m.nome)}" ${m.nome === l.modelo ? 'selected' : ''}>${esc(m.nome)} — ${money(m.base)}</option>`).join('')}</select></div>
        <div><label>Valor estimado</label><input id="e_valor" class="num" value="${money(l.valor)}" /></div>
      </div>
      <div class="field row2">
        <div><label>Origem</label><select id="e_origem">${Object.entries(ORIGENS).map(([k, v]) => `<option value="${k}" ${k === l.origem ? 'selected' : ''}>${v.nome}</option>`).join('')}</select></div>
        <div><label>Vendedor responsável</label><select id="e_vend">${VENDEDORES.map(v => `<option ${v.nome === l.vendedor ? 'selected' : ''}>${esc(v.nome)}</option>`).join('')}</select></div>
      </div>
      <div class="field">
        <label>Etapa</label>
        <select id="e_etapa">${ETAPAS.map(e => `<option value="${e.id}" ${e.id === l.etapa ? 'selected' : ''}>${e.nome}</option>`).join('')}</select>
      </div>
      <div class="field">
        <label>Temperatura do lead</label>
        <div class="temp-pick" id="tempPick">
          ${Object.entries(TEMPS).map(([k, v]) => `<button type="button" data-temp="${k}" class="${k === tempSel ? 'on' : ''}" onclick="App.pickTemp('${k}')"><span class="d" style="background:${v.cor}"></span>${v.nome}</button>`).join('')}
        </div>
      </div>
      <div class="field"><label>Observações</label><textarea id="e_obs">${esc(l.observacoes || '')}</textarea></div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" onclick="App.closeAll()">Cancelar</button>
      <button class="btn btn-primary" onclick="App.salvarEdicaoLead('${l.id}')">${svgWrap('<path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"/>')} Salvar alterações</button>
    </div>`;
  openOverlay(); m.classList.add('open');
}
function salvarEdicaoLead(id) {
  const l = LEADS.find(x => x.id === id); if (!l) return;
  const g = id => document.getElementById(id);
  const nome = g('e_nome').value.trim();
  const tel = g('e_tel').value.trim();
  if (!nome || !tel) { toast('Preencha nome e telefone', true); return; }
  const antes = l.etapa;
  Object.assign(l, {
    nome, telefone: tel, email: g('e_email').value.trim(), cidade: g('e_cidade').value.trim() || '—',
    modelo: g('e_modelo').value, valor: parseInt((g('e_valor').value || '0').replace(/\D/g, ''), 10) || 0,
    origem: g('e_origem').value, vendedor: g('e_vend').value, etapa: g('e_etapa').value,
    temperatura: tempSel, observacoes: g('e_obs').value.trim(), atualizadoEm: new Date().toISOString(),
  });
  l.interacoes.unshift({ id: uid(), quando: new Date().toISOString(), tipo: 'Edição', texto: antes !== l.etapa ? `Lead editado e movido para ${ETAPA_MAP[l.etapa]?.nome}` : 'Dados do lead atualizados' });
  if (typeof ORC !== 'undefined') {
    ORC.forEach(o => {
      if (o.leadId === l.id) {
        o.cliente = { nome: l.nome, telefone: l.telefone, cidade: l.cidade, email: l.email };
        o.vendedor = l.vendedor;
        o.modelo = l.modelo;
      }
    });
    if (typeof orcSave === 'function') orcSave();
  }
  save(); closeAll(); render(); openDetalhe(id);
  toast('Lead atualizado');
}

/* ============================================================
   DRAWER — Detalhe do lead
   ============================================================ */
let detalheId = null;
function openDetalhe(id) {
  const l = LEADS.find(x => x.id === id); if (!l) return;
  detalheId = id;
  const et = ETAPA_MAP[l.etapa], o = ORIGENS[l.origem] || { nome: l.origem };
  const d = document.getElementById('drawer');
  const proxIdx = ETAPAS.findIndex(e => e.id === l.etapa) + 1;
  const prox = ETAPAS[proxIdx];
  d.innerHTML = `
    <div class="drawer-head">
      <button class="x-btn" aria-label="Fechar" onclick="App.closeAll()">${svgWrap('<path d="M6 6l12 12M18 6L6 18" stroke-linecap="round"/>')}</button>
      <span class="badge" style="background:${et.cor}30;color:#fff"><span class="bd" style="background:${et.cor}"></span>${et.nome}</span>
      <h3 style="margin-top:10px">${esc(l.nome)}</h3>
      <div class="dh-sub">
        <span>${origemIcon(l.origem)} ${esc(o.nome)}</span>
        <span>·</span><span>${esc(l.cidade)}</span>
        <span>·</span><span class="temp ${l.temperatura}" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${TEMPS[l.temperatura].cor}"></span> ${TEMPS[l.temperatura].nome}
      </div>
    </div>
    <div class="drawer-body">
      <div class="stat-row">
        <div class="mini-stat"><div class="ms-l">Valor da oportunidade</div><div class="ms-v num">${money(l.valor)}</div></div>
        <div class="mini-stat"><div class="ms-l">Modelo</div><div class="ms-v" style="font-size:15px">${esc(l.modelo)}</div></div>
      </div>

      <div class="sec-title">Dados de contato</div>
      <div class="info-grid">
        <div class="ig"><div class="l">Telefone</div><div class="v">${esc(l.telefone)}</div></div>
        <div class="ig"><div class="l">E-mail</div><div class="v" style="font-size:12px">${esc(l.email || '—')}</div></div>
        <div class="ig"><div class="l">Vendedor</div><div class="v" style="display:flex;align-items:center;gap:6px"><div class="avatar" style="background:${vendedorCor(l.vendedor)}">${initials(l.vendedor)}</div>${esc(l.vendedor)}</div></div>
        <div class="ig"><div class="l">Cadastrado</div><div class="v">${dataBR(l.criadoEm)}</div></div>
      </div>

      ${l.observacoes ? `<div class="sec-title">Observações</div><div style="background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:12px 14px;font-size:13px;color:var(--t)">${esc(l.observacoes)}</div>` : ''}

      <div class="sec-title">Mover no funil</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${prox && l.etapa !== 'ganho' ? `<button class="btn btn-primary btn-sm" onclick="App.avancar('${l.id}')">Avançar → ${prox.nome}</button>` : ''}
        <select class="filter-sel" style="height:34px" onchange="App.mover('${l.id}', this.value)">
          ${ETAPAS.map(e => `<option value="${e.id}" ${e.id === l.etapa ? 'selected' : ''}>${e.nome}</option>`).join('')}
        </select>
      </div>

      <div class="sec-title">Histórico &amp; interações</div>
      <div class="timeline" id="timeline">
        ${l.interacoes.map(it => `<div class="tl-item">
          <span class="tl-dot"></span>
          <div class="tl-tag">${esc(it.tipo)}</div>
          <div class="tl-text">${esc(it.texto)}</div>
          <div class="tl-when">${dataHoraBR(it.quando)}</div>
        </div>`).join('')}
      </div>
      <div class="add-note">
        <input id="notaInput" placeholder="Registrar interação (ligação, WhatsApp, nota…)" onkeydown="if(event.key==='Enter')App.addNota('${l.id}')" />
        <button class="btn btn-ghost btn-sm" onclick="App.addNota('${l.id}')">Registrar</button>
      </div>
    </div>
    <div class="drawer-foot">
      <button class="btn btn-ghost" onclick="App.openEditarLead('${l.id}')">Editar</button>
      <button class="btn btn-primary" style="flex:1;justify-content:center" onclick="Orc.novoDeLead('${l.id}')">${svgWrap('<path d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-3M8 2h8v4H8zM8 12h8M8 16h5" stroke-linecap="round" stroke-linejoin="round"/>')} Orçamento</button>
      <a class="btn btn-ghost" href="https://wa.me/55${l.telefone.replace(/\D/g,'')}" target="_blank" rel="noopener" title="Abrir WhatsApp">${svgWrap('<path d="M3 21l1.7-4.9A8 8 0 1 1 8 20.3L3 21z" stroke-linejoin="round" stroke-linecap="round"/>')}</a>
      ${leadAtivo(l) ? `<button class="btn btn-ghost btn-sm" style="color:var(--lose)" onclick="App.marcarPerdido('${l.id}')">Perdido</button>` : ''}
      ${l.etapa === 'perdido' ? `<button class="btn btn-primary btn-sm" onclick="App.reativarLead('${l.id}')">Reativar</button>` : ''}
    </div>`;
  openOverlay(); d.classList.add('open');
}
function openCliente(id) {
  const c = clientesData().find(x => x.id === id); if (!c) return;
  const g = garantiaInfo(c.vendaEm);
  const o = c.orcamentos.slice().sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm))[0];
  const origem = c.origem ? ORIGENS[c.origem]?.nome || c.origem : 'Venda direta';
  const lead = c.lead;
  const historico = lead?.interacoes?.length
    ? lead.interacoes.map(it => `<div class="tl-item">
        <span class="tl-dot"></span>
        <div class="tl-tag">${esc(it.tipo)}</div>
        <div class="tl-text">${esc(it.texto)}</div>
        <div class="tl-when">${dataHoraBR(it.quando)}</div>
      </div>`).join('')
    : `<div class="client-empty-note">Sem histórico comercial vinculado.</div>`;
  const d = document.getElementById('drawer');
  d.innerHTML = `
    <div class="drawer-head">
      <button class="x-btn" aria-label="Fechar" onclick="App.closeAll()">${svgWrap('<path d="M6 6l12 12M18 6L6 18" stroke-linecap="round"/>')}</button>
      <span class="badge" style="background:rgba(18,184,134,.22);color:#fff"><span class="bd" style="background:var(--win)"></span>Cliente</span>
      <h3 style="margin-top:10px">${esc(c.nome)}</h3>
      <div class="dh-sub">
        <span>${esc(c.cidade || '—')}</span>
        <span>·</span><span>${esc(c.modelo || 'Modelo não informado')}</span>
        <span>·</span><span>${esc(origem)}</span>
      </div>
    </div>
    <div class="drawer-body">
      <div class="stat-row">
        <div class="mini-stat"><div class="ms-l">Valor vendido</div><div class="ms-v num">${money(c.valor)}</div></div>
        <div class="mini-stat"><div class="ms-l">Data da venda</div><div class="ms-v" style="font-size:15px">${dataBR(c.vendaEm)}</div></div>
      </div>

      <div class="client-warranty">
        <div>
          <div class="cw-label">Garantia do casco</div>
          <div class="cw-title">${g.status}</div>
          <div class="cw-sub">vigente até ${dataBR(g.fim.toISOString())}</div>
        </div>
        <div class="cw-days num">${g.dias > 0 ? Math.ceil(g.dias / 30) : 0}<span>meses</span></div>
      </div>

      <div class="sec-title">Dados do cliente</div>
      <div class="info-grid">
        <div class="ig"><div class="l">Telefone</div><div class="v">${esc(c.telefone || '—')}</div></div>
        <div class="ig"><div class="l">E-mail</div><div class="v" style="font-size:12px">${esc(c.email || '—')}</div></div>
        <div class="ig"><div class="l">Consultor</div><div class="v" style="display:flex;align-items:center;gap:6px"><div class="avatar" style="background:${vendedorCor(c.vendedor)}">${initials(c.vendedor)}</div>${esc(c.vendedor || '—')}</div></div>
        <div class="ig"><div class="l">Origem comercial</div><div class="v">${esc(origem)}</div></div>
      </div>

      <div class="sec-title">Piscina instalada</div>
      <div class="client-install">
        <div class="ci-icon">${svgWrap('<path d="M2 16c1.3 0 1.3 1 2.6 1S6 16 7.3 16s1.3 1 2.7 1 1.3-1 2.6-1 1.4 1 2.7 1 1.3-1 2.6-1M7 12V7a1 1 0 0 1 1-1M13 12V7a1 1 0 0 0-1-1" stroke-linecap="round"/>')}</div>
        <div>
          <div class="ci-title">${esc(c.modelo || 'Modelo não informado')}</div>
          <div class="ci-sub">${o ? `Proposta #${esc(o.numero)} aprovada em ${dataBR(o.criadoEm)}` : 'Venda registrada no funil'}</div>
        </div>
      </div>

      <div class="sec-title">Histórico comercial</div>
      <div class="timeline">${historico}</div>
    </div>
    <div class="drawer-foot">
      <button class="btn btn-ghost" onclick="App.openEditarCliente('${c.id}')">Editar</button>
      ${o ? `<button class="btn btn-primary" style="flex:1;justify-content:center" onclick="Orc.imprimir('${o.id}')">${svgWrap('<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M6 14h12v8H6z" stroke-linejoin="round"/>')} Ver proposta</button>` : ''}
      ${lead ? `<button class="btn btn-ghost" onclick="App.openDetalhe('${lead.id}')">Ver lead</button>` : ''}
      <button class="btn btn-ghost btn-sm" style="color:var(--lose)" onclick="App.cancelarCliente('${c.id}')">Cancelar</button>
      ${c.telefone ? `<a class="btn btn-ghost" href="https://wa.me/55${phoneKey(c.telefone)}" target="_blank" rel="noopener" title="Abrir WhatsApp">${origemIcon('whatsapp')}</a>` : ''}
    </div>`;
  openOverlay(); d.classList.add('open');
}
function openEditarCliente(id) {
  const c = clientesData().find(x => x.id === id); if (!c) return;
  const m = document.getElementById('modal');
  m.innerHTML = `
    <button class="x-btn" aria-label="Fechar" onclick="App.closeAll()">${svgWrap('<path d="M6 6l12 12M18 6L6 18" stroke-linecap="round"/>')}</button>
    <div class="modal-head"><h3>Editar cliente</h3><p>Atualize cadastro, piscina e consultor vinculado</p></div>
    <div class="modal-body">
      <div class="field"><label>Nome <span class="req">*</span></label><input id="ec_nome" value="${esc(c.nome)}"></div>
      <div class="field row2">
        <div><label>Telefone</label><input id="ec_tel" value="${esc(c.telefone || '')}"></div>
        <div><label>Cidade</label><input id="ec_cidade" value="${esc(c.cidade || '')}"></div>
      </div>
      <div class="field"><label>E-mail</label><input id="ec_email" value="${esc(c.email || '')}"></div>
      <div class="field row2">
        <div><label>Piscina</label><select id="ec_modelo">${MODELOS.map(m => `<option value="${esc(m.nome)}" ${m.nome === c.modelo ? 'selected' : ''}>${esc(m.nome)}</option>`).join('')}</select></div>
        <div><label>Consultor</label><select id="ec_vend">${VENDEDORES.map(v => `<option ${v.nome === c.vendedor ? 'selected' : ''}>${esc(v.nome)}</option>`).join('')}</select></div>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" onclick="App.closeAll()">Cancelar</button>
      <button class="btn btn-primary" onclick="App.salvarEdicaoCliente('${c.id}')">${svgWrap('<path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"/>')} Salvar cliente</button>
    </div>`;
  openOverlay(); m.classList.add('open');
}
function salvarEdicaoCliente(id) {
  const c = clientesData().find(x => x.id === id); if (!c) return;
  const nome = cfgVal('ec_nome');
  if (!nome) { toast('Informe o nome do cliente', true); return; }
  const dados = {
    nome, telefone: cfgVal('ec_tel'), cidade: cfgVal('ec_cidade') || '—',
    email: cfgVal('ec_email'), modelo: cfgVal('ec_modelo'), vendedor: cfgVal('ec_vend'),
  };
  if (c.lead) {
    Object.assign(c.lead, dados, { atualizadoEm: new Date().toISOString() });
    c.lead.interacoes.unshift({ id: uid(), quando: new Date().toISOString(), tipo: 'Cliente', texto: 'Cadastro do cliente atualizado' });
    save();
  }
  if (typeof ORC !== 'undefined') {
    c.orcamentos.forEach(o => {
      o.cliente = { nome: dados.nome, telefone: dados.telefone, cidade: dados.cidade, email: dados.email };
      o.modelo = dados.modelo;
      o.vendedor = dados.vendedor;
      o.valorBase = modeloBase(dados.modelo);
    });
    if (typeof orcSave === 'function') orcSave();
  }
  closeAll(); render(); openCliente(id);
  toast('Cliente atualizado');
}
function cancelarCliente(id) {
  const c = clientesData().find(x => x.id === id); if (!c) return;
  if (c.lead) {
    c.lead.etapa = 'perdido';
    c.lead.atualizadoEm = new Date().toISOString();
    c.lead.interacoes.unshift({ id: uid(), quando: new Date().toISOString(), tipo: 'Cancelamento', texto: 'Venda cancelada no cadastro do cliente' });
    save();
  }
  if (typeof ORC !== 'undefined') {
    c.orcamentos.forEach(o => { if (o.status === 'aprovado') o.status = 'recusado'; });
    if (typeof orcSave === 'function') orcSave();
  }
  patchObra(id, { cancelada: true });
  patchFin(id, { cancelado: true });
  closeAll(); render();
  toast('Venda cancelada e removida do pós-venda');
}
function patchObra(id, patch) {
  OBRAS[id] = { ...(OBRAS[id] || {}), ...patch };
  saveObras();
}
function setObraEtapa(id, etapa) {
  patchObra(id, { etapa });
  render(); openObra(id);
  toast(`Obra atualizada para ${OBRA_MAP[etapa]?.nome || etapa}`);
}
function setObraResp(id, responsavel) {
  patchObra(id, { responsavel });
  render(); openObra(id);
}
function setObraData(id, campo, valor) {
  patchObra(id, { [campo]: fromDateInput(valor) });
  render(); openObra(id);
}
function addObraNota(id) {
  const inp = document.getElementById('obraNotaInput');
  const txt = inp?.value.trim();
  if (!txt) return;
  const atual = OBRAS[id] || {};
  patchObra(id, { notas: [{ id: uid(), quando: new Date().toISOString(), texto: txt }, ...(atual.notas || [])] });
  render(); openObra(id);
}
function openObra(id) {
  const o = obrasData().find(x => x.id === id); if (!o) return;
  const et = OBRA_MAP[o.etapa];
  const atrasada = new Date(o.previsao) < new Date() && o.etapa !== 'entrega';
  const cron = o.cronograma.map(c => `<div class="schedule-row ${c.status}">
    <span class="col-dot" style="background:${c.cor}"></span>
    <div><b>${c.nome}</b><small>${dataBR(c.inicio)} até ${dataBR(c.fim)}</small></div>
    <em>${c.status === 'concluido' ? 'Concluído' : c.status === 'andamento' ? 'Em andamento' : 'Pendente'}</em>
  </div>`).join('');
  const notas = o.notas.length
    ? o.notas.map(n => `<div class="tl-item"><span class="tl-dot"></span><div class="tl-tag">Obra</div><div class="tl-text">${esc(n.texto)}</div><div class="tl-when">${dataHoraBR(n.quando)}</div></div>`).join('')
    : `<div class="client-empty-note">Sem notas de obra.</div>`;
  const d = document.getElementById('drawer');
  d.innerHTML = `
    <div class="drawer-head">
      <button class="x-btn" aria-label="Fechar" onclick="App.closeAll()">${svgWrap('<path d="M6 6l12 12M18 6L6 18" stroke-linecap="round"/>')}</button>
      <span class="badge" style="background:${et.cor}30;color:#fff"><span class="bd" style="background:${et.cor}"></span>${et.nome}</span>
      <h3 style="margin-top:10px">${esc(o.cliente.nome)}</h3>
      <div class="dh-sub"><span>${esc(o.cliente.modelo)}</span><span>·</span><span>${esc(o.cliente.cidade || '—')}</span>${atrasada ? '<span>·</span><span style="color:#ffd3c8">Atrasada</span>' : ''}</div>
    </div>
    <div class="drawer-body">
      <div class="stat-row">
        <div class="mini-stat"><div class="ms-l">Responsável</div><div class="ms-v" style="font-size:15px">${esc(o.responsavel)}</div></div>
        <div class="mini-stat"><div class="ms-l">Previsão de entrega</div><div class="ms-v" style="font-size:15px">${dataBR(o.previsao)}</div></div>
      </div>

      <div class="sec-title">Controle da obra</div>
      <div class="ops-grid">
        <div class="field" style="margin:0"><label>Etapa atual</label><select onchange="App.setObraEtapa('${o.id}', this.value)">${OBRA_ETAPAS.map(e => `<option value="${e.id}" ${o.etapa === e.id ? 'selected' : ''}>${e.nome}</option>`).join('')}</select></div>
        <div class="field" style="margin:0"><label>Responsável</label><select onchange="App.setObraResp('${o.id}', this.value)">${EQUIPES.map(eq => `<option ${o.responsavel === eq ? 'selected' : ''}>${eq}</option>`).join('')}</select></div>
        <div class="field" style="margin:0"><label>Início</label><input type="date" value="${dateInput(o.inicio)}" onchange="App.setObraData('${o.id}', 'inicio', this.value)"></div>
        <div class="field" style="margin:0"><label>Entrega prevista</label><input type="date" value="${dateInput(o.previsao)}" onchange="App.setObraData('${o.id}', 'previsao', this.value)"></div>
      </div>

      <div class="sec-title">Cronograma por etapa</div>
      <div class="schedule">${cron}</div>

      <div class="sec-title">Notas de execução</div>
      <div class="timeline">${notas}</div>
      <div class="add-note">
        <input id="obraNotaInput" placeholder="Registrar nota da obra, pendência ou vistoria…" onkeydown="if(event.key==='Enter')App.addObraNota('${o.id}')" />
        <button class="btn btn-ghost btn-sm" onclick="App.addObraNota('${o.id}')">Registrar</button>
      </div>
    </div>
    <div class="drawer-foot">
      <button class="btn btn-primary" style="flex:1;justify-content:center" onclick="App.openCliente('${o.id}')">Ver cliente</button>
      <a class="btn btn-ghost" href="https://wa.me/55${phoneKey(o.cliente.telefone)}" target="_blank" rel="noopener" title="Abrir WhatsApp">${origemIcon('whatsapp')}</a>
    </div>`;
  openOverlay(); d.classList.add('open');
}

function patchFin(id, patch) {
  FIN[id] = { ...(FIN[id] || {}), ...patch };
  saveFin();
}
function setFinEntrada(id, checked) {
  patchFin(id, { entradaPaga: checked });
  render();
}
function setFinParcelas(id, val) {
  const f = financeiroData().find(x => x.id === id);
  const n = Math.max(0, Math.min(f?.parcelas || 0, parseInt(val, 10) || 0));
  patchFin(id, { parcelasPagas: n });
  render();
}
function setFinComissao(id, checked) {
  patchFin(id, { comissaoPaga: checked });
  render(); openFinanceiro(id);
}
function setFinComissaoPct(id, val) {
  patchFin(id, { comissaoPct: Math.max(0, Math.min(20, parseFloat(val) || 0)) });
  render(); openFinanceiro(id);
}
function openFinanceiro(id) {
  const f = financeiroData().find(x => x.id === id); if (!f) return;
  const c = f.cliente;
  const d = document.getElementById('drawer');
  const parcelas = Array.from({ length: f.parcelas }, (_, i) => {
    const n = i + 1;
    const venc = addDaysISO(c.vendaEm, 30 * n);
    const pago = n <= f.parcelasPagas;
    const atrasado = !pago && new Date(venc) < new Date();
    return `<div class="pay-row ${pago ? 'pago' : atrasado ? 'atrasado' : ''}">
      <span>${String(n).padStart(2, '0')}</span>
      <div><b>${money(f.parcela)}</b><small>venc. ${dataBR(venc)}</small></div>
      <em>${pago ? 'Pago' : atrasado ? 'Atrasado' : 'Pendente'}</em>
    </div>`;
  }).join('');
  d.innerHTML = `
    <div class="drawer-head">
      <button class="x-btn" aria-label="Fechar" onclick="App.closeAll()">${svgWrap('<path d="M6 6l12 12M18 6L6 18" stroke-linecap="round"/>')}</button>
      <span class="st ${statusFinClass(f.status)}"><span class="bd"></span>${statusFinLabel(f.status)}</span>
      <h3 style="margin-top:10px">${esc(c.nome)}</h3>
      <div class="dh-sub"><span>${esc(c.modelo)}</span><span>·</span><span>${f.o ? `Proposta #${esc(f.o.numero)}` : 'Contrato do funil'}</span></div>
    </div>
    <div class="drawer-body">
      <div class="stat-row">
        <div class="mini-stat"><div class="ms-l">Total contratado</div><div class="ms-v num">${money(f.total)}</div></div>
        <div class="mini-stat"><div class="ms-l">Saldo restante</div><div class="ms-v num">${money(f.saldo)}</div></div>
      </div>

      <div class="sec-title">Recebimento</div>
      <div class="finance-control">
        <label class="check-line"><input type="checkbox" ${f.entradaPaga ? 'checked' : ''} onchange="App.setFinEntrada('${f.id}', this.checked); App.openFinanceiro('${f.id}')"> Entrada paga · ${money(f.entrada)}</label>
        <div class="parcel-control wide">
          <input type="number" min="0" max="${f.parcelas}" value="${f.parcelasPagas}" onchange="App.setFinParcelas('${f.id}', this.value); App.openFinanceiro('${f.id}')">
          <span>parcelas pagas de ${f.parcelas}</span>
        </div>
      </div>

      <div class="sec-title">Parcelas</div>
      <div class="pay-list">${parcelas}</div>

      <div class="sec-title">Comissão do vendedor</div>
      <div class="commission-box">
        <div class="field" style="margin:0"><label>Percentual</label><input type="number" min="0" max="20" step=".5" value="${f.comissaoPct}" onchange="App.setFinComissaoPct('${f.id}', this.value)"></div>
        <div><div class="cb-val num">${money(f.comissao)}</div><label class="check-line"><input type="checkbox" ${f.comissaoPaga ? 'checked' : ''} onchange="App.setFinComissao('${f.id}', this.checked)"> comissão paga</label></div>
      </div>
    </div>
    <div class="drawer-foot">
      <button class="btn btn-primary" style="flex:1;justify-content:center" onclick="App.openCliente('${f.id}')">Ver cliente</button>
      ${f.o ? `<button class="btn btn-ghost" onclick="Orc.imprimir('${f.o.id}')">Proposta</button>` : ''}
    </div>`;
  openOverlay(); d.classList.add('open');
}
function avancar(id) {
  const l = LEADS.find(x => x.id === id); if (!l) return;
  const i = ETAPAS.findIndex(e => e.id === l.etapa);
  if (i < ETAPAS.length - 1) { moverLead(id, ETAPAS[i + 1].id); openDetalhe(id); }
}
function mover(id, etapa) { moverLead(id, etapa); openDetalhe(id); }
function addNota(id) {
  const l = LEADS.find(x => x.id === id); if (!l) return;
  const inp = document.getElementById('notaInput');
  const txt = inp.value.trim(); if (!txt) return;
  l.interacoes.unshift({ id: uid(), quando: new Date().toISOString(), tipo: 'Nota', texto: txt });
  l.atualizadoEm = new Date().toISOString();
  save(); openDetalhe(id); render();
}
function marcarPerdido(id) {
  const l = LEADS.find(x => x.id === id); if (!l) return;
  l.etapa = 'perdido'; l.atualizadoEm = new Date().toISOString();
  l.interacoes.unshift({ id: uid(), quando: new Date().toISOString(), tipo: 'Perdido', texto: 'Lead marcado como perdido' });
  // remove do array visível mas mantém armazenado
  save(); closeAll(); render();
  toast(`${l.nome} marcado como perdido`);
}
function reativarLead(id) {
  const l = LEADS.find(x => x.id === id); if (!l) return;
  l.etapa = 'novo';
  l.atualizadoEm = new Date().toISOString();
  l.interacoes.unshift({ id: uid(), quando: new Date().toISOString(), tipo: 'Reativado', texto: 'Lead reativado no funil' });
  save(); closeAll(); render(); openDetalhe(id);
  toast(`${l.nome} reativado`);
}

/* ============================================================
   Overlay / toast / navegação
   ============================================================ */
function openOverlay() {
  document.getElementById('overlay').classList.add('open');
  // move o foco pra dentro do diálogo (campo do modal, ou botão fechar do drawer)
  setTimeout(() => {
    const modal = document.querySelector('.modal.open');
    const drawer = document.querySelector('.drawer.open');
    const dlg = modal || drawer;
    if (!dlg || dlg.contains(document.activeElement)) return;
    const target = modal
      ? (modal.querySelector('input:not([type=hidden]),select,textarea') || modal.querySelector('.x-btn') || modal)
      : (drawer.querySelector('.x-btn') || drawer);
    try { target.focus(); } catch (e) {}
  }, 40);
}
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([type=hidden]):not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
function trapFocus(e) {
  const dlg = document.querySelector('.modal.open, .drawer.open');
  if (!dlg) return;
  const items = [...dlg.querySelectorAll(FOCUSABLE)].filter(el => el.offsetParent !== null || el === document.activeElement);
  if (!items.length) return;
  const first = items[0], last = items[items.length - 1];
  if (!dlg.contains(document.activeElement)) { e.preventDefault(); first.focus(); return; }
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}
function closeAll() {
  document.getElementById('overlay').classList.remove('open');
  document.getElementById('modal').classList.remove('open');
  document.getElementById('drawer').classList.remove('open');
  detalheId = null;
}
function toast(msg, erro) {
  const w = document.getElementById('toastWrap');
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = `${svgWrap(erro ? '<circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01" stroke-linecap="round"/>' : '<path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"/>')}${esc(msg)}`;
  if (erro) t.querySelector('svg').style.color = '#e8734a';
  w.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(10px)'; setTimeout(() => t.remove(), 300); }, 2600);
}
function go(view) { setView(view); }
function setFiltro(k, v) { FILTROS[k] = v; render(); }

/* ============================================================
   Bootstrap
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  // Se o navegador não deixa gravar (aba anônima/storage bloqueado),
  // avisa uma vez logo na entrada — o app funciona, mas nada é salvo.
  if (!storageWritable()) {
    STORAGE_OK = false; STORAGE_WARNED = true;
    setTimeout(() => toast('Este navegador não está salvando dados (aba anônima?). Suas alterações serão perdidas ao fechar — exporte um backup.', true), 400);
  }
  loadConfig();
  load();
  loadOps();
  if (window.orcInit) window.orcInit();
  render();

  // Sobe a camada Supabase: mostra o portão de login, hidrata com os dados
  // reais do banco e liga o write-through. Até lá, o app roda pelo cache local.
  if (window.Supa && typeof window.Supa.boot === 'function') window.Supa.boot();

  document.getElementById('nav').addEventListener('click', e => {
    const item = e.target.closest('.nav-item'); if (!item) return;
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    item.classList.add('active');
    const v = item.dataset.view;
    VIEW = v === 'soon' ? item.dataset.title : v;
    if (v === 'orcamentos' && typeof orcView !== 'undefined') orcView = 'list';
    render();
  });

  // Busca com debounce; só re-renderiza telas onde a busca faz sentido.
  // Em Configurações/Relatórios/Orçamentos, buscar leva à Base de Leads
  // (evita descartar edições não salvas dos campos de Configurações).
  const SEARCH_VIEWS = ['funil', 'lista', 'clientes', 'obras', 'financeiro'];
  let buscaTimer = null;
  document.getElementById('searchInput').addEventListener('input', e => {
    const val = e.target.value;
    clearTimeout(buscaTimer);
    buscaTimer = setTimeout(() => {
      FILTROS.busca = val;
      if (SEARCH_VIEWS.includes(VIEW)) render();
      else setView('lista');
    }, 200);
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeAll(); return; }
    if (e.key === 'Tab') trapFocus(e);
  });
});

/* API pública */
window.App = {
  // Leads
  openNovoLead, salvarLead, pickTemp, openDetalhe, openEditarLead, salvarEdicaoLead,
  avancar, mover, addNota, marcarPerdido, reativarLead,
  // Clientes
  openCliente, openEditarCliente, salvarEdicaoCliente, cancelarCliente,
  // Obras
  openObra, setObraEtapa, setObraResp, setObraData, addObraNota,
  // Financeiro
  openFinanceiro, setFinEntrada, setFinParcelas, setFinComissao, setFinComissaoPct,
  // Configurações
  saveModelo, addModelo, delModelo, saveAdicional, addAdicional, delAdicional,
  saveVendedor, addVendedor, delVendedor, saveEquipe, addEquipe, delEquipe,
  // Backup
  exportarBackup, importarBackup,
  // Geral
  closeAll, toast, go, setFiltro, keyActivate, verOrcamento,
  // Supabase
  logout: () => { if (window.Supa && window.Supa.logout) window.Supa.logout(); },
};
