(function(){"use strict";const a=window.PP,d=a.esc;a.vend=e=>a.find("vendedores",e),a.vendNome=e=>(a.vend(e)||{}).nome||"\u2014",a.cli=e=>a.find("clientes",e),a.cliNome=e=>(a.cli(e)||{}).nome||"\u2014",a.prod=e=>a.find("produtos",e),a.prodNome=e=>(a.prod(e)||{}).nome||"\u2014",a.forn=e=>a.find("fornecedores",e),a.fornNome=e=>(a.forn(e)||{}).nome||"\u2014",a.lead=e=>a.find("leads",e),a.metrosItem=e=>{const o=a.prod(e&&e.produtoId);return!o||o.categoria!=="Piscina"?0:a.n((o.specs||{}).compr)*a.n(e.qtd)},a.metrosPiscina=e=>a.cent((e||[]).reduce((o,t)=>o+a.metrosItem(t),0)),a.valorMetro=e=>{const o=a.vend(e),t=o?a.n(o.comissaoMetro):0;return t>0?t:a.n(a.cfg().comissaoPorMetro)},a.calcComissao=e=>{const o=a.cent(e.faturamento),t=a.cent(e.custo);if(a.cfg().comissaoBase==="metro"){const c=a.metrosPiscina(e.itens),m=a.valorMetro(e.vendedorId);return{baseTipo:"metro",base:o,faturamento:o,custo:t,metros:c,valorMetro:m,pct:0,valor:a.cent(c*m)}}const r=a.cfg().comissaoBase==="margem",i=a.n(e.pct),s=a.cent(r?Math.max(o-t,0):o);return{baseTipo:r?"margem":"faturamento",base:s,faturamento:o,custo:t,metros:0,valorMetro:0,pct:i,valor:a.cent(s*i/100)}},a.comissaoRegra=e=>e&&e.baseTipo==="metro"?a.money0(e.valorMetro)+"/m":a.dec(e&&e.pct,1)+"%",a.comissaoBaseTxt=e=>e&&e.baseTipo==="metro"?a.dec(e.metros,2)+" m":a.money0(e&&e.base),a.comissaoBaseNome=e=>e==="metro"?"metro de piscina":e==="margem"?"margem bruta":"faturamento",a.orcSub=e=>(e&&e.itens||[]).reduce((o,t)=>o+a.n(t.qtd)*a.n(t.preco),0),a.orcDesc=e=>a.orcSub(e)*a.n(e&&e.descontoPct)/100,a.orcTotal=e=>a.orcSub(e)-a.orcDesc(e),a.orcCusto=e=>(e&&e.itens||[]).reduce((o,t)=>o+a.n(t.qtd)*a.n(t.custo),0),a.orcMargem=e=>{const o=a.orcTotal(e);return o?(o-a.orcCusto(e))/o*100:0},a.orcDoPedido=e=>a.find("orcamentos",e&&e.orcamentoId),a.pedidoTotal=e=>e&&e.total!==void 0?a.n(e.total):a.orcTotal(a.orcDoPedido(e)),a.pedidoCusto=e=>e&&e.custo!==void 0?a.n(e.custo):a.orcCusto(a.orcDoPedido(e)),a.pedidoItens=e=>e&&e.itens?e.itens:(a.orcDoPedido(e)||{}).itens||[],a.pedidoDoOrc=e=>a.all("pedidos").find(o=>o.orcamentoId===e)||null,a.obraDoPedido=e=>a.all("obras").find(o=>o.pedidoId===e)||null,a.pedidosDoMes=e=>a.where("pedidos",o=>o.status!=="cancelado"&&a.mesKey(o.data)===e),a.vendasDoMes=e=>a.soma(a.pedidosDoMes(e),a.pedidoTotal),a.metasDoMes=e=>a.where("vendedores",o=>o.ativo).map(o=>{const t=a.pedidosDoMes(e).filter(s=>s.vendedorId===o.id),r=a.soma(t,a.pedidoTotal),i=a.n(o.meta)||a.n(a.cfg().metaPadrao);return{v:o,realizado:r,meta:i,qtd:t.length,pc:i?r/i*100:0}}),a.interagir=(e,o,t,r)=>{const i=a.lead(e);i&&(i.interacoes=i.interacoes||[],i.interacoes.push({data:a.agora(),tipo:o,texto:t,autor:r||a.vendNome(i.vendedorId)}),i.ultimoContato=a.hoje(),i.atualizadoEm=a.agora(),a.save("leads"))},a.leadAtrasado=e=>{if(!a.ETAPAS_ATIVAS.includes(e.etapa))return!1;if(e.proximoContato&&e.proximoContato<a.hoje())return!0;const o=e.ultimoContato||String(e.criadoEm||"").slice(0,10);return a.diasEntre(o,a.hoje())>7},a.view("dashboard",{titulo:"Vis\xE3o geral",sub:()=>`${a.cfg().empresa} \u2014 ${a.mesNomeLongo(a.mesKey(a.hoje()))}`,render(){const e=a.mesKey(a.hoje()),o=a.ultimosMeses(2)[0],t=a.ultimosMeses(6),r=a.ehGestor(),i=a.escopo(a.pedidosDoMes(e)),s=a.soma(i,a.pedidoTotal),c=a.soma(a.escopo(a.pedidosDoMes(o)),a.pedidoTotal),m=i.length,v=m?s/m:0,l=a.escopo(a.all("leads")),b=l.filter(n=>a.ETAPAS_ATIVAS.includes(n.etapa)),g=l.filter(n=>n.etapa==="ganho").length,p=l.filter(n=>n.etapa==="perdido").length,L=g+p?g/(g+p)*100:0,I=a.soma(a.where("financeiro",n=>n.tipo==="receber"&&n.status==="aberto"),"valor"),k=a.soma(a.where("financeiro",n=>n.tipo==="receber"&&n.status==="aberto"&&n.vencimento<a.hoje()),"valor"),P=a.where("obras",n=>n.status!=="concluida"&&n.status!=="cancelada"),C=a.soma(a.where("comissoes",n=>n.competencia===e&&n.status!=="cancelada"&&(r||n.vendedorId===a.vendedorAtual())),"valor"),x=r?a.metasDoMes(e):a.metasDoMes(e).filter(n=>n.v.id===a.vendedorAtual()),y=a.soma(x,"meta"),N=a.soma(x,"realizado"),V=c?(s-c)/c*100:0,la=[a.kpi({cls:"k-teal destaque",lbl:"Vendas do m\xEAs",val:a.money0(s),foot:c?`<span class="delta ${V>=0?"up":"down"}">${V>=0?"\u25B2":"\u25BC"} ${a.dec(Math.abs(V),1)}%</span> vs ${a.mesNome(o)}`:`<span class="faint">sem vendas em ${a.mesNome(o)} para comparar</span>`,footHTML:!0}),a.kpi({lbl:"Pedidos fechados",val:String(m),foot:`Ticket m\xE9dio ${a.money0(v)}`}),a.kpi({lbl:"Leads ativos",val:String(b.length),foot:`${a.money0(a.soma(b,"valorEstimado"))} em potencial`}),a.kpi({cls:"k-ocre",lbl:"Convers\xE3o",val:a.pct(L,0),foot:`${g} ganhos \xB7 ${p} perdidos`}),r?a.kpi({cls:k>0?"k-dang":"k-ok",lbl:"A receber em aberto",val:a.money0(I),sm:!0,foot:k>0?`${a.money0(k)} em atraso`:"Nada em atraso"}):a.kpi({cls:"k-ok",lbl:"Minha comiss\xE3o no m\xEAs",val:a.money0(C),sm:!0,foot:"prevista + liberada + paga"}),r?a.kpi({cls:"k-warn",lbl:"Obras em andamento",val:String(P.length),foot:`${a.where("obras",n=>n.status==="concluida").length} conclu\xEDdas no total`}):a.kpi({cls:"k-warn",lbl:"Propostas na rua",val:String(a.escopo(a.where("orcamentos",n=>n.status==="enviado"||n.status==="negociando")).length),foot:a.money0(a.soma(a.escopo(a.where("orcamentos",n=>n.status==="enviado"||n.status==="negociando")),a.orcTotal))})].join(""),ca=t.map(n=>a.soma(a.escopo(a.pedidosDoMes(n)),a.pedidoTotal)),ma=t.map(()=>y),va=a.ETAPAS_ATIVAS.map(n=>{const h=a.etapa(n),Z=l.filter(pa=>pa.etapa===n);return{nome:h.nome,cor:h.cor,qtd:Z.length,valor:a.soma(Z,"valorEstimado")}}),J=l.filter(a.leadAtrasado).sort((n,h)=>(n.proximoContato||"9")<(h.proximoContato||"9")?-1:1).slice(0,6),H=a.escopo(a.where("orcamentos",n=>n.status==="enviado"||n.status==="negociando")).sort((n,h)=>n.validade<h.validade?-1:1).slice(0,6),W=new Set(a.escopo(a.all("pedidos")).map(n=>n.id)),Q=a.where("obras",n=>n.dataAgendada&&n.status!=="concluida"&&n.status!=="cancelada"&&(r||W.has(n.pedidoId))).sort((n,h)=>n.dataAgendada<h.dataAgendada?-1:1).slice(0,6),X=a.where("financeiro",n=>n.status==="aberto"&&n.vencimento<a.hoje()).sort((n,h)=>n.vencimento<h.vencimento?-1:1).slice(0,6),Y=a.where("chamados",n=>n.status!=="resolvido"&&n.status!=="cancelado"&&(r||W.has(n.pedidoId))).slice(0,6);return`
    <div class="kpis kpis-6 mb">${la}</div>

    <div class="grid g-3-2 mb">
      <div class="card">
        <div class="card-hd">
          <div><h3>Vendas por m\xEAs</h3><div class="sub">Faturamento fechado x meta do time</div></div>
          <div class="right legend">
            <span><i style="background:var(--teal)"></i>Realizado</span>
            <span><i style="background:var(--areia)"></i>Meta</span>
          </div>
        </div>
        <div class="card-bd">
          ${a.chart.barras({labels:t.map(a.mesNome),height:236,modo:"alvo",series:[{nome:"Meta",cor:"#B99A6B",values:ma},{nome:"Realizado",cor:"#0E7C86",values:ca}]})}
        </div>
      </div>

      <div class="card">
        <div class="card-hd"><div><h3>Funil agora</h3><div class="sub">Leads ativos por etapa</div></div></div>
        <div class="card-bd">
          ${a.chart.funil({items:va})}
          <div class="sep"></div>
          <button class="btn btn-block" data-act="nav" data-v="funil">Abrir funil completo <svg class="ic"><use href="#i-seta"/></svg></button>
        </div>
      </div>
    </div>

    <div class="grid g-2-1 mb">
      <div class="card">
        <div class="card-hd">
          <div><h3>Metas por vendedor</h3><div class="sub">${a.mesNomeLongo(e)}</div></div>
          <div class="right small">
            <span class="faint">Time:</span> <b>${d(a.money0(N))}</b>
            <span class="faint">/ ${d(a.money0(y))}</span>
            ${a.badge(a.pct(y?N/y*100:0,0),y&&N/y>=1?"b-ok":"b-warn")}
          </div>
        </div>
        <div class="card-bd">
          ${x.length?a.sortBy(x,"realizado","desc").map(n=>`
            <div class="meta-row">
              <div class="who"><span class="av-mini">${d(a.iniciais(n.v.nome))}</span><span style="overflow:hidden;text-overflow:ellipsis">${d(n.v.nome.split(" ")[0])}</span></div>
              <div class="bar"><i class="${n.pc>=100?"ok":n.pc>=60?"":n.pc>=30?"warn":"dang"}" style="width:${Math.min(n.pc,100)}%"></i></div>
              <div class="pc">${d(a.moneyK(n.realizado))}<br><span class="tiny faint">${a.dec(n.pc,0)}% da meta</span></div>
            </div>`).join(""):'<div class="empty-sm">Nenhum vendedor ativo.</div>'}
        </div>
      </div>

      <div class="card">
        <div class="card-hd"><div><h3>Follow-ups vencidos</h3><div class="sub">Leads parados ou com retorno atrasado</div></div></div>
        <div class="card-bd">
          ${J.length?J.map(n=>`
            <div class="att-item" tabindex="0" role="button" data-act="abrirLead" data-id="${d(n.id)}" style="cursor:pointer">
              <svg class="ic"><use href="#i-relogio"/></svg>
              <div class="txt"><b>${d(n.nome)}</b><small>${d(a.etapa(n.etapa).nome)} \xB7 ${d(a.vendNome(n.vendedorId).split(" ")[0])} \xB7 ${d(a.tempoRelativo(n.ultimoContato||n.criadoEm))}</small></div>
              <div class="val">${d(a.moneyK(n.valorEstimado))}</div>
            </div>`).join(""):'<div class="empty-sm">Tudo em dia. Nenhum follow-up vencido.</div>'}
        </div>
      </div>
    </div>

    <div class="grid g-3">
      <div class="card">
        <div class="card-hd"><div><h3>Propostas aguardando</h3><div class="sub">Enviadas e em negocia\xE7\xE3o</div></div></div>
        <div class="card-bd">
          ${H.length?H.map(n=>{const h=n.validade<a.hoje();return`<div class="att-item" tabindex="0" role="button" data-act="abrirOrc" data-id="${d(n.id)}" style="cursor:pointer">
              <svg class="ic"><use href="#i-orc"/></svg>
              <div class="txt"><b>#${n.numero} \xB7 ${d(a.trunc(n.clienteId?a.cliNome(n.clienteId):(a.lead(n.leadId)||{}).nome||"Sem cliente",24))}</b>
                <small>${h?'<span style="color:var(--dang);font-weight:700">Validade vencida</span>':"V\xE1lida at\xE9 "+a.dt(n.validade)}</small></div>
              <div class="val">${d(a.moneyK(a.orcTotal(n)))}</div>
            </div>`}).join(""):'<div class="empty-sm">Nenhuma proposta em aberto.</div>'}
        </div>
      </div>

      <div class="card">
        <div class="card-hd"><div><h3>Agenda de obras</h3><div class="sub">Pr\xF3ximas instala\xE7\xF5es</div></div></div>
        <div class="card-bd">
          ${Q.length?Q.map(n=>{const h=a.diasEntre(a.hoje(),n.dataAgendada);return`<div class="att-item" tabindex="0" role="button" data-act="abrirObra" data-id="${d(n.id)}" style="cursor:pointer">
              <svg class="ic"><use href="#i-obra"/></svg>
              <div class="txt"><b>${d(a.trunc(a.cliNome(n.clienteId),26))}</b><small>${d(a.STATUS_OBRA[n.status].nome)} \xB7 ${d(n.cidade||"")}</small></div>
              <div class="val">${h<0?'<span style="color:var(--dang)">atrasada</span>':h===0?"hoje":"em "+h+"d"}</div>
            </div>`}).join(""):'<div class="empty-sm">Nenhuma obra agendada.</div>'}
        </div>
      </div>

      ${r?`
      <div class="card">
        <div class="card-hd"><div><h3>Financeiro em atraso</h3><div class="sub">Vencidos e ainda em aberto</div></div></div>
        <div class="card-bd">
          ${X.length?X.map(n=>`
            <div class="att-item" tabindex="0" role="button" data-act="nav" data-v="financeiro" style="cursor:pointer">
              <svg class="ic" style="color:${n.tipo==="receber"?"var(--ok)":"var(--dang)"}"><use href="#i-fin"/></svg>
              <div class="txt"><b>${d(a.trunc(n.descricao,30))}</b><small>${n.tipo==="receber"?"A receber":"A pagar"} \xB7 venceu ${d(a.dt(n.vencimento))}</small></div>
              <div class="val" style="color:${n.tipo==="receber"?"var(--ok)":"var(--dang)"}">${d(a.moneyK(n.valor))}</div>
            </div>`).join(""):'<div class="empty-sm">Nada vencido. Muito bom.</div>'}
        </div>
      </div>`:`
      <div class="card">
        <div class="card-hd"><div><h3>P\xF3s-venda dos meus clientes</h3><div class="sub">Chamados em aberto</div></div></div>
        <div class="card-bd">
          ${Y.length?Y.map(n=>`
            <div class="att-item" tabindex="0" role="button" data-act="abrirChamado" data-id="${d(n.id)}" style="cursor:pointer">
              <svg class="ic"><use href="#i-suporte"/></svg>
              <div class="txt"><b>${d(a.trunc(a.cliNome(n.clienteId),26))}</b><small>${d(n.tipo)} \xB7 ${d(a.STATUS_CHAMADO[n.status].nome)}</small></div>
              <div class="val">${a.diasEntre(String(n.abertura).slice(0,10),a.hoje())}d</div>
            </div>`).join(""):'<div class="empty-sm">Nenhum chamado aberto nos seus clientes.</div>'}
        </div>
      </div>`}
    </div>`}});let E="";a.view("funil",{titulo:"Funil de vendas",sub:()=>{const e=a.escopo(a.where("leads",o=>a.ETAPAS_ATIVAS.includes(o.etapa)));return`${e.length} leads ativos \xB7 ${a.money0(a.soma(e,"valorEstimado"))} em potencial \xB7 arraste os cards entre as colunas`},render(){const e=a.ehGestor(),o=a.where("vendedores",i=>i.ativo),t=a.escopo(a.all("leads")),r=a.ETAPAS.map(i=>{let s=t.filter(g=>g.etapa===i.id&&(!E||g.vendedorId===E));s=a.sortBy(s,"atualizadoEm","desc");const c=s.length,m=a.soma(s,"valorEstimado"),v=i.id==="ganho"||i.id==="perdido"?12:40,l=s.slice(0,v),b=c-l.length;return`
      <section class="col" data-etapa="${i.id}">
        <div class="col-hd">
          <span class="nm">${d(i.nome)}</span>
          <span class="ct">${c}</span>
          <span class="vl">${d(a.moneyK(m))}</span>
        </div>
        <div class="col-bar" style="background:${i.cor}"></div>
        <div class="col-bd" data-drop="${i.id}">
          ${l.map(aa).join("")||'<div class="empty-sm" style="padding:16px 8px">Nenhum lead aqui.</div>'}
          ${b>0?`<button class="btn btn-sm btn-block" data-act="verEtapa" data-e="${i.id}">
            +${b} na lista completa</button>`:""}
        </div>
      </section>`}).join("");return`
      <div class="toolbar">
        ${e?`<div class="seg">
          <button class="${E?"":"on"}" data-act="funilVend" data-v="">Todos</button>
          ${o.map(i=>`<button class="${E===i.id?"on":""}" data-act="funilVend" data-v="${d(i.id)}">${d(i.nome.split(" ")[0])}</button>`).join("")}
        </div>`:'<span class="badge b-teal">Minha carteira</span>'}
        <div class="row-end row">
          <button class="btn" data-act="importarLeads"><svg class="ic"><use href="#i-importar"/></svg>Importar</button>
          <button class="btn" data-act="exportarLeads"><svg class="ic"><use href="#i-down"/></svg>Exportar CSV</button>
          <button class="btn btn-primary" data-act="novoLead"><svg class="ic"><use href="#i-plus"/></svg>Novo lead</button>
        </div>
      </div>
      <div class="funil">${r}</div>`},depois(e){ea(e)}});function aa(e){const o=a.etapa(e.etapa),t=a.leadAtrasado(e),r=e.produtoId?a.prodNome(e.produtoId):"";return`
  <article class="lead-card" draggable="true" data-id="${d(e.id)}" tabindex="0" role="button" data-act="abrirLead">
    <div class="lc-top">
      <div style="min-width:0;flex:1">
        <div class="nm">${d(e.nome)}</div>
        <div class="sub">${d([e.cidade,e.bairro].filter(Boolean).join(" \xB7 ")||a.fone(e.telefone))}</div>
      </div>
    </div>
    <div class="lc-mid">
      <span class="vl">${d(a.moneyK(e.valorEstimado))}</span>
      ${r?`<span class="badge b-teal">${d(a.trunc(r.replace("Piscina ",""),14))}</span>`:""}
    </div>
    <div class="lc-ft">
      <span class="av-mini" title="${d(a.vendNome(e.vendedorId))}">${d(a.iniciais(a.vendNome(e.vendedorId)))}</span>
      <span>${d(e.origem||"\u2014")}</span>
      <span class="tempo ${t?"quente":""}">
        <svg class="ic" style="width:12px;height:12px"><use href="#i-relogio"/></svg>
        ${d(a.tempoRelativo(e.ultimoContato||e.criadoEm))}
      </span>
    </div>
  </article>`}a.on("funilVend",e=>{E=e.v||"",a.render()}),a.on("verEtapa",e=>{u.etapa=e.e,u.q="",u.vend=E,u.origem="",a.resetPagina("leads"),a.ir("leads")});function ea(e){let o=null;e.querySelectorAll(".lead-card").forEach(t=>{t.addEventListener("dragstart",c=>{o=t,t.classList.add("dragging"),c.dataTransfer.effectAllowed="move";try{c.dataTransfer.setData("text/plain",t.dataset.id)}catch{}}),t.addEventListener("dragend",()=>{t.classList.remove("dragging"),e.querySelectorAll(".col").forEach(c=>c.classList.remove("drop")),o=null});let r=!1,i=null,s=null;t.addEventListener("touchstart",c=>{s=setTimeout(()=>{r=!0,t.classList.add("dragging")},220)},{passive:!0}),t.addEventListener("touchmove",c=>{if(!r){clearTimeout(s);return}c.preventDefault();const m=c.touches[0],v=document.elementFromPoint(m.clientX,m.clientY),l=v&&v.closest(".col");e.querySelectorAll(".col").forEach(b=>b.classList.toggle("drop",b===l)),i=l},{passive:!1}),t.addEventListener("touchend",()=>{clearTimeout(s),t.classList.remove("dragging"),e.querySelectorAll(".col").forEach(c=>c.classList.remove("drop")),r&&i&&q(t.dataset.id,i.dataset.etapa),r=!1,i=null})}),e.querySelectorAll(".col").forEach(t=>{t.addEventListener("dragover",r=>{r.preventDefault(),r.dataTransfer.dropEffect="move",t.classList.add("drop")}),t.addEventListener("dragleave",r=>{t.contains(r.relatedTarget)||t.classList.remove("drop")}),t.addEventListener("drop",r=>{r.preventDefault(),t.classList.remove("drop");const i=o&&o.dataset.id||r.dataTransfer.getData("text/plain");i&&q(i,t.dataset.etapa)})})}function q(e,o){const t=a.lead(e);if(!t||t.etapa===o)return;if(o==="ganho")return D(e);if(o==="perdido")return O(e);const r=a.etapa(t.etapa).nome;t.etapa=o,t.atualizadoEm=a.agora(),a.save("leads"),a.interagir(e,"Etapa",`Movido de "${r}" para "${a.etapa(o).nome}".`,"Sistema"),a.toast(`${t.nome.split(" ")[0]} \u2192 ${a.etapa(o).nome}`,"ok"),a.render()}a.moverLead=q;const u={q:"",etapa:"",vend:"",origem:"",ord:"atualizadoEm",dir:"desc"};let T=null,M="";a.prepararPaginaLeads=async()=>{if(a.driver.nome!=="supabase")return;await a.db.confirmar();const e=(a.PAGS.leads||{}).p||1,o=JSON.stringify([u,e,a.nuvem.epoca]);if(o===M)return;const t=await a.driver.paginaLeads(u,e);T=t,a.PAGS.leads={p:t.pagina},a.db.incorporar("leads",t.linhas),M=o},a.view("leads",{titulo:"Base de leads",sub:()=>`${T?T.total:a.escopo(a.all("leads")).length} leads${a.ehGestor()?" cadastrados":" na sua carteira"}`,render(){let e=a.escopo(a.all("leads")).slice();if(u.q){const s=a.norm(u.q);e=e.filter(c=>a.norm(c.nome).includes(s)||a.digitos(c.telefone).includes(a.digitos(u.q))||a.norm(c.email||"").includes(s)||a.norm(c.cidade||"").includes(s))}u.etapa&&(e=e.filter(s=>s.etapa===u.etapa)),u.vend&&(e=e.filter(s=>s.vendedorId===u.vend)),u.origem&&(e=e.filter(s=>s.origem===u.origem)),e=a.sortBy(e,u.ord,u.dir);const o=a.driver.nome==="supabase"&&T;o&&(e=o.linhas);const t=a.paginar("leads",e,60,o?o.total:void 0),r={},i=a.escopo(a.all("leads"));return a.ETAPAS.forEach(s=>r[s.id]=i.filter(c=>c.etapa===s.id).length),o&&a.ETAPAS.forEach(s=>r[s.id]=o.etapas[s.id]||0),`
      <div class="toolbar">
        <div class="mini-search">
          <svg class="ic"><use href="#i-busca"/></svg>
          <input class="inp" type="search" placeholder="Nome, telefone, e-mail ou cidade" value="${d(u.q)}" data-inp="buscaLead" aria-label="Buscar leads">
        </div>
        <select class="inp" style="width:auto" data-chg="filtroLead" data-f="etapa" aria-label="Etapa">
          <option value="">Todas as etapas</option>
          ${a.ETAPAS.map(s=>`<option value="${s.id}"${u.etapa===s.id?" selected":""}>${d(s.nome)} (${r[s.id]})</option>`).join("")}
        </select>
        ${a.ehGestor()?`<select class="inp" style="width:auto" data-chg="filtroLead" data-f="vend" aria-label="Vendedor">
          <option value="">Todos os vendedores</option>
          ${a.where("vendedores",s=>s.ativo).map(s=>`<option value="${s.id}"${u.vend===s.id?" selected":""}>${d(s.nome)}</option>`).join("")}
        </select>`:""}
        <select class="inp" style="width:auto" data-chg="filtroLead" data-f="origem" aria-label="Origem">
          <option value="">Todas as origens</option>
          ${a.ORIGENS.map(s=>`<option value="${d(s)}"${u.origem===s?" selected":""}>${d(s)}</option>`).join("")}
        </select>
        <div class="row-end row">
          <span class="small faint">${t.total} resultado(s) \xB7 ${a.money0(o?o.valor:a.soma(e,"valorEstimado"))}</span>
          <button class="btn" data-act="importarLeads"><svg class="ic"><use href="#i-importar"/></svg>Importar</button>
          <button class="btn" data-act="exportarLeads"><svg class="ic"><use href="#i-down"/></svg>CSV</button>
          <button class="btn btn-primary" data-act="novoLead"><svg class="ic"><use href="#i-plus"/></svg>Novo lead</button>
        </div>
      </div>

      <div class="card">
        ${e.length?a.tabela({act:"abrirLead",rows:t.linhas,cols:[{h:"Lead",r:s=>`<div class="strong">${d(s.nome)}</div><span class="mini">${d(a.fone(s.telefone))}${s.cidade?" \xB7 "+d(s.cidade):""}</span>`},{h:"Etapa",r:s=>{const c=a.etapa(s.etapa);return`<span class="badge" style="background:${c.cor}1f;color:${c.cor}"><span class="dt"></span>${d(c.nome)}</span>`}},{h:"Interesse",r:s=>s.produtoId?d(a.prodNome(s.produtoId)):'<span class="faint">\u2014</span>'},{h:"Origem",r:s=>`<span class="small">${d(s.origem||"\u2014")}</span>`},{h:"Vendedor",r:s=>`<span class="small">${d(a.vendNome(s.vendedorId).split(" ")[0])}</span>`},{h:"Valor",cls:"num",r:s=>`<b>${d(a.money0(s.valorEstimado))}</b>`},{h:"\xDAlt. contato",cls:"num",r:s=>a.leadAtrasado(s)?`<span class="small b" style="color:var(--dang)">${d(a.tempoRelativo(s.ultimoContato||s.criadoEm))}</span>`:`<span class="small">${d(a.tempoRelativo(s.ultimoContato||s.criadoEm))}</span>`}]})+t.html:a.vazio("Nenhum lead encontrado","Ajuste os filtros ou cadastre um novo lead.",{act:"novoLead",txt:"Novo lead"})}
      </div>`}}),a.on("buscaLead",a.debounce((e,o)=>{u.q=o.value,a.resetPagina("leads"),a.render()},250)),a.on("filtroLead",(e,o)=>{u[e.f]=o.value,a.resetPagina("leads"),a.render()});function oa(){return[{k:"id",t:"hidden"},{k:"nome",l:"Nome do lead",t:"text",col:7,req:!0,ph:"Nome completo ou raz\xE3o social"},{k:"telefone",l:"Telefone / WhatsApp",t:"tel",col:5,req:!0,ph:"(00) 00000-0000"},{k:"email",l:"E-mail",t:"email",col:7,ph:"nome@email.com"},{k:"origem",l:"Origem",t:"select",col:5,opts:a.ORIGENS,req:!0},{k:"cidade",l:"Cidade",t:"text",col:6},{k:"bairro",l:"Bairro",t:"text",col:6},{sep:"Qualifica\xE7\xE3o"},{k:"produtoId",l:"Modelo de interesse",t:"select",col:6,opts:a.where("produtos",e=>e.categoria==="Piscina"&&e.ativo).map(e=>({v:e.id,l:`${e.nome} \u2014 ${e.specs.compr}\xD7${e.specs.larg} m`}))},{k:"valorEstimado",l:"Valor estimado",t:"money",col:3,req:!0,val:"naoNegativo"},{k:"etapa",l:"Etapa",t:"select",col:3,vazio:!1,opts:a.ETAPAS.map(e=>({v:e.id,l:e.nome}))},{k:"vendedorId",l:"Vendedor respons\xE1vel",t:"select",col:6,req:!0,opts:a.where("vendedores",e=>e.ativo).map(e=>({v:e.id,l:e.nome}))},{k:"proximoContato",l:"Pr\xF3ximo contato",t:"date",col:6,hint:"Usado para avisar de follow-up vencido"},{k:"obs",l:"Observa\xE7\xF5es",t:"textarea",col:12,rows:3,ph:"Acesso ao terreno, expectativa de prazo, restri\xE7\xF5es\u2026"}]}a.on("novoLead",()=>j(null)),a.on("editarLead",e=>{a.closeTop(),j(a.lead(e.id))});function j(e){const o=!e,t=e||{etapa:"novo",vendedorId:(a.where("vendedores",r=>r.ativo)[0]||{}).id,origem:"Instagram"};a.modal({title:o?"Novo lead":"Editar lead",sub:o?"Cadastre o contato e ele entra no funil":t.nome,size:"lg",body:`<form data-sub="salvarLead" id="formLead">${a.form(oa(),t)}</form>`,actions:[{txt:o?"Cadastrar lead":"Salvar",cls:"btn-primary",act:"salvarLeadBtn"},{txt:"Cancelar",act:"fechar"}]})}a.on("salvarLeadBtn",(e,o)=>z(o.closest(".modal-box").querySelector("#formLead"))),a.on("salvarLead",(e,o)=>z(o));function z(e){const{ok:o,data:t}=a.lerForm(e);if(!o)return;const r=!t.id;r&&(t.criadoEm=a.agora(),t.interacoes=[{data:a.agora(),tipo:"Sistema",texto:"Lead cadastrado no sistema.",autor:"Sistema"}],t.ultimoContato="");const i=a.upsert("leads",t);a.closeTop(),a.toast(r?"Lead cadastrado":"Lead atualizado","ok"),a.render(),r&&A(i)}a.on("abrirLead",e=>A(e.id));function A(e){const o=a.lead(e);if(!o)return a.toast("Lead n\xE3o encontrado","err");const t=a.etapa(o.etapa),r=a.where("orcamentos",v=>v.leadId===e),i=(o.interacoes||[]).slice().reverse(),s=a.all("clientes").find(v=>v.leadId===e),c=`
    <div class="row mb" style="gap:7px">
      <span class="badge" style="background:${t.cor}1f;color:${t.cor}"><span class="dt"></span>${d(t.nome)}</span>
      ${a.leadAtrasado(o)?a.badge("Follow-up vencido","b-dang"):""}
      ${s?a.badge("J\xE1 \xE9 cliente","b-ok"):""}
    </div>

    <div class="card mb"><div class="card-bd">
      <dl class="dl">
        <dt>Telefone</dt><dd>${d(a.fone(o.telefone))}</dd>
        <dt>E-mail</dt><dd>${d(o.email||"\u2014")}</dd>
        <dt>Local</dt><dd>${d([o.bairro,o.cidade].filter(Boolean).join(" \u2014 ")||"\u2014")}</dd>
        <dt>Origem</dt><dd>${d(o.origem||"\u2014")}</dd>
        <dt>Interesse</dt><dd>${o.produtoId?d(a.prodNome(o.produtoId)):"\u2014"}</dd>
        <dt>Valor estimado</dt><dd><b>${d(a.money(o.valorEstimado))}</b></dd>
        <dt>Vendedor</dt><dd>${d(a.vendNome(o.vendedorId))}</dd>
        <dt>Cadastrado</dt><dd>${d(a.dt(String(o.criadoEm).slice(0,10)))} (${d(a.tempoRelativo(o.criadoEm))})</dd>
        <dt>Pr\xF3x. contato</dt><dd>${o.proximoContato?`<span class="${o.proximoContato<a.hoje()?"b":""}" style="${o.proximoContato<a.hoje()?"color:var(--dang)":""}">${d(a.dt(o.proximoContato))}</span>`:"\u2014"}</dd>
        ${o.motivoPerda?`<dt>Motivo da perda</dt><dd style="color:var(--dang)">${d(o.motivoPerda)}</dd>`:""}
      </dl>
      ${o.obs?`<div class="sep"></div><div class="small muted">${d(o.obs)}</div>`:""}
    </div></div>

    <div class="row mb" style="gap:8px">
      <button class="btn btn-sm btn-ok" data-act="waLead" data-id="${d(o.id)}" data-tipo="${r.length?"followup":"novo"}">
        <svg class="ic ic-sm"><use href="#i-wpp"/></svg>${r.length?"Follow-up no WhatsApp":"Abrir WhatsApp"}</button>
      <button class="btn btn-sm" data-act="interagirLead" data-id="${d(o.id)}" data-tipo="Liga\xE7\xE3o"><svg class="ic ic-sm"><use href="#i-relogio"/></svg>Liga\xE7\xE3o</button>
      <button class="btn btn-sm" data-act="interagirLead" data-id="${d(o.id)}" data-tipo="Visita"><svg class="ic ic-sm"><use href="#i-obra"/></svg>Visita</button>
      <button class="btn btn-sm" data-act="agendarLead" data-id="${d(o.id)}">Agendar retorno</button>
    </div>

    ${r.length?`
    <div class="card mb">
      <div class="card-hd"><div><h3>Or\xE7amentos</h3></div></div>
      <div class="card-bd" style="padding:0">
        ${a.tabela({act:"abrirOrc",rows:r,cols:[{h:"N\xBA",r:v=>`<b>#${v.numero}</b><span class="mini">${d(a.dt(v.data))}</span>`},{h:"Status",r:v=>a.badge(a.STATUS_ORC[v.status].nome,a.STATUS_ORC[v.status].cls)},{h:"Total",cls:"num",r:v=>`<b>${d(a.money(a.orcTotal(v)))}</b>`}]})}
      </div>
    </div>`:""}

    <div class="card">
      <div class="card-hd"><div><h3>Hist\xF3rico</h3><div class="sub">${a.plural(i.length,"intera\xE7\xE3o","intera\xE7\xF5es")}</div></div>
        <button class="btn btn-sm right" data-act="interagirLead" data-id="${d(o.id)}" style="margin-left:auto"><svg class="ic ic-sm"><use href="#i-plus"/></svg>Registrar</button>
      </div>
      <div class="card-bd">
        ${i.length?`<ul class="tl">${i.map(v=>`
          <li class="${v.tipo==="Sistema"||v.tipo==="Etapa"?"sys":""}">
            <div class="tl-hd"><b>${d(v.tipo)}</b><time>${d(a.dtHora(v.data))}</time><span class="tiny faint">${d(v.autor||"")}</span></div>
            <p>${d(v.texto)}</p>
          </li>`).join("")}</ul>`:'<div class="empty-sm">Nenhuma intera\xE7\xE3o registrada.</div>'}
      </div>
    </div>`,m=[];o.etapa!=="ganho"&&o.etapa!=="perdido"?(m.push({txt:"Criar or\xE7amento",cls:"btn-teal",ic:"i-orc",act:"orcDoLead",data:{id:o.id}}),m.push({txt:"Marcar ganho",cls:"btn-ok",ic:"i-check",act:"ganharLead",data:{id:o.id}}),m.push({txt:"Perdido",cls:"btn-dang",act:"perderLead",data:{id:o.id}})):o.etapa==="perdido"&&m.push({txt:"Reativar lead",cls:"btn-teal",act:"reativarLead",data:{id:o.id}}),m.push({txt:"Editar",ic:"i-edit",act:"editarLead",data:{id:o.id}}),m.push({txt:"Excluir",act:"excluirLead",data:{id:o.id}}),a.drawer({title:o.nome,sub:`${a.fone(o.telefone)} \xB7 ${o.origem||"origem n\xE3o informada"}`,body:c,actions:m,wide:!0})}a.abrirLead=A,a.on("interagirLead",async e=>{const o=e.tipo||await sa();if(!o)return;const t=await a.perguntar("O que aconteceu?",{title:`Registrar ${o.toLowerCase()}`,multi:!0});t&&(a.interagir(e.id,o,t),a.toast("Intera\xE7\xE3o registrada","ok"),a.closeAll(),A(e.id),a.pintarNav())});function sa(){return new Promise(e=>{const o=a.uid("ti");a.on(o,t=>{e(t.t),a.closeTop()}),a.modal({title:"Tipo de intera\xE7\xE3o",size:"sm",body:`<div class="pill-list">${["Liga\xE7\xE3o","WhatsApp","E-mail","Visita","Reuni\xE3o","Proposta","Outro"].map(t=>`<button class="chip" data-act="${o}" data-t="${d(t)}">${d(t)}</button>`).join("")}</div>`,onClose:()=>e(null)})})}a.on("agendarLead",async e=>{const o=await a.perguntar("Data do pr\xF3ximo contato",{title:"Agendar retorno",tipo:"date",valor:a.addDias(a.hoje(),3)});if(!o)return;const t=a.lead(e.id);t.proximoContato=o,a.save("leads"),a.interagir(e.id,"Agenda",`Retorno agendado para ${a.dt(o)}.`,"Sistema"),a.toast("Retorno agendado","ok"),a.closeAll(),A(e.id)}),a.on("ganharLead",e=>D(e.id)),a.on("perderLead",e=>O(e.id));function D(e){const o=a.lead(e);if(!o)return;const t=a.where("orcamentos",r=>r.leadId===e&&r.status==="aprovado");a.confirmar(`Marcar "${o.nome}" como GANHO?`,{title:"Venda fechada",okTxt:"Sim, fechou!",aviso:t.length?"":"Esse lead ainda n\xE3o tem or\xE7amento aprovado. Voc\xEA poder\xE1 criar o pedido depois, pelo or\xE7amento."}).then(r=>{r&&(o.etapa="ganho",o.atualizadoEm=a.agora(),a.save("leads"),a.interagir(e,"Ganho","Venda fechada.","Sistema"),a.all("clientes").some(i=>i.leadId===e)||ta(o),a.toast("Parab\xE9ns! Venda registrada.","ok"),a.closeAll(),a.render())})}function ta(e){a.upsert("clientes",{nome:e.nome,doc:"",tipo:"PF",telefone:e.telefone,email:e.email||"",cep:"",endereco:"",bairro:e.bairro||"",cidade:e.cidade||"",uf:"",leadId:e.id,obs:e.obs||"",criadoEm:a.agora()})}function O(e){const o=a.lead(e);if(!o)return;const t=a.uid("mp");a.on(t,(r,i)=>{const s=i.closest(".modal-box"),c=s.querySelector('[data-k="motivoPerda"]').value,m=s.querySelector('[data-k="detalhe"]').value.trim();if(!c){a.toast("Escolha o motivo","err");return}o.etapa="perdido",o.motivoPerda=c,o.atualizadoEm=a.agora(),a.save("leads"),a.interagir(e,"Perdido",c+(m?" \u2014 "+m:""),"Sistema"),a.closeAll(),a.toast("Lead marcado como perdido"),a.render()}),a.modal({title:"Marcar como perdido",sub:o.nome,size:"sm",body:a.form([{k:"motivoPerda",l:"Motivo",t:"select",col:12,opts:a.MOTIVOS_PERDA,req:!0},{k:"detalhe",l:"Detalhe (opcional)",t:"textarea",col:12,rows:3,ph:"O que pesou na decis\xE3o?"}],{}),actions:[{txt:"Confirmar perda",cls:"btn-dang",act:t},{txt:"Cancelar",act:"fechar"}]})}a.on("reativarLead",e=>{const o=a.lead(e.id);o.etapa="contato",o.motivoPerda="",o.proximoContato=a.addDias(a.hoje(),2),o.atualizadoEm=a.agora(),a.save("leads"),a.interagir(e.id,"Etapa","Lead reativado e devolvido ao funil.","Sistema"),a.toast("Lead reativado","ok"),a.closeAll(),a.render()}),a.on("excluirLead",async e=>{const o=a.lead(e.id);await a.confirmarExclusao("lead",e.id,o.nome,{alternativa:"Se a venda n\xE3o andou, marque o lead como perdido em vez de apagar \u2014 o hist\xF3rico vira informa\xE7\xE3o para os relat\xF3rios."})&&(a.desvincular("lead",e.id),a.remove("leads",e.id),a.closeAll(),a.toast("Lead exclu\xEDdo"),a.render())}),a.on("exportarLeads",()=>{const e=[["Nome","Telefone","E-mail","Cidade","Bairro","Origem","Etapa","Interesse","Valor estimado","Vendedor","\xDAltimo contato","Pr\xF3ximo contato","Motivo perda","Observa\xE7\xF5es"]];a.all("leads").forEach(o=>e.push([o.nome,o.telefone,o.email||"",o.cidade||"",o.bairro||"",o.origem||"",a.etapa(o.etapa).nome,o.produtoId?a.prodNome(o.produtoId):"",a.dec(o.valorEstimado),a.vendNome(o.vendedorId),a.dt(o.ultimoContato),a.dt(o.proximoContato),o.motivoPerda||"",(o.obs||"").replace(/\n/g," ")])),a.baixar(`leads-${a.hoje()}.csv`,a.csv(e),"text/csv;charset=utf-8"),a.toast("CSV exportado","ok")});const B=[{k:"nome",l:"Nome",dicas:["nome","cliente","contato","lead","name","full name"]},{k:"telefone",l:"Telefone",dicas:["telefone","fone","celular","whatsapp","tel","phone"]},{k:"email",l:"E-mail",dicas:["email","e-mail","mail"]},{k:"cidade",l:"Cidade",dicas:["cidade","municipio","city"]},{k:"bairro",l:"Bairro",dicas:["bairro","regiao"]},{k:"origem",l:"Origem",dicas:["origem","fonte","canal","source"]},{k:"produtoId",l:"Modelo de interesse",dicas:["modelo","produto","piscina","interesse"]},{k:"valorEstimado",l:"Valor estimado",dicas:["valor","estimado","ticket","orcamento","preco"]},{k:"obs",l:"Observa\xE7\xF5es",dicas:["obs","observacao","anotacao","mensagem","comentario","nota"]}];function S(e,o){const t=[];let r="",i=!1;for(let s=0;s<e.length;s++){const c=e[s];c==='"'?i&&e[s+1]==='"'?(r+='"',s++):i=!i:c===o&&!i?(t.push(r),r=""):r+=c}return t.push(r),t.map(s=>s.trim())}function da(e){const t=e.replace(/^﻿/,"").replace(/\r\n?/g,`
`).split(`
`).filter(m=>m.trim());if(!t.length)return{cabecalho:[],dados:[]};const i=[";",",","	"].reduce((m,v)=>S(t[0],v).length>S(t[0],m).length?v:m,";"),s=S(t[0],i),c=t.slice(1).map(m=>S(m,i)).filter(m=>m.some(v=>v));return{cabecalho:s,dados:c,sep:i}}let f=null;a.on("importarLeads",()=>{f=null,a.modal({title:"Importar leads",sub:"Traga sua planilha de contatos para dentro do funil",size:"lg",body:`
      <label class="drop-zone" id="impDrop">
        <svg class="ic"><use href="#i-importar"/></svg>
        <div><b>Escolha um arquivo CSV</b></div>
        <div class="small muted" style="margin-top:4px">No Excel ou Google Planilhas use <b>Salvar como \u2192 CSV</b>. Separador por ponto e v\xEDrgula ou v\xEDrgula, tanto faz.</div>
        <input type="file" accept=".csv,text/csv,text/plain" style="display:none" data-chg="impArquivo">
      </label>
      <div class="alert a-info mt"><svg class="ic"><use href="#i-alerta"/></svg>
        <div class="small">A primeira linha precisa ser o cabe\xE7alho com os nomes das colunas. O sistema tenta adivinhar o que \xE9 cada coluna e voc\xEA confere antes de importar.</div></div>`,actions:[{txt:"Cancelar",act:"fechar"}]})}),a.on("impArquivo",(e,o)=>{const t=o.files&&o.files[0];if(!t)return;const r=new FileReader;r.onload=()=>{const{cabecalho:i,dados:s}=da(String(r.result));if(!i.length||!s.length){a.toast("Arquivo vazio ou sem linhas de dados","err");return}if(s.length>2e3){a.toast("Limite de 2000 linhas por importa\xE7\xE3o","err");return}const c={};B.forEach(m=>{const v=i.findIndex(l=>m.dicas.some(b=>a.norm(l).includes(b)));v>=0&&!Object.values(c).includes(v)&&(c[m.k]=v)}),f={cabecalho:i,dados:s,mapa:c},a.closeTop(),ia()},r.onerror=()=>a.toast("N\xE3o foi poss\xEDvel ler o arquivo","err"),r.readAsText(t,"UTF-8")});function ia(){const e=a.where("vendedores",o=>o.ativo);a.modal({title:"Conferir colunas",sub:`${f.dados.length} linha(s) encontradas em ${f.cabecalho.length} coluna(s)`,size:"xl",body:`
      <div class="grid g-2">
        <div class="card"><div class="card-hd"><div><h3>De \u2192 para</h3><div class="sub">Confira o que o sistema adivinhou</div></div></div>
          <div class="card-bd">
            ${B.map(o=>`
              <div class="imp-map">
                <div class="de">${d(o.l)}${o.k==="nome"?' <span style="color:var(--dang)">*</span>':""}</div>
                <div class="seta"><svg class="ic ic-sm"><use href="#i-seta"/></svg></div>
                <select class="inp" data-chg="impMapa" data-k="${d(o.k)}" aria-label="Coluna para ${d(o.l)}">
                  <option value="">\u2014 n\xE3o importar \u2014</option>
                  ${f.cabecalho.map((t,r)=>`<option value="${r}"${f.mapa[o.k]===r?" selected":""}>${d(t||"coluna "+(r+1))}</option>`).join("")}
                </select>
              </div>`).join("")}
          </div>
        </div>
        <div class="stack">
          <div class="card"><div class="card-hd"><div><h3>Padr\xF5es</h3><div class="sub">Aplicados a todos os leads importados</div></div></div>
            <div class="card-bd">
              <div class="fgrid">
                <div class="f f-12"><label for="impVend">Vendedor respons\xE1vel</label>
                  <select class="inp" id="impVend">${e.map(o=>`<option value="${o.id}"${o.id===(a.vendedorAtual()||"")?" selected":""}>${d(o.nome)}</option>`).join("")}</select></div>
                <div class="f f-6"><label for="impOrigem">Origem padr\xE3o</label>
                  <select class="inp" id="impOrigem">${a.ORIGENS.map(o=>`<option value="${d(o)}">${d(o)}</option>`).join("")}</select>
                  <span class="hint">Usada quando a planilha n\xE3o trouxer origem</span></div>
                <div class="f f-6"><label for="impEtapa">Etapa inicial</label>
                  <select class="inp" id="impEtapa">${a.ETAPAS.filter(o=>a.ETAPAS_ATIVAS.includes(o.id)).map(o=>`<option value="${o.id}">${d(o.nome)}</option>`).join("")}</select></div>
                <div class="f f-12"><label class="check"><input type="checkbox" id="impDedupe" checked>
                  <span>Ignorar contatos cujo telefone j\xE1 existe na base</span></label></div>
              </div>
            </div>
          </div>
          <div class="card"><div class="card-hd"><div><h3>Pr\xE9via</h3><div class="sub">Primeiras 5 linhas como ser\xE3o gravadas</div></div></div>
            <div class="card-bd" id="impPrevia">${R()}</div>
          </div>
        </div>
      </div>`,actions:[{txt:`Importar ${f.dados.length} lead(s)`,cls:"btn-primary",ic:"i-importar",act:"impConfirmar"},{txt:"Cancelar",act:"fechar"}]})}function $(e,o){const t=f.mapa[o];return t==null?"":(e[t]||"").trim()}function R(){const e=f.dados.slice(0,5);return e.length?a.tabela({rows:e.map((o,t)=>({id:"p"+t,l:o})),cols:[{h:"Nome",r:o=>`<span class="strong">${d($(o.l,"nome")||"\u2014 vazio \u2014")}</span>`},{h:"Telefone",r:o=>`<span class="small">${d(a.fone($(o.l,"telefone")))}</span>`},{h:"Cidade",r:o=>`<span class="small">${d($(o.l,"cidade")||"\u2014")}</span>`},{h:"Valor",cls:"num",r:o=>d(a.money0(a.parseMoney($(o.l,"valorEstimado"))))}]}):'<div class="empty-sm">Sem linhas.</div>'}a.on("impMapa",(e,o)=>{f.mapa[e.k]=o.value===""?void 0:a.n(o.value);const t=document.getElementById("impPrevia");t&&(t.innerHTML=R())}),a.on("impConfirmar",async(e,o)=>{const t=o.closest(".modal-box"),r=t.querySelector("#impVend").value,i=t.querySelector("#impOrigem").value,s=t.querySelector("#impEtapa").value,c=t.querySelector("#impDedupe").checked;if(f.mapa.nome===void 0)return a.toast("A coluna de nome \xE9 obrigat\xF3ria","err");const m=new Set(a.all("leads").map(p=>a.digitos(p.telefone)).filter(Boolean)),v=a.where("produtos",p=>p.categoria==="Piscina");let l=0,b=0,g=0;f.dados.forEach(p=>{const L=$(p,"nome");if(!L){g++;return}const I=$(p,"telefone"),k=a.digitos(I);if(c&&k&&m.has(k)){b++;return}k&&m.add(k);const P=a.norm($(p,"produtoId")),C=P?v.find(y=>a.norm(y.nome).includes(P)||P.includes(a.norm(y.nome.replace("Piscina ","")))):null,x=a.parseMoney($(p,"valorEstimado"));a.upsert("leads",{nome:L,telefone:I,email:$(p,"email"),cidade:$(p,"cidade"),bairro:$(p,"bairro"),origem:$(p,"origem")||i,produtoId:C?C.id:"",valorEstimado:x||(C?a.n(C.preco):0),etapa:s,vendedorId:r,obs:$(p,"obs"),proximoContato:a.addDias(a.hoje(),1),ultimoContato:"",criadoEm:a.agora(),interacoes:[{data:a.agora(),tipo:"Sistema",texto:"Lead importado de planilha.",autor:a.usuario().nome}]}),l++}),a.closeTop(),f=null,a.toast(`${l} lead(s) importado(s)`,"ok"),(b||g)&&a.modal({title:"Importa\xE7\xE3o conclu\xEDda",size:"sm",body:`<dl class="dl">
        <dt>Importados</dt><dd><b style="color:var(--ok)">${l}</b></dd>
        ${b?`<dt>Duplicados</dt><dd>${b} <span class="faint small">(telefone j\xE1 existia)</span></dd>`:""}
        ${g?`<dt>Ignorados</dt><dd>${g} <span class="faint small">(linha sem nome)</span></dd>`:""}
      </dl>`,actions:[{txt:"Ver no funil",cls:"btn-primary",act:"alertaIr",data:{a:"nav",v:"funil"}},{txt:"Fechar",act:"fechar"}]}),a.render()});const w={q:""};a.view("clientes",{titulo:"Clientes",sub:()=>`${a.clientesVisiveis().length} clientes${a.ehGestor()?" na base":" seus"}`,render(){let e=a.clientesVisiveis().slice();if(w.q){const i=a.norm(w.q);e=e.filter(s=>a.norm(s.nome).includes(i)||a.digitos(s.telefone).includes(a.digitos(w.q))||a.norm(s.cidade||"").includes(i)||a.digitos(s.doc).includes(a.digitos(w.q)))}const o=e.map(i=>{const s=a.where("pedidos",c=>c.clienteId===i.id&&c.status!=="cancelado");return{id:i.id,c:i,peds:s,total:a.soma(s,a.pedidoTotal)}}),t=a.soma(o,"total"),r=a.paginar("clientes",o);return`
      <div class="kpis mb">
        ${a.kpi({cls:"k-teal",lbl:"Clientes",val:String(o.length)})}
        ${a.kpi({lbl:"Faturamento acumulado",val:a.money0(t),sm:!0})}
        ${a.kpi({lbl:"Ticket m\xE9dio",val:a.money0(o.length?t/Math.max(a.soma(o,i=>i.peds.length),1):0),sm:!0})}
        ${a.kpi({cls:"k-ocre",lbl:"Recompra",val:String(o.filter(i=>i.peds.length>1).length),foot:"clientes com 2+ pedidos"})}
      </div>

      <div class="toolbar">
        <div class="mini-search">
          <svg class="ic"><use href="#i-busca"/></svg>
          <input class="inp" type="search" placeholder="Nome, documento, telefone ou cidade" value="${d(w.q)}" data-inp="buscaCli" aria-label="Buscar clientes">
        </div>
        <div class="row-end row">
          <button class="btn" data-act="exportarClientes"><svg class="ic"><use href="#i-down"/></svg>CSV</button>
          <button class="btn btn-primary" data-act="novoCliente"><svg class="ic"><use href="#i-plus"/></svg>Novo cliente</button>
        </div>
      </div>

      <div class="card">
        ${o.length?a.tabela({act:"abrirCliente",rows:r.linhas,idKey:"id",cols:[{h:"Cliente",r:i=>`<div class="strong">${d(i.c.nome)}</div><span class="mini">${d(i.c.doc?a.doc(i.c.doc):i.c.tipo==="PJ"?"CNPJ n\xE3o informado":"CPF n\xE3o informado")}</span>`},{h:"Contato",r:i=>`<span class="small">${d(a.fone(i.c.telefone))}</span><span class="mini">${d(i.c.email||"")}</span>`},{h:"Cidade",r:i=>`<span class="small">${d([i.c.cidade,i.c.uf].filter(Boolean).join("/")||"\u2014")}</span>`},{h:"Pedidos",cls:"num",r:i=>String(i.peds.length)},{h:"Total comprado",cls:"num",r:i=>`<b>${d(a.money0(i.total))}</b>`},{h:"Cliente desde",cls:"num",r:i=>`<span class="small">${d(a.dt(String(i.c.criadoEm).slice(0,10)))}</span>`}]})+r.html:a.vazio("Nenhum cliente ainda","Clientes s\xE3o criados automaticamente quando um lead \xE9 marcado como ganho.",{act:"novoCliente",txt:"Cadastrar cliente"})}
      </div>`}}),a.on("buscaCli",a.debounce((e,o)=>{w.q=o.value,a.resetPagina("clientes"),a.render()},250));function na(){return[{k:"id",t:"hidden"},{k:"nome",l:"Nome / Raz\xE3o social",t:"text",col:8,req:!0},{k:"tipo",l:"Tipo",t:"select",col:4,vazio:!1,opts:[{v:"PF",l:"Pessoa f\xEDsica"},{v:"PJ",l:"Pessoa jur\xEDdica"}]},{k:"doc",l:"CPF / CNPJ",t:"text",col:4,val:"doc",hint:"Conferimos o d\xEDgito verificador"},{k:"telefone",l:"Telefone",t:"tel",col:4,req:!0},{k:"email",l:"E-mail",t:"email",col:4},{sep:"Endere\xE7o de instala\xE7\xE3o"},{k:"cep",l:"CEP",t:"text",col:3,val:"cep"},{k:"endereco",l:"Logradouro e n\xFAmero",t:"text",col:9},{k:"bairro",l:"Bairro",t:"text",col:5},{k:"cidade",l:"Cidade",t:"text",col:5},{k:"uf",l:"UF",t:"text",col:2,val:"uf"},{k:"obs",l:"Observa\xE7\xF5es",t:"textarea",col:12,rows:2,ph:"Acesso para m\xE1quina, restri\xE7\xF5es do condom\xEDnio\u2026"}]}a.on("novoCliente",()=>F(null)),a.on("editarCliente",e=>{a.closeTop(),F(a.cli(e.id))});function F(e){const o=!e;a.modal({title:o?"Novo cliente":"Editar cliente",size:"lg",body:`<form data-sub="salvarCliente" id="formCli">${a.form(na(),e||{tipo:"PF",uf:"PR"})}</form>`,actions:[{txt:"Salvar",cls:"btn-primary",act:"salvarClienteBtn"},{txt:"Cancelar",act:"fechar"}]})}a.on("salvarClienteBtn",(e,o)=>U(o.closest(".modal-box").querySelector("#formCli"))),a.on("salvarCliente",(e,o)=>U(o));function U(e){const{ok:o,data:t}=a.lerForm(e);o&&(t.id||(t.criadoEm=a.agora()),a.upsert("clientes",t),a.closeTop(),a.toast("Cliente salvo","ok"),a.render())}a.on("abrirCliente",e=>_(e.id));function _(e){const o=a.cli(e);if(!o)return a.toast("Cliente n\xE3o encontrado","err");const t=a.where("pedidos",l=>l.clienteId===e),r=a.where("orcamentos",l=>l.clienteId===e),i=a.where("obras",l=>l.clienteId===e),s=a.where("financeiro",l=>l.clienteId===e&&l.tipo==="receber"),c=a.soma(s.filter(l=>l.status==="aberto"),"valor"),m=a.soma(s.filter(l=>l.status==="pago"),"valor"),v=`
    <div class="kpis mb">
      ${a.kpi({cls:"k-teal",lbl:"Total comprado",val:a.money0(a.soma(t.filter(l=>l.status!=="cancelado"),a.pedidoTotal)),sm:!0})}
      ${a.kpi({cls:"k-ok",lbl:"J\xE1 pago",val:a.money0(m),sm:!0})}
      ${a.kpi({cls:c?"k-warn":"",lbl:"Em aberto",val:a.money0(c),sm:!0})}
    </div>

    <div class="card mb"><div class="card-bd">
      <dl class="dl">
        <dt>${o.tipo==="PJ"?"CNPJ":"CPF"}</dt><dd>${d(o.doc?a.doc(o.doc):"\u2014")}</dd>
        <dt>Telefone</dt><dd>${d(a.fone(o.telefone))}</dd>
        <dt>E-mail</dt><dd>${d(o.email||"\u2014")}</dd>
        <dt>Endere\xE7o</dt><dd>${d([o.endereco,o.bairro].filter(Boolean).join(" \u2014 ")||"\u2014")}</dd>
        <dt>Cidade</dt><dd>${d([o.cidade,o.uf].filter(Boolean).join("/")||"\u2014")}${o.cep?" \xB7 CEP "+d(a.cep(o.cep)):""}</dd>
        <dt>Cliente desde</dt><dd>${d(a.dt(String(o.criadoEm).slice(0,10)))}</dd>
      </dl>
      ${o.obs?`<div class="sep"></div><div class="small muted">${d(o.obs)}</div>`:""}
    </div></div>

    <div class="card mb">
      <div class="card-hd"><div><h3>Pedidos</h3></div></div>
      ${t.length?a.tabela({act:"abrirPedido",rows:t,cols:[{h:"N\xBA",r:l=>`<b>#${l.numero}</b><span class="mini">${d(a.dt(l.data))}</span>`},{h:"Status",r:l=>a.badge(a.statusPedidoNome(l.status),a.statusPedidoCls(l.status))},{h:"Total",cls:"num",r:l=>`<b>${d(a.money(a.pedidoTotal(l)))}</b>`}]}):'<div class="empty-sm">Nenhum pedido.</div>'}
    </div>

    <div class="card mb">
      <div class="card-hd"><div><h3>Or\xE7amentos</h3></div></div>
      ${r.length?a.tabela({act:"abrirOrc",rows:r,cols:[{h:"N\xBA",r:l=>`<b>#${l.numero}</b><span class="mini">${d(a.dt(l.data))}</span>`},{h:"Status",r:l=>a.badge(a.STATUS_ORC[l.status].nome,a.STATUS_ORC[l.status].cls)},{h:"Total",cls:"num",r:l=>d(a.money(a.orcTotal(l)))}]}):'<div class="empty-sm">Nenhum or\xE7amento.</div>'}
    </div>

    <div class="card mb">
      <div class="card-hd"><div><h3>Obras</h3></div></div>
      ${i.length?a.tabela({act:"abrirObra",rows:i,cols:[{h:"Endere\xE7o",r:l=>`<span class="small">${d(a.trunc(l.endereco||"\u2014",34))}</span>`},{h:"Status",r:l=>a.badge(a.STATUS_OBRA[l.status].nome,a.STATUS_OBRA[l.status].cls)},{h:"Agendada",cls:"num",r:l=>d(a.dt(l.dataAgendada))}]}):'<div class="empty-sm">Nenhuma obra.</div>'}
    </div>

    <div class="card">
      <div class="card-hd"><div><h3>Financeiro</h3><div class="sub">Lan\xE7amentos a receber</div></div></div>
      ${s.length?a.tabela({rows:a.sortBy(s,"vencimento"),cols:[{h:"Descri\xE7\xE3o",r:l=>`<span class="small">${d(l.descricao)}</span>`},{h:"Vencimento",r:l=>`<span class="small ${l.status==="aberto"&&l.vencimento<a.hoje()?"b":""}" style="${l.status==="aberto"&&l.vencimento<a.hoje()?"color:var(--dang)":""}">${d(a.dt(l.vencimento))}</span>`},{h:"Status",r:l=>a.badge(l.status==="pago"?"Pago":"Aberto",l.status==="pago"?"b-ok":l.vencimento<a.hoje()?"b-dang":"b-warn")},{h:"Valor",cls:"num",r:l=>d(a.money(l.valor))}]}):'<div class="empty-sm">Nenhum lan\xE7amento.</div>'}
    </div>`;a.drawer({title:o.nome,sub:`${a.fone(o.telefone)}${o.cidade?" \xB7 "+o.cidade:""}`,body:v,wide:!0,actions:[{txt:"WhatsApp",cls:"btn-ok",ic:"i-wpp",act:"waCliente",data:{id:o.id}},{txt:"Novo or\xE7amento",cls:"btn-teal",ic:"i-orc",act:"orcDoCliente",data:{id:o.id}},{txt:"Contrato de manuten\xE7\xE3o",ic:"i-contrato",act:"contratoDoCliente",data:{id:o.id}},{txt:"Abrir chamado",ic:"i-suporte",act:"chamadoDoCliente",data:{id:o.id}},{txt:"Editar",ic:"i-edit",act:"editarCliente",data:{id:o.id}},a.ehGestor()?{txt:"Excluir",act:"excluirCliente",data:{id:o.id}}:null].filter(Boolean)})}a.abrirCliente=_,a.on("excluirCliente",async e=>{const o=a.cli(e.id);await a.confirmarExclusao("cliente",e.id,o.nome)&&(a.desvincular("cliente",e.id),a.remove("clientes",e.id),a.closeAll(),a.toast("Cliente exclu\xEDdo"),a.render())}),a.on("exportarClientes",()=>{const e=[["Nome","Tipo","Documento","Telefone","E-mail","CEP","Endere\xE7o","Bairro","Cidade","UF","Pedidos","Total comprado","Cliente desde"]];a.all("clientes").forEach(o=>{const t=a.where("pedidos",r=>r.clienteId===o.id&&r.status!=="cancelado");e.push([o.nome,o.tipo,o.doc,o.telefone,o.email||"",o.cep||"",o.endereco||"",o.bairro||"",o.cidade||"",o.uf||"",t.length,a.dec(a.soma(t,a.pedidoTotal)),a.dt(String(o.criadoEm).slice(0,10))])}),a.baixar(`clientes-${a.hoje()}.csv`,a.csv(e),"text/csv;charset=utf-8"),a.toast("CSV exportado","ok")}),a.view("vendedores",{titulo:"Equipe de vendas",sub:()=>`${a.where("vendedores",e=>e.ativo).length} vendedores ativos \xB7 metas e desempenho do m\xEAs`,render(){const e=a.mesKey(a.hoje()),o=a.sortBy(a.metasDoMes(e),"realizado","desc"),r=a.all("equipes").map(s=>{const c=o.filter(m=>m.v.equipeId===s.id);return{eq:s,realizado:a.soma(c,"realizado"),meta:a.soma(c,"meta"),qtd:a.soma(c,"qtd")}}),i=a.all("vendedores").map(s=>{const c=o.find(p=>p.v.id===s.id)||{realizado:0,meta:a.n(s.meta),qtd:0,pc:0},m=a.where("leads",p=>p.vendedorId===s.id&&a.ETAPAS_ATIVAS.includes(p.etapa)),v=a.where("leads",p=>p.vendedorId===s.id&&p.etapa==="ganho").length,l=a.where("leads",p=>p.vendedorId===s.id&&p.etapa==="perdido").length,b=v+l?v/(v+l)*100:0,g=a.soma(a.where("comissoes",p=>p.vendedorId===s.id&&p.competencia===e),"valor");return{id:s.id,v:s,m:c,leadsAtivos:m.length,pipeline:a.soma(m,"valorEstimado"),conv:b,comis:g}});return`
      <div class="grid g-2 mb">
        <div class="card">
          <div class="card-hd"><div><h3>Ranking do m\xEAs</h3><div class="sub">${a.mesNomeLongo(e)}</div></div></div>
          <div class="card-bd">
            ${o.length?o.map((s,c)=>`
              <div class="meta-row">
                <div class="who">
                  <span style="width:19px;font-weight:800;color:${c===0?"var(--ocre)":"var(--t-faint)"};font-size:13px">${c+1}\xBA</span>
                  <span class="av-mini">${d(a.iniciais(s.v.nome))}</span>
                  <span style="overflow:hidden;text-overflow:ellipsis">${d(s.v.nome.split(" ")[0])}</span>
                </div>
                <div class="bar"><i class="${s.pc>=100?"ok":s.pc>=60?"":s.pc>=30?"warn":"dang"}" style="width:${Math.min(s.pc,100)}%"></i></div>
                <div class="pc">${d(a.moneyK(s.realizado))}<br><span class="tiny faint">${a.dec(s.pc,0)}%</span></div>
              </div>`).join(""):'<div class="empty-sm">Sem vendedores ativos.</div>'}
          </div>
        </div>
        <div class="card">
          <div class="card-hd"><div><h3>Equipes</h3><div class="sub">Realizado x meta consolidados</div></div>
            <button class="btn btn-sm" data-act="novaEquipe" style="margin-left:auto"><svg class="ic ic-sm"><use href="#i-plus"/></svg>Equipe</button>
          </div>
          <div class="card-bd">
            ${r.length?r.map(s=>`
              <div class="meta-row">
                <div class="who"><span style="overflow:hidden;text-overflow:ellipsis">${d(s.eq.nome)}</span></div>
                <div class="bar"><i class="${s.meta&&s.realizado/s.meta>=1?"ok":"warn"}" style="width:${Math.min(s.meta?s.realizado/s.meta*100:0,100)}%"></i></div>
                <div class="pc">${d(a.moneyK(s.realizado))}<br><span class="tiny faint">de ${d(a.moneyK(s.meta))}</span></div>
              </div>`).join(""):'<div class="empty-sm">Nenhuma equipe cadastrada.</div>'}
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-hd">
          <div><h3>Vendedores</h3><div class="sub">Clique para editar meta, comiss\xE3o e dados</div></div>
          <button class="btn btn-primary right" data-act="novoVendedor" style="margin-left:auto"><svg class="ic"><use href="#i-plus"/></svg>Novo vendedor</button>
        </div>
        ${a.tabela({act:"editarVendedor",rows:i,idKey:"id",cols:[{h:"Vendedor",r:s=>`<div class="row" style="gap:9px;flex-wrap:nowrap"><span class="av-mini">${d(a.iniciais(s.v.nome))}</span><div><div class="strong">${d(s.v.nome)}</div><span class="mini">${d(s.v.cargo||"")}${s.v.ativo?"":" \xB7 INATIVO"}</span></div></div>`},{h:"Equipe",r:s=>`<span class="small">${d((a.find("equipes",s.v.equipeId)||{}).nome||"\u2014")}</span>`},{h:"Meta",cls:"num",r:s=>d(a.money0(s.m.meta))},{h:"Realizado",cls:"num",r:s=>`<b>${d(a.money0(s.m.realizado))}</b><span class="mini">${a.dec(s.m.pc,0)}% \xB7 ${s.m.qtd} pedido(s)</span>`},{h:"Pipeline",cls:"num",r:s=>`${d(a.money0(s.pipeline))}<span class="mini">${s.leadsAtivos} lead(s)</span>`},{h:"Convers\xE3o",cls:"num",r:s=>a.badge(a.pct(s.conv,0),s.conv>=50?"b-ok":s.conv>=30?"b-warn":"b-dang")},{h:"Comiss\xE3o m\xEAs",cls:"num",r:s=>d(a.money0(s.comis))}]})}
      </div>

      ${a.ehAdmin()?`
      <div class="card mt">
        <div class="card-hd">
          <div><h3>Acessos ao sistema</h3><div class="sub">Quem entra, com qual papel e vendo o qu\xEA</div></div>
          <button class="btn btn-primary right" data-act="novoUsuario" style="margin-left:auto"><svg class="ic"><use href="#i-plus"/></svg>Novo usu\xE1rio</button>
        </div>
        ${a.tabela({act:"editarUsuario",rows:a.all("usuarios"),cols:[{h:"Usu\xE1rio",r:s=>`<div class="row" style="gap:9px;flex-wrap:nowrap"><span class="av-mini">${d(a.iniciais(s.nome))}</span><div><div class="strong">${d(s.nome)}</div><span class="mini">${d(s.login)}</span></div></div>`},{h:"Papel",r:s=>a.badge(a.PAPEIS[s.papel]?a.PAPEIS[s.papel].nome:s.papel,s.papel==="admin"?"b-ink":s.papel==="gerente"?"b-teal":s.papel==="obra"?"b-areia":"b-info")},{h:"Enxerga",r:s=>`<span class="small">${d(a.PAPEIS[s.papel]?a.PAPEIS[s.papel].desc:"")}</span>`},{h:"Vendedor",r:s=>`<span class="small">${s.vendedorId?d(a.vendNome(s.vendedorId)):'<span class="faint">\u2014</span>'}</span>`},{h:"Situa\xE7\xE3o",r:s=>a.badge(s.ativo?"Ativo":"Inativo",s.ativo?"b-ok":"")},{h:"Conta",r:s=>s.vinculada?a.badge("Conta criada","b-ok"):a.badge("Falta criar conta","b-warn")}]})}
        <div class="card-ft">
          <svg class="ic ic-sm faint"><use href="#i-alerta"/></svg>
          <span class="small muted">Quem aplica a regra \xE9 o banco: cada pessoa entra com a conta dela e s\xF3 recebe o que o papel permite. Cadastrar aqui n\xE3o cria a conta \u2014 a pessoa cria a dela no primeiro acesso, com este mesmo e-mail.</span>
        </div>
      </div>`:""}`}});function ra(){return[{k:"id",t:"hidden"},{k:"nome",l:"Nome completo",t:"text",col:8,req:!0},{k:"cargo",l:"Cargo",t:"text",col:4,ph:"Consultor de vendas"},{k:"email",l:"E-mail",t:"email",col:6},{k:"fone",l:"Telefone",t:"tel",col:6},{k:"equipeId",l:"Equipe",t:"select",col:6,opts:a.all("equipes").map(e=>({v:e.id,l:e.nome}))},{k:"admissao",l:"Admiss\xE3o",t:"date",col:6},{sep:"Metas e remunera\xE7\xE3o"},{k:"meta",l:"Meta mensal (R$)",t:"money",col:6,req:!0,val:"naoNegativo"},{k:"comissaoPct",l:"Comiss\xE3o (%)",t:"pct",col:6,step:.1,val:"percentual",hint:`Padr\xE3o da empresa: ${a.n(a.cfg().comissaoPct)}%`},{k:"comissaoMetro",l:"Comiss\xE3o por metro de piscina (R$)",t:"money",col:6,val:"naoNegativo",hint:a.cfg().comissaoBase==="metro"?`Em uso. Vazio ou zero usa o da empresa: ${a.money0(a.cfg().comissaoPorMetro)}/m`:"S\xF3 entra em jogo se a base da comiss\xE3o virar \u201Cmetro de piscina\u201D"},{k:"ativo",l:"Vendedor ativo",t:"checkbox",col:12}]}a.on("novoVendedor",()=>G(null)),a.on("editarVendedor",e=>G(a.vend(e.id)));function G(e){const o=!e;a.modal({title:o?"Novo vendedor":"Editar vendedor",size:"lg",body:`<form data-sub="salvarVendedor" id="formVend">${a.form(ra(),e||{ativo:!0,meta:a.cfg().metaPadrao,comissaoPct:a.cfg().comissaoPct,admissao:a.hoje()})}</form>`,actions:[{txt:"Salvar",cls:"btn-primary",act:"salvarVendedorBtn"},e?{txt:"Excluir",act:"excluirVendedor",data:{id:e.id}}:null,{txt:"Cancelar",act:"fechar"}].filter(Boolean)})}a.on("salvarVendedorBtn",(e,o)=>K(o.closest(".modal-box").querySelector("#formVend"))),a.on("salvarVendedor",(e,o)=>K(o));function K(e){const{ok:o,data:t}=a.lerForm(e);o&&(a.upsert("vendedores",t),a.closeTop(),a.toast("Vendedor salvo","ok"),a.render())}a.on("excluirVendedor",async e=>{const o=a.vend(e.id);if(a.dependentes("vendedor",e.id).some(r=>r.bloqueia)){if(!await a.confirmar(`${o.nome} tem hist\xF3rico de vendas e n\xE3o pode ser apagado \u2014 isso deixaria pedidos e comiss\xF5es sem respons\xE1vel.

Desativar tira do sistema sem perder o hist\xF3rico.`,{title:"Desativar vendedor",okTxt:"Desativar"}))return;o.ativo=!1,a.save("vendedores"),a.where("usuarios",i=>i.vendedorId===e.id).forEach(i=>i.ativo=!1),a.save("usuarios"),a.closeTop(),a.toast("Vendedor e acesso desativados"),a.render();return}await a.confirmarExclusao("vendedor",e.id,o.nome)&&(a.desvincular("vendedor",e.id),a.remove("vendedores",e.id),a.closeTop(),a.toast("Vendedor exclu\xEDdo"),a.render())}),a.on("novaEquipe",async()=>{const e=await a.perguntar("Nome da equipe",{title:"Nova equipe"});e&&(a.upsert("equipes",{nome:e,responsavel:""}),a.toast("Equipe criada","ok"),a.render())})})();
