(function(){"use strict";const a=window.PP,r=a.esc,m={q:"",cat:"",so:"ativos"};a.view("produtos",{titulo:"Produtos & cat\xE1logo",sub:()=>`${a.where("produtos",t=>t.ativo).length} itens ativos em ${a.CATEGORIAS_PROD.length} categorias`,render(){let t=a.all("produtos").slice();if(m.so==="ativos"&&(t=t.filter(e=>e.ativo)),m.cat&&(t=t.filter(e=>e.categoria===m.cat)),m.q){const e=a.norm(m.q);t=t.filter(c=>a.norm(c.nome).includes(e)||a.norm(c.sku).includes(e))}t=a.sortBy(t,e=>e.categoria+"|"+e.nome);const o=a.paginar("produtos",t),d=a.where("produtos",e=>e.categoria==="Piscina"&&e.ativo),s=t.length?a.soma(t,e=>e.preco?(e.preco-e.custo)/e.preco*100:0)/t.length:0;return`
      <div class="kpis mb">
        ${a.kpi({cls:"k-teal",lbl:"Itens ativos",val:String(a.where("produtos",e=>e.ativo).length)})}
        ${a.kpi({lbl:"Modelos de piscina",val:String(d.length)})}
        ${a.kpi({cls:"k-ok",lbl:"Margem m\xE9dia",val:a.pct(s,1),foot:"sobre o pre\xE7o de tabela"})}
        ${a.kpi({cls:"k-ocre",lbl:"Valor do estoque",val:a.money0(a.soma(a.where("produtos",e=>e.controlaEstoque),e=>a.n(e.estoque)*a.n(e.custo))),sm:!0,foot:"a pre\xE7o de custo"})}
      </div>

      <div class="toolbar">
        <div class="mini-search">
          <svg class="ic"><use href="#i-busca"/></svg>
          <input class="inp" type="search" placeholder="Nome ou SKU" value="${r(m.q)}" data-inp="buscaProd" aria-label="Buscar produtos">
        </div>
        <div class="seg">
          <button class="${m.cat?"":"on"}" data-act="filtroProdCat" data-c="">Todas</button>
          ${a.CATEGORIAS_PROD.map(e=>`<button class="${m.cat===e?"on":""}" data-act="filtroProdCat" data-c="${r(e)}">${r(e)}</button>`).join("")}
        </div>
        <label class="check" style="margin-left:6px"><input type="checkbox" ${m.so==="todos"?"checked":""} data-chg="prodInativos"><span class="small">Mostrar inativos</span></label>
        <div class="row-end row">
          <button class="btn btn-primary" data-act="novoProduto"><svg class="ic"><use href="#i-plus"/></svg>Novo produto</button>
        </div>
      </div>

      ${(!m.cat||m.cat==="Piscina")&&!m.q?`
      <div class="card mb">
        <div class="card-hd"><div><h3>Linha de piscinas</h3><div class="sub">Clique para editar especifica\xE7\xF5es e pre\xE7os</div></div></div>
        <div class="card-bd">
          <div class="cat-grid">${d.map(e=>`
            <button type="button" class="cat-card" data-act="editarProduto" data-id="${e.id}">
              <div class="cat-vis">${P(e.specs)}</div>
              <div class="cat-bd">
                <div class="nm">${r(e.nome.replace("Piscina ",""))}</div>
                <div class="dim">${a.dec(e.specs.compr,2)} \xD7 ${a.dec(e.specs.larg,2)} \xD7 ${a.dec(e.specs.prof,2)} m</div>
                <div class="dim">${a.dec(e.specs.volume,1)} mil L \xB7 ${a.dec(e.specs.area,1)} m\xB2</div>
                <div class="pr">${r(a.money0(e.preco))}</div>
                <div class="tiny faint" style="margin-top:3px">margem ${a.dec(e.preco?(e.preco-e.custo)/e.preco*100:0,0)}%${e.controlaEstoque?` \xB7 ${a.n(e.estoque)} em estoque`:" \xB7 sob encomenda"}</div>
              </div>
            </button>`).join("")}</div>
        </div>
      </div>`:""}

      <div class="card">
        <div class="card-hd"><div><h3>Tabela completa</h3><div class="sub">${t.length} item(ns)</div></div></div>
        ${t.length?a.tabela({act:"editarProduto",rows:o.linhas,cols:[{h:"SKU",w:"118px",r:e=>`<span class="small tnum">${r(e.sku)}</span>`},{h:"Produto",r:e=>`<div class="strong">${r(e.nome)}</div><span class="mini">${r(e.categoria)}${e.ativo?"":" \xB7 INATIVO"}</span>`},{h:"Un.",r:e=>`<span class="small">${r(e.unidade)}</span>`},{h:"Custo",cls:"num",r:e=>r(a.money(e.custo))},{h:"Pre\xE7o",cls:"num",r:e=>`<b>${r(a.money(e.preco))}</b>`},{h:"Margem",cls:"num",r:e=>{const c=e.preco?(e.preco-e.custo)/e.preco*100:0;return a.badge(a.dec(c,0)+"%",c>=45?"b-ok":c>=30?"b-warn":"b-dang")}},{h:"Estoque",cls:"num",r:e=>e.controlaEstoque?`<b style="${a.disponivel(e.id)<=a.n(e.estoqueMin)?"color:var(--dang)":""}">${a.disponivel(e.id)}</b><span class="mini">${a.n(e.estoque)} em casa \xB7 m\xEDn. ${a.n(e.estoqueMin)}</span>`:'<span class="faint small">n\xE3o controla</span>'}]})+o.html:a.vazio("Nenhum produto encontrado","Ajuste os filtros ou cadastre um item.",{act:"novoProduto",txt:"Novo produto"})}
      </div>`}});function P(t){t=t||{};const o=a.n(t.larg)/Math.max(a.n(t.compr),1),d=120,s=Math.max(d*o,26);return`<svg viewBox="0 0 140 92" preserveAspectRatio="xMidYMid meet">
    <rect x="${(140-d)/2}" y="${(92-s)/2}" width="${d}" height="${s}" rx="9" fill="#6FD3D8" fill-opacity=".45" stroke="#0E7C86" stroke-width="2"/>
    <path d="M${(140-d)/2+8} 46 q 9 -5 18 0 t 18 0 t 18 0 t 18 0 t 18 0" fill="none" stroke="#0E7C86" stroke-width="1.6" stroke-linecap="round" opacity=".55"/>
  </svg>`}a.on("buscaProd",a.debounce((t,o)=>{m.q=o.value,a.resetPagina("produtos"),a.render()},250)),a.on("filtroProdCat",t=>{m.cat=t.c,a.resetPagina("produtos"),a.render()}),a.on("prodInativos",(t,o)=>{m.so=o.checked?"todos":"ativos",a.resetPagina("produtos"),a.render()});function w(t){const o=!t||t.categoria==="Piscina";return[{k:"id",t:"hidden"},{k:"sku",l:"SKU / c\xF3digo",t:"text",col:4,req:!0},{k:"nome",l:"Nome do produto",t:"text",col:8,req:!0},{k:"categoria",l:"Categoria",t:"select",col:4,req:!0,vazio:!1,opts:a.CATEGORIAS_PROD},{k:"unidade",l:"Unidade",t:"text",col:2,req:!0,ph:"un"},{k:"fornecedorId",l:"Fornecedor padr\xE3o",t:"select",col:6,opts:a.all("fornecedores").map(d=>({v:d.id,l:d.nome}))},{sep:"Pre\xE7os"},{k:"custo",l:"Custo (R$)",t:"money",col:4,req:!0,val:"naoNegativo"},{k:"preco",l:"Pre\xE7o de venda (R$)",t:"money",col:4,req:!0,val:"naoNegativo"},{k:"ativo",l:"Produto ativo (aparece no cat\xE1logo)",t:"checkbox",col:4},{sep:"Estoque"},{k:"controlaEstoque",l:"Controlar estoque deste item",t:"checkbox",col:4},{k:"estoque",l:"Estoque atual",t:"number",col:4,step:1,val:"naoNegativo"},{k:"estoqueMin",l:"Estoque m\xEDnimo",t:"number",col:4,step:1,val:"naoNegativo",hint:"Dispara alerta de reposi\xE7\xE3o"},...o?[{sep:"Especifica\xE7\xF5es da piscina"},{k:"specs.compr",l:"Comprimento (m)",t:"pct",col:3,step:.01,hint:a.cfg().comissaoBase==="metro"?"\xC9 este n\xFAmero que paga a comiss\xE3o do vendedor":""},{k:"specs.larg",l:"Largura (m)",t:"pct",col:3,step:.01},{k:"specs.prof",l:"Profundidade (m)",t:"pct",col:3,step:.01},{k:"specs.volume",l:"Volume (mil L)",t:"pct",col:3,step:.1},{k:"specs.area",l:"Espelho d\u2019\xE1gua (m\xB2)",t:"pct",col:3,step:.1}]:[],{k:"descricao",l:"Descri\xE7\xE3o comercial",t:"textarea",col:12,rows:3,hint:"Aparece na proposta em PDF"}]}a.on("novoProduto",()=>y(null)),a.on("editarProduto",t=>y(a.prod(t.id)));function y(t){const o=!t,d=t?Object.assign({},t,{"specs.compr":(t.specs||{}).compr,"specs.larg":(t.specs||{}).larg,"specs.prof":(t.specs||{}).prof,"specs.volume":(t.specs||{}).volume,"specs.area":(t.specs||{}).area}):{ativo:!0,unidade:"un",categoria:"Adicional",controlaEstoque:!1,estoque:0,estoqueMin:0};a.modal({title:o?"Novo produto":t.nome,size:"lg",body:`<form data-sub="salvarProduto" id="formProd">${a.form(w(t),d)}</form>`,actions:[{txt:"Salvar",cls:"btn-primary",act:"salvarProdutoBtn"},t?{txt:"Excluir",act:"excluirProduto",data:{id:t.id}}:null,{txt:"Cancelar",act:"fechar"}].filter(Boolean)})}a.on("salvarProdutoBtn",(t,o)=>C(o.closest(".modal-box").querySelector("#formProd"))),a.on("salvarProduto",(t,o)=>C(o));function C(t){const{ok:o,data:d}=a.lerForm(t);if(!o)return;const s={};["compr","larg","prof","volume","area"].forEach(e=>{d["specs."+e]!==void 0&&(s[e]=a.n(d["specs."+e])),delete d["specs."+e]}),Object.keys(s).length&&(d.specs=s),a.upsert("produtos",d),a.closeTop(),a.toast("Produto salvo","ok"),a.render()}a.on("excluirProduto",async t=>{const o=a.prod(t.id),d=a.dependentes("produto",t.id);if(d.some(s=>s.bloqueia)){await a.confirmarExclusao("produto",t.id,o.nome,{alternativa:"Desative o produto em vez de apagar: ele some do cat\xE1logo e das buscas, mas os documentos antigos continuam \xEDntegros."});return}if(d.length){if(!await a.confirmar(`"${o.nome}" j\xE1 apareceu em ${E(d)}. O recomendado \xE9 desativar em vez de excluir.`,{title:"Desativar produto",okTxt:"Desativar"}))return;o.ativo=!1,a.save("produtos"),a.closeTop(),a.toast("Produto desativado"),a.render();return}await a.confirmarExclusao("produto",t.id,o.nome)&&(a.remove("produtos",t.id),a.closeTop(),a.toast("Produto exclu\xEDdo"),a.render())});const E=t=>t.map(o=>`${o.qtd} ${o.qtd===1?o.rotulo:o.plural}`).join(", ");a.view("estoque",{titulo:"Estoque",sub:()=>{const t=a.where("produtos",o=>o.controlaEstoque&&a.disponivel(o.id)<=a.n(o.estoqueMin));return t.length?`${t.length} item(ns) no ou abaixo do m\xEDnimo, j\xE1 descontando o que est\xE1 reservado`:"Todos os itens acima do estoque m\xEDnimo"},render(){const t=a.where("produtos",i=>i.controlaEstoque),o=t.filter(i=>a.disponivel(i.id)<=a.n(i.estoqueMin)),d=t.filter(i=>a.disponivel(i.id)<=0),s=a.soma(t,i=>a.n(i.estoque)*a.n(i.custo)),e=a.soma(t,i=>a.reservado(i.id)),c=a.sortBy(a.all("estoqueMov"),"data","desc").slice(0,25);return`
      <div class="kpis mb">
        ${a.kpi({cls:"k-teal",lbl:"Itens controlados",val:String(t.length)})}
        ${a.kpi({cls:"k-ocre",lbl:"Valor em estoque",val:a.money0(s),sm:!0,foot:"a pre\xE7o de custo"})}
        ${a.kpi({cls:e?"k-warn":"",lbl:"Reservado em propostas",val:String(e),foot:"preso em or\xE7amentos na rua"})}
        ${a.kpi({cls:o.length?"k-warn":"k-ok",lbl:"Abaixo do m\xEDnimo",val:String(o.length)})}
        ${a.kpi({cls:d.length?"k-dang":"k-ok",lbl:"Sem unidade livre",val:String(d.length)})}
      </div>

      ${o.length?`<div class="alert a-warn mb">
        <svg class="ic"><use href="#i-alerta"/></svg>
        <div><b>Reposi\xE7\xE3o necess\xE1ria.</b> ${r(o.map(i=>i.nome).join(", "))}.
        <button class="btn btn-sm" data-act="comprarBaixos" style="margin-left:8px">Gerar pedido de compra</button></div>
      </div>`:""}

      <div class="alert a-info mb"><svg class="ic"><use href="#i-alerta"/></svg>
        <div class="small"><b>Dispon\xEDvel = em casa \u2212 reservado.</b> Uma piscina fica reservada enquanto a proposta est\xE1 na rua
        (aguardando al\xE7ada, enviada ou em negocia\xE7\xE3o), para dois vendedores n\xE3o prometerem a mesma unidade.</div></div>

      <div class="toolbar">
        <div class="row-end row">
          <button class="btn" data-act="movEstoque" data-t="entrada"><svg class="ic"><use href="#i-plus"/></svg>Entrada manual</button>
          <button class="btn" data-act="movEstoque" data-t="saida">Sa\xEDda manual</button>
          <button class="btn" data-act="exportarEstoque"><svg class="ic"><use href="#i-down"/></svg>CSV</button>
        </div>
      </div>

      <div class="grid g-2-1">
        <div class="card">
          <div class="card-hd"><div><h3>Posi\xE7\xE3o atual</h3></div></div>
          ${t.length?a.tabela({act:"editarProduto",rows:a.paginar("estoque",a.sortBy(t,i=>a.disponivel(i.id)-a.n(i.estoqueMin))).linhas,cols:[{h:"Produto",r:i=>`<div class="strong">${r(i.nome)}</div><span class="mini">${r(i.sku)} \xB7 ${r(i.categoria)}</span>`},{h:"M\xEDnimo",cls:"num",r:i=>`<span class="small">${a.n(i.estoqueMin)}</span>`},{h:"Em casa",cls:"num",r:i=>`<span class="small tnum">${a.n(i.estoque)}</span>`},{h:"Reservado",cls:"num",r:i=>{const n=a.reservado(i.id);return n?`<span class="small tnum" style="color:var(--warn)">\u2212 ${n}</span>`:'<span class="faint">\u2014</span>'}},{h:"Dispon\xEDvel",cls:"num",r:i=>{const n=a.disponivel(i.id),l=a.n(i.estoqueMin),v=n<=0?"b-dang":n<=l?"b-warn":"b-ok";return a.badge(String(n)+" "+i.unidade,v)}},{h:"Valor",cls:"num",r:i=>r(a.money0(a.n(i.estoque)*a.n(i.custo)))}]})+a.paginar("estoque",t).html:'<div class="empty-sm">Nenhum item com controle de estoque.</div>'}
        </div>

        <div class="card">
          <div class="card-hd"><div><h3>Movimenta\xE7\xF5es</h3><div class="sub">\xDAltimas 25</div></div></div>
          <div class="card-bd" style="padding:0">
            ${c.length?a.tabela({rows:c,cols:[{h:"Data",r:i=>`<span class="small">${r(a.dtCurto(i.data))}</span>`},{h:"Produto",r:i=>`<span class="small">${r(a.trunc(a.prodNome(i.produtoId),22))}</span><span class="mini">${r(i.motivo||"")}</span>`},{h:"Qtd",cls:"num",r:i=>`<b style="color:${i.tipo==="entrada"?"var(--ok)":i.tipo==="saida"?"var(--dang)":"var(--t-muted)"}">${i.tipo==="entrada"?"+":i.tipo==="saida"?"\u2212":"="}${a.n(i.qtd)}</b>`}]}):'<div class="empty-sm">Nenhuma movimenta\xE7\xE3o registrada.</div>'}
          </div>
        </div>
      </div>`}}),a.on("movEstoque",t=>{const o=t.t,d=a.uid("mv");a.on(d,(s,e)=>{const{ok:c,data:i}=a.lerForm(e.closest(".modal-box").querySelector("#formMov"));if(!c)return;const n=a.prod(i.produtoId);if(!n)return a.toast("Escolha o produto","err");const l=a.n(i.qtd);if(l<=0)return a.toast("Quantidade deve ser maior que zero","err");n.estoque=a.n(n.estoque)+(o==="entrada"?l:-l),a.save("produtos"),a.upsert("estoqueMov",{produtoId:n.id,tipo:o,qtd:l,data:i.data||a.hoje(),motivo:i.motivo||"Ajuste manual",ref:""}),a.closeTop(),a.toast(`${o==="entrada"?"Entrada":"Sa\xEDda"} registrada`,"ok"),a.render()}),a.modal({title:o==="entrada"?"Entrada de estoque":"Sa\xEDda de estoque",size:"sm",body:`<form id="formMov">${a.form([{k:"produtoId",l:"Produto",t:"select",col:12,req:!0,opts:a.where("produtos",s=>s.controlaEstoque).map(s=>({v:s.id,l:`${s.nome} (atual: ${a.n(s.estoque)})`}))},{k:"qtd",l:"Quantidade",t:"number",col:6,req:!0,step:1,min:1},{k:"data",l:"Data",t:"date",col:6},{k:"motivo",l:"Motivo",t:"text",col:12,ph:o==="entrada"?"Recebimento, devolu\xE7\xE3o\u2026":"Perda, uso em obra\u2026"}],{data:a.hoje(),qtd:1})}</form>`,actions:[{txt:"Registrar",cls:"btn-primary",act:d},{txt:"Cancelar",act:"fechar"}]})}),a.on("exportarEstoque",()=>{const t=[["SKU","Produto","Categoria","Unidade","Estoque atual","Estoque m\xEDnimo","Custo unit.","Valor em estoque","Fornecedor"]];a.where("produtos",o=>o.controlaEstoque).forEach(o=>t.push([o.sku,o.nome,o.categoria,o.unidade,a.n(o.estoque),a.n(o.estoqueMin),a.dec(o.custo),a.dec(a.n(o.estoque)*a.n(o.custo)),a.fornNome(o.fornecedorId)])),a.baixar(`estoque-${a.hoje()}.csv`,a.csv(t),"text/csv;charset=utf-8"),a.toast("CSV exportado","ok")}),a.on("comprarBaixos",()=>{const t=a.where("produtos",s=>s.controlaEstoque&&a.disponivel(s.id)<=a.n(s.estoqueMin));if(!t.length)return a.toast("Nada a repor","warn");const o=t[0].fornecedorId||(a.all("fornecedores")[0]||{}).id,d=t.filter(s=>(s.fornecedorId||o)===o).map(s=>({produtoId:s.id,nome:s.nome,qtd:Math.max(a.n(s.estoqueMin)*2-a.disponivel(s.id),1),custo:a.n(s.custo)}));k(null,{fornecedorId:o,itens:d,obs:"Reposi\xE7\xE3o autom\xE1tica de estoque m\xEDnimo."})});const h={rascunho:{nome:"Rascunho",cls:""},enviado:{nome:"Enviado",cls:"b-info"},recebido:{nome:"Recebido",cls:"b-ok"},cancelado:{nome:"Cancelado",cls:"b-dang"}};a.compraTotal=t=>(t&&t.itens||[]).reduce((o,d)=>o+a.n(d.qtd)*a.n(d.custo),0);let f="pedidos";a.view("compras",{titulo:"Compras & fornecedores",sub:()=>`${a.where("compras",t=>t.status==="enviado").length} pedido(s) em tr\xE2nsito \xB7 ${a.all("fornecedores").length} fornecedores`,render(){return`
      <div class="tabs">
        <button class="tab ${f==="pedidos"?"on":""}" data-act="abaCompras" data-t="pedidos">Pedidos de compra</button>
        <button class="tab ${f==="forn"?"on":""}" data-act="abaCompras" data-t="forn">Fornecedores</button>
      </div>
      ${f==="pedidos"?S():T()}`}}),a.on("abaCompras",t=>{f=t.t,a.render()});function S(){const t=a.sortBy(a.all("compras"),"numero","desc"),o=t.filter(s=>s.status==="enviado"),d=t.filter(s=>s.status==="recebido"&&a.mesKey(s.data)===a.mesKey(a.hoje()));return`
    <div class="kpis mb">
      ${a.kpi({cls:"k-teal",lbl:"Em tr\xE2nsito",val:a.money0(a.soma(o,a.compraTotal)),sm:!0,foot:`${o.length} pedido(s)`})}
      ${a.kpi({lbl:"Recebido no m\xEAs",val:a.money0(a.soma(d,a.compraTotal)),sm:!0})}
      ${a.kpi({cls:"k-ocre",lbl:"Compras no ano",val:a.money0(a.soma(t.filter(s=>s.status==="recebido"),a.compraTotal)),sm:!0})}
    </div>

    <div class="toolbar">
      <div class="row-end row">
        <button class="btn btn-primary" data-act="novaCompra"><svg class="ic"><use href="#i-plus"/></svg>Novo pedido de compra</button>
      </div>
    </div>

    <div class="card">
      ${t.length?a.tabela({act:"abrirCompra",rows:a.paginar("compras",t).linhas,cols:[{h:"N\xBA",w:"92px",r:s=>`<b>#${s.numero}</b><span class="mini">${r(a.dt(s.data))}</span>`},{h:"Fornecedor",r:s=>`<div class="strong">${r(a.fornNome(s.fornecedorId))}</div><span class="mini">${s.itens.length} item(ns)</span>`},{h:"Previs\xE3o",r:s=>`<span class="small ${s.status==="enviado"&&s.previsaoEntrega<a.hoje()?"b":""}" style="${s.status==="enviado"&&s.previsaoEntrega<a.hoje()?"color:var(--dang)":""}">${r(a.dt(s.previsaoEntrega))}</span>`},{h:"Status",r:s=>a.badge(h[s.status].nome,h[s.status].cls)},{h:"Total",cls:"num",r:s=>`<b>${r(a.money(a.compraTotal(s)))}</b>`}]})+a.paginar("compras",t).html:a.vazio("Nenhum pedido de compra","Crie um pedido para repor estoque.",{act:"novaCompra",txt:"Novo pedido"})}
    </div>`}function T(){const t=a.all("fornecedores").map(o=>{const d=a.where("compras",e=>e.fornecedorId===o.id&&e.status==="recebido"),s=a.soma(a.where("financeiro",e=>e.fornecedorId===o.id&&e.status==="aberto"),"valor");return{id:o.id,f:o,compras:d.length,total:a.soma(d,a.compraTotal),aPagar:s}});return`
    <div class="toolbar">
      <div class="row-end row">
        <button class="btn btn-primary" data-act="novoFornecedor"><svg class="ic"><use href="#i-plus"/></svg>Novo fornecedor</button>
      </div>
    </div>
    <div class="card">
      ${t.length?a.tabela({act:"editarFornecedor",rows:t,cols:[{h:"Fornecedor",r:o=>`<div class="strong">${r(o.f.nome)}</div><span class="mini">${r(o.f.doc?a.doc(o.f.doc):"")}</span>`},{h:"Contato",r:o=>`<span class="small">${r(o.f.contato||"\u2014")}</span><span class="mini">${r(a.fone(o.f.fone))}</span>`},{h:"Cidade",r:o=>`<span class="small">${r(o.f.cidade||"\u2014")}</span>`},{h:"Prazo",cls:"num",r:o=>`<span class="small">${a.n(o.f.prazoEntregaDias)} dias</span>`},{h:"Compras",cls:"num",r:o=>String(o.compras)},{h:"Total comprado",cls:"num",r:o=>r(a.money0(o.total))},{h:"A pagar",cls:"num",r:o=>o.aPagar?`<b style="color:var(--dang)">${r(a.money0(o.aPagar))}</b>`:'<span class="faint">\u2014</span>'}]}):a.vazio("Nenhum fornecedor","Cadastre seus fornecedores para controlar compras e contas a pagar.",{act:"novoFornecedor",txt:"Novo fornecedor"})}
    </div>`}a.on("novoFornecedor",()=>A(null)),a.on("editarFornecedor",t=>A(a.forn(t.id)));function A(t){a.modal({title:t?t.nome:"Novo fornecedor",size:"lg",body:`<form data-sub="salvarForn" id="formForn">${a.form([{k:"id",t:"hidden"},{k:"nome",l:"Raz\xE3o social",t:"text",col:8,req:!0},{k:"doc",l:"CNPJ",t:"text",col:4,val:"doc"},{k:"contato",l:"Contato",t:"text",col:4},{k:"fone",l:"Telefone",t:"tel",col:4},{k:"email",l:"E-mail",t:"email",col:4},{k:"cidade",l:"Cidade/UF",t:"text",col:6},{k:"prazoEntregaDias",l:"Prazo m\xE9dio de entrega (dias)",t:"number",col:6,step:1},{k:"obs",l:"Observa\xE7\xF5es",t:"textarea",col:12,rows:2}],t||{prazoEntregaDias:10})}</form>`,actions:[{txt:"Salvar",cls:"btn-primary",act:"salvarFornBtn"},t?{txt:"Excluir",act:"excluirForn",data:{id:t.id}}:null,{txt:"Cancelar",act:"fechar"}].filter(Boolean)})}a.on("salvarFornBtn",(t,o)=>x(o.closest(".modal-box").querySelector("#formForn"))),a.on("salvarForn",(t,o)=>x(o));function x(t){const{ok:o,data:d}=a.lerForm(t);o&&(a.upsert("fornecedores",d),a.closeTop(),a.toast("Fornecedor salvo","ok"),a.render())}a.on("excluirForn",async t=>{const o=a.forn(t.id);await a.confirmarExclusao("fornecedor",t.id,o.nome)&&(a.desvincular("fornecedor",t.id),a.remove("fornecedores",t.id),a.closeTop(),a.toast("Fornecedor exclu\xEDdo"),a.render())});let u=null;a.on("novaCompra",()=>k(null,{})),a.on("editarCompra",t=>{a.closeAll(),k(a.find("compras",t.id))});function k(t,o){u=t?JSON.parse(JSON.stringify(t)):Object.assign({id:"",numero:0,fornecedorId:(a.all("fornecedores")[0]||{}).id||"",data:a.hoje(),previsaoEntrega:a.addDias(a.hoje(),10),status:"rascunho",itens:[],obs:""},o||{}),a.modal({title:t?`Pedido de compra #${t.numero}`:"Novo pedido de compra",size:"lg",body:`<div id="cpRoot">${I()}</div>`,actions:[{txt:"Salvar",cls:"btn-primary",act:"cpSalvar"},{txt:"Cancelar",act:"fechar"}]})}function I(){return`
  <div class="fgrid mb">
    <div class="f f-6"><label for="cpForn">Fornecedor</label>
      <select class="inp" id="cpForn" data-chg="cpCampo" data-k="fornecedorId">
        ${a.all("fornecedores").map(o=>`<option value="${o.id}"${u.fornecedorId===o.id?" selected":""}>${r(o.nome)}</option>`).join("")}
      </select></div>
    <div class="f f-3"><label for="cpData">Data</label>
      <input class="inp" id="cpData" type="date" value="${r(u.data)}" data-chg="cpCampo" data-k="data"></div>
    <div class="f f-3"><label for="cpPrev">Previs\xE3o de entrega</label>
      <input class="inp" id="cpPrev" type="date" value="${r(u.previsaoEntrega)}" data-chg="cpCampo" data-k="previsaoEntrega"></div>
  </div>

  <div class="card mb">
    <div class="card-hd"><div><h3>Itens</h3></div>
      <select class="inp" style="width:auto;margin-left:auto;max-width:260px" data-chg="cpAdd" aria-label="Adicionar item">
        <option value="">+ adicionar produto\u2026</option>
        ${a.all("produtos").filter(o=>o.ativo).map(o=>`<option value="${o.id}">${r(o.nome)} \u2014 custo ${r(a.money0(o.custo))}</option>`).join("")}
      </select>
    </div>
    <div class="card-bd" id="cpItens">${$()}</div>
  </div>

  <div class="f"><label for="cpObs">Observa\xE7\xF5es</label>
    <textarea class="inp" id="cpObs" rows="2" data-chg="cpCampo" data-k="obs">${r(u.obs||"")}</textarea></div>`}function $(){if(!u.itens.length)return'<div class="empty-sm">Nenhum item. Escolha um produto acima.</div>';const t=a.compraTotal(u);return`<div class="itens">
    <div class="item-row tiny faint" style="font-weight:700;text-transform:uppercase;letter-spacing:.06em">
      <span>Produto</span><span class="tr">Qtd</span><span class="tr">Custo un.</span><span class="tr it-tot">Total</span><span></span>
    </div>
    ${u.itens.map((o,d)=>`
      <div class="item-row">
        <div class="b" style="font-size:13px;min-width:0">${r(o.nome)}</div>
        <input class="inp" type="number" min="1" step="1" value="${r(o.qtd)}" data-inp="cpItem" data-i="${d}" data-k="qtd" aria-label="Quantidade">
        <input class="inp inp-money" type="text" inputmode="decimal" value="${r(a.dec(o.custo))}" data-inp="cpItem" data-i="${d}" data-k="custo" aria-label="Custo unit\xE1rio">
        <div class="tr b it-tot tnum" data-cptot="${d}">${r(a.money(a.n(o.qtd)*a.n(o.custo)))}</div>
        <button class="icon-btn rm" data-act="cpRm" data-i="${d}" aria-label="Remover"><svg class="ic ic-sm"><use href="#i-lixo"/></svg></button>
      </div>`).join("")}
  </div>
  <div class="tot-box mt"><div class="tot-line big"><span>Total do pedido</span><span class="tnum">${r(a.money(t))}</span></div></div>`}a.on("cpCampo",(t,o)=>{u[t.k]=o.value}),a.on("cpAdd",(t,o)=>{const d=a.prod(o.value);if(o.value="",!d)return;const s=u.itens.findIndex(e=>e.produtoId===d.id);s>=0?u.itens[s].qtd=a.n(u.itens[s].qtd)+1:u.itens.push({produtoId:d.id,nome:d.nome,qtd:1,custo:a.n(d.custo)}),document.getElementById("cpItens").innerHTML=$()}),a.on("cpItem",(t,o)=>{const d=u.itens[a.n(t.i)];d[t.k]=t.k==="custo"?a.parseMoney(o.value):a.n(o.value),document.getElementById("cpItens").innerHTML=$()}),a.on("cpRm",t=>{u.itens.splice(a.n(t.i),1),document.getElementById("cpItens").innerHTML=$()}),a.on("cpSalvar",()=>{if(!u.itens.length)return a.toast("Adicione ao menos um item","err");if(!u.fornecedorId)return a.toast("Escolha o fornecedor","err");const t=!u.id;t&&(u.numero=a.proximoNumero("proximoNumCompra"),u.status="enviado");const o=a.upsert("compras",u);a.closeTop(),a.toast(t?`Pedido de compra #${u.numero} criado`:"Pedido atualizado","ok"),a.render(),O(o)}),a.on("abrirCompra",t=>O(t.id));function O(t){const o=a.find("compras",t);if(!o)return;const d=a.compraTotal(o),s=`
    <div class="row mb" style="gap:7px">${a.badge(h[o.status].nome,h[o.status].cls)}</div>
    <div class="card mb"><div class="card-bd">
      <dl class="dl">
        <dt>Fornecedor</dt><dd><b>${r(a.fornNome(o.fornecedorId))}</b></dd>
        <dt>Emiss\xE3o</dt><dd>${r(a.dt(o.data))}</dd>
        <dt>Previs\xE3o</dt><dd>${r(a.dt(o.previsaoEntrega))}</dd>
        <dt>Total</dt><dd><b>${r(a.money(d))}</b></dd>
      </dl>
      ${o.obs?`<div class="sep"></div><div class="small muted">${r(o.obs)}</div>`:""}
    </div></div>
    <div class="card">
      <div class="card-hd"><div><h3>Itens</h3></div></div>
      ${a.tabela({rows:o.itens,cols:[{h:"Produto",r:c=>`<span class="small">${r(c.nome)}</span>`},{h:"Qtd",cls:"num",r:c=>a.n(c.qtd)},{h:"Custo un.",cls:"num",r:c=>r(a.money(c.custo))},{h:"Total",cls:"num",r:c=>`<b>${r(a.money(a.n(c.qtd)*a.n(c.custo)))}</b>`}]})}
    </div>`,e=[];(o.status==="enviado"||o.status==="rascunho")&&(e.push({txt:"Receber mercadoria",cls:"btn-ok",ic:"i-check",act:"receberCompra",data:{id:o.id}}),e.push({txt:"Editar",ic:"i-edit",act:"editarCompra",data:{id:o.id}}),e.push({txt:"Cancelar pedido",cls:"btn-dang",act:"cancelarCompra",data:{id:o.id}})),a.drawer({title:`Compra #${o.numero}`,sub:`${a.fornNome(o.fornecedorId)} \xB7 ${a.money(d)}`,body:s,actions:e})}a.on("receberCompra",async t=>{const o=a.find("compras",t.id),d=a.compraTotal(o);await a.confirmar(`Confirmar o recebimento da compra #${o.numero} (${a.money(d)})?`,{title:"Receber mercadoria",okTxt:"Receber",aviso:"O estoque ser\xE1 atualizado e ser\xE1 criada uma conta a pagar com vencimento em 28 dias."})&&(o.status="recebido",a.save("compras"),o.itens.forEach(s=>{const e=a.prod(s.produtoId);e&&(e.controlaEstoque&&(e.estoque=a.n(e.estoque)+a.n(s.qtd)),e.custo=a.n(s.custo),a.upsert("estoqueMov",{produtoId:e.id,tipo:"entrada",qtd:a.n(s.qtd),data:a.hoje(),motivo:`Compra #${o.numero}`,ref:o.id}))}),a.save("produtos"),a.upsert("financeiro",{tipo:"pagar",descricao:`Compra #${o.numero} \u2014 ${a.fornNome(o.fornecedorId)}`,categoria:"Compra de piscina",valor:d,vencimento:a.addDias(a.hoje(),28),status:"aberto",pagoEm:"",formaPag:"Boleto",fornecedorId:o.fornecedorId,origem:{tipo:"compra",id:o.id},parcela:1,parcelas:1,obs:""}),a.closeAll(),a.toast("Mercadoria recebida e estoque atualizado","ok"),a.render())}),a.on("cancelarCompra",async t=>{if(!await a.confirmar("Cancelar esse pedido de compra?",{perigo:!0,okTxt:"Cancelar pedido"}))return;const o=a.find("compras",t.id);o.status="cancelado",a.save("compras"),a.closeAll(),a.toast("Pedido cancelado"),a.render()});const b={status:""};a.view("obras",{titulo:"Obras & instala\xE7\xE3o",sub:()=>`${a.where("obras",o=>o.status!=="concluida"&&o.status!=="cancelada").length} obra(s) em andamento \xB7 ${a.where("obras",o=>o.status==="concluida").length} conclu\xEDda(s)`,render(){let t=a.all("obras").slice();b.status&&(t=t.filter(n=>n.status===b.status)),t=a.sortBy(t,n=>(n.dataAgendada||"9999")+n.status);const o=a.where("obras",n=>n.status!=="concluida"&&n.status!=="cancelada"),d=o.filter(n=>!n.dataAgendada),s=o.filter(n=>n.dataAgendada&&n.dataAgendada<a.hoje()&&n.status!=="acabamento"),e=a.where("obras",n=>n.status==="concluida"),c=e.length?a.soma(e,n=>a.n(n.custoReal)-a.n(n.custoPrevisto)):0,i=a.sortBy(o.filter(n=>n.dataAgendada),"dataAgendada").slice(0,8);return`
      <div class="kpis mb">
        ${a.kpi({cls:"k-teal",lbl:"Em andamento",val:String(o.length)})}
        ${a.kpi({cls:d.length?"k-warn":"k-ok",lbl:"Sem agendamento",val:String(d.length)})}
        ${a.kpi({cls:s.length?"k-dang":"k-ok",lbl:"Atrasadas",val:String(s.length)})}
        ${a.kpi({cls:c>0?"k-dang":"k-ok",lbl:"Desvio de custo",val:(c>=0?"+":"\u2212")+a.money0(Math.abs(c)),sm:!0,foot:"em obras conclu\xEDdas"})}
      </div>

      <div class="grid g-2-1 mb">
        <div class="card">
          <div class="card-hd">
            <div><h3>Carteira de obras</h3></div>
            <div class="seg right" style="margin-left:auto">
              <button class="${b.status?"":"on"}" data-act="filtroObra" data-s="">Todas</button>
              <button class="${b.status==="aguardando"?"on":""}" data-act="filtroObra" data-s="aguardando">Aguardando</button>
              <button class="${b.status==="agendada"?"on":""}" data-act="filtroObra" data-s="agendada">Agendadas</button>
              <button class="${b.status==="concluida"?"on":""}" data-act="filtroObra" data-s="concluida">Conclu\xEDdas</button>
            </div>
          </div>
          ${t.length?a.tabela({act:"abrirObra",rows:a.paginar("obras",t).linhas,cols:[{h:"Cliente / local",r:n=>`<div class="strong">${r(a.cliNome(n.clienteId))}</div><span class="mini">${r(a.trunc(n.endereco||n.cidade||"\u2014",36))}</span>`},{h:"Status",r:n=>a.badge(a.STATUS_OBRA[n.status].nome,a.STATUS_OBRA[n.status].cls)},{h:"Progresso",w:"130px",r:n=>{const l=(n.checklist||[]).filter(Boolean).length,v=a.CHECKLIST_OBRA.length?l/a.CHECKLIST_OBRA.length*100:0;return`<div class="bar thin"><i class="${v>=100?"ok":""}" style="width:${v}%"></i></div><span class="mini">${l}/${a.CHECKLIST_OBRA.length} etapas</span>`}},{h:"Agendada",cls:"num",r:n=>n.dataAgendada?`<span class="small ${n.dataAgendada<a.hoje()&&n.status!=="concluida"?"b":""}" style="${n.dataAgendada<a.hoje()&&n.status!=="concluida"?"color:var(--dang)":""}">${r(a.dt(n.dataAgendada))}</span>`:'<span class="badge b-warn">a agendar</span>'},{h:"Equipe",r:n=>n.equipeObraId?`<span class="badge" style="background:${a.equipeObraCor(n.equipeObraId)}1f;color:${a.equipeObraCor(n.equipeObraId)}"><span class="dt"></span>${r(a.equipeObraNome(n.equipeObraId))}</span>`:n.responsavel?`<span class="small">${r(n.responsavel)}</span>`:'<span class="badge b-warn">sem equipe</span>'}]})+a.paginar("obras",t).html:'<div class="empty-sm">Nenhuma obra nesse filtro.</div>'}
        </div>

        <div class="card">
          <div class="card-hd"><div><h3>Pr\xF3ximas instala\xE7\xF5es</h3></div></div>
          <div class="card-bd">
            ${i.length?i.map(n=>{const l=a.diasEntre(a.hoje(),n.dataAgendada);return`<div class="att-item" tabindex="0" role="button" data-act="abrirObra" data-id="${r(n.id)}" style="cursor:pointer">
                <svg class="ic"><use href="#i-obra"/></svg>
                <div class="txt"><b>${r(a.trunc(a.cliNome(n.clienteId),24))}</b><small>${r(a.dt(n.dataAgendada))} \xB7 ${r(n.cidade||"")}</small></div>
                <div class="val" style="${l<0?"color:var(--dang)":l<=2?"color:var(--warn)":""}">${l<0?Math.abs(l)+"d atraso":l===0?"hoje":"em "+l+"d"}</div>
              </div>`}).join(""):'<div class="empty-sm">Nenhuma obra agendada.</div>'}
          </div>
        </div>
      </div>`}}),a.on("filtroObra",t=>{b.status=t.s,a.resetPagina("obras"),a.render()}),a.on("abrirObra",t=>g(t.id));function g(t){const o=a.find("obras",t);if(!o)return a.toast("Obra n\xE3o encontrada","err");const d=a.find("pedidos",o.pedidoId),s=d?a.orcDoPedido(d):null,e=(o.checklist||[]).filter(Boolean).length,c=e/a.CHECKLIST_OBRA.length*100,i=(o.notas||[]).slice().reverse(),n=`
    <div class="row mb" style="gap:7px">
      ${a.badge(a.STATUS_OBRA[o.status].nome,a.STATUS_OBRA[o.status].cls)}
      ${d?a.badge("Pedido #"+d.numero,"b-ink"):""}
      ${o.dataAgendada&&o.dataAgendada<a.hoje()&&o.status!=="concluida"?a.badge("Atrasada","b-dang"):""}
    </div>

    <div class="card mb"><div class="card-bd">
      <div class="row mb" style="justify-content:space-between">
        <b class="small">Progresso da obra</b>
        <span class="small faint">${e} de ${a.CHECKLIST_OBRA.length} etapas \xB7 ${a.dec(c,0)}%</span>
      </div>
      <div class="bar"><i class="${c>=100?"ok":c>=50?"":"warn"}" style="width:${c}%"></i></div>
    </div></div>

    <div class="card mb"><div class="card-bd">
      <dl class="dl">
        <dt>Cliente</dt><dd><b>${r(a.cliNome(o.clienteId))}</b></dd>
        <dt>Endere\xE7o</dt><dd>${r(o.endereco||"\u2014")}</dd>
        <dt>Cidade</dt><dd>${r(o.cidade||"\u2014")}</dd>
        <dt>Equipe</dt><dd>${o.equipeObraId?`<span class="badge" style="background:${a.equipeObraCor(o.equipeObraId)}1f;color:${a.equipeObraCor(o.equipeObraId)}"><span class="dt"></span>${r(a.equipeObraNome(o.equipeObraId))}</span>`:o.responsavel?r(o.responsavel):'<span class="badge b-warn">sem equipe</span>'}</dd>
        <dt>Agendada</dt><dd>${o.dataAgendada?`${r(a.dt(o.dataAgendada))} <span class="faint small">(${a.duracaoObra(o)} dia(s))</span>`:'<span class="badge b-warn">a agendar</span>'}</dd>
        ${o.numeroOS?`<dt>N\xBA da OS</dt><dd>${r(o.numeroOS)}</dd>`:""}
        ${o.dataConclusao?`<dt>Conclu\xEDda</dt><dd>${r(a.dt(o.dataConclusao))}</dd>`:""}
        <dt>Custo previsto</dt><dd>${r(a.money(o.custoPrevisto))}</dd>
        <dt>Custo real</dt><dd>${a.n(o.custoReal)?`${r(a.money(o.custoReal))} <span class="small" style="color:${a.n(o.custoReal)>a.n(o.custoPrevisto)?"var(--dang)":"var(--ok)"}">(${a.n(o.custoReal)>a.n(o.custoPrevisto)?"+":"\u2212"}${r(a.money0(Math.abs(a.n(o.custoReal)-a.n(o.custoPrevisto))))})</span>`:'<span class="faint">n\xE3o lan\xE7ado</span>'}</dd>
        ${s?`<dt>Modelo</dt><dd>${r((s.itens.map(p=>a.prod(p.produtoId)).find(p=>p&&p.categoria==="Piscina")||{}).nome||"\u2014")}</dd>`:""}
      </dl>
    </div></div>

    <div class="card mb">
      <div class="card-hd"><div><h3>Checklist de execu\xE7\xE3o</h3><div class="sub">Marque conforme a obra avan\xE7a</div></div></div>
      <div class="card-bd">
        <div class="chk-list">
          ${a.CHECKLIST_OBRA.map((p,q)=>`
            <label class="chk ${(o.checklist||[])[q]?"done":""}">
              <input type="checkbox" ${(o.checklist||[])[q]?"checked":""} data-chg="obraCheck" data-id="${r(o.id)}" data-i="${q}">
              <span>${r(p)}</span>
            </label>`).join("")}
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-hd"><div><h3>Di\xE1rio de obra</h3></div>
        <button class="btn btn-sm" data-act="notaObra" data-id="${r(o.id)}" style="margin-left:auto"><svg class="ic ic-sm"><use href="#i-plus"/></svg>Nota</button>
      </div>
      <div class="card-bd">
        ${i.length?`<ul class="tl">${i.map(p=>`
          <li><div class="tl-hd"><b>${r(p.autor||"Equipe")}</b><time>${r(a.dtHora(p.data))}</time></div><p>${r(p.texto)}</p></li>`).join("")}</ul>`:'<div class="empty-sm">Nenhuma anota\xE7\xE3o ainda.</div>'}
      </div>
    </div>`,l=[],v=a.ETAPAS_OBRA.indexOf(o.status);v>=0&&v<a.ETAPAS_OBRA.length-1&&l.push({txt:`Avan\xE7ar para "${a.STATUS_OBRA[a.ETAPAS_OBRA[v+1]].nome}"`,cls:"btn-primary",ic:"i-seta",act:"avancarObra",data:{id:o.id}}),l.push({txt:"Ordem de servi\xE7o",cls:"btn-teal",ic:"i-os",act:"imprimirOS",data:{id:o.id}}),l.push({txt:o.dataAgendada?"Reagendar":"Agendar",ic:"i-relogio",act:"agendarObra",data:{id:o.id}}),o.dataAgendada&&l.push({txt:"Avisar cliente",cls:"btn-ok",ic:"i-wpp",act:"waObra",data:{id:o.id}}),l.push({txt:"Editar",ic:"i-edit",act:"editarObra",data:{id:o.id}}),d&&l.push({txt:"Abrir pedido",ic:"i-pedido",act:"abrirPedido",data:{id:d.id}}),l.push({txt:"Abrir chamado",ic:"i-suporte",act:"chamadoDoCliente",data:{id:o.clienteId}}),a.drawer({title:a.cliNome(o.clienteId),sub:`Obra \xB7 ${o.endereco||o.cidade||""}`,body:n,actions:l,wide:!0})}a.abrirObra=g,a.on("obraCheck",(t,o)=>{const d=a.find("obras",t.id);d.checklist=d.checklist||a.CHECKLIST_OBRA.map(()=>!1),d.checklist[a.n(t.i)]=o.checked,a.save("obras"),o.closest(".chk").classList.toggle("done",o.checked);const s=d.checklist.filter(Boolean).length,e=s>=13?"concluida":s>=10?"acabamento":s>=8?"hidraulica":s>=5?"assentamento":s>=3?"escavacao":d.status;e!==d.status&&d.status!=="cancelada"&&a.ETAPAS_OBRA.indexOf(e)>a.ETAPAS_OBRA.indexOf(d.status)&&(d.status=e,e==="concluida"&&!d.dataConclusao&&(d.dataConclusao=a.hoje()),a.save("obras"),a.toast("Obra avan\xE7ou para "+a.STATUS_OBRA[e].nome,"ok")),a.pintarNav()}),a.on("avancarObra",t=>{const o=a.find("obras",t.id),d=a.ETAPAS_OBRA.indexOf(o.status),s=a.ETAPAS_OBRA[d+1];if(s){if(o.status=s,s==="concluida"){o.dataConclusao=a.hoje(),o.checklist=a.CHECKLIST_OBRA.map(()=>!0);const e=a.find("pedidos",o.pedidoId);e&&e.status!=="concluido"&&e.status!=="cancelado"&&(e.status="entregue",a.save("pedidos"))}o.notas=o.notas||[],o.notas.push({data:a.agora(),texto:`Status alterado para "${a.STATUS_OBRA[s].nome}".`,autor:"Sistema"}),a.save("obras"),a.closeAll(),a.toast("Obra \u2192 "+a.STATUS_OBRA[s].nome,"ok"),a.render(),g(t.id)}}),a.on("agendarObra",async t=>{const o=a.find("obras",t.id),d=await a.perguntar("Data de in\xEDcio da obra",{title:"Agendar instala\xE7\xE3o",tipo:"date",valor:o.dataAgendada||a.addDias(a.hoje(),7)});d&&(o.dataAgendada=d,o.status==="aguardando"&&(o.status="agendada"),o.notas=o.notas||[],o.notas.push({data:a.agora(),texto:`Obra agendada para ${a.dt(d)}.`,autor:"Sistema"}),a.save("obras"),a.closeAll(),a.toast("Obra agendada","ok"),a.render(),g(t.id))}),a.on("notaObra",async t=>{const o=await a.perguntar("O que aconteceu na obra?",{title:"Nota de obra",multi:!0});if(!o)return;const d=a.find("obras",t.id);d.notas=d.notas||[],d.notas.push({data:a.agora(),texto:o,autor:d.responsavel||"Equipe"}),a.save("obras"),a.closeAll(),a.toast("Nota registrada","ok"),g(t.id)}),a.on("editarObra",t=>{const o=a.find("obras",t.id);a.closeAll();const d=a.uid("ob");a.on(d,(s,e)=>{const{ok:c,data:i}=a.lerForm(e.closest(".modal-box").querySelector("#formObra"),{regras:[{campo:"dataConclusao",msg:"A conclus\xE3o n\xE3o pode ser antes do agendamento",fn:n=>!n.dataConclusao||!n.dataAgendada||n.dataConclusao>=n.dataAgendada},{campo:"duracaoDias",msg:"A obra precisa durar ao menos 1 dia",fn:n=>n.duracaoDias===null||a.n(n.duracaoDias)>=1}]});c&&(i.id=o.id,a.upsert("obras",i),a.closeTop(),a.toast("Obra atualizada","ok"),a.render(),g(o.id))}),a.modal({title:"Editar obra",sub:a.cliNome(o.clienteId),size:"lg",body:`<form id="formObra">${a.form([{k:"endereco",l:"Endere\xE7o da instala\xE7\xE3o",t:"text",col:8},{k:"cidade",l:"Cidade",t:"text",col:4},{k:"equipeObraId",l:"Equipe de instala\xE7\xE3o",t:"select",col:6,opts:a.where("equipesObra",s=>s.ativo!==!1).map(s=>({v:s.id,l:s.nome+(s.membros?" \u2014 "+s.membros:"")}))},{k:"status",l:"Status",t:"select",col:6,vazio:!1,opts:Object.keys(a.STATUS_OBRA).map(s=>({v:s,l:a.STATUS_OBRA[s].nome}))},{k:"dataAgendada",l:"Data agendada",t:"date",col:4},{k:"duracaoDias",l:"Dura\xE7\xE3o (dias)",t:"number",col:4,min:1,step:1,hint:"Ocupa a equipe no calend\xE1rio"},{k:"dataConclusao",l:"Data de conclus\xE3o",t:"date",col:4},{k:"custoPrevisto",l:"Custo previsto (R$)",t:"money",col:6},{k:"custoReal",l:"Custo real (R$)",t:"money",col:6,hint:"Lance ao final para medir o desvio"},{k:"obsOS",l:"Aviso para a equipe (sai na OS)",t:"textarea",col:12,rows:2,ph:"Port\xE3o estreito, c\xE3o solto, acesso s\xF3 pela manh\xE3\u2026"}],Object.assign({duracaoDias:3},o))}</form>`,actions:[{txt:"Salvar",cls:"btn-primary",act:d},{txt:"Cancelar",act:"fechar"}]})})})();
