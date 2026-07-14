# kanishksigar.github.io

Personal site of **Kanishk Sigar**. Two sides on one domain: the work, and everything else.

🌐 **Live site:** [kanishksigar.me](https://kanishksigar.me)

## Routes

| Route | What it is |
| --- | --- |
| `/` | Landing page. Two doors: tech or life. |
| `/tech` | The portfolio. Projects, experience, certifications, resume. Canonical URL, safe to put on a resume. |
| `/life` | Writing, books, and the things that don't belong on a resume. Under construction. |

The project sites (`/lexmap`, `/argonvault`, `/gitpulse`) are separate repos with their own GitHub Pages deploys. They mount under the same custom domain automatically and are not built here.

## Stack

- [Astro](https://astro.build) static build
- Plain CSS, hand written. No Tailwind, no component framework.
- Plus Jakarta Sans on `/tech`, Spectral on `/life`
- GitHub Pages, deployed by GitHub Actions

The two sides are meant to look nothing like each other. `/tech` is navy, sans serif, card based, built to be scanned. `/life` is paper, serif, one column, built to be read. The star mark in the corner is the only thing they share.

## Structure

```
.
├── astro.config.mjs
├── src/
│   ├── components/
│   │   └── Portfolio.astro    # the whole /tech page
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
