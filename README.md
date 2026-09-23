# PiscinaPro — Sistema de Vendas + ERP

Sistema completo de **gestão comercial e ERP** para empresa de piscinas de fibra:
funil de vendas, cadastro de leads e vendedores, orçamentos com proposta em PDF,
pedidos, obras, estoque, compras, financeiro e comissões.

**HTML/CSS/JS puro** — sem framework nem build. As dependências de desenvolvimento
servem para lint e testes; a versão publicada usa o cliente Supabase local.
Os dados confirmados ficam no **Postgres do Supabase**. Alterações pendentes
ficam temporariamente num diário IndexedDB, isolado por usuário e empresa.

---

## Como rodar

```bash
node server.js
```

Depois abra `http://localhost:5180`. Precisa de internet: sem servidor não há
sistema — os dados não vivem aqui.
Na versão publicada, as chamadas ao Supabase passam por `/sb/` no domínio da
Vercel para evitar o bloqueio do endereço direto por extensões do navegador.

Para validar antes de publicar: `npm ci`, `npm run check`, `npm test`,
`npm run lint` e `npm run test:e2e`. As páginas antigas `portal.html` e
`proposta.html` foram retiradas por dependerem de arquivos e funções ausentes;
o envio de propostas no fluxo atual é por PDF.

Para montar somente os arquivos que vão para a Vercel, execute
`npm run preparar:publicacao`. A pasta `publicar/` é recriada do zero e fica
pronta para upload ou para executar `vercel --prod` dentro dela. Banco,
migrations, testes, documentação e dependências de desenvolvimento ficam fora.

---

## Como entrar

Cada pessoa usa a **conta dela** no Supabase Auth. O vínculo com o cadastro do
sistema é o **e-mail**:

1. o dono do site entra como **provedor** e, em **Empresas clientes**, informa o
   nome e o e-mail do primeiro administrador ao cadastrar a empresa. Para uma
   empresa já existente, usa **Acessos → Cadastrar administrador**;
2. esse primeiro administrador abre o sistema, clica em **“Primeiro acesso —
   criar minha conta”** e usa o e-mail informado pelo provedor;
3. depois de entrar, cadastra a equipe em **Equipe de vendas → Usuários**, com o
   e-mail de cada pessoa no campo *E-mail de acesso*;
4. cada pessoa cria sua conta com o e-mail cadastrado. Na primeira entrada,
   `reivindicar_usuario()` liga a conta ao cadastro e o banco entrega só o que
   o papel dela permite.

A senha é da pessoa, no servidor. Vale em qualquer computador, ninguém mais a
vê, e “esqueci minha senha” manda link por e-mail.

**Segurança:** a senha inicial de `admin@piscinapro.app` ainda funciona e a
caixa de e-mail não está acessível. Essa conta não deve permanecer como único
admin. Crie e teste um segundo administrador com e-mail controlado antes de
desativar a conta inicial; veja [BACKEND.md](BACKEND.md).

> **Sobre segurança:** aqui a barreira é real. Quem filtra é o banco, por
> *Row Level Security*, conforme o papel de quem pede. O que o JavaScript faz é
> esconder da tela o que o servidor já não entregaria — conforto, não proteção.
> Com a chave publicável e sem sessão, a API devolve **zero linha** (conferido).

---

## Módulos

### Comercial
| Tela | O que faz |
|---|---|
| **Visão geral** | KPIs do mês, vendas x meta, funil atual, ranking da equipe e 3 painéis de pendências |
| **Funil de vendas** | Kanban com 7 etapas, arrastar e soltar (mouse e toque), filtro por vendedor |
| **Base de leads** | Busca, filtros, exportação CSV e **importação de planilha** com mapeamento de colunas |
| **Orçamentos** | Catálogo visual, adicionais, desconto com **alçada que trava**, financiamento e **proposta em PDF** |
| **Pedidos de venda** | Ciclo aberto → produção → entregue → concluído, com margem e parcelas |
| **Clientes** | Ficha 360°: pedidos, orçamentos, obras, contratos, chamados e financeiro |

