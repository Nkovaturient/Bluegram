# Bluegram

**Instagram for Earth systems** — a 3D globe explorer and multi-agency scroll stream that surfaces statistically validated regional trends from NASA and international space agencies: **what** is changing, **where** it is changing, **how much** it is changing, and **whether it is statistically significant**.

![Bluegram banner](web/public/banner.png)

## Challenge Mapping (4 Questions → 4 UI Answers)

| Space Apps Challenge Question | Bluegram Implementation |
| --- | --- |
| **1. What is changing?** | **4 NASA POWER Variables**: Surface Temperature (`T2M`), Precipitation (`PRECTOTCORR`), Solar Radiation (`ALLSKY_SFC_SW_DWN`), and Relative Humidity (`RH2M`), plus live **NASA EONET v3** hazards, **Microsoft Planetary Computer STAC** scenes, **Meteomatics** synoptic nowcasts, and **6-Agency (`NASA · ESA · JAXA · ISRO · Roscosmos · CNSA`)** synthesis. |
| **2. Where is it changing?** | **Interactive 3D Globe (`Three.js` + NASA GIBS WMS + 3D EONET Hazard Rings)**: 13 canonical regions (10 global + 3 Indian subcontinent anchors: Western Ghats, Indo-Gangetic Plain, Sundarbans) with live **GIBS Layer Switcher** (`Blue Marble`, `MODIS Terra True Color`, `VIIRS Night Lights`) and toggleable **3D EONET Hazard Rings**. |
| **3. How much is it changing?** | **Theil–Sen Estimator (`scipy.stats.theilslopes`)**: Non-parametric decadal slope (`unit / decade`) rendered on every marker, feed card, and Recharts annual time series overlay across customizable era windows (`1981–2025`, `2000–2025`, `2010–2025`, `1981–2005`). |
| **4. Is it significant?** | **Mann–Kendall (`pymannkendall`) + Benjamini–Hochberg FDR (`q-value`)**: Every post displays a significance stamp (`Significant p < 0.05`, `Borderline 0.05–0.10`, `Not significant > 0.10`, or `Insufficient data` if `>20%` missing) alongside spatial FDR `q-values`. |
| **Twist: Same driver, opposite direction** | **Contradiction Detector (`SplitGlobe` + `DuelingPosts`)**: Dual 3D globes and stacked telemetry cards contrasting curated pairs (e.g. Arctic vs Antarctic, Western Ghats vs Indo-Gangetic Plain) and live opposing trends from `/api/trends`. |

---

## Features

- **Bluegram Pulse (`/feed`)** — Instagram-inspired multi-agency scroll stream paired with a sticky, `IntersectionObserver`-synced 3D side-globe that automatically flies to each scrolled region's coordinates. Includes **6-Agency Consensus Tabs (`NASA · ESA · JAXA · ISRO · Roscosmos · CNSA`)**, custom era windows, region subscriptions (`★ Following`), live **NASA EONET v3** pings, historical anecdotes, and DOI-linked peer-reviewed papers.
- **3D Globe, GIBS Switcher & 3D EONET Hazard Rings** — Switch between NASA GIBS `Blue Marble Bathymetry`, `MODIS Terra True Color`, and `VIIRS Black Marble` in real time, and toggle **3D EONET Hazard Rings** plotting active wildfires, storms, and volcanoes directly on the sphere.
- **Live Planetary Intelligence Block (`PlanetaryIntelBlock`)** — Integrated into both `/` (`TrendPost`) and `/feed` (`PulseFeedCard`):
  - **Synoptic Nowcast (`Meteomatics API`)**: Real-time `2m Temp`, `10m Wind`, `Sea-Level Pressure`, and `Humidity / 24h Precip` (with automatic zero-auth Open-Meteo real-time fallback).
  - **Microsoft Planetary Computer (`STAC v1 + Data API`)**: Queries live `sentinel-2-l2a` / `landsat-c2-l2` satellite granules, cloud cover %, pass dates, and renders live satellite tile preview thumbnails.
  - **ISRO ISTRAC & ISSDC Ground-Segment Telemetry**: Maps regions to receiving **ISTRAC Ground Stations** (including *ISTRAC Lucknow*, *Bengaluru / IDSN Byalalu ISSDC*, *Port Blair*, and *Antarctica AGEOS Bharati*) with direct links to `isro.gov.in/Sciencedata.html`, `issdc.gov.in`, and `istrac.gov.in`.
