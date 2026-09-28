(function(){"use strict";const a=window.PP,t=a.esc;a.STATUS_PEDIDO={aberto:{nome:"Aberto",cls:"b-info"},producao:{nome:"Em produ\xE7\xE3o",cls:"b-warn"},entregue:{nome:"Entregue",cls:"b-teal"},concluido:{nome:"Conclu\xEDdo",cls:"b-ok"},cancelado:{nome:"Cancelado",cls:"b-dang"}},a.statusPedidoNome=o=>(a.STATUS_PEDIDO[o]||{nome:o}).nome,a.statusPedidoCls=o=>(a.STATUS_PEDIDO[o]||{cls:""}).cls;const h={q:"",status:"",vend:""};a.view("orcamentos",{titulo:"Or\xE7amentos & propostas",sub:()=>{const o=a.escopo(a.all("orcamentos")),e=o.filter(n=>n.status==="enviado"||n.status==="negociando"),s=o.filter(n=>n.status==="aprovacao").length;return`${o.length} or\xE7amentos \xB7 ${e.length} aguardando decis\xE3o (${a.money0(a.soma(e,a.orcTotal))})`+(s?` \xB7 ${s} travado(s) na al\xE7ada`:"")},render(){let o=a.escopo(a.all("orcamentos")).slice();if(h.q){const i=a.norm(h.q);o=o.filter(u=>String(u.numero).includes(i)||a.norm(O(u)).includes(i))}h.status&&(o=o.filter(i=>i.status===h.status)),h.vend&&(o=o.filter(i=>i.vendedorId===h.vend)),o=a.sortBy(o,"numero","desc");const e=a.paginar("orcamentos",o),s=a.escopo(a.all("orcamentos")),n=s.filter(i=>i.status==="aprovado"),d=s.filter(i=>i.status==="aprovado"||i.status==="recusado"||i.status==="expirado"),r=s.filter(i=>i.status==="aprovacao");return`
      ${r.length?`<div class="alert ${a.ehGestor()?"a-dang":"a-warn"} mb">
        <svg class="ic"><use href="#i-alerta"/></svg>
        <div>${a.ehGestor()?`<b>${a.plural(r.length,"proposta travada","propostas travadas")} esperando sua aprova\xE7\xE3o de desconto.</b> Abra e libere ou devolva ao vendedor.`:`<b>${a.plural(r.length,"proposta sua est\xE1 travada","propostas suas est\xE3o travadas")} na al\xE7ada.</b> O desconto passou do limite e o gerente precisa liberar antes do envio.`}
        </div></div>`:""}

      <div class="kpis mb">
        ${a.kpi({cls:"k-teal",lbl:"Em aberto",val:a.money0(a.soma(s.filter(i=>i.status==="enviado"||i.status==="negociando"),a.orcTotal)),sm:!0,foot:`${s.filter(i=>i.status==="enviado"||i.status==="negociando").length} proposta(s)`})}
        ${a.kpi({cls:"k-ok",lbl:"Aprovados",val:a.money0(a.soma(n,a.orcTotal)),sm:!0,foot:`${n.length} or\xE7amento(s)`})}
        ${a.kpi({cls:"k-ocre",lbl:"Taxa de aprova\xE7\xE3o",val:a.pct(d.length?n.length/d.length*100:0,0),foot:`${d.length} decidido(s)`})}
        ${a.podeVerCusto()?a.kpi({lbl:"Margem m\xE9dia",val:a.pct(n.length?a.soma(n,a.orcMargem)/n.length:0,1),foot:"sobre or\xE7amentos aprovados"}):a.kpi({lbl:"Desconto m\xE9dio",val:a.pct(s.length?a.soma(s,"descontoPct")/s.length:0,1),foot:`al\xE7ada de ${a.dec(a.cfg().descontoMaxPct,0)}%`})}
      </div>

      <div class="toolbar">
        <div class="mini-search">
          <svg class="ic"><use href="#i-busca"/></svg>
          <input class="inp" type="search" placeholder="N\xFAmero ou cliente" value="${t(h.q)}" data-inp="buscaOrc" aria-label="Buscar or\xE7amentos">
        </div>
        <select class="inp" style="width:auto" data-chg="filtroOrc" data-f="status" aria-label="Status">
          <option value="">Todos os status</option>
          ${Object.keys(a.STATUS_ORC).map(i=>`<option value="${i}"${h.status===i?" selected":""}>${t(a.STATUS_ORC[i].nome)}</option>`).join("")}
        </select>
        <select class="inp" style="width:auto" data-chg="filtroOrc" data-f="vend" aria-label="Vendedor">
          <option value="">Todos os vendedores</option>
          ${a.where("vendedores",i=>i.ativo).map(i=>`<option value="${i.id}"${h.vend===i.id?" selected":""}>${t(i.nome)}</option>`).join("")}
        </select>
        <div class="row-end row">
          <span class="small faint">${o.length} resultado(s)</span>
          <button class="btn btn-primary" data-act="novoOrc"><svg class="ic"><use href="#i-plus"/></svg>Novo or\xE7amento</button>
        </div>
      </div>

      <div class="card">
        ${o.length?a.tabela({act:"abrirOrc",rows:e.linhas,cols:[{h:"N\xBA",w:"88px",r:i=>`<b>#${i.numero}</b><span class="mini">${t(a.dt(i.data))}</span>`},{h:"Cliente / lead",r:i=>`<div class="strong">${t(O(i))}</div><span class="mini">${t(a.trunc((i.itens[0]||{}).nome||"",32))}${i.itens.length>1?` +${i.itens.length-1}`:""}</span>`},{h:"Vendedor",r:i=>`<span class="small">${t(a.vendNome(i.vendedorId).split(" ")[0])}</span>`},{h:"Validade",r:i=>`<span class="small ${i.validade<a.hoje()&&(i.status==="enviado"||i.status==="negociando")?"b":""}" style="${i.validade<a.hoje()&&(i.status==="enviado"||i.status==="negociando")?"color:var(--dang)":""}">${t(a.dt(i.validade))}</span>`},{h:"Status",r:i=>a.badge(a.STATUS_ORC[i.status].nome,a.STATUS_ORC[i.status].cls)},{h:"Desc.",cls:"num",r:i=>i.descontoPct?`<span class="small ${a.n(i.descontoPct)>a.n(a.cfg().descontoMaxPct)?"b":""}" style="${a.n(i.descontoPct)>a.n(a.cfg().descontoMaxPct)?"color:var(--dang)":""}">${a.dec(i.descontoPct,1)}%</span>`:'<span class="faint">\u2014</span>'},a.podeVerCusto()?{h:"Margem",cls:"num",r:i=>a.orcMargem(i)<25?`<span class="small b" style="color:var(--dang)">${a.dec(a.orcMargem(i),0)}%</span>`:`<span class="small">${a.dec(a.orcMargem(i),0)}%</span>`}:null,{h:"Total",cls:"num",r:i=>`<b>${t(a.money(a.orcTotal(i)))}</b>`}]})+e.html:a.vazio("Nenhum or\xE7amento encontrado","Crie um or\xE7amento a partir de um lead ou do zero.",{act:"novoOrc",txt:"Novo or\xE7amento"})}
      </div>`}});function O(o){if(o.clienteId)return a.cliNome(o.clienteId);const e=a.lead(o.leadId);return e?e.nome:"Sem v\xEDnculo"}a.nomeDoOrc=O,a.marcarExpirados=()=>{let o=0;return a.all("orcamentos").forEach(e=>{(e.status==="enviado"||e.status==="negociando")&&e.validade&&a.diasEntre(e.validade,a.hoje())>7&&(e.status="expirado",o++)}),o&&a.save("orcamentos"),o},a.on("buscaOrc",a.debounce((o,e)=>{h.q=e.value,a.resetPagina("orcamentos"),a.render()},250)),a.on("filtroOrc",(o,e)=>{h[o.f]=e.value,a.resetPagina("orcamentos"),a.render()});let c=null;a.on("novoOrc",()=>A(null,{})),a.on("orcDoLead",o=>{const e=a.lead(o.id);a.closeAll();const s=[];if(e.produtoId){const d=a.prod(e.produtoId);d&&s.push({produtoId:d.id,nome:d.nome,qtd:1,preco:a.n(d.preco),custo:a.n(d.custo)});const r=a.all("produtos").find(i=>i.sku==="SRV-INS-PAD");r&&s.push({produtoId:r.id,nome:r.nome,qtd:1,preco:a.n(r.preco),custo:a.n(r.custo)})}const n=a.all("clientes").find(d=>d.leadId===e.id);A(null,{leadId:e.id,clienteId:n?n.id:"",vendedorId:e.vendedorId,itens:s})}),a.on("orcDoCliente",o=>{const e=a.cli(o.id);a.closeAll(),A(null,{clienteId:e.id,leadId:e.leadId||""})}),a.on("editarOrc",o=>{a.closeAll(),A(a.find("orcamentos",o.id))});function A(o,e){const s=a.cfg();c=o?JSON.parse(JSON.stringify(o)):Object.assign({id:"",numero:0,leadId:"",clienteId:"",vendedorId:(a.where("vendedores",n=>n.ativo)[0]||{}).id||"",data:a.hoje(),validade:a.addDias(a.hoje(),a.n(s.validadeProposta)),status:"rascunho",itens:[],descontoPct:0,obs:"",condicao:{entrada:0,parcelas:1,juros:a.n(s.jurosMes)}},e||{}),c.itens=c.itens||[],c.condicao=c.condicao||{entrada:0,parcelas:1,juros:a.n(s.jurosMes)},a.modal({title:o?`Or\xE7amento #${o.numero}`:"Novo or\xE7amento",sub:"Monte a proposta: modelo, adicionais, servi\xE7os e condi\xE7\xE3o de pagamento",size:"xl",body:`<div id="edRoot">${R()}</div>`,actions:[{txt:"Salvar or\xE7amento",cls:"btn-primary",ic:"i-check",act:"orcSalvar"},{txt:"Ver proposta",ic:"i-print",act:"orcPreview"},{txt:"Cancelar",act:"fechar"}]})}function R(){const o=a.cfg(),e=a.where("vendedores",d=>d.ativo),s=a.all("clientes"),n=a.where("leads",d=>d.etapa!=="perdido");return`
  <div class="fgrid mb">
    <div class="f f-4">
      <label for="edCli">Cliente</label>
      <select class="inp" id="edCli" data-chg="orcCampo" data-k="clienteId">
        <option value="">\u2014 sem cliente cadastrado \u2014</option>
        ${s.map(d=>`<option value="${d.id}"${c.clienteId===d.id?" selected":""}>${t(d.nome)}</option>`).join("")}
      </select>
      <span class="hint">Se ainda for s\xF3 um lead, deixe vazio e escolha o lead ao lado.</span>
    </div>
    <div class="f f-4">
      <label for="edLead">Lead vinculado</label>
      <select class="inp" id="edLead" data-chg="orcCampo" data-k="leadId">
        <option value="">\u2014 nenhum \u2014</option>
        ${n.map(d=>`<option value="${d.id}"${c.leadId===d.id?" selected":""}>${t(d.nome)} (${t(a.etapa(d.etapa).nome)})</option>`).join("")}
      </select>
    </div>
    <div class="f f-4">
      <label for="edVend">Vendedor</label>
      <select class="inp" id="edVend" data-chg="orcCampo" data-k="vendedorId">
        ${e.map(d=>`<option value="${d.id}"${c.vendedorId===d.id?" selected":""}>${t(d.nome)}</option>`).join("")}
      </select>
    </div>
    <div class="f f-3">
      <label for="edData">Data</label>
      <input class="inp" id="edData" type="date" value="${t(c.data)}" data-chg="orcCampo" data-k="data">
    </div>
    <div class="f f-3">
      <label for="edVal">Validade</label>
      <input class="inp" id="edVal" type="date" value="${t(c.validade)}" data-chg="orcCampo" data-k="validade">
    </div>
    <div class="f f-3">
      <label for="edStat">Status</label>
      <select class="inp" id="edStat" data-chg="orcCampo" data-k="status">
        ${Object.keys(a.STATUS_ORC).map(d=>`<option value="${d}"${c.status===d?" selected":""}>${t(a.STATUS_ORC[d].nome)}</option>`).join("")}
      </select>
    </div>
    <div class="f f-3">
      <label for="edDesc">Desconto (%)</label>
      <input class="inp" id="edDesc" type="number" step="0.5" min="0" max="100" value="${t(c.descontoPct)}" data-inp="orcDesconto">
      <span class="hint">Al\xE7ada: at\xE9 ${a.dec(o.descontoMaxPct,0)}%</span>
    </div>
  </div>

  <fieldset class="fieldset mb">
    <legend>Cat\xE1logo \u2014 clique para adicionar</legend>
    ${E()}
  </fieldset>

  <div class="grid g-3-2">
    <div class="card">
      <div class="card-hd"><div><h3>Itens da proposta</h3></div>
        <select class="inp right" style="width:auto;margin-left:auto;max-width:240px" data-chg="orcAddSelect" aria-label="Adicionar item">
          <option value="">+ adicionar item\u2026</option>
          ${a.CATEGORIAS_PROD.map(d=>`<optgroup label="${t(d)}">${a.where("produtos",r=>r.categoria===d&&r.ativo).map(r=>`<option value="${r.id}">${t(r.nome)} \u2014 ${t(a.money0(r.preco))}</option>`).join("")}</optgroup>`).join("")}
        </select>
      </div>
      <div class="card-bd" id="edItens">${j()}</div>
    </div>
    <div class="stack">
      <div id="edTotais">${q()}</div>
      <div class="card"><div class="card-bd">
        <div class="f"><label for="edObs">Observa\xE7\xF5es da proposta</label>
        <textarea class="inp" id="edObs" rows="4" data-chg="orcCampo" data-k="obs" placeholder="Prazo de entrega, condi\xE7\xF5es de acesso, itens n\xE3o inclusos\u2026">${t(c.obs||"")}</textarea></div>
      </div></div>
    </div>
  </div>`}function E(){return`<div class="cat-grid">${a.where("produtos",e=>e.categoria==="Piscina"&&e.ativo).map(e=>{const s=c.itens.some(u=>u.produtoId===e.id),n=e.specs||{},d=c.id&&a.ORC_RESERVA.includes(c.status)?(a.find("orcamentos",c.id)||{itens:[]}).itens.filter(u=>u.produtoId===e.id).reduce((u,p)=>u+a.n(p.qtd),0):0,r=e.controlaEstoque?a.disponivel(e.id)+d:null,i=r!==null&&r<=0;return`<button type="button" class="cat-card ${s?"on":""}" data-act="orcAddProd" data-id="${e.id}">
      <div class="cat-vis">${F(n)}</div>
      <div class="cat-bd">
        <div class="nm">${t(e.nome.replace("Piscina ",""))}</div>
        <div class="dim">${a.dec(n.compr,2)} \xD7 ${a.dec(n.larg,2)} \xD7 ${a.dec(n.prof,2)} m \xB7 ${a.dec(n.volume,1)} mil L</div>
        <div class="pr">${t(a.money0(e.preco))}</div>
        <div class="tiny" style="margin-top:4px">${e.controlaEstoque?i?'<span class="badge b-dang">sem unidade livre</span>':`<span class="badge ${r<=1?"b-warn":"b-ok"}">${r} dispon\xEDvel</span>`:'<span class="badge b-areia">sob encomenda</span>'}</div>
      </div>
    </button>`}).join("")}</div>`}function F(o){const e=a.n(o.larg)/Math.max(a.n(o.compr),1),s=118,n=Math.max(s*e,26);return`<svg viewBox="0 0 140 92" preserveAspectRatio="xMidYMid meet">
    <rect x="${(140-s)/2}" y="${(92-n)/2}" width="${s}" height="${n}" rx="9"
      fill="#6FD3D8" fill-opacity=".45" stroke="#0E7C86" stroke-width="2"/>
    <path d="M${(140-s)/2+8} 46 q 9 -5 18 0 t 18 0 t 18 0 t 18 0 t 18 0"
      fill="none" stroke="#0E7C86" stroke-width="1.6" stroke-linecap="round" opacity=".55"/>
  </svg>`}function j(){return c.itens.length?`<div class="itens">
    <div class="item-row tiny faint" style="font-weight:700;text-transform:uppercase;letter-spacing:.06em">
      <span>Item</span><span class="tr">Qtd</span><span class="tr">Pre\xE7o un.</span><span class="tr it-tot">Total</span><span></span>
    </div>
    ${c.itens.map((o,e)=>`
      <div class="item-row">
        <div style="min-width:0">
          <div class="b" style="font-size:13px">${t(o.nome)}</div>
          <div class="tiny faint">custo ${t(a.money0(o.custo))} \xB7 margem ${a.dec(o.preco?(o.preco-o.custo)/o.preco*100:0,0)}%</div>
        </div>
        <input class="inp" type="number" min="0" step="0.5" value="${t(o.qtd)}" data-inp="orcItem" data-i="${e}" data-k="qtd" aria-label="Quantidade de ${t(o.nome)}">
        <input class="inp inp-money" type="text" inputmode="decimal" value="${t(a.dec(o.preco))}" data-inp="orcItem" data-i="${e}" data-k="preco" aria-label="Pre\xE7o de ${t(o.nome)}">
        <div class="tr b it-tot tnum" data-tot="${e}">${t(a.money(a.n(o.qtd)*a.n(o.preco)))}</div>
        <button class="icon-btn rm" data-act="orcRmItem" data-i="${e}" aria-label="Remover ${t(o.nome)}"><svg class="ic ic-sm"><use href="#i-lixo"/></svg></button>
      </div>`).join("")}
  </div>`:'<div class="empty-sm">Nenhum item. Escolha um modelo no cat\xE1logo acima.</div>'}function q(){const o=a.orcSub(c),e=a.orcDesc(c),s=o-e,n=a.orcCusto(c),d=s?(s-n)/s*100:0,r=c.condicao,i=Math.min(a.n(r.entrada),s),u=s-i,p=Math.max(a.n(r.parcelas),1),b=a.n(r.juros),$=b>0?a.pmt(u,b,p):u/p,m=i+$*p,v=a.cfg();return`
  <div class="card">
    <div class="card-hd"><div><h3>Resumo</h3></div></div>
    <div class="card-bd">
      <div class="tot-box mb">
        <div class="tot-line"><span class="muted">Subtotal</span><b class="tnum">${t(a.money(o))}</b></div>
        <div class="tot-line"><span class="muted">Desconto (${a.dec(c.descontoPct,1)}%)</span><b class="tnum" style="color:var(--dang)">\u2212 ${t(a.money(e))}</b></div>
        <div class="tot-line big"><span>Total</span><span class="tnum">${t(a.money(s))}</span></div>
      </div>
      ${a.podeVerCusto()?`<div class="row" style="justify-content:space-between">
        <span class="small muted">Custo ${t(a.money0(n))}</span>
        ${a.badge("Margem "+a.dec(d,1)+"%",d>=40?"b-ok":d>=25?"b-warn":"b-dang")}
      </div>`:""}
      ${a.n(c.descontoPct)>a.n(v.descontoMaxPct)?`<div class="alert ${a.ehGestor()?"a-warn":"a-dang"} mt">
        <svg class="ic"><use href="#i-alerta"/></svg>
        <div>${a.ehGestor()?`Desconto acima da al\xE7ada de ${a.dec(v.descontoMaxPct,0)}%. Como gestor, voc\xEA pode salvar assim mesmo \u2014 fica registrado no seu nome.`:`Desconto acima da al\xE7ada de ${a.dec(v.descontoMaxPct,0)}%. Ao salvar, a proposta vai para <b>aprova\xE7\xE3o do gerente</b> e n\xE3o pode ser enviada antes da libera\xE7\xE3o.`}</div></div>`:""}
      ${M().length?`<div class="alert a-warn mt"><svg class="ic"><use href="#i-estoque"/></svg>
        <div><b>Sem unidade livre em estoque:</b> ${t(M().map(l=>l.nome).join(", "))}. D\xE1 para vender, mas \xE9 preciso comprar do fornecedor \u2014 confirme o prazo antes de prometer a data.</div></div>`:""}
    </div>
    <div class="card-hd" style="border-top:1px solid var(--line)"><div><h3>Condi\xE7\xE3o de pagamento</h3></div></div>
    <div class="card-bd">
      <div class="fgrid">
        <div class="f f-6"><label for="edEnt">Entrada (R$)</label>
          <input class="inp inp-money" id="edEnt" type="text" inputmode="decimal" value="${t(a.dec(r.entrada))}" data-inp="orcCond" data-k="entrada"></div>
        <div class="f f-6"><label for="edParc">Parcelas</label>
          <input class="inp" id="edParc" type="number" min="1" max="${a.n(v.parcelasMax)}" value="${t(p)}" data-inp="orcCond" data-k="parcelas"></div>
        <div class="f f-6"><label for="edJur">Juros a.m. (%)</label>
          <input class="inp" id="edJur" type="number" step="0.01" min="0" value="${t(b)}" data-inp="orcCond" data-k="juros"></div>
        <div class="f f-6"><label>Parcela</label>
          <div style="padding:9px 0"><b style="font-size:17px;color:var(--teal-2)">${t(a.money($))}</b></div></div>
      </div>
      <div class="tot-box">
        <div class="tot-line"><span class="muted">Entrada</span><span class="tnum">${t(a.money(i))}</span></div>
        <div class="tot-line"><span class="muted">${p}\xD7 de</span><span class="tnum">${t(a.money($))}</span></div>
        <div class="tot-line"><span class="muted">Total financiado</span><span class="tnum">${t(a.money(m))}</span></div>
        ${m>s+.5?`<div class="tot-line"><span class="muted">Custo do cr\xE9dito</span><span class="tnum" style="color:var(--warn)">+ ${t(a.money(m-s))}</span></div>`:""}
      </div>
    </div>
  </div>`}function M(){const o=c.id&&a.ORC_RESERVA.includes(c.status)?(a.find("orcamentos",c.id)||{itens:[]}).itens:[];return c.itens.filter(e=>{const s=a.prod(e.produtoId);if(!s||!s.controlaEstoque)return!1;const n=o.filter(d=>d.produtoId===e.produtoId).reduce((d,r)=>d+a.n(r.qtd),0);return a.disponivel(s.id)+n<a.n(e.qtd)})}function w(){const o=document.getElementById("edItens");o&&(o.innerHTML=j()),C();const e=document.querySelector(".cat-grid");e&&(e.outerHTML=E())}function C(){const o=document.getElementById("edTotais");o&&(o.innerHTML=q())}a.on("orcCampo",(o,e)=>{if(c[o.k]=e.value,o.k==="clienteId"&&e.value){const s=a.cli(e.value);s&&s.leadId&&!c.leadId&&(c.leadId=s.leadId)}}),a.on("orcDesconto",(o,e)=>{c.descontoPct=a.n(e.value),C()}),a.on("orcCond",(o,e)=>{c.condicao[o.k]=o.k==="entrada"?a.parseMoney(e.value):a.n(e.value),C()}),a.on("orcItem",(o,e)=>{const s=c.itens[a.n(o.i)];if(!s)return;s[o.k]=o.k==="preco"?a.parseMoney(e.value):a.n(e.value);const n=document.querySelector(`[data-tot="${o.i}"]`);n&&(n.textContent=a.money(a.n(s.qtd)*a.n(s.preco))),C()}),a.on("orcRmItem",o=>{c.itens.splice(a.n(o.i),1),w()}),a.on("orcAddProd",o=>N(o.id)),a.on("orcAddSelect",(o,e)=>{e.value&&(N(e.value),e.value="")});function N(o){const e=a.prod(o);if(!e)return;const s=c.itens.findIndex(n=>n.produtoId===o);if(s>=0){if(e.categoria==="Piscina"){c.itens.splice(s,1),w();return}c.itens[s].qtd=a.n(c.itens[s].qtd)+1}else if(c.itens.push({produtoId:e.id,nome:e.nome,qtd:1,preco:a.n(e.preco),custo:a.n(e.custo)}),e.categoria==="Piscina"){const n=a.all("produtos").find(d=>d.sku==="SRV-INS-PAD");n&&!c.itens.some(d=>d.produtoId===n.id)&&c.itens.push({produtoId:n.id,nome:n.nome,qtd:1,preco:a.n(n.preco),custo:a.n(n.custo)})}w()}a.on("orcSalvar",()=>{if(!c.itens.length)return a.toast("Adicione ao menos um item","err");if(!c.clienteId&&!c.leadId)return a.toast("Vincule a um cliente ou lead","err");const o=a.cfg(),e=!c.id;e&&(c.numero=a.proximoNumero("proximoNumOrc"));const s=a.n(c.descontoPct)>a.n(o.descontoMaxPct);s&&o.exigirAprovacaoDesconto&&!a.ehGestor()?c.status!=="aprovacao"&&c.status!=="aprovado"&&(c.status="aprovacao",c.pedidoAlcadaPor=a.usuario().nome,c.pedidoAlcadaEm=a.agora(),c.aprovadoPor="",c.aprovadoEm="",a.toast("Desconto acima da al\xE7ada \u2014 enviado para aprova\xE7\xE3o do gerente","warn")):s&&a.ehGestor()?(c.aprovadoPor=a.usuario().nome,c.aprovadoEm=a.agora()):!s&&c.status==="aprovacao"&&(c.status="rascunho");const n=a.upsert("orcamentos",c);if(c.leadId){const d=a.lead(c.leadId);d&&a.ETAPAS_ATIVAS.includes(d.etapa)&&a.ETAPAS.findIndex(i=>i.id===d.etapa)<3&&(d.etapa="proposta",a.save("leads")),a.interagir(c.leadId,"Proposta",`Or\xE7amento #${c.numero} ${e?"criado":"atualizado"} \u2014 ${a.money(a.orcTotal(c))}.`,"Sistema")}a.closeTop(),a.toast(e?`Or\xE7amento #${c.numero} criado`:"Or\xE7amento atualizado","ok"),a.render(),k(n)}),a.on("orcPreview",()=>{if(!c.itens.length)return a.toast("Adicione itens antes de gerar a proposta","err");a.imprimir(D(c),`Proposta #${c.numero||"rascunho"}`)}),a.on("abrirOrc",o=>k(o.id));function k(o){const e=a.find("orcamentos",o);if(!e)return a.toast("Or\xE7amento n\xE3o encontrado","err");const s=a.STATUS_ORC[e.status],n=a.pedidoDoOrc(e.id),d=e.condicao||{},r=a.orcTotal(e),i=r-a.n(d.entrada),u=Math.max(a.n(d.parcelas),1),p=a.n(d.juros)>0?a.pmt(i,d.juros,u):i/u,b=a.n(e.descontoPct)>a.n(a.cfg().descontoMaxPct),$=`
    <div class="row mb" style="gap:7px">
      ${a.badge(s.nome,s.cls)}
      ${e.validade<a.hoje()&&(e.status==="enviado"||e.status==="negociando")?a.badge("Validade vencida","b-dang"):""}
      ${n?a.badge(`Pedido #${n.numero}`,"b-ink"):""}
      ${a.ORC_RESERVA.includes(e.status)?a.badge("Reservando estoque","b-teal"):""}
    </div>

    ${e.status==="aprovacao"?`<div class="alert a-dang mb"><svg class="ic"><use href="#i-alerta"/></svg>
      <div><b>Travado na al\xE7ada.</b> Desconto de ${a.dec(e.descontoPct,1)}% (limite ${a.dec(a.cfg().descontoMaxPct,0)}%),
      pedido por ${t(e.pedidoAlcadaPor||"\u2014")} em ${t(a.dtHora(e.pedidoAlcadaEm))}.
      ${a.ehGestor()?"Libere ou devolva usando os bot\xF5es abaixo.":"Aguardando decis\xE3o do gerente."}</div></div>`:""}

    ${e.aprovadoPor&&b?`<div class="alert a-ok mb"><svg class="ic"><use href="#i-check"/></svg>
      <div>Desconto de ${a.dec(e.descontoPct,1)}% liberado por <b>${t(e.aprovadoPor)}</b> em ${t(a.dtHora(e.aprovadoEm))}.</div></div>`:""}

    <div class="card mb"><div class="card-bd">
      <dl class="dl">
        <dt>Cliente / lead</dt><dd><b>${t(O(e))}</b></dd>
        <dt>Vendedor</dt><dd>${t(a.vendNome(e.vendedorId))}</dd>
        <dt>Emiss\xE3o</dt><dd>${t(a.dt(e.data))}</dd>
        <dt>Validade</dt><dd>${t(a.dt(e.validade))}</dd>
        <dt>Margem</dt><dd>${a.dec(a.orcMargem(e),1)}% (custo ${t(a.money0(a.orcCusto(e)))})</dd>
      </dl>
    </div></div>

    <div class="card mb">
      <div class="card-hd"><div><h3>Itens</h3></div></div>
      ${a.tabela({rows:e.itens,cols:[{h:"Descri\xE7\xE3o",r:v=>`<span class="small">${t(v.nome)}</span>`},{h:"Qtd",cls:"num",r:v=>a.dec(v.qtd,a.n(v.qtd)%1?2:0)},{h:"Unit.",cls:"num",r:v=>t(a.money(v.preco))},{h:"Total",cls:"num",r:v=>`<b>${t(a.money(a.n(v.qtd)*a.n(v.preco)))}</b>`}]})}
      <div class="card-ft" style="justify-content:flex-end">
        <div class="tot-box" style="min-width:250px;background:transparent;border:0;padding:0">
          <div class="tot-line"><span class="muted">Subtotal</span><span class="tnum">${t(a.money(a.orcSub(e)))}</span></div>
          ${e.descontoPct?`<div class="tot-line"><span class="muted">Desconto ${a.dec(e.descontoPct,1)}%</span><span class="tnum" style="color:var(--dang)">\u2212 ${t(a.money(a.orcDesc(e)))}</span></div>`:""}
          <div class="tot-line big"><span>Total</span><span class="tnum">${t(a.money(r))}</span></div>
        </div>
      </div>
    </div>

    <div class="card mb">
      <div class="card-hd"><div><h3>Condi\xE7\xE3o de pagamento</h3></div></div>
      <div class="card-bd">
        <dl class="dl">
          <dt>Entrada</dt><dd>${t(a.money(d.entrada))}</dd>
          <dt>Parcelamento</dt><dd><b>${u}\xD7 de ${t(a.money(p))}</b>${a.n(d.juros)?` <span class="faint small">(juros ${a.dec(d.juros,2)}% a.m.)</span>`:' <span class="faint small">(sem juros)</span>'}</dd>
          <dt>Total a prazo</dt><dd>${t(a.money(a.n(d.entrada)+p*u))}</dd>
        </dl>
      </div>
    </div>

    ${e.obs?`<div class="card"><div class="card-hd"><div><h3>Observa\xE7\xF5es</h3></div></div><div class="card-bd small muted" style="white-space:pre-wrap">${t(e.obs)}</div></div>`:""}`,m=[{txt:"Proposta em PDF",cls:"btn-teal",ic:"i-print",act:"imprimirOrc",data:{id:e.id}}];e.status!=="aprovacao"&&m.push({txt:"Enviar por WhatsApp",cls:"btn-ok",ic:"i-wpp",act:"waProposta",data:{id:e.id}}),e.status==="aprovacao"&&a.ehGestor()&&(m.push({txt:"Liberar desconto",cls:"btn-ok",ic:"i-check",act:"liberarAlcada",data:{id:e.id}}),m.push({txt:"Devolver ao vendedor",cls:"btn-dang",act:"negarAlcada",data:{id:e.id}})),e.status==="rascunho"&&m.push({txt:"Marcar enviado",ic:"i-check",act:"statusOrc",data:{id:e.id,s:"enviado"}}),(e.status==="enviado"||e.status==="negociando"||e.status==="expirado")&&(m.push({txt:"Aprovar e gerar pedido",cls:"btn-ok",ic:"i-check",act:"aprovarOrc",data:{id:e.id}}),m.push({txt:"Recusado",cls:"btn-dang",act:"statusOrc",data:{id:e.id,s:"recusado"}})),e.status==="aprovado"&&!n&&m.push({txt:"Gerar pedido",cls:"btn-ok",ic:"i-pedido",act:"gerarPedido",data:{id:e.id}}),n&&m.push({txt:`Abrir pedido #${n.numero}`,ic:"i-pedido",act:"abrirPedido",data:{id:n.id}}),m.push({txt:"Duplicar",ic:"i-copia",act:"duplicarOrc",data:{id:e.id}}),n||m.push({txt:"Editar",ic:"i-edit",act:"editarOrc",data:{id:e.id}}),m.push({txt:"Excluir",act:"excluirOrc",data:{id:e.id}}),a.drawer({title:`Or\xE7amento #${e.numero}`,sub:`${O(e)} \xB7 ${a.money(r)}`,body:$,actions:m,wide:!0})}a.abrirOrc=k,a.on("imprimirOrc",o=>a.imprimir(D(a.find("orcamentos",o.id)),`Proposta #${a.find("orcamentos",o.id).numero}`)),a.on("statusOrc",o=>{const e=a.find("orcamentos",o.id);if(e.status=o.s,a.save("orcamentos"),e.leadId&&a.interagir(e.leadId,"Proposta",`Or\xE7amento #${e.numero} marcado como "${a.STATUS_ORC[o.s].nome}".`,"Sistema"),o.s==="recusado"&&e.leadId){const s=a.lead(e.leadId);s&&a.ETAPAS_ATIVAS.includes(s.etapa)&&(s.etapa="negociacao",a.save("leads"))}a.closeAll(),a.toast("Status atualizado","ok"),a.render()}),a.on("liberarAlcada",async o=>{const e=a.find("orcamentos",o.id);if(!a.ehGestor())return a.toast("S\xF3 gerente ou administrador libera desconto","err");await a.confirmar(`Liberar ${a.dec(e.descontoPct,1)}% de desconto na proposta #${e.numero}?

Isso reduz ${a.money(a.orcDesc(e))} do valor cheio.`,{title:"Aprovar desconto",okTxt:"Liberar"})&&(e.status="enviado",e.aprovadoPor=a.usuario().nome,e.aprovadoEm=a.agora(),a.save("orcamentos"),e.leadId&&a.interagir(e.leadId,"Proposta",`Desconto de ${a.dec(e.descontoPct,1)}% liberado por ${e.aprovadoPor}.`,"Sistema"),a.closeAll(),a.toast("Desconto liberado \u2014 proposta pronta para envio","ok"),a.render())}),a.on("negarAlcada",async o=>{const e=a.find("orcamentos",o.id);if(!a.ehGestor())return a.toast("S\xF3 gerente ou administrador decide al\xE7ada","err");const s=await a.perguntar("Por que est\xE1 devolvendo? (o vendedor v\xEA essa mensagem)",{title:"Devolver ao vendedor",multi:!0,valor:`Desconto m\xE1ximo autorizado: ${a.dec(a.cfg().descontoMaxPct,0)}%.`});s&&(e.status="rascunho",e.obs=(e.obs?e.obs+`

`:"")+`[Al\xE7ada negada por ${a.usuario().nome} em ${a.dt(a.hoje())}] ${s}`,a.save("orcamentos"),a.closeAll(),a.toast("Proposta devolvida ao vendedor"),a.render())}),a.on("duplicarOrc",o=>{const e=a.find("orcamentos",o.id),s=JSON.parse(JSON.stringify(e));delete s.id,s.numero=a.proximoNumero("proximoNumOrc"),s.data=a.hoje(),s.validade=a.addDias(a.hoje(),a.n(a.cfg().validadeProposta)),s.status="rascunho";const n=a.upsert("orcamentos",s);a.closeAll(),a.toast(`Or\xE7amento #${s.numero} criado por c\xF3pia`,"ok"),a.render(),k(n)}),a.on("excluirOrc",async o=>{const e=a.find("orcamentos",o.id);await a.confirmarExclusao("orcamento",o.id,`Or\xE7amento #${e.numero}`,{msg:`Excluir o or\xE7amento #${e.numero}? Essa a\xE7\xE3o n\xE3o pode ser desfeita.`,alternativa:"Marque como recusado em vez de apagar \u2014 a taxa de aprova\xE7\xE3o nos relat\xF3rios depende desse hist\xF3rico."})&&(a.remove("orcamentos",o.id),a.closeAll(),a.toast("Or\xE7amento exclu\xEDdo"),a.render())}),a.on("aprovarOrc",o=>V(o.id)),a.on("gerarPedido",o=>V(o.id));async function V(o){const e=a.find("orcamentos",o);if(!e)return;if(a.pedidoDoOrc(o))return a.toast("Esse or\xE7amento j\xE1 virou pedido.","warn");if(e.status==="aprovacao")return a.toast("O desconto ainda n\xE3o foi liberado pelo gerente.","err");const s=e.itens.filter(r=>{const i=a.prod(r.produtoId);if(!i||!i.controlaEstoque)return!1;const u=a.ORC_RESERVA.includes(e.status)?e.itens.filter(p=>p.produtoId===r.produtoId).reduce((p,b)=>p+a.n(b.qtd),0):0;return a.disponivel(i.id)+u<a.n(r.qtd)});if(!await a.confirmar(`Aprovar o or\xE7amento #${e.numero} (${a.money(a.orcTotal(e))}) e gerar o pedido de venda?`,{title:"Fechar venda",okTxt:"Aprovar e gerar",aviso:s.length?`Aten\xE7\xE3o: ${s.map(r=>r.nome).join(", ")} vai ficar com estoque negativo. Gere um pedido de compra antes de prometer a data de instala\xE7\xE3o.`:"Isso cria o pedido, abre a obra, lan\xE7a as parcelas no financeiro, registra a comiss\xE3o e baixa o estoque dos itens."}))return;a.toast("Processando venda no servidor\u2026");const d=a.driver.nome==="supabase"?await a.fecharVendaConfirmada("pedido",{orcamentoId:o,versao:e.atualizadoEm},"pedido:"+o):a.gerarPedido(o);a.closeAll(),a.toast(`Pedido #${d.pedido.numero} gerado`,"ok"),a.render(),T(d.pedido.id)}a.gerarPedido=o=>{const e=a.find("orcamentos",o),s=a.cfg(),n=a.proximoNumero("proximoNumPedido");e.status="aprovado",a.save("orcamentos");let d=e.clienteId;if(!d&&e.leadId){const f=a.lead(e.leadId),P=a.all("clientes").find(I=>I.leadId===f.id||a.digitos(I.telefone)===a.digitos(f.telefone));P?d=P.id:d=a.upsert("clientes",{nome:f.nome,tipo:"PF",doc:"",telefone:f.telefone,email:f.email||"",cep:"",endereco:"",bairro:f.bairro||"",cidade:f.cidade||"",uf:"",leadId:f.id,obs:f.obs||"",criadoEm:a.agora()}),e.clienteId=d,a.save("orcamentos")}if(e.leadId){const f=a.lead(e.leadId);f&&f.etapa!=="ganho"&&(f.etapa="ganho",f.atualizadoEm=a.agora(),a.save("leads")),a.interagir(e.leadId,"Ganho",`Or\xE7amento #${e.numero} aprovado. Venda fechada.`,"Sistema")}const r=a.cli(d)||{},i=a.cent(a.orcTotal(e)),u=a.cent(a.orcCusto(e)),p=a.upsert("pedidos",{numero:n,orcamentoId:e.id,clienteId:d,vendedorId:e.vendedorId,data:a.hoje(),status:"aberto",obraId:"",formaPag:a.n(e.condicao.parcelas)>1?"Financiamento":"PIX",obs:"",total:i,custo:u,subtotal:a.cent(a.orcSub(e)),descontoPct:a.n(e.descontoPct),descontoValor:a.cent(a.orcDesc(e)),itens:JSON.parse(JSON.stringify(e.itens)),condicao:JSON.parse(JSON.stringify(e.condicao||{}))}),b=a.upsert("obras",{pedidoId:p,clienteId:d,status:"aguardando",dataAgendada:"",dataConclusao:"",endereco:[r.endereco,r.bairro].filter(Boolean).join(" \u2014 "),cidade:r.cidade||"",responsavel:"",equipeObraId:"",duracaoDias:3,custoPrevisto:a.orcCusto(e),custoReal:0,checklist:a.CHECKLIST_OBRA.map(()=>!1),notas:[{data:a.agora(),texto:`Obra aberta a partir do pedido #${n}.`,autor:"Sistema"}]}),$=a.find("pedidos",p);$.obraId=b,a.save("pedidos");const m=i,v=e.condicao||{entrada:0,parcelas:1,juros:0},l=a.cent(Math.min(a.n(v.entrada),m)),y=Math.max(a.n(v.parcelas),1),x=a.parcelar(m-l,y,v.juros);l>0&&a.upsert("financeiro",{tipo:"receber",descricao:`Entrada \u2014 Pedido #${n}`,categoria:"Venda de piscina",valor:l,vencimento:a.hoje(),status:"aberto",pagoEm:"",formaPag:"PIX",clienteId:d,origem:{tipo:"pedido",id:p},parcela:0,parcelas:y,obs:""}),x.forEach((f,P)=>{const I=P+1;a.upsert("financeiro",{tipo:"receber",descricao:`Parcela ${I}/${y} \u2014 Pedido #${n}`,categoria:"Venda de piscina",valor:f,vencimento:a.addMeses(a.hoje(),l>0?I:I-1),status:"aberto",pagoEm:"",formaPag:$.formaPag,clienteId:d,origem:{tipo:"pedido",id:p},parcela:I,parcelas:y,obs:""})});const g=u;g>0&&(a.upsert("financeiro",{tipo:"pagar",descricao:`Custo de produto \u2014 Pedido #${n}`,categoria:"Compra de piscina",valor:a.cent(g*.62),vencimento:a.addDias(a.hoje(),30),status:"aberto",pagoEm:"",formaPag:"Boleto",fornecedorId:"fo1",origem:{tipo:"pedido",id:p},parcela:1,parcelas:1,obs:""}),a.upsert("financeiro",{tipo:"pagar",descricao:`M\xE3o de obra e escava\xE7\xE3o \u2014 Pedido #${n}`,categoria:"M\xE3o de obra",valor:a.cent(g*.24),vencimento:a.addDias(a.hoje(),15),status:"aberto",pagoEm:"",formaPag:"Transfer\xEAncia",origem:{tipo:"pedido",id:p},parcela:1,parcelas:1,obs:""}));const z=a.vend(e.vendedorId);return a.upsert("comissoes",Object.assign({vendedorId:e.vendedorId,pedidoId:p,clienteId:d,competencia:a.mesKey(a.hoje()),status:"prevista",pagoEm:""},a.calcComissao({itens:e.itens,faturamento:m,custo:g,vendedorId:e.vendedorId,pct:z?a.n(z.comissaoPct):a.n(s.comissaoPct)}))),e.itens.forEach(f=>{const P=a.prod(f.produtoId);!P||!P.controlaEstoque||(P.estoque=a.n(P.estoque)-a.n(f.qtd),a.upsert("estoqueMov",{produtoId:P.id,tipo:"saida",qtd:a.n(f.qtd),data:a.hoje(),motivo:`Pedido #${n}`,ref:p}))}),a.save("produtos"),{pedido:a.find("pedidos",p),obra:a.find("obras",b)}};const S={status:""};a.view("pedidos",{titulo:"Pedidos de venda",sub:()=>`${a.escopo(a.where("pedidos",o=>o.status!=="cancelado")).length} pedidos ativos`,render(){let o=a.escopo(a.all("pedidos")).slice();S.status&&(o=o.filter(r=>r.status===S.status)),o=a.sortBy(o,"numero","desc");const e=a.paginar("pedidos",o),s=a.escopo(a.where("pedidos",r=>r.status!=="cancelado")),n=a.soma(s,a.pedidoTotal),d=a.soma(s,a.pedidoCusto);return`
      <div class="kpis mb">
        ${a.kpi({cls:"k-teal",lbl:"Faturamento total",val:a.money0(n),sm:!0,foot:`${s.length} pedidos`})}
        ${a.kpi({lbl:"Ticket m\xE9dio",val:a.money0(s.length?n/s.length:0),sm:!0})}
        ${a.podeVerCusto()?a.kpi({cls:"k-ok",lbl:"Margem bruta",val:a.money0(n-d),sm:!0,foot:a.pct(n?(n-d)/n*100:0,1)}):a.kpi({cls:"k-ok",lbl:"Conclu\xEDdos",val:String(s.filter(r=>r.status==="concluido").length),foot:"venda paga e entregue"})}
        ${a.kpi({cls:"k-warn",lbl:"Em produ\xE7\xE3o/aberto",val:String(s.filter(r=>r.status==="aberto"||r.status==="producao").length)})}
      </div>

      <div class="toolbar">
        <div class="seg">
          <button class="${S.status?"":"on"}" data-act="filtroPed" data-s="">Todos</button>
          ${Object.keys(a.STATUS_PEDIDO).map(r=>`<button class="${S.status===r?"on":""}" data-act="filtroPed" data-s="${r}">${t(a.STATUS_PEDIDO[r].nome)}</button>`).join("")}
        </div>
        <div class="row-end row">
          <button class="btn" data-act="exportarPedidos"><svg class="ic"><use href="#i-down"/></svg>CSV</button>
        </div>
      </div>

      <div class="card">
        ${o.length?a.tabela({act:"abrirPedido",rows:e.linhas,cols:[{h:"N\xBA",w:"92px",r:r=>`<b>#${r.numero}</b><span class="mini">${t(a.dt(r.data))}</span>`},{h:"Cliente",r:r=>`<div class="strong">${t(a.cliNome(r.clienteId))}</div><span class="mini">Or\xE7. #${(a.orcDoPedido(r)||{}).numero||"\u2014"}</span>`},{h:"Vendedor",r:r=>`<span class="small">${t(a.vendNome(r.vendedorId).split(" ")[0])}</span>`},{h:"Obra",r:r=>{const i=a.find("obras",r.obraId);return i?a.badge(a.STATUS_OBRA[i.status].nome,a.STATUS_OBRA[i.status].cls):'<span class="faint small">\u2014</span>'}},{h:"Pagamento",r:r=>`<span class="small">${t(r.formaPag||"\u2014")}</span>`},{h:"Status",r:r=>a.badge(a.statusPedidoNome(r.status),a.statusPedidoCls(r.status))},{h:"Total",cls:"num",r:r=>`<b>${t(a.money(a.pedidoTotal(r)))}</b>`}]})+e.html:a.vazio("Nenhum pedido","Pedidos nascem da aprova\xE7\xE3o de um or\xE7amento.")}
      </div>`}}),a.on("filtroPed",o=>{S.status=o.s,a.resetPagina("pedidos"),a.render()}),a.on("abrirPedido",o=>T(o.id));function T(o){const e=a.find("pedidos",o);if(!e)return a.toast("Pedido n\xE3o encontrado","err");const s=a.orcDoPedido(e),n=a.find("obras",e.obraId),r=a.where("financeiro",l=>l.origem&&l.origem.id===e.id).filter(l=>l.tipo==="receber"),i=a.soma(r.filter(l=>l.status==="pago"),"valor"),u=a.soma(r.filter(l=>l.status==="aberto"),"valor"),p=a.all("comissoes").find(l=>l.pedidoId===e.id),b=a.pedidoTotal(e),$=`
    <div class="row mb" style="gap:7px">
      ${a.badge(a.statusPedidoNome(e.status),a.statusPedidoCls(e.status))}
      ${n?a.badge("Obra: "+a.STATUS_OBRA[n.status].nome,a.STATUS_OBRA[n.status].cls):""}
    </div>

    <div class="kpis mb">
      ${a.kpi({cls:"k-teal",lbl:"Valor do pedido",val:a.money0(b),sm:!0})}
      ${a.kpi({cls:"k-ok",lbl:"Recebido",val:a.money0(i),sm:!0,foot:a.pct(b?i/b*100:0,0)})}
      ${a.kpi({cls:u?"k-warn":"",lbl:"A receber",val:a.money0(u),sm:!0})}
    </div>

    <div class="card mb"><div class="card-bd">
      <dl class="dl">
        <dt>Cliente</dt><dd><b>${t(a.cliNome(e.clienteId))}</b></dd>
        <dt>Vendedor</dt><dd>${t(a.vendNome(e.vendedorId))}</dd>
        <dt>Data</dt><dd>${t(a.dt(e.data))}</dd>
        <dt>Or\xE7amento</dt><dd>#${s?s.numero:"\u2014"}</dd>
        <dt>Pagamento</dt><dd>${t(e.formaPag||"\u2014")}</dd>
        ${a.podeVerCusto()?`<dt>Custo previsto</dt><dd>${t(a.money(a.pedidoCusto(e)))} <span class="faint small">(margem ${a.dec(b?(b-a.pedidoCusto(e))/b*100:0,1)}%)</span></dd>`:""}
        ${p?`<dt>Comiss\xE3o</dt><dd>${t(a.money(p.valor))} <span class="faint small">(${p.baseTipo==="metro"?`${t(a.money0(p.valorMetro))} \xD7 ${a.dec(p.metros,2)} m de piscina`:`${a.dec(p.pct,1)}% sobre ${t(p.baseTipo==="margem"?"a margem":"o faturamento")}`} \xB7 ${t(p.status)})</span></dd>`:""}
      </dl>
      ${e.obs?`<div class="sep"></div><div class="small muted">${t(e.obs)}</div>`:""}
    </div></div>

    ${a.pedidoItens(e).length?`<div class="card mb">
      <div class="card-hd"><div><h3>Itens</h3><div class="sub">Como estavam no fechamento da venda</div></div></div>
      ${a.tabela({rows:a.pedidoItens(e),cols:[{h:"Descri\xE7\xE3o",r:l=>`<span class="small">${t(l.nome)}</span>`},{h:"Qtd",cls:"num",r:l=>a.dec(l.qtd,a.n(l.qtd)%1?2:0)},{h:"Unit.",cls:"num",r:l=>t(a.money(l.preco))},{h:"Total",cls:"num",r:l=>`<b>${t(a.money(a.n(l.qtd)*a.n(l.preco)))}</b>`}]})}
    </div>`:""}

    <div class="card mb">
      <div class="card-hd"><div><h3>Parcelas</h3><div class="sub">Lan\xE7amentos a receber deste pedido</div></div></div>
      ${r.length?a.tabela({rows:a.sortBy(r,"vencimento"),cols:[{h:"Descri\xE7\xE3o",r:l=>`<span class="small">${t(l.descricao)}</span>`},{h:"Vencimento",r:l=>`<span class="small ${l.status==="aberto"&&l.vencimento<a.hoje()?"b":""}" style="${l.status==="aberto"&&l.vencimento<a.hoje()?"color:var(--dang)":""}">${t(a.dt(l.vencimento))}</span>`},{h:"Status",r:l=>a.badge(l.status==="pago"?"Pago":"Aberto",l.status==="pago"?"b-ok":l.vencimento<a.hoje()?"b-dang":"b-warn")},{h:"Valor",cls:"num",r:l=>t(a.money(l.valor))},{h:"",cls:"acts",r:l=>l.status==="aberto"?`<button class="btn btn-sm btn-ok" data-act="baixarFin" data-id="${t(l.id)}">Baixar</button>`:""}]}):'<div class="empty-sm">Sem lan\xE7amentos.</div>'}
    </div>`,m=[],v={aberto:"producao",producao:"entregue",entregue:"concluido"};v[e.status]&&m.push({txt:`Avan\xE7ar para "${a.statusPedidoNome(v[e.status])}"`,cls:"btn-primary",ic:"i-seta",act:"avancarPedido",data:{id:e.id}}),n&&m.push({txt:"Abrir obra",ic:"i-obra",act:"abrirObra",data:{id:n.id}}),s&&m.push({txt:"Ver or\xE7amento",ic:"i-orc",act:"abrirOrc",data:{id:s.id}}),e.status!=="cancelado"&&e.status!=="concluido"&&m.push({txt:"Cancelar pedido",cls:"btn-dang",act:"cancelarPedido",data:{id:e.id}}),a.drawer({title:`Pedido #${e.numero}`,sub:`${a.cliNome(e.clienteId)} \xB7 ${a.money(b)}`,body:$,actions:m,wide:!0})}a.abrirPedido=T,a.on("avancarPedido",o=>{const e=a.find("pedidos",o.id),n={aberto:"producao",producao:"entregue",entregue:"concluido"}[e.status];if(n){if(e.status=n,a.save("pedidos"),n==="concluido"){const d=a.all("comissoes").find(r=>r.pedidoId===e.id);d&&d.status==="prevista"&&(d.status="liberada",a.save("comissoes"))}a.closeAll(),a.toast(`Pedido \u2192 ${a.statusPedidoNome(n)}`,"ok"),a.render(),T(o.id)}}),a.on("cancelarPedido",async o=>{const e=a.find("pedidos",o.id);if(!await a.confirmar(`Cancelar o pedido #${e.numero}?`,{perigo:!0,okTxt:"Cancelar pedido",aviso:"As parcelas em aberto e a comiss\xE3o prevista tamb\xE9m ser\xE3o canceladas. Baixas j\xE1 feitas permanecem."}))return;e.status="cancelado",a.save("pedidos"),a.where("financeiro",d=>d.origem&&d.origem.id===e.id&&d.status==="aberto").forEach(d=>d.status="cancelado"),a.save("financeiro");const s=a.all("comissoes").find(d=>d.pedidoId===e.id);s&&s.status!=="paga"&&(s.status="cancelada",a.save("comissoes"));const n=a.find("obras",e.obraId);n&&n.status!=="concluida"&&(n.status="cancelada",a.save("obras")),a.closeAll(),a.toast("Pedido cancelado"),a.render()}),a.on("exportarPedidos",()=>{const o=[["N\xFAmero","Data","Cliente","Vendedor","Status","Forma de pagamento","Total","Custo","Margem %","Obra"]];a.all("pedidos").forEach(e=>{const s=a.pedidoTotal(e),n=a.pedidoCusto(e),d=a.find("obras",e.obraId);o.push([e.numero,a.dt(e.data),a.cliNome(e.clienteId),a.vendNome(e.vendedorId),a.statusPedidoNome(e.status),e.formaPag||"",a.dec(s),a.dec(n),a.dec(s?(s-n)/s*100:0,1),d?a.STATUS_OBRA[d.status].nome:""])}),a.baixar(`pedidos-${a.hoje()}.csv`,a.csv(o),"text/csv;charset=utf-8"),a.toast("CSV exportado","ok")});function D(o){const e=a.cfg(),s=o.clienteId?a.cli(o.clienteId):null,n=o.leadId?a.lead(o.leadId):null,d=s?s.nome:n?n.nome:"Cliente",r=s?a.fone(s.telefone):n?a.fone(n.telefone):"",i=s?[s.endereco,s.bairro,s.cidade].filter(Boolean).join(", "):n?[n.bairro,n.cidade].filter(Boolean).join(", "):"",u=a.vend(o.vendedorId)||{},p=a.orcSub(o),b=a.orcDesc(o),$=p-b,m=o.condicao||{},v=Math.min(a.n(m.entrada),$),l=Math.max(a.n(m.parcelas),1),y=a.n(m.juros)>0?a.pmt($-v,m.juros,l):($-v)/l,x=o.itens.map(g=>a.prod(g.produtoId)).find(g=>g&&g.categoria==="Piscina");return`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Proposta ${o.numero}</title>
<style>
  @page{ size:A4; margin:14mm 12mm; }
  *{ box-sizing:border-box; }
  body{ font-family:'Segoe UI',Helvetica,Arial,sans-serif; color:#12262D; margin:0; font-size:12px; line-height:1.5; }
  .wrap{ max-width:186mm; margin:0 auto; padding:10px 4px; }
  .hd{ display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid #0E7C86; padding-bottom:14px; margin-bottom:18px; }
  .logo{ font-size:24px; font-weight:800; color:#0B1F26; letter-spacing:-.5px; }
  .logo span{ color:#0E7C86; }
  .emp{ font-size:10.5px; color:#55666D; margin-top:5px; line-height:1.55; }
  .doc{ text-align:right; }
  .doc h1{ font-size:15px; margin:0 0 4px; color:#0E7C86; letter-spacing:.06em; text-transform:uppercase; }
  .doc .num{ font-size:26px; font-weight:800; color:#0B1F26; line-height:1; }
  .doc .dt{ font-size:10.5px; color:#55666D; margin-top:5px; }
  h2.sec{ font-size:10.5px; text-transform:uppercase; letter-spacing:.11em; color:#0E7C86; margin:20px 0 8px; padding-bottom:4px; border-bottom:1px solid #E2DCD0; }
  .box{ background:#FBF9F5; border:1px solid #E2DCD0; border-radius:8px; padding:12px 14px; }
  .cols{ display:flex; gap:14px; }
  .cols > div{ flex:1; }
  .kv{ display:flex; gap:8px; margin-bottom:3px; }
  .kv b{ min-width:74px; color:#55666D; font-weight:600; font-size:10.5px; text-transform:uppercase; letter-spacing:.04em; }
  table{ width:100%; border-collapse:collapse; margin-top:4px; }
  th{ background:#0B1F26; color:#fff; font-size:9.5px; text-transform:uppercase; letter-spacing:.07em; padding:8px 10px; text-align:left; }
  th.r,td.r{ text-align:right; }
  td{ padding:8px 10px; border-bottom:1px solid #E2DCD0; }
  tr:nth-child(even) td{ background:#FBF9F5; }
  .tot{ margin-top:12px; margin-left:auto; width:260px; }
  .tot div{ display:flex; justify-content:space-between; padding:4px 0; }
  .tot .big{ border-top:2px solid #0B1F26; margin-top:6px; padding-top:8px; font-size:17px; font-weight:800; color:#0B1F26; }
  .pag{ display:flex; gap:10px; margin-top:8px; }
  .pag .cel{ flex:1; background:#E3F5F5; border:1px solid #9FDCDF; border-radius:8px; padding:11px; text-align:center; }
  .pag .cel small{ display:block; font-size:9.5px; text-transform:uppercase; letter-spacing:.07em; color:#0A616A; margin-bottom:3px; }
  .pag .cel b{ font-size:16px; color:#0B1F26; }
  ul.terms{ margin:6px 0 0; padding-left:16px; color:#55666D; font-size:10.5px; }
  ul.terms li{ margin-bottom:3px; }
  .assin{ display:flex; gap:34px; margin-top:34px; }
  .assin div{ flex:1; border-top:1px solid #0B1F26; padding-top:5px; text-align:center; font-size:10px; color:#55666D; }
  .ft{ margin-top:22px; padding-top:10px; border-top:1px solid #E2DCD0; font-size:9.5px; color:#6E7F86; text-align:center; }
  .spec{ display:flex; gap:8px; margin-top:8px; }
  .spec div{ flex:1; text-align:center; background:#fff; border:1px solid #E2DCD0; border-radius:6px; padding:8px 4px; }
  .spec small{ display:block; font-size:9px; color:#6E7F86; text-transform:uppercase; letter-spacing:.05em; }
  .spec b{ font-size:14px; color:#0B1F26; }
</style></head><body><div class="wrap">

  <div class="hd">
    <div>
      <div class="logo">Piscina<span>Pro</span></div>
      <div class="emp">
        ${t(e.empresa)}<br>
        ${e.cnpj?"CNPJ "+t(e.cnpj)+"<br>":""}
        ${t(e.endereco||"")}<br>
        ${t(e.fone||"")}${e.email?" \xB7 "+t(e.email):""}
      </div>
    </div>
    <div class="doc">
      <h1>Proposta comercial</h1>
      <div class="num">N\xBA ${t(o.numero||"\u2014")}</div>
      <div class="dt">Emitida em ${t(a.dt(o.data))}<br><b>V\xE1lida at\xE9 ${t(a.dt(o.validade))}</b></div>
    </div>
  </div>

  <h2 class="sec">Cliente</h2>
  <div class="box cols">
    <div>
      <div class="kv"><b>Nome</b><span>${t(d)}</span></div>
      <div class="kv"><b>Contato</b><span>${t(r)}</span></div>
    </div>
    <div>
      <div class="kv"><b>Local</b><span>${t(i||"\u2014")}</span></div>
      <div class="kv"><b>Consultor</b><span>${t(u.nome||"\u2014")}${u.fone?" \xB7 "+t(u.fone):""}</span></div>
    </div>
  </div>

  ${x?`
  <h2 class="sec">Modelo selecionado \u2014 ${t(x.nome)}</h2>
  <div class="box">
    <div style="font-size:11.5px;color:#55666D">${t(x.descricao||"")}</div>
    <div class="spec">
      <div><small>Comprimento</small><b>${a.dec(x.specs.compr,2)} m</b></div>
      <div><small>Largura</small><b>${a.dec(x.specs.larg,2)} m</b></div>
      <div><small>Profundidade</small><b>${a.dec(x.specs.prof,2)} m</b></div>
      <div><small>Volume</small><b>${a.dec(x.specs.volume,1)} mil L</b></div>
      <div><small>Espelho d'\xE1gua</small><b>${a.dec(x.specs.area,1)} m\xB2</b></div>
    </div>
  </div>`:""}

  <h2 class="sec">Itens inclusos</h2>
  <table>
    <thead><tr><th>Descri\xE7\xE3o</th><th class="r" style="width:56px">Qtd</th><th class="r" style="width:96px">Unit\xE1rio</th><th class="r" style="width:104px">Total</th></tr></thead>
    <tbody>${o.itens.map(g=>`<tr>
      <td>${t(g.nome)}</td>
      <td class="r">${a.dec(g.qtd,a.n(g.qtd)%1?2:0)}</td>
      <td class="r">${t(a.money(g.preco))}</td>
      <td class="r"><b>${t(a.money(a.n(g.qtd)*a.n(g.preco)))}</b></td>
    </tr>`).join("")}</tbody>
  </table>

  <div class="tot">
    <div><span>Subtotal</span><span>${t(a.money(p))}</span></div>
    ${b?`<div><span>Desconto (${a.dec(o.descontoPct,1)}%)</span><span>\u2212 ${t(a.money(b))}</span></div>`:""}
    <div class="big"><span>Total</span><span>${t(a.money($))}</span></div>
  </div>

  <h2 class="sec">Condi\xE7\xE3o de pagamento</h2>
  <div class="pag">
    <div class="cel"><small>Entrada</small><b>${t(a.money(v))}</b></div>
    <div class="cel"><small>Parcelas</small><b>${l}\xD7 ${t(a.money(y))}</b></div>
    <div class="cel"><small>Total a prazo</small><b>${t(a.money(v+y*l))}</b></div>
  </div>
  ${a.n(m.juros)?`<div style="font-size:10px;color:#6E7F86;margin-top:6px">Financiamento com juros de ${a.dec(m.juros,2)}% ao m\xEAs (Tabela Price). Sujeito a an\xE1lise de cr\xE9dito.</div>`:""}

  <h2 class="sec">Condi\xE7\xF5es gerais</h2>
  <ul class="terms">
    <li>Prazo de instala\xE7\xE3o: at\xE9 ${a.n(e.prazoInstalacaoDias)} dias \xFAteis ap\xF3s a libera\xE7\xE3o do terreno e confirma\xE7\xE3o da entrada.</li>
    <li>Garantia de ${a.n(e.garantiaCasco)} anos contra defeitos de fabrica\xE7\xE3o do casco e 1 ano para equipamentos.</li>
    <li>Valores v\xE1lidos at\xE9 ${t(a.dt(o.validade))}. Ap\xF3s essa data, sujeitos a reajuste.</li>
    <li>N\xE3o inclusos: alvenaria de acabamento, paisagismo, ponto de energia trif\xE1sico e taxas de alvar\xE1/licen\xE7a, salvo se descritos acima.</li>
    <li>O acesso para m\xE1quina e caminh\xE3o \xE9 de responsabilidade do contratante. Obstru\xE7\xF5es podem gerar custo adicional.</li>
    <li>A retirada e o descarte do material escavado est\xE3o inclusos apenas quando o item "Escava\xE7\xE3o com m\xE1quina" constar na proposta.</li>
  </ul>

  ${o.obs?`<h2 class="sec">Observa\xE7\xF5es</h2><div class="box" style="white-space:pre-wrap;font-size:11px">${t(o.obs)}</div>`:""}

  <div class="assin">
    <div>${t(e.empresa)}</div>
    <div>${t(d)}</div>
  </div>

  <div class="ft">${t(e.empresa)}${e.site?" \xB7 "+t(e.site):""}${e.fone?" \xB7 "+t(e.fone):""} \u2014 Proposta n\xBA ${t(o.numero||"")} gerada em ${t(a.dt(a.hoje()))}</div>
</div></body></html>`}a.propostaHTML=D})();
