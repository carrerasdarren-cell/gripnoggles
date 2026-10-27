# GripNoggles

An original, free browser tool for making Nounish skateboard griptape stencils. Created for the [Gnars × Nouns coding challenge](https://www.gnars.com/community/bounties/sopa/0).

**[Open the maker](https://carrerasdarren-cell.github.io/gripnoggles/)** · [Short demo](https://carrerasdarren-cell.github.io/gripnoggles/demo.webm)

Gnars brings the skate use case; Nouns inspires the geometric glasses. Measure your deck, leave an edge clearance, choose one of two original frame patterns, and export a template with real millimetre dimensions. Small support tabs keep the lens islands attached to a paper stencil. No wallet, account, uploads, dependencies or backend are needed to use the tool.

## Use

1. Enter your deck width and the clearance to leave on each side.
2. Set the stencil width and frame thickness. An oversized or invalid design blocks exports until corrected.
3. Download the **stencil SVG**, **A4 print sheet**, or **PNG preview**.
4. Print the A4 SVG at **100% / actual size**, with fit-to-page turned off. Measure the 50 mm ruler and 10 mm square before using the pattern. Start with a paper test.

Black areas are cut away; white areas and the small support tabs remain. A4 sheets are 210 × 297 mm. The design width is limited to 190 mm to retain at least 10 mm of page margin. Deck fit is a simple width check, not a 3D deck contour or cutting-machine model.

SVG retains physical dimensions. PNG exports at 12 pixels per millimetre for a digital preview; it does **not** establish a printer's output scale or DPI metadata.

## Run locally

Serve this directory with any static HTTP server, for example:

```sh
python3 -m http.server 18765 --bind 127.0.0.1
```

Open `http://127.0.0.1:18765/` in a modern browser. ES modules require HTTP rather than opening `index.html` directly as a local file. GitHub Pages serves the same static files.

## Validation

```sh
node --test geometry.test.mjs
node --check app.mjs
```

The 19 geometry tests cover physical SVG bounds, fractional dimensions, A4 calibration geometry, exact deck-fit boundaries, small openings and support tabs, invalid measurements, and XML-safe maker labels. An independent AI source review found no blocking defect; it is not human validation.

Actual Chrome workflow checks exercised changed measurements, rejected overhangs, corrected dimensions, both presets, custom text, reset and downloads. The actual downloaded 180 mm Step SVG retained `180mm × 57.024mm`; its A4 sheet retained `210mm × 297mm` and escaped `Gnars & Nouns <roll>` correctly. The downloaded PNG was nonblank and measured **2160 × 684 pixels**. [Example A4 export](./example-a4.svg) · [Example PNG export](./example-preview.png).

Physical printing/cutting, native phone browsers and other browser engines have not been tested. Browser print settings, paper and cutter accuracy remain the maker's responsibility. The demo video is assembled from actual Chrome demonstration frames; it is not a claim of continuous screen recording or a physical stencil test.

## Files and authorship

- `geometry.mjs`: pure dimension validation and original SVG templates.
- `app.mjs`: browser controls and Blob/canvas exports.
- `index.html` / `styles.css`: responsive, keyboard-accessible UI.
- `geometry.test.mjs`: deterministic geometry and validation checks.

Created specifically for this challenge by Darren (`@carrerasdarren-cell`) with Codex assistance. The geometry and implementation are original; no third-party logo, font, image or runtime library is bundled. Independent community contribution, licensed under MIT. Submission, team approval and any reward are separate states.
