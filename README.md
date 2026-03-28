# FRC Alliance Selection Pick List — README

## Overview
This is a single-file HTML tool for FRC alliance selection. It combines scouting CSV data, Statbotics EPA/ranking data, and manual notes into a unified pick list with live weighted rankings. Save it as a `.html` file and open it in a browser for full functionality. Or go to https://obstagoon2.github.io/Pick_list_thingy/ to use the tool.

---

## Getting Started
Save and open locally — the artifact preview works for everything except the Statbotics fetch. Download the file, open in Chrome or Firefox, and all features including live data pulls work.

---

## Data Sources
You can use any combination of these three sources. All data merges into the same team table.

### Statbotics Pull
Enter an FRC event code (e.g. `2026mslr`) and hit **Fetch from Statbotics**. This calls:
```
GET https://api.statbotics.io/v3/team_events?event={code}&limit=100
```
and pulls every team at that event in one request. Fields pulled per team:

| Field | Description |
|---|---|
| EPA | Total expected points added |
| Auto EPA | Auto period breakdown |
| Teleop EPA | Teleop period breakdown |
| Endgame EPA | Endgame/climb breakdown |
| Rank | Current qual ranking |
| W / L | Qual record |

### Match Scouting CSV
Upload your match scouting export. The importer:
- Auto-detects the team column (handles `frc538` or plain `538` format)
- Skips metadata columns (`org_key`, `event_key`, `scouter`, flag columns, etc.)
- Finds all numeric columns and shows you a column picker checklist so you choose exactly which ones become criteria
- For teams with multiple match entries, all numeric values are averaged across matches

### Pit Scouting CSV
Same import flow as match scouting. Single row per team so no averaging needed. Pit and match columns are kept separate in the criteria list (prefixed `pit_` and `match_`).

### Manual Entry
Hit **+ Team** to add a team by number. You can also manually enter scores for any non-Statbotics criteria directly in the table.

---

## The Team Table
The main table shows every team with all their data in one place. Columns include team number, name, every active criteria, a weighted total, notes, and a DNP toggle.

- **Sortable** — click any column header to sort ascending/descending
- **Editable scores** — CSV-imported and manual criteria have inline number inputs; Statbotics columns are read-only
- **DNP toggle** — checking DNP grays out the team and pushes them to the bottom of all rankings

---

## Criteria & Weights
Hit **Criteria** to open the criteria manager. Every imported column and Statbotics field becomes a criterion. For each criterion you can:

- Rename it to something friendlier (e.g. rename `match_contributedPoints` to `Contributed Pts`)
- Set a **weight** — a multiplier that controls how much that criterion influences the weighted total (`0` = excluded entirely)
- Delete criteria you don't want
- Add **manual criteria** — custom fields you score yourself per team

---

## How Live Rankings Are Calculated
The weighted total for a team is a weighted average of all criteria with weight > 0:

```
Total = Σ(value × weight) / Σ(weights)
```

**Example** — if a team has:
- EPA = 64, weight 2
- Driver Skill = 8, weight 1
- Climb Height = 3, weight 1

```
Total = (64×2 + 8×1 + 3×1) / (2+1+1) = 139 / 4 = 34.75
```

> Missing values (blank cells) are excluded from both the numerator and denominator, so they don't drag scores down.

---

## Ranking Views
The sidebar shows a **Live Rankings** panel with tabs across the top. You can create multiple named ranking views that each use a different subset of criteria — useful for quickly answering *"who's the best climber?"* or *"who has the best auto?"* without changing your main scoring.

Hit **+ View** to create a new view. For each view you can:
- Give it a name (e.g. `Offense`, `EPA Only`, `Climb Focus`, `Auto Specialists`)
- Select which criteria are included in that view's ranking calculation
- Switch between views instantly using the tabs — the sidebar list updates live

The **Overall** view (always first) uses all criteria with no filter. Ranking views use the same weighted average formula as the main total, just scoped to the selected criteria.

---

## Notes
Each team has inline note fields for **Strategy**, **Autos**, and **Concerns** by default — based on real pit scouting (e.g. asking the drive team about their auto routines and game plan). You can add or remove note tags from the sidebar. Notes are free-text and save in memory as you type.

---

## DNP List
Check the **DNP** box on any team to mark them as Do Not Pick. DNP teams are:
- Grayed out and struck through in the rankings sidebar
- Pushed to the bottom of all ranking views
- Still exported in the CSV with a `Y` in the DNP column

---

## Export
Hit **Export** to download a `picklist.csv` with all teams in their current sort order, including every criteria value, weighted total, all note fields, and DNP status. Useful for sharing with your drive team or coaches.

---

## Dark / Light Mode
Toggle with the **Dark / Light** button in the top bar. Persists for the session.
