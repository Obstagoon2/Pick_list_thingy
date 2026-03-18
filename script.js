/* global Papa */

const STORAGE_KEYS = {
  pickedTeams: "reefscape_picklist_pickedTeams_v1",
  myTeam: "reefscape_picklist_myTeam_v1",
};

const state = {
  pitRows: null,
  matchRows: null,
  mergedTeams: [],
  sort: { key: "avgTotal", dir: "desc" },
  picked: new Set(),
  myTeamNumber: null,
};

function $(id) {
  return document.getElementById(id);
}

function normalizeTeamKey(teamKeyRaw) {
  const s = String(teamKeyRaw ?? "").trim().toLowerCase();
  return s;
}

function teamKeyToNumber(teamKeyRaw) {
  const s = normalizeTeamKey(teamKeyRaw);
  if (!s) return null;
  if (s.startsWith("frc")) {
    const n = parseInt(s.slice(3), 10);
    return Number.isFinite(n) ? n : null;
  }
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

function toNumber(v) {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const s = String(v).trim();
  if (!s) return 0;
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function format1(n) {
  if (!Number.isFinite(n)) return "0.0";
  return n.toFixed(1);
}

function readLocalStorage() {
  try {
    const pickedArr = JSON.parse(localStorage.getItem(STORAGE_KEYS.pickedTeams) || "[]");
    if (Array.isArray(pickedArr)) state.picked = new Set(pickedArr.map((x) => Number(x)).filter(Number.isFinite));
  } catch {
    state.picked = new Set();
  }

  const myTeamRaw = localStorage.getItem(STORAGE_KEYS.myTeam);
  const myTeamN = myTeamRaw ? parseInt(myTeamRaw, 10) : NaN;
  state.myTeamNumber = Number.isFinite(myTeamN) ? myTeamN : null;
}

function writeLocalStorage() {
  localStorage.setItem(STORAGE_KEYS.pickedTeams, JSON.stringify(Array.from(state.picked.values()).sort((a, b) => a - b)));
  localStorage.setItem(STORAGE_KEYS.myTeam, state.myTeamNumber ? String(state.myTeamNumber) : "");
}

function setStatusLine(text) {
  $("statusLine").textContent = text;
}

function parseCsvFile(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (results) => resolve(results),
      error: (err) => reject(err),
    });
  });
}

function buildPitIndex(pitRows) {
  const map = new Map();
  for (const row of pitRows) {
    const key = normalizeTeamKey(row.team_key);
    if (!key) continue;
    map.set(key, {
      team_key: key,
      teamNumber: teamKeyToNumber(key),
      driveBaseType: String(row.driveBaseType ?? "").trim(),
      notes: String(row.notes ?? "").trim(),
    });
  }
  return map;
}

function buildMatchAgg(matchRows) {
  const map = new Map();
  for (const row of matchRows) {
    const key = normalizeTeamKey(row.team_key);
    if (!key) continue;
    const died = String(row.diedDuringMatch ?? "").trim() === "1";
    const auto = toNumber(row.AutoPoints);
    const tele = toNumber(row.TeleopPoints);
    const endg = toNumber(row.EndgamePoints);
    const total = toNumber(row.contributedPoints);

    if (!map.has(key)) {
      map.set(key, {
        team_key: key,
        teamNumber: teamKeyToNumber(key),
        matches: 0,
        died: 0,
        sumAuto: 0,
        sumTeleop: 0,
        sumEndgame: 0,
        sumTotal: 0,
      });
    }
    const agg = map.get(key);
    agg.matches += 1;
    agg.died += died ? 1 : 0;
    agg.sumAuto += auto;
    agg.sumTeleop += tele;
    agg.sumEndgame += endg;
    agg.sumTotal += total;
  }

  for (const agg of map.values()) {
    const m = agg.matches || 1;
    agg.avgAuto = agg.sumAuto / m;
    agg.avgTeleop = agg.sumTeleop / m;
    agg.avgEndgame = agg.sumEndgame / m;
    agg.avgTotal = agg.sumTotal / m;
    agg.lived = agg.matches - agg.died;
    agg.reliabilityRate = agg.matches ? agg.lived / agg.matches : 0;
  }
  return map;
}

