/* ============================================================
   PiscinaPro — Utilidades puras (sem DOM), testáveis em Node.
   UMD: no navegador vira window.PP; no Node, module.exports.
   ============================================================ */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PP = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ---- Telefone (BR) ---- */
  function normalizePhone(s) { return String(s == null ? '' : s).replace(/\D/g, ''); }
  // aceita 10 (fixo) ou 11 (celular) dígitos; ignora DDI 55 opcional
  function isValidPhoneBR(s) {
    let d = normalizePhone(s);
    if (d.length === 12 || d.length === 13) d = d.replace(/^55/, '');
    return d.length === 10 || d.length === 11;
  }
  function formatPhoneBR(s) {
    let d = normalizePhone(s);
    if (d.length > 11 && d.startsWith('55')) d = d.slice(2);
    d = d.slice(0, 11);
    if (d.length <= 2) return d.length ? '(' + d : '';
    const ddd = d.slice(0, 2);
    const rest = d.slice(2);
    if (rest.length <= 4) return `(${ddd}) ${rest}`;
    if (rest.length <= 8) return `(${ddd}) ${rest.slice(0, rest.length - 4)}-${rest.slice(-4)}`;
    // 9 dígitos (celular): 5 + 4
    return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5, 9)}`;
  }
  // chave de comparação p/ deduplicação (só dígitos, sem DDI)
  function phoneKeyPure(s) {
    let d = normalizePhone(s);
    if ((d.length === 12 || d.length === 13) && d.startsWith('55')) d = d.slice(2);
    return d;
  }

  /* ---- CSV (separador ';' + BOM p/ Excel pt-BR) ---- */
  function csvCell(v) {
    const s = (v == null) ? '' : String(v);
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }
  function toCSV(headers, rows) {
    const head = headers.map(csvCell).join(';');
    const body = rows.map(r => r.map(csvCell).join(';')).join('\r\n');
    return '﻿' + head + '\r\n' + body;
  }
  // parser simples de CSV (aceita ';' ou ',' como separador; lida com aspas)
  function parseCSV(text) {
    const clean = String(text || '').replace(/^﻿/, '');
    const rows = [];
    let row = [], cell = '', q = false;
    const sep = (clean.split('\n')[0].split(';').length >= clean.split('\n')[0].split(',').length) ? ';' : ',';
    for (let i = 0; i < clean.length; i++) {
      const c = clean[i];
      if (q) {
        if (c === '"') { if (clean[i + 1] === '"') { cell += '"'; i++; } else q = false; }
        else cell += c;
      } else if (c === '"') q = true;
      else if (c === sep) { row.push(cell); cell = ''; }
      else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
      else if (c === '\r') { /* ignora */ }
      else cell += c;
    }
    if (cell.length || row.length) { row.push(cell); rows.push(row); }
    return rows.filter(r => r.some(x => x.trim() !== ''));
  }

  return { normalizePhone, isValidPhoneBR, formatPhoneBR, phoneKeyPure, csvCell, toCSV, parseCSV };
});
