import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
const source = await readFile(new URL('../src/lib.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText;
const { bucharestToISO, addWeeks, dateKey } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`
);
test('weekly workshops retain 18:00 in Romania over the autumn DST change', () => {
  assert.equal(bucharestToISO('2026-10-22T18:00'), '2026-10-22T15:00:00.000Z');
  assert.equal(bucharestToISO(addWeeks('2026-10-22T18:00', 1)), '2026-10-29T16:00:00.000Z');
});
test('rejects nonexistent local times during the spring DST transition', () => {
  assert.throws(() => bucharestToISO('2026-03-29T03:30'), /Ora aleasă nu există/);
  assert.equal(bucharestToISO('2026-03-29T04:30'), '2026-03-29T01:30:00.000Z');
});
test('calendar groups UTC events by their Romanian local date', () => {
  assert.equal(dateKey('2026-09-06T22:00:00Z'), '2026-09-07');
});