### Operação
| Tela | O que faz |
|---|---|
| **Agenda de obras** | Calendário mensal por equipe, com **detecção de conflito** e carga de cada turma |
| **Obras & instalação** | Checklist de 13 etapas, diário de obra, custo previsto x real e **ordem de serviço em PDF** |
| **Produtos & catálogo** | Modelos de piscina com medidas/volume, adicionais, equipamentos, insumos e serviços |
| **Estoque** | Em casa, **reservado** e disponível; alerta de mínimo, movimentações e reposição |
| **Compras & fornecedores** | Pedido de compra, recebimento (dá entrada no estoque e gera conta a pagar) |

### Loja
| Tela | O que faz |
|---|---|
| **Venda de balcão (PDV)** | Caixa rápido para cloro, insumos e acessórios: busca por nome ou código, Enter adiciona, **F2** fecha, troco calculado, cupom impresso |
| **Vendas da loja** | Histórico, caixa do dia, mais vendidos e cancelamento com estorno |

### Pós-venda
| Tela | O que faz |
|---|---|
| **Contratos de manutenção** | Receita recorrente (MRR), cobrança automática do mês, renovação a vencer |
| **Assistência & garantia** | Chamados com cálculo automático de garantia (casco e equipamentos), custo x cobrado |

### Financeiro
| Tela | O que faz |
|---|---|
| **Contas a pagar/receber** | Lançamentos com vencimento, baixa, filtros por situação e mês |
| **Fluxo de caixa** | Realizado x projetado, saldo acumulado, resultado do mês e despesas por categoria |
| **DRE** | Demonstração do resultado por competência, com análise vertical, comparação com o período anterior e o bloco do que ficou de fora |
| **Comissões** | Prevista → liberada → paga, por competência, com pagamento em lote |

### Gestão
**Equipe de vendas** (metas, comissão, ranking, conversão) · **Relatórios**
(faturamento, margem, origem dos leads, motivos de perda, ranking de produtos, PDF gerencial) ·
**Configurações** (dados da empresa, parâmetros comerciais, servidor e backup).

---

## O motor do ERP

Aprovar um orçamento é o que conecta tudo. Numa única ação o sistema:

1. cria o **cliente** (se o lead ainda não era cliente);
2. move o **lead** para "ganho";
3. gera o **pedido de venda** numerado;
4. abre a **obra** com o checklist zerado;
5. lança **entrada + parcelas** em contas a receber (com juros, se houver);
6. lança o **custo de produto e mão de obra** em contas a pagar;
7. registra a **comissão** do vendedor como prevista;
8. **baixa o estoque** dos itens vendidos e grava a movimentação.

Quando todas as parcelas são quitadas, o pedido vira "concluído" e a comissão é
liberada automaticamente. Pagar a comissão cria a despesa correspondente.

### Como a comissão é calculada

Três regras, em Configurações → Parâmetros comerciais. Vale sempre a que estiver
ligada no momento da venda — mudar a regra não mexe em comissão já registrada.

| Regra | Conta | Exemplo |
|---|---|---|
| **Faturamento** | % do valor total da venda | 3% de R$ 42.390 = R$ 1.271,70 |
| **Margem bruta** | % de (venda − custo) — quem dá desconto ganha menos | 3% de R$ 20.140 = R$ 604,20 |
| **Metro de piscina** | R$ fixos × metros de piscina, só isso | R$ 100 × 6,00 m = R$ 600,00 |

Na regra por metro, o que conta é o **comprimento cadastrado no modelo**, vezes a
quantidade. Uma piscina de 4 m a R$ 100/m paga R$ 400; duas pagam R$ 800.
**Todo o resto fica fora da conta** — hidromassagem, aquecedor, capa, cloro,
instalação, frete. Por consequência a **venda de balcão não gera comissão** nessa
regra: o caixa não vende piscina. Piscina sem comprimento cadastrado paga zero, e
por isso o campo *Comprimento* passa a avisar disso no cadastro do produto.

Cada vendedor pode ter o **valor por metro dele** (cadastro do vendedor); em branco
ou zero, vale o da empresa. Mesma lógica do percentual individual.

### A DRE e a armadilha da dupla contagem

A DRE é por **competência**: a venda pesa no mês em que aconteceu, não no mês em
que o dinheiro entrou. Quem mostra o dinheiro é o Fluxo de caixa, ao lado.

