# Muhammad Tahir Hussain — Portfolio

Live: <https://muhammadtahirhussain-official.github.io/portfolio-v2/>

The site is styled as a code editor: file tabs, a status bar, a command palette (`Ctrl`/`⌘` + `K`).
Hand-written HTML, CSS and JavaScript; no framework, no build step.

## Projects update themselves

The Work section is **not** written in the HTML. On every visit the page asks the GitHub API for the
public repositories of `MuhammadTahirHussain-Official` and builds the list from the answer
(cached in the visitor's browser for 10 minutes).

So to change the site, change GitHub:

| You do this on GitHub | The site does this |
| --- | --- |
| Create a new public repo | It appears in the list, newest push first |
| Set the repo **description** | That sentence is shown in the preview |
| Set the repo **website** (homepage) | A "Live" button is added |
| Add **topics** | Up to three are shown as `#tags` |
| Add the topic `portfolio-hide` | The repo is left out |

Forks, archived repos and the portfolio repos themselves are skipped. The languages in the
Stack section and the repo count in the hero and status bar come from the same data.

Optional: for a nicer title, fallback text or a custom 3D shape, add an entry to `META` at the top of `js/main.js`.

## Run locally

```bash
python -m http.server 4174
```

## Design

- **Colour:** a syntax theme. Near-black background, neutral text, one accent (green) for anything
  "live" or interactive; blue, violet and pink appear only as syntax colours.
- **Type:** Geist (variable weight) and Geist Mono.
- **Interaction**
  - Portrait: the cursor is a lens showing the photo as live ASCII; a wireframe sphere turns behind it.
  - Letters thin out under the cursor.
  - Work: selecting a repo reshapes a rotating 3D point cloud and flips its title on a split-flap board.
  - Stack: a small neural network; tap a node and the signal fires forward.
  - Contact: a physics playground; grab, throw, tap empty space to blast.
- Respects `prefers-reduced-motion`.

## Files

| Path | Purpose |
| --- | --- |
| `index.html` | Structure |
| `css/style.css` | Theme and layout |
| `js/main.js` | GitHub sync and all interaction |
| `assets/vendor/` | GSAP 3.12.5, ScrollTrigger, Lenis 1.1.14, Matter.js 0.19.0 |
