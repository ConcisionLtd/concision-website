import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { renderHtml } from '../../plugins/htmlPartials.js';

const root = path.resolve(import.meta.dirname, 'fixtures');
const data = { company: { legalName: 'Concision Ltd' }, build: { year: '2026' } };
const render = (html) => renderHtml(html, { root, data });

test('replaces an include directive with the partial contents', () => {
  const output = render('<body><!-- @include partials/inner.html --></body>');
  assert.equal(output, '<body><span>inner</span></body>');
});

test('resolves includes nested inside partials', () => {
  const output = render('<!-- @include partials/outer.html -->');
  assert.equal(output, '<div><span>inner</span></div>');
});

test('substitutes placeholders inside included partials', () => {
  const output = render('<!-- @include partials/footer.html -->');
  assert.equal(output, '<footer>Concision Ltd</footer>');
});

test('substitutes dotted placeholders in the page itself, with or without inner spaces', () => {
  const output = render('<p>{{ build.year }} {{company.legalName}}</p>');
  assert.equal(output, '<p>2026 Concision Ltd</p>');
});

test('fails on a missing partial, naming the file', () => {
  assert.throws(() => render('<!-- @include partials/nope.html -->'), /partials\/nope\.html/);
});

test('fails on a circular include', () => {
  assert.throws(() => render('<!-- @include partials/cycle-a.html -->'), /Circular include/);
});

test('fails on an unknown placeholder', () => {
  assert.throws(
    () => render('{{ company.missing }}'),
    /Unknown placeholder: \{\{ company\.missing \}\}/
  );
});

test('fails when a placeholder resolves to an object rather than a value', () => {
  assert.throws(() => render('{{ company }}'), /Unknown placeholder/);
});