Montar uma DRE em cima de contas a pagar/receber conta a mesma coisa duas vezes:
aprovar um orçamento já lança o custo do produto em contas a pagar, e pagar a
comissão lança outra despesa. Por isso:

- **receita e custo saem dos documentos** — pedido e venda guardam a própria foto;
- os lançamentos que são só a contrapartida financeira deles **ficam de fora**;
- **comissão entra por competência**, do mês da venda, não do mês do pagamento;
- **compra de estoque não é despesa** — vira estoque e só pesa quando o produto sai.

Nada some em silêncio: o bloco **“O que ficou fora”** mostra cada exclusão com o
valor e o motivo, para a conta fechar na mão de quem conferir.

### Reserva de estoque

Uma piscina fica **reservada** enquanto a proposta está viva na rua — aguardando
alçada, enviada ou em negociação. O catálogo mostra *disponível = em casa − reservado*,
então dois vendedores não prometem a mesma última unidade. A reserva é calculada a
partir dos orçamentos, sem estado paralelo para dessincronizar.

### Alçada de desconto

Desconto acima do limite configurado **trava a proposta** em "Aguardando alçada":
o vendedor não consegue enviar nem aprovar. O gerente libera (fica registrado quem
e quando) ou devolve com justificativa, que vai para as observações do orçamento.
Se o vendedor baixar o desconto para dentro do limite, destrava sozinho.

### WhatsApp

Os botões de WhatsApp montam a mensagem a partir de modelos editáveis em
Configurações e abrem a conversa já preenchida. **O sistema nunca envia sozinho** —
quem aperta enviar é sempre a pessoa, dentro do WhatsApp.

---

## Arquitetura

```
index.html          shell + sprite de ícones SVG
css/app.css         design system "Deep Water Atelier"
js/core.js          utilidades, persistência, rotas, modal/drawer/toast,
                    construtor de formulários, tabelas e gráficos SVG
js/seed.js          dados de demonstração (datas relativas a hoje)
js/auth.js          login, papéis de acesso e escopo de dados por vendedor
js/whats.js         compositor de mensagens e abertura do WhatsApp
js/vendas.js        visão geral, funil, leads, importação, clientes, equipe
js/orcamentos.js    catálogo, construtor, alçada, proposta em PDF, pedidos
js/erp.js           produtos, estoque, compras, fornecedores, obras
js/agenda.js        calendário de obras, equipes de campo, ordem de serviço
js/servicos.js      contratos de manutenção e chamados de garantia
js/financeiro.js    contas, fluxo de caixa, comissões
js/relatorios.js    relatórios e configurações
js/main.js          boot, busca global, central de alertas, atalhos
js/pdv.js           venda de balcão: caixa, histórico e cupom
js/nuvem.js         driver do Supabase: carga, gravação, numeração
js/saas.js          empresas clientes, licença, faturas, auditoria e saúde
js/testes.js        suíte de testes (abre por testes.html)
js/tipos.js         typedefs JSDoc do domínio (não é carregado, é para o editor)
scripts/testar.js   runner headless — npm test
scripts/verificar.js checagens estáticas — npm run check
sw.js               service worker (offline)
manifest.webmanifest / icone.svg    instalação como app
server.js           servidor estático (npm start)
```

**Não existe `onclick` inline.** Todo evento passa por delegação:

```html
<button data-act="novoLead">Novo lead</button>
```
```js
PP.on('novoLead', (dataset, el, ev) => { ... });
```

Atributos: `data-act` (clique/Enter), `data-chg` (change), `data-inp` (input),
`data-sub` (submit). Um botão sem handler registrado é detectado por
`PP.acoesFaltando()` no console — não quebra silenciosamente.

**Views** são registradas com `PP.view('nome', { titulo, sub, render, depois })`
e a rota é o hash (`#/funil`, `#/orcamentos`).

**Persistência:** a fonte da verdade é o Postgres. O navegador guarda só a cópia
de trabalho da sessão, em memória. A API não mudou —
`PP.all(col)`, `PP.find(col, id)`, `PP.where(col, fn)`, `PP.upsert(col, obj)`,
`PP.remove(col, id)`, `PP.save(col)` — porque entre ela e o banco existe um
**driver** (`PP.driver`): Supabase em produção, memória nos testes. Nenhuma tela
sabe de onde o dado vem.

