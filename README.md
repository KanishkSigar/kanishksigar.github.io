# kanishksigar.github.io

Personal site of **Kanishk Sigar**. Two sides on one domain: the work, and everything else.

🌐 **Live site:** [kanishksigar.me](https://kanishksigar.me)

## Routes

| Route | What it is |
| --- | --- |
| `/` | Landing page. A ruled index with two doors: tech or life. |
| `/tech` | The portfolio. Projects, experience, certifications, resume. Canonical URL, safe to put on a resume. |
| `/life` | Writing, books, and the things that don't belong on a resume. Under construction. |

The project sites (`/lexmap`, `/argonvault`, `/gitpulse`) are separate repos with their own GitHub Pages deploys. They mount under the same custom domain automatically and are not built here.

## Stack

- [Astro](https://astro.build) static build
- Plain CSS, hand written. No Tailwind, no component framework.
- Plus Jakarta Sans on `/tech`, Spectral on the landing and `/life`
- GitHub Pages, deployed by GitHub Actions

The two sides are meant to look nothing like each other. `/tech` is deep teal, sans serif, card based, built to be scanned. `/life` is paper, serif, one column, built to be read. The landing sits between them in plain monochrome.

Each room has its own accent, and the KS mark takes the colour of the room it is in:

| Room | Ground | Accent |
| --- | --- | --- |
| `/` | `#0E0E0F` | none, by design |
| `/tech` | `#16323B` | `#00887A` teal |
| `/life` | `#E9E7DE` paper, `#12140F` dark | `#4F6B3E` moss |

The mark itself lives in `src/components/Mark.astro`, and its favicons are generated per room from `src/consts.ts`. Change the logo in those two files and it changes everywhere.

## Structure

```
.
├── astro.config.mjs
├── src/
│   ├── components/
│   │   ├── Portfolio.astro    # the whole /tech page
│   │   └── Mark.astro         # the KS logo, used everywhere
│   ├── consts.ts              # accent colours, per room favicons
│   ├── layouts/
│   │   └── Life.astro         # serif, paper, one column
│   └── pages/
│       ├── index.astro        # landing
│       ├── tech.astro         # renders Portfolio
│       └── life/index.astro
├── public/                    # served at the domain root
│   ├── style.css              # /tech styles
│   ├── script.js              # /tech nav, scroll, animations
│   ├── profile.pdf            # resume
│   ├── profile.png
│   ├── og-image.png
│   └── CNAME
└── .github/workflows/deploy.yml
```

## Local development

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # outputs to dist/
npm run preview  # serve the build
```

## Deploying

Push to `main`. The Actions workflow builds the site and publishes `dist/` to GitHub Pages.

Two things worth knowing if you touch the Pages settings:

- The custom domain is stored in Pages config, **not** read from `public/CNAME`. Actions based deploys ignore the CNAME file. Clearing the domain in settings takes the whole site down, project sites included.
- Literal `{` and `}` in `.astro` files are parsed as expressions. Escape them as `&#123;` and `&#125;` (the Lively code block in `Portfolio.astro` does this).

## Contact

- Email: kanishksigar@gmail.com
- LinkedIn: [linkedin.com/in/kanishk-sigar](https://www.linkedin.com/in/kanishk-sigar)
- GitHub: [@KanishkSigar](https://github.com/KanishkSigar)
