# FRC Alliance Selection Pick List

A single-file web tool for FRC alliance selection built for Team 1912 Combustion. Combines live data from Statbotics and The Blue Alliance with your team's scouting CSVs, robot photos, and manual notes into a unified weighted pick list — usable at events on both desktop and mobile.

Built with [Claude](https://claude.ai) by Anthropic.

---

## Data Sources

### Fetch from Statbotics
Enter an FRC event code (e.g. `2026mslr`) and click **Fetch Statbotics**. Pulls every team at the event using the [Statbotics API](https://statbotics.io), then fetches full per-team data in parallel. A column picker lets you choose exactly which fields to import and whether each counts toward the weighted total.

Fields available:
- EPA (total expected points added)
- Auto EPA, Teleop EPA, Endgame EPA
- Qual rank, W, L, RPs, Win%

### Fetch from TBA
Enter an event code and click **Fetch TBA**. Pulls team list, qual rankings, and OPRs from [The Blue Alliance API v3](https://www.thebluealliance.com/apidocs/v3). Same column picker flow as Statbotics.

Fields available:
- Rank, OPR, Def Power Rating, Win Margin
- W, L, Ties, RPs

### Auto-Refresh
Click **↺ Refresh** to silently re-pull Statbotics and TBA data for all existing teams without going through the column picker again. Useful during an event when rankings and OPRs are changing match by match. Data also auto-refreshes every 5 minutes in the background.

### Match Scouting CSV
Upload your match scouting export via **Import → Match CSV**. The importer:
- Auto-detects the team column (handles `frc538` or plain `538` format)
- Skips metadata columns (`org_key`, `event_key`, `scouter`, flag columns, etc.)
- Detects numeric vs. text columns automatically
- Shows a column picker — choose what to import and whether it counts toward the total
- Numeric columns: multiple match entries per team are **averaged**
- Text columns (auto descriptions, strategy notes, etc.): all unique values are stored and can be cycled through with arrows

### Pit Scouting CSV
Same flow as match CSV via **Import → Pit CSV**. Single row per team so no averaging needed.

### Text Columns
Text columns (e.g. drive base type, auto description, strategy notes) are detected automatically. They show up in the team table and detail modal as display-only fields — never affect rankings. If a team has multiple different text values for a column (e.g. multiple match entries with different notes), arrows appear to cycle through each entry: **‹ value 2/4 ›**

---

## Scoring & Rankings

### Weighted Total
Every numeric criterion has a weight multiplier. The weighted total is:

```
Total = Σ(value × weight) / Σ(weights)
```

Missing values are excluded from both numerator and denominator so blank cells don't drag scores down. Weight 0 means the column displays in the table but is excluded from the total.

### Criteria Manager
Click **Criteria** to open the criteria manager. For each criterion you can:
- Rename it
- Adjust its weight (0 = display only, text columns always display only)
- See its source (statbotics, tba, match, pit, manual)
- Delete it
- Add fully manual criteria you score yourself per team

### Live Ranking Views
The sidebar shows a live ranking panel with tabs. Create multiple named ranking views, each using a different subset of criteria — useful for answering "who has the best auto?" without changing your main scoring.

- **Overall** (default) — uses all criteria with weight > 0
- **Custom views** — click **+ View**, name it, select which criteria to include
- Switching views re-sorts the main table and sidebar simultaneously
- Each view can be exported as its own CSV

---

## Team Detail Modal
Click any team number in the table or any team in the live rankings sidebar to open a full detail view:

- **← →** arrows to browse teams in current ranking order
- Rank position and score shown for every ranking view
- **Robot photo carousel** with prev/next, dot indicators, and photo counter
- **Stats grid** — all criteria values with weight indicators and weighted total highlighted
- **Text fields** with multiple entries show cycle arrows (‹ 1/3 ›)
- **Notes panel** — editable note fields for every tag, directly in the modal
- **Tag manager** — add or remove note tags without leaving the modal
- **DNP toggle** in the modal footer

---

## Robot Photos
Upload a zip file of robot photos via **Import → Photos**. Naming format:

```
frc{teamnumber}_{photonumber}.jpg
```

Examples: `frc1912_1.jpg`, `frc538_2.png`

Supported formats: jpg, jpeg, png, gif, webp. Teams with photos show a 📷 indicator in the table and rankings sidebar.

---

## Notes
Each team has inline note fields in the table. Default tags: **Strategy**, **Autos**, **Concerns**. Add or remove tags from the sidebar or directly from the team detail modal. Notes are fully editable inline in both the table and the detail modal.

---

## DNP (Do Not Pick)
Check the DNP box on any team to flag them. DNP teams:
- Are grayed out in the team table (sorted inline by score, not pushed to bottom)
- Are grayed out in the live rankings sidebar (sorted inline by score)
- Show `—` instead of a rank number in the sidebar
- Can be toggled from both the table and the team detail modal
- Are included in all exports with a `Y` in the DNP column

---

## Persistence (IndexedDB)
All data is automatically saved to your browser's IndexedDB storage — no manual saving needed. This includes:
- All teams, scores, text values, and notes
- All criteria and weights
- All ranking views and settings
- Robot photos (stored as blobs, survive page refresh)
- Theme preference and event code

The **Summary** panel shows save status: `● Saving...` while writing, `✓ Saved [time]` when complete, and `↻ Loaded — saved [time]` on page reload. Data persists across browser sessions on the same device and origin.

---

## Import & Export

### Import (single button, modal menu)
- **Match CSV** — upload match scouting data
- **Pit CSV** — upload pit scouting data
- **Photos (.zip)** — upload robot photo zip
- **Open Project** — restore a previously saved project zip (restores everything including photos)

### Export (single button, modal menu)
- **Full project (.zip)** — saves everything: `project.json` (all state), `photos/` folder with all robot images, individual CSVs for every ranking view, and `all_data.csv` with every column. Load back with **Open Project** on any device.
- **Rankings CSV per view** — one CSV per ranking view, sorted by score
- **All team data CSV** — every team with every criterion, notes, weighted total, and DNP status

### Clear Data
Click **Clear data** in the top bar for a full reset. A confirmation dialog prevents accidental deletion.

---

## UI & Settings

### Dark / Light Mode
Toggle with the **Light mode / Dark mode** button. Defaults to dark. Preference is saved and restored on reload.

### Sortable Table
Click any column header to sort ascending or descending. Sticky header stays visible while scrolling. Horizontal scrollbar stays at the bottom of the visible screen.

### Mobile Layout
On screens ≤ 700px the layout switches to collapsible accordion sections:
- **Controls** — event code, all fetch/import/export/criteria buttons
- **Live Rankings** — ranking tabs and ranked list (open by default)
- **Team Table** — full scrollable data table
- **Notes & Tags** — manage note tags
- **Summary** — team/criteria counts and save status

All features including TBA/Statbotics fetch, import, export, and the team detail modal work identically on mobile.

---

## Data Format Reference

### Match / Pit CSV
Team column is auto-detected. Column names containing `team`, `team_key`, or `team_number` work. Keys in `frc538` format are handled automatically.

Always-skipped metadata columns:
`org_key`, `year`, `event_key`, `match_key`, `match_number`, `time`, `alliance`, `scouter`, `team_key`, `RedCard`, `YellowCard`, `describepizzatoppings`, and flag columns (🚩)

### Photo Zip
Photos must be named `frc{num}_{photonum}.ext`. Multiple photos per team are supported and displayed in carousel order by photo number.

---

## Tech Stack
- [PapaParse](https://www.papaparse.com/) — CSV parsing
- [JSZip](https://stuk.github.io/jszip/) — zip file handling for photos and project export
- [Statbotics API v3](https://www.statbotics.io) — EPA and match data
- [The Blue Alliance API v3](https://www.thebluealliance.com/apidocs/v3) — rankings, OPR, team data
- IndexedDB — persistent local storage including photo blobs
- No frameworks, no build step — single `index.html` file