`PP.save(col)` não grava: marca a coleção como pendente. Um instante depois o
sistema compara a coleção com a **foto do que o banco confirmou** e manda só a
diferença — os alterados como upsert, os que sumiram como `delete`. É daí que
vem a propagação de exclusão. Se a gravação falhar, a foto não avança, a
diferença é recalculada e nada se perde; a barra de status mostra o estado.

**Permissões:** `PP.podeAcessar(view)` decide o menu e bloqueia a rota;
`PP.escopo(lista)` filtra pela carteira do vendedor logado (gestor recebe tudo);
`PP.podeVerCusto()` esconde custo e margem de quem não é gestor.
`PP.definirSessao(u)` é o único ponto que define quem está logado — por isso os
testes conseguem simular um papel sem passar pela tela de login.

**Várias abas, vários computadores:** não há mais mescla no cliente. Cada aba lê
do banco ao abrir e grava a diferença dela; o `id` é o mesmo dos dois lados, o
upsert é idempotente e quem chegou por último fica. Para ver o que outra pessoa
gravou, **Configurações → Recarregar do servidor**.

**Listas grandes são paginadas** (`PP.paginar(nome, linhas)`), 60 por página.
Sem isso, 3 anos de operação jogavam 4.200 linhas e 2,2 MB de HTML numa tela só,
e cada baixa no financeiro travava a interface por quase um segundo.

**Dinheiro** sempre fechado em centavos: `PP.cent(v)` arredonda e
`PP.parcelar(total, n, juros)` divide jogando a diferença de arredondamento na
última parcela, para a soma bater exatamente com o contratado.

**Documento emitido não muda.** O pedido guarda a própria foto financeira
(`total`, `custo`, `itens`, `condicao`) no momento da venda. Mexer no orçamento
depois não altera o pedido — `PP.pedidoTotal` só cai no orçamento para registros
antigos, anteriores ao snapshot.

**Antes de apagar:** `PP.dependentes(tipo, id)` lista o que aponta para o
registro, separando o que **bloqueia** (documento emitido, dinheiro em aberto) do
que só vira **órfão**. `PP.confirmarExclusao` faz a conversa com o usuário e
`PP.desvincular` limpa as referências soltas.

**Datas** trafegam como `YYYY-MM-DD` no **fuso local** (`PP.hoje()`), nunca em UTC —
caso contrário o sistema viraria o dia depois das 21h no Brasil.

> ⚠️ `PP.mesKey('')` devolve o **mês atual** (por causa do `||` interno). Nunca compare
> uma data possivelmente vazia direto com `PP.mesKey` — trate o vazio antes, como faz
> `PP.contratoPendente`. Esse detalhe já escondeu contratos que nunca foram cobrados.

---

## Testes e verificação

```bash
npm test      # 104 testes de domínio, no terminal, sem navegador
npm run check # sintaxe, ações órfãs, handlers inline, módulos, sobras de debug
npm start     # sobe o servidor em localhost:5180
```

`npm test` roda os mesmos testes de `testes.html` num DOM mínimo montado pelo
`scripts/testar.js` — **sem jsdom e sem nenhuma dependência**, porque zero-deps
continua sendo a regra do projeto. Sai com código 1 se algo falhar, então serve
em CI (veja `.github/workflows/ci.yml`).

Os testes cobrem datas e fuso, dinheiro e parcelamento, orçamento, reserva de
estoque, a cadeia de geração do pedido, contratos, garantia, permissões,
integridade referencial, paginação, validação de campos, migração de backup,
tratamento de erro, escape de HTML e CSV. Rodam **em memória**: a suíte desliga a
gravação e monta o próprio cenário, então não encosta nos seus dados.

`npm run check` é o lint deste projeto. A checagem mais importante dele é a de
**handler inline**: se alguém escrever um `onclick=` no HTML, ele falha — essa é
a regra de arquitetura que já quebrou o sistema uma vez.

Para abrir o relatório visual: `http://localhost:5180/testes.html`.

## Validação

