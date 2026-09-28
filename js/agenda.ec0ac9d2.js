(function(){"use strict";const e=window.PP,i=e.esc,y=["Dom","Seg","Ter","Qua","Qui","Sex","S\xE1b"];let h=null,g="";e.equipeObra=a=>e.find("equipesObra",a),e.equipeObraNome=a=>(e.equipeObra(a)||{}).nome||"Sem equipe",e.equipeObraCor=a=>(e.equipeObra(a)||{}).cor||"#8C9BA1",e.duracaoObra=a=>Math.max(e.n(a.duracaoDias)||3,1);function E(a){const s=[];if(!a.dataAgendada)return s;for(let d=0;d<e.duracaoObra(a);d++)s.push(e.addDias(a.dataAgendada,d));return s}function x(a){return e.where("obras",s=>s.status!=="cancelada"&&s.status!=="concluida"&&E(s).includes(a)).concat(e.where("obras",s=>s.status==="concluida"&&s.dataAgendada===a))}function f(a){const s={};return x(a).forEach(d=>{const o=d.equipeObraId||"";o&&(s[o]=s[o]||[]).push(d)}),Object.keys(s).filter(d=>s[d].length>1).map(d=>({equipeId:d,obras:s[d]}))}e.conflitosNoDia=f,e.view("agenda",{titulo:"Agenda de obras",sub:()=>{const a=e.where("obras",o=>o.status!=="concluida"&&o.status!=="cancelada"&&!o.dataAgendada).length,s=e.where("obras",o=>o.dataAgendada&&o.status!=="concluida"&&o.status!=="cancelada"&&!o.equipeObraId).length,d=[];return a&&d.push(`${a} obra(s) sem data`),s&&d.push(`${s} sem equipe`),d.length?d.join(" \xB7 "):"Tudo agendado e com equipe definida"},render(){const a=h||e.mesKey(e.hoje()),[s,d]=a.split("-").map(Number),o=new Date(s,d-1,1),n=new Date(s,d,0).getDate(),l=o.getDay(),c=e.where("equipesObra",t=>t.ativo!==!1),v=e.where("obras",t=>t.status!=="concluida"&&t.status!=="cancelada"&&!t.dataAgendada),r=[];for(let t=0;t<l;t++)r.push(null);for(let t=1;t<=n;t++)r.push(`${s}-${String(d).padStart(2,"0")}-${String(t).padStart(2,"0")}`);for(;r.length%7;)r.push(null);let p=0;const D=r.map(t=>{if(!t)return'<div class="cal-cel vazio"></div>';let u=x(t);g&&(u=u.filter(m=>m.equipeObraId===g));const b=f(t);p+=b.length;const A=t===e.hoje(),w=[0,6].includes(new Date(t+"T12:00:00").getDay());return`
        <div class="cal-cel ${A?"hoje":""} ${w?"fds":""} ${b.length?"conflito":""}"
             tabindex="0" role="button" data-act="calDia" data-d="${t}">
          <div class="cal-num">${e.n(t.slice(8))}${b.length?'<span class="cal-alerta" title="Conflito de equipe">!</span>':""}</div>
          <div class="cal-itens">
            ${u.slice(0,3).map(m=>`
              <span class="cal-obra" style="border-left-color:${e.equipeObraCor(m.equipeObraId)};--cor:${e.equipeObraCor(m.equipeObraId)}"
                    title="${i(e.cliNome(m.clienteId))} \u2014 ${i(e.equipeObraNome(m.equipeObraId))}">
                ${i(e.trunc(e.cliNome(m.clienteId).split(" ")[0],12))}
              </span>`).join("")}
            ${u.length>3?`<span class="cal-mais">+${u.length-3}</span>`:""}
          </div>
        </div>`}).join(""),O=c.map(t=>{const u=e.where("obras",b=>b.equipeObraId===t.id&&b.dataAgendada&&e.mesKey(b.dataAgendada)===a&&b.status!=="cancelada");return{e:t,qtd:u.length,dias:e.soma(u,e.duracaoObra)}});return`
      <div class="toolbar">
        <div class="row" style="gap:6px">
          <button class="icon-btn" data-act="calMes" data-n="-1" aria-label="M\xEAs anterior"><svg class="ic" style="transform:rotate(180deg)"><use href="#i-seta"/></svg></button>
          <strong style="font-family:Fraunces,serif;font-size:17px;min-width:170px;text-align:center">${i(e.mesNomeLongo(a))}</strong>
          <button class="icon-btn" data-act="calMes" data-n="1" aria-label="Pr\xF3ximo m\xEAs"><svg class="ic"><use href="#i-seta"/></svg></button>
          <button class="btn btn-sm" data-act="calMes" data-n="0">Hoje</button>
        </div>
        <div class="seg">
          <button class="${g?"":"on"}" data-act="calEquipe" data-e="">Todas</button>
          ${c.map(t=>`<button class="${g===t.id?"on":""}" data-act="calEquipe" data-e="${i(t.id)}">
            <span style="width:9px;height:9px;border-radius:2px;background:${i(t.cor)};display:inline-block"></span>${i(e.trunc(t.nome,14))}</button>`).join("")}
        </div>
        <div class="row-end row">
          <button class="btn" data-act="gerirEquipesObra"><svg class="ic"><use href="#i-vendedor"/></svg>Equipes</button>
        </div>
      </div>

      ${p?`<div class="alert a-dang mb"><svg class="ic"><use href="#i-alerta"/></svg>
        <div><b>${e.plural(p,"conflito de agenda","conflitos de agenda")} neste m\xEAs.</b> H\xE1 equipe com mais de uma obra no mesmo dia \u2014 os dias est\xE3o marcados em vermelho.</div></div>`:""}

      <div class="grid g-3-2">
        <div class="card">
          <div class="card-bd" style="padding:12px">
            <div class="cal-head">${y.map(t=>`<div>${t}</div>`).join("")}</div>
            <div class="cal-grid">${D}</div>
            <div class="legend mt">
              ${c.map(t=>`<span><i style="background:${i(t.cor)}"></i>${i(t.nome)}</span>`).join("")}
            </div>
          </div>
        </div>

        <div class="stack">
          <div class="card">
            <div class="card-hd"><div><h3>Aguardando agendamento</h3><div class="sub">${v.length} obra(s) sem data</div></div></div>
            <div class="card-bd">
              ${v.length?v.map(t=>`
                <div class="att-item" tabindex="0" role="button" style="cursor:pointer" data-act="abrirObra" data-id="${i(t.id)}">
                  <svg class="ic"><use href="#i-obra"/></svg>
                  <div class="txt"><b>${i(e.trunc(e.cliNome(t.clienteId),24))}</b><small>${i(t.cidade||t.endereco||"")}</small></div>
                  <button class="btn btn-sm btn-teal" data-act="agendarObra" data-id="${i(t.id)}">Agendar</button>
                </div>`).join(""):'<div class="empty-sm">Nenhuma obra pendente. Muito bom.</div>'}
            </div>
          </div>

          <div class="card">
            <div class="card-hd"><div><h3>Carga por equipe</h3><div class="sub">${i(e.mesNomeLongo(a))}</div></div></div>
            <div class="card-bd">
              ${O.length?O.map(t=>`
                <div class="att-item">
                  <span style="width:10px;height:10px;border-radius:3px;background:${i(t.e.cor)};flex:none"></span>
                  <div class="txt"><b>${i(t.e.nome)}</b><small>${i(t.e.membros||"")}</small></div>
                  <div class="val">${t.qtd} obra(s)<br><span class="tiny faint">${t.dias} dias de campo</span></div>
                </div>`).join(""):'<div class="empty-sm">Nenhuma equipe cadastrada.</div>'}
            </div>
          </div>
        </div>
      </div>`}}),e.on("calMes",a=>{const s=e.n(a.n);s===0?h=e.mesKey(e.hoje()):h=e.mesKey(e.addMeses((h||e.mesKey(e.hoje()))+"-15",s)),e.render()}),e.on("calEquipe",a=>{g=a.e,e.render()}),e.on("calDia",a=>{const s=a.d,d=x(s),o=f(s);e.modal({title:e.dt(s),sub:d.length?`${e.plural(d.length,"obra")} neste dia`:"Nenhuma obra agendada",size:"lg",body:`
      ${o.length?`<div class="alert a-dang mb"><svg class="ic"><use href="#i-alerta"/></svg>
        <div><b>Conflito de equipe.</b> ${o.map(n=>`${i(e.equipeObraNome(n.equipeId))} tem ${n.obras.length} obras neste dia`).join("; ")}.</div></div>`:""}
      ${d.length?`<div class="stack" style="gap:0">${d.map(n=>`
        <div class="att-item" tabindex="0" role="button" style="cursor:pointer" data-act="irObraDoCal" data-id="${i(n.id)}">
          <span style="width:10px;height:10px;border-radius:3px;background:${e.equipeObraCor(n.equipeObraId)};flex:none"></span>
          <div class="txt"><b>${i(e.cliNome(n.clienteId))}</b>
            <small>${i(e.equipeObraNome(n.equipeObraId))} \xB7 ${i(n.endereco||n.cidade||"")} \xB7 ${i(e.STATUS_OBRA[n.status].nome)}</small></div>
          <div class="val">${e.duracaoObra(n)}d</div>
        </div>`).join("")}</div>`:'<div class="empty-sm">Dia livre. Voc\xEA pode agendar uma das obras pendentes por aqui.</div>'}`,actions:[{txt:"Fechar",act:"fechar"}]})}),e.on("irObraDoCal",a=>{e.closeTop(),e.abrirObra(a.id)}),e.on("gerirEquipesObra",()=>{const a=e.all("equipesObra");e.modal({title:"Equipes de instala\xE7\xE3o",sub:"Quem executa as obras em campo",size:"lg",body:`${a.length?e.tabela({act:"editarEquipeObra",rows:a,cols:[{h:"",w:"28px",r:s=>`<span style="display:inline-block;width:12px;height:12px;border-radius:3px;background:${i(s.cor)}"></span>`},{h:"Equipe",r:s=>`<div class="strong">${i(s.nome)}</div><span class="mini">${i(s.membros||"")}</span>`},{h:"Telefone",r:s=>`<span class="small">${i(e.fone(s.fone))}</span>`},{h:"Obras no m\xEAs",cls:"num",r:s=>String(e.where("obras",d=>d.equipeObraId===s.id&&d.dataAgendada&&e.mesKey(d.dataAgendada)===e.mesKey(e.hoje())).length)},{h:"Situa\xE7\xE3o",r:s=>e.badge(s.ativo===!1?"Inativa":"Ativa",s.ativo===!1?"":"b-ok")}]}):'<div class="empty-sm">Nenhuma equipe cadastrada.</div>'}`,actions:[{txt:"Nova equipe",cls:"btn-primary",ic:"i-plus",act:"novaEquipeObra"},{txt:"Fechar",act:"fechar"}]})}),e.on("novaEquipeObra",()=>$(null)),e.on("editarEquipeObra",a=>{e.closeTop(),$(e.equipeObra(a.id))});function $(a){const s=e.uid("eo");e.on(s,(d,o)=>{const{ok:n,data:l}=e.lerForm(o.closest(".modal-box").querySelector("#formEqObra"));n&&(e.upsert("equipesObra",l),e.closeTop(),e.toast("Equipe salva","ok"),e.render())}),e.modal({title:a?a.nome:"Nova equipe de instala\xE7\xE3o",size:"lg",body:`<form id="formEqObra">${e.form([{k:"id",t:"hidden"},{k:"nome",l:"Nome da equipe",t:"text",col:7,req:!0,ph:"Equipe A"},{k:"cor",l:"Cor no calend\xE1rio",t:"select",col:5,vazio:!1,opts:[{v:"#0E7C86",l:"Petr\xF3leo"},{v:"#B9812F",l:"Ocre"},{v:"#2A5D9E",l:"Azul"},{v:"#1E7A4B",l:"Verde"},{v:"#A8322C",l:"Vermelho"},{v:"#6B4E9E",l:"Roxo"}]},{k:"membros",l:"Integrantes",t:"text",col:7,ph:"Jailson, Wesley e Tiago"},{k:"fone",l:"Telefone do respons\xE1vel",t:"tel",col:5},{k:"ativo",l:"Equipe ativa",t:"checkbox",col:12}],a||{ativo:!0,cor:"#0E7C86"})}</form>`,actions:[{txt:"Salvar",cls:"btn-primary",act:s},a?{txt:"Excluir",act:"excluirEquipeObra",data:{id:a.id}}:null,{txt:"Cancelar",act:"fechar"}].filter(Boolean)})}e.on("excluirEquipeObra",async a=>{const s=e.equipeObra(a.id);await e.confirmarExclusao("equipeObra",a.id,s.nome,{alternativa:'Desmarque "Equipe ativa" em vez de apagar: ela sai do calend\xE1rio e dos formul\xE1rios, mas as obras j\xE1 feitas mant\xEAm o registro de quem executou.'})&&(e.desvincular("equipeObra",a.id),e.remove("equipesObra",a.id),e.closeTop(),e.toast("Equipe exclu\xEDda"),e.render())}),e.on("imprimirOS",a=>{const s=e.find("obras",a.id);s&&(s.numeroOS||(s.numeroOS=k(),e.save("obras")),e.imprimir(q(s),`Ordem de servi\xE7o \u2014 ${e.cliNome(s.clienteId)}`))});function k(){return e.all("obras").reduce((s,d)=>Math.max(s,e.n(d.numeroOS)),2e3)+1}function q(a){const s=e.cfg(),d=e.cli(a.clienteId)||{},o=e.find("pedidos",a.pedidoId),n=o?e.orcDoPedido(o):null,l=n?n.itens.map(r=>e.prod(r.produtoId)).find(r=>r&&r.categoria==="Piscina"):null,c=l?l.specs||{}:{},v=n?n.itens.filter(r=>{const p=e.prod(r.produtoId);return!p||p.categoria!=="Servi\xE7o"}):[];return`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>OS ${a.numeroOS||""}</title>
<style>
  @page{ size:A4; margin:12mm 11mm; }
  *{ box-sizing:border-box; }
  body{ font-family:'Segoe UI',Arial,sans-serif; color:#12262D; margin:0; font-size:11.5px; line-height:1.45; }
  .hd{ display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid #0B1F26; padding-bottom:10px; margin-bottom:14px; }
  .logo{ font-size:21px; font-weight:800; color:#0B1F26; }
  .logo span{ color:#0E7C86; }
  .emp{ font-size:9.5px; color:#55666D; margin-top:3px; }
  .doc{ text-align:right; }
  .doc h1{ font-size:13px; margin:0; text-transform:uppercase; letter-spacing:.09em; color:#0E7C86; }
  .doc .num{ font-size:25px; font-weight:800; line-height:1; }
  h2{ font-size:9.5px; text-transform:uppercase; letter-spacing:.11em; color:#0E7C86; margin:14px 0 6px;
      border-bottom:1px solid #E2DCD0; padding-bottom:3px; }
  .box{ border:1px solid #D3CABA; border-radius:7px; padding:9px 11px; background:#FBF9F5; }
  .cols{ display:flex; gap:11px; }
  .cols>div{ flex:1; }
  .kv{ display:flex; gap:7px; margin-bottom:2px; }
  .kv b{ min-width:66px; color:#55666D; font-weight:600; font-size:9.5px; text-transform:uppercase; }
  .destaque{ background:#0B1F26; color:#fff; border-radius:7px; padding:10px 13px; display:flex; gap:14px; align-items:center; }
  .destaque .mod{ font-size:18px; font-weight:800; }
  .destaque .med{ margin-left:auto; display:flex; gap:12px; }
  .destaque .med div{ text-align:center; }
  .destaque .med small{ display:block; font-size:8.5px; opacity:.65; text-transform:uppercase; letter-spacing:.07em; }
  .destaque .med b{ font-size:14px; }
  table{ width:100%; border-collapse:collapse; }
  th{ background:#EDE8DF; font-size:9px; text-transform:uppercase; letter-spacing:.06em; padding:5px 8px; text-align:left; color:#55666D; }
  td{ padding:5px 8px; border-bottom:1px solid #E2DCD0; }
  .chk{ display:flex; align-items:center; gap:8px; padding:4px 0; border-bottom:1px dotted #D3CABA; }
  .chk i{ width:13px; height:13px; border:1.6px solid #0B1F26; border-radius:3px; flex:none; display:inline-block; }
  .chk span{ flex:1; }
  .chk em{ font-style:normal; font-size:8.5px; color:#8C9BA1; letter-spacing:.14em; }
  .grid2{ display:grid; grid-template-columns:1fr 1fr; gap:2px 22px; }
  .linhas{ border:1px solid #D3CABA; border-radius:7px; height:74px; background:
    repeating-linear-gradient(#fff 0 23px, #E2DCD0 23px 24px); }
  .assin{ display:flex; gap:26px; margin-top:22px; }
  .assin div{ flex:1; border-top:1px solid #0B1F26; padding-top:4px; text-align:center; font-size:9px; color:#55666D; }
  .ft{ margin-top:14px; font-size:8.5px; color:#8C9BA1; text-align:center; }
  .aviso{ background:#FBEEDA; border:1px solid #EBD3A6; border-radius:7px; padding:8px 11px; font-size:10px; color:#6E4205; margin-top:8px; }
</style></head><body>

  <div class="hd">
    <div>
      <div class="logo">Piscina<span>Pro</span></div>
      <div class="emp">${i(s.empresa)}${s.fone?" \xB7 "+i(s.fone):""}</div>
    </div>
    <div class="doc">
      <h1>Ordem de servi\xE7o</h1>
      <div class="num">${i(a.numeroOS||"\u2014")}</div>
      <div style="font-size:9.5px;color:#55666D">Emitida em ${i(e.dt(e.hoje()))}</div>
    </div>
  </div>

  <div class="cols">
    <div class="box">
      <div class="kv"><b>Cliente</b><span><b>${i(d.nome||"\u2014")}</b></span></div>
      <div class="kv"><b>Telefone</b><span>${i(e.fone(d.telefone))}</span></div>
      <div class="kv"><b>Pedido</b><span>${o?"#"+o.numero:"\u2014"}</span></div>
    </div>
    <div class="box">
      <div class="kv"><b>Endere\xE7o</b><span>${i(a.endereco||d.endereco||"\u2014")}</span></div>
      <div class="kv"><b>Cidade</b><span>${i(a.cidade||d.cidade||"\u2014")}</span></div>
      <div class="kv"><b>Data</b><span><b>${a.dataAgendada?i(e.dt(a.dataAgendada)):"A DEFINIR"}</b> \xB7 ${e.duracaoObra(a)} dia(s)</span></div>
    </div>
  </div>

  ${l?`
  <h2>Piscina a instalar</h2>
  <div class="destaque">
    <div>
      <div class="mod">${i(l.nome)}</div>
      <div style="font-size:9.5px;opacity:.7">${i(l.sku)}</div>
    </div>
    <div class="med">
      <div><small>Compr.</small><b>${e.dec(c.compr,2)} m</b></div>
      <div><small>Larg.</small><b>${e.dec(c.larg,2)} m</b></div>
      <div><small>Prof.</small><b>${e.dec(c.prof,2)} m</b></div>
      <div><small>Volume</small><b>${e.dec(c.volume,1)} mil L</b></div>
    </div>
  </div>`:""}

  <h2>Equipe e responsabilidades</h2>
  <div class="cols">
    <div class="box">
      <div class="kv"><b>Equipe</b><span><b>${i(e.equipeObraNome(a.equipeObraId))}</b></span></div>
      <div class="kv"><b>Integrantes</b><span>${i((e.equipeObra(a.equipeObraId)||{}).membros||a.responsavel||"\u2014")}</span></div>
    </div>
    <div class="box">
      <div class="kv"><b>Contato</b><span>${i(e.fone((e.equipeObra(a.equipeObraId)||{}).fone))}</span></div>
      <div class="kv"><b>Escrit\xF3rio</b><span>${i(s.fone||"\u2014")}</span></div>
    </div>
  </div>

  ${v.length?`
  <h2>Materiais e itens a levar</h2>
  <table>
    <thead><tr><th style="width:34px">OK</th><th>Item</th><th style="width:52px">Qtd</th><th style="width:80px">Conferido por</th></tr></thead>
    <tbody>${v.map(r=>`<tr>
      <td style="text-align:center">\u2610</td>
      <td>${i(r.nome)}</td>
      <td>${e.dec(r.qtd,e.n(r.qtd)%1?2:0)}</td>
      <td></td></tr>`).join("")}</tbody>
  </table>`:""}

  <h2>Checklist de execu\xE7\xE3o</h2>
  <div class="grid2">
    ${e.CHECKLIST_OBRA.map((r,p)=>`<div class="chk"><i></i><span>${i(r)}</span><em>${(a.checklist||[])[p]?"FEITO":"__/__"}</em></div>`).join("")}
  </div>

  <h2>Ocorr\xEAncias da obra</h2>
  <div class="linhas"></div>

  ${a.obsOS||d.obs?`<div class="aviso"><b>Aten\xE7\xE3o:</b> ${i(a.obsOS||d.obs)}</div>`:""}

  <div class="assin">
    <div>Respons\xE1vel pela equipe</div>
    <div>${i(d.nome||"Cliente")} \u2014 recebimento</div>
  </div>

  <div class="ft">${i(s.empresa)} \xB7 OS ${i(a.numeroOS||"")} \xB7 impressa em ${i(e.dt(e.hoje()))} \u2014 este documento acompanha a equipe at\xE9 o encerramento da obra.</div>
</body></html>`}e.osHTML=q})();
