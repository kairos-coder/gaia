// curator.js
// Athena Archive Curator — kairos-coder.github.io/athena/archive
// Dynamically discovers session files via GitHub Contents API
// CL_052926

const GITHUB_API = "https://api.github.com/repos/kairos-coder/athena/contents/archive";
const RAW_BASE   = "https://raw.githubusercontent.com/kairos-coder/athena/main/archive";

const AGENT_FOLDERS = {
  CL: "claude",
  DS: "deepseek",
  CG: "chatgpt",
  GK: "grok"
};

// ─── Discovery ───────────────────────────────────────────────────────────────
// Hit the GitHub Contents API for each agent folder and return all .json paths

async function discoverFiles() {
  const folders = Object.values(AGENT_FOLDERS);
  const discoveries = await Promise.allSettled(
    folders.map(folder => fetchFolder(folder))
  );

  const files = [];
  for (const result of discoveries) {
    if (result.status === "fulfilled") {
      files.push(...result.value);
    }
    // silently skip folders that don't exist yet
  }
  return files;
}

async function fetchFolder(folder) {
  const res = await fetch(`${GITHUB_API}/${folder}`, {
    headers: { Accept: "application/vnd.github.v3+json" }
  });

  if (!res.ok) {
    if (res.status === 404) return []; // folder doesn't exist yet
    throw new Error(`GitHub API error for folder "${folder}": ${res.status}`);
  }

  const entries = await res.json();

  // filter to .json files only, skip index/manifest files
  return entries
    .filter(e => e.type === "file" && e.name.endsWith(".json") && e.name !== "index.json")
    .map(e => ({
      folder,
      filename: e.name,
      path: `${folder}/${e.name}`,
      sha: e.sha
    }));
}

// ─── Loading ─────────────────────────────────────────────────────────────────
// Fetch raw JSON for each discovered file

async function loadSessionFile(fileEntry) {
  const res = await fetch(`${RAW_BASE}/${fileEntry.path}`);
  if (!res.ok) throw new Error(`Failed to load: ${fileEntry.path} (${res.status})`);
  return await res.json();
}

async function loadAllSessions() {
  const files = await discoverFiles();
  if (!files.length) return [];

  const results = await Promise.allSettled(files.map(loadSessionFile));

  const sessions = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      sessions.push(result.value);
    } else {
      console.warn("[Curator] Failed to load session:", result.reason?.message);
    }
  }
  return sessions;
}

// ─── Index Builder ────────────────────────────────────────────────────────────
// Dynamically build the index from discovered files
// Falls back to static index.json if present

async function buildIndex() {
  // try static index.json first as a fast path
  try {
    const res = await fetch(`${RAW_BASE}/index.json`);
    if (res.ok) {
      const staticIndex = await res.json();
      // still load all sessions dynamically to catch any files
      // not yet registered in index.json
      const sessions = await loadAllSessions();
      return assembleIndex(sessions, staticIndex);
    }
  } catch (_) {
    // no static index, fall through to full discovery
  }

  const sessions = await loadAllSessions();
  return assembleIndex(sessions, null);
}

