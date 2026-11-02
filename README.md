# Halland Events

[![Live site](https://img.shields.io/badge/live-hallandevents.se-2ea44f)](https://hallandevents.se)
[![API](https://img.shields.io/badge/API-eventextension.onrender.com-blue)](https://eventextension.onrender.com/Event/Ping)
[![.NET](https://img.shields.io/badge/.NET-9.0-512BD4?logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE.txt)
[![Daily Scraper](https://github.com/TimiSUT24/HallandEvents/actions/workflows/scraper.yml/badge.svg)](https://github.com/TimiSUT24/HallandEvents/actions/workflows/scraper.yml)

Halland Events gathers upcoming events from municipalities across Halland, Sweden, and presents them in one place. Event data is scraped automatically from official municipal and tourism sites, stored in PostgreSQL, and served through a REST API to a React web app and a browser extension.

- Website: [hallandevents.se](https://hallandevents.se)
- API: [eventextension.onrender.com](https://eventextension.onrender.com/Event/Ping)

## Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Repository structure](#repository-structure)
- [API](#api)
- [Data model](#data-model)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [Data pipeline](#data-pipeline)
- [Deployment](#deployment)
- [Data accuracy](#data-accuracy)
- [License](#license)

## Features

- Aggregated event listings from Falkenberg, Varberg, Halmstad, Laholm, Kungsbacka, and Hylte.
- Filter by municipality, category, and free-text search.
- Only upcoming events are shown, sorted by their next start date.
- Paginated event cards with images, dates, times, location, attendance, and source links.
- Swedish-language web interface built with React and TypeScript.
- Browser extension (Chrome Manifest V3) that shows events in a popup.
- Automated daily scraping through GitHub Actions.
- Resilient API: in-memory caching with a JSON backup fallback if the database is unavailable.
- Per-IP rate limiting and API-key protection for uploads.

## Architecture

```text
                     GitHub Actions (daily)
                     ┌───────────────────────────────┐
  Municipal sites    │  Playwright / HTTP scrapers   │
  ─────────────────► │  scrapeFBG, scrapeVBG,        │
  falkenberg.se      │  scrapeHSTD, scrapeLHM,       │
  visitvarberg.se    │  scrapeKGB, scrapeHLT         │
  destination...     └──────────────┬────────────────┘
  visitlaholm.se                    │ events*.json
  kungsbacka.se                     ▼
  kalender.hylte.se        mergeEvents.js → allEvents.json
                                    │
                                    │ POST /Event/UploadEvents
                                    │ X-API-KEY
                                    ▼
                     ┌───────────────────────────────┐
                     │  ASP.NET Core API (.NET 9)    │
                     │  rate limiting · CORS · cache │
                     └───────┬───────────────┬───────┘
                             │               │
                             ▼               ▼
                    Neon PostgreSQL    In-memory cache
                    (EF Core/Npgsql)   + /data backup JSON
                             │
                             ▼
              ┌──────────────┴───────────────┐
              ▼                              ▼
    React web app (Frontend-Main)   Chrome extension (Frontend-Extension)
    hallandevents.se                popup event list
```

## Tech stack

| Layer | Technology |
| --- | --- |
| Backend API | ASP.NET Core 9, C#, Entity Framework Core, Npgsql, ASP.NET Identity, JWT Bearer, Scalar/OpenAPI |
| Database | PostgreSQL (Neon in production) |
| Web frontend | React 19, TypeScript, Vite 7, React Router, react-select, MUI, react-icons |
| Browser extension | React 19, Vite, Chrome Manifest V3 |
| Scraping | Node.js 20, Playwright, Axios, dotenv |
| CI/CD | GitHub Actions (scheduled scraping and upload) |
| Containerization | Docker (`Backend/EventExtension/Dockerfile`) |

## Repository structure

```text
HallandEvents/
├── Backend/
│   ├── EventClassLibrary/          # Shared models (EventItem, EventDates, ApplicationUser)
│   └── EventExtension/             # ASP.NET Core Web API
│       ├── Controllers/            # EventController
│       ├── Data/                   # EF Core DbContext
│       ├── DTO/                    # API request/response models
│       ├── Mapper/                 # Entity <-> DTO mapping
│       ├── Migrations/             # EF Core migrations
│       ├── Repositories/           # Data access
│       ├── Services/               # Business logic + daily cache refresh
│       └── Dockerfile
├── Frontend-Main/                  # React + TypeScript website (Vite)
│   └── src/
│       ├── features/events/        # Pages, event cards, pagination, API client
│       ├── features/filters/       # Search, city and category filters
│       ├── services/               # Event service
│       └── shared/                 # Date and filtering utilities
├── Frontend-Extension/             # Chrome extension popup (React + Vite)
│   ├── public/manifest.json        # Manifest V3 definition
│   └── src/components/EventList.jsx
├── WebScraping/                    # Playwright/HTTP scrapers and upload scripts
│   ├── scrape*.js                  # One scraper per municipality
│   ├── helpers/                    # Page retry, category normalization, mapping
│   ├── mergeEvents.js              # Merges scraper output
│   └── uploadEvents.js             # Uploads merged events to the API
├── .github/workflows/scraper.yml   # Daily scraping workflow
└── LICENSE.txt
```

## API

Production base URL: `https://eventextension.onrender.com`

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/Event/GetAllEvents` | None | Returns all cached events as a JSON array. |
| `GET` | `/Event/Ping` | None | Health check; returns `Pong`. |
| `POST` | `/Event/UploadEvents` | `X-API-KEY` header | Replaces stored events per municipality with the uploaded set. |

Uploads are grouped by `Ort` (municipality). For each group, existing events for that city are removed and the new ones are inserted inside a transaction; the cache is invalidated afterwards.

Requests are rate limited per IP: 50 requests per 30 seconds, returning HTTP `429` when exceeded. CORS origins are configured through `AllowedOrigins`.

In development, OpenAPI is available at `/openapi/v1.json` and the Scalar UI at `/scalar/v1`.

Example:

```bash
curl https://eventextension.onrender.com/Event/GetAllEvents
```

```bash
curl -X POST https://eventextension.onrender.com/Event/UploadEvents \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: <UploadEventsKey>" \
  --data @allEvents.json
```

## Data model

**EventItem**

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `int` | Primary key |
| `title` | `string` | Max 300 characters |
| `description` | `string` | |
| `location` | `string` | Max 500 characters |
| `link` | `string` | Link to the original event page |
| `img` | `string` | Image URL |
| `categories` | `string[]` | Stored as a delimited string |
| `attendance` | `string` | Participant count or description |
| `ort` | `string` | Municipality |
| `publisherId` | `string?` | Optional application user |
| `dates` | `EventDates[]` | JSON property name `dates` |

**EventDates**

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `int` | Primary key |
| `eventId` | `int` | Foreign key, cascading delete |
| `startDate` | `date?` | |
| `endDate` | `date?` | |
| `time` | `string` | Free-form time range, e.g. `19:00 - 21:00` |

API responses use DTOs where `EventItem.dates` is exposed as `dates`, and the frontend types mirror that shape.

## Getting started

### Prerequisites

- [.NET 9 SDK](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org/) and npm
- PostgreSQL 15+ or a [Neon](https://neon.tech/) database
- Git

### Backend

```bash
cd Backend/EventExtension
dotnet restore
dotnet tool install --global dotnet-ef   # once, if not installed
dotnet ef database update
dotnet run
```

The API starts at `http://localhost:5248` and `https://localhost:7216` (see `Properties/launchSettings.json`). Configure the database connection and upload key with user secrets:

```bash
dotnet user-secrets set "Connectionstrings:Neon" "Host=...;Database=...;Username=...;Password=..."
dotnet user-secrets set "UploadEventsKey" "<your-upload-key>"
dotnet user-secrets set "AllowedOrigins:0" "http://localhost:5173"
```

Alternatively, set the equivalent environment variables (`Connectionstrings__Neon`, `UploadEventsKey`, `AllowedOrigins__0`).

### Frontend-Main

```bash
cd Frontend-Main
npm install
```

Create `.env`:

```dotenv
VITE_API_URL=http://localhost:5248
```

```bash
npm run dev      # development server
npm run build    # type-check and production build
npm run lint     # ESLint
```

Routes: `/` (event list) and `/about-web-page` (about page).

### Frontend-Extension

```bash
cd Frontend-Extension
npm install
```

Create `.env`:

```dotenv
VITE_API_EVENTS_URL=http://localhost:5248/Event/GetAllEvents
```

```bash
npm run build
```

Then open `chrome://extensions`, enable **Developer mode**, choose **Load unpacked**, and select `Frontend-Extension/dist`. The manifest requests access to `https://eventextension.onrender.com/*`.

### WebScraping

```bash
cd WebScraping
npm install
npx playwright install --with-deps
```

Create `.env` for the upload step:

```dotenv
Upload_API_URL=https://eventextension.onrender.com/Event/UploadEvents
UploadEventsKey=<your-upload-key>
```

Run one scraper, then merge and upload:

```bash
node scrapeFBG.js
node mergeEvents.js
node uploadEvents.js
```

| Script | Source |
| --- | --- |
| `scrapeFBG.js` | [falkenberg.se/evenemang](https://falkenberg.se/evenemang) |
| `scrapeVBG.js` | [visitvarberg.se/evenemang](https://visitvarberg.se/evenemang) |
| `scrapeHSTD.js` | [destinationhalmstad.se/evenemang](https://www.destinationhalmstad.se/evenemang) |
| `scrapeLHM.js` | [visitlaholm.se](https://visitlaholm.se/evenemang/evenemangskalender) |
| `scrapeKGB.js` | [kungsbacka.se/evenemang](https://kungsbacka.se/uppleva-och-gora/evenemang) |
| `scrapeHLT.js` | [kalender.hylte.se](https://kalender.hylte.se/api/events) |

Each scraper writes an `events*.json` file. `mergeEvents.js` combines them into `allEvents.json`, and `uploadEvents.js` posts that file with the `X-API-KEY` header. Generated JSON files are git-ignored.

## Configuration

### Backend

| Key / variable | Purpose |
| --- | --- |
| `Connectionstrings:Neon` / `Connectionstrings__Neon` | PostgreSQL connection string |
| `AllowedOrigins` / `AllowedOrigins__0`, `__1`, ... | CORS-allowed frontend origins |
| `UploadEventsKey` | Shared secret required by `POST /Event/UploadEvents` |
| `ASPNETCORE_ENVIRONMENT` | `Development` enables OpenAPI and Scalar |
| `PORT` | HTTP port used in production (defaults to `5000`) |

### Frontend-Main

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | Base URL of the API |

### Frontend-Extension

| Variable | Purpose |
| --- | --- |
| `VITE_API_EVENTS_URL` | Full URL of the `GetAllEvents` endpoint |

### WebScraping

| Variable | Purpose |
| --- | --- |
| `Upload_API_URL` | Full URL of the upload endpoint |
| `UploadEventsKey` | Value sent as the `X-API-KEY` header |
| `NODE_ENV` | When set to `development`, TLS verification is disabled for local testing |

## Data pipeline

1. **Scrape** — GitHub Actions runs `.github/workflows/scraper.yml` daily. The `scrape` job runs the six scrapers as a matrix, so one failing source does not block the others.
2. **Collect** — each scraper uploads its JSON output as a workflow artifact.
3. **Merge** — the `merge-and-upload` job downloads all artifacts, moves them into `WebScraping/`, and runs `mergeEvents.js` to produce `allEvents.json`.
4. **Upload** — `uploadEvents.js` posts the merged list to the API using the `UPLOAD_API_URL` and `UPLOADEVENTSKEY` repository secrets.
5. **Serve** — the API replaces stored events per municipality in a transaction, invalidates the cache, and the next request reloads fresh data.
6. **Refresh** — a hosted background service preloads the cache on startup and refreshes it daily at `07:00 Europe/Stockholm`.

The workflow can also be triggered manually from the Actions tab (`workflow_dispatch`).

## Deployment

- **API** — containerized with `Backend/EventExtension/Dockerfile` (.NET 9 runtime). Production configuration is supplied through environment variables; the app binds to `http://*:$PORT`. The current deployment is at `eventextension.onrender.com`.
- **Website** — `Frontend-Main` builds to static assets with `npm run build` and can be hosted on any static host. The current site is `hallandevents.se`.
- **Extension** — `Frontend-Extension` builds to `dist/`, which can be zipped and submitted to the Chrome Web Store or loaded unpacked for development.
- **Scrapers** — run entirely in GitHub Actions; no separate server is required.

## Data accuracy

Event information is collected automatically from public municipal and tourism websites. Listings may occasionally be incomplete, outdated, or contain minor errors. Always verify details on the organizer's or municipality's official page via the "Read more" link on each event.

## License

This project is licensed under the MIT License. See [LICENSE.txt](LICENSE.txt) for details.
