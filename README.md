# Bluegram

**Instagram for Earth systems** — a 3D globe explorer that surfaces statistically validated regional trends from NASA data: what is changing, where, how much, and whether it is significant.

![Bluegram banner](web/public/banner.png)

## Description

NASA and partner agencies publish vast Earth observation archives, but most people never get a clear, regional answer to four basic questions: **what** is changing, **where**, **how much**, and **is it significant?** Dashboards built for scientists rarely feel approachable; social feeds rarely cite real methods or reproducible data.

Bluegram bridges that gap with an explore-style feed tied to a Three.js globe, Mann–Kendall significance, Sen’s slope per decade, and plain-language AI summaries — built for the [NASA Space Apps Challenge](https://www.spaceappschallenge.org/) Advanced track.

### Motivation

Earth-system trends (warming poles, shifting precipitation, vegetation stress) are discussed everywhere, yet the underlying measurements and statistics stay locked behind specialist tools. The motivation was to make **rigorous trend detection** feel as natural as scrolling a feed — without dumbing down the science.

### Why I built it

I built Bluegram to answer the Space Apps prompt directly: find NASA mission or model variables, visualize change over time, and quantify significance — in a product a non-expert can actually use. The “post” metaphor is intentional: each region × variable becomes a shareable story with charts, p-values, and optional IPFS verification.

### Problem it solves

- **Discovery:** Browse regions sorted by statistical significance, not just geography.
- **Interpretation:** Every card shows direction, slope magnitude, and a significance stamp (not just a pretty map).
- **Contrast:** The Contradiction Detector highlights regions where the **same driver** can produce **opposite** trends — a core challenge requirement.
- **Trust:** Trend JSON can be pinned to IPFS (Pinata) so results are citeable outside the app.

### What I learned

- End-to-end pipeline design: NASA POWER fetch → cache → Mann–Kendall / Theil–Sen in Python, with the browser consuming **trend JSON only** (no client-side POWER calls).
- UX vs. correctness: marker colors, filters, and captions must stay aligned with the same slope and p-value the stats service returns.
- Splitting **human** UX (globe, feed, motion) from **machine** clarity (stable region IDs, query params, API routes) early makes later “agent-ready” docs and integrations easier.

### What makes it stand out

| Differentiator | Why it matters |
| --- | --- |
| **Significance on every post** | Answers “is it significant?” in the UI, not only in a writeup. |
| **Contradiction Detector** | Side-by-side regions + “Same driver. Opposite direction.” narrative. |
| **Verifiable science (IPFS)** | Upload trend payloads; display `ipfs://` CID and gateway links. |
| **Real NASA POWER data** | Surface temperature and precipitation trends on fixed regions (1981–present monthly). |
| **AI captions (DeepSeek)** | Two-sentence stories from slope + p-value, cached server-side. |

---

## Table of Contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Installation](#installation)
- [Usage](#usage)
- [Environment variables](#environment-variables)
- [Project structure](#project-structure)
- [Roadmap](#roadmap)
- [Credits](#credits)
- [License](#license)

## Features

- **Globe explorer** — NASA GIBS Blue Marble texture, slope-colored markers, fly-to region on select.
- **Variable feed** — Temperature and precipitation tabs; search and filters (significance, direction, region type).
- **Trend posts** — Recharts time series, Sen slope overlay, bookmarks, shareable `?region=&variable=` URLs.
- **AI summaries** — `/api/caption` (DeepSeek) with client-side session cache.
- **Contradiction mode** — Compare curated (and dynamic) region pairs; split globe + dueling trend cards.
- **IPFS verify** — `/api/ipfs` uploads trend JSON via Pinata JWT.

## Tech stack

| Layer | Technologies |
| --- | --- |
| Frontend | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Three.js, Recharts, GSAP, Zustand |
| Backend (stats) | Python 3, FastAPI, httpx, NumPy, SciPy, `pymannkendall` |
| Data | [NASA POWER](https://power.larc.nasa.gov/) monthly point API (T2M, PRECTOTCORR) |
| AI | DeepSeek API (captions) |
| Storage | Pinata (IPFS JSON pinning) |

## Installation

### Prerequisites

- Node.js 18+
- Python 3.11+ (3.12 recommended)
- Optional: DeepSeek API key, Pinata JWT (for captions and IPFS)

### 1. Stats service

```bash
cd stats
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000
```

Verify: `curl http://127.0.0.1:8000/api/regions`

### 2. Web app

```bash
cd web
cp .env.example .env.local
# Edit .env.local — set NEXT_PUBLIC_STATS_URL, optional DEEPSEEK_API_KEY, PINATA_JWT
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production build

```bash
cd web && npm run build && npm start
```

## Usage

1. Choose **Temperature** or **Precipitation** in the sidebar.
2. Click a **globe marker** or feed card to load a trend post and significance verdict.
3. Use **search and filters** to narrow by region name, significance tier, direction, or region type.
4. **Bookmark** or **copy link** from the trend post header.
5. **Compare Regions** (header) to enter contradiction mode; pick a pair from the dropdown.
6. **Verify on IPFS** on a trend post to pin JSON and copy the CID.

Share example: `http://localhost:3000/?region=arctic&variable=temperature`

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_STATS_URL` | Yes | Stats API base URL (e.g. `http://localhost:8000`) |
| `DEEPSEEK_API_KEY` | No | Enables AI captions |
| `PINATA_JWT` | No | Enables IPFS upload |

See [`web/.env.example`](web/.env.example).

## Project structure

```
BlueGram/
├── stats/          # FastAPI — POWER fetch, Mann–Kendall, Sen slope
├── web/            # Next.js UI — globe, feed, API routes
├── PLAN.md         # Architecture and phase milestones
└── README.md
```

## Roadmap

- Phase 4 hardening: align contradiction pair region IDs with `stats/regions.py`, dual charts, IPFS CID persistence.
- Frontend revamp: mobile bottom sheet, polish globe markers and motion.
- Phase 5: additional NASA variables (ice, NDVI, CO₂), partner layers, submission demo video.

Detailed planning: [`PLAN.md`](PLAN.md).

## Credits

- **NASA** — [POWER](https://power.larc.nasa.gov/), [GIBS](https://gibs.earthdata.nasa.gov/)
- **Methods** — Mann–Kendall (`pymannkendall`), Theil–Sen (`scipy.stats.theilslopes`)
- **Prior art studied** — [Earth Observing Dashboard](https://eodashboard.org/)
- README structure inspired by the [Professional README Guide](https://coding-boot-camp.github.io/full-stack/github/professional-readme-guide)

## License

This project was created for the NASA Space Apps Challenge. Add a `LICENSE` file before public redistribution; if none is present, all rights reserved by the project authors.