function mergeData(pitRows, matchRows) {
  const pitIndex = buildPitIndex(pitRows);
  const matchAgg = buildMatchAgg(matchRows);

  const keys = new Set([...pitIndex.keys(), ...matchAgg.keys()]);
  const merged = [];

  for (const key of keys) {
    const p = pitIndex.get(key);
    const m = matchAgg.get(key);

    const teamNumber = (m && m.teamNumber) || (p && p.teamNumber) || teamKeyToNumber(key);
    if (!teamNumber) continue;

    merged.push({
      team_key: key,
      teamNumber,
      avgAuto: m ? m.avgAuto : 0,
      avgTeleop: m ? m.avgTeleop : 0,
      avgEndgame: m ? m.avgEndgame : 0,
      avgTotal: m ? m.avgTotal : 0,
      matches: m ? m.matches : 0,
      lived: m ? m.lived : 0,
      reliabilityRate: m ? m.reliabilityRate : 0,
      driveBaseType: p ? p.driveBaseType : "",
      notes: p ? p.notes : "",
      status: state.picked.has(teamNumber) ? "Picked" : "Available",
    });
  }

  return merged;
}

function compareValues(a, b, key, dir) {
  const mult = dir === "asc" ? 1 : -1;
  const va = a[key];
  const vb = b[key];

  const na = typeof va === "number" ? va : NaN;
  const nb = typeof vb === "number" ? vb : NaN;
  if (Number.isFinite(na) && Number.isFinite(nb)) return mult * (na - nb);

  const sa = String(va ?? "").toLowerCase();
  const sb = String(vb ?? "").toLowerCase();
  if (sa < sb) return -1 * mult;
  if (sa > sb) return 1 * mult;
  return 0;
}

function reliabilityClass(rate) {
  if (!Number.isFinite(rate)) return "warn";
  if (rate >= 0.85) return "good";
  if (rate <= 0.6) return "bad";
  return "warn";
}

