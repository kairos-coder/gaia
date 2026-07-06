# ☀️ Apollo · Sanctuary

**Apollo is the solar sanctuary of GAIA** — a single-page mason-frame shell (`index.html`) that houses the game's core interactive modes as tabbed sanctums, with a doorway leading out to the wider Realm.

This README replaces the previous draft, which described a Hermes/Aphrodite/Ares "Pantheon" shadow-orchestration system (Kairos Graph, Supabase edge functions, `/shadows/`). None of that architecture exists in this folder. If that system lives elsewhere (a separate `pantheon` repo, or an earlier design that was abandoned), it should be documented there instead — not here, where it doesn't match a single file on disk.

---

## What's Actually Here

```
apollo/
├── index.html        The Sanctuary shell — mason frame, tab bar, doorway to Realm
├── apolloTable.html   🃏 THE TABLE   — tarot/card interface
├── chat.html          💬 THE VOICE   — chat interface
├── prophecy.html       🔮 PROPHECY    — divination/reading mode
├── studio.html        🎨 STUDIO      — creative/generation mode
├── flare.html          ☀️ Solar Flare Oracle — NOT YET linked in index.html
├── organism.html       🧬 (role TBD) — NOT YET linked in index.html
├── realm.html          The Realm — reached via the doorway, not a tab
├── reveal.js
├── data/deck/
├── js/
└── json/               cosmology.json — divine/elemental data
```

## Architecture

`index.html` builds a **mason-frame sanctuary**: pillars, arch, floor, and light all rendered procedurally via `../js/gaia-mason.js` (`GaiaMason`), with two live canvases —

- **Ouranos** — the sun-dominant heavens (stars, zodiac ring, pulsing sun)
- **Pontus** — light ripples along the floor (not water; solar reflection)

A **tab bar** swaps an iframe (`#sanctuaryFrame`) between four sanctums: Table, Voice, Prophecy, Studio. State (`gaia_apollo` in localStorage) persists visit count and last tab.

A separate **doorway zone**, rendered into the floor near the bottom of the frame, is a click target independent of the tab system — it navigates out of the iframe entirely to `realm.html?from=index`. This is deliberate: the Realm is a destination, not a sanctum tab.

## Current Gaps

- **`flare.html`** (Solar Flare Oracle, added last week) has no tab and no doorway. It's reachable only by direct URL.
- **`organism.html`** (added 5 days ago, most recent commit — "Refactor ApolloOrganism for improved performance" touched `js/`) is likewise unlinked. Its role in the sanctuary — fifth tab vs. its own doorway like Realm — isn't decided yet.

## Next

- [ ] Decide: does `flare.html` become a 5th tab, or does it get its own doorway (like Realm)?
- [ ] Decide: same question for `organism.html`, once its content/purpose is confirmed
- [ ] Wire whichever is chosen into `tabMap` / the tab bar, or add a second doorway zone in `buildMasonFrame()`
- [ ] Confirm `cosmology.json` and `data/deck/` are consumed by the sanctums that need them (Table, Prophecy) and not orphaned data
- [ ] Archive or relocate the old Pantheon/Kairos-Graph README content if it documents a real system elsewhere

---

> *The sanctuary stands. Not every door in it has been opened yet.*
