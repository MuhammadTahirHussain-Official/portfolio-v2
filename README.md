# Tahir Hussain — Portfolio v2

A second, separate take on the portfolio. Hand-written HTML, CSS and JavaScript; no framework, no build step.

## Run locally

```bash
python -m http.server 4174
```

Open <http://localhost:4174>. (Opening `index.html` straight from disk works too, but the browser then blocks the portrait lens effect.)

## Design

- **Colour:** three colours sampled from the portrait — paper `#eceae3` (the knit), ink `#0c1024` (the blazer) and one saturated blue `#2436ff`.
- **Type:** Bricolage Grotesque (variable weight and width) and DM Mono.
- **Motion**
  - Letters change weight and width under the cursor, with a thin ripple that keeps travelling.
  - The cursor is a lens over the portrait that shows the photo as live ASCII.
  - The name passes behind the portrait and continues as an outline across it.
  - The statement is "generated" one token at a time as you scroll.
  - Projects: a rotating 3D point cloud reshapes for each one (bar chart, globe, the word "next", a storm funnel, a paper plane) while the title flips on a split-flap board.
  - Toolkit: a small neural network. Tap a node and the signal fires forward layer by layer; it also fires on its own.
  - The contact section is a physics playground: every chip has weight, can be grabbed and thrown, and a tap on empty space sends a shockwave (Matter.js).
  - The portrait dissolves into ASCII along its lower edge, with a dashed halo turning behind it.
  - The cursor is an arrow that turns to face its direction of travel; link arrows are a custom pixel glyph.
- Respects `prefers-reduced-motion` (falls back to a plain static page).

## Files

| Path | Purpose |
| --- | --- |
| `index.html` | Content |
| `css/style.css` | Tokens and layout |
| `js/main.js` | All interaction |
| `assets/vendor/` | GSAP 3.12.5, ScrollTrigger, Lenis 1.1.14, Matter.js 0.19.0 |
