# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Static marketing site for LBC Supported Living Services (supported accommodation for **adults aged 18+**, 79 Watford Way, Hendon). Plain HTML/CSS/JS: no framework, no package.json, no build step, no tests, no linter. Content is UK English.

Content rules set by the owner:
- Never use the word "young" (say "people", "person", "adults" or "service users"). No under-18 content: no Childline, no school or children's services references.
- The regulator is **CQC** (five key questions: safe, effective, caring, responsive, well-led), never Ofsted.
- Logo text is "Living by Choice" with the tagline "Growing with confidence". Nav labels are "Service Users" (→ `young-people.html`) and "Get in touch" (→ `contact.html`); file names and `data-nav` ids keep their old names on purpose.
- No small eyebrow labels above headings (`.kicker` was removed everywhere; don't add it back). Office hours are Monday to Friday, 9am to 5pm.

## Commands

- **Preview:** open any `.html` file directly in a browser, or serve the folder with any static server.
- **Deploy (Vercel):** `vercel deploy --prod --yes` from the repo root. Project `lbc5/lbc-supportive-living`, live at https://lbc-supportive-living.vercel.app. GitHub auto-deploy is not connected yet, so deploy manually after pushing.
- **Git:** remote is https://github.com/SyedRaza517/lbc_supportive_living (branch `main`). On this machine Git was installed mid-session; if `git` is not on PATH, use `& "$env:ProgramFiles\Git\cmd\git.exe"`.
- `.vercel/` and `.env*` (Vercel OIDC token) are gitignored. Never commit them.

## Architecture

**Every page duplicates the shared chrome.** The topline, header (desktop `.nav` with dropdown `.sub` menus *and* a separate `#mobileNav` with `<details class="m-sub">`), footer, accessibility panel, chat panel, modal, toast, and the inline `window.LBC_PHOTOS = {...}` script are copied verbatim into all 19 HTML files. A change to navigation, footer, or photo metadata must be applied to every file, and nav changes must be made in both the desktop and mobile menus. (`stories.html` is currently only in the mobile nav and footer.) The desktop nav only fits at ≥1440px; below that the header switches to the Menu button so the full logo always shows.

**Bulk text edits:** when scripting replacements in PowerShell, a hashtable value of `@( @('a','b') )` with a single pair gets flattened into two strings, and iterating it replaces single characters across the file. Wrap single pairs with the comma operator (`,@('a','b')`) and check the `git diff --stat` afterwards.

**One script, driven by data attributes.** `assets/site.js` is a single IIFE that wires up features by looking for hooks in the page, so each feature only activates on pages containing its markup:
- `data-mailform="Subject"` forms, `data-wizard` (5-step referral form), `data-request` (document request buttons): there is no backend. Everything ends in `mailModal()`, which opens a `mailto:` link to `info@lbcsupportedliving.com` plus a copy-text fallback. Form row labels come from the `<label for>` text; checkbox groups are keyed by `name`.
- `data-finder` (service finder), `data-room` (SVG house map → modal), `data-gfilters`/`data-gallery`, `data-sfilters`, `data-week`, `data-jobs`, `data-vacancy`, `data-why`, `.reveal`, `.more-btn`.
- Much of the visible content lives in JS arrays in site.js, not the HTML: `DAY` (home "day in the life"), `STORIES` (rendered into `[data-stories]`), `FQ` + `fResult()` (finder logic), `ROOMS`, `WEEK`, `JOBS`, and `KB` (keyword-matching chat answers). `OPPS`/`data-opp` is legacy: the opportunity cards now link to the `yp-*.html` pages.
- `VACANCIES` at the top of site.js is the single switch for vacancy widgets site-wide (`available: null` shows "Ask about current vacancies").
- `photo(key)` builds `<figure class="ph">` with Unsplash credit from `window.LBC_PHOTOS`; keys must exist in that inline object on the page.
- Icons use Lucide (`<i data-lucide="name">`, loaded from unpkg, pinned to 0.344.0); call `icons()` after injecting HTML that contains them.
- Site-wide enhancements at the end of site.js inject their own elements (no HTML changes needed): reading-progress bar, header `.scrolled` shadow, back-to-top button, scroll-reveal (adds `data-anim` + `html.anim`, then removes `data-anim` after the element arrives so hover transitions work again), dashboard count-up, arrow-key tab navigation, `.jump` scrollspy, slider arrows, photo lightbox for `[data-gallery]`/`.slider` images, a red "Quick exit" button on `young-people`/`yp-*` pages, hero effects (`.rotate[data-words]` cycling word, Ken Burns zoom, pointer parallax, injected `.hero-blobs`), pointer spotlight (`.spot`) and 3D tilt (`.tilt`, on `.reveal`/`.opp`) for mouse users only, button ripples, an animated rule under every `.sec-head h2`, and a dark-mode toggle (`A.theme` → `data-theme` on `<html>`) in the accessibility panel. The referral wizard keeps an unsent draft in `sessionStorage` (`lbc-referral-draft`), excluding the declaration and files, and clears it on submit. Everything is skipped under `prefers-reduced-motion`.
- All functions share one IIFE scope with `var`, so new top-level names must not collide with existing ones (e.g. `bar`, `next`, `prev`, `steps` are already used).
- `single` mode: when a document contains multiple `.page` sections, site.js acts as a hash router (single-file preview build). The deployed multi-page site has one `.page` per file; links built in JS use `L()`/`single` to work in both modes.

**CSS** (`assets/site.css`): palette is indigo-violet (`--navy` #2E2167, `--grad`), coral (`--marker`, `--grad-warm`), mint (`--teal`) and sunshine (`--sun`). The logo/favicon SVGs and `theme-color` in every HTML file hardcode `#2E2167` and `#FF8B5E`, so change those too if the palette changes. Design tokens on `:root`, redefined for dark mode under both `@media (prefers-color-scheme: dark) :root:not([data-theme="light"])` and `:root[data-theme="dark"]`. Keep the two dark blocks in sync. Accessibility modes are classes on `<html>` (`hc`, `ul`, `spaced`) toggled by the a11y panel and saved in `localStorage` key `lbc-a11y`. The file has later override sections appended at the bottom ("v3 components", dropdown menus), so check the end of the file before assuming a rule is final.

**Page templates:** inner pages use `.phead` (crumbs, h1, lead, `.jump` in-page links, photo) followed by `.sec` sections (`.white`, `.band` = navy). The eight `yp-*.html` pages share one identical template and differ only in content. Each page has its own `<title>`, description, canonical and OG tags pointing to `https://lbcsupportedliving.com/`; only `index.html` has JSON-LD.

## Placeholder conventions

Unconfirmed facts are marked `<span class="todo">…</span>`, and sample content is marked `.example-flag` ("Example · replace before launch"): stories, jobs, family quotes. All photos are Unsplash stock with visible credits until real photos of the house exist. Don't invent facts (names, dates, Ofsted URN, age range, outcome figures) to replace placeholders; ask.
