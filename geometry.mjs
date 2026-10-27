export const DEFAULTS = Object.freeze({
  width: 140, deck: 210, margin: 12, frame: 5,
  preset: 'block', label: 'Made to roll',
});

const num = (value) =>
  (typeof value === 'number' || (typeof value === 'string' && value.trim() !== ''))
    ? Number(value) : NaN;
const f = (value) => String(Number(value.toFixed(4)));
const xml = (value) => String(value).replace(/[&<>"']/g,
  (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char]);

export function buildDesign(raw = {}) {
  const values = { ...DEFAULTS, ...raw };
  const width = num(values.width);
  const deck = num(values.deck);
  const margin = num(values.margin);
  const frame = num(values.frame);
  const label = String(values.label);
  const errors = [];
  const range = (value, min, max, name) => {
    if (!Number.isFinite(value) || value < min || value > max)
      errors.push(`${name} must be between ${min} and ${max} mm.`);
  };
  range(width, 40, 190, 'Stencil width');
  range(deck, 100, 300, 'Deck width');
  range(margin, 0, 40, 'Edge clearance');
  range(frame, 2, 10, 'Frame thickness');
  if (!['block', 'step'].includes(values.preset)) errors.push('Choose a listed preset.');
  if (Array.from(label).length > 42) errors.push('Maker label must be 42 characters or fewer.');
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/u.test(label) ||
      label.toWellFormed() !== label) errors.push('Maker label contains unsupported characters.');

  const gap = width * 0.12;
  const eyeWidth = (width - gap) / 2;
  const height = eyeWidth * 0.72;
  const usable = deck - margin * 2;
  if (Number.isFinite(width) && Number.isFinite(usable) && width > usable + 0.000001)
    errors.push(`Stencil is wider than the ${f(usable)} mm usable deck area. Reduce width or clearance.`);
  if (Number.isFinite(frame) && Number.isFinite(height) && frame > height / 4)
    errors.push(`Frame is too thick at this size. Use ${f(height / 4)} mm or less.`);
  if (errors.length) throw new RangeError(errors.join(' '));
  return Object.freeze({ width, deck, margin, frame, preset: values.preset, label,
    gap, eyeWidth, height, usable, tab: 2 });
}

function shape(m) {
  const { eyeWidth: w, height: h, frame: t, gap, tab } = m;
  const eye = (x) => {
    const outer = m.preset === 'step'
      ? `<path d="M${f(x + t)} 0H${f(x + w - t)}V${f(t)}H${f(x + w)}V${f(h - t)}H${f(x + w - t)}V${f(h)}H${f(x + t)}V${f(h - t)}H${f(x)}V${f(t)}H${f(x + t)}Z"/>`
      : `<rect x="${f(x)}" width="${f(w)}" height="${f(h)}"/>`;
    return `${outer}<rect fill="white" x="${f(x + t)}" y="${f(t)}" width="${f(w - 2 * t)}" height="${f(h - 2 * t)}"/>
      <rect fill="white" x="${f(x + w / 2 - tab / 2)}" y="0" width="${tab}" height="${f(t + 0.2)}"/>
      <rect fill="white" x="${f(x + w / 2 - tab / 2)}" y="${f(h - t - 0.2)}" width="${tab}" height="${f(t + 0.2)}"/>`;
  };
  return `<g fill="black">${eye(0)}${eye(w + gap)}<rect x="${f(w - 0.05)}" y="${f((h - t) / 2)}" width="${f(gap + 0.1)}" height="${f(t)}"/></g>`;
}

export function artworkSvg(m) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${f(m.width)}mm" height="${f(m.height)}mm" viewBox="0 0 ${f(m.width)} ${f(m.height)}" role="img" aria-labelledby="stencil-title stencil-desc">
    <title id="stencil-title">GripNoggles ${xml(m.preset)} cut template</title>
    <desc id="stencil-desc">${f(m.width)} by ${f(m.height)} millimetres. Black areas are cut away; white support tabs keep lens islands attached. Original geometric Nounish pattern.</desc>
    <rect width="100%" height="100%" fill="white"/>${shape(m)}
  </svg>`;
}

export function sheetSvg(m) {
  const left = (210 - m.width) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="210mm" height="297mm" viewBox="0 0 210 297" role="img" aria-labelledby="sheet-title sheet-desc">
    <title id="sheet-title">GripNoggles A4 print sheet</title>
    <desc id="sheet-desc">Printable ${f(m.width)} millimetre wide cut template, maker label, fifty millimetre calibration ruler and ten millimetre square.</desc>
    <rect width="210" height="297" fill="white"/>
    <g fill="black" font-family="Arial, sans-serif">
      <text x="20" y="22" font-size="8" font-weight="bold">GripNoggles</text>
      <text x="20" y="30" font-size="3.5">A little Nounish geometry. Made for your grip.</text>
      <text x="20" y="42" font-size="4">${xml(m.label)}</text>
      <text x="20" y="52" font-size="3">${f(m.width)} × ${f(m.height)} mm · ${xml(m.preset)} · ${f(m.frame)} mm frame</text>
      <text x="20" y="58" font-size="3">Deck ${f(m.deck)} mm · edge clearance ${f(m.margin)} mm each side</text>
    </g>
    <g transform="translate(${f(left)} 72)">${shape(m)}</g>
    <g fill="none" stroke="black" stroke-width="0.25">
      <path d="M20 158H70 M20 155V161 M30 156V160 M40 156V160 M50 156V160 M60 156V160 M70 155V161"/>
      <rect x="165" y="151" width="10" height="10"/>
    </g>
    <g fill="black" font-family="Arial, sans-serif" font-size="3">
      <text x="20" y="168">Measure this line: exactly 50 mm</text>
      <text x="160" y="168">10 × 10 mm</text>
      <text x="20" y="190" font-weight="bold">Print A4 at 100% / actual size. Turn off fit-to-page.</text>
      <text x="20" y="198">Check both calibration marks before using the template.</text>
      <text x="20" y="210">Black = cut away. White = keep. The small white support tabs</text>
      <text x="20" y="216">keep the lens islands attached. Start with a paper test.</text>
      <text x="20" y="232">A digital template, not a verified physical print or cutting result.</text>
      <text x="20" y="274">An original open-source tool connecting Gnars skate culture and Nouns.</text>
      <text x="20" y="280">Independent community contribution. No wallet or account needed.</text>
    </g>
  </svg>`;
}

export function pngDimensions(m, scale = 12) {
  if (!Number.isFinite(scale) || scale < 1 || scale > 24) throw new RangeError('Invalid pixel scale.');
  return { width: Math.round(m.width * scale), height: Math.round(m.height * scale) };
}
