/* Testes das utilidades puras. Rodar: node tests/pure.test.mjs
   Sem framework: usa node:assert. Sai com código !=0 se algo falhar. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const PP = require('../pure.js');

let pass = 0, fail = 0;
function test(nome, fn) {
  try { fn(); pass++; console.log('  ✓', nome); }
  catch (e) { fail++; console.error('  ✗', nome, '\n    ', e.message); }
}

console.log('Telefone');
test('normalizePhone tira máscara', () => assert.equal(PP.normalizePhone('(19) 99812-4471'), '19998124471'));
test('isValidPhoneBR aceita celular (11)', () => assert.equal(PP.isValidPhoneBR('(19) 99812-4471'), true));
test('isValidPhoneBR aceita fixo (10)', () => assert.equal(PP.isValidPhoneBR('1938213000'), true));
test('isValidPhoneBR rejeita curto', () => assert.equal(PP.isValidPhoneBR('99812'), false));
test('isValidPhoneBR ignora DDI 55', () => assert.equal(PP.isValidPhoneBR('5519998124471'), true));
test('formatPhoneBR celular', () => assert.equal(PP.formatPhoneBR('19998124471'), '(19) 99812-4471'));
test('formatPhoneBR fixo', () => assert.equal(PP.formatPhoneBR('1938213000'), '(19) 3821-3000'));
test('formatPhoneBR parcial não quebra', () => assert.equal(PP.formatPhoneBR('199'), '(19) 9'));
test('phoneKeyPure remove DDI p/ dedup', () => assert.equal(PP.phoneKeyPure('+55 (19) 99812-4471'), '19998124471'));
test('phoneKeyPure iguala com e sem máscara', () =>
  assert.equal(PP.phoneKeyPure('(19) 99812-4471'), PP.phoneKeyPure('19998124471')));

console.log('CSV');
test('csvCell escapa ; e aspas', () => assert.equal(PP.csvCell('a;"b"'), '"a;""b"""'));
test('csvCell não mexe em vírgula', () => assert.equal(PP.csvCell('Ibiza 6,0m'), 'Ibiza 6,0m'));
test('toCSV tem BOM + cabeçalho', () => {
  const csv = PP.toCSV(['A', 'B'], [['1', '2']]);
  assert.equal(csv.charCodeAt(0), 0xFEFF);
  assert.ok(csv.includes('A;B'));
  assert.ok(csv.includes('1;2'));
});
test('parseCSV round-trip', () => {
  const csv = PP.toCSV(['Nome', 'Tel'], [['Ana', '(19) 90000-0000'], ['Bob; o', 'x']]);
  const rows = PP.parseCSV(csv);
  assert.equal(rows.length, 3);              // cabeçalho + 2
  assert.deepEqual(rows[0], ['Nome', 'Tel']);
  assert.equal(rows[2][0], 'Bob; o');        // aspas/sep preservados
});
test('parseCSV aceita vírgula como separador', () => {
  const rows = PP.parseCSV('nome,telefone\nAna,199');
  assert.deepEqual(rows[1], ['Ana', '199']);
});

console.log(`\n${pass} passaram, ${fail} falharam`);
process.exit(fail ? 1 : 0);
