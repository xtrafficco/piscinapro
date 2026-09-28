(function(){"use strict";const a=window.PP,t=a.esc,w=["#0E7C86","#6FD3D8","#B9812F","#2A5D9E","#1E7A4B","#A8322C","#8C9BA1","#D9C7AE","#12A0A8","#A8640A"],k={meses:6};a.view("relatorios",{titulo:"Relat\xF3rios",sub:()=>`An\xE1lise dos \xFAltimos ${k.meses} meses`,render(){const i=a.ultimosMeses(k.meses),n=i[0]+"-01",e=a.where("pedidos",s=>s.status!=="cancelado"&&s.data>=n),r=a.soma(e,a.pedidoTotal),l=a.soma(e,a.pedidoCusto),c=a.where("leads",s=>String(s.criadoEm).slice(0,10)>=n),v=a.where("vendedores",s=>s.ativo).map(s=>{const o=e.filter(m=>m.vendedorId===s.id);return{id:s.id,v:s,qtd:o.length,total:a.soma(o,a.pedidoTotal),ticket:o.length?a.soma(o,a.pedidoTotal)/o.length:0}}).filter(s=>s.qtd>0),b={};e.forEach(s=>{const o=a.orcDoPedido(s);o&&o.itens.forEach(m=>{const g=a.prod(m.produtoId);!g||g.categoria!=="Piscina"||(b[g.nome]=b[g.nome]||{nome:g.nome,qtd:0,total:0},b[g.nome].qtd+=a.n(m.qtd),b[g.nome].total+=a.n(m.qtd)*a.n(m.preco))})});const f=a.sortBy(Object.values(b),"total","desc"),h={};c.forEach(s=>{const o=s.origem||"Outro";h[o]=h[o]||{origem:o,qtd:0,ganhos:0,valor:0},h[o].qtd++,s.etapa==="ganho"&&(h[o].ganhos++,h[o].valor+=a.n(s.valorEstimado))});const d=a.sortBy(Object.values(h),"qtd","desc"),u=a.ETAPAS.filter(s=>s.id!=="perdido").map(s=>({nome:s.nome,cor:s.cor,qtd:a.where("leads",o=>o.etapa===s.id).length,valor:a.soma(a.where("leads",o=>o.etapa===s.id),"valorEstimado")})),p={};a.where("leads",s=>s.etapa==="perdido").forEach(s=>{const o=s.motivoPerda||"N\xE3o informado";p[o]=p[o]||{label:o,valor:0,qtd:0},p[o].valor+=a.n(s.valorEstimado),p[o].qtd++});const y=a.sortBy(Object.values(p),"valor","desc").map((s,o)=>Object.assign(s,{cor:w[o%w.length]})),$={};e.forEach(s=>{const o=a.orcDoPedido(s);o&&o.itens.forEach(m=>{$[m.nome]=$[m.nome]||{nome:m.nome,qtd:0,total:0,custo:0},$[m.nome].qtd+=a.n(m.qtd),$[m.nome].total+=a.n(m.qtd)*a.n(m.preco),$[m.nome].custo+=a.n(m.qtd)*a.n(m.custo)})});const C=a.sortBy(Object.values($),"total","desc").slice(0,12),x=c.filter(s=>s.etapa==="ganho").length,E=c.filter(s=>s.etapa==="perdido").length;return`
      <div class="toolbar">
        <div class="seg">
          ${[3,6,12].map(s=>`<button class="${k.meses===s?"on":""}" data-act="relPeriodo" data-n="${s}">${s} meses</button>`).join("")}
        </div>
        <div class="row-end row">
          <button class="btn" data-act="relatorioPDF"><svg class="ic"><use href="#i-print"/></svg>Relat\xF3rio em PDF</button>
        </div>
      </div>

      <div class="kpis mb">
        ${a.kpi({cls:"k-teal",lbl:"Faturamento",val:a.money0(r),sm:!0,foot:`${e.length} pedido(s)`})}
        ${a.kpi({cls:"k-ok",lbl:"Margem bruta",val:a.money0(r-l),sm:!0,foot:a.pct(r?(r-l)/r*100:0,1)})}
        ${a.kpi({lbl:"Ticket m\xE9dio",val:a.money0(e.length?r/e.length:0),sm:!0})}
        ${a.kpi({cls:"k-ocre",lbl:"Leads gerados",val:String(c.length)})}
        ${a.kpi({lbl:"Convers\xE3o",val:a.pct(x+E?x/(x+E)*100:0,0),foot:`${x} ganhos \xB7 ${E} perdidos`})}
        ${a.kpi({cls:"k-warn",lbl:"Custo por lead ganho",val:a.money0(x?r*.04/x:0),sm:!0,foot:"estimativa (4% em marketing)"})}
      </div>

      <div class="card mb">
        <div class="card-hd"><div><h3>Faturamento e margem por m\xEAs</h3></div>
          <div class="right legend"><span><i style="background:#0E7C86"></i>Faturamento</span><span><i style="background:#6FD3D8"></i>Margem bruta</span></div>
        </div>
        <div class="card-bd">
          ${a.chart.barras({labels:i.map(a.mesNome),height:240,series:[{nome:"Faturamento",cor:"#0E7C86",values:i.map(s=>a.vendasDoMes(s))},{nome:"Margem bruta",cor:"#6FD3D8",values:i.map(s=>{const o=a.pedidosDoMes(s);return a.soma(o,a.pedidoTotal)-a.soma(o,a.pedidoCusto)})}]})}
        </div>
      </div>

      <div class="grid g-2 mb">
        <div class="card">
          <div class="card-hd"><div><h3>Desempenho por vendedor</h3></div></div>
          ${v.length?a.tabela({rows:a.sortBy(v,"total","desc"),cols:[{h:"Vendedor",r:s=>`<div class="row" style="gap:8px;flex-wrap:nowrap"><span class="av-mini">${t(a.iniciais(s.v.nome))}</span><span class="strong">${t(s.v.nome)}</span></div>`},{h:"Pedidos",cls:"num",r:s=>String(s.qtd)},{h:"Ticket m\xE9dio",cls:"num",r:s=>t(a.money0(s.ticket))},{h:"Faturamento",cls:"num",r:s=>`<b>${t(a.money0(s.total))}</b>`},{h:"Share",cls:"num",r:s=>a.badge(a.dec(r?s.total/r*100:0,0)+"%","b-teal")}]}):'<div class="empty-sm">Sem vendas no per\xEDodo.</div>'}
        </div>

        <div class="card">
          <div class="card-hd"><div><h3>Funil de convers\xE3o</h3><div class="sub">Situa\xE7\xE3o atual da base</div></div></div>
          <div class="card-bd">
            ${a.chart.funil({items:u})}
            <div class="sep"></div>
            <div class="stage-list">
              ${(()=>{const s=u[0]?u[0].qtd:0,o=a.all("leads").length,m=a.where("leads",g=>g.etapa==="ganho").length;return`<div class="stage-line"><span class="nm">Base total</span><span></span><span class="vv">${o} leads</span></div>
                        <div class="stage-line"><span class="nm">Ganhos</span><span></span><span class="vv">${m} (${a.dec(o?m/o*100:0,1)}%)</span></div>`})()}
            </div>
          </div>
        </div>
      </div>

      <div class="grid g-2 mb">
        <div class="card">
          <div class="card-hd"><div><h3>Origem dos leads</h3><div class="sub">Volume x convers\xE3o no per\xEDodo</div></div></div>
          ${d.length?a.tabela({rows:d,cols:[{h:"Origem",r:s=>`<span class="strong">${t(s.origem)}</span>`},{h:"Leads",cls:"num",r:s=>String(s.qtd)},{h:"Ganhos",cls:"num",r:s=>String(s.ganhos)},{h:"Convers\xE3o",cls:"num",r:s=>{const o=s.qtd?s.ganhos/s.qtd*100:0;return a.badge(a.dec(o,0)+"%",o>=40?"b-ok":o>=20?"b-warn":"b-dang")}},{h:"Valor ganho",cls:"num",r:s=>t(a.money0(s.valor))}]}):'<div class="empty-sm">Sem leads no per\xEDodo.</div>'}
        </div>

        <div class="card">
          <div class="card-hd"><div><h3>Por que perdemos</h3><div class="sub">Valor em leads perdidos, por motivo</div></div></div>
          <div class="card-bd">${y.length?a.chart.rosca({items:y,centroLbl:"Perdido"}):'<div class="empty-sm">Nenhum lead perdido registrado.</div>'}</div>
        </div>
      </div>

      <div class="grid g-2">
        <div class="card">
          <div class="card-hd"><div><h3>Modelos mais vendidos</h3></div></div>
          ${f.length?a.tabela({rows:f,cols:[{h:"Modelo",r:s=>`<span class="strong">${t(s.nome)}</span>`},{h:"Unidades",cls:"num",r:s=>String(s.qtd)},{h:"Faturamento",cls:"num",r:s=>`<b>${t(a.money0(s.total))}</b>`}]}):'<div class="empty-sm">Sem vendas no per\xEDodo.</div>'}
        </div>

        <div class="card">
          <div class="card-hd"><div><h3>Itens mais faturados</h3><div class="sub">Inclui adicionais e servi\xE7os</div></div></div>
          ${C.length?a.tabela({rows:C,cols:[{h:"Item",r:s=>`<span class="small">${t(s.nome)}</span>`},{h:"Qtd",cls:"num",r:s=>a.dec(s.qtd,s.qtd%1?1:0)},{h:"Margem",cls:"num",r:s=>{const o=s.total?(s.total-s.custo)/s.total*100:0;return`<span class="small">${a.dec(o,0)}%</span>`}},{h:"Total",cls:"num",r:s=>`<b>${t(a.money0(s.total))}</b>`}]}):'<div class="empty-sm">Sem dados.</div>'}
        </div>
      </div>`}}),a.on("relPeriodo",i=>{k.meses=a.n(i.n),a.render()}),a.on("relatorioPDF",()=>{const i=a.cfg(),n=a.ultimosMeses(k.meses),e=n[0]+"-01",r=a.where("pedidos",d=>d.status!=="cancelado"&&d.data>=e),l=a.soma(r,a.pedidoTotal),c=a.soma(r,a.pedidoCusto),v=a.metasDoMes(a.mesKey(a.hoje())),b=n.map(d=>{const u=a.pedidosDoMes(d),p=a.soma(u,a.pedidoTotal),y=a.soma(u,a.pedidoCusto);return`<tr><td>${t(a.mesNomeLongo(d))}</td><td class="r">${u.length}</td><td class="r">${t(a.money(p))}</td>
      <td class="r">${t(a.money(p-y))}</td><td class="r">${a.dec(p?(p-y)/p*100:0,1)}%</td></tr>`}).join(""),f=a.sortBy(v,"realizado","desc").map(d=>`<tr><td>${t(d.v.nome)}</td><td class="r">${d.qtd}</td><td class="r">${t(a.money(d.meta))}</td>
     <td class="r">${t(a.money(d.realizado))}</td><td class="r">${a.dec(d.pc,0)}%</td></tr>`).join(""),h=`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Relat\xF3rio gerencial</title>
  <style>
    @page{ size:A4; margin:15mm 13mm; }
    body{ font-family:'Segoe UI',Arial,sans-serif; color:#12262D; font-size:12px; margin:0; }
    h1{ font-size:20px; color:#0B1F26; margin:0 0 3px; }
    .sub{ color:#55666D; font-size:11px; margin-bottom:18px; }
    h2{ font-size:11px; text-transform:uppercase; letter-spacing:.1em; color:#0E7C86;
        border-bottom:1px solid #E2DCD0; padding-bottom:4px; margin:20px 0 8px; }
    table{ width:100%; border-collapse:collapse; }
    th{ background:#0B1F26; color:#fff; font-size:9.5px; text-transform:uppercase; letter-spacing:.06em; padding:7px 9px; text-align:left; }
    td{ padding:7px 9px; border-bottom:1px solid #E2DCD0; }
    tr:nth-child(even) td{ background:#FBF9F5; }
    .r{ text-align:right; }
    .kpis{ display:flex; gap:9px; margin-bottom:6px; }
    .k{ flex:1; border:1px solid #E2DCD0; border-radius:8px; padding:10px; background:#FBF9F5; }
    .k small{ display:block; font-size:9px; text-transform:uppercase; letter-spacing:.07em; color:#6E7F86; }
    .k b{ font-size:16px; color:#0B1F26; }
    .ft{ margin-top:24px; padding-top:9px; border-top:1px solid #E2DCD0; font-size:9.5px; color:#6E7F86; text-align:center; }
  </style></head><body>
    <h1>Relat\xF3rio gerencial</h1>
    <div class="sub">${t(i.empresa)} \xB7 \xFAltimos ${k.meses} meses \xB7 gerado em ${t(a.dt(a.hoje()))}</div>

    <div class="kpis">
      <div class="k"><small>Faturamento</small><b>${t(a.money(l))}</b></div>
      <div class="k"><small>Margem bruta</small><b>${t(a.money(l-c))}</b></div>
      <div class="k"><small>Pedidos</small><b>${r.length}</b></div>
      <div class="k"><small>Ticket m\xE9dio</small><b>${t(a.money(r.length?l/r.length:0))}</b></div>
    </div>

    <h2>Faturamento por m\xEAs</h2>
    <table><thead><tr><th>M\xEAs</th><th class="r">Pedidos</th><th class="r">Faturamento</th><th class="r">Margem</th><th class="r">%</th></tr></thead>
    <tbody>${b}</tbody></table>

    <h2>Desempenho da equipe \u2014 ${t(a.mesNomeLongo(a.mesKey(a.hoje())))}</h2>
    <table><thead><tr><th>Vendedor</th><th class="r">Pedidos</th><th class="r">Meta</th><th class="r">Realizado</th><th class="r">% meta</th></tr></thead>
    <tbody>${f}</tbody></table>

    <h2>Situa\xE7\xE3o do funil</h2>
    <table><thead><tr><th>Etapa</th><th class="r">Leads</th><th class="r">Valor potencial</th></tr></thead><tbody>
      ${a.ETAPAS.map(d=>{const u=a.where("leads",p=>p.etapa===d.id);return`<tr><td>${t(d.nome)}</td><td class="r">${u.length}</td><td class="r">${t(a.money(a.soma(u,"valorEstimado")))}</td></tr>`}).join("")}
    </tbody></table>

    <h2>Posi\xE7\xE3o financeira</h2>
    <table><thead><tr><th>Indicador</th><th class="r">Valor</th></tr></thead><tbody>
      <tr><td>A receber em aberto</td><td class="r">${t(a.money(a.soma(a.where("financeiro",d=>d.tipo==="receber"&&d.status==="aberto"),"valor")))}</td></tr>
      <tr><td>A receber vencido</td><td class="r">${t(a.money(a.soma(a.where("financeiro",d=>d.tipo==="receber"&&d.status==="aberto"&&d.vencimento<a.hoje()),"valor")))}</td></tr>
      <tr><td>A pagar em aberto</td><td class="r">${t(a.money(a.soma(a.where("financeiro",d=>d.tipo==="pagar"&&d.status==="aberto"),"valor")))}</td></tr>
      <tr><td>Obras em andamento</td><td class="r">${a.where("obras",d=>d.status!=="concluida"&&d.status!=="cancelada").length}</td></tr>
      <tr><td>Valor em estoque (custo)</td><td class="r">${t(a.money(a.soma(a.where("produtos",d=>d.controlaEstoque),d=>a.n(d.estoque)*a.n(d.custo))))}</td></tr>
    </tbody></table>

    <div class="ft">${t(i.empresa)} \u2014 relat\xF3rio gerado pelo PiscinaPro em ${t(a.dt(a.hoje()))}</div>
  </body></html>`;a.imprimir(h,"Relat\xF3rio gerencial")}),a.view("config",{titulo:"Configura\xE7\xF5es",sub:"Dados da empresa, par\xE2metros comerciais e backup",render(){const i=a.cfg(),n=a.COLS.reduce((e,r)=>e+(r==="config"?0:a.all(r).length),0);return`
      <div class="grid g-2 mb">
        <div class="card">
          <div class="card-hd"><div><h3>Dados da empresa</h3><div class="sub">Aparecem nas propostas e relat\xF3rios</div></div></div>
          <div class="card-bd">
            <form id="formEmp">${a.form([{k:"empresa",l:"Nome da empresa",t:"text",col:12,req:!0},{k:"cnpj",l:"CNPJ",t:"text",col:6,val:"doc"},{k:"fone",l:"Telefone",t:"tel",col:6},{k:"email",l:"E-mail",t:"email",col:6},{k:"site",l:"Site",t:"text",col:6},{k:"endereco",l:"Endere\xE7o",t:"text",col:12}],i)}</form>
          </div>
          <div class="card-ft"><button class="btn btn-primary" data-act="salvarCfgEmp"><svg class="ic"><use href="#i-check"/></svg>Salvar dados</button></div>
        </div>

        <div class="card">
          <div class="card-hd"><div><h3>Par\xE2metros comerciais</h3><div class="sub">Valem como padr\xE3o em novos or\xE7amentos</div></div></div>
          <div class="card-bd">
            <form id="formPar">${a.form([{k:"metaPadrao",l:"Meta mensal padr\xE3o (R$)",t:"money",col:6},{k:"comissaoPct",l:"Comiss\xE3o padr\xE3o (%)",t:"pct",col:6,step:.1,val:"percentual"},{k:"comissaoBase",l:"Comiss\xE3o calculada sobre",t:"select",col:6,vazio:!1,opts:[{v:"faturamento",l:"Faturamento \u2014 % do valor total da venda"},{v:"margem",l:"Margem bruta \u2014 % de (venda \u2212 custo)"},{v:"metro",l:"Metro de piscina \u2014 R$ fixos por metro vendido"}],hint:"Sobre a margem, quem d\xE1 desconto ganha menos. Vale s\xF3 para vendas novas."},{k:"comissaoPorMetro",l:"Comiss\xE3o por metro de piscina (R$)",t:"money",col:6,val:"naoNegativo",hint:"Vale quando a base \xE9 \u201Cmetro de piscina\u201D: conta s\xF3 o comprimento do modelo, vezes a quantidade. Adicionais, equipamentos, insumos, servi\xE7os e vendas de balc\xE3o ficam de fora."},{k:"jurosMes",l:"Juros do financiamento (% a.m.)",t:"pct",col:6,step:.01},{k:"parcelasMax",l:"Parcelas m\xE1ximas",t:"number",col:6,step:1,min:1},{k:"validadeProposta",l:"Validade da proposta (dias)",t:"number",col:6,step:1},{k:"descontoMaxPct",l:"Desconto m\xE1ximo sem al\xE7ada (%)",t:"pct",col:6,step:.5,val:"percentual"},{k:"exigirAprovacaoDesconto",l:"Travar proposta acima da al\xE7ada at\xE9 o gerente liberar",t:"checkbox",col:12},{k:"prazoInstalacaoDias",l:"Prazo de instala\xE7\xE3o (dias \xFAteis)",t:"number",col:4,step:1},{k:"garantiaCasco",l:"Garantia do casco (anos)",t:"number",col:4,step:1},{k:"garantiaEquip",l:"Garantia de equipamentos (anos)",t:"number",col:4,step:1},{sep:"Venda de balc\xE3o"},{k:"comissaoBalcaoPct",l:"Comiss\xE3o do balc\xE3o (%)",t:"pct",col:4,step:.1,val:"percentual",hint:i.comissaoBase==="metro"?"Sem efeito agora: a comiss\xE3o est\xE1 por metro de piscina, e o balc\xE3o n\xE3o vende piscina.":"Costuma ser menor que a de piscina"},{k:"descontoMaxBalcaoPct",l:"Desconto m\xE1ximo no balc\xE3o (%)",t:"pct",col:4,step:1,val:"percentual"},{k:"balcaoExigeCliente",l:"Exigir cliente na venda de balc\xE3o",t:"checkbox",col:4},{k:"ddi",l:"DDI para o WhatsApp",t:"text",col:6,ph:"55",hint:"55 = Brasil"},{k:"avisoBackupDias",l:"Avisar sobre backup a cada (dias)",t:"number",col:6,step:1,min:1}],i)}</form>
          </div>
          <div class="card-ft"><button class="btn btn-primary" data-act="salvarCfgPar"><svg class="ic"><use href="#i-check"/></svg>Salvar par\xE2metros</button></div>
        </div>
      </div>

      <div class="grid g-2 mb">
        <div class="card">
          <div class="card-hd"><div><h3>Backup &amp; restaura\xE7\xE3o</h3><div class="sub">Uma c\xF3pia sua, fora do servidor</div></div></div>
          <div class="card-bd">
            ${(()=>{const e=i.ultimoBackup?a.diasEntre(i.ultimoBackup,a.hoje()):null,r=e===null||e>=a.n(i.avisoBackupDias);return`<div class="alert ${r?"a-dang":"a-ok"} mb">
                <svg class="ic"><use href="#${r?"i-alerta":"i-check"}"/></svg>
                <div>${e===null?"<b>Voc\xEA nunca baixou um backup.</b> O servidor guarda tudo, mas uma c\xF3pia pr\xF3pria protege de engano na opera\xE7\xE3o.":r?`<b>\xDAltimo backup h\xE1 ${e} dias</b> (${t(a.dt(i.ultimoBackup))}). J\xE1 passou do intervalo de ${a.n(i.avisoBackupDias)} dias.`:`<b>Backup em dia.</b> \xDAltimo em ${t(a.dt(i.ultimoBackup))}${e?` (h\xE1 ${e} dias)`:" (hoje)"}.`}</div>
              </div>`})()}
            <div class="alert a-info mb">
              <svg class="ic"><use href="#i-nuvem"/></svg>
              <div><b>Os dados ficam no servidor</b>, n\xE3o neste navegador \u2014 trocar de computador ou limpar o navegador n\xE3o perde nada. O backup aqui \xE9 a sua c\xF3pia pr\xF3pria, para guardar fora do Supabase.</div>
            </div>
            <div class="row">
              <button class="btn btn-primary" data-act="exportarBackup"><svg class="ic"><use href="#i-down"/></svg>Baixar backup (.json)</button>
              <label class="btn" style="cursor:pointer">
                <svg class="ic"><use href="#i-copia"/></svg>Restaurar backup
                <input type="file" accept="application/json,.json" style="display:none" data-chg="importarBackup">
              </label>
            </div>
            <div class="sep"></div>
            <dl class="dl">
              ${a.COLS.map(e=>`<dt>${t(e)}</dt><dd>${Array.isArray(a.all(e))?a.all(e).length+" registro(s)":"1 objeto"}</dd>`).join("")}
              <dt>Total</dt><dd><b>${n} registro(s)</b> no servidor</dd>
            </dl>
          </div>
        </div>

        <div class="card">
          <div class="card-hd"><div><h3>Numera\xE7\xE3o de documentos</h3><div class="sub">Controlada pelo servidor</div></div></div>
          <div class="card-bd">
            <div class="alert a-info mb"><svg class="ic"><use href="#i-nuvem"/></svg>
              <div class="small">Quem entrega o n\xFAmero \xE9 o banco, um de cada vez. Dois caixas vendendo ao mesmo tempo <b>n\xE3o recebem o mesmo n\xFAmero</b> \u2014 por isso n\xE3o d\xE1 para escolher aqui.</div></div>
            <dl class="dl">
              ${[["orcamentos","\xDAltimo or\xE7amento"],["pedidos","\xDAltimo pedido"],["vendas","\xDAltima venda de balc\xE3o"],["compras","\xDAltima compra"],["contratos","\xDAltimo contrato"],["chamados","\xDAltimo chamado"]].map(([e,r])=>{const l=a.all(e).reduce((c,v)=>Math.max(c,a.n(v.numero)),0);return`<dt>${t(r)}</dt><dd>${l?"#"+l:"\u2014"}</dd>`}).join("")}
            </dl>
            <div class="sep"></div>
            <h4 style="font-size:13px;margin-bottom:8px">Zona de risco</h4>
            <p class="small muted" style="margin:0 0 12px">Apaga <b>os dados do servidor</b> e recoloca os de demonstra\xE7\xE3o. Afeta a equipe inteira, n\xE3o s\xF3 este computador.</p>
            <button class="btn btn-dang" data-act="resetTudo"><svg class="ic"><use href="#i-lixo"/></svg>Restaurar dados de exemplo</button>
          </div>
        </div>
      </div>

      ${a.ehAdmin()?q():""}

      <div class="card mb">
        <div class="card-hd"><div><h3>Mensagens de WhatsApp</h3>
          <div class="sub">Modelos usados nos bot\xF5es de envio. Use {cliente}, {vendedor}, {empresa}, {numero}, {modelo}, {total}, {entrada}, {parcelas}, {validade}, {data}, {valor}, {vencimento}</div></div></div>
        <div class="card-bd">
          <form id="formMsg">${a.form([{k:"msgPrimeiroContato",l:"Primeiro contato",t:"textarea",col:6,rows:3},{k:"msgProposta",l:"Envio da proposta",t:"textarea",col:6,rows:3},{k:"msgFollowUp",l:"Follow-up de proposta",t:"textarea",col:6,rows:3},{k:"msgAgendamento",l:"Confirma\xE7\xE3o de instala\xE7\xE3o",t:"textarea",col:6,rows:3},{k:"msgCobranca",l:"Cobran\xE7a de parcela",t:"textarea",col:12,rows:2}],i)}</form>
          <div class="alert a-info mt"><svg class="ic"><use href="#i-alerta"/></svg>
            <div class="small">O sistema nunca envia sozinho: ele abre o WhatsApp com o texto pronto e quem aperta enviar \xE9 sempre a pessoa.</div></div>
        </div>
        <div class="card-ft"><button class="btn btn-primary" data-act="salvarCfgMsg"><svg class="ic"><use href="#i-check"/></svg>Salvar mensagens</button></div>
      </div>

      <div class="card">
        <div class="card-hd"><div><h3>Etapas do funil</h3><div class="sub">Probabilidade usada para ponderar o pipeline</div></div></div>
        ${a.tabela({rows:a.ETAPAS.map(e=>Object.assign({},e,{leads:a.where("leads",r=>r.etapa===e.id).length})),cols:[{h:"Etapa",r:e=>`<span class="badge" style="background:${e.cor}1f;color:${e.cor}"><span class="dt"></span>${t(e.nome)}</span>`},{h:"Probabilidade",cls:"num",r:e=>a.dec(e.prob,0)+"%"},{h:"Leads agora",cls:"num",r:e=>String(e.leads)},{h:"Valor",cls:"num",r:e=>t(a.money0(a.soma(a.where("leads",r=>r.etapa===e.id),"valorEstimado")))},{h:"Ponderado",cls:"num",r:e=>`<b>${t(a.money0(a.soma(a.where("leads",r=>r.etapa===e.id),"valorEstimado")*e.prob/100))}</b>`}]})}
      </div>`}});function q(){const i=a.nuvem||{},n=a.gravacao||{},e=i.sessao&&i.sessao.user?i.sessao.user.email:"",l=a.all("usuarios").filter(v=>v.ativo&&!v.vinculada),c=n.estado==="erro"?{cls:"a-dang",ic:"i-alerta",txt:`<b>Falha ao gravar.</b> ${t(n.erro)} \u2014 o sistema segue tentando. N\xE3o feche a aba.`}:n.estado==="gravando"?{cls:"a-info",ic:"i-nuvem",txt:"<b>Gravando\u2026</b> altera\xE7\xF5es a caminho do servidor."}:{cls:"a-ok",ic:"i-check",txt:"<b>Tudo gravado.</b> Nada pendente neste aparelho."};return`
    <div class="card mb">
      <div class="card-hd">
        <div><h3>Servidor &amp; acessos</h3>
          <div class="sub">Onde os dados moram e quem entra neles</div></div>
        <div class="right">${a.badge(i.ligada?"Conectado":"Sem sess\xE3o",i.ligada?"b-ok":"b-warn")}</div>
      </div>
      <div class="card-bd">
        <div class="alert ${c.cls} mb"><svg class="ic"><use href="#${c.ic}"/></svg><div>${c.txt}</div></div>

        <dl class="dl">
          <dt>Banco</dt><dd>Supabase \xB7 Postgres <span class="faint small">(S\xE3o Paulo)</span></dd>
          <dt>Sua conta</dt><dd>${t(e||"\u2014")}</dd>
          <dt>Neste navegador</dt><dd>nada \xE9 gravado \u2014 a c\xF3pia local existe s\xF3 enquanto a aba est\xE1 aberta</dd>
        </dl>

        <div class="sep"></div>
        <h4 style="font-size:13px;margin-bottom:8px">Como dar acesso a algu\xE9m</h4>
        <ol class="small muted" style="margin:0 0 12px;padding-left:18px;line-height:1.7">
          <li>Cadastre a pessoa em <b>Equipe de vendas \u2192 Usu\xE1rios</b>, com o <b>e-mail dela</b>.</li>
          <li>Pe\xE7a para ela abrir o sistema e clicar em <b>\u201CPrimeiro acesso \u2014 criar minha conta\u201D</b> usando esse mesmo e-mail.</li>
          <li>Pronto: o banco liga a conta ao cadastro e passa a entregar s\xF3 o que o papel dela permite.</li>
        </ol>
        ${l.length?`<div class="alert a-warn"><svg class="ic"><use href="#i-alerta"/></svg>
          <div class="small"><b>${l.length} usu\xE1rio(s) ainda sem conta pr\xF3pria.</b> Enquanto n\xE3o criarem, n\xE3o conseguem entrar.</div></div>`:""}
      </div>
      <div class="card-ft row">
        <button class="btn" data-act="recarregarDoServidor"><svg class="ic"><use href="#i-nuvem"/></svg>Recarregar do servidor</button>
        <button class="btn btn-dang" data-act="sair"><svg class="ic"><use href="#i-sair"/></svg>Sair desta conta</button>
      </div>
    </div>`}a.on("recarregarDoServidor",async()=>{await a.recarregarTudo(),a.toast("Dados recarregados do servidor","ok"),a.render()});function P(i,n){const e=document.getElementById(i),{ok:r,data:l}=a.lerForm(e);r&&(Object.assign(a.cfg(),l),a.save("config"),a.toast(n,"ok"),document.getElementById("brandEmpresa").textContent=a.cfg().empresa,a.render())}a.on("salvarCfgEmp",()=>P("formEmp","Dados da empresa salvos")),a.on("salvarCfgPar",()=>P("formPar","Par\xE2metros salvos")),a.on("salvarCfgMsg",()=>P("formMsg","Mensagens salvas")),a.on("exportarBackup",()=>{const i={_app:"PiscinaPro",_versao:a.VERSAO_BACKUP,_data:a.agora(),_por:(a.usuario()||{}).nome||""};a.COLS.forEach(n=>i[n]=a.db.data[n]),a.baixar(`piscinapro-backup-${a.hoje()}.json`,JSON.stringify(i,null,2)),a.cfg().ultimoBackup=a.hoje(),a.save("config"),a.toast("Backup baixado \u2014 guarde o arquivo fora deste computador","ok"),a.atualizarSinoAlertas(),a.rotaAtual.nome==="config"&&a.render()}),a.on("importarBackup",(i,n)=>{const e=n.files&&n.files[0];if(!e)return;const r=new FileReader;r.onload=async()=>{let l;try{l=JSON.parse(r.result)}catch{return a.toast("Arquivo inv\xE1lido (n\xE3o \xE9 JSON)","err")}if(l._app!=="PiscinaPro")return a.toast("Esse arquivo n\xE3o \xE9 um backup do PiscinaPro","err");const c=a.n(l._versao)||1,v=a.VERSAO_BACKUP;if(c>v)return n.value="",a.toast(`Esse backup \xE9 de uma vers\xE3o mais nova do sistema (v${c}). Atualize o PiscinaPro antes de restaurar.`,"err");if(!await a.confirmar(`Restaurar o backup de ${a.dtHora(l._data)}${l._por?" feito por "+l._por:""}?`,{perigo:!0,okTxt:"Restaurar",aviso:c<v?`Backup no formato v${c}; o sistema hoje usa v${v}. Os dados ser\xE3o convertidos na importa\xE7\xE3o. Todos os dados atuais ser\xE3o substitu\xEDdos.`:"Todos os dados atuais ser\xE3o substitu\xEDdos. Isso n\xE3o pode ser desfeito."})){n.value="";return}n.value="";try{a.validarBackup(l,c<v),a.migrarBackup(l,c),a.validarBackup(l),await a.db.confirmar(),a.toast("Gravando no servidor\u2026"),await a.driver.substituirTudo(l),await a.recarregarTudo()}catch(f){return a.toast("Falha ao restaurar: "+f.message,"err")}a.toast(c<v?`Backup v${c} restaurado e convertido`:"Backup restaurado","ok"),a.render(),document.getElementById("brandEmpresa").textContent=a.cfg().empresa},r.readAsText(e)}),a.on("resetTudo",async()=>{if(!await a.confirmar("Apagar TODOS os dados do servidor e recarregar a demonstra\xE7\xE3o?",{perigo:!0,okTxt:"Apagar e recarregar",aviso:"Isto apaga os dados da EQUIPE INTEIRA, n\xE3o s\xF3 deste computador: leads, or\xE7amentos, pedidos, obras e financeiro. Baixe um backup antes se precisar deles."}))return;const n={config:Object.assign({},a.CONFIG_PADRAO)};a.COLS.forEach(e=>{e!=="config"&&(n[e]=a.seed[e]?a.seed[e]():[])});try{await a.db.confirmar(),a.toast("Gravando no servidor\u2026"),await a.driver.substituirTudo(n),await a.recarregarTudo()}catch(e){return a.toast("Falha ao restaurar: "+e.message,"err")}a.toast("Dados de exemplo recarregados no servidor","ok"),a.ir("dashboard"),a.render(),document.getElementById("brandEmpresa").textContent=a.cfg().empresa})})();
