/* Diario local de alteracoes ainda nao confirmadas pelo servidor. */
(function () {
'use strict';
const PP = window.PP;
const BANCO = 'piscinapro-pendencias';
const LOJA = 'filas';
let abertura;

function abrir() {
  if (!('indexedDB' in window)) return Promise.reject(new Error('IndexedDB indisponivel neste navegador.'));
  if (!abertura) abertura = new Promise((resolve, reject) => {
    const req = indexedDB.open(BANCO, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(LOJA);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('Nao foi possivel abrir o diario local.'));
  });
  return abertura;
}

async function transacao(chave, modo, acao) {
  const banco = await abrir();
  return new Promise((resolve, reject) => {
    const tx = banco.transaction(LOJA, modo);
    const req = acao(tx.objectStore(LOJA), chave);
    tx.oncomplete = () => resolve(req.result);
    tx.onerror = () => reject(tx.error || req.error || new Error('Falha no diario local.'));
    tx.onabort = () => reject(tx.error || new Error('Diario local interrompido.'));
  });
}

PP.jornal = {
  ler: chave => transacao(chave, 'readonly', (loja, k) => loja.get(k)),
  salvar: (chave, valor) => transacao(chave, 'readwrite', (loja, k) => loja.put(valor, k)),
  apagar: chave => transacao(chave, 'readwrite', (loja, k) => loja.delete(k))
};
})();