function renderTable() {
  const tbody = $("pickTableBody");
  tbody.innerHTML = "";

  const rows = [...state.mergedTeams].sort((a, b) => {
    const primary = compareValues(a, b, state.sort.key, state.sort.dir);
    if (primary !== 0) return primary;
    return compareValues(a, b, "teamNumber", "asc");
  });

  if (rows.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 9;
    td.className = "empty";
    td.textContent = "No merged teams to display yet.";
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  const my = state.myTeamNumber;

  for (const r of rows) {
    const picked = state.picked.has(r.teamNumber);
    const tr = document.createElement("tr");
    tr.dataset.teamNumber = String(r.teamNumber);
    if (picked) tr.classList.add("pickedRow");
    if (my && r.teamNumber === my) tr.classList.add("myTeam");

    const relClass = reliabilityClass(r.reliabilityRate);
    const reliabilityText = `${r.lived}/${r.matches} matches lived`;

    tr.innerHTML = `
      <td>${r.teamNumber}</td>
      <td class="num">${format1(r.avgAuto)}</td>
      <td class="num">${format1(r.avgTeleop)}</td>
      <td class="num">${format1(r.avgEndgame)}</td>
      <td class="num"><strong>${format1(r.avgTotal)}</strong></td>
      <td>${escapeHtml(r.driveBaseType)}</td>
      <td>
        <span class="reliability">
          <span class="dot ${relClass}" aria-hidden="true"></span>
          <span>${escapeHtml(reliabilityText)}</span>
        </span>
      </td>
      <td>${escapeHtml(r.notes)}</td>
      <td class="statusCell ${picked ? "picked" : "available"}">${picked ? "Picked" : "Available"}</td>
    `;

    tr.addEventListener("click", () => togglePicked(r.teamNumber));
    tbody.appendChild(tr);
  }
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function togglePicked(teamNumber) {
  if (!Number.isFinite(teamNumber)) return;
  if (state.picked.has(teamNumber)) state.picked.delete(teamNumber);
  else state.picked.add(teamNumber);
  writeLocalStorage();
  renderTable();
}

function recomputeMerged() {
  if (!state.pitRows || !state.matchRows) return;
  state.mergedTeams = mergeData(state.pitRows, state.matchRows);
  renderTable();
  setStatusLine(`Merged ${state.mergedTeams.length} teams. Sorted by Avg Total (desc).`);
}

function wireSorting() {
  const headers = document.querySelectorAll("thead th[data-sort]");
  headers.forEach((th) => {
    th.addEventListener("click", (e) => {
      e.preventDefault();
      const key = th.dataset.sort;
      if (!key) return;
      if (state.sort.key === key) state.sort.dir = state.sort.dir === "asc" ? "desc" : "asc";
      else {
        state.sort.key = key;
        state.sort.dir = key === "teamNumber" ? "asc" : "desc";
      }
      renderTable();
    });
  });
}

function downloadTextFile(filename, content, mime = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function exportMergedCsv() {
  if (!state.mergedTeams.length) return;
  const rows = [...state.mergedTeams].map((r) => ({
    teamNumber: r.teamNumber,
    avgAuto: Number(format1(r.avgAuto)),
    avgTeleop: Number(format1(r.avgTeleop)),
    avgEndgame: Number(format1(r.avgEndgame)),
    avgTotal: Number(format1(r.avgTotal)),
    driveBaseType: r.driveBaseType,
    reliability: `${r.lived}/${r.matches} matches lived`,
    notes: r.notes,
    status: state.picked.has(r.teamNumber) ? "Picked" : "Available",
  }));
  const csv = Papa.unparse(rows, { quotes: false });
  downloadTextFile("merged_pick_list.csv", csv, "text/csv;charset=utf-8");
}

async function onPitFile(file) {
  if (!file) return;
  setStatusLine("Parsing pit scouting CSV…");
  const results = await parseCsvFile(file);
  if (results.errors?.length) {
    console.warn(results.errors);
  }
  state.pitRows = results.data || [];
  setStatusLine(`Pit scouting loaded: ${state.pitRows.length} rows. Waiting for match CSV…`);
  recomputeMerged();
}

async function onMatchFile(file) {
  if (!file) return;
  setStatusLine("Parsing match scouting CSV…");
  const results = await parseCsvFile(file);
  if (results.errors?.length) {
    console.warn(results.errors);
  }
  state.matchRows = results.data || [];
  setStatusLine(`Match scouting loaded: ${state.matchRows.length} rows. Waiting for pit CSV…`);
  recomputeMerged();
}

function onMyTeamChange(value) {
  const n = parseInt(String(value || ""), 10);
  state.myTeamNumber = Number.isFinite(n) ? n : null;
  writeLocalStorage();
  renderTable();
}

function clearPicked() {
  state.picked.clear();
  writeLocalStorage();
  renderTable();
}

function init() {
  readLocalStorage();
  wireSorting();

  const myTeamInput = $("myTeam");
  if (state.myTeamNumber) myTeamInput.value = String(state.myTeamNumber);

  $("pitCsv").addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    try {
      await onPitFile(file);
    } catch (err) {
      console.error(err);
      setStatusLine("Failed to parse pit CSV. Check console for details.");
    }
  });

  $("matchCsv").addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    try {
      await onMatchFile(file);
    } catch (err) {
      console.error(err);
      setStatusLine("Failed to parse match CSV. Check console for details.");
    }
  });

  myTeamInput.addEventListener("input", (e) => onMyTeamChange(e.target.value));

  $("clearPicked").addEventListener("click", () => clearPicked());
  $("exportCsv").addEventListener("click", () => exportMergedCsv());

  renderTable();
}

window.addEventListener("DOMContentLoaded", init);

