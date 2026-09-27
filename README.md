<div align="center">

# ♻️ RECYCLN

### The AI Operating System for Physical Resources, Waste & Infrastructure

**Discover what exists. Understand it. Trade it. Move it. Optimize it.**

Built for the **NVIDIA × GoMyCode Hackathon**

[![Hackathon](/Images//event-20260927-photo-072.webp)](#-hackathon)
[![Status](https://img.shields.io/badge/Status-In%20Development-orange?style=flat-square)]()
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](#-license)

</div>

---

## 📖 Table of Contents

- [The Problem](#-the-problem)
- [The Solution](#-the-solution)
- [How It Works](#-how-it-works)
- [Core Features](#-core-features)
- [Powered by NVIDIA AI](#-powered-by-nvidia-ai)
- [Environmental & Social Impact](#-environmental--social-impact)
- [Who RECYCLN Helps](#-who-recycln-helps)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Roadmap](#-roadmap)
- [Hackathon](#-hackathon)
- [Team](#-team)
- [License](#-license)

---

## 🌍 The Problem

Every day, enormous value is lost because physical resources, waste, and infrastructure problems are **invisible to the people who could act on them**.

- Companies discard surplus materials, machinery, and inventory simply because they don't know a buyer exists nearby.
- Recyclers and facilities operate below capacity because they can't be found by the people who need them.
- Trucks return empty after deliveries because there's no way to know what else needs moving along the same route.
- Dumpsites, damaged infrastructure, and land-use changes go unnoticed for months because no one is watching — or the people watching have no way to route the issue to whoever can fix it.
- Small businesses, informal waste workers, and recyclers are cut off from the same data and tools that large corporations use to run efficient operations.

The result: **resources that could be reused are wasted, trucks burn fuel moving nothing, recoverable materials end up in landfills, and infrastructure problems sit unresolved** — not because people don't care, but because the information never reaches the right hands at the right time.

## 💡 The Solution

**RECYCLN** is a multi-tenant platform that turns physical resources, waste streams, vehicles, facilities, and infrastructure into **structured, searchable, tradeable, AI-understood data** — and connects that data to the people and businesses who can act on it.

It's not a dashboard. It's not a classifieds site. It's an **operating system for the physical resource economy**, where:

- Every material, machine, or surplus item becomes a trackable digital resource.
- AI reads satellite imagery, photos, and reports to understand what's out there.
- A real B2B marketplace connects supply with demand and explains *why* a match makes sense.
- Logistics, fleets, and facilities are coordinated automatically instead of manually.
- Every recommendation the AI makes is grounded in real platform data — never a guess.

## ⚙️ How It Works

RECYCLN runs on one continuous loop:

```
DISCOVER → UNDERSTAND → TRADE → MOVE → OPTIMIZE
```

| Stage | What Happens |
|---|---|
| 🔎 **Discover** | Satellite imagery, photos, field reports, and inventory uploads surface resources, waste sites, and infrastructure issues that would otherwise stay invisible. |
| 🧠 **Understand** | Computer vision identifies materials and condition; geospatial intelligence maps locations; AI classifies and prioritizes what's found. |
| 🤝 **Trade** | Verified organizations list, search, negotiate, and transact — buying, selling, exchanging, donating, or recovering resources through a real marketplace with an AI matching engine that explains every match. |
| 🚚 **Move** | Vehicles, drivers, and facilities are assigned and routed automatically, with real-time tracking and proof of delivery. |
| 📈 **Optimize** | Forecasting, inventory intelligence, and a scenario simulator continuously suggest better decisions — what to restock, what to sell, where to add a truck, which facility to use. |

**Example, end to end:**
> A satellite scan flags a significant land-use change at an industrial site → a field agent confirms it's a stockpile of surplus aluminium → the AI Resource Scanner turns a photo into a draft listing → the marketplace matches it with a nearby buyer needing 3 tonnes → an offer is made, accepted, and paid for → a logistics job is created → the AI optimizer assigns the nearest available truck and driver → the delivery is tracked live to completion → the resource's digital passport and the organization's environmental impact numbers update automatically.

## 🧩 Core Features

**Resource & Marketplace**
- Digital Resource Passports with full ownership, location, and transaction history
- AI Resource Scanner — turn a photo into a draft listing
- B2B marketplace for products, surplus inventory, recovered materials, equipment, and waste streams
- AI Matching Engine that explains *why* a match works, not just a black-box score
- AI Pricing & Valuation with transparent, explained estimates

**Logistics & Fleet**
- End-to-end transaction lifecycle: listing → match → offer → payment → pickup → delivery → confirmation
- Fleet and driver management with maintenance, fuel, and utilization tracking
- AI Route Optimizer for vehicle/driver assignment and delivery sequencing
- Backhaul optimization so trucks don't return empty
- Real-time GPS tracking and proof of delivery

**Geospatial & Satellite Intelligence**
- Satellite/Earth-observation change detection for dumpsites, land use, and infrastructure
- Every detection is a *candidate* flagged for human verification — never an automatic conclusion
- Radius search, geofencing, and spatial clustering across the entire network

**Infrastructure Intelligence**
- Citizen/field reporting for damaged roads, drainage, streetlights, and waste accumulation
- AI triage for category, priority, and responsible department — with a human making the final call

**AI Operations Copilot**
- One assistant that answers real operational questions by querying live platform data — never a generic, made-up answer
- Prepares consequential actions (like scheduling a pickup) for human confirmation before executing anything

**Trust, Analytics & Governance**
- Verified Supplier / Buyer / Facility badges built from real transaction history
- Company network graph, resource flow visualization, and environmental impact tracking
- Predictive alerts for stockouts, maintenance, capacity limits, and inactive listings
- Full audit logging on every consequential action

## 🟢 Powered by NVIDIA AI

RECYCLN's AI layer is built to run on NVIDIA's accelerated computing and inference stack, which is what makes real-time computer vision, satellite change detection, and logistics optimization viable at scale.

> _Team: fill in the specific NVIDIA technologies used in this build — for example:_
> - **NVIDIA NIM** for accelerated LLM inference behind the AI Operations Copilot
> - **NVIDIA cuOpt** for GPU-accelerated route and fleet optimization
> - **NVIDIA Triton Inference Server** for serving the vision models behind the AI Resource Scanner and satellite change detection
> - **NVIDIA TAO Toolkit** for fine-tuning the object/material classification models
>
> _Replace this block with the exact tools, models, and NVIDIA infrastructure your team integrated._

## 🌱 Environmental & Social Impact

RECYCLN is built around one idea: **the fastest way to clean up the environment is to make sure nothing reusable gets thrown away in the first place.**

- **Diverts material from landfills** by surfacing surplus, recoverable, and end-of-life resources to buyers and recyclers before they're discarded.
- **Reduces transport emissions** through route optimization and backhaul matching, cutting empty and redundant trips.
- **Speeds up recovery of hazardous or high-impact waste sites** by catching land-use and dumpsite changes early via satellite monitoring.
- **Accelerates infrastructure repair** (drainage, waste accumulation, damaged public assets) by routing citizen reports straight to the right department instead of letting them go unnoticed.
- **Makes environmental impact measurable, not anecdotal** — every organization gets transparent, clearly-labeled metrics (material diverted, reused, recycled, transport optimized), each tagged as *Reported*, *Calculated*, *Estimated*, or *Modelled* so numbers are never presented as more certain than they are.

This work directly supports several UN Sustainable Development Goals:

| SDG | How RECYCLN Contributes |
|---|---|
| **SDG 9** — Industry, Innovation & Infrastructure | Digitizes and modernizes resource and infrastructure management |
| **SDG 11** — Sustainable Cities & Communities | Infrastructure Intelligence keeps cities responsive to real problems |
| **SDG 12** — Responsible Consumption & Production | Marketplace and Recovery Engine keep materials in circulation |
| **SDG 13** — Climate Action | Logistics optimization and material recovery reduce emissions and waste |

## 🤝 Who RECYCLN Helps

- **Manufacturers & businesses** — recover value from surplus materials and equipment instead of writing them off.
- **Recyclers & processing facilities** — find supply, fill idle capacity, and get discovered by buyers.
- **Logistics operators & drivers** — fuller trucks, optimized routes, less wasted fuel and time.
- **Waste management operators & municipalities** — catch and route infrastructure and environmental issues faster.
- **Small and informal businesses** — get access to the same discovery, matching, and logistics tools that only large corporations could previously afford.
- **Communities** — a direct channel to report and track the resolution of local infrastructure problems.

## 🏗️ System Architecture

```
                PLATFORM
                    │
 ┌──────────────────┼──────────────────┐
 │                  │                  │
 ▼                  ▼                  ▼
SPACE &          RESOURCE          INFRASTRUCTURE
GEOSPATIAL       INTELLIGENCE       INTELLIGENCE
 │                  │                  │
Satellite       Inventory          Civic reports
EO data         Materials          Infrastructure issues
Mapping         Equipment          Maintenance
Change          Passports
Detection
 │                  │                  │
 └──────────────────┼──────────────────┘
                    ▼
             AI INTELLIGENCE
       (Matching · Forecasting · Optimization)
                    ▼
              MARKETPLACE
                    ▼
                LOGISTICS
          ┌─────────┴─────────┐
          ▼                   ▼
       FLEETS             FACILITIES
          └─────────┬─────────┘
                    ▼
               TRANSACTIONS
```

Every module follows the same discipline: **frontend UI → validation → API endpoint → backend service → database model → authorization → audit event.** No feature exists only in the frontend — every button does something real.

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend (Web)** | React, Vite, TypeScript, Tailwind CSS, Zustand, TanStack Query, MapLibre, CesiumJS |
| **Mobile** | React Native, Expo, Expo Location/Camera/Notifications |
| **Backend** | Node.js, NestJS, TypeScript, REST, WebSockets/Socket.IO |
| **Database** | PostgreSQL, PostGIS (geospatial), pgvector (semantic search), Redis, BullMQ |
| **AI / ML** | NVIDIA-accelerated LLM & vision inference, Python, scikit-learn, XGBoost, OR-Tools / NVIDIA cuOpt, NetworkX |
| **Geospatial** | PostGIS, MapLibre, OpenStreetMap, GDAL, GeoPandas, Rasterio |
| **Payments** | Paystack, Flutterwave |
| **Storage** | AWS S3 / Cloudinary |
| **Infra** | Docker, GitHub Actions, Nginx |

## 🚀 Getting Started

### Prerequisites
- Node.js (LTS)
- Docker & Docker Compose
- PostgreSQL with PostGIS + pgvector extensions
- Redis

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/<your-org>/recycln.git
cd recycln

# 2. Install dependencies
npm install

# 3. Copy environment variables
cp .env.example .env
# then fill in your API keys — see below

# 4. Start infrastructure (Postgres, Redis)
docker compose up -d

# 5. Run database migrations
npm run migrate

# 6. Start the app
npm run dev
```

### Environment Variables

RECYCLN is designed so that dropping in real API keys is all that's needed to go from a limited demo to a fully live platform. Configure these in `.env` (or via the in-app Admin → Integrations panel once running):

| Category | Keys |
|---|---|
| Maps & Routing | `MAPBOX_API_KEY`, `OPENROUTESERVICE_API_KEY` |
| Satellite / EO | `SENTINEL_HUB_CLIENT_ID`, `SENTINEL_HUB_CLIENT_SECRET` |
| Payments | `PAYSTACK_SECRET_KEY`, `FLUTTERWAVE_SECRET_KEY` |
| AI / Vision | `LLM_API_KEY`, `VISION_MODEL_API_KEY` |
| Messaging | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` |
| Email | `SENDGRID_API_KEY` |
| Storage | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET` |
| Core | `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET` |

See `.env.example` for the complete list and links to where to obtain each key. Any integration left unconfigured shows clearly as **"Integration not configured"** in the UI rather than faking a result.

## 📁 Project Structure

```
apps/
  web/          # React web app
  mobile/       # React Native app (company, driver, and field apps)
  api/          # NestJS backend
services/
  ai/           # AI/ML services (matching, forecasting, vision)
  optimization/ # Route & logistics optimization
  geospatial/   # PostGIS / satellite processing
packages/
  ui/           # Shared UI components
  types/        # Shared TypeScript types
  validation/   # Shared Zod schemas
  api-client/   # Typed API client
```

## 🗺️ Roadmap

- [x] Phase 1 — Core platform: auth, organizations, resources, inventory, marketplace, search
- [ ] Phase 2 — Transactions, offers, payments, notifications
- [ ] Phase 3 — Logistics, fleet, live tracking, proof of delivery
- [ ] Phase 4 — AI Resource Scanner, Matching, Valuation, Operations Copilot
- [ ] Phase 5 — Facilities & capacity marketplace
- [ ] Phase 6 — Forecasting, inventory intelligence, scenario simulator
- [ ] Phase 7 — Satellite intelligence & infrastructure reporting
- [ ] Phase 8 — Developer API, webhooks, IoT, advanced analytics

## 🏆 Hackathon

Built during the **NVIDIA × GoMyCode Hackathon**.

> _Add here: hackathon track/category, dates, demo video link, and live demo URL if available._

## 👥 Team

> _Add team member names, roles, and GitHub/LinkedIn links here._

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**RECYCLN** — connecting what exists, who needs it, where it is, how it should move, and what should happen next.

</div>




<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/5e54d118-5dac-49e9-8ea8-99b5a093ea73

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
