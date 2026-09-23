/* ==========================================================================
   PiscinaPro — seed.js
   Dados de demonstração. Entram no banco quando ele está vazio ou por
   "Restaurar dados de exemplo" — que apaga o que existe e recoloca estes.
   As datas são relativas a hoje, então a demo nunca fica velha.
   ========================================================================== */
(function () {
'use strict';
const PP = window.PP;

const d  = n => PP.addDias(PP.hoje(), -n);            // n dias atrás
const df = n => PP.addDias(PP.hoje(), n);             // n dias à frente
/* timestamp de n dias atrás ancorado no MEIO-DIA LOCAL: assim o .slice(0,10)
   feito pelas telas cai na data local certa, e não no dia seguinte em UTC. */
const ts = n => new Date(new Date().setHours(12, 0, 0, 0) - n * 864e5).toISOString();

PP.seed = {

config: () => Object.assign({}, PP.CONFIG_PADRAO, {
  empresa: 'PiscinaPro Piscinas de Fibra',
  cnpj: '18.442.907/0001-64',
  fone: '(43) 3322-8100',
  email: 'comercial@piscinapro.com.br',
  site: 'www.piscinapro.com.br',
  endereco: 'Rod. Celso Garcia Cid, km 382 — Londrina/PR',
  proximoNumOrc: 1007,
  proximoNumPedido: 5005,
  proximoNumCompra: 9003
}),

equipes: () => ([
  { id:'eq1', nome:'Matriz — Londrina', responsavel:'Ana Paula Ribeiro' },
  { id:'eq2', nome:'Filial — Maringá',  responsavel:'Rafael Lima' }
]),

/* Acessos ao sistema. Não há senha aqui: a senha é da conta de cada pessoa
   no Supabase Auth, e o `login` (e-mail) é o que liga uma coisa à outra. */
usuarios: () => ([
  { id:'u0', nome:'Administrador',      login:'admin@piscinapro.app',          papel:'admin',    vendedorId:'',   ativo:true },
  { id:'u1', nome:'Ana Paula Ribeiro',  login:'ana@piscinapro.com.br',    papel:'gerente',  vendedorId:'v1', ativo:true },
  { id:'u2', nome:'Carlos Mendes',      login:'carlos@piscinapro.com.br',  papel:'vendedor', vendedorId:'v2', ativo:true },
  { id:'u3', nome:'Juliana Torres',     login:'juliana@piscinapro.com.br', papel:'vendedor', vendedorId:'v3', ativo:true },
  { id:'u4', nome:'Rafael Lima',        login:'rafael@piscinapro.com.br',    papel:'gerente',  vendedorId:'v4', ativo:true },
  { id:'u5', nome:'Diego Barreto',      login:'diego@piscinapro.com.br',  papel:'vendedor', vendedorId:'v5', ativo:true },
  { id:'u6', nome:'Jailson (obra)',     login:'jailson@piscinapro.com.br',        papel:'obra',     vendedorId:'',   ativo:true }
]),

equipesObra: () => ([
  { id:'eo1', nome:'Equipe A', cor:'#0E7C86', membros:'Jailson, Wesley e Tiago',  fone:'(43) 99815-7720', ativo:true },
  { id:'eo2', nome:'Equipe B', cor:'#B9812F', membros:'Ronaldo, Márcio e Edson',  fone:'(43) 99644-1180', ativo:true },
  { id:'eo3', nome:'Equipe C', cor:'#2A5D9E', membros:'Wilson e Anderson',        fone:'(44) 99720-3345', ativo:true }
]),

vendedores: () => ([
  { id:'v1', nome:'Ana Paula Ribeiro', email:'ana@piscinapro.com.br', fone:'(43) 99812-4477', equipeId:'eq1', meta:55000, comissaoPct:3.5, admissao:d(920), ativo:true, cargo:'Gerente comercial' },
  { id:'v2', nome:'Carlos Mendes',     email:'carlos@piscinapro.com.br', fone:'(43) 99640-2213', equipeId:'eq1', meta:45000, comissaoPct:3,   admissao:d(540), ativo:true, cargo:'Consultor de vendas' },
  { id:'v3', nome:'Juliana Torres',    email:'juliana@piscinapro.com.br', fone:'(44) 99715-8890', equipeId:'eq2', meta:40000, comissaoPct:3,   admissao:d(310), ativo:true, cargo:'Consultora de vendas' },
  { id:'v4', nome:'Rafael Lima',       email:'rafael@piscinapro.com.br', fone:'(44) 99223-7741', equipeId:'eq2', meta:50000, comissaoPct:3.2, admissao:d(1240), ativo:true, cargo:'Supervisor filial' },
  { id:'v5', nome:'Diego Barreto',     email:'diego@piscinapro.com.br', fone:'(43) 99450-1120', equipeId:'eq1', meta:30000, comissaoPct:2.5, admissao:d(95),  ativo:true, cargo:'Consultor júnior' }
]),

fornecedores: () => ([
  { id:'fo1', nome:'Fibratec Indústria de Piscinas', doc:'11.304.556/0001-20', fone:'(16) 3512-7700', email:'vendas@fibratec.ind.br', cidade:'Araraquara/SP', contato:'Marcelo Duarte', prazoEntregaDias:18, obs:'Fabricante dos cascos. Frete por conta do comprador.' },
  { id:'fo2', nome:'HidroSul Equipamentos',          doc:'07.881.220/0001-45', fone:'(41) 3045-9922', email:'comercial@hidrosul.com.br', cidade:'Curitiba/PR', contato:'Simone Alves', prazoEntregaDias:7, obs:'Bombas, filtros e automação.' },
  { id:'fo3', nome:'Deck & Cia Madeiras',            doc:'22.140.778/0001-03', fone:'(43) 3348-1190', email:'atendimento@deckecia.com.br', cidade:'Londrina/PR', contato:'Paulo Yamada', prazoEntregaDias:10, obs:'Deck em cumaru e réguas de WPC.' },
  { id:'fo4', nome:'SolarMax Aquecimento',           doc:'31.556.004/0001-91', fone:'(11) 4002-3311', email:'pedidos@solarmax.com.br', cidade:'Campinas/SP', contato:'Renata Póvoa', prazoEntregaDias:12, obs:'Coletores solares e trocadores de calor.' },
  { id:'fo5', nome:'Terraplanagem Zanatta',          doc:'09.772.115/0001-77', fone:'(43) 99678-4410', email:'zanatta.maquinas@gmail.com', cidade:'Cambé/PR', contato:'Ivo Zanatta', prazoEntregaDias:3, obs:'Escavadeira e caminhão caçamba (terceirizado).' }
]),

produtos: () => ([
  /* ---------- cascos (piscinas de fibra) ---------- */
  { id:'pr1', sku:'PIS-IBI-400', nome:'Piscina Ibiza',      categoria:'Piscina', unidade:'un', custo:9800,  preco:18900, controlaEstoque:true, estoque:3, estoqueMin:2, fornecedorId:'fo1', ativo:true,
    specs:{ compr:4.00, larg:2.20, prof:1.30, volume:9.5,  area:8.8 },  descricao:'Compacta, ideal para quintais pequenos. Casco monobloco com borda reta.' },
  { id:'pr2', sku:'PIS-MAR-500', nome:'Piscina Maresias',   categoria:'Piscina', unidade:'un', custo:13200, preco:24500, controlaEstoque:true, estoque:4, estoqueMin:2, fornecedorId:'fo1', ativo:true,
    specs:{ compr:5.00, larg:2.50, prof:1.40, volume:15.2, area:12.5 }, descricao:'Best-seller. Prainha embutida e banco lateral.' },
  { id:'pr3', sku:'PIS-TOS-600', nome:'Piscina Toscana',    categoria:'Piscina', unidade:'un', custo:17600, preco:32800, controlaEstoque:true, estoque:2, estoqueMin:2, fornecedorId:'fo1', ativo:true,
    specs:{ compr:6.00, larg:3.00, prof:1.45, volume:22.8, area:18.0 }, descricao:'Formato retangular com escada romana e prainha.' },
  { id:'pr4', sku:'PIS-CAP-700', nome:'Piscina Capri',      categoria:'Piscina', unidade:'un', custo:22400, preco:41900, controlaEstoque:true, estoque:1, estoqueMin:1, fornecedorId:'fo1', ativo:true,
    specs:{ compr:7.00, larg:3.50, prof:1.50, volume:32.1, area:24.5 }, descricao:'Área de lazer ampla, prainha com 2 m e banco hidro.' },
  { id:'pr5', sku:'PIS-SAN-800', nome:'Piscina Santorini',  categoria:'Piscina', unidade:'un', custo:29800, preco:54700, controlaEstoque:false, estoque:0, estoqueMin:0, fornecedorId:'fo1', ativo:true,
    specs:{ compr:8.00, larg:4.00, prof:1.55, volume:44.6, area:32.0 }, descricao:'Linha premium. Produção sob encomenda (18 dias).' },
  { id:'pr6', sku:'PIS-KID-320', nome:'Piscina Prainha Kids', categoria:'Piscina', unidade:'un', custo:6900, preco:13400, controlaEstoque:true, estoque:2, estoqueMin:1, fornecedorId:'fo1', ativo:true,
    specs:{ compr:3.20, larg:1.90, prof:0.90, volume:4.8,  area:6.1 },  descricao:'Infantil, profundidade reduzida e piso antiderrapante.' },

  /* ---------- adicionais / opcionais ---------- */
  { id:'ad1', sku:'ADC-HID-006', nome:'Hidromassagem 6 jatos',      categoria:'Adicional', unidade:'un', custo:1850, preco:3690, controlaEstoque:true, estoque:5, estoqueMin:2, fornecedorId:'fo2', ativo:true, descricao:'Kit com 6 jatos direcionáveis, blower e comando pneumático.' },
  { id:'ad2', sku:'ADC-LED-RGB', nome:'Iluminação LED RGB (par)',   categoria:'Adicional', unidade:'un', custo:620,  preco:1290, controlaEstoque:true, estoque:9, estoqueMin:4, fornecedorId:'fo2', ativo:true, descricao:'2 refletores LED RGB 18 W com controle remoto.' },
  { id:'ad3', sku:'ADC-CAS-INX', nome:'Cascata em inox 60 cm',      categoria:'Adicional', unidade:'un', custo:780,  preco:1690, controlaEstoque:true, estoque:4, estoqueMin:2, fornecedorId:'fo2', ativo:true, descricao:'Cascata tipo lâmina, aço inox 304.' },
  { id:'ad4', sku:'ADC-AQU-SOL', nome:'Aquecimento solar (kit)',    categoria:'Adicional', unidade:'un', custo:3400, preco:6900, controlaEstoque:false, estoque:0, estoqueMin:0, fornecedorId:'fo4', ativo:true, descricao:'Coletores solares dimensionados por m² de espelho d’água.' },
  { id:'ad5', sku:'ADC-DEC-M2',  nome:'Deck em madeira (m²)',       categoria:'Adicional', unidade:'m²', custo:210,  preco:430,  controlaEstoque:false, estoque:0, estoqueMin:0, fornecedorId:'fo3', ativo:true, descricao:'Cumaru tratado, estrutura metálica e acabamento naval.' },
  { id:'ad6', sku:'ADC-CAP-TER', nome:'Capa térmica sob medida',    categoria:'Adicional', unidade:'un', custo:540,  preco:1180, controlaEstoque:true, estoque:6, estoqueMin:3, fornecedorId:'fo4', ativo:true, descricao:'Manta bolha 300 micras com enroladeira.' },
  { id:'ad7', sku:'ADC-BOR-INF', nome:'Borda infinita (execução)',  categoria:'Adicional', unidade:'un', custo:5200, preco:11800, controlaEstoque:false, estoque:0, estoqueMin:0, fornecedorId:'fo1', ativo:true, descricao:'Reservatório de equilíbrio, bomba dedicada e acabamento.' },
  { id:'ad8', sku:'ADC-ESC-ROM', nome:'Escada romana (adicional)',  categoria:'Adicional', unidade:'un', custo:900,  preco:2100, controlaEstoque:false, estoque:0, estoqueMin:0, fornecedorId:'fo1', ativo:true, descricao:'Degraus largos integrados ao casco.' },

  /* ---------- equipamentos ---------- */
  { id:'eq_1', sku:'EQP-BOM-050', nome:'Bomba 1/2 cv autoescorvante', categoria:'Equipamento', unidade:'un', custo:480, preco:980,  controlaEstoque:true, estoque:7,  estoqueMin:3, fornecedorId:'fo2', ativo:true },
  { id:'eq_2', sku:'EQP-BOM-100', nome:'Bomba 1 cv autoescorvante',   categoria:'Equipamento', unidade:'un', custo:760, preco:1490, controlaEstoque:true, estoque:5,  estoqueMin:2, fornecedorId:'fo2', ativo:true },
  { id:'eq_3', sku:'EQP-FIL-040', nome:'Filtro FM-40 + válvula',      categoria:'Equipamento', unidade:'un', custo:690, preco:1380, controlaEstoque:true, estoque:6,  estoqueMin:3, fornecedorId:'fo2', ativo:true },
  { id:'eq_4', sku:'EQP-FIL-050', nome:'Filtro FM-50 + válvula',      categoria:'Equipamento', unidade:'un', custo:880, preco:1720, controlaEstoque:true, estoque:2,  estoqueMin:3, fornecedorId:'fo2', ativo:true },
  { id:'eq_5', sku:'EQP-QUA-CMD', nome:'Quadro de comando + timer',   categoria:'Equipamento', unidade:'un', custo:340, preco:720,  controlaEstoque:true, estoque:4,  estoqueMin:2, fornecedorId:'fo2', ativo:true },

  /* ---------- insumos ---------- */
  { id:'in1', sku:'INS-ARE-FIL', nome:'Areia filtrante (saco 25 kg)', categoria:'Insumo', unidade:'sc', custo:38,  preco:79,  controlaEstoque:true, estoque:24, estoqueMin:12, fornecedorId:'fo2', ativo:true },
  { id:'in2', sku:'INS-CLO-10K', nome:'Cloro granulado 10 kg',        categoria:'Insumo', unidade:'bd', custo:145, preco:289, controlaEstoque:true, estoque:9,  estoqueMin:10, fornecedorId:'fo2', ativo:true },
  { id:'in3', sku:'INS-PVC-KIT', nome:'Kit hidráulico PVC 50 mm',     categoria:'Insumo', unidade:'kit',custo:260, preco:520, controlaEstoque:true, estoque:11, estoqueMin:5,  fornecedorId:'fo2', ativo:true },
  { id:'in4', sku:'INS-ALV-CAS', nome:'Alvenaria casa de máquinas',   categoria:'Insumo', unidade:'un', custo:420, preco:890, controlaEstoque:false, estoque:0, estoqueMin:0,  fornecedorId:'fo3', ativo:true },

  /* ---------- serviços ---------- */
  { id:'sv1', sku:'SRV-INS-PAD', nome:'Instalação padrão (mão de obra)', categoria:'Serviço', unidade:'un', custo:2800, preco:5900, controlaEstoque:false, estoque:0, estoqueMin:0, fornecedorId:'', ativo:true, descricao:'Equipe de 3 pessoas, até 3 dias de obra.' },
  { id:'sv2', sku:'SRV-ESC-MAQ', nome:'Escavação com máquina',           categoria:'Serviço', unidade:'un', custo:1900, preco:3800, controlaEstoque:false, estoque:0, estoqueMin:0, fornecedorId:'fo5', ativo:true, descricao:'Escavadeira + caçamba para retirada de terra.' },
  { id:'sv3', sku:'SRV-MAN-MEN', nome:'Manutenção mensal',               categoria:'Serviço', unidade:'mês',custo:180, preco:420,  controlaEstoque:false, estoque:0, estoqueMin:0, fornecedorId:'', ativo:true, descricao:'Limpeza quinzenal e balanceamento químico.' }
]),

clientes: () => ([
  { id:'cl1', nome:'Marcos Antônio Ferreira', doc:'042.118.339-70', tipo:'PF', telefone:'(43) 99911-2045', email:'marcos.ferreira@gmail.com',
    cep:'86050-110', endereco:'Rua Gregório de Matos, 340', bairro:'Gleba Palhano', cidade:'Londrina', uf:'PR', leadId:'ld1', criadoEm:ts(72), obs:'Portão lateral de 2,8 m — máquina entra.' },
  { id:'cl2', nome:'Condomínio Villa Toscana', doc:'27.115.884/0001-36', tipo:'PJ', telefone:'(43) 3025-7788', email:'sindico@villatoscana.com.br',
    cep:'86047-500', endereco:'Av. Saul Elkind, 2200', bairro:'Jardim Alvorada', cidade:'Londrina', uf:'PR', leadId:'ld2', criadoEm:ts(58), obs:'Nota fiscal em nome do condomínio. Obra só em dia útil.' },
  { id:'cl3', nome:'Patrícia Nogueira Sampaio', doc:'318.904.221-05', tipo:'PF', telefone:'(44) 99860-3312', email:'pattynogueira@outlook.com',
    cep:'87020-040', endereco:'Rua Néo Alves Martins, 1180', bairro:'Zona 01', cidade:'Maringá', uf:'PR', leadId:'ld3', criadoEm:ts(41), obs:'' },
  { id:'cl4', nome:'Eduardo Kimura', doc:'901.447.028-11', tipo:'PF', telefone:'(43) 99742-9080', email:'edu.kimura@hotmail.com',
    cep:'86185-000', endereco:'Estrada do Limoeiro, km 4', bairro:'Zona Rural', cidade:'Cambé', uf:'PR', leadId:'ld4', criadoEm:ts(26), obs:'Chácara. Acesso por estrada de terra — evitar dia de chuva.' },
  { id:'cl5', nome:'Rede Hotel Água Viva Ltda', doc:'44.902.117/0001-58', tipo:'PJ', telefone:'(44) 3226-4400', email:'compras@hotelaguaviva.com.br',
    cep:'87050-900', endereco:'Av. Colombo, 9200', bairro:'Zona 07', cidade:'Maringá', uf:'PR', leadId:'ld5', criadoEm:ts(12), obs:'Compra recorrente — 2ª unidade prevista para o ano que vem.' }
]),

leads: () => ([
  /* --- ganhos (viraram cliente/pedido) --- */
  { id:'ld1', nome:'Marcos Antônio Ferreira', telefone:'(43) 99911-2045', email:'marcos.ferreira@gmail.com', cidade:'Londrina', bairro:'Gleba Palhano',
    origem:'Instagram', etapa:'ganho', vendedorId:'v1', valorEstimado:38500, produtoId:'pr4', criadoEm:ts(96), atualizadoEm:ts(72), ultimoContato:d(72), proximoContato:'',
    obs:'Quer entregar antes do aniversário da filha.', interacoes:[
      { data:ts(96), tipo:'Contato', texto:'Chegou pelo anúncio do Instagram. Quer piscina 7x3,5.', autor:'Ana Paula Ribeiro' },
      { data:ts(90), tipo:'Visita',  texto:'Visita técnica: terreno plano, acesso lateral 2,8 m. Sem rede elétrica no fundo.', autor:'Ana Paula Ribeiro' },
      { data:ts(84), tipo:'Proposta',texto:'Proposta #1001 enviada por WhatsApp.', autor:'Ana Paula Ribeiro' },
      { data:ts(72), tipo:'Ganho',   texto:'Fechou com entrada de R$ 12.000 + 18x.', autor:'Ana Paula Ribeiro' }
    ]},
  { id:'ld2', nome:'Condomínio Villa Toscana', telefone:'(43) 3025-7788', email:'sindico@villatoscana.com.br', cidade:'Londrina', bairro:'Jardim Alvorada',
    origem:'Indicação', etapa:'ganho', vendedorId:'v2', valorEstimado:62000, produtoId:'pr5', criadoEm:ts(84), atualizadoEm:ts(58), ultimoContato:d(58), proximoContato:'',
    obs:'Aprovado em assembleia.', interacoes:[
      { data:ts(84), tipo:'Contato', texto:'Síndico pediu proposta para área de lazer do condomínio.', autor:'Carlos Mendes' },
      { data:ts(70), tipo:'Proposta',texto:'Proposta #1002 apresentada na assembleia.', autor:'Carlos Mendes' },
      { data:ts(58), tipo:'Ganho',   texto:'Aprovada em assembleia. Pagamento em 3 parcelas via boleto.', autor:'Carlos Mendes' }
    ]},
  { id:'ld3', nome:'Patrícia Nogueira Sampaio', telefone:'(44) 99860-3312', email:'pattynogueira@outlook.com', cidade:'Maringá', bairro:'Zona 01',
    origem:'Google / Site', etapa:'ganho', vendedorId:'v3', valorEstimado:29900, produtoId:'pr3', criadoEm:ts(62), atualizadoEm:ts(41), ultimoContato:d(41), proximoContato:'',
    obs:'', interacoes:[
      { data:ts(62), tipo:'Contato', texto:'Preencheu o formulário do site pedindo orçamento da Toscana.', autor:'Juliana Torres' },
      { data:ts(52), tipo:'Visita',  texto:'Medição no local. Precisa remover 2 árvores.', autor:'Juliana Torres' },
      { data:ts(41), tipo:'Ganho',   texto:'Fechou à vista com 8% de desconto.', autor:'Juliana Torres' }
    ]},
  { id:'ld4', nome:'Eduardo Kimura', telefone:'(43) 99742-9080', email:'edu.kimura@hotmail.com', cidade:'Cambé', bairro:'Zona Rural',
    origem:'Feira / Evento', etapa:'ganho', vendedorId:'v1', valorEstimado:26800, produtoId:'pr2', criadoEm:ts(44), atualizadoEm:ts(26), ultimoContato:d(26), proximoContato:'',
    obs:'Conheceu no estande da ExpoLondrina.', interacoes:[
      { data:ts(44), tipo:'Contato', texto:'Cadastro feito no estande da feira.', autor:'Ana Paula Ribeiro' },
      { data:ts(33), tipo:'Proposta',texto:'Proposta #1004 enviada com deck de 18 m².', autor:'Ana Paula Ribeiro' },
      { data:ts(26), tipo:'Ganho',   texto:'Fechou. Pediu para agendar obra depois das chuvas.', autor:'Ana Paula Ribeiro' }
    ]},
  { id:'ld5', nome:'Rede Hotel Água Viva Ltda', telefone:'(44) 3226-4400', email:'compras@hotelaguaviva.com.br', cidade:'Maringá', bairro:'Zona 07',
    origem:'Indicação', etapa:'ganho', vendedorId:'v4', valorEstimado:71500, produtoId:'pr5', criadoEm:ts(38), atualizadoEm:ts(12), ultimoContato:d(12), proximoContato:'',
    obs:'Contrato corporativo. Exige ART e nota fiscal.', interacoes:[
      { data:ts(38), tipo:'Contato', texto:'Indicação do arquiteto da rede.', autor:'Rafael Lima' },
      { data:ts(24), tipo:'Proposta',texto:'Proposta #1005 com borda infinita e aquecimento.', autor:'Rafael Lima' },
      { data:ts(12), tipo:'Ganho',   texto:'Contrato assinado. Obra em janela de baixa ocupação.', autor:'Rafael Lima' }
    ]},

  /* --- em andamento --- */
  { id:'ld6', nome:'Fernanda Caldeira', telefone:'(43) 99633-7712', email:'fer.caldeira@gmail.com', cidade:'Londrina', bairro:'Aurora',
    origem:'Instagram', etapa:'negociacao', vendedorId:'v1', valorEstimado:34200, produtoId:'pr3', criadoEm:ts(21), atualizadoEm:ts(2), ultimoContato:d(2), proximoContato:df(1),
    obs:'Comparando com a concorrência. Sensível a prazo de entrega.', interacoes:[
      { data:ts(21), tipo:'Contato', texto:'Pediu valores pelo direct.', autor:'Ana Paula Ribeiro' },
      { data:ts(14), tipo:'Visita',  texto:'Visita técnica feita. Terreno com desnível de 40 cm.', autor:'Ana Paula Ribeiro' },
      { data:ts(8),  tipo:'Proposta',texto:'Proposta #1006 enviada.', autor:'Ana Paula Ribeiro' },
      { data:ts(2),  tipo:'Ligação', texto:'Pediu desconto de 10% e 24x. Autorizado até 8%.', autor:'Ana Paula Ribeiro' }
    ]},
  { id:'ld7', nome:'Roberto Salgueiro', telefone:'(44) 99880-1145', email:'rsalgueiro@uol.com.br', cidade:'Maringá', bairro:'Zona 05',
    origem:'Google / Site', etapa:'proposta', vendedorId:'v3', valorEstimado:41900, produtoId:'pr4', criadoEm:ts(16), atualizadoEm:ts(4), ultimoContato:d(4), proximoContato:df(2),
    obs:'', interacoes:[
      { data:ts(16), tipo:'Contato', texto:'Solicitou orçamento pelo site.', autor:'Juliana Torres' },
      { data:ts(9),  tipo:'Visita',  texto:'Medição OK. Quer hidro e aquecimento.', autor:'Juliana Torres' },
      { data:ts(4),  tipo:'Proposta',texto:'Proposta enviada por e-mail. Aguardando retorno.', autor:'Juliana Torres' }
    ]},
  { id:'ld8', nome:'Tatiane Prado Vilela', telefone:'(43) 99201-6678', email:'tati.prado@gmail.com', cidade:'Ibiporã', bairro:'Centro',
    origem:'Facebook', etapa:'visita', vendedorId:'v2', valorEstimado:24500, produtoId:'pr2', criadoEm:ts(11), atualizadoEm:ts(1), ultimoContato:d(1), proximoContato:df(3),
    obs:'Visita marcada para sábado de manhã.', interacoes:[
      { data:ts(11), tipo:'Contato', texto:'Respondeu anúncio patrocinado.', autor:'Carlos Mendes' },
      { data:ts(1),  tipo:'WhatsApp',texto:'Confirmou visita técnica para sábado 9h.', autor:'Carlos Mendes' }
    ]},
  { id:'ld9', nome:'Gustavo Peçanha', telefone:'(43) 99514-3300', email:'gustavo.pecanha@gmail.com', cidade:'Londrina', bairro:'Bela Suíça',
    origem:'Indicação', etapa:'visita', vendedorId:'v5', valorEstimado:19800, produtoId:'pr1', criadoEm:ts(9), atualizadoEm:ts(3), ultimoContato:d(3), proximoContato:df(1),
    obs:'Indicado pelo cliente Marcos Ferreira.', interacoes:[
      { data:ts(9), tipo:'Contato', texto:'Indicação do Marcos. Quintal pequeno.', autor:'Diego Barreto' },
      { data:ts(3), tipo:'Ligação', texto:'Agendou visita para quinta à tarde.', autor:'Diego Barreto' }
    ]},
  { id:'ld10', nome:'Cláudia Bernardes', telefone:'(44) 99377-2288', email:'claudiabernardes@yahoo.com.br', cidade:'Sarandi', bairro:'Jardim Independência',
    origem:'WhatsApp', etapa:'contato', vendedorId:'v3', valorEstimado:15500, produtoId:'pr6', criadoEm:ts(7), atualizadoEm:ts(5), ultimoContato:d(5), proximoContato:df(0),
    obs:'Quer piscina infantil. Orçamento apertado.', interacoes:[
      { data:ts(7), tipo:'WhatsApp', texto:'Perguntou preço da Prainha Kids.', autor:'Juliana Torres' },
      { data:ts(5), tipo:'WhatsApp', texto:'Enviada tabela. Vai conversar com o marido.', autor:'Juliana Torres' }
    ]},
  { id:'ld11', nome:'Sérgio Mancuso', telefone:'(43) 99460-7781', email:'sergio.mancuso@terra.com.br', cidade:'Rolândia', bairro:'Centro',
    origem:'Outdoor', etapa:'contato', vendedorId:'v2', valorEstimado:32800, produtoId:'pr3', criadoEm:ts(6), atualizadoEm:ts(6), ultimoContato:d(6), proximoContato:d(1),
    obs:'ATENÇÃO: sem contato há 6 dias e follow-up vencido.', interacoes:[
      { data:ts(6), tipo:'Ligação', texto:'Primeiro contato. Pediu para ligar na semana que vem.', autor:'Carlos Mendes' }
    ]},
  { id:'ld12', nome:'Amanda Beloti', telefone:'(43) 99125-9043', email:'amanda.beloti@gmail.com', cidade:'Londrina', bairro:'Gleba Fazenda Palhano',
    origem:'Instagram', etapa:'novo', vendedorId:'v5', valorEstimado:24500, produtoId:'pr2', criadoEm:ts(2), atualizadoEm:ts(2), ultimoContato:'', proximoContato:df(0),
    obs:'', interacoes:[{ data:ts(2), tipo:'Sistema', texto:'Lead criado a partir do formulário do Instagram.', autor:'Sistema' }] },
  { id:'ld13', nome:'Wellington Braz', telefone:'(44) 99702-4419', email:'well.braz@gmail.com', cidade:'Maringá', bairro:'Zona 08',
    origem:'Google / Site', etapa:'novo', vendedorId:'v4', valorEstimado:18900, produtoId:'pr1', criadoEm:ts(1), atualizadoEm:ts(1), ultimoContato:'', proximoContato:df(1),
    obs:'', interacoes:[{ data:ts(1), tipo:'Sistema', texto:'Lead criado pelo formulário do site.', autor:'Sistema' }] },
  { id:'ld14', nome:'Letícia Marchetti', telefone:'(43) 99988-1120', email:'le.marchetti@gmail.com', cidade:'Arapongas', bairro:'Centro',
    origem:'Loja física', etapa:'novo', vendedorId:'v2', valorEstimado:41900, produtoId:'pr4', criadoEm:ts(0), atualizadoEm:ts(0), ultimoContato:'', proximoContato:df(2),
    obs:'Passou na loja pedindo catálogo.', interacoes:[{ data:ts(0), tipo:'Contato', texto:'Atendimento no showroom. Levou catálogo impresso.', autor:'Carlos Mendes' }] },

  /* --- perdidos --- */
  { id:'ld15', nome:'Hélio Tavares', telefone:'(43) 99340-5567', email:'helio.tavares@gmail.com', cidade:'Londrina', bairro:'Jardim Shangri-lá',
    origem:'Facebook', etapa:'perdido', vendedorId:'v2', valorEstimado:32800, produtoId:'pr3', criadoEm:ts(48), atualizadoEm:ts(20), ultimoContato:d(20), proximoContato:'',
    motivoPerda:'Comprou do concorrente', obs:'Concorrente entregou em 7 dias.', interacoes:[
      { data:ts(48), tipo:'Contato', texto:'Interessado na Toscana.', autor:'Carlos Mendes' },
      { data:ts(30), tipo:'Proposta',texto:'Proposta enviada.', autor:'Carlos Mendes' },
      { data:ts(20), tipo:'Perdido', texto:'Fechou com concorrente por prazo de entrega menor.', autor:'Carlos Mendes' }
    ]},
  { id:'ld16', nome:'Vanderlei Zotto', telefone:'(44) 99617-3302', email:'', cidade:'Paiçandu', bairro:'Centro',
    origem:'Telefone', etapa:'perdido', vendedorId:'v3', valorEstimado:13400, produtoId:'pr6', criadoEm:ts(34), atualizadoEm:ts(18), ultimoContato:d(18), proximoContato:'',
    motivoPerda:'Preço acima do orçamento', obs:'', interacoes:[
      { data:ts(34), tipo:'Ligação', texto:'Pediu valor da menor piscina.', autor:'Juliana Torres' },
      { data:ts(18), tipo:'Perdido', texto:'Achou caro, vai fazer de alvenaria.', autor:'Juliana Torres' }
    ]}
]),

orcamentos: () => ([
  { id:'or1', numero:1001, leadId:'ld1', clienteId:'cl1', vendedorId:'v1', data:d(84), validade:d(69), status:'aprovado',
    itens:[
      { produtoId:'pr4', nome:'Piscina Capri', qtd:1, preco:41900, custo:22400 },
      { produtoId:'ad1', nome:'Hidromassagem 6 jatos', qtd:1, preco:3690, custo:1850 },
      { produtoId:'ad2', nome:'Iluminação LED RGB (par)', qtd:1, preco:1290, custo:620 },
      { produtoId:'sv1', nome:'Instalação padrão (mão de obra)', qtd:1, preco:5900, custo:2800 },
      { produtoId:'sv2', nome:'Escavação com máquina', qtd:1, preco:3800, custo:1900 }
    ],
    descontoPct:5, obs:'Entrega e instalação inclusas. Prazo de 12 dias após a escavação.',
    condicao:{ entrada:12000, parcelas:18, juros:1.79 } },

  { id:'or2', numero:1002, leadId:'ld2', clienteId:'cl2', vendedorId:'v2', data:d(70), validade:d(55), status:'aprovado',
    itens:[
      { produtoId:'pr5', nome:'Piscina Santorini', qtd:1, preco:54700, custo:29800 },
      { produtoId:'ad2', nome:'Iluminação LED RGB (par)', qtd:2, preco:1290, custo:620 },
      { produtoId:'ad6', nome:'Capa térmica sob medida', qtd:1, preco:1180, custo:540 },
      { produtoId:'sv1', nome:'Instalação padrão (mão de obra)', qtd:1, preco:5900, custo:2800 },
      { produtoId:'sv2', nome:'Escavação com máquina', qtd:1, preco:3800, custo:1900 }
    ],
    descontoPct:4, obs:'Nota fiscal em nome do condomínio. Obra somente em dias úteis.',
    condicao:{ entrada:0, parcelas:3, juros:0 } },

  { id:'or3', numero:1003, leadId:'ld3', clienteId:'cl3', vendedorId:'v3', data:d(26), validade:d(11), status:'aprovado',
    itens:[
      { produtoId:'pr3', nome:'Piscina Toscana', qtd:1, preco:32800, custo:17600 },
      { produtoId:'ad3', nome:'Cascata em inox 60 cm', qtd:1, preco:1690, custo:780 },
      { produtoId:'sv1', nome:'Instalação padrão (mão de obra)', qtd:1, preco:5900, custo:2800 }
    ],
    descontoPct:8, obs:'Pagamento à vista com desconto.',
    condicao:{ entrada:0, parcelas:1, juros:0 } },

  { id:'or4', numero:1004, leadId:'ld4', clienteId:'cl4', vendedorId:'v1', data:d(18), validade:d(3), status:'aprovado',
    itens:[
      { produtoId:'pr2', nome:'Piscina Maresias', qtd:1, preco:24500, custo:13200 },
      { produtoId:'ad5', nome:'Deck em madeira (m²)', qtd:18, preco:430, custo:210 },
      { produtoId:'sv1', nome:'Instalação padrão (mão de obra)', qtd:1, preco:5900, custo:2800 },
      { produtoId:'sv2', nome:'Escavação com máquina', qtd:1, preco:3800, custo:1900 }
    ],
    descontoPct:3, obs:'Acesso por estrada de terra. Evitar período chuvoso.',
    condicao:{ entrada:8000, parcelas:12, juros:1.79 } },

  { id:'or5', numero:1005, leadId:'ld5', clienteId:'cl5', vendedorId:'v4', data:d(24), validade:d(9), status:'aprovado',
    itens:[
      { produtoId:'pr5', nome:'Piscina Santorini', qtd:1, preco:54700, custo:29800 },
      { produtoId:'ad7', nome:'Borda infinita (execução)', qtd:1, preco:11800, custo:5200 },
      { produtoId:'ad4', nome:'Aquecimento solar (kit)', qtd:1, preco:6900, custo:3400 },
      { produtoId:'sv1', nome:'Instalação padrão (mão de obra)', qtd:1, preco:5900, custo:2800 },
      { produtoId:'sv2', nome:'Escavação com máquina', qtd:1, preco:3800, custo:1900 }
    ],
    descontoPct:6, obs:'Contrato corporativo. Emitir ART e nota fiscal de serviço.',
    condicao:{ entrada:25000, parcelas:6, juros:0 } },

  { id:'or6', numero:1006, leadId:'ld6', clienteId:'', vendedorId:'v1', data:d(8), validade:df(7), status:'negociando',
    itens:[
      { produtoId:'pr3', nome:'Piscina Toscana', qtd:1, preco:32800, custo:17600 },
      { produtoId:'ad1', nome:'Hidromassagem 6 jatos', qtd:1, preco:3690, custo:1850 },
      { produtoId:'sv1', nome:'Instalação padrão (mão de obra)', qtd:1, preco:5900, custo:2800 }
    ],
    descontoPct:0, obs:'Cliente pediu 10% de desconto. Alçada do gerente: 8%.',
    condicao:{ entrada:6000, parcelas:24, juros:1.79 } }
]),

/* Os pedidos guardam a foto financeira da venda (ver PP.pedidoTotal).
   Aqui ela é derivada do orçamento correspondente na hora de semear. */
pedidos: () => PP.seed._pedidosBase().map(p => {
  const o = PP.seed.orcamentos().find(x => x.id === p.orcamentoId);
  if (!o) return p;
  const sub = o.itens.reduce((s, i) => s + PP.n(i.qtd) * PP.n(i.preco), 0);
  const desc = sub * PP.n(o.descontoPct) / 100;
  return Object.assign({}, p, {
    total: PP.cent(sub - desc),
    custo: PP.cent(o.itens.reduce((s, i) => s + PP.n(i.qtd) * PP.n(i.custo), 0)),
    subtotal: PP.cent(sub),
    descontoPct: PP.n(o.descontoPct),
    descontoValor: PP.cent(desc),
    itens: JSON.parse(JSON.stringify(o.itens)),
    condicao: JSON.parse(JSON.stringify(o.condicao || {}))
  });
}),

_pedidosBase: () => ([
  { id:'pd1', numero:5001, orcamentoId:'or1', clienteId:'cl1', vendedorId:'v1', data:d(72), status:'concluido', obraId:'ob1',
    formaPag:'Financiamento', obs:'' },
  { id:'pd2', numero:5002, orcamentoId:'or2', clienteId:'cl2', vendedorId:'v2', data:d(40), status:'entregue', obraId:'ob2',
    formaPag:'Boleto', obs:'' },
  { id:'pd3', numero:5003, orcamentoId:'or3', clienteId:'cl3', vendedorId:'v3', data:d(16), status:'producao', obraId:'ob3',
    formaPag:'PIX', obs:'' },
  { id:'pd4', numero:5004, orcamentoId:'or4', clienteId:'cl4', vendedorId:'v1', data:d(9), status:'aberto', obraId:'ob4',
    formaPag:'Financiamento', obs:'' },
  { id:'pd5', numero:5005, orcamentoId:'or5', clienteId:'cl5', vendedorId:'v4', data:d(12), status:'aberto', obraId:'ob5',
    formaPag:'Boleto', obs:'Aguardando janela de baixa ocupação do hotel.' }
]),

obras: () => ([
  { id:'ob1', pedidoId:'pd1', clienteId:'cl1', status:'concluida', dataAgendada:d(60), dataConclusao:d(52),
    endereco:'Rua Gregório de Matos, 340 — Gleba Palhano', cidade:'Londrina', responsavel:'Equipe A — Jailson', equipeObraId:'eo1', duracaoDias:3,
    custoPrevisto:29570, custoReal:30120, checklist:PP.CHECKLIST_OBRA.map(() => true),
    notas:[
      { data:ts(60), texto:'Escavação iniciada. Solo argiloso, rendimento bom.', autor:'Jailson' },
      { data:ts(56), texto:'Casco assentado e nivelado.', autor:'Jailson' },
      { data:ts(52), texto:'Entrega feita. Cliente assinou o termo. Sobrecusto de R$ 550 em brita.', autor:'Jailson' }
    ]},
  { id:'ob2', pedidoId:'pd2', clienteId:'cl2', status:'acabamento', dataAgendada:d(30), dataConclusao:'',
    endereco:'Av. Saul Elkind, 2200 — Jardim Alvorada', cidade:'Londrina', responsavel:'Equipe B — Ronaldo', equipeObraId:'eo2', duracaoDias:4,
    custoPrevisto:37360, custoReal:35980, checklist:PP.CHECKLIST_OBRA.map((_, i) => i < 10),
    notas:[
      { data:ts(30), texto:'Início da obra. Condomínio liberou acesso pelo portão de serviço.', autor:'Ronaldo' },
      { data:ts(18), texto:'Hidráulica concluída. Teste de estanqueidade OK.', autor:'Ronaldo' },
      { data:ts(4),  texto:'Acabamento de borda em andamento. Falta o deck perimetral.', autor:'Ronaldo' }
    ]},
  { id:'ob3', pedidoId:'pd3', clienteId:'cl3', status:'escavacao', dataAgendada:d(5), dataConclusao:'',
    endereco:'Rua Néo Alves Martins, 1180 — Zona 01', cidade:'Maringá', responsavel:'Equipe C — Wilson', equipeObraId:'eo3', duracaoDias:3,
    custoPrevisto:21180, custoReal:0, checklist:PP.CHECKLIST_OBRA.map((_, i) => i < 3),
    notas:[
      { data:ts(5), texto:'Árvores removidas pela prefeitura. Escavação liberada.', autor:'Wilson' }
    ]},
  { id:'ob4', pedidoId:'pd4', clienteId:'cl4', status:'agendada', dataAgendada:df(6), dataConclusao:'',
    endereco:'Estrada do Limoeiro, km 4 — Zona Rural', cidade:'Cambé', responsavel:'Equipe A — Jailson', equipeObraId:'eo1', duracaoDias:3,
    custoPrevisto:21680, custoReal:0, checklist:PP.CHECKLIST_OBRA.map(() => false),
    notas:[{ data:ts(20), texto:'Agendado. Confirmar previsão do tempo 48 h antes (estrada de terra).', autor:'Ana Paula Ribeiro' }] },
  { id:'ob5', pedidoId:'pd5', clienteId:'cl5', status:'aguardando', dataAgendada:'', dataConclusao:'',
    endereco:'Av. Colombo, 9200 — Zona 07', cidade:'Maringá', responsavel:'', equipeObraId:'', duracaoDias:5,
    custoPrevisto:43100, custoReal:0, checklist:PP.CHECKLIST_OBRA.map(() => false),
    notas:[{ data:ts(10), texto:'Casco Santorini sob encomenda na fábrica — previsão 18 dias.', autor:'Rafael Lima' }] }
]),

compras: () => ([
  { id:'cp1', numero:9001, fornecedorId:'fo1', data:d(22), previsaoEntrega:d(4), status:'recebido',
    itens:[
      { produtoId:'pr2', nome:'Piscina Maresias', qtd:2, custo:13200 },
      { produtoId:'pr3', nome:'Piscina Toscana',  qtd:1, custo:17600 }
    ], obs:'Frete incluso no pedido.' },
  { id:'cp2', numero:9002, fornecedorId:'fo2', data:d(6), previsaoEntrega:df(4), status:'enviado',
    itens:[
      { produtoId:'eq_4', nome:'Filtro FM-50 + válvula', qtd:4, custo:880 },
      { produtoId:'in2',  nome:'Cloro granulado 10 kg',  qtd:8, custo:145 }
    ], obs:'Reposição de estoque mínimo.' }
]),

estoqueMov: () => ([
  { id:'mv1', produtoId:'pr2', tipo:'entrada', qtd:2, data:d(4),  motivo:'Compra #9001', ref:'cp1' },
  { id:'mv2', produtoId:'pr3', tipo:'entrada', qtd:1, data:d(4),  motivo:'Compra #9001', ref:'cp1' },
  { id:'mv3', produtoId:'pr4', tipo:'saida',   qtd:1, data:d(60), motivo:'Pedido #5001', ref:'pd1' },
  { id:'mv4', produtoId:'pr3', tipo:'saida',   qtd:1, data:d(41), motivo:'Pedido #5003', ref:'pd3' },
  { id:'mv5', produtoId:'ad1', tipo:'saida',   qtd:1, data:d(60), motivo:'Pedido #5001', ref:'pd1' },
  { id:'mv6', produtoId:'in2', tipo:'saida',   qtd:3, data:d(15), motivo:'Consumo em obras', ref:'' }
]),

/* Venda de balcão: cloro, areia, kits — o giro pequeno da loja. */
vendas: () => {
  const catalogo = [
    { produtoId:'in2',  sku:'INS-CLO-10K', nome:'Cloro granulado 10 kg',    unidade:'bd',  preco:289, custo:145 },
    { produtoId:'in1',  sku:'INS-ARE-FIL', nome:'Areia filtrante (saco 25 kg)', unidade:'sc', preco:79,  custo:38 },
    { produtoId:'ad6',  sku:'ADC-CAP-TER', nome:'Capa térmica sob medida',  unidade:'un',  preco:1180, custo:540 },
    { produtoId:'in3',  sku:'INS-PVC-KIT', nome:'Kit hidráulico PVC 50 mm', unidade:'kit', preco:520, custo:260 },
    { produtoId:'ad2',  sku:'ADC-LED-RGB', nome:'Iluminação LED RGB (par)', unidade:'un',  preco:1290, custo:620 },
    { produtoId:'eq_1', sku:'EQP-BOM-050', nome:'Bomba 1/2 cv autoescorvante', unidade:'un', preco:980, custo:480 }
  ];
  const clientes = ['cl1','cl3','cl4','', '', 'cl2'];
  const formas = ['PIX','Dinheiro','Cartão de débito','Cartão de crédito','PIX','Dinheiro'];
  const vends = ['v2','v5','v2','v3','v5','v1'];
  const out = [];

  /* 22 vendas espalhadas pelos últimos 40 dias, incluindo algumas hoje */
  for (let i = 0; i < 22; i++) {
    const diasAtras = i < 4 ? 0 : (i < 7 ? 1 : Math.floor((i - 7) * 2.6));
    const itens = [];
    const quantos = 1 + (i % 3);
    for (let k = 0; k < quantos; k++) {
      const base = catalogo[(i + k * 2) % catalogo.length];
      itens.push(Object.assign({}, base, { qtd: base.preco < 300 ? 1 + ((i + k) % 3) : 1 }));
    }
    const sub = itens.reduce((s, x) => s + x.qtd * x.preco, 0);
    const descPct = i % 7 === 0 ? 5 : 0;
    const desc = PP.cent(sub * descPct / 100);
    const total = PP.cent(sub - desc);
    const forma = formas[i % formas.length];
    const parcelas = (forma === 'Cartão de crédito' && total > 800) ? 3 : 1;
    const cliId = clientes[i % clientes.length];
    const hora = 9 + (i % 9);

    out.push({
      id:'vd' + (i + 1), numero: 1 + i,
      data: new Date(new Date().setHours(hora, (i * 7) % 60, 0, 0) - diasAtras * 864e5).toISOString(),
      clienteId: cliId,
      clienteNome: cliId ? (PP.seed.clientes().find(c => c.id === cliId) || {}).nome || 'Consumidor' : 'Consumidor',
      vendedorId: vends[i % vends.length],
      itens,
      subtotal: PP.cent(sub), descontoPct: descPct, descontoValor: desc,
      total, custo: PP.cent(itens.reduce((s, x) => s + x.qtd * x.custo, 0)),
      formaPag: forma, parcelas,
      recebido: forma === 'Dinheiro' ? PP.cent(Math.ceil(total / 50) * 50) : 0,
      troco: forma === 'Dinheiro' ? PP.cent(Math.ceil(total / 50) * 50 - total) : 0,
      status:'concluida', obs:''
    });
  }
  return out;
},

contratos: () => ([
  { id:'ct1', numero:3001, clienteId:'cl1', vendedorId:'v1', escopo:'Limpeza quinzenal, balanceamento químico e checagem de equipamentos',
    valor:420, periodicidade:'mensal', diaVencimento:10, inicio:d(45), fim:'', status:'ativo',
    ultimaCobranca:PP.mesKey(d(30)) + '-10', obs:'Cliente pediu visita sempre às terças.' },
  { id:'ct2', numero:3002, clienteId:'cl2', vendedorId:'v2', escopo:'Manutenção completa da área de lazer do condomínio',
    valor:1180, periodicidade:'mensal', diaVencimento:5, inicio:d(20), fim:df(345), status:'ativo',
    ultimaCobranca:'', obs:'Contrato anual, renovação em assembleia.' },
  { id:'ct3', numero:3003, clienteId:'cl3', vendedorId:'v3', escopo:'Limpeza e tratamento químico',
    valor:680, periodicidade:'bimestral', diaVencimento:15, inicio:d(12), fim:'', status:'ativo',
    ultimaCobranca:'', obs:'' },
  { id:'ct4', numero:3004, clienteId:'cl4', vendedorId:'v1', escopo:'Apenas abertura de temporada',
    valor:390, periodicidade:'trimestral', diaVencimento:20, inicio:d(200), fim:d(15), status:'encerrado',
    ultimaCobranca:d(40), obs:'Cliente optou por cuidar sozinho.' }
]),

chamados: () => ([
  { id:'ch1', numero:7001, clienteId:'cl1', pedidoId:'pd1', tipo:'Equipamento',
    descricao:'Bomba fazendo barulho alto e desarmando o disjuntor depois de uns 20 minutos ligada.',
    abertura:ts(3), status:'agendado', equipeObraId:'eo1', dataVisita:df(1),
    emGarantia:true, custo:0, valorCobrado:0, solucao:'', fechamento:'' },
  { id:'ch2', numero:7002, clienteId:'cl2', pedidoId:'pd2', tipo:'Vazamento',
    descricao:'Nível da água baixando cerca de 3 cm por dia. Suspeita de vazamento na tubulação de retorno.',
    abertura:ts(9), status:'execucao', equipeObraId:'eo2', dataVisita:d(2),
    emGarantia:true, custo:640, valorCobrado:0, solucao:'', fechamento:'' },
  { id:'ch3', numero:7003, clienteId:'cl3', pedidoId:'pd3', tipo:'Manutenção',
    descricao:'Cliente pediu limpeza profunda e troca da areia do filtro fora do contrato.',
    abertura:ts(21), status:'resolvido', equipeObraId:'eo3', dataVisita:d(18),
    emGarantia:false, custo:180, valorCobrado:540,
    solucao:'Areia trocada (2 sacos), filtro higienizado e pH corrigido.', fechamento:d(18) },
  { id:'ch4', numero:7004, clienteId:'cl4', pedidoId:'pd4', tipo:'Dúvida técnica',
    descricao:'Cliente quer saber a dosagem certa de cloro no verão para a Maresias.',
    abertura:ts(1), status:'aberto', equipeObraId:'', dataVisita:'',
    emGarantia:true, custo:0, valorCobrado:0, solucao:'', fechamento:'' }
]),

/* financeiro e comissões são gerados a partir dos pedidos — ver PP.gerarFinanceiroSeed() */
financeiro: () => (PP.seedFinanceiro ? PP.seedFinanceiro() : []),
comissoes:  () => (PP.seedComissoes  ? PP.seedComissoes()  : [])

};

/* --------------------------------------------------------------------------
   Financeiro e comissões derivados dos orçamentos aprovados do seed.
   -------------------------------------------------------------------------- */

function totalOrc(o) {
  const sub = o.itens.reduce((s, i) => s + PP.n(i.qtd) * PP.n(i.preco), 0);
  return sub - sub * PP.n(o.descontoPct) / 100;
}
function custoOrc(o) {
  return o.itens.reduce((s, i) => s + PP.n(i.qtd) * PP.n(i.custo), 0);
}
PP.seedTotalOrc = totalOrc;
PP.seedCustoOrc = custoOrc;

PP.seedFinanceiro = function () {
  const orcs = PP.seed.orcamentos();
  const peds = PP.seed.pedidos();
  const out = [];
  let k = 0;
  const id = () => 'fi' + (++k);

  peds.forEach(p => {
    const o = orcs.find(x => x.id === p.orcamentoId);
    if (!o) return;
    const total = PP.cent(totalOrc(o));
    const c = o.condicao || { entrada: 0, parcelas: 1, juros: 0 };
    const entrada = PP.cent(PP.n(c.entrada));
    const nParc = Math.max(PP.n(c.parcelas), 1);
    const valores = PP.parcelar(total - entrada, nParc, c.juros);

    if (entrada > 0) {
      out.push({ id:id(), tipo:'receber', descricao:`Entrada — Pedido #${p.numero}`, categoria:'Venda de piscina',
        valor:entrada, vencimento:p.data, status:'pago', pagoEm:p.data, formaPag:'PIX',
        clienteId:p.clienteId, origem:{ tipo:'pedido', id:p.id }, parcela:0, parcelas:nParc, obs:'' });
    }
    valores.forEach((valor, idx) => {
      const i = idx + 1;
      const venc = PP.addMeses(p.data, entrada > 0 ? i : i - 1);
      const vencido = venc < PP.hoje();
      /* deixa duas parcelas propositalmente em atraso para a demo ficar viva */
      const forcarAtraso = (p.id === 'pd2' && i === 2) || (p.id === 'pd4' && i === 1);
      out.push({ id:id(), tipo:'receber', descricao:`Parcela ${i}/${nParc} — Pedido #${p.numero}`, categoria:'Venda de piscina',
        valor, vencimento:venc, status: (vencido && !forcarAtraso) ? 'pago' : 'aberto',
        pagoEm: (vencido && !forcarAtraso) ? venc : '', formaPag:p.formaPag,
        clienteId:p.clienteId, origem:{ tipo:'pedido', id:p.id }, parcela:i, parcelas:nParc, obs:'' });
    });

    /* custo do produto vendido → contas a pagar */
    out.push({ id:id(), tipo:'pagar', descricao:`Custo de produto — Pedido #${p.numero}`, categoria:'Compra de piscina',
      valor:PP.cent(custoOrc(o) * 0.62), vencimento:PP.addDias(p.data, 30), status: PP.addDias(p.data, 30) < PP.hoje() ? 'pago' : 'aberto',
      pagoEm: PP.addDias(p.data, 30) < PP.hoje() ? PP.addDias(p.data, 30) : '', formaPag:'Boleto',
      fornecedorId:'fo1', origem:{ tipo:'pedido', id:p.id }, parcela:1, parcelas:1, obs:'' });
    out.push({ id:id(), tipo:'pagar', descricao:`Mão de obra e escavação — Pedido #${p.numero}`, categoria:'Mão de obra',
      valor:PP.cent(custoOrc(o) * 0.24), vencimento:PP.addDias(p.data, 15), status: PP.addDias(p.data, 15) < PP.hoje() ? 'pago' : 'aberto',
      pagoEm: PP.addDias(p.data, 15) < PP.hoje() ? PP.addDias(p.data, 15) : '', formaPag:'Transferência',
      fornecedorId:'fo5', origem:{ tipo:'pedido', id:p.id }, parcela:1, parcelas:1, obs:'' });
  });

  /* despesas fixas dos últimos 5 meses + o mês corrente */
  const fixas = [
    { d:'Aluguel do showroom e pátio', c:'Administrativo', v:7800 },
    { d:'Folha de pagamento',          c:'Administrativo', v:28400 },
    { d:'Marketing digital (ads)',     c:'Marketing',      v:6200 },
    { d:'Energia, água e internet',    c:'Administrativo', v:2350 },
    { d:'Impostos (Simples Nacional)', c:'Impostos',       v:9100 }
  ];
  PP.ultimosMeses(6).forEach(mk => {
    fixas.forEach(f => {
      const venc = mk + '-10';
      out.push({ id:id(), tipo:'pagar', descricao:`${f.d} — ${PP.mesNome(mk)}`, categoria:f.c,
        valor:PP.cent(f.v * (0.93 + Math.random() * 0.14)), vencimento:venc,
        status: venc < PP.hoje() ? 'pago' : 'aberto', pagoEm: venc < PP.hoje() ? venc : '',
        formaPag:'Boleto', origem:{ tipo:'fixa' }, parcela:1, parcelas:1, obs:'' });
    });
  });

  /* compras de estoque */
  out.push({ id:id(), tipo:'pagar', descricao:'Compra #9001 — Fibratec', categoria:'Compra de piscina',
    valor:44000, vencimento:PP.addDias(PP.hoje(), -4 + 28), status:'aberto', pagoEm:'', formaPag:'Boleto',
    fornecedorId:'fo1', origem:{ tipo:'compra', id:'cp1' }, parcela:1, parcelas:1, obs:'' });
  out.push({ id:id(), tipo:'pagar', descricao:'Compra #9002 — HidroSul', categoria:'Equipamentos',
    valor:4680, vencimento:PP.addDias(PP.hoje(), 24), status:'aberto', pagoEm:'', formaPag:'Boleto',
    fornecedorId:'fo2', origem:{ tipo:'compra', id:'cp2' }, parcela:1, parcelas:1, obs:'' });

  /* vendas de balcão: à vista entram já baixadas no caixa */
  (PP.seed.vendas ? PP.seed.vendas() : []).forEach(v => {
    if (v.status !== 'concluida') return;
    const dia = String(v.data).slice(0, 10);
    if (PP.n(v.parcelas) > 1) {
      PP.parcelar(v.total, v.parcelas, 0).forEach((valor, idx) => {
        const venc = PP.addMeses(dia, idx);
        out.push({ id:id(), tipo:'receber', descricao:`Parcela ${idx + 1}/${v.parcelas} — Venda de balcão #${v.numero}`,
          categoria:'Venda de balcão', valor, vencimento:venc,
          status: venc <= PP.hoje() ? 'pago' : 'aberto', pagoEm: venc <= PP.hoje() ? venc : '',
          formaPag:v.formaPag, clienteId:v.clienteId || '',
          origem:{ tipo:'venda', id:v.id }, parcela:idx + 1, parcelas:v.parcelas, obs:'' });
      });
    } else {
      out.push({ id:id(), tipo:'receber', descricao:`Venda de balcão #${v.numero}`,
        categoria:'Venda de balcão', valor:v.total, vencimento:dia, status:'pago', pagoEm:dia,
        formaPag:v.formaPag, clienteId:v.clienteId || '',
        origem:{ tipo:'venda', id:v.id }, parcela:1, parcelas:1, obs:'' });
    }
  });

  /* receita avulsa de manutenção */
  out.push({ id:id(), tipo:'receber', descricao:'Manutenção mensal — contratos avulsos', categoria:'Serviço / manutenção',
    valor:3360, vencimento:PP.hoje().slice(0, 8) + '20', status:'aberto', pagoEm:'', formaPag:'PIX',
    origem:{ tipo:'avulso' }, parcela:1, parcelas:1, obs:'8 contratos ativos.' });

  return out;
};

PP.seedComissoes = function () {
  /* comissão das vendas de balcão — percentual próprio, menor que o de piscina */
  const balcao = (PP.seed.vendas ? PP.seed.vendas() : []).filter(v => v.status === 'concluida').map((v, i) => {
    const pct = PP.n(PP.CONFIG_PADRAO.comissaoBalcaoPct);
    return { id:'cb' + (i + 1), vendedorId:v.vendedorId, vendaId:v.id, clienteId:v.clienteId || '',
      base:PP.cent(v.total), baseTipo:'faturamento', faturamento:PP.cent(v.total), custo:PP.cent(v.custo),
      pct, valor:PP.cent(v.total * pct / 100), competencia:PP.mesKey(v.data),
      status:'liberada', pagoEm:'', origem:'balcao' };
  });

  const orcs = PP.seed.orcamentos();
  const vends = PP.seed.vendedores();
  return balcao.concat(PP.seed.pedidos().map((p, i) => {
    const o = orcs.find(x => x.id === p.orcamentoId);
    const v = vends.find(x => x.id === p.vendedorId);
    const fat = o ? totalOrc(o) : 0;
    const custo = o ? custoOrc(o) : 0;
    const sobreMargem = PP.CONFIG_PADRAO.comissaoBase === 'margem';
    const base = sobreMargem ? Math.max(fat - custo, 0) : fat;
    const pct = v ? PP.n(v.comissaoPct) : 3;
    const concluido = p.status === 'concluido' || p.status === 'entregue';
    return {
      id: 'cm' + (i + 1), vendedorId: p.vendedorId, pedidoId: p.id, clienteId: p.clienteId,
      base: PP.cent(base), baseTipo: sobreMargem ? 'margem' : 'faturamento',
      faturamento: PP.cent(fat), custo: PP.cent(custo), pct: pct, valor: PP.cent(base * pct / 100),
      competencia: PP.mesKey(p.data),
      status: p.status === 'concluido' ? 'paga' : (concluido ? 'liberada' : 'prevista'),
      pagoEm: p.status === 'concluido' ? PP.addDias(p.data, 35) : ''
    };
  }));
};

})();
