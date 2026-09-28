(function(){"use strict";const e=window.PP,s=e.esc;e.vendaSub=a=>(a&&a.itens||[]).reduce((t,o)=>t+e.n(o.qtd)*e.n(o.preco),0),e.vendaDesc=a=>e.cent(e.vendaSub(a)*e.n(a&&a.descontoPct)/100),e.vendaTotal=a=>e.cent(e.vendaSub(a)-e.vendaDesc(a)),e.vendaCusto=a=>(a&&a.itens||[]).reduce((t,o)=>t+e.n(o.qtd)*e.n(o.custo),0),e.vendasBalcaoDoMes=a=>e.where("vendas",t=>t.status==="concluida"&&e.mesKey(t.data)===a),e.produtosBalcao=()=>e.where("produtos",a=>a.ativo&&e.CATEGORIAS_BALCAO.includes(a.categoria));let d=null;function y(){return{operacaoId:e.uid("carrinho"),itens:[],clienteId:"",clienteNome:"",vendedorId:e.vendedorAtual()||(e.where("vendedores",a=>a.ativo)[0]||{}).id||"",descontoPct:0,formaPag:"PIX",parcelas:1,recebido:0,obs:"",busca:""}}function k(){return d||(d=y()),d}function x(a){const t=d.itens.find(o=>o.produtoId===a);return t?e.n(t.qtd):0}function q(a){return a.controlaEstoque?e.disponivel(a.id)-x(a.id):1/0}function P(a,t){const o=e.prod(a);if(!o)return;const n=e.n(t)||1;if(o.controlaEstoque&&q(o)<n&&(e.toast(`${o.nome}: s\xF3 h\xE1 ${e.disponivel(o.id)-x(o.id)} dispon\xEDvel`,"warn"),q(o)<=0))return;const l=d.itens.find(r=>r.produtoId===a);l?l.qtd=e.n(l.qtd)+n:d.itens.push({produtoId:o.id,sku:o.sku,nome:o.nome,unidade:o.unidade,qtd:n,preco:e.n(o.preco),custo:e.n(o.custo)}),g()}e.view("pdv",{titulo:"Venda de balc\xE3o",sub:()=>{const a=e.where("vendas",t=>t.status==="concluida"&&String(t.data).slice(0,10)===e.hoje());return a.length?`${a.length} venda(s) hoje \xB7 ${e.money0(e.soma(a,e.vendaTotal))} no caixa`:"Nenhuma venda hoje ainda \u2014 busque o produto e monte o carrinho"},render(){return k(),`<div class="pdv">
      <div class="pdv-esq">${I()}</div>
      <div class="pdv-dir" id="pdvCarrinho">${$()}</div>
    </div>`},depois(a){C();const t=a.querySelector('[data-inp="pdvBusca"]');t&&(t.focus(),t.setSelectionRange(t.value.length,t.value.length))}});function C(){const a=document.querySelector(".pdv");if(!a)return;if(getComputedStyle(a).getPropertyValue("--pdv-empilhado").trim()==="1"){a.style.removeProperty("--pdv-alt");return}const t=a.getBoundingClientRect().top,o=a.parentElement,n=o?parseFloat(getComputedStyle(o).paddingBottom)||0:18,l=Math.round(window.innerHeight-t-n);a.style.setProperty("--pdv-alt",Math.max(l,360)+"px")}e.ajustarAlturaPdv=C;const V=e.debounce(()=>{e.rotaAtual.nome==="pdv"&&C()},120);window.addEventListener("resize",V),window.addEventListener("orientationchange",V);function I(){const a=e.norm(d.busca);let t=e.produtosBalcao();a&&(t=t.filter(r=>e.norm(r.nome).includes(a)||e.norm(r.sku).includes(a))),t=e.sortBy(t,"nome");const o=e.addDias(e.hoje(),-90),n={};e.where("vendas",r=>r.status==="concluida"&&String(r.data).slice(0,10)>=o).forEach(r=>(r.itens||[]).forEach(c=>{n[c.produtoId]=(n[c.produtoId]||0)+e.n(c.qtd)}));const l=e.sortBy(Object.keys(n).map(r=>({id:r,n:n[r]})),"n","desc").slice(0,6).map(r=>e.prod(r.id)).filter(Boolean);return`
    <div class="pdv-busca">
      <svg class="ic"><use href="#i-busca"/></svg>
      <input class="inp" type="search" id="pdvBuscaCampo" placeholder="Nome ou c\xF3digo do produto \u2014 Enter adiciona o primeiro"
        value="${s(d.busca)}" data-inp="pdvBusca" data-act="nada" autocomplete="off" aria-label="Buscar produto">
      ${d.busca?'<button class="icon-btn" data-act="pdvLimparBusca" aria-label="Limpar busca"><svg class="ic"><use href="#i-x"/></svg></button>':""}
    </div>

    ${!d.busca&&l.length?`
    <div class="pdv-atalhos">
      <div class="pdv-rotulo">Mais vendidos</div>
      <div class="pdv-chips">
        ${l.map(r=>`<button class="pdv-chip" data-act="pdvAdd" data-id="${s(r.id)}">
          <span>${s(e.trunc(r.nome,22))}</span><b>${s(e.money0(r.preco))}</b></button>`).join("")}
      </div>
    </div>`:""}

    <div class="pdv-rotulo">${d.busca?`${t.length} resultado(s)`:"Cat\xE1logo da loja"}</div>
    ${t.length?`<div class="pdv-grade">
      ${t.map(r=>{const c=q(r),p=r.controlaEstoque&&c<=0;return`<button class="pdv-prod ${p?"vazio":""}" data-act="pdvAdd" data-id="${s(r.id)}"
          ${p?"disabled":""} title="${s(r.nome)}">
          <div class="pdv-prod-nm">${s(r.nome)}</div>
          <div class="pdv-prod-sku">${s(r.sku)} \xB7 ${s(r.unidade)}</div>
          <div class="pdv-prod-pe">
            <b>${s(e.money(r.preco))}</b>
            ${r.controlaEstoque?`<span class="badge ${c<=0?"b-dang":c<=e.n(r.estoqueMin)?"b-warn":"b-ok"}">${c<=0?"sem estoque":c+" disp."}</span>`:'<span class="badge b-areia">encomenda</span>'}
          </div>
        </button>`}).join("")}
    </div>`:`<div class="empty-sm">Nenhum produto encontrado para \u201C${s(d.busca)}\u201D.</div>`}`}function $(){const a=e.cfg(),t=e.vendaSub(d),o=e.vendaDesc(d),n=e.vendaTotal(d),l=e.vendaCusto(d),r=n?(n-l)/n*100:0,c=Math.max(e.n(d.parcelas),1),p=c<=1,b=e.n(d.recebido)-n,f=e.n(d.descontoPct)>e.n(a.descontoMaxBalcaoPct),u=e.where("vendedores",i=>i.ativo);return`
  <div class="pdv-topo">
    <h3>Carrinho</h3>
    ${d.itens.length?`<span class="pdv-cont">${e.dec(e.soma(d.itens,"qtd"),0)} item(ns)</span>`:""}
    ${d.itens.length?'<button class="btn btn-sm btn-ghost" data-act="pdvLimpar">Limpar</button>':""}
  </div>

  <div class="pdv-rolagem">
  <div class="pdv-itens">
    ${d.itens.length?d.itens.map((i,v)=>`
      <div class="pdv-item">
        <div class="pdv-item-nm">
          <b>${s(i.nome)}</b>
          <span>${s(e.money(i.preco))} / ${s(i.unidade)}</span>
        </div>
        <div class="pdv-qtd">
          <button class="icon-btn" data-act="pdvQtd" data-i="${v}" data-d="-1" aria-label="Menos um"><svg class="ic ic-sm"><use href="#i-menos"/></svg></button>
          <input class="inp" type="number" min="0" step="1" value="${s(i.qtd)}" data-inp="pdvQtdCampo" data-i="${v}" aria-label="Quantidade de ${s(i.nome)}">
          <button class="icon-btn" data-act="pdvQtd" data-i="${v}" data-d="1" aria-label="Mais um"><svg class="ic ic-sm"><use href="#i-plus"/></svg></button>
        </div>
        <div class="pdv-item-tot">${s(e.money(e.n(i.qtd)*e.n(i.preco)))}</div>
        <button class="icon-btn rm" data-act="pdvRm" data-i="${v}" aria-label="Remover ${s(i.nome)}"><svg class="ic ic-sm"><use href="#i-lixo"/></svg></button>
      </div>`).join(""):`<div class="pdv-vazio">
          <svg class="ic"><use href="#i-caixa"/></svg>
          <p>Carrinho vazio.<br>Busque o produto \xE0 esquerda ou use os atalhos.</p>
        </div>`}
  </div>

  <div class="pdv-meio">
    <div class="pdv-total">
      <div class="tot-line"><span class="muted">Subtotal</span><span class="tnum">${s(e.money(t))}</span></div>
      <div class="tot-line">
        <span class="muted">Desconto
          <input class="inp pdv-desc" type="number" min="0" max="100" step="1" value="${s(d.descontoPct)}"
            data-inp="pdvDesconto" aria-label="Desconto em porcento">%
        </span>
        <span class="tnum" style="color:var(--dang)">\u2212 ${s(e.money(o))}</span>
      </div>
      <div class="tot-line big"><span>Total</span><span class="tnum">${s(e.money(n))}</span></div>
      ${e.podeVerCusto()&&n?`<div class="tot-line tiny"><span class="faint">Margem</span>
        <span class="faint">${e.dec(r,1)}% \xB7 custo ${s(e.money0(l))}</span></div>`:""}
    </div>

    ${f?`<div class="alert a-warn" style="margin:0 0 10px">
      <svg class="ic"><use href="#i-alerta"/></svg>
      <div class="small">Desconto acima de ${e.dec(a.descontoMaxBalcaoPct,0)}% \u2014 fica registrado no seu nome.</div></div>`:""}

    <div class="fgrid" style="gap:10px">
      <div class="f f-6"><label for="pdvVend">Vendedor</label>
        <select class="inp" id="pdvVend" data-chg="pdvCampo" data-k="vendedorId">
          ${u.map(i=>`<option value="${i.id}"${d.vendedorId===i.id?" selected":""}>${s(i.nome)}</option>`).join("")}
        </select></div>
      <div class="f f-6"><label for="pdvCli">Cliente ${e.cfg().balcaoExigeCliente?'<span class="req">*</span>':'<span class="faint">(opcional)</span>'}</label>
        <select class="inp" id="pdvCli" data-chg="pdvCampo" data-k="clienteId">
          <option value="">\u2014 consumidor no balc\xE3o \u2014</option>
          ${e.clientesVisiveis().map(i=>`<option value="${i.id}"${d.clienteId===i.id?" selected":""}>${s(i.nome)}</option>`).join("")}
        </select></div>
      <div class="f f-6"><label for="pdvForma">Forma de pagamento</label>
        <select class="inp" id="pdvForma" data-chg="pdvCampo" data-k="formaPag">
          ${e.FORMAS_PAG.map(i=>`<option value="${s(i)}"${d.formaPag===i?" selected":""}>${s(i)}</option>`).join("")}
        </select></div>
      <div class="f f-6"><label for="pdvParc">Parcelas</label>
        <input class="inp" id="pdvParc" type="number" min="1" max="12" value="${s(c)}" data-inp="pdvCampoNum" data-k="parcelas">
        ${c>1?`<span class="hint">${c}\xD7 de ${s(e.money(e.parcelar(n,c,0)[0]))}</span>`:'<span class="hint">\xC0 vista</span>'}</div>
      ${p&&/Dinheiro/i.test(d.formaPag)?`
      <div class="f f-6"><label for="pdvRec">Recebido (R$)</label>
        <input class="inp inp-money" id="pdvRec" type="text" inputmode="decimal" value="${d.recebido?s(e.dec(d.recebido)):""}"
          data-inp="pdvRecebido" placeholder="0,00"></div>
      <div class="f f-6"><label>Troco</label>
        <div style="padding:9px 0"><b style="font-size:17px;color:${b<0?"var(--dang)":"var(--ok)"}">
          ${d.recebido?s(e.money(Math.max(b,0))):"\u2014"}</b>
          ${d.recebido&&b<0?`<span class="small" style="color:var(--dang)"> falta ${s(e.money(-b))}</span>`:""}</div></div>`:""}
    </div>
  </div>
  </div>

  <div class="pdv-acao">
    <button class="btn btn-ok btn-block pdv-fechar" data-act="pdvFinalizar" ${d.itens.length?"":"disabled"}>
      <svg class="ic"><use href="#i-check"/></svg>
      Finalizar venda \xB7 ${s(e.money(n))}
    </button>
    <div class="tiny faint tc pdv-atalhos-dica">Atalhos: <b>F2</b> finaliza \xB7 <b>Esc</b> limpa a busca</div>
  </div>`}function g(){const a=document.getElementById("pdvCarrinho");a&&(a.innerHTML=$());const t=document.querySelector(".pdv-esq");t&&(t.innerHTML=I());const o=document.querySelector('[data-inp="pdvBusca"]');o&&(o.focus(),o.setSelectionRange(o.value.length,o.value.length))}e.on("nada",()=>{}),e.on("pdvAdd",a=>P(a.id,1)),e.on("pdvRm",a=>{d.itens.splice(e.n(a.i),1),g()}),e.on("pdvLimparBusca",()=>{d.busca="",g()}),e.on("pdvLimpar",async()=>{d.itens.length&&await e.confirmar("Limpar o carrinho e come\xE7ar de novo?",{okTxt:"Limpar"})&&(d=y(),e.render())}),e.on("pdvQtd",a=>{const t=d.itens[e.n(a.i)];if(!t)return;const o=e.n(t.qtd)+e.n(a.d);if(o<=0)d.itens.splice(e.n(a.i),1);else{const n=e.prod(t.produtoId);if(n&&n.controlaEstoque&&o>e.disponivel(n.id)){e.toast(`Estoque dispon\xEDvel: ${e.disponivel(n.id)}`,"warn");return}t.qtd=o}g()}),e.on("pdvQtdCampo",(a,t)=>{const o=d.itens[e.n(a.i)];if(!o)return;const n=e.n(t.value);if(n<=0){d.itens.splice(e.n(a.i),1),g();return}const l=e.prod(o.produtoId);l&&l.controlaEstoque&&n>e.disponivel(l.id)?(e.toast(`Estoque dispon\xEDvel: ${e.disponivel(l.id)}`,"warn"),t.value=e.disponivel(l.id),o.qtd=e.disponivel(l.id)):o.qtd=n;const r=document.getElementById("pdvCarrinho");r&&(r.innerHTML=$())}),e.on("pdvBusca",e.debounce((a,t)=>{d.busca=t.value;const o=document.querySelector(".pdv-esq");o&&(o.innerHTML=I());const n=document.querySelector('[data-inp="pdvBusca"]');n&&(n.focus(),n.setSelectionRange(n.value.length,n.value.length))},180)),e.on("pdvCampo",(a,t)=>{d[a.k]=t.value,h()}),e.on("pdvCampoNum",(a,t)=>{d[a.k]=e.n(t.value),h()}),e.on("pdvDesconto",(a,t)=>{d.descontoPct=Math.min(Math.max(e.n(t.value),0),100),h(!0)}),e.on("pdvRecebido",(a,t)=>{d.recebido=e.parseMoney(t.value),h(!0)});function h(a){const t=document.activeElement,o=t&&t.id,n=t&&t.selectionStart,l=document.getElementById("pdvCarrinho");if(l&&(l.innerHTML=$()),a&&o){const r=document.getElementById(o);if(r){r.focus();try{r.setSelectionRange(n,n)}catch{}}}}document.addEventListener("keydown",a=>{if(e.rotaAtual.nome!=="pdv"||!d)return;const t=a.target&&a.target.dataset&&a.target.dataset.inp==="pdvBusca";if(a.key==="Enter"&&t){a.preventDefault();const o=e.norm(d.busca);if(!o)return;const n=e.produtosBalcao().filter(l=>e.norm(l.nome).includes(o)||e.norm(l.sku).includes(o))[0];if(!n)return e.toast("Nenhum produto com esse termo","warn");P(n.id,1),d.busca="",g();return}if(a.key==="Escape"&&t&&d.busca){a.preventDefault(),d.busca="",g();return}a.key==="F2"&&(a.preventDefault(),d.itens.length&&e.run("pdvFinalizar",{dataset:{}}))}),e.on("pdvFinalizar",async()=>{const a=e.cfg();if(!d||!d.itens.length)return e.toast("Carrinho vazio","warn");if(!d.vendedorId)return e.toast("Escolha o vendedor","err");if(a.balcaoExigeCliente&&!d.clienteId)return e.toast("Esta loja exige cliente na venda","err");const t=d.itens.filter(p=>{const b=e.prod(p.produtoId);return b&&b.controlaEstoque&&e.disponivel(b.id)<e.n(p.qtd)});if(t.length)return e.toast(`Estoque insuficiente: ${t.map(p=>p.nome).join(", ")}`,"err");const o=e.vendaTotal(d),n=Math.max(e.n(d.parcelas),1),l=n<=1;if(l&&/Dinheiro/i.test(d.formaPag)&&e.n(d.recebido)>0&&e.n(d.recebido)<o)return e.toast(`Faltam ${e.money(o-e.n(d.recebido))}`,"err");if(!await e.confirmar(`Fechar a venda de ${e.money(o)}${l?` em ${d.formaPag.toLowerCase()}`:` em ${n}\xD7`}?`,{title:"Finalizar venda",okTxt:"Finalizar",aviso:"O estoque ser\xE1 baixado e o valor entra em contas a receber."+(e.cfg().comissaoBase==="metro"?" A comiss\xE3o est\xE1 por metro de piscina, ent\xE3o a venda de balc\xE3o n\xE3o gera comiss\xE3o.":" A comiss\xE3o do vendedor \xE9 registrada.")}))return;e.toast("Processando venda no servidor\u2026");const c=e.driver.nome==="supabase"?await e.fecharVendaConfirmada("balcao",d,d.operacaoId):e.registrarVendaBalcao(d);d=y(),e.render(),e.toast(`Venda #${c.venda.numero} conclu\xEDda`,"ok"),e.imprimir(w(c.venda),`Cupom #${c.venda.numero}`)}),e.registrarVendaBalcao=a=>{const t=e.cfg(),o=e.vendaTotal(a),n=e.cent(e.vendaCusto(a)),l=Math.max(e.n(a.parcelas),1),r=l<=1,c=e.proximoNumero("proximoNumVenda"),p=e.upsert("vendas",{numero:c,data:e.agora(),clienteId:a.clienteId||"",clienteNome:a.clienteId?e.cliNome(a.clienteId):a.clienteNome||"Consumidor",vendedorId:a.vendedorId,itens:JSON.parse(JSON.stringify(a.itens)),subtotal:e.cent(e.vendaSub(a)),descontoPct:e.n(a.descontoPct),descontoValor:e.vendaDesc(a),total:o,custo:n,formaPag:a.formaPag,parcelas:l,recebido:e.cent(a.recebido),troco:e.cent(Math.max(e.n(a.recebido)-o,0)),status:"concluida",obs:a.obs||""});a.itens.forEach(f=>{const u=e.prod(f.produtoId);!u||!u.controlaEstoque||(u.estoque=e.n(u.estoque)-e.n(f.qtd),e.upsert("estoqueMov",{produtoId:u.id,tipo:"saida",qtd:e.n(f.qtd),data:e.hoje(),motivo:`Venda de balc\xE3o #${c}`,ref:p}))}),e.save("produtos"),r?e.upsert("financeiro",{tipo:"receber",descricao:`Venda de balc\xE3o #${c}`,categoria:"Venda de balc\xE3o",valor:o,vencimento:e.hoje(),status:"pago",pagoEm:e.hoje(),formaPag:a.formaPag,clienteId:a.clienteId||"",origem:{tipo:"venda",id:p},parcela:1,parcelas:1,obs:""}):e.parcelar(o,l,0).forEach((f,u)=>{e.upsert("financeiro",{tipo:"receber",descricao:`Parcela ${u+1}/${l} \u2014 Venda de balc\xE3o #${c}`,categoria:"Venda de balc\xE3o",valor:f,vencimento:e.addMeses(e.hoje(),u),status:u===0?"pago":"aberto",pagoEm:u===0?e.hoje():"",formaPag:a.formaPag,clienteId:a.clienteId||"",origem:{tipo:"venda",id:p},parcela:u+1,parcelas:l,obs:""})});const b=e.calcComissao({itens:a.itens,faturamento:o,custo:n,vendedorId:a.vendedorId,pct:e.n(t.comissaoBalcaoPct)});return b.valor>0&&e.upsert("comissoes",Object.assign({vendedorId:a.vendedorId,vendaId:p,clienteId:a.clienteId||"",competencia:e.mesKey(e.hoje()),status:"liberada",pagoEm:"",origem:"balcao"},b)),{venda:e.find("vendas",p)}};const m={q:"",periodo:"hoje"};e.view("vendas",{titulo:"Vendas da loja",sub:()=>{const a=e.mesKey(e.hoje()),t=e.vendasBalcaoDoMes(a);return`${t.length} venda(s) em ${e.mesNomeLongo(a)} \xB7 ${e.money0(e.soma(t,e.vendaTotal))}`},render(){const a=e.hoje(),t=e.mesKey(a);let o=e.escopo(e.all("vendas"));if(m.periodo==="hoje"?o=o.filter(i=>String(i.data).slice(0,10)===a):m.periodo==="semana"?o=o.filter(i=>String(i.data).slice(0,10)>=e.addDias(a,-7)):m.periodo==="mes"&&(o=o.filter(i=>e.mesKey(i.data)===t)),m.q){const i=e.norm(m.q);o=o.filter(v=>String(v.numero).includes(m.q.trim())||e.norm(v.clienteNome||"").includes(i)||(v.itens||[]).some(E=>e.norm(E.nome).includes(i)))}o=e.sortBy(o,"data","desc");const n=e.paginar("vendas",o),l=e.where("vendas",i=>i.status==="concluida"&&String(i.data).slice(0,10)===a),r=e.vendasBalcaoDoMes(t),c=e.soma(r,e.vendaTotal),p=e.soma(r,e.vendaCusto),b=e.soma(r,i=>e.soma(i.itens||[],"qtd")),f={};r.forEach(i=>(i.itens||[]).forEach(v=>{f[v.nome]=f[v.nome]||{nome:v.nome,qtd:0,total:0},f[v.nome].qtd+=e.n(v.qtd),f[v.nome].total+=e.n(v.qtd)*e.n(v.preco)}));const u=e.sortBy(Object.values(f),"total","desc").slice(0,8);return`
      <div class="kpis kpis-6 mb">
        ${e.kpi({cls:"k-teal destaque",lbl:"Caixa de hoje",val:e.money0(e.soma(l,e.vendaTotal)),foot:`${l.length} venda(s)`})}
        ${e.kpi({lbl:"No m\xEAs",val:e.money0(c),sm:!0,foot:`${r.length} venda(s)`})}
        ${e.kpi({lbl:"Ticket m\xE9dio",val:e.money0(r.length?c/r.length:0),sm:!0})}
        ${e.kpi({cls:"k-ocre",lbl:"Itens vendidos",val:e.dec(b,0),foot:"no m\xEAs"})}
        ${e.podeVerCusto()?e.kpi({cls:"k-ok",lbl:"Margem no m\xEAs",val:e.money0(c-p),sm:!0,foot:e.pct(c?(c-p)/c*100:0,1)}):e.kpi({cls:"k-ok",lbl:"Minhas vendas no m\xEAs",val:String(e.escopo(r).length)})}
        ${e.kpi({cls:"k-warn",lbl:"A receber do balc\xE3o",sm:!0,val:e.money0(e.soma(e.where("financeiro",i=>i.categoria==="Venda de balc\xE3o"&&i.status==="aberto"),"valor")),foot:"vendas parceladas"})}
      </div>

      <div class="grid g-3-2">
        <div class="card">
          <div class="card-hd">
            <div><h3>Hist\xF3rico</h3><div class="sub">${o.length} venda(s) no filtro</div></div>
            <div class="right row">
              <div class="seg">
                <button class="${m.periodo==="hoje"?"on":""}" data-act="filtroVen" data-p="hoje">Hoje</button>
                <button class="${m.periodo==="semana"?"on":""}" data-act="filtroVen" data-p="semana">7 dias</button>
                <button class="${m.periodo==="mes"?"on":""}" data-act="filtroVen" data-p="mes">M\xEAs</button>
                <button class="${m.periodo?"":"on"}" data-act="filtroVen" data-p="">Tudo</button>
              </div>
            </div>
          </div>
          <div class="card-bd" style="padding:12px 16px">
            <div class="mini-search" style="width:100%">
              <svg class="ic"><use href="#i-busca"/></svg>
              <input class="inp" type="search" placeholder="N\xFAmero, cliente ou produto" value="${s(m.q)}"
                data-inp="buscaVen" aria-label="Buscar vendas">
            </div>
          </div>
          ${o.length?e.tabela({act:"abrirVenda",rows:n.linhas,cols:[{h:"N\xBA",w:"96px",r:i=>`<b>#${i.numero}</b><span class="mini">${s(e.dtHora(i.data).slice(-5))} \xB7 ${s(e.dtCurto(i.data))}</span>`},{h:"Cliente",r:i=>`<div class="strong">${s(i.clienteNome||"Consumidor")}</div><span class="mini">${s(e.trunc((i.itens||[]).map(v=>v.nome).join(", "),42))}</span>`},{h:"Itens",cls:"num",r:i=>e.dec(e.soma(i.itens||[],"qtd"),0)},{h:"Vendedor",r:i=>`<span class="small">${s(e.vendNome(i.vendedorId).split(" ")[0])}</span>`},{h:"Pagamento",r:i=>`<span class="small">${s(i.formaPag)}</span>${e.n(i.parcelas)>1?`<span class="mini">${i.parcelas}\xD7</span>`:""}`},{h:"Status",r:i=>e.badge(e.STATUS_VENDA[i.status].nome,e.STATUS_VENDA[i.status].cls)},{h:"Total",cls:"num",r:i=>`<b>${s(e.money(e.vendaTotal(i)))}</b>`}]})+n.html:'<div class="empty-sm">Nenhuma venda nesse filtro.</div>'}
        </div>

        <div class="stack">
          <div class="card">
            <div class="card-hd"><div><h3>Mais vendidos</h3><div class="sub">${s(e.mesNomeLongo(t))}</div></div></div>
            <div class="card-bd">
              ${u.length?u.map(i=>`
                <div class="att-item">
                  <svg class="ic"><use href="#i-produto"/></svg>
                  <div class="txt"><b>${s(e.trunc(i.nome,26))}</b><small>${e.dec(i.qtd,0)} unidade(s)</small></div>
                  <div class="val">${s(e.money0(i.total))}</div>
                </div>`).join(""):'<div class="empty-sm">Nenhuma venda no m\xEAs.</div>'}
            </div>
          </div>
          <div class="card"><div class="card-bd">
            <button class="btn btn-ok btn-block" data-act="nav" data-v="pdv">
              <svg class="ic"><use href="#i-caixa"/></svg>Abrir o caixa</button>
          </div></div>
        </div>
      </div>`}}),e.on("filtroVen",a=>{m.periodo=a.p,e.resetPagina("vendas"),e.render()}),e.on("buscaVen",e.debounce((a,t)=>{m.q=t.value,e.resetPagina("vendas"),e.render()},250)),e.on("abrirVenda",a=>{const t=e.find("vendas",a.id);if(!t)return;const o=e.all("comissoes").find(c=>c.vendaId===t.id),n=e.where("financeiro",c=>c.origem&&c.origem.tipo==="venda"&&c.origem.id===t.id),l=`
    <div class="row mb" style="gap:7px">
      ${e.badge(e.STATUS_VENDA[t.status].nome,e.STATUS_VENDA[t.status].cls)}
      ${e.n(t.parcelas)>1?e.badge(t.parcelas+"\xD7 "+t.formaPag,"b-info"):e.badge(t.formaPag,"b-teal")}
    </div>

    <div class="card mb"><div class="card-bd">
      <dl class="dl">
        <dt>Data</dt><dd>${s(e.dtHora(t.data))}</dd>
        <dt>Cliente</dt><dd><b>${s(t.clienteNome||"Consumidor")}</b></dd>
        <dt>Vendedor</dt><dd>${s(e.vendNome(t.vendedorId))}</dd>
        ${e.podeVerCusto()?`<dt>Custo</dt><dd>${s(e.money(t.custo))} <span class="faint small">(margem ${e.dec(e.n(t.total)?(e.n(t.total)-e.n(t.custo))/e.n(t.total)*100:0,1)}%)</span></dd>`:""}
        ${o?`<dt>Comiss\xE3o</dt><dd>${s(e.money(o.valor))} <span class="faint small">(${s(e.comissaoRegra(o))})</span></dd>`:""}
        ${e.n(t.recebido)?`<dt>Recebido</dt><dd>${s(e.money(t.recebido))} \xB7 troco ${s(e.money(t.troco))}</dd>`:""}
      </dl>
    </div></div>

    <div class="card mb">
      <div class="card-hd"><div><h3>Itens</h3></div></div>
      ${e.tabela({rows:t.itens||[],cols:[{h:"Produto",r:c=>`<span class="small">${s(c.nome)}</span><span class="mini">${s(c.sku||"")}</span>`},{h:"Qtd",cls:"num",r:c=>e.dec(c.qtd,e.n(c.qtd)%1?2:0)},{h:"Unit.",cls:"num",r:c=>s(e.money(c.preco))},{h:"Total",cls:"num",r:c=>`<b>${s(e.money(e.n(c.qtd)*e.n(c.preco)))}</b>`}]})}
      <div class="card-ft" style="justify-content:flex-end">
        <div style="min-width:230px">
          <div class="tot-line"><span class="muted">Subtotal</span><span class="tnum">${s(e.money(t.subtotal))}</span></div>
          ${e.n(t.descontoValor)?`<div class="tot-line"><span class="muted">Desconto ${e.dec(t.descontoPct,0)}%</span><span class="tnum" style="color:var(--dang)">\u2212 ${s(e.money(t.descontoValor))}</span></div>`:""}
          <div class="tot-line big"><span>Total</span><span class="tnum">${s(e.money(t.total))}</span></div>
        </div>
      </div>
    </div>

    ${n.length?`<div class="card">
      <div class="card-hd"><div><h3>Financeiro</h3></div></div>
      ${e.tabela({rows:e.sortBy(n,"vencimento"),cols:[{h:"Descri\xE7\xE3o",r:c=>`<span class="small">${s(c.descricao)}</span>`},{h:"Vencimento",r:c=>`<span class="small">${s(e.dt(c.vencimento))}</span>`},{h:"Situa\xE7\xE3o",r:c=>{const p=e.finSituacao(c);return e.badge(p.nome,p.cls)}},{h:"Valor",cls:"num",r:c=>s(e.money(c.valor))}]})}
    </div>`:""}`,r=[{txt:"Imprimir cupom",cls:"btn-teal",ic:"i-print",act:"imprimirCupom",data:{id:t.id}}];t.clienteId&&r.push({txt:"WhatsApp",ic:"i-wpp",act:"waCliente",data:{id:t.clienteId}}),t.status==="concluida"&&e.ehGestor()&&r.push({txt:"Cancelar venda",cls:"btn-dang",act:"cancelarVenda",data:{id:t.id}}),e.drawer({title:`Venda #${t.numero}`,sub:`${t.clienteNome||"Consumidor"} \xB7 ${e.money(t.total)}`,body:l,actions:r,wide:!0})}),e.on("imprimirCupom",a=>e.imprimir(w(e.find("vendas",a.id)),`Cupom #${e.find("vendas",a.id).numero}`)),e.on("cancelarVenda",async a=>{const t=e.find("vendas",a.id);if(!e.ehGestor())return e.toast("S\xF3 gerente ou administrador cancela venda","err");if(!await e.confirmar(`Cancelar a venda #${t.numero} de ${e.money(t.total)}?`,{perigo:!0,okTxt:"Cancelar venda",aviso:"Os itens voltam para o estoque, as parcelas em aberto s\xE3o canceladas e a comiss\xE3o \xE9 estornada. Baixas j\xE1 feitas permanecem no caixa."}))return;t.status="cancelada",e.save("vendas"),(t.itens||[]).forEach(n=>{const l=e.prod(n.produtoId);!l||!l.controlaEstoque||(l.estoque=e.n(l.estoque)+e.n(n.qtd),e.upsert("estoqueMov",{produtoId:l.id,tipo:"entrada",qtd:e.n(n.qtd),data:e.hoje(),motivo:`Cancelamento da venda #${t.numero}`,ref:t.id}))}),e.save("produtos"),e.where("financeiro",n=>n.origem&&n.origem.tipo==="venda"&&n.origem.id===t.id&&n.status==="aberto").forEach(n=>n.status="cancelado"),e.save("financeiro");const o=e.all("comissoes").find(n=>n.vendaId===t.id);o&&o.status!=="paga"&&(o.status="cancelada",e.save("comissoes")),e.closeAll(),e.toast("Venda cancelada"),e.render()});function w(a){const t=e.cfg();return`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Cupom ${a.numero}</title>
<style>
  @page{ size:80mm auto; margin:4mm; }
  body{ font-family:'Consolas','Courier New',monospace; font-size:11.5px; line-height:1.45;
        color:#111; margin:0 auto; max-width:74mm; }
  .c{ text-align:center; }
  .g{ font-size:15px; font-weight:700; letter-spacing:.04em; }
  .pq{ font-size:10px; color:#444; }
  table{ width:100%; border-collapse:collapse; margin:6px 0; }
  td{ padding:1.5px 0; vertical-align:top; }
  .r{ text-align:right; white-space:nowrap; }
  .sep{ border-top:1px dashed #999; margin:6px 0; }
  .tot{ font-size:15px; font-weight:700; }
  .rod{ margin-top:10px; font-size:9.5px; color:#555; text-align:center; line-height:1.5; }
</style></head><body>
  <div class="c">
    <div class="g">${s(t.empresa)}</div>
    <div class="pq">${t.cnpj?"CNPJ "+s(t.cnpj)+"<br>":""}${s(t.endereco||"")}<br>${s(t.fone||"")}</div>
  </div>
  <div class="sep"></div>
  <div class="c pq">CUPOM N\xC3O FISCAL</div>
  <div class="pq">Venda n\xBA <b>${s(a.numero)}</b><br>
    ${s(e.dtHora(a.data))}<br>
    Cliente: ${s(a.clienteNome||"Consumidor")}<br>
    Vendedor: ${s(e.vendNome(a.vendedorId))}</div>
  <div class="sep"></div>
  <table>
    ${(a.itens||[]).map(n=>`
      <tr><td colspan="2">${s(n.nome)}</td></tr>
      <tr>
        <td class="pq">${e.dec(n.qtd,e.n(n.qtd)%1?2:0)} ${s(n.unidade||"un")} \xD7 ${s(e.money(n.preco))}</td>
        <td class="r">${s(e.money(e.n(n.qtd)*e.n(n.preco)))}</td>
      </tr>`).join("")}
  </table>
  <div class="sep"></div>
  <table>
    <tr><td>Subtotal</td><td class="r">${s(e.money(a.subtotal))}</td></tr>
    ${e.n(a.descontoValor)?`<tr><td>Desconto ${e.dec(a.descontoPct,0)}%</td><td class="r">- ${s(e.money(a.descontoValor))}</td></tr>`:""}
    <tr class="tot"><td>TOTAL</td><td class="r">${s(e.money(a.total))}</td></tr>
    <tr><td>${s(a.formaPag)}${e.n(a.parcelas)>1?` ${a.parcelas}\xD7`:""}</td><td class="r">${s(e.money(a.total))}</td></tr>
    ${e.n(a.recebido)?`<tr><td>Recebido</td><td class="r">${s(e.money(a.recebido))}</td></tr>
    <tr><td>Troco</td><td class="r">${s(e.money(a.troco))}</td></tr>`:""}
  </table>
  <div class="sep"></div>
  <div class="rod">
    ${s("------------------------------------------")}<br>
    Obrigado pela prefer\xEAncia!<br>
    ${t.site?s(t.site)+"<br>":""}
    Trocas em at\xE9 7 dias com este cupom.
  </div>
</body></html>`}e.cupomHTML=w})();