Os formulários validam de verdade, não só "campo obrigatório": formato de e-mail
e telefone, **dígito verificador de CPF e CNPJ**, CEP, UF, percentuais de 0 a 100,
valores não-negativos e datas coerentes. Regras entre campos (fim antes do
início, conclusão antes do agendamento) vão em `PP.lerForm(form, { regras })`.

Para adicionar: `{ k:'doc', t:'text', val:'doc' }` — os validadores estão em
`PP.valida` e o padrão por tipo (`email`, `tel`, `date`) é aplicado sozinho.

## Sem rede não há sistema

Escolha consciente, e o preço de ter **um dado só** para a equipe: os dados vivem
no Postgres, então sem conexão o sistema não abre e não grava. Em vez de fingir
que salvou, ele diz na cara: *“Sem conexão com o servidor”*.

O service worker continua — guarda o casco do app (HTML, CSS, JS) para a
abertura ser instantânea e o PWA seguir instalável. Estratégia **rede primeiro**:
num ERP, código velho servido do cache já custou caro aqui. Ao alterar arquivos,
suba a `VERSAO` em `sw.js`.

Fechar a aba com alteração ainda não gravada dispara o aviso do navegador.

## Cache derivado

`PP.cacheDe(col, chave, calc)` guarda cálculo caro por coleção. Resultado que
depende de VÁRIAS coleções ao mesmo tempo — a DRE, a central de alertas — se
declara com `PP.registrarDerivado(nome, fontes)` e cai fora sozinho quando
qualquer fonte muda. Sem isso, guardar significaria servir número velho.

Medido com três anos de operação (9.100 registros): a central de alertas
custava **333 ms depois de cada render, em todas as telas** — ela varre quase o
banco inteiro e compara obra contra obra para achar conflito de equipe, que é
quadrático. Com o cache: **0,3 ms**. O segundo render de cada tela caiu de
~340 ms para 10–76 ms.

## Tipos

`js/tipos.js` define o formato de cada registro em JSDoc. O arquivo **não é
carregado** — existe para o editor avisar quando alguém escrever `p.cliented` em
vez de `p.clienteId`. No VS Code funciona sozinho via `jsconfig.json`.

### Como o caixa se encaixa

A altura do PDV não é um `calc()` chutado: `ajustarAltura()` mede o topo real
do bloco e o `padding` do container, e o resto da janela vira `--pdv-alt`. Assim
funciona em qualquer resolução sem número mágico, e reage a redimensionamento e
rotação.

O carrinho tem **três zonas** — topo fixo, miolo rolável, ação fixa — então o
botão de finalizar aparece mesmo em notebook de 768 px com o carrinho cheio.
A largura do carrinho acompanha a tela (`clamp(300px, 29vw, 440px)`) e os cards
do catálogo também, em vez de medidas travadas.

Abaixo de 820 px empilha, e aí a barra de ação passa a ser `fixed` na base da
janela — `sticky` não serviria, porque sendo o último filho ela não teria
percurso e o botão acabava fora da tela.

Medido em 1920×1080, 1600×560, 1440×900, 1366×768, 1280×720, 1024×768, 820×1180
e 390×844: botão sempre visível, sem rolagem de página e sem scroll horizontal.

## SaaS: várias empresas no mesmo sistema

O PiscinaPro é vendido como serviço. Cada empresa cliente vive no mesmo banco,
isolada por `empresa_id`, e quem administra tudo isso é o papel **provedor** —
que tem um app próprio dentro do mesmo app.

### As duas metades

| Quem entra | O que vê |
|---|---|
| **Provedor** | Empresas clientes, planos, faturas da licença, saúde do sistema, auditoria global. **Nenhum dado de negócio de nenhum cliente.** |
| **Cliente** (admin, gerente, vendedor, obra) | A operação da empresa dele, mais *Minha licença* e a *Trilha de auditoria* da própria casa. |

O provedor não enxerga lead, pedido nem financeiro de ninguém — conferido: zero
linhas em todas as tabelas de negócio. O que ele vê da operação alheia são
**números agregados**, devolvidos por função do banco. A diferença entre
monitorar e bisbilhotar.

### Isolamento

