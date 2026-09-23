/* Carrega dependências por tela. Listas parciais nunca representam uma coleção
   completa para relatórios, exportações ou regras de negócio. */
(function () {
'use strict';
const PP=window.PP;
const basicas=['equipes','equipesObra','vendedores','produtos'];
const comercial=basicas.concat(['leads','clientes','orcamentos','pedidos','obras','financeiro','comissoes']);
const dependencias={
  pdv:basicas.concat(['clientes','orcamentos']),
  leads:basicas,
  funil:comercial,
  orcamentos:comercial.concat(['fornecedores']),
  pedidos:comercial.concat(['fornecedores']),
  produtos:basicas.concat(['fornecedores','orcamentos']),
  estoque:basicas.concat(['fornecedores','orcamentos','estoqueMov','compras']),
  agenda:comercial.concat(['chamados']),
  obras:comercial,
  vendedores:comercial.concat(['usuarios','vendas']),
  vendas:basicas.concat(['vendas','clientes','financeiro','comissoes','orcamentos']),
  compras:basicas.concat(['compras','fornecedores','estoqueMov','financeiro']),
  financeiro:comercial.concat(['fornecedores','compras','vendas','contratos','chamados']),
  config:['usuarios'],
  licenca:[],auditoria:[],empresas:[],planos:[],faturas:[],saude:[],trilha:[]
};
const carregando=new Map();
PP.garantirDados=async cols=>{
  if (PP.driver.nome!=='supabase' || PP.ehProvedor()) return;
  const n=PP.nuvem;
  const faltam=(cols || PP.COLS).filter(c=>c!=='config'&&!n.carregadas.has(c));
  if (!faltam.length) return;
  await PP.db.confirmar();
  await Promise.all(faltam.map(c=>{
    if (!carregando.has(c)) carregando.set(c,(async()=>{
      const dados=await PP.driver.carregarColecoes([c]);
      PP.db.incorporar(c,dados[c]); n.carregadas.add(c);
    })().finally(()=>carregando.delete(c)));
    return carregando.get(c);
  }));
};
PP.prepararView=async nome=>{
  await PP.garantirDados(dependencias[nome] || PP.COLS);
  if (nome==='leads' && PP.prepararPaginaLeads) await PP.prepararPaginaLeads();
};
// Os detalhes e as exclusões precisam de referências completas, mesmo quando
// foram abertos a partir de uma página de resultados do servidor.
const run=PP.run;
PP.run=(nome,el,ev)=>{
  if (PP.driver.nome==='supabase' && /^(abrir|editar|excluir|exportar|importar|resetTudo|alertas)/.test(nome)) {
    return PP.garantirDados().then(()=>run(nome,el,ev)).catch(e=>PP.toast(e.message,'err'));
  }
  return run(nome,el,ev);
};
})();
