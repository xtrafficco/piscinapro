(function(){"use strict";const a=window.PP,l=a.esc,c=a.saas={contexto:null,faturasVencidas:0};function b(){if(!a.nuvem||!a.nuvem.cliente)throw new Error("Sem conex\xE3o com o servidor.");return a.nuvem.cliente}async function p(e){const{data:r,error:s}=await e(b());if(s)throw new Error(a.nuvem.traduzErro(s.message));return r||[]}const u={};c.limpar=e=>{e?delete u[e]:Object.keys(u).forEach(r=>delete u[r])};function f(e,r){return u[e]!==void 0?u[e]:(u["_carregando_"+e]||(u["_carregando_"+e]=!0,r().then(s=>{u[e]=s}).catch(s=>{u[e]=[],a.toast(s.message,"err")}).finally(()=>{delete u["_carregando_"+e],a.render()})),null)}const $=e=>`<div class="card"><div class="card-bd"><div class="empty-sm">${l(e||"Carregando\u2026")}</div></div></div>`;c.carregarContexto=async()=>{c.contexto=null;const e=a.usuario();if(!e)return null;try{if(e.papel==="provedor"){const n=await p(i=>i.from("faturas_licenca").select("id",{count:"exact",head:!1}).in("status",["aberta","vencida"]).lt("vencimento",a.hoje()));return c.faturasVencidas=n.length,null}const r=await p(n=>n.from("empresas").select("*").eq("id",e.empresaId).limit(1)),s=await p(n=>n.from("faturas_licenca").select("*").eq("empresa_id",e.empresaId).order("vencimento",{ascending:!1}).limit(24)),o=r[0]||null;c.contexto=o?{empresa:o,faturas:s,diasParaVencer:a.diasEntre(a.hoje(),o.licenca_ate),bloqueada:!["trial","ativa"].includes(o.status)||o.licenca_ate<a.hoje()}:null}catch(r){console.warn("[saas] contexto",r.message)}return c.contexto},c.avisoLicenca=()=>{const e=c.contexto;return!e||a.ehProvedor()?"":e.bloqueada?`<div class="licenca-faixa bloqueada">
      <svg class="ic"><use href="#i-alerta"/></svg>
      <div><b>Licen\xE7a vencida em ${l(a.dt(e.empresa.licenca_ate))}.</b>
        O sistema est\xE1 em modo somente leitura: voc\xEA continua vendo e exportando tudo,
        mas n\xE3o consegue gravar at\xE9 regularizar.</div>
      ${a.ehAdmin()?'<button class="btn btn-sm" data-act="nav" data-v="licenca">Ver faturas</button>':""}
    </div>`:e.diasParaVencer<=7?`<div class="licenca-faixa">
      <svg class="ic"><use href="#i-licenca"/></svg>
      <div>Sua licen\xE7a vence ${e.diasParaVencer===0?"<b>hoje</b>":`em <b>${e.diasParaVencer} dia(s)</b>`} (${l(a.dt(e.empresa.licenca_ate))}).</div>
      ${a.ehAdmin()?'<button class="btn btn-sm" data-act="nav" data-v="licenca">Regularizar</button>':""}
    </div>`:""},c.evento=(e,r,s)=>{!a.nuvem||!a.nuvem.ligada||b().rpc("auditar_evento",{p_acao:e,p_resumo:r,p_tabela:s||"app"}).then(({error:o})=>{o&&console.warn("[auditoria]",o.message)}).catch(()=>{})},a.on("selecionarTudo",(e,r)=>{try{r.select()}catch{}});const g={q:"",status:""};a.view("empresas",{titulo:"Empresas clientes",sub:()=>{const e=u.empresas;if(!e)return"Carregando\u2026";const r=e.filter(s=>["trial","ativa"].includes(s.status)&&s.licenca_ate>=a.hoje()).length;return`${e.length} empresa(s) \xB7 ${r} com licen\xE7a em dia`},render(){const e=f("empresas",()=>p(n=>n.from("empresas").select("*, planos(nome)").order("nome"))),r=f("planos",()=>p(n=>n.from("planos").select("*").order("ordem")));if(!e||!r)return $("Buscando as empresas\u2026");let s=e;if(g.q){const n=a.norm(g.q);s=s.filter(i=>a.norm(i.nome).includes(n)||a.norm(i.email||"").includes(n)||a.digitos(i.cnpj||"").includes(a.digitos(g.q)))}g.status&&(s=s.filter(n=>y(n).chave===g.status));const o=e.filter(n=>n.status==="ativa").reduce((n,i)=>{const t=r.find(m=>m.id===i.plano_id);return t?n+(i.ciclo==="anual"?a.n(t.preco_ano)/12:a.n(t.preco_mes)):n},0);return`
      <div class="kpis mb">
        ${a.kpi({cls:"k-teal",lbl:"Receita recorrente (MRR)",val:a.money0(o),sm:!0,foot:"anual dividido por 12"})}
        ${a.kpi({cls:"k-ok",lbl:"Licen\xE7a em dia",sm:!0,val:String(e.filter(n=>["trial","ativa"].includes(n.status)&&n.licenca_ate>=a.hoje()).length)})}
        ${a.kpi({cls:"k-warn",lbl:"Em teste",sm:!0,val:String(e.filter(n=>n.status==="trial").length),foot:"trial ainda v\xE1lido"})}
        ${a.kpi({cls:"k-dang",lbl:"Bloqueadas",sm:!0,val:String(e.filter(n=>y(n).chave==="bloqueada").length),foot:"vencidas ou suspensas"})}
      </div>

      <div class="toolbar">
        <div class="mini-search">
          <svg class="ic"><use href="#i-busca"/></svg>
          <input class="inp" type="search" placeholder="Nome, e-mail ou CNPJ" value="${l(g.q)}"
                 data-inp="buscaEmpresa" aria-label="Buscar empresa">
        </div>
        <select class="inp" style="width:auto" data-chg="filtroEmpresa" aria-label="Situa\xE7\xE3o">
          <option value="">Todas as situa\xE7\xF5es</option>
          <option value="ativa"${g.status==="ativa"?" selected":""}>Em dia</option>
          <option value="trial"${g.status==="trial"?" selected":""}>Em teste</option>
          <option value="bloqueada"${g.status==="bloqueada"?" selected":""}>Bloqueadas</option>
        </select>
        <div class="row-end row">
          <button class="btn btn-primary" data-act="novaEmpresa"><svg class="ic"><use href="#i-plus"/></svg>Nova empresa</button>
        </div>
      </div>

      <div class="card">
        ${s.length?a.tabela({act:"editarEmpresa",rows:s,cols:[{h:"Empresa",r:n=>`<div class="row" style="gap:9px;flex-wrap:nowrap">
                <span class="av-mini">${l(a.iniciais(n.nome))}</span>
                <div><div class="strong">${l(n.nome)}</div>
                  <span class="mini">${l(n.email||"")}${n.cidade?" \xB7 "+l(n.cidade)+"/"+l(n.uf||""):""}</span></div></div>`},{h:"Plano",r:n=>`<span class="small">${l(n.planos&&n.planos.nome||"\u2014")}</span>
                <span class="mini">${n.ciclo==="anual"?"anual":"mensal"}</span>`},{h:"Licen\xE7a at\xE9",r:n=>{const i=a.diasEntre(a.hoje(),n.licenca_ate);return`<b class="small">${l(a.dt(n.licenca_ate))}</b><span class="mini">${i<0?`vencida h\xE1 ${-i} dia(s)`:i===0?"vence hoje":`faltam ${i} dia(s)`}</span>`}},{h:"Situa\xE7\xE3o",r:n=>{const i=y(n);return a.badge(i.nome,i.cls)}},{h:"",cls:"acts",r:n=>`
                <button class="btn btn-sm" data-act="acessosEmpresa" data-id="${l(n.id)}">Acessos</button>
                <button class="btn btn-sm" data-act="faturasDaEmpresa" data-id="${l(n.id)}">Faturas</button>
                <button class="btn btn-sm" data-act="gerarFatura" data-id="${l(n.id)}">Gerar fatura</button>`}]}):'<div class="card-bd"><div class="empty-sm">Nenhuma empresa com esse filtro.</div></div>'}
      </div>`}}),c.situacaoEmpresa=y;function y(e){return e.status==="cancelada"?{chave:"bloqueada",nome:"Cancelada",cls:""}:e.status==="suspensa"?{chave:"bloqueada",nome:"Suspensa",cls:"b-dang"}:e.licenca_ate<a.hoje()?{chave:"bloqueada",nome:"Vencida",cls:"b-dang"}:e.status==="inadimplente"?{chave:"bloqueada",nome:"Inadimplente",cls:"b-dang"}:e.status==="trial"?{chave:"trial",nome:"Em teste",cls:"b-warn"}:{chave:"ativa",nome:"Em dia",cls:"b-ok"}}a.on("buscaEmpresa",a.debounce((e,r)=>{g.q=r.value,a.render()},250)),a.on("filtroEmpresa",(e,r)=>{g.status=r.value,a.render()}),a.on("novaEmpresa",()=>k(null)),a.on("editarEmpresa",e=>k((u.empresas||[]).find(r=>r.id===e.id))),a.on("acessosEmpresa",e=>{const r=(u.empresas||[]).find(s=>s.id===e.id);r&&w(r)});async function w(e){try{const r=await p(o=>o.from("usuarios").select("id,nome,login,ativo,auth_uid").eq("empresa_id",e.id).eq("papel","admin").order("nome")),s=a.uid("adm");a.on(s,async(o,n)=>{const i=n.closest(".modal-box"),{ok:t,data:m}=a.lerForm(i.querySelector("#formAdminEmpresa"));if(t){n.disabled=!0;try{const{error:d}=await b().rpc("cadastrar_admin_empresa",{p_empresa:e.id,p_nome:m.nomeAdmin,p_email:m.emailAdmin});if(d)throw new Error(a.nuvem.traduzErro(d.message));a.closeTop(),a.toast("Administrador cadastrado","ok"),await w(e)}catch(d){a.toast(d.message,"err")}finally{n.disabled=!1}}}),a.modal({title:"Acessos de "+e.nome,size:"lg",body:`<div class="stack mb">${r.length?r.map(o=>`
        <div class="row" style="justify-content:space-between;gap:12px">
          <div><b>${l(o.nome)}</b><div class="mini">${l(o.login)}</div></div>
          ${a.badge(o.ativo?o.auth_uid?"Conta vinculada":"Aguardando acesso":"Inativo",o.ativo?o.auth_uid?"b-ok":"b-warn":"b-dang")}
        </div>`).join(""):'<div class="empty-sm">Nenhum administrador cadastrado.</div>'}</div>
        <form id="formAdminEmpresa">${a.form([{sep:"Novo administrador"},{k:"nomeAdmin",l:"Nome",t:"text",col:6,req:!0},{k:"emailAdmin",l:"E-mail de acesso",t:"email",col:6,req:!0}])}</form>
        <div class="alert a-info mt"><svg class="ic"><use href="#i-alerta"/></svg>
          <div class="small">A pessoa cria a pr\xF3pria senha em \u201CPrimeiro acesso \u2014 criar minha conta\u201D, usando este e-mail. Depois poder\xE1 cadastrar a equipe da empresa.</div>
        </div>`,actions:[{txt:"Cadastrar administrador",cls:"btn-primary",act:s},{txt:"Fechar",act:"fechar"}]})}catch(r){a.toast(r.message,"err")}}function k(e){const r=!e,s=u.planos||[],o=a.uid("emp");a.on(o,async(i,t)=>{const{ok:m,data:d}=a.lerForm(t.closest(".modal-box").querySelector("#formEmpresa"));if(!m)return;const A={nome:d.nome,razao_social:d.razaoSocial||null,cnpj:d.cnpj||null,email:d.email,telefone:d.telefone||null,cidade:d.cidade||null,uf:d.uf||null,plano_id:d.planoId||null,ciclo:d.ciclo||"mensal",status:d.status,licenca_ate:d.licencaAte,obs:d.obs||null};t.disabled=!0;try{if(r){const{error:_}=await b().rpc("criar_empresa_com_admin",{p_empresa:A,p_nome_admin:d.nomeAdmin,p_email_admin:d.emailAdmin});if(_)throw new Error(a.nuvem.traduzErro(_.message))}else{const{error:_}=await b().from("empresas").update(A).eq("id",e.id);if(_)throw new Error(a.nuvem.traduzErro(_.message))}c.limpar("empresas"),a.closeTop(),a.toast(r?"Empresa cadastrada":"Empresa salva","ok"),a.render()}catch(_){a.toast(_.message,"err")}finally{t.disabled=!1}});const n=a.hoje();a.modal({title:r?"Nova empresa cliente":e.nome,size:"lg",body:`<form id="formEmpresa">${a.form([{sep:"Identifica\xE7\xE3o"},{k:"nome",l:"Nome fantasia",t:"text",col:7,req:!0},{k:"cnpj",l:"CNPJ",t:"text",col:5,val:"doc"},{k:"razaoSocial",l:"Raz\xE3o social",t:"text",col:12},{k:"email",l:"E-mail de contato",t:"email",col:6,req:!0},{k:"telefone",l:"Telefone",t:"tel",col:6},{k:"cidade",l:"Cidade",t:"text",col:8},{k:"uf",l:"UF",t:"text",col:4},{sep:"Licen\xE7a"},{k:"planoId",l:"Plano",t:"select",col:6,vazio:!1,opts:s.map(i=>({v:i.id,l:`${i.nome} \u2014 ${a.money0(i.preco_mes)}/m\xEAs`}))},{k:"ciclo",l:"Ciclo de cobran\xE7a",t:"select",col:6,vazio:!1,opts:[{v:"mensal",l:"Mensal"},{v:"anual",l:"Anual (2 meses de desconto)"}]},{k:"status",l:"Situa\xE7\xE3o",t:"select",col:6,vazio:!1,opts:[{v:"trial",l:"Em teste"},{v:"ativa",l:"Ativa"},{v:"inadimplente",l:"Inadimplente"},{v:"suspensa",l:"Suspensa"},{v:"cancelada",l:"Cancelada"}]},{k:"licencaAte",l:"Licen\xE7a v\xE1lida at\xE9",t:"date",col:6,req:!0,hint:"Passou desta data, a empresa entra em somente leitura"},{k:"obs",l:"Observa\xE7\xF5es",t:"textarea",col:12,rows:2},...r?[{sep:"Primeiro administrador da empresa"},{k:"nomeAdmin",l:"Nome do administrador",t:"text",col:6,req:!0},{k:"emailAdmin",l:"E-mail do administrador",t:"email",col:6,req:!0,hint:"\xC9 com este e-mail que ele cria a conta e entra pela primeira vez"}]:[]],e?{nome:e.nome,razaoSocial:e.razao_social,cnpj:e.cnpj,email:e.email,telefone:e.telefone,cidade:e.cidade,uf:e.uf,planoId:e.plano_id,ciclo:e.ciclo,status:e.status,licencaAte:e.licenca_ate,obs:e.obs}:{ciclo:"mensal",status:"trial",licencaAte:a.addDias(n,14),planoId:(s[0]||{}).id})}</form>
    ${r?`<div class="alert a-info mt"><svg class="ic"><use href="#i-alerta"/></svg>
      <div class="small">O administrador \xE9 cadastrado junto, mas <b>a senha \xE9 dele</b>: ele abre o
      sistema, clica em \u201CPrimeiro acesso \u2014 criar minha conta\u201D e usa esse mesmo e-mail.</div></div>`:""}`,actions:[{txt:r?"Cadastrar empresa":"Salvar",cls:"btn-primary",act:o},r?null:{txt:"Acessos",act:"acessosEmpresa",data:{id:e.id}},{txt:"Cancelar",act:"fechar"}]})}a.on("gerarFatura",async e=>{try{const{data:r,error:s}=await b().rpc("gerar_fatura",{p_empresa:e.id,p_dias_antes:7});if(s)throw new Error(a.nuvem.traduzErro(s.message));const o=Array.isArray(r)?r[0]:r;c.limpar("faturas"),a.toast(`Fatura de ${a.money0(o.valor)} gerada \u2014 vence ${a.dt(o.vencimento)}`,"ok"),a.ir("faturas")}catch(r){a.toast(r.message,"err")}}),a.on("faturasDaEmpresa",e=>{v.empresa=e.id,a.ir("faturas")}),a.view("planos",{titulo:"Planos",sub:"O que cada empresa pode contratar",render(){const e=f("planos",()=>p(s=>s.from("planos").select("*").order("ordem"))),r=f("empresas",()=>p(s=>s.from("empresas").select("*, planos(nome)").order("nome")));return!e||!r?$():`
      <div class="toolbar">
        <div class="row-end row">
          <button class="btn btn-primary" data-act="novoPlano"><svg class="ic"><use href="#i-plus"/></svg>Novo plano</button>
        </div>
      </div>
      <div class="grid g-3">
        ${e.map(s=>{const o=r.filter(n=>n.plano_id===s.id).length;return`<div class="card">
            <div class="card-hd"><div><h3>${l(s.nome)}</h3>
              <div class="sub">${l(s.descricao||"")}</div></div>
              <div class="right">${a.badge(s.ativo?"Ativo":"Inativo",s.ativo?"b-ok":"")}</div></div>
            <div class="card-bd">
              <div class="plano-preco">${l(a.money0(s.preco_mes))}<small>/m\xEAs</small></div>
              <div class="small muted" style="margin-bottom:12px">ou ${l(a.money0(s.preco_ano))} por ano</div>
              <ul class="plano-lista">
                ${(s.recursos||[]).map(n=>`<li><svg class="ic ic-sm"><use href="#i-check"/></svg>${l(n)}</li>`).join("")}
              </ul>
              <div class="sep"></div>
              <dl class="dl">
                <dt>Usu\xE1rios</dt><dd>${s.max_usuarios?s.max_usuarios:"sem limite"}</dd>
                <dt>Pedidos/m\xEAs</dt><dd>${s.max_pedidos_mes?s.max_pedidos_mes:"sem limite"}</dd>
                <dt>Empresas neste plano</dt><dd><b>${o}</b></dd>
              </dl>
            </div>
            <div class="card-ft"><button class="btn btn-sm" data-act="editarPlano" data-id="${l(s.id)}">Editar</button></div>
          </div>`}).join("")}
      </div>`}}),a.on("novoPlano",()=>E(null)),a.on("editarPlano",e=>E((u.planos||[]).find(r=>r.id===e.id)));function E(e){const r=!e,s=a.uid("pl");a.on(s,async(o,n)=>{const{ok:i,data:t}=a.lerForm(n.closest(".modal-box").querySelector("#formPlano"));if(!i)return;const m={nome:t.nome,descricao:t.descricao||null,preco_mes:a.n(t.precoMes),preco_ano:a.n(t.precoAno),max_usuarios:a.n(t.maxUsuarios),max_pedidos_mes:a.n(t.maxPedidos),recursos:String(t.recursos||"").split(`
`).map(d=>d.trim()).filter(Boolean),ativo:!!t.ativo,ordem:a.n(t.ordem)};try{if(r){m.id="pl_"+a.norm(t.nome).replace(/[^a-z0-9]/g,"").slice(0,20);const{error:d}=await b().from("planos").insert(m);if(d)throw new Error(a.nuvem.traduzErro(d.message))}else{const{error:d}=await b().from("planos").update(m).eq("id",e.id);if(d)throw new Error(a.nuvem.traduzErro(d.message))}c.limpar("planos"),a.closeTop(),a.toast("Plano salvo","ok"),a.render()}catch(d){a.toast(d.message,"err")}}),a.modal({title:r?"Novo plano":e.nome,size:"lg",body:`<form id="formPlano">${a.form([{k:"nome",l:"Nome do plano",t:"text",col:8,req:!0},{k:"ordem",l:"Ordem",t:"number",col:4,step:1},{k:"descricao",l:"Descri\xE7\xE3o curta",t:"text",col:12},{k:"precoMes",l:"Pre\xE7o mensal (R$)",t:"money",col:6,req:!0,val:"naoNegativo"},{k:"precoAno",l:"Pre\xE7o anual (R$)",t:"money",col:6,req:!0,val:"naoNegativo"},{k:"maxUsuarios",l:"M\xE1ximo de usu\xE1rios",t:"number",col:6,step:1,hint:"0 = sem limite"},{k:"maxPedidos",l:"M\xE1ximo de pedidos/m\xEAs",t:"number",col:6,step:1,hint:"0 = sem limite"},{k:"recursos",l:"O que est\xE1 incluso",t:"textarea",col:12,rows:5,hint:"Um item por linha"},{k:"ativo",l:"Plano dispon\xEDvel para contrata\xE7\xE3o",t:"checkbox",col:12}],e?{nome:e.nome,ordem:e.ordem,descricao:e.descricao,precoMes:e.preco_mes,precoAno:e.preco_ano,maxUsuarios:e.max_usuarios,maxPedidos:e.max_pedidos_mes,recursos:(e.recursos||[]).join(`
`),ativo:e.ativo}:{ativo:!0,ordem:9,maxUsuarios:0,maxPedidos:0})}</form>`,actions:[{txt:"Salvar",cls:"btn-primary",act:s},{txt:"Cancelar",act:"fechar"}]})}const v={empresa:"",status:""};a.view("faturas",{titulo:"Faturas da licen\xE7a",sub:()=>{const e=u.faturas;if(!e)return"Carregando\u2026";const r=e.filter(s=>s.status==="aberta"||s.status==="vencida");return r.length?`${r.length} em aberto \u2014 ${a.money0(r.reduce((s,o)=>s+a.n(o.valor),0))}`:"Nenhuma fatura em aberto"},render(){const e=f("faturas",()=>p(i=>i.from("faturas_licenca").select("*, empresas(nome)").order("vencimento",{ascending:!1}).limit(500)));if(!e)return $("Buscando as faturas\u2026");let r=e;v.empresa&&(r=r.filter(i=>i.empresa_id===v.empresa)),v.status&&(r=r.filter(i=>i.status===v.status));const s=e.filter(i=>i.status==="aberta"),o=e.filter(i=>i.status==="vencida"||i.status==="aberta"&&i.vencimento<a.hoje()),n=e.filter(i=>i.status==="paga"&&a.mesKey(i.pago_em)===a.mesKey(a.hoje()));return`
      <div class="kpis mb">
        ${a.kpi({cls:"k-ok",lbl:"Recebido no m\xEAs",sm:!0,val:a.money0(n.reduce((i,t)=>i+a.n(t.valor),0)),foot:`${n.length} fatura(s)`})}
        ${a.kpi({cls:"k-warn",lbl:"Em aberto",sm:!0,val:a.money0(s.reduce((i,t)=>i+a.n(t.valor),0)),foot:`${s.length} fatura(s)`})}
        ${a.kpi({cls:"k-dang",lbl:"Vencidas",sm:!0,val:a.money0(o.reduce((i,t)=>i+a.n(t.valor),0)),foot:`${o.length} fatura(s)`})}
      </div>

      <div class="toolbar">
        <select class="inp" style="width:auto" data-chg="filtroFatura" data-f="status" aria-label="Situa\xE7\xE3o">
          <option value="">Todas</option>
          <option value="aberta"${v.status==="aberta"?" selected":""}>Em aberto</option>
          <option value="vencida"${v.status==="vencida"?" selected":""}>Vencidas</option>
          <option value="paga"${v.status==="paga"?" selected":""}>Pagas</option>
        </select>
        ${v.empresa?`<button class="btn btn-sm" data-act="limparFiltroFatura">
          S\xF3 ${l((e.find(i=>i.empresa_id===v.empresa)||{}).empresas?.nome||"uma empresa")} \u2715</button>`:""}
        <div class="row-end row">
          <button class="btn" data-act="atualizarLicencas"><svg class="ic"><use href="#i-relogio"/></svg>Atualizar vencimentos</button>
        </div>
      </div>

      <div class="card">
        ${r.length?a.tabela({rows:a.paginar("faturas",r).linhas,cols:[{h:"Empresa",r:i=>`<div class="strong">${l(i.empresas&&i.empresas.nome||i.empresa_id)}</div>
              <span class="mini">${l(i.descricao)}</span>`},{h:"Compet\xEAncia",r:i=>`<span class="small">${l(a.mesNome(i.competencia))}</span>`},{h:"Vencimento",r:i=>`<b class="small"${i.status!=="paga"&&i.vencimento<a.hoje()?' style="color:var(--dang)"':""}>${l(a.dt(i.vencimento))}</b>`},{h:"Situa\xE7\xE3o",r:i=>{const t={aberta:["Em aberto","b-info"],paga:["Paga","b-ok"],vencida:["Vencida","b-dang"],cancelada:["Cancelada",""]}[i.status]||[i.status,""];return a.badge(t[0],t[1])+(i.gateway?`<span class="mini">${l(i.gateway)}</span>`:"")}},{h:"Valor",cls:"num",r:i=>`<b>${l(a.money(i.valor))}</b>`},{h:"",cls:"acts",r:i=>i.status==="paga"?`<span class="tiny faint">${l(a.dt(i.pago_em))}</span>`:`${i.gateway_url?`<a class="btn btn-sm" href="${l(i.gateway_url)}" target="_blank" rel="noopener">Link</a> `:`<button class="btn btn-sm" data-act="cobrarMP" data-id="${l(i.id)}">Cobrar</button> `}
                 <button class="btn btn-sm btn-ok" data-act="baixarFatura" data-id="${l(i.id)}">Dar baixa</button>`}]})+a.paginar("faturas",r).html:'<div class="card-bd"><div class="empty-sm">Nenhuma fatura com esse filtro.</div></div>'}
      </div>`}}),a.on("filtroFatura",(e,r)=>{v.status=r.value,a.resetPagina("faturas"),a.render()}),a.on("limparFiltroFatura",()=>{v.empresa="",a.render()}),a.on("atualizarLicencas",async()=>{try{const{data:e,error:r}=await b().rpc("atualizar_licencas");if(r)throw new Error(a.nuvem.traduzErro(r.message));const s=Array.isArray(e)?e[0]:e;c.limpar(),a.toast(`${s.faturas_vencidas} fatura(s) marcada(s) como vencida \xB7 ${s.empresas_bloqueadas} empresa(s) bloqueada(s)`,"ok"),a.render()}catch(e){a.toast(e.message,"err")}}),a.on("baixarFatura",async e=>{const r=(u.faturas||[]).find(s=>s.id===e.id);if(await a.confirmar(`Dar baixa em ${a.money(r.valor)} de ${r.empresas&&r.empresas.nome||""}?`,{title:"Registrar pagamento",okTxt:"Dar baixa",aviso:"A licen\xE7a da empresa \xE9 estendida at\xE9 o fim do per\xEDodo pago."}))try{const{error:s}=await b().rpc("baixar_fatura_manual",{p_fatura:e.id,p_pago_em:a.hoje()});if(s)throw new Error(a.nuvem.traduzErro(s.message));c.limpar(),a.toast("Pagamento registrado e licen\xE7a estendida","ok"),a.render()}catch(s){a.toast(s.message,"err")}}),a.on("cobrarMP",async e=>{a.toast("Gerando cobran\xE7a no Mercado Pago\u2026");try{const{data:r}=await b().auth.getSession(),s=r&&r.session?r.session.access_token:"",o=await fetch(a.nuvem.urlFuncao("licenca-mercadopago/cobranca"),{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+s},body:JSON.stringify({faturaId:e.id})}),n=await o.json();if(!o.ok)throw new Error(n.erro||"o Mercado Pago recusou");c.limpar("faturas"),a.render(),a.modal({title:"Cobran\xE7a criada",size:"sm",body:`<p style="margin-top:0;font-size:13.5px;line-height:1.65">Mande este link para a empresa. A baixa \xE9 autom\xE1tica assim que o pagamento for aprovado.</p>
        <div class="f"><input class="inp" value="${l(n.url)}" readonly data-act="selecionarTudo"></div>
        <a class="btn btn-teal btn-block" href="${l(n.url)}" target="_blank" rel="noopener" style="margin-top:8px">Abrir a p\xE1gina de pagamento</a>`,actions:[{txt:"Fechar",act:"fechar"}]})}catch(r){a.toast("N\xE3o consegui gerar a cobran\xE7a: "+r.message,"err")}}),a.view("saude",{titulo:"Sa\xFAde do sistema",sub:"Est\xE1 funcionando? E como cada cliente usa?",render(){const e=f("pulso",()=>p(t=>t.rpc("pulso_do_servico"))),r=f("uso",()=>p(t=>t.rpc("uso_das_empresas"))),s=f("checagens",()=>p(t=>t.rpc("saude_do_sistema")));if(!e||!r||!s)return $("Medindo\u2026");const o=s.filter(t=>t.qtd>0),n=o.filter(t=>t.gravidade==="erro"),i=o.length===0;return`
      <div class="toolbar">
        <div class="row-end row">
          <button class="btn" data-act="remedirSaude"><svg class="ic"><use href="#i-pulso"/></svg>Medir de novo</button>
        </div>
      </div>

      <div class="alert ${i?"a-ok":n.length?"a-dang":"a-warn"} mb">
        <svg class="ic"><use href="#${i?"i-check":"i-alerta"}"/></svg>
        <div>${i?"<b>Nada torto.</b> As oito checagens de integridade passaram em todas as empresas.":`<b>${o.length} ponto(s) de aten\xE7\xE3o${n.length?", sendo "+n.length+" erro(s)":""}.</b>
             Erro \xE9 bug ou dado inconsistente; aviso \xE9 opera\xE7\xE3o parada. Detalhe ao lado.`}</div>
      </div>

      <div class="grid g-2 mb">
        <div class="card">
          <div class="card-hd"><div><h3>Pulso do servi\xE7o</h3><div class="sub">Agora</div></div></div>
          <div class="card-bd"><dl class="dl">
            ${e.map(t=>`<dt>${l(t.indicador)}</dt><dd><b>${l(t.valor)}</b></dd>`).join("")}
          </dl></div>
        </div>

        <div class="card">
          <div class="card-hd"><div><h3>Integridade dos dados</h3>
            <div class="sub">Checagens que apontam para bug ou opera\xE7\xE3o parada</div></div></div>
          <div class="card-bd">
            ${o.length?o.map(t=>`
              <div class="att-item">
                <span class="dot ${t.gravidade==="erro"?"dot-dang":"dot-warn"}"></span>
                <div class="txt"><b>${l(t.checagem)}</b><small>${l(t.empresa)}</small></div>
                <div class="val">${t.qtd}</div>
              </div>`).join(""):'<div class="empty-sm">Tudo certo em todas as empresas.</div>'}
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-hd"><div><h3>Uso por empresa</h3>
          <div class="sub">Quem est\xE1 usando de verdade e quem parou</div></div></div>
        ${a.tabela({rows:r,cols:[{h:"Empresa",r:t=>`<div class="strong">${l(t.empresa)}</div>
            <span class="mini">${l(t.plano)} \xB7 licen\xE7a at\xE9 ${l(a.dt(t.licenca_ate))}</span>`},{h:"Usu\xE1rios",cls:"num",r:t=>`<b>${t.usuarios_com_conta}</b><span class="mini">de ${t.usuarios} cadastrados</span>`},{h:"\xDAltimo acesso",r:t=>t.ultimo_acesso?`<span class="small">${l(a.tempoRelativo(String(t.ultimo_acesso).slice(0,10)))}</span>`:'<span class="tiny faint">nunca</span>'},{h:"Leads",cls:"num",r:t=>String(t.leads)},{h:"Pedidos no m\xEAs",cls:"num",r:t=>`<b>${t.pedidos_mes}</b>`},{h:"Faturamento no m\xEAs",cls:"num",r:t=>l(a.moneyK(t.faturamento_mes))},{h:"Registros",cls:"num",r:t=>`<span class="tnum">${t.registros}</span>`}]})}
      </div>`}}),a.on("remedirSaude",()=>{c.limpar("pulso"),c.limpar("uso"),c.limpar("checagens"),a.render()}),a.view("telemetria",{titulo:"Erros em campo",sub:"Falhas do cliente reportadas pelo app, por empresa",render(){const e=f("telemetria",()=>p(o=>o.from("telemetria").select("*").order("em",{ascending:!1}).limit(300)));if(!e)return $("Buscando erros\u2026");const r={};e.forEach(o=>{r[o.empresa_id||"\u2014"]=(r[o.empresa_id||"\u2014"]||0)+1});const s=Object.entries(r).sort((o,n)=>n[1]-o[1]).slice(0,4);return`
      <div class="toolbar"><div class="row-end row">
        <button class="btn" data-act="recarregarTelemetria"><svg class="ic"><use href="#i-pulso"/></svg>Recarregar</button>
      </div></div>

      <div class="alert ${e.length?"a-warn":"a-ok"} mb">
        <svg class="ic"><use href="#${e.length?"i-alerta":"i-check"}"/></svg>
        <div>${e.length?`<b>${e.length} evento(s)</b> nos \xFAltimos 90 dias${s.length?" \xB7 concentra em "+l(s.map(o=>o[0]+" ("+o[1]+")").join(", ")):""}.`:"<b>Nenhum erro reportado.</b> O app n\xE3o registrou falhas de cliente nos \xFAltimos 90 dias."}</div>
      </div>

      ${e.length?`<div class="card"><div class="card-bd">${a.tabela({rows:e,cols:[{h:"Quando",r:o=>`<span class="small">${l(a.dtHora(o.em))}</span>`},{h:"Empresa",r:o=>`<span class="mini">${l(o.empresa_id||"\u2014")}</span>`},{h:"Usu\xE1rio",r:o=>`<span class="mini">${l(o.usuario_id||"\u2014")} \xB7 ${l(o.papel||"")}</span>`},{h:"Tipo",r:o=>`<span class="mini">${l(o.tipo)}</span>`},{h:"Rota",r:o=>`<span class="mini">${l(o.rota||"\u2014")}</span>`},{h:"Mensagem",r:o=>`<span class="small">${l(a.trunc(o.mensagem||"",180))}</span>`}]})}</div></div>`:""}`}}),a.on("recarregarTelemetria",()=>{c.limpar("telemetria"),a.render()});const h={q:"",tabela:"",acao:"",empresa:""};function x(e){const s=f(e?"trilhaGlobal":"trilhaEmpresa",()=>p(t=>{let m=t.from("auditoria").select("*").order("em",{ascending:!1}).limit(600);return e||(m=m.eq("empresa_id",a.empresaAtual())),m}));if(!s)return $("Lendo a trilha\u2026");let o=s;if(h.tabela&&(o=o.filter(t=>t.tabela===h.tabela)),h.acao&&(o=o.filter(t=>t.acao===h.acao)),h.q){const t=a.norm(h.q);o=o.filter(m=>a.norm(m.usuario_nome||"").includes(t)||a.norm(m.resumo||"").includes(t)||a.norm(m.registro_id||"").includes(t))}const n=Array.from(new Set(s.map(t=>t.tabela))).sort(),i={insert:["Criou","b-ok"],update:["Alterou","b-info"],delete:["Excluiu","b-dang"],evento:["Evento","b-areia"]};return`
    <div class="toolbar">
      <div class="mini-search">
        <svg class="ic"><use href="#i-busca"/></svg>
        <input class="inp" type="search" placeholder="Pessoa, registro ou descri\xE7\xE3o" value="${l(h.q)}"
               data-inp="buscaAud" aria-label="Buscar na trilha">
      </div>
      <select class="inp" style="width:auto" data-chg="filtroAud" data-f="tabela" aria-label="Tabela">
        <option value="">Todas as tabelas</option>
        ${n.map(t=>`<option value="${l(t)}"${h.tabela===t?" selected":""}>${l(t)}</option>`).join("")}
      </select>
      <select class="inp" style="width:auto" data-chg="filtroAud" data-f="acao" aria-label="A\xE7\xE3o">
        <option value="">Toda a\xE7\xE3o</option>
        ${Object.keys(i).map(t=>`<option value="${t}"${h.acao===t?" selected":""}>${i[t][0]}</option>`).join("")}
      </select>
      <div class="row-end row">
        <button class="btn" data-act="recarregarTrilha" data-g="${e?1:0}"><svg class="ic"><use href="#i-relogio"/></svg>Atualizar</button>
        <button class="btn" data-act="exportarTrilha"><svg class="ic"><use href="#i-down"/></svg>CSV</button>
      </div>
    </div>

    <div class="card">
      <div class="card-hd"><div><h3>Quem mexeu no qu\xEA</h3>
        <div class="sub">${o.length} registro(s) \xB7 os \xFAltimos 600 \xB7 gravado pelo banco, n\xE3o pelo navegador</div></div></div>
      ${o.length?a.tabela({act:"verAuditoria",rows:a.paginar("trilha",o).linhas,cols:[{h:"Quando",w:"128px",r:t=>`<b class="small">${l(a.dtHora(t.em))}</b>
            <span class="mini">${l(a.tempoRelativo(String(t.em).slice(0,10)))}</span>`},{h:"Quem",r:t=>`<div class="strong">${l(t.usuario_nome||"\u2014")}</div>
            <span class="mini">${l(a.PAPEIS[t.papel]?a.PAPEIS[t.papel].nome:t.papel||"")}</span>`},e?{h:"Empresa",r:t=>`<span class="small">${l(t.empresa_id||"\u2014")}</span>`}:null,{h:"A\xE7\xE3o",r:t=>{const m=i[t.acao]||[t.acao,""];return a.badge(m[0],m[1])}},{h:"Onde",r:t=>`<span class="small">${l(t.tabela)}</span>
            <span class="mini">${l(t.resumo||t.registro_id||"")}</span>`},{h:"Campos",r:t=>t.campos&&t.campos.length?`<span class="small">${l(t.campos.slice(0,3).join(", "))}${t.campos.length>3?` +${t.campos.length-3}`:""}</span>`:'<span class="tiny faint">\u2014</span>'},{h:"Origem",r:t=>t.origem==="banco"?a.badge("Banco","b-teal"):a.badge("App","")}]})+a.paginar("trilha",o).html:'<div class="card-bd"><div class="empty-sm">Nada registrado com esse filtro.</div></div>'}
      <div class="card-ft">
        <svg class="ic ic-sm faint"><use href="#i-alerta"/></svg>
        <span class="small muted"><b>Banco</b> \xE9 gravado por gatilho e n\xE3o d\xE1 para burlar \u2014 nem pelo DevTools.
        <b>App</b> \xE9 informado pelo sistema (login, exporta\xE7\xE3o) e serve para acompanhar, n\xE3o como prova.
        A trilha n\xE3o pode ser editada nem apagada por ningu\xE9m.</span>
      </div>
    </div>`}a.view("auditoria",{titulo:"Trilha de auditoria",sub:"O que aconteceu na sua empresa",render(){return x(!1)}}),a.view("trilha",{titulo:"Auditoria global",sub:"Todas as empresas",render(){return x(!0)}}),a.on("buscaAud",a.debounce((e,r)=>{h.q=r.value,a.resetPagina("trilha"),a.render()},250)),a.on("filtroAud",(e,r)=>{h[e.f]=r.value,a.resetPagina("trilha"),a.render()}),a.on("recarregarTrilha",e=>{c.limpar(a.n(e.g)?"trilhaGlobal":"trilhaEmpresa"),a.render()}),a.on("verAuditoria",e=>{const s=(u.trilhaGlobal||u.trilhaEmpresa||[]).find(i=>String(i.id)===String(e.id));if(!s)return;const o=i=>{const t=s.antes?s.antes[i]:void 0,m=s.depois?s.depois[i]:void 0;return`<tr><td>${l(i)}</td>
      <td class="faint">${l(JSON.stringify(t===void 0?null:t))}</td>
      <td><b>${l(JSON.stringify(m===void 0?null:m))}</b></td></tr>`},n=s.campos&&s.campos.length?s.campos:Object.keys(s.depois||s.antes||{}).filter(i=>i!=="empresa_id").slice(0,20);a.modal({title:`${s.usuario_nome||"\u2014"} \xB7 ${s.acao} em ${s.tabela}`,sub:a.dtHora(s.em),size:"lg",body:`<dl class="dl mb">
        <dt>Registro</dt><dd>${l(s.resumo||s.registro_id||"\u2014")}</dd>
        <dt>Origem</dt><dd>${s.origem==="banco"?"gatilho do banco (n\xE3o falsific\xE1vel)":"informado pelo app"}</dd>
        ${s.empresa_id?`<dt>Empresa</dt><dd>${l(s.empresa_id)}</dd>`:""}
      </dl>
      ${n.length?`<div class="tbl-wrap"><table class="tbl">
        <thead><tr><th>Campo</th><th>Antes</th><th>Depois</th></tr></thead>
        <tbody>${n.map(o).join("")}</tbody></table></div>`:'<div class="empty-sm">Sem detalhe de campo.</div>'}`,actions:[{txt:"Fechar",act:"fechar"}]})}),a.on("exportarTrilha",()=>{const e=u.trilhaGlobal||u.trilhaEmpresa||[],r=[["Quando","Empresa","Quem","Papel","A\xE7\xE3o","Tabela","Registro","Campos","Origem"]];e.forEach(s=>r.push([a.dtHora(s.em),s.empresa_id||"",s.usuario_nome||"",s.papel||"",s.acao,s.tabela,s.resumo||s.registro_id||"",(s.campos||[]).join(" "),s.origem])),a.baixar(`auditoria-${a.hoje()}.csv`,a.csv(r),"text/csv;charset=utf-8"),c.evento("exportou","Exportou a trilha de auditoria em CSV","auditoria")}),a.view("licenca",{titulo:"Minha licen\xE7a",sub:()=>{const e=c.contexto;return e?e.bloqueada?"Licen\xE7a vencida \u2014 o sistema est\xE1 em somente leitura":`V\xE1lida at\xE9 ${a.dt(e.empresa.licenca_ate)}`:"Carregando\u2026"},render(){const e=c.contexto;if(!e)return $("Buscando sua licen\xE7a\u2026");const r=e.empresa,s=e.faturas.filter(o=>o.status==="aberta"||o.status==="vencida");return`
      <div class="kpis mb">
        ${a.kpi({cls:e.bloqueada?"k-dang":"k-teal",lbl:"Situa\xE7\xE3o",sm:!0,val:y(r).nome,foot:`licen\xE7a at\xE9 ${a.dt(r.licenca_ate)}`})}
        ${a.kpi({lbl:"Dias restantes",sm:!0,val:e.diasParaVencer<0?"vencida":String(e.diasParaVencer)})}
        ${a.kpi({cls:"k-warn",lbl:"Faturas em aberto",sm:!0,val:String(s.length),foot:a.money0(s.reduce((o,n)=>o+a.n(n.valor),0))})}
      </div>

      ${e.bloqueada?`<div class="alert a-dang mb"><svg class="ic"><use href="#i-alerta"/></svg>
        <div><b>O sistema est\xE1 em somente leitura.</b> Voc\xEA continua vendo tudo e consegue baixar
        o backup em Configura\xE7\xF5es \u2014 mas n\xE3o d\xE1 para gravar at\xE9 a licen\xE7a ser renovada.</div></div>`:""}

      <div class="grid g-1-2">
        <div class="card">
          <div class="card-hd"><div><h3>Contrato</h3></div></div>
          <div class="card-bd"><dl class="dl">
            <dt>Empresa</dt><dd><b>${l(r.nome)}</b></dd>
            ${r.cnpj?`<dt>CNPJ</dt><dd>${l(r.cnpj)}</dd>`:""}
            <dt>Ciclo</dt><dd>${r.ciclo==="anual"?"Anual":"Mensal"}</dd>
            <dt>Licen\xE7a at\xE9</dt><dd><b>${l(a.dt(r.licenca_ate))}</b></dd>
            <dt>Contato</dt><dd>${l(r.email)}</dd>
          </dl></div>
        </div>

        <div class="card">
          <div class="card-hd"><div><h3>Faturas</h3><div class="sub">As mais recentes primeiro</div></div></div>
          ${e.faturas.length?a.tabela({rows:e.faturas,cols:[{h:"Compet\xEAncia",r:o=>`<b class="small">${l(a.mesNome(o.competencia))}</b>
              <span class="mini">${l(o.descricao)}</span>`},{h:"Vencimento",r:o=>l(a.dt(o.vencimento))},{h:"Situa\xE7\xE3o",r:o=>{const n={aberta:["Em aberto","b-info"],paga:["Paga","b-ok"],vencida:["Vencida","b-dang"],cancelada:["Cancelada",""]}[o.status]||[o.status,""];return a.badge(n[0],n[1])}},{h:"Valor",cls:"num",r:o=>`<b>${l(a.money(o.valor))}</b>`},{h:"",cls:"acts",r:o=>o.status!=="paga"&&o.gateway_url?`<a class="btn btn-sm btn-teal" href="${l(o.gateway_url)}" target="_blank" rel="noopener">Pagar</a>`:o.status==="paga"?`<span class="tiny faint">${l(a.dt(o.pago_em))}</span>`:""}]}):'<div class="card-bd"><div class="empty-sm">Nenhuma fatura emitida ainda.</div></div>'}
          <div class="card-ft">
            <svg class="ic ic-sm faint"><use href="#i-alerta"/></svg>
            <span class="small muted">N\xE3o achou o link de pagamento? Fale com o suporte \u2014 a cobran\xE7a \xE9 emitida por l\xE1.</span>
          </div>
        </div>
      </div>`}})})();
