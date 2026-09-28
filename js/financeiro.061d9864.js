(function(){"use strict";const a=window.PP,r=a.esc,M=["#0E7C86","#6FD3D8","#B9812F","#2A5D9E","#1E7A4B","#A8322C","#8C9BA1","#D9C7AE","#12A0A8","#A8640A"];a.finSituacao=e=>e.status==="pago"?{nome:"Pago",cls:"b-ok"}:e.status==="cancelado"?{nome:"Cancelado",cls:""}:e.vencimento<a.hoje()?{nome:"Vencido",cls:"b-dang"}:a.diasEntre(a.hoje(),e.vencimento)<=7?{nome:"Vence em breve",cls:"b-warn"}:{nome:"Em aberto",cls:"b-info"};const g={tipo:"receber",status:"",mes:"",q:""};a.view("financeiro",{titulo:"Contas a pagar e receber",sub:()=>{const e=a.where("financeiro",o=>o.status==="aberto"&&o.vencimento<a.hoje());return e.length?`${e.length} lan\xE7amento(s) vencido(s) \u2014 ${a.money0(a.soma(e,"valor"))}`:"Nenhum lan\xE7amento vencido"},render(){const e=a.where("financeiro",s=>s.status!=="cancelado"),o=e.filter(s=>s.tipo==="receber"),i=e.filter(s=>s.tipo==="pagar"),m=o.filter(s=>s.status==="aberto"),p=i.filter(s=>s.status==="aberto"),l=m.filter(s=>s.vencimento<a.hoje()),u=p.filter(s=>s.vencimento<a.hoje());let v=a.all("financeiro").filter(s=>s.status!=="cancelado");if(g.tipo!=="todos"&&(v=v.filter(s=>s.tipo===g.tipo)),g.status==="aberto"&&(v=v.filter(s=>s.status==="aberto")),g.status==="vencido"&&(v=v.filter(s=>s.status==="aberto"&&s.vencimento<a.hoje())),g.status==="pago"&&(v=v.filter(s=>s.status==="pago")),g.mes&&(v=v.filter(s=>a.mesKey(s.vencimento)===g.mes)),g.q){const s=a.norm(g.q);v=v.filter($=>a.norm($.descricao).includes(s)||a.norm($.categoria||"").includes(s)||a.norm($.clienteId?a.cliNome($.clienteId):"").includes(s))}v=a.sortBy(v,"vencimento");const h=a.paginar("financeiro",v),d=a.ultimosMeses(6).concat(a.ultimosMeses(1).map(s=>a.mesKey(a.addMeses(s+"-01",1))),[a.mesKey(a.addMeses(a.hoje(),2)),a.mesKey(a.addMeses(a.hoje(),3))]),t=d.filter((s,$)=>d.indexOf(s)===$),b=a.soma(v,"valor");return`
      <div class="kpis mb">
        ${a.kpi({cls:"k-ok",lbl:"A receber em aberto",val:a.money0(a.soma(m,"valor")),sm:!0,foot:l.length?`${a.money0(a.soma(l,"valor"))} vencido`:"nada vencido"})}
        ${a.kpi({cls:"k-dang",lbl:"A pagar em aberto",val:a.money0(a.soma(p,"valor")),sm:!0,foot:u.length?`${a.money0(a.soma(u,"valor"))} vencido`:"nada vencido"})}
        ${a.kpi({cls:"k-teal",lbl:"Saldo projetado",val:a.money0(a.soma(m,"valor")-a.soma(p,"valor")),sm:!0,foot:"receber \u2212 pagar"})}
        ${a.kpi({lbl:"Recebido no m\xEAs",val:a.money0(a.soma(o.filter(s=>s.status==="pago"&&a.mesKey(s.pagoEm)===a.mesKey(a.hoje())),"valor")),sm:!0})}
        ${a.kpi({lbl:"Pago no m\xEAs",val:a.money0(a.soma(i.filter(s=>s.status==="pago"&&a.mesKey(s.pagoEm)===a.mesKey(a.hoje())),"valor")),sm:!0})}
      </div>

      <div class="toolbar">
        <div class="seg">
          <button class="${g.tipo==="receber"?"on":""}" data-act="finTipo" data-t="receber">A receber</button>
          <button class="${g.tipo==="pagar"?"on":""}" data-act="finTipo" data-t="pagar">A pagar</button>
          <button class="${g.tipo==="todos"?"on":""}" data-act="finTipo" data-t="todos">Todos</button>
        </div>
        <select class="inp" style="width:auto" data-chg="finFiltro" data-f="status" aria-label="Situa\xE7\xE3o">
          <option value="">Todas as situa\xE7\xF5es</option>
          <option value="aberto"${g.status==="aberto"?" selected":""}>Em aberto</option>
          <option value="vencido"${g.status==="vencido"?" selected":""}>Vencidos</option>
          <option value="pago"${g.status==="pago"?" selected":""}>Pagos / recebidos</option>
        </select>
        <select class="inp" style="width:auto" data-chg="finFiltro" data-f="mes" aria-label="M\xEAs de vencimento">
          <option value="">Todos os meses</option>
          ${t.map(s=>`<option value="${s}"${g.mes===s?" selected":""}>${r(a.mesNomeLongo(s))}</option>`).join("")}
        </select>
        <div class="mini-search">
          <svg class="ic"><use href="#i-busca"/></svg>
          <input class="inp" type="search" placeholder="Descri\xE7\xE3o ou categoria" value="${r(g.q)}" data-inp="buscaFin" aria-label="Buscar lan\xE7amentos">
        </div>
        <div class="row-end row">
          <button class="btn" data-act="exportarFin"><svg class="ic"><use href="#i-down"/></svg>CSV</button>
          <button class="btn btn-primary" data-act="novoFin"><svg class="ic"><use href="#i-plus"/></svg>Lan\xE7amento</button>
        </div>
      </div>

      <div class="card">
        <div class="card-hd"><div><h3>${g.tipo==="receber"?"Contas a receber":g.tipo==="pagar"?"Contas a pagar":"Todos os lan\xE7amentos"}</h3>
          <div class="sub">${v.length} lan\xE7amento(s) \xB7 ${a.money(b)}</div></div></div>
        ${v.length?a.tabela({act:"editarFin",rows:h.linhas,cols:[{h:"Vencimento",w:"112px",r:s=>`<b class="small" style="${a.finSituacao(s).nome==="Vencido"?"color:var(--dang)":""}">${r(a.dt(s.vencimento))}</b><span class="mini">${s.status==="pago"?"baixa "+a.dt(s.pagoEm):a.tempoRelativo(s.vencimento)}</span>`},{h:"Descri\xE7\xE3o",r:s=>`<div class="strong">${r(s.descricao)}</div><span class="mini">${r(s.categoria||"")}${s.clienteId?" \xB7 "+r(a.cliNome(s.clienteId)):""}${s.fornecedorId?" \xB7 "+r(a.fornNome(s.fornecedorId)):""}</span>`},g.tipo==="todos"?{h:"Tipo",r:s=>a.badge(s.tipo==="receber"?"Receber":"Pagar",s.tipo==="receber"?"b-ok":"b-dang")}:null,{h:"Forma",r:s=>`<span class="small">${r(s.formaPag||"\u2014")}</span>`},{h:"Situa\xE7\xE3o",r:s=>{const $=a.finSituacao(s);return a.badge($.nome,$.cls)}},{h:"Valor",cls:"num",r:s=>`<b style="color:${s.tipo==="receber"?"var(--ok)":"var(--dang)"}">${s.tipo==="receber"?"":"\u2212 "}${r(a.money(s.valor))}</b>`},{h:"",cls:"acts",r:s=>s.status==="aberto"?`${s.tipo==="receber"&&s.clienteId&&s.vencimento<a.hoje()?`<button class="btn btn-sm" data-act="waCobranca" data-id="${r(s.id)}" title="Cobrar por WhatsApp"><svg class="ic ic-sm"><use href="#i-wpp"/></svg></button> `:""}<button class="btn btn-sm ${s.tipo==="receber"?"btn-ok":""}" data-act="baixarFin" data-id="${r(s.id)}">${s.tipo==="receber"?"Receber":"Pagar"}</button>`:`<span class="tiny faint">${r(a.dt(s.pagoEm))}</span>`}],foot:{}})+h.html:'<div class="empty-sm">Nenhum lan\xE7amento nesse filtro.</div>'}
      </div>`}}),a.on("finTipo",e=>{g.tipo=e.t,a.resetPagina("financeiro"),a.render()}),a.on("finFiltro",(e,o)=>{g[e.f]=o.value,a.resetPagina("financeiro"),a.render()}),a.on("buscaFin",a.debounce((e,o)=>{g.q=o.value,a.resetPagina("financeiro"),a.render()},250)),a.on("baixarFin",async(e,o)=>{const i=a.find("financeiro",e.id);if(!(!i||i.status!=="aberto"||!await a.confirmar(`Confirmar ${i.tipo==="receber"?"o recebimento":"o pagamento"} de ${a.money(i.valor)}?

${i.descricao}`,{title:i.tipo==="receber"?"Baixar recebimento":"Baixar pagamento",okTxt:"Confirmar baixa"}))){if(i.status="pago",i.pagoEm=a.hoje(),a.save("financeiro"),i.origem&&i.origem.tipo==="pedido"){const p=a.where("financeiro",l=>l.tipo==="receber"&&l.origem&&l.origem.id===i.origem.id&&l.status!=="cancelado");if(p.length&&p.every(l=>l.status==="pago")){const l=a.find("pedidos",i.origem.id);l&&l.status!=="cancelado"&&l.status!=="concluido"&&(l.status="concluido",a.save("pedidos"));const u=a.all("comissoes").find(v=>v.pedidoId===i.origem.id);u&&u.status==="prevista"&&(u.status="liberada",a.save("comissoes")),a.toast("Pedido quitado \u2014 comiss\xE3o liberada","ok")}}a.closeAll(),a.toast("Baixa registrada","ok"),a.render()}});function J(e){return[{k:"id",t:"hidden"},{k:"tipo",l:"Tipo",t:"select",col:4,req:!0,vazio:!1,opts:[{v:"receber",l:"A receber"},{v:"pagar",l:"A pagar"}]},{k:"descricao",l:"Descri\xE7\xE3o",t:"text",col:8,req:!0},{k:"categoria",l:"Categoria",t:"select",col:6,req:!0,opts:a.CAT_FIN.receita.concat(a.CAT_FIN.despesa)},{k:"valor",l:"Valor (R$)",t:"money",col:3,req:!0,val:"positivo"},{k:"vencimento",l:"Vencimento",t:"date",col:3,req:!0},{k:"formaPag",l:"Forma de pagamento",t:"select",col:4,opts:a.FORMAS_PAG},{k:"clienteId",l:"Cliente",t:"select",col:4,opts:a.all("clientes").map(o=>({v:o.id,l:o.nome}))},{k:"fornecedorId",l:"Fornecedor",t:"select",col:4,opts:a.all("fornecedores").map(o=>({v:o.id,l:o.nome}))},{k:"obs",l:"Observa\xE7\xF5es",t:"textarea",col:12,rows:2}]}a.on("novoFin",()=>I(null)),a.on("editarFin",e=>I(a.find("financeiro",e.id)));function I(e){const o=!e;a.modal({title:o?"Novo lan\xE7amento":"Editar lan\xE7amento",sub:e&&e.origem&&e.origem.tipo==="pedido"?"Lan\xE7amento gerado por um pedido de venda":"",size:"lg",body:`<form data-sub="salvarFin" id="formFin">${a.form(J(),e||{tipo:g.tipo==="pagar"?"pagar":"receber",vencimento:a.hoje(),formaPag:"PIX",parcela:1,parcelas:1})}</form>
      ${o?'<div class="alert a-info mt"><svg class="ic"><use href="#i-alerta"/></svg><div class="small">Para parcelar, crie o lan\xE7amento e depois use <b>Duplicar</b>, ou gere as parcelas automaticamente aprovando um or\xE7amento.</div></div>':""}`,actions:[{txt:"Salvar",cls:"btn-primary",act:"salvarFinBtn"},e&&e.status==="aberto"?{txt:e.tipo==="receber"?"Receber agora":"Pagar agora",cls:"btn-ok",act:"baixarFin",data:{id:e.id}}:null,e?{txt:"Excluir",act:"excluirFin",data:{id:e.id}}:null,{txt:"Cancelar",act:"fechar"}].filter(Boolean)})}a.on("salvarFinBtn",(e,o)=>N(o.closest(".modal-box").querySelector("#formFin"))),a.on("salvarFin",(e,o)=>N(o));function N(e){const{ok:o,data:i}=a.lerForm(e);o&&(i.id||(i.status="aberto",i.pagoEm="",i.origem={tipo:"manual"},i.parcela=1,i.parcelas=1),a.upsert("financeiro",i),a.closeTop(),a.toast("Lan\xE7amento salvo","ok"),a.render())}a.on("excluirFin",async e=>{const o=a.find("financeiro",e.id);await a.confirmar(`Excluir o lan\xE7amento "${o.descricao}"?`,{perigo:!0,okTxt:"Excluir",aviso:o.origem&&o.origem.tipo==="pedido"?"Esse lan\xE7amento veio de um pedido de venda. Excluir vai desalinhar o total recebido do pedido.":""})&&(a.remove("financeiro",e.id),a.closeTop(),a.toast("Lan\xE7amento exclu\xEDdo"),a.render())}),a.on("exportarFin",()=>{const e=[["Tipo","Descri\xE7\xE3o","Categoria","Cliente","Fornecedor","Vencimento","Situa\xE7\xE3o","Pago em","Forma","Valor"]];a.all("financeiro").forEach(o=>e.push([o.tipo==="receber"?"A receber":"A pagar",o.descricao,o.categoria||"",o.clienteId?a.cliNome(o.clienteId):"",o.fornecedorId?a.fornNome(o.fornecedorId):"",a.dt(o.vencimento),a.finSituacao(o).nome,o.pagoEm?a.dt(o.pagoEm):"",o.formaPag||"",a.dec(o.valor)])),a.baixar(`financeiro-${a.hoje()}.csv`,a.csv(e),"text/csv;charset=utf-8"),a.toast("CSV exportado","ok")}),a.view("fluxo",{titulo:"Fluxo de caixa",sub:"Realizado dos \xFAltimos meses e proje\xE7\xE3o pelos lan\xE7amentos em aberto",render(){const e=a.ultimosMeses(6),o=[1,2,3].map(n=>a.mesKey(a.addMeses(a.hoje(),n))),i=e.concat(o),m=a.mesKey(a.hoje()),p=i.map(n=>{const C=n<m,q=a.soma(a.where("financeiro",y=>y.tipo==="receber"&&y.status!=="cancelado"&&(C?y.status==="pago"&&a.mesKey(y.pagoEm)===n:a.mesKey(y.vencimento)===n)),"valor"),A=a.soma(a.where("financeiro",y=>y.tipo==="pagar"&&y.status!=="cancelado"&&(C?y.status==="pago"&&a.mesKey(y.pagoEm)===n:a.mesKey(y.vencimento)===n)),"valor");return{mk:n,ent:q,sai:A,saldo:q-A,projetado:!C}});let l=0;const u=p.map(n=>(l+=n.saldo,l)),v=a.where("financeiro",n=>n.tipo==="receber"&&n.status==="pago"&&a.mesKey(n.pagoEm)===m),h=a.where("financeiro",n=>n.tipo==="pagar"&&n.status==="pago"&&a.mesKey(n.pagoEm)===m),d=a.soma(v,"valor"),t=a.soma(h.filter(n=>["Compra de piscina","Equipamentos","M\xE3o de obra","M\xE1quinas / escava\xE7\xE3o","Frete"].includes(n.categoria)),"valor"),b=a.soma(h.filter(n=>n.categoria==="Comiss\xE3o"),"valor"),s=a.soma(h.filter(n=>["Administrativo","Marketing","Outras despesas"].includes(n.categoria)),"valor"),$=a.soma(h.filter(n=>n.categoria==="Impostos"),"valor"),f=d-t-b-s-$,k={};a.where("financeiro",n=>n.tipo==="pagar"&&n.status==="pago").forEach(n=>{k[n.categoria||"Outras despesas"]=(k[n.categoria||"Outras despesas"]||0)+a.n(n.valor)});const F=a.sortBy(Object.keys(k).map((n,C)=>({label:n,valor:k[n]})),"valor","desc").slice(0,8).map((n,C)=>Object.assign(n,{cor:M[C%M.length]}));return`
      <div class="kpis mb">
        ${a.kpi({cls:"k-ok",lbl:"Entradas no m\xEAs",val:a.money0(d),sm:!0})}
        ${a.kpi({cls:"k-dang",lbl:"Sa\xEDdas no m\xEAs",val:a.money0(a.soma(h,"valor")),sm:!0})}
        ${a.kpi({cls:f>=0?"k-teal":"k-dang",lbl:"Resultado do m\xEAs",val:a.money0(f),sm:!0,foot:d?a.pct(f/d*100,1)+" de margem l\xEDquida":"\u2014"})}
        ${a.kpi({cls:"k-ocre",lbl:"Saldo acumulado projetado",val:a.money0(u[u.length-1]),sm:!0,foot:"at\xE9 "+a.mesNome(i[i.length-1])})}
      </div>

      <div class="card mb">
        <div class="card-hd">
          <div><h3>Entradas x sa\xEDdas</h3><div class="sub">Meses passados = realizado \xB7 meses futuros = proje\xE7\xE3o pelos vencimentos</div></div>
          <div class="right legend">
            <span><i style="background:#1E7A4B"></i>Entradas</span>
            <span><i style="background:#A8322C"></i>Sa\xEDdas</span>
          </div>
        </div>
        <div class="card-bd">
          ${a.chart.barras({labels:i.map(n=>a.mesNome(n)+(n>m?"*":"")),height:250,series:[{nome:"Entradas",cor:"#1E7A4B",values:p.map(n=>n.ent)},{nome:"Sa\xEDdas",cor:"#A8322C",values:p.map(n=>n.sai)}]})}
          <div class="tiny faint mt">* meses marcados s\xE3o proje\xE7\xE3o, n\xE3o realizado.</div>
        </div>
      </div>

      <div class="grid g-2 mb">
        <div class="card">
          <div class="card-hd"><div><h3>Saldo acumulado</h3><div class="sub">Efeito caixa m\xEAs a m\xEAs</div></div></div>
          <div class="card-bd">
            ${a.chart.linha({labels:i.map(a.mesNome),height:220,series:[{nome:"Saldo acumulado",cor:"#0E7C86",values:u}]})}
          </div>
        </div>
        <div class="card">
          <div class="card-hd"><div><h3>Para onde vai o dinheiro</h3><div class="sub">Despesas pagas por categoria</div></div></div>
          <div class="card-bd">${a.chart.rosca({items:F,centroLbl:"Pago"})}</div>
        </div>
      </div>

      <div class="grid g-2">
        <div class="card">
          <div class="card-hd"><div><h3>Resultado do m\xEAs</h3><div class="sub">${a.mesNomeLongo(m)} \u2014 regime de caixa</div></div></div>
          <div class="card-bd">
            <div class="tot-box">
              <div class="tot-line"><span class="muted">Receita recebida</span><b class="tnum" style="color:var(--ok)">${r(a.money(d))}</b></div>
              <div class="tot-line"><span class="muted">(\u2212) Custo de produto e obra</span><span class="tnum">${r(a.money(t))}</span></div>
              <div class="tot-line"><span class="muted">(\u2212) Comiss\xF5es</span><span class="tnum">${r(a.money(b))}</span></div>
              <div class="tot-line"><span class="muted">(\u2212) Despesas operacionais</span><span class="tnum">${r(a.money(s))}</span></div>
              <div class="tot-line"><span class="muted">(\u2212) Impostos</span><span class="tnum">${r(a.money($))}</span></div>
              <div class="tot-line big"><span>Resultado</span><span class="tnum" style="color:${f>=0?"var(--ok)":"var(--dang)"}">${r(a.money(f))}</span></div>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-hd"><div><h3>M\xEAs a m\xEAs</h3></div></div>
          ${a.tabela({rows:p.map((n,C)=>Object.assign({id:n.mk,acum:u[C]},n)),cols:[{h:"M\xEAs",r:n=>`<b>${r(a.mesNome(n.mk))}</b>${n.projetado?' <span class="badge b-info">proj.</span>':""}`},{h:"Entradas",cls:"num",r:n=>`<span style="color:var(--ok)">${r(a.moneyK(n.ent))}</span>`},{h:"Sa\xEDdas",cls:"num",r:n=>`<span style="color:var(--dang)">${r(a.moneyK(n.sai))}</span>`},{h:"Saldo",cls:"num",r:n=>`<b style="color:${n.saldo>=0?"var(--ok)":"var(--dang)"}">${r(a.moneyK(n.saldo))}</b>`},{h:"Acumulado",cls:"num",r:n=>`<span class="tnum">${r(a.moneyK(n.acum))}</span>`}]})}
        </div>
      </div>`}});const T=["Compra de piscina","Equipamentos","M\xE3o de obra","M\xE1quinas / escava\xE7\xE3o","Frete"];a.periodoDRE=(e,o)=>{const[i,m]=e.split("-").map(Number);let p,l;o==="ano"?(p=1,l=12):o==="trimestre"?(p=Math.floor((m-1)/3)*3+1,l=p+2):(p=m,l=m);const u=[];for(let h=p;h<=l;h++)u.push(i+"-"+String(h).padStart(2,"0"));const v=new Date(i,l,0).getDate();return{tipo:o,ancora:e,meses:u,de:u[0]+"-01",ate:u[u.length-1]+"-"+String(v).padStart(2,"0"),nome:o==="ano"?String(i):o==="trimestre"?Math.ceil(p/3)+"\xBA trimestre de "+i:a.mesNomeLongo(u[0])}},a.deslocarPeriodo=(e,o)=>{const i=e.tipo==="ano"?12:e.tipo==="trimestre"?3:1;return a.periodoDRE(a.mesKey(a.addMeses(e.de,i*o)),e.tipo)},a.registrarDerivado("dre",["pedidos","vendas","comissoes","financeiro"]),a.dre=e=>a.cacheDe("dre",e.de+"|"+e.ate,()=>Q(e));function Q(e){const{de:o,ate:i,meses:m}=e,p=c=>{const P=String(c||"").slice(0,10);return P>=o&&P<=i},l=(c,P)=>a.cent(c.reduce((X,H)=>X+a.n(typeof P=="function"?P(H):H[P]),0)),u=a.where("pedidos",c=>p(c.data)&&c.status!=="cancelado"),v=a.where("pedidos",c=>p(c.data)&&c.status==="cancelado"),h=a.where("vendas",c=>p(c.data)&&c.status==="concluida"),d=a.where("financeiro",c=>c.tipo==="receber"&&c.status!=="cancelado"&&p(c.vencimento)&&!["pedido","venda"].includes((c.origem||{}).tipo||"")),t=l(u,a.pedidoTotal),b=l(h,"total"),s=l(d,"valor"),$=a.cent(t+b+s),f=a.where("financeiro",c=>c.tipo==="pagar"&&c.status!=="cancelado"&&p(c.vencimento)),k=c=>(c.origem||{}).tipo||"",F=l(f.filter(c=>c.categoria==="Impostos"),"valor"),n=l(v,a.pedidoTotal),C=a.cent(F+n),q=a.cent($-C),A=l(u,a.pedidoCusto),y=l(h,"custo"),O=l(f.filter(c=>T.includes(c.categoria)&&!["pedido","compra"].includes(k(c))),"valor"),R=a.cent(A+y+O),x=a.cent(q-R),K=l(a.where("comissoes",c=>m.includes(c.competencia)&&c.status!=="cancelada"),"valor"),S=f.filter(c=>!["pedido","comissao","compra"].includes(k(c))&&c.categoria!=="Impostos"&&!T.includes(c.categoria)),z=l(S.filter(c=>c.categoria==="Marketing"),"valor"),U=l(S.filter(c=>c.categoria==="Administrativo"),"valor"),_=l(f.filter(c=>k(c)==="chamado"),"valor"),G=l(S.filter(c=>!["Marketing","Administrativo"].includes(c.categoria)&&k(c)!=="chamado"),"valor"),B=a.cent(K+z+U+_+G),D=a.cent(x-B),W=[{nome:"Custo de produto e obra j\xE1 contado no CPV",valor:l(f.filter(c=>k(c)==="pedido"),"valor"),porque:"\xE9 a contrapartida financeira do custo que j\xE1 saiu dos pedidos"},{nome:"Comiss\xF5es pagas neste per\xEDodo",valor:l(f.filter(c=>k(c)==="comissao"),"valor"),porque:"a comiss\xE3o entra por compet\xEAncia, no m\xEAs da venda"},{nome:"Compras de estoque",valor:l(f.filter(c=>k(c)==="compra"),"valor"),porque:"vira estoque; s\xF3 afeta o resultado quando o produto \xE9 vendido"},{nome:"Parcelas recebidas de vendas de outros per\xEDodos",valor:l(a.where("financeiro",c=>c.tipo==="receber"&&c.status==="pago"&&p(c.pagoEm)&&["pedido","venda"].includes(k(c))),"valor"),porque:"a receita j\xE1 foi reconhecida no m\xEAs da venda"}].filter(c=>c.valor>0),j=c=>q?c/q*100:0;return{periodo:e,receitaLiquida:q,linhas:[{k:"receitaBruta",nome:"RECEITA OPERACIONAL BRUTA",valor:$,nivel:"total"},{k:"recPiscinas",nome:"Venda de piscinas",valor:t,nivel:"item",qtd:u.length},{k:"recBalcao",nome:"Venda de balc\xE3o",valor:b,nivel:"item",qtd:h.length},{k:"recServicos",nome:"Servi\xE7os e manuten\xE7\xE3o",valor:s,nivel:"item",qtd:d.length},{k:"deducoes",nome:"(\u2212) Dedu\xE7\xF5es sobre vendas",valor:-C||0,nivel:"sub"},{k:"impostos",nome:"Impostos sobre vendas",valor:-F||0,nivel:"item"},{k:"devolucoes",nome:"Pedidos cancelados",valor:-n||0,nivel:"item",qtd:v.length},{k:"receitaLiquida",nome:"= RECEITA L\xCDQUIDA",valor:q,nivel:"total",destaque:!0},{k:"cpv",nome:"(\u2212) Custo dos produtos e servi\xE7os vendidos",valor:-R||0,nivel:"sub"},{k:"cpvPiscinas",nome:"Piscinas, equipamentos e instala\xE7\xE3o",valor:-A||0,nivel:"item"},{k:"cpvBalcao",nome:"Mercadorias do balc\xE3o",valor:-y||0,nivel:"item"},{k:"cpvAvulso",nome:"Custos diretos avulsos",valor:-O||0,nivel:"item"},{k:"lucroBruto",nome:"= LUCRO BRUTO",valor:x,nivel:"total",destaque:!0,margem:j(x)},{k:"despOper",nome:"(\u2212) Despesas operacionais",valor:-B||0,nivel:"sub"},{k:"comissoes",nome:"Comiss\xF5es de vendas",valor:-K||0,nivel:"item"},{k:"marketing",nome:"Marketing",valor:-z||0,nivel:"item"},{k:"administrat",nome:"Administrativas",valor:-U||0,nivel:"item"},{k:"assistencia",nome:"Assist\xEAncia e garantia",valor:-_||0,nivel:"item"},{k:"outras",nome:"Outras despesas",valor:-G||0,nivel:"item"},{k:"resultadoOper",nome:"= RESULTADO DO PER\xCDODO",valor:D,nivel:"total",destaque:!0,margem:j(D)}].map(c=>Object.assign(c,{vertical:j(c.valor)})),fora:W,totais:{receitaBruta:$,deducoes:C,receitaLiquida:q,cpv:R,lucroBruto:x,despOper:B,resultado:D,margemBruta:j(x),margemLiquida:j(D)}}}const E={ancora:"",tipo:"mes",comparar:!0};function w(){return a.periodoDRE(E.ancora||a.mesKey(a.hoje()),E.tipo)}a.view("dre",{titulo:"DRE",sub:()=>{const e=a.dre(w());return`${e.periodo.nome} \u2014 resultado de ${a.money0(e.totais.resultado)} (${a.dec(e.totais.margemLiquida,1)}% da receita l\xEDquida)`},render(){const e=w(),o=a.dre(e),i=E.comparar?a.dre(a.deslocarPeriodo(e,-1)):null,m={};i&&i.linhas.forEach(d=>m[d.k]=d.valor);const p=d=>{if(!i)return"";const t=m[d.k]||0,b=d.valor||0;if(!t&&!b)return'<span class="faint">\u2014</span>';if(!t)return'<span class="dre-novo">novo</span>';if(b<0!=t<0){const f=b-t;return`<span class="dre-var ${f>0?"up":"down"}">${f>0?"+":"\u2212"}${r(a.money0(Math.abs(f)))}</span>`}const s=(Math.abs(b)-Math.abs(t))/Math.abs(t)*100;return Math.abs(s)<.05?'<span class="faint">=</span>':`<span class="dre-var ${(b>=0?s>0:s<0)?"up":"down"}">${s>0?"\u25B2":"\u25BC"} ${a.dec(Math.abs(s),1)}%</span>`},l=(d,t)=>d===0||d===void 0?'<span class="faint">\u2014</span>':`<span class="${t||""}">${r(a.money(d))}</span>`,u=d=>{const t="dre-l dre-"+d.nivel+(d.destaque?" dre-forte":""),b=d.nivel==="total"&&d.valor<0;return`<tr class="${t}">
        <th scope="row">${r(d.nome)}${d.qtd?` <span class="dre-qtd">${d.qtd}</span>`:""}</th>
        <td class="num tnum"${b?' style="color:var(--dang)"':""}>${l(d.valor)}</td>
        <td class="num tnum faint">${d.k==="receitaBruta"||!o.receitaLiquida||!d.valor?"\u2014":a.dec(d.vertical,1)+"%"}</td>
        ${i?`<td class="num tnum faint">${l(m[d.k])}</td><td class="num">${p(d)}</td>`:""}
      </tr>`},v=e.meses.length>1?e.meses:a.ultimosMeses(6),h=v.map(d=>a.dre(a.periodoDRE(d,"mes")).totais);return`
      <div class="toolbar">
        <div class="seg">
          ${[["mes","M\xEAs"],["trimestre","Trimestre"],["ano","Ano"]].map(([d,t])=>`<button class="${E.tipo===d?"on":""}" data-act="drePeriodo" data-t="${d}">${t}</button>`).join("")}
        </div>
        <div class="row" style="gap:4px">
          <button class="btn btn-sm" data-act="dreAndar" data-n="-1" aria-label="Per\xEDodo anterior"><svg class="ic"><use href="#i-voltar"/></svg></button>
          <span class="dre-periodo">${r(e.nome)}</span>
          <button class="btn btn-sm" data-act="dreAndar" data-n="1" aria-label="Pr\xF3ximo per\xEDodo"><svg class="ic"><use href="#i-seta"/></svg></button>
        </div>
        <label class="check small"><input type="checkbox" data-chg="dreComparar"${E.comparar?" checked":""}><span>Comparar com o per\xEDodo anterior</span></label>
        <div class="row-end row">
          <button class="btn" data-act="dreCSV"><svg class="ic"><use href="#i-down"/></svg>CSV</button>
          <button class="btn" data-act="drePDF"><svg class="ic"><use href="#i-print"/></svg>Imprimir</button>
        </div>
      </div>

      <div class="kpis mb">
        ${a.kpi({cls:"k-teal",lbl:"Receita l\xEDquida",val:a.money0(o.totais.receitaLiquida),sm:!0,foot:`bruta ${a.money0(o.totais.receitaBruta)}`})}
        ${a.kpi({cls:"k-ok",lbl:"Lucro bruto",val:a.money0(o.totais.lucroBruto),sm:!0,foot:a.dec(o.totais.margemBruta,1)+"% de margem bruta"})}
        ${a.kpi({cls:"k-warn",lbl:"Despesas operacionais",val:a.money0(o.totais.despOper),sm:!0,foot:o.receitaLiquida?a.dec(o.totais.despOper/o.receitaLiquida*100,1)+"% da receita l\xEDquida":"\u2014"})}
        ${a.kpi({cls:o.totais.resultado>=0?"k-teal":"k-dang",lbl:"Resultado do per\xEDodo",val:a.money0(o.totais.resultado),sm:!0,foot:a.dec(o.totais.margemLiquida,1)+"% de margem l\xEDquida"})}
      </div>

      <div class="card mb">
          <div class="card-hd">
            <div><h3>Demonstra\xE7\xE3o do resultado</h3>
              <div class="sub">${r(e.nome)} \u2014 regime de compet\xEAncia</div></div>
          </div>
          <div class="card-bd" style="padding:0">
            <div class="tbl-wrap">
              <table class="tbl dre-tbl">
                <thead><tr>
                  <th scope="col">Conta</th>
                  <th scope="col" class="num">Valor</th>
                  <th scope="col" class="num">% RL</th>
                  ${i?`<th scope="col" class="num">${r(i.periodo.nome)}</th><th scope="col" class="num">Var.</th>`:""}
                </tr></thead>
                <tbody>${o.linhas.map(u).join("")}</tbody>
              </table>
            </div>
          </div>
          <div class="card-ft">
            <svg class="ic ic-sm faint"><use href="#i-alerta"/></svg>
            <span class="small muted"><b>% RL</b> \xE9 a participa\xE7\xE3o de cada conta na receita l\xEDquida \u2014 quanto de cada R$ 100 vendidos aquela linha consome.</span>
          </div>
      </div>

      <div class="grid g-2">
          <div class="card">
            <div class="card-hd"><div><h3>Resultado m\xEAs a m\xEAs</h3><div class="sub">Lucro bruto e resultado</div></div></div>
            <div class="card-bd">
              ${a.chart.barras({labels:v.map(a.mesNome),height:200,series:[{nome:"Lucro bruto",cor:"#0E7C86",values:h.map(d=>d.lucroBruto)},{nome:"Resultado",cor:"#B9812F",values:h.map(d=>d.resultado)}]})}
            </div>
          </div>

          <div class="card">
            <div class="card-hd"><div><h3>O que ficou fora</h3><div class="sub">Para a conta fechar na confer\xEAncia</div></div></div>
            <div class="card-bd">
              ${o.fora.length?o.fora.map(d=>`
                <div class="att-item">
                  <div class="txt"><b>${r(d.nome)}</b><small>${r(d.porque)}</small></div>
                  <div class="val">${r(a.money0(d.valor))}</div>
                </div>`).join(""):'<div class="empty-sm">Nada foi exclu\xEDdo neste per\xEDodo.</div>'}
              <div class="sep"></div>
              <p class="small muted" style="margin:0">A DRE \xE9 por <b>compet\xEAncia</b>: conta a venda no m\xEAs em que ela aconteceu.
              O dinheiro entrando e saindo est\xE1 no <button class="btn btn-sm btn-ghost" data-act="nav" data-v="fluxo">Fluxo de caixa</button>.</p>
            </div>
          </div>
      </div>`}}),a.on("drePeriodo",e=>{E.tipo=e.t,a.render()}),a.on("dreAndar",e=>{const o=a.deslocarPeriodo(w(),a.n(e.n));E.ancora=o.meses[0],a.render()}),a.on("dreComparar",(e,o)=>{E.comparar=o.checked,a.render()}),a.on("dreCSV",()=>{const e=w(),o=a.dre(e),i=[["Conta","Valor","% da receita l\xEDquida"]];o.linhas.forEach(m=>i.push([m.nome,a.dec(m.valor),m.k==="receitaBruta"||!o.receitaLiquida||!m.valor?"":a.dec(m.vertical,1)])),i.push([],["Fora da DRE","Valor","Motivo"]),o.fora.forEach(m=>i.push([m.nome,a.dec(m.valor),m.porque])),a.baixar(`dre-${e.meses[0]}${e.meses.length>1?"-a-"+e.meses[e.meses.length-1]:""}.csv`,a.csv(i),"text/csv;charset=utf-8")}),a.on("drePDF",()=>{const e=w(),o=a.dre(e),i=a.cfg(),m=p=>`<tr class="${p.nivel}${p.destaque?" forte":""}">
    <td>${r(p.nome)}</td>
    <td class="r">${p.valor?r(a.money(p.valor)):"\u2014"}</td>
    <td class="r">${p.k==="receitaBruta"||!o.receitaLiquida||!p.valor?"\u2014":a.dec(p.vertical,1)+"%"}</td></tr>`;a.imprimir(`
    <style>
      body{ font:12px/1.5 system-ui, sans-serif; color:#12262C; }
      h1{ font-size:18px; margin:0 0 2px }
      .sub{ color:#55666D; font-size:11.5px; margin-bottom:16px }
      table{ width:100%; border-collapse:collapse }
      td{ padding:5px 8px; border-bottom:1px solid #EDE7DD }
      .r{ text-align:right; font-variant-numeric:tabular-nums }
      tr.item td:first-child{ padding-left:22px; color:#55666D }
      tr.total td, tr.forte td{ font-weight:700; background:#F7F3EC }
      tr.sub td{ font-weight:600 }
      .rod{ margin-top:18px; font-size:10.5px; color:#55666D }
    </style>
    <h1>Demonstra\xE7\xE3o do Resultado \u2014 ${r(e.nome)}</h1>
    <div class="sub">${r(i.empresa||"")}${i.cnpj?" \xB7 CNPJ "+r(i.cnpj):""} \xB7 regime de compet\xEAncia \xB7 emitido em ${r(a.dt(a.hoje()))}</div>
    <table><tbody>${o.linhas.map(m).join("")}</tbody></table>
    ${o.fora.length?`<div class="rod"><b>N\xE3o entram no resultado:</b> ${o.fora.map(p=>r(p.nome)+" ("+r(a.money0(p.valor))+") \u2014 "+r(p.porque)).join(" \xB7 ")}</div>`:""}
  `,"DRE "+e.nome)});const L={comp:""};a.view("comissoes",{titulo:"Comiss\xF5es",sub:()=>{const e=a.where("comissoes",o=>o.status==="liberada");return e.length?`${e.length} comiss\xE3o(\xF5es) liberada(s) para pagamento \u2014 ${a.money0(a.soma(e,"valor"))}`:"Nenhuma comiss\xE3o pendente de pagamento"},render(){const e=a.escopo(a.all("comissoes")),o=Array.from(new Set(e.map(t=>t.competencia))).sort().reverse(),i=L.comp||o[0]||a.mesKey(a.hoje()),m=e.filter(t=>t.competencia===i&&t.status!=="cancelada"),p=a.cfg().comissaoBase,l=m.some(t=>t.baseTipo==="metro"),u=m.filter(t=>t.status==="prevista"),v=m.filter(t=>t.status==="liberada"),h=m.filter(t=>t.status==="paga"),d=a.where("vendedores",t=>t.ativo&&(a.ehGestor()||t.id===a.vendedorAtual())).map(t=>{const b=m.filter(s=>s.vendedorId===t.id);return{id:t.id,v:t,qtd:b.length,base:a.soma(b,"base"),metros:a.cent(a.soma(b,"metros")),valor:a.soma(b,"valor"),pago:a.soma(b.filter(s=>s.status==="paga"),"valor"),pendente:a.soma(b.filter(s=>s.status!=="paga"),"valor")}}).filter(t=>t.qtd>0);return`
      <div class="kpis mb">
        ${a.kpi({cls:"k-teal",lbl:"Total da compet\xEAncia",val:a.money0(a.soma(m,"valor")),sm:!0,foot:`${m.length} comiss\xE3o(\xF5es)`})}
        ${a.kpi({lbl:"Prevista",val:a.money0(a.soma(u,"valor")),sm:!0,foot:"pedido ainda em aberto"})}
        ${a.kpi({cls:"k-warn",lbl:"Liberada",val:a.money0(a.soma(v,"valor")),sm:!0,foot:"pronta para pagar"})}
        ${a.kpi({cls:"k-ok",lbl:"Paga",val:a.money0(a.soma(h,"valor")),sm:!0})}
      </div>

      <div class="toolbar">
        <select class="inp" style="width:auto" data-chg="comComp" aria-label="Compet\xEAncia">
          ${o.map(t=>`<option value="${t}"${i===t?" selected":""}>${r(a.mesNomeLongo(t))}</option>`).join("")}
        </select>
        <span class="badge b-teal">Base: ${r(a.comissaoBaseNome(p))}${p==="metro"?` \xB7 ${r(a.money0(a.cfg().comissaoPorMetro))}/m`:""}</span>
        <div class="row-end row">
          ${v.length&&a.ehGestor()?`<button class="btn btn-ok" data-act="pagarTodasCom" data-c="${r(i)}"><svg class="ic"><use href="#i-check"/></svg>Pagar todas as liberadas (${a.money0(a.soma(v,"valor"))})</button>`:""}
          <button class="btn" data-act="exportarComissoes" data-c="${r(i)}"><svg class="ic"><use href="#i-down"/></svg>CSV</button>
        </div>
      </div>

      <div class="grid g-1-2 mb">
        <div class="card">
          <div class="card-hd"><div><h3>Por vendedor</h3><div class="sub">${r(a.mesNomeLongo(i))}</div></div></div>
          <div class="card-bd">
            ${d.length?d.map(t=>`
              <div class="att-item">
                <span class="av-mini">${r(a.iniciais(t.v.nome))}</span>
                <div class="txt"><b>${r(t.v.nome)}</b><small>${t.qtd} venda(s) \xB7 ${l?`${a.dec(t.metros,2)} m de piscina`:`base ${r(a.moneyK(t.base))}`}</small></div>
                <div class="val">${r(a.money0(t.valor))}${t.pendente?`<br><span class="tiny" style="color:var(--warn)">${r(a.money0(t.pendente))} pendente</span>`:""}</div>
              </div>`).join(""):'<div class="empty-sm">Nenhuma comiss\xE3o nessa compet\xEAncia.</div>'}
          </div>
        </div>

        <div class="card">
          <div class="card-hd"><div><h3>Detalhamento</h3></div></div>
          ${m.length?a.tabela({rows:a.sortBy(m,"valor","desc"),cols:[{h:"Vendedor",r:t=>`<div class="strong">${r(a.vendNome(t.vendedorId))}</div><span class="mini">${r(a.cliNome(t.clienteId))}</span>`},{h:"Origem",r:t=>{if(t.vendaId){const s=a.find("vendas",t.vendaId);return s?`<button class="btn btn-sm btn-ghost" data-act="abrirVenda" data-id="${r(s.id)}">Balc\xE3o #${s.numero}</button>`:"Balc\xE3o"}const b=a.find("pedidos",t.pedidoId);return b?`<button class="btn btn-sm btn-ghost" data-act="abrirPedido" data-id="${r(b.id)}">Pedido #${b.numero}</button>`:"\u2014"}},{h:"Base",cls:"num",r:t=>t.baseTipo==="metro"?`${a.dec(t.metros,2)} m<span class="mini">s\xF3 piscina</span>`:`${r(a.money0(t.base))}<span class="mini">${r(t.baseTipo==="margem"?"margem":"faturamento")}</span>`},{h:"Regra",cls:"num",r:t=>r(a.comissaoRegra(t))},{h:"Situa\xE7\xE3o",r:t=>a.badge(t.status==="paga"?"Paga":t.status==="liberada"?"Liberada":"Prevista",t.status==="paga"?"b-ok":t.status==="liberada"?"b-warn":"b-info")},{h:"Valor",cls:"num",r:t=>`<b>${r(a.money(t.valor))}</b>`},{h:"",cls:"acts",r:t=>t.status==="liberada"&&a.ehGestor()?`<button class="btn btn-sm btn-ok" data-act="pagarCom" data-id="${r(t.id)}">Pagar</button>`:t.status==="paga"?`<span class="tiny faint">${r(a.dt(t.pagoEm))}</span>`:t.status==="liberada"?'<span class="tiny faint">liberada</span>':'<span class="tiny faint">aguarda quita\xE7\xE3o</span>'}]}):'<div class="empty-sm">Nenhuma comiss\xE3o nessa compet\xEAncia.</div>'}
        </div>
      </div>

      <div class="alert a-info">
        <svg class="ic"><use href="#i-alerta"/></svg>
        <div><b>Como funciona.</b> A comiss\xE3o nasce <b>prevista</b> quando o or\xE7amento \xE9 aprovado, vira <b>liberada</b> quando o pedido \xE9 conclu\xEDdo ou todas as parcelas s\xE3o quitadas, e vira <b>paga</b> quando voc\xEA registra o pagamento \u2014 o que cria automaticamente uma despesa em contas a pagar.${p==="metro"?` Hoje a regra \xE9 <b>por metro de piscina</b>: ${r(a.money0(a.cfg().comissaoPorMetro))} por metro de comprimento do modelo vendido. Adicionais, equipamentos, insumos, servi\xE7os e vendas de balc\xE3o <b>n\xE3o entram na conta</b>.`:""}</div>
      </div>`}}),a.on("comComp",(e,o)=>{L.comp=o.value,a.render()}),a.on("pagarCom",async e=>{const o=a.find("comissoes",e.id);await a.confirmar(`Pagar ${a.money(o.valor)} de comiss\xE3o para ${a.vendNome(o.vendedorId)}?`,{title:"Pagar comiss\xE3o",okTxt:"Pagar",aviso:"Ser\xE1 criada uma despesa j\xE1 baixada em contas a pagar."})&&(V(o),a.toast("Comiss\xE3o paga","ok"),a.render())}),a.on("pagarTodasCom",async e=>{const o=a.where("comissoes",i=>i.competencia===e.c&&i.status==="liberada");o.length&&await a.confirmar(`Pagar ${a.plural(o.length,"comiss\xE3o","comiss\xF5es")} no total de ${a.money(a.soma(o,"valor"))}?`,{title:"Pagar comiss\xF5es",okTxt:"Pagar todas",aviso:"Ser\xE1 criada uma despesa j\xE1 baixada em contas a pagar para cada vendedor."})&&(o.forEach(V),a.toast(`${o.length} comiss\xE3o(\xF5es) paga(s)`,"ok"),a.render())});function V(e){e.status="paga",e.pagoEm=a.hoje(),a.save("comissoes"),a.upsert("financeiro",{tipo:"pagar",descricao:`Comiss\xE3o ${a.mesNome(e.competencia)} \u2014 ${a.vendNome(e.vendedorId)}`,categoria:"Comiss\xE3o",valor:a.n(e.valor),vencimento:a.hoje(),status:"pago",pagoEm:a.hoje(),formaPag:"Transfer\xEAncia",origem:{tipo:"comissao",id:e.id},parcela:1,parcelas:1,obs:""})}a.on("exportarComissoes",e=>{const o=[["Compet\xEAncia","Vendedor","Cliente","Pedido","Regra","Base","%","Metros de piscina","R$/metro","Valor","Situa\xE7\xE3o","Pago em"]];a.where("comissoes",i=>i.competencia===e.c).forEach(i=>{const m=a.find("pedidos",i.pedidoId);o.push([a.mesNomeLongo(i.competencia),a.vendNome(i.vendedorId),a.cliNome(i.clienteId),m?"#"+m.numero:"",a.comissaoBaseNome(i.baseTipo),a.dec(i.base),a.dec(i.pct,2),a.dec(i.metros,2),a.dec(i.valorMetro),a.dec(i.valor),i.status,i.pagoEm?a.dt(i.pagoEm):""])}),a.baixar(`comissoes-${e.c}.csv`,a.csv(o),"text/csv;charset=utf-8"),a.toast("CSV exportado","ok")})})();