`empresa_id` tem `DEFAULT privado.minha_empresa()`: **o cliente nunca envia esse
campo**, então não há como forjar a empresa de outro. Toda policy exige a empresa,
nas de leitura *e* nas de escrita — policies permissivas se somam, e deixar o
escopo só na de leitura faria o `using` da outra abrir a porta.

Provado por simulação de papel no Postgres: o tenant A não lê, não edita e não
consegue plantar registro no tenant B; inserir sem informar a empresa faz o banco
preencher a certa.

### Licença

Cada empresa tem `licenca_ate`. Passou a data, **a escrita para e a leitura
continua**: o sistema entra em somente leitura, com faixa vermelha no topo de
toda tela, e a empresa ainda consegue exportar o backup. Tirar o dado de quem
deixou de pagar seria sequestro, não cobrança.

O ciclo mora no banco, não na tela — `gerar_fatura()`, `baixar_fatura()` e
`atualizar_licencas()` valem igual vindas do painel, do webhook ou de uma rotina
agendada. `baixar_fatura()` é **idempotente**: webhook repetido não estende a
licença duas vezes.

### Cobrança pelo Mercado Pago

Edge Function `licenca-mercadopago`, porque o token do gateway não pode viver no
navegador. `POST /cobranca` gera o link (só provedor); `POST /webhook` valida a
assinatura HMAC, **consulta o pagamento na API** em vez de acreditar no corpo da
notificação, e dá baixa.

Falta você configurar, no painel do Supabase → Edge Functions → Secrets:
`MP_ACCESS_TOKEN` e `MP_WEBHOOK_SECRET`. Sem o segredo, o webhook recusa tudo de
propósito — baixa automática sem conferir assinatura deixaria qualquer um
estender a própria licença.

### Auditoria

Três perguntas, três telas:

- **Saúde do sistema** — está funcionando? Pulso do serviço e 8 checagens de
  integridade por empresa (comissão órfã, estoque negativo, obra atrasada…).
- **Uso por empresa** — quem usa de verdade e quem parou: usuários com conta,
  último acesso, pedidos e faturamento no mês.
- **Trilha de auditoria** — quem mexeu no quê, com o antes e o depois de cada
  campo.

A trilha é gravada por **gatilho no banco**, em 13 tabelas. Feita no cliente,
bastaria abrir o DevTools para não registrar nada. O que vem do app (login,
exportação) é marcado `origem: app` — porque *essa* parte o cliente poderia
forjar, e quem lê precisa saber disso. **Ninguém edita nem apaga a trilha, nem o
provedor**: registro que pode ser apagado não serve de prova.

## Onde os dados moram

No **Postgres do Supabase**, projeto `xxhsyzzcwhtnwljlgops` (São Paulo). Não há
cópia no navegador: abrir em outro computador mostra exatamente a mesma base, e
limpar o navegador não perde nada.

**Quem pode o quê é decidido no banco**, por *Row Level Security*, a partir do
papel de quem pede. Um vendedor não lê a carteira do colega nem o financeiro da
empresa — nem forjando a requisição, porque o filtro não está no JavaScript.
As funções de papel (`eh_gestor`, `meu_vendedor_id`…) vivem no schema
`privado`, fora do alcance da API; só as policies as chamam.

**Numeração** fica na tabela `contadores`, entregue pela função
`reservar_numeros()`. O cliente reserva um bloco de 5 e serve dele — dois caixas
vendendo ao mesmo tempo nunca recebem o mesmo número. Sobra de bloco vira buraco
na sequência; é o preço de não repetir, e por isso o bloco é pequeno.

**Exclusão** é uma operação de verdade: sai da memória, sai do banco, some para
todo mundo. Antes ela existia só neste computador e voltava na sincronia
seguinte.

Migrações aplicadas: `supabase/MIGRACOES.md`.

## Backup

O servidor guarda tudo, mas uma cópia própria protege de engano na operação —
um "restaurar dados de exemplo" dado sem querer, por exemplo.

Em **Configurações → Backup & restauração** você baixa um `.json` com todas as
coleções. Restaurar **substitui os dados do servidor**, ou seja, afeta a equipe
inteira — o sistema avisa antes.


## Atalhos

- `/` ou `Ctrl+K` — busca global (leads, clientes, orçamentos, pedidos, produtos)
- `Esc` — fecha modal, drawer ou limpa a busca
