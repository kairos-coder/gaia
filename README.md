```markdown
# 🌍 GAIA — Olympian Cognitive Network

**A distributed cognitive system where Olympians serve as domain-specific APIs, Titans serve as memory accumulators, and Hermes routes between them.**

All queryable. All $0. All static. All mythic.

---

## What Is This?

GAIA is not an application. It is a **cognitive architecture** implemented as a pantheon of deities.

- **Olympians** are cognitive APIs — each one a domain-specific intelligence that responds to queries with structured thought
- **Titans** are memory accumulators — each one an immutable ledger tracking a specific domain of the system's experience
- **Hermes** is the conduit — he translates between Olympian vocabularies and routes every output to the correct Titan memory
- **Kronos** is the gatekeeper — he validates every query and maintains the master ledger of all system activity

The system is **query-constituted** — it doesn't run continuously. It exists at the moment a query is made. The intelligence is in the response, not the runtime.

---

## Quick Start (For AI Collaborators)

```
1. Hit /api.html?view=index to see the full system map
2. Hit /zeus/api.html?view=routes to see what Zeus can do
3. Hit /athena/api.html?view=brief&tags=GAIA to get the top 5 ideas about GAIA
4. Hit /hermes/api.html?view=routes to see all Olympian→Titan memory routes
```

Every Olympian follows the same pattern: `{name}/api.html` is the AI entry point. `{name}/index.html` is the human temple facade. `{name}/domain.json` is the self-contained intelligence dictionary.

---

## Architecture

```
gaia/
  api.html              ← Root system index (AI entry point)
  council.html          ← Olympian Council dev console
  gaia.html             ← Primordial dashboard (Pontus, Titans, Eros)
  README.md             ← This file
  
  zeus/                 ← ⚡ Law, Sovereignty, Judgment (ACTIVE)
  athena/               ← 🦉 Wisdom, Archive, Ideas (ACTIVE)
  hermes/               ← 🪄 Translation, Memory Routing (ACTIVE)
  
  hera/                 ← 👑 Covenant, Bond (planned)
  poseidon/             ← 🔱 Boundary, Stress (planned)
  apollo/               ← ☀️ Clarity, Signal (planned)
  artemis/              ← 🏹 Precision, Target (planned)
  hephaestus/           ← 🔨 Forge, Craft (planned)
  aphrodite/            ← 💗 Desire, Beauty (planned)
  ares/                 ← ⚔️ Challenge, Arena (planned)
  demeter/              ← 🌾 Season, Nourishment (planned)
  dionysus/             ← 🍇 Ecstasy, Rupture (planned)
  hestia/               ← 🔥 Hearth, Center (planned)
  
  titans/               ← 12 Titan memory indexes (ALL BUILT)
    kronos/             ← ⏳ Time & Ledger (GATEKEEPER)
    rhea/               ← 🌊 Rhythm & Tremors
    hyperion/           ← 🔆 Light & Illumination
    ... (12 total)
  
  circuits/             ← Signal processing test harness
```

---

## The Olympian Pattern

Every Olympian follows the same file structure:

| File | Purpose | Audience |
|------|---------|----------|
| `api.html` | Cognitive API — returns structured JSON | AI agents |
| `index.html` | Temple facade — human-readable domain page | Humans |
| `domain.json` | Self-contained intelligence dictionary | Both |
| `{module}.js` | Domain reasoning logic (judge.js, curator.js, etc.) | Internal |

To add a new Olympian:
1. Create the folder with `domain.json` and `index.html`
2. Build `api.html` with query patterns matching `domain.json`
3. Flip `status: 'active'` in `council.html` OLYMPIANS registry
4. Add Titan memory routes to `domain.json`
5. Hermes automatically discovers the new domain at query time

---

## The Titan Pattern

Every Titan follows the same file structure:

| File | Purpose |
|------|---------|
| `identity.js` | Active self — temperament, voice, domain logic |
| `index.json` | Domain-specific memory index |
| `memory.json` | Local memory (localStorage) |
| `remember.js` | Three-layer memory interface (fast, local, communal) |
| `api.html` | Machine-readable memory query endpoint |

Kronos additionally has `gatekeeper.js` — he validates all Olympian queries before they're processed.

---

## System Principles

### Query-Constituted Intelligence
The system doesn't run continuously. It exists at the moment of a query. The intelligence is in the structured response, not in a persistent runtime.

### Machine-Readable First
Every component has an `api.html` that returns JSON. AI collaborators hit these endpoints. Humans browse `index.html`. The separation is intentional.

### Immutable Memory
Titans never delete. They only append. Every Olympian query, every Hermes routing, every judgment — recorded permanently in the Titan memory indexes.

### $0 Infrastructure
GitHub Pages for hosting. localStorage for session memory. Supabase for future cross-session persistence. No servers. No API keys. No compute budget.

### Domain-Specific Intelligence
No single Olympian is universally intelligent. Each one is narrowly brilliant within their domain. The intelligence emerges from querying the right Olympian at the right time with the right context.

### Mythic Architecture
Files are named after deities. Folders are divine domains. JSON is a deck of divine actions. The architecture IS the documentation. The naming IS the context.

---

## API Convention

All `api.html` endpoints accept:
- `?view=routes` — List available query patterns
- `?view=status` — Current domain health
- Domain-specific views (e.g., `?view=judge&context=X&action=Y`)

Responses are always JSON. Human-readable output is in `index.html`.

---

## Current State

| Component | Status |
|-----------|--------|
| Olympians (active) | 3 — Zeus, Athena, Hermes |
| Olympians (planned) | 10 — Hera, Poseidon, Apollo, Artemis, Hephaestus, Aphrodite, Ares, Demeter, Dionysus, Hestia |
| Titans (memory indexes) | 12 — All built |
| Titan Gatekeeper | Kronos |
| Conduit | Hermes (active) |
| Dashboards | Council, Titan Council, Primordial GAIA |
| Circuits | Test harness (Zeus→Kronos→Gaia) |

---

## For Developers

### Want to fork this and build your own pantheon?

1. Fork the repo
2. The Olympian pattern is in `zeus/`, `athena/`, `hermes/` — copy the structure
3. The Titan pattern is in `titans/kronos/` through `titans/kreios/`
4. `api.html` is the AI entry point. `index.html` is the human temple.
5. `domain.json` defines what your deity knows and how they connect to others
6. Hermes discovers new domains automatically at query time

Build the Egyptian pantheon. The Norse. The Hindu. The Shinto. Same framework. Different deities. All interoperable.

---

## Related Repos

- **Athena** — Idea archive and extraction system (`kairos-coder.github.io/athena`)
- **Ealdenmot** — Political simulation with cognitive API governance
- **Divination** — 78-card tarot oracle
- **KairosDB** — Supabase communal memory (planned)

---

*"The Titans do not invent. They remember and respond. The Olympians do not run continuously. They answer when called. The system does not simulate intelligence. It is intelligence — constituted at the moment of the query."*

---

**GAIA v1.0 · Founded May 18, 2026 · kairos-coder.github.io/gaia**
```
