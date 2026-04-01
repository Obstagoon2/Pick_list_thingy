# FRC Alliance Selection Pick List

A single-file web tool for FRC alliance selection, built for Team 1912 Combustion. Combines scouting CSV data, Statbotics EPA, TBA rankings/OPR, robot photos, and manual notes into a unified live pick list — usable live at events on both desktop and mobile.

---

## Features

### Data Sources

#### Fetch from Statbotics
Enter an FRC event code (e.g. `2026mslr`) and hit **Fetch Statbotics**. Pulls every team at the event in one request from the [Statbotics API](https://statbotics.io), then fetches full per-team data in parallel. After fetching, a column picker lets you choose exactly which fields to import and whether each one counts toward the weighted total.

Fields available:
- EPA (total expected points added)
- Auto EPA, Teleop EPA, Endgame EPA
- Qual rank, W, L, RPs, Win%

#### Fetch from TBA
Enter an event code and hit **Fetch TBA**. Pulls team list, qual rankings, and OPRs from [The Blue Alliance API v3](https://www.thebluealliance.com/apidocs/v3) in parallel. Same column picker flow as Statbotics.

Fields available:
- Rank, OPR, DPR, CCWM
- W, L, Ties, RPs

#### Match Scouting CSV
Upload your match scouting export via **Import → Match CSV**. The importer:
- Auto-detects the team column (handles `frc538` or plain `538` format)
- Skips metadata columns (`org_key`, `event_key`, `scouter`, flag columns, etc.)
- Detects numeric vs text columns automatically
- Shows a column picker — choose what to import and whether it counts toward the total
- Multiple match entries per team are **averaged** across all matches

#### Pit Scouting CSV
Same flow as match CSV. Single row per team so no averaging needed. Import via **Import → Pit CSV**.

#### Non-Numeric Columns
Text columns (e.g. drive base type, auto description) are detected automatically and imported as display-only fields. They show up in the table and team detail modal but never affect rankings.

---

### Scoring & Rankings

#### Weighted Total
Every numeric criteria has a **weight multiplier**. The weighted total is calculated as:

```
Total = Σ(value × weight) / Σ(weights)
```

Missing values are excluded from both numerator and denominator so blank cells don't drag scores down. Weight 0 means the column shows in the table but is excluded from the total entirely.

#### Criteria Manager
Click **Criteria** to open the criteria manager. For each criterion you can:
- Rename it
- Adjust its weight (0 = display only)
- See its source (statbotics, tba, match, pit, manual)
- Delete it
- Add fully manual criteria you score yourself

#### Live Ranking Views
The sidebar shows a live ranking panel. You can create multiple named ranking views, each using a different subset of criteria. Switch between views instantly with the tabs.

- **Overall** (default) — uses all criteria with weight > 0
- **Custom views** — click **+ View**, name it, and select exactly which criteria to include

This lets you quickly answer "who has the best auto?" or "who's the best climber?" without changing your main scoring.

---

### Team Detail Modal
Click any team number in the table or any team in the live rankings to open a full detail view showing:
- Robot photos (carousel with prev/next, dot indicators)
- All criteria values in a stat grid with weight indicators
- Weighted total highlighted
- All notes
- DNP toggle

---

### Robot Photos
Upload a zip file of robot photos via **Import → Photos**. File naming format:

```
frc{teamnumber}_{photonumber}.jpg
```

Examples: `frc1912_1.jpg`, `frc538_2.png`

Photos are shown in the team detail modal as a carousel. Teams with photos get a 📷 indicator in the table and live rankings.

---

### Notes
Each team has inline note fields in the table. Default tags are **Strategy**, **Autos**, and **Concerns**. You can add or remove tags from the sidebar. Notes are free-text and show up in the team detail modal.

---

### DNP (Do Not Pick)
Check the DNP box on any team to flag them. DNP teams are:
- Grayed out and struck through in the live rankings
- Pushed to the bottom of all ranking views
- Still included in exports with a `Y` in the DNP column
- Can also be toggled from the team detail modal

---

### Import & Export

#### Import menu
Single **Import** button with a dropdown:
- **Match CSV** — upload match scouting data
- **Pit CSV** — upload pit scouting data
- **Photos (.zip)** — upload robot photo zip
- **Open Project** — restore a previously saved project zip (restores everything: teams, scores, notes, criteria, ranking views, photos, settings)

#### Export menu
Single **Export** button that opens an export modal with:
- **Full project (.zip)** — saves everything into a zip file including `project.json` (all state), a `photos/` folder, individual CSVs for every ranking view, and an `all_data.csv` with every column. Load this back with **Open Project** on any device.
- **Rankings CSV per view** — one CSV per ranking view you've created, sorted by score
- **All team data CSV** — every team with every criteria value, notes, weighted total, and DNP status

---

### UI & Settings

#### Dark / Light Mode
Toggle between dark (default) and light mode with the button in the top bar.

#### Sortable Table
Click any column header to sort ascending or descending.

#### Mobile Layout
On screens ≤ 700px wide the layout switches to a collapsible accordion. Sections:
- **Controls** — event code input, all fetch/import/export buttons
- **Live Rankings** — ranking tabs and live list (open by default)
- **Team Table** — full scrollable data table
- **Notes & Tags** — manage note tags
- **Summary** — team/criteria counts

---

## Deployment

This is a single `index.html` file with no build step required. Open it locally in any browser or deploy to GitHub Pages / Vercel.

### GitHub Pages
1. Push `index.html` to your repo
2. Go to **Settings → Pages**, set source to your main branch
3. Done — your pick list is live

---

## Data Format Reference

### Match / Pit CSV
The team column is auto-detected. Any column name containing `team`, `team_key`, or `team_number` works. Team keys in `frc538` format are handled automatically.

The following metadata columns are always skipped regardless of your CSV:
`org_key`, `year`, `event_key`, `match_key`, `match_number`, `time`, `alliance`, `scouter`, `team_key`, `RedCard`, `YellowCard`, and flag columns (🚩).

### Photo Zip
Photos must be named `frc{num}_{photonum}.ext` where ext is `jpg`, `jpeg`, `png`, `gif`, or `webp`. Multiple photos per team are supported and displayed in order by photo number.

---

## Built With
- [PapaParse](https://www.papaparse.com/) — CSV parsing
- [JSZip](https://stuk.github.io/jszip/) — zip file handling
- [Statbotics API](https://www.statbotics.io/docs/rest) — EPA data
- [The Blue Alliance API v3](https://www.thebluealliance.com/apidocs/v3) — rankings, OPR, team data
