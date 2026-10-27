import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULTS, buildDesign, artworkSvg, sheetSvg, pngDimensions } from './geometry.mjs';

test('default template has exact usable deck margin and physical SVG bounds', () => {
  const m = buildDesign();
  assert.equal(m.usable, 186);
  assert.equal(m.width, 140);
  assert.ok(m.height > 44 && m.height < 45);
  assert.match(artworkSvg(m), /width="140mm" height="44.352mm" viewBox="0 0 140 44.352"/);
});

test('nondefault fractional dimensions are retained as millimetres, not pixels', () => {
  const m = buildDesign({ width: '125.5', deck: '175.5', margin: '25', frame: '4' });
  assert.equal(m.usable, 125.5);
  assert.match(artworkSvg(m), /width="125.5mm"/);
  assert.deepEqual(pngDimensions(m), { width: 1506, height: 477 });
});

test('a stencil at the deck fit boundary is allowed; overhang is rejected', () => {
  assert.equal(buildDesign({ width: 180, deck: 200, margin: 10 }).width, 180);
  assert.throws(() => buildDesign({ width: 180.1, deck: 200, margin: 10 }), /wider than.*180 mm/);
});

test('A4 sheet keeps exact page units and independent calibration geometry', () => {
  const svg = sheetSvg(buildDesign({ width: 190, deck: 230, margin: 20 }));
  assert.match(svg, /width="210mm" height="297mm" viewBox="0 0 210 297"/);
  assert.match(svg, /translate\(10 72\)/);
  assert.match(svg, /M20 158H70/);
  assert.match(svg, /x="165" y="151" width="10" height="10"/);
  assert.match(svg, /100% \/ actual size/);
});

test('maker text cannot inject XML elements or attributes into the print sheet', () => {
  const svg = sheetSvg(buildDesign({ label: '<script a="x">&\'roll' }));
  assert.ok(!svg.includes('<script'));
  assert.match(svg, /&lt;script a=&quot;x&quot;&gt;&amp;&apos;roll/);
  assert.throws(() => buildDesign({ label: '\u0000' }), /unsupported characters/);
  assert.throws(() => buildDesign({ label: '\ud800' }), /unsupported characters/);
});

test('smallest template retains positive lens openings and support tabs', () => {
  const m = buildDesign({ width: 40, frame: 2 });
  assert.ok(m.eyeWidth - 2 * m.frame > 0);
  assert.ok(m.height - 2 * m.frame > 0);
  const svg = artworkSvg(m);
  assert.equal((svg.match(/width="2" height="2.2"/g) || []).length, 4);
});

test('thick frames cannot swallow the lens openings at small sizes', () => {
  assert.throws(() => buildDesign({ width: 40, frame: 10 }), /too thick/);
});

test('presets produce distinct original geometry with equal physical bounds', () => {
  const a = artworkSvg(buildDesign({ preset: 'block' }));
  const b = artworkSvg(buildDesign({ preset: 'step' }));
  assert.notEqual(a, b);
  assert.match(a, /viewBox="0 0 140 44.352"/);
  assert.match(b, /viewBox="0 0 140 44.352"/);
  assert.throws(() => buildDesign({ preset: '<other>' }), /listed preset/);
});

for (const [field, value] of [['width', 0], ['width', -1], ['width', 191], ['width', ''],
  ['width', Infinity], ['width', NaN], ['deck', 99], ['margin', -2], ['frame', 0]]) {
  test(`invalid ${field} ${String(value)} cannot generate an export`, () => {
    assert.throws(() => buildDesign({ [field]: value }), RangeError);
  });
}

test('label limit counts Unicode characters without corrupting emoji', () => {
  assert.match(sheetSvg(buildDesign({ label: '🛹'.repeat(42) })), /🛹/);
  assert.throws(() => buildDesign({ label: '🛹'.repeat(43) }), /42 characters/);
});

test('pure exports do not mutate inputs or defaults', () => {
  const raw = { width: 150, label: 'Roll' };
  const before = structuredClone(raw);
  const m = buildDesign(raw);
  artworkSvg(m); sheetSvg(m); pngDimensions(m);
  assert.deepEqual(raw, before);
  assert.equal(DEFAULTS.width, 140);
});
