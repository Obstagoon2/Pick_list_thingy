# FRC Reefscape Scouting Pick List Tool

Single-page web tool to generate a scouting pick list by merging **Pit Scouting** and **Match Scouting** CSVs.

## Run

- Open `index.html` in a browser.
- Upload both CSVs.

## CSV expectations

### Pit scouting CSV (one row per team)

- `team_key` (e.g. `frc1912`)
- `driveBaseType`
- `notes`

### Match scouting CSV (multiple rows per team)

- `team_key` (e.g. `frc1912`)
- `AutoPoints`
- `TeleopPoints`
- `EndgamePoints`
- `contributedPoints` (averaged and shown as **Avg Total**)
- `diedDuringMatch` (`1` means the robot died; anything else counts as lived)

Team mapping: `team_key` like `frc1912` is converted to team number `1912` by stripping the `frc` prefix.

## UI notes

- Default sort is **Avg Total (descending)**.
- Click a row to toggle **Available** / **Picked**.
- Picked rows are greyed out + strike-through and are saved in `localStorage`.
- “Your team number” is highlighted in yellow and is saved in `localStorage`.