function assembleIndex(sessionFiles, staticIndex = null) {
  const sessions = [];
  const tagIndex = {};
  let totalIdeas = 0;
  let totalCarry = 0;

  for (const file of sessionFiles) {
    if (!file?.session || !file?.ideas) continue;

    const ideas = file.ideas || [];
    const allTags = [...new Set(ideas.flatMap(i => i.domain_tags || []))];
    const carryCount = ideas.filter(i => i.carry_forward).length;
    const topIdea = ideas.find(i => i.rank === 1)?.thesis || "";

    const entry = {
      id:                file.session.id,
      name:              file.session.name || file.session.id,
      agent:             file.session.agent,
      source_platform:   file.session.source_platform,
      date:              file.session.date,
      extracted:         file.session.extracted,
      session_summary:   file.session_summary || "",
      domain_tags:       allTags,
      top_idea:          topIdea,
      carry_forward_count: carryCount,
      archive_file:      `athena/archive/${AGENT_FOLDERS[file.session.agent] || file.session.agent}/${file.session.id}.json`
    };

    sessions.push(entry);
    totalIdeas += ideas.length;
    totalCarry += carryCount;

    // build tag index
    for (const tag of allTags) {
      if (!tagIndex[tag]) tagIndex[tag] = [];
      if (!tagIndex[tag].includes(file.session.id)) {
        tagIndex[tag].push(file.session.id);
      }
    }
  }

  return {
    athena_index: {
      version:        staticIndex?.athena_index?.version || "1.0",
      last_updated:   new Date().toLocaleDateString("en-US", { month:"2-digit", day:"2-digit", year:"2-digit" }).replace(/\//g,""),
      total_sessions: sessions.length,
      total_ideas:    totalIdeas,
      total_carry:    totalCarry
    },
    sessions,
    tag_index: tagIndex,
    _raw_files: sessionFiles // keep raw files for idea extraction
  };
}

// ─── Query ────────────────────────────────────────────────────────────────────
// Filter and return ideas across all sessions

function extractIdeas(index) {
  const ideas = [];
  for (const file of (index._raw_files || [])) {
    for (const idea of (file.ideas || [])) {
      ideas.push({
        session_id:   file.session.id,
        session_name: file.session.name || file.session.id,
        agent:        file.session.agent,
        date:         file.session.date,
        ...idea
      });
    }
  }
  return ideas;
}

function query(index, { tags = [], min_novelty = 1, carry_forward = null, search = "" } = {}) {
  let ideas = extractIdeas(index);

  // tag filter — match any tag
  if (tags.length > 0) {
    ideas = ideas.filter(i =>
      (i.domain_tags || []).some(t => tags.includes(t))
    );
  }

  // novelty floor
  ideas = ideas.filter(i => i.novelty >= min_novelty);

  // carry forward flag
  if (carry_forward !== null) {
    ideas = ideas.filter(i => i.carry_forward === carry_forward);
  }

  // text search across thesis, generative_value, domain_tags
  if (search) {
    const q = search.toLowerCase();
    ideas = ideas.filter(i => {
      const hay = [
        i.thesis,
        i.generative_value,
        ...(i.domain_tags || [])
      ].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }

  return ideas.sort((a, b) => b.novelty - a.novelty);
}

// ─── Brief ───────────────────────────────────────────────────────────────────
// Returns top 5 carry-forward ideas for a given set of tags
// Use this to prepend context to a new agent session

function brief(index, tags = []) {
  return query(index, { tags, min_novelty: 3, carry_forward: true }).slice(0, 5);
}

// ─── Summarize ───────────────────────────────────────────────────────────────
// Returns a plain-language briefing string ready to paste into an ACC

function summarize(index, tags = []) {
  const ideas = brief(index, tags);
  if (!ideas.length) return "// ATHENA ARCHIVE — No relevant carry-forward ideas found for these tags.";

  const lines = [
    "// ATHENA ARCHIVE BRIEFING",
    `// Tags: ${tags.length ? tags.join(", ") : "all"}`,
    `// ${ideas.length} relevant idea(s) carried forward`,
    ""
  ];

  for (const idea of ideas) {
    lines.push(`[${idea.session_id} · ${idea.agent} · Novelty ${idea.novelty}/5 · ${idea.type}]`);
    lines.push(`THESIS: ${idea.thesis}`);
    lines.push(`OPENS: ${idea.generative_value}`);
    lines.push(`TAGS: ${(idea.domain_tags || []).join(", ")}`);
    lines.push("");
  }

  return lines.join("\n");
}

// ─── Exports ─────────────────────────────────────────────────────────────────
export {
  discoverFiles,
  loadAllSessions,
  buildIndex,
  extractIdeas,
  query,
  brief,
  summarize
};
