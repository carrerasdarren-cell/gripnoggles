import { DEFAULTS, buildDesign, artworkSvg, sheetSvg, pngDimensions } from './geometry.mjs';

const form = document.querySelector('#design-form');
const preview = document.querySelector('#preview');
const invalidPreview = document.querySelector('#invalid-preview');
const errorMessage = document.querySelector('#design-error');
const exportStatus = document.querySelector('#export-status');
const exportButtons = [...document.querySelectorAll('[data-export]')];
const pngButton = document.querySelector('#download-png');
const fields = ['width', 'deck', 'margin', 'frame', 'preset', 'label'];
let currentDesign = null;
let pngBusy = false;

const numberText = value => Number(value.toFixed(2)).toString();
const fileStem = model => `gripnoggles-${model.preset}-${numberText(model.width)}mm`;

function updateExportButtons() {
  for (const button of exportButtons) button.disabled = !currentDesign || (button === pngButton && pngBusy);
}

function render() {
  exportStatus.textContent = '';
  try {
    const raw = Object.fromEntries(fields.map(name => [name, form.elements.namedItem(name).value]));
    const model = buildDesign(raw);
    currentDesign = model;
    preview.innerHTML = sheetSvg(model);
    preview.hidden = false;
    invalidPreview.hidden = true;
    errorMessage.hidden = true;
    errorMessage.textContent = '';
    document.querySelector('#dimensions').textContent = `${numberText(model.width)} × ${numberText(model.height)} mm`;
    document.querySelector('#usable').textContent = `${numberText(model.usable)} mm`;
    const pixels = pngDimensions(model);
    document.querySelector('#png-size').textContent = `${pixels.width} × ${pixels.height}`;
  } catch (error) {
    currentDesign = null;
    preview.replaceChildren();
    preview.hidden = true;
    invalidPreview.hidden = false;
    errorMessage.textContent = error instanceof Error ? error.message : 'Check your measurements before exporting.';
    errorMessage.hidden = false;
    for (const id of ['dimensions', 'usable', 'png-size']) document.querySelector(`#${id}`).textContent = '—';
  }
  updateExportButtons();
}

function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  // Keep the Blob available while the browser starts the download.
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

function downloadSvg(kind) {
  if (!currentDesign) return;
  const model = currentDesign;
  try {
    const svg = kind === 'sheet' ? sheetSvg(model) : artworkSvg(model);
    download(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), `${fileStem(model)}${kind === 'sheet' ? '-A4' : ''}.svg`);
    exportStatus.textContent = kind === 'sheet' ? 'A4 sheet download started. Print at 100% and check the calibration line.' : 'Stencil SVG download started. Its width and height are in millimetres.';
  } catch {
    exportStatus.textContent = 'The SVG could not be prepared. Please try again.';
  }
}

async function downloadPng() {
  if (!currentDesign || pngBusy) return;
  const model = currentDesign;
  const sourceUrl = URL.createObjectURL(new Blob([artworkSvg(model)], { type: 'image/svg+xml;charset=utf-8' }));
  pngBusy = true;
  updateExportButtons();
  exportStatus.textContent = 'Preparing PNG preview…';
  try {
    const image = new Image();
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error('The SVG preview could not be loaded.'));
      image.src = sourceUrl;
    });
    const size = pngDimensions(model);
    const canvas = document.createElement('canvas');
    canvas.width = size.width;
    canvas.height = size.height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas is unavailable in this browser.');
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve, reject) => canvas.toBlob(result => result ? resolve(result) : reject(new Error('PNG export is unavailable.')), 'image/png'));
    download(blob, `${fileStem(model)}-${size.width}x${size.height}.png`);
    exportStatus.textContent = `PNG download started: ${size.width} × ${size.height} pixels. Use SVG for physical print dimensions.`;
  } catch (error) {
    exportStatus.textContent = `${error instanceof Error ? error.message : 'PNG export failed.'} Try the SVG download instead.`;
  } finally {
    URL.revokeObjectURL(sourceUrl);
    pngBusy = false;
    updateExportButtons();
  }
}

form.addEventListener('submit', event => event.preventDefault());
form.addEventListener('input', render);
form.addEventListener('change', render);
document.querySelector('#download-svg').addEventListener('click', () => downloadSvg('stencil'));
document.querySelector('#download-sheet').addEventListener('click', () => downloadSvg('sheet'));
pngButton.addEventListener('click', downloadPng);
document.querySelector('#reset').addEventListener('click', () => {
  for (const name of fields) form.elements.namedItem(name).value = DEFAULTS[name];
  render();
  exportStatus.textContent = 'Default stencil restored.';
});
render();