- **Verifiable Science (IPFS)** — Pin TrendPost JSON payloads via Pinata (`PINATA_JWT`) with persistent `localStorage` CID hydration (`bluegram:ipfs-cids`) and embedded `https://schema.org/Dataset` JSON-LD.

---

## Installation & Quick Start

### 1. Stats Service (`stats/`)

```bash
cd stats
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env   # Auto-loaded on startup; optional keys below
.venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000
```

Verify:
- `curl http://127.0.0.1:8000/api/regions`
- `curl http://127.0.0.1:8000/api/providers`
- `curl "http://127.0.0.1:8000/api/planetary-intel?region=indo-gangetic"`

### 2. Web App (`web/`)

```bash
cd web
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (Globe Explorer) or [http://localhost:3000/feed](http://localhost:3000/feed) (Bluegram Pulse).

---

## Service & API Key Setup Guide (With Official Reference Links)

Zero-auth services (**NASA POWER**, **NASA GIBS WMS**, **NASA EONET v3**, **Microsoft Planetary Computer STAC/Data API**, and **ISRO ISSDC/ISTRAC catalog links**) work out of the box with no keys required.

### 1. Frontend Keys (`web/.env.local`)

| Variable | Required | Setup Instructions & Reference Link |
| --- | --- | --- |
| `NEXT_PUBLIC_STATS_URL` | **Yes** | Set to `http://localhost:8000` locally, or your deployed Google Cloud Run URL in production. |
| `DEEPSEEK_API_KEY` | Optional | Enables 2-sentence AI plain-language captions (`/api/caption`). Create a key at [platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys). |
| `PINATA_JWT` | Optional | Enables IPFS JSON pinning (`/api/ipfs`). Create a key at [app.pinata.cloud/developers/api-keys](https://app.pinata.cloud/developers/api-keys) → **New Key** → copy the **JWT** (API Key/Secret not needed). |

### 2. Backend & Space Apps Global Offer Keys (`stats/.env`)

`stats/main.py` automatically loads `stats/.env` on startup. Check active status anytime at `GET http://localhost:8000/api/providers`.

| Variable | Service | Setup Instructions & Reference Link |
| --- | --- | --- |
| *(None required)* | **Microsoft Planetary Computer** | Uses public STAC v1 (`https://planetarycomputer.microsoft.com/api/stac/v1/search`) and Data Preview API. Docs: [planetarycomputer.microsoft.com/docs](https://planetarycomputer.microsoft.com/docs) & [Catalog](https://planetarycomputer.microsoft.com/catalog). |
| `METEOMATICS_USER` & `METEOMATICS_PASSWORD` | **Meteomatics Weather & Marine API** | Claim via Space Apps Global Offers or sign up at [meteomatics.com/en/api/getting-started](https://www.meteomatics.com/en/api/getting-started/). Put Basic Auth username/password in `stats/.env`. *(If unset, Bluegram automatically falls back to live Open-Meteo synoptic telemetry).* |
| *(None required)* | **NASA EONET v3** | Live open natural events (`https://eonet.gsfc.nasa.gov/api/v3/events`). Docs: [eonet.gsfc.nasa.gov](https://eonet.gsfc.nasa.gov/). |
| *(None required)* | **ISRO ISSDC · ISTRAC · Science Data** | Ground-station & science archive links mapped per region: [ISRO Science Data](https://www.isro.gov.in/Sciencedata.html), [ISSDC Portal](https://www.issdc.gov.in/), [ISTRAC Network Brochure](https://www.istrac.gov.in/brochure.html), and [MOSDAC](https://www.mosdac.gov.in/). |
| `NASA_API_KEY` | **api.nasa.gov** | Optional key for elevated EONET rate limits. Generate free at [api.nasa.gov](https://api.nasa.gov/). |
| `NASA_EARTHDATA_TOKEN` | **NASA Earthdata CMR** | Optional Bearer token for direct CMR/NSIDC granules: [urs.earthdata.nasa.gov](https://urs.earthdata.nasa.gov/). |
| `FIRMS_MAP_KEY` | **NASA FIRMS** | Optional MAP_KEY for thermal hotspot queries: [firms.modaps.eosdis.nasa.gov/api](https://firms.modaps.eosdis.nasa.gov/api/). |
| `COPERNICUS_CDS_KEY` | **ESA Copernicus C3S** | Optional key for ERA5 cross-check: [cds.climate.copernicus.eu](https://cds.climate.copernicus.eu/). |
| `PIXXEL_AURORA_TOKEN` | **Pixxel Aurora** | Optional Personal Access Token for hyperspectral archive queries: [docs.pixxel.space](https://docs.pixxel.space/developer/gettingstarted/authentication). |

### 3. Google Cloud ($300 Space Apps Global Offer) Deployment

`stats/Dockerfile` is pre-configured for **Google Cloud Run** (`PORT=8080`):

```bash
# 1. Authenticate & set your GCP project (redeem $300 credit from Space Apps Global Offers)
gcloud auth login
gcloud config set project YOUR_GCP_PROJECT_ID

# 2. Deploy the Python FastAPI stats service to Cloud Run from source
gcloud run deploy bluegram-stats \
  --source ./stats \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="ALLOWED_ORIGINS=https://your-web-domain.vercel.app"
```

---

## API & Agent-Ready Contracts

| Endpoint | Method | Service | Contract Summary |
| --- | --- | --- | --- |
| `/api/regions` | `GET` | Python (`:8000`) | `{ regions: [{ id, name, latitude, longitude }] }` (13 regions) |
| `/api/providers` | `GET` | Python (`:8000`) | `{ providers: { nasa_power, microsoft_planetary_computer, meteomatics_api, isro_issdc_istrac, ... } }` |
| `/api/planetary-intel?region={id}` | `GET` | Python (`:8000`) | `{ regionId, stacScene, synoptic, isroTelemetry }` |
| `/api/events/global` | `GET` | Python (`:8000`) | `{ events: [{ id, title, category, date, latitude, longitude, sourceUrl }] }` (for 3D Globe hazard rings) |
| `/api/events?region={id}` | `GET` | Python (`:8000`) | `{ regionId, events: [{ id, title, category, date, distanceKm, sourceUrl }] }` |
| `/api/trend?region={id}&variable={var}&start_year={y0}&end_year={y1}` | `GET` | Python (`:8000`) | `{ region, variable, unit, startYear, endYear, direction, significance, pValue, qValue, missingRatio, slopePerDecade, series, annual, slopeLine, events, supplemental }` |
| `/api/trends?variable={var}&start_year={y0}&end_year={y1}` | `GET` | Python (`:8000`) | `{ variable, unit, startYear, endYear, points: [{ regionId, slopePerDecade, pValue, qValue, significance, direction }] }` |
| `/api/contradiction-pairs?variable={var}` | `GET` | Next.js (`:3000`) | `{ curated: ContradictionPair[], live: ContradictionPair[] }` |
| `/api/caption` | `POST` | Next.js (`:3000`) | `{ caption: string }` (supports single region & `comparisonMode`) |
| `/api/ipfs` | `POST` | Next.js (`:3000`) | `{ cid, gateway_url, timestamp, size }` |

---

## Citable References & Credits

- **Methods:** Hussain & Mahmud (2019), `pymannkendall` (`doi:10.21105/joss.01556`); Benjamini & Hochberg (1995), FDR (`doi:10.1111/j.2517-6161.1995.tb02031.x`); Gutierrez-Hernández & García (2024), RTA (`doi:10.3390/rs16010001`).
- **NASA & Partner Platforms:** Stackhouse et al. (2018), NASA POWER; NASA EOSDIS GIBS; [NASA EONET v3](https://eonet.gsfc.nasa.gov/); [Microsoft Planetary Computer](https://planetarycomputer.microsoft.com/catalog); [Meteomatics API](https://www.meteomatics.com/en/api/getting-started/); [ISRO Science Data](https://www.isro.gov.in/Sciencedata.html) / [ISSDC](https://www.issdc.gov.in/) / [ISTRAC](https://www.istrac.gov.in/brochure.html); [Earth Observing Dashboard](https://eodashboard.org/); [Miro Education](https://miro.com/education-whiteboard/) (collaborative architecture whiteboarding).
