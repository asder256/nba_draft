# On the Clock

A buildless NBA draft assistant for a nine-team, 13-round snake draft. Uses the supplied RotoBaller player pool. No backend, account, install, or API key.

## Open locally

Open `dist/index.html` directly in a browser, or run `node serve.cjs` in this directory and visit http://127.0.0.1:4173. A local server provides a consistent browser-storage origin. Run `node test.cjs` for the ranking/roster checks.

## Publish with GitHub Pages

For this existing repository, commit the root `index.html`, `.nojekyll`, and the `draft-assistant/` directory. The root page redirects to the app. Choose Settings → Pages → Deploy from a branch → your chosen branch → / (root). Asset paths are relative, so a repository subpath works. No build step is required. The user handles committing and publication.

For a separate repository, copy all five files inside `dist/` directly to its root. Alternatively, publish `draft-assistant/dist` as the Pages artifact through your own deployment workflow.

GitHub Pages hosting may make the supplied projection data accessible to site visitors; choose repository/hosting visibility appropriate to your intended personal use and source permissions.

## Draft flow

1. Confirm the center cap. Only your roster is tracked; no draft slot or opponent teams need to be configured.
2. Click **Draft** to add a player to your team, or **Drafted** when someone else takes them. Either removes them from availability. Recommendations respond only to your roster and the remaining pool.
3. Use Undo for the last mistake. For an earlier mistake, undo back to it and re-enter subsequent picks.
4. Watch players with the star. Click a position label to edit ESPN eligibility. Any C-eligible player counts toward the configured center cap, including on the bench.
5. Use category chips to explicitly apply punts. Review the prompt after three or more picks; it never changes your strategy automatically.
6. Export draft backups regularly. Restore loads a validated backup. Draft progress belongs to the current browser and origin, and does not sync between devices or between local and hosted URLs.

## Ranking method and limits

- Source: `rotoballer-nba-Overall-9cat-proj-rankings.csv`, 250 unique players, loaded October 12, 2026. The CSV does not label its season or update date. No independent forecast-quality validation has been performed.
- Original source rank and tier are nine-category values. They are retained as reference metadata only. Source rank selects a fixed top-117 comparison pool and breaks equal-score ties; it is **not** used as a substitute for eight-category value. This baseline inherits some source nine-category selection bias.
- Two players have blank projections: Wendell Carter Jr. and Leonard Miller. They remain draftable for tracking, display as unscored, and are excluded from recommendations and roster averages. A roster containing them shows an incomplete-analysis message.
- Standardize each included statistic against that fixed comparison pool. Counting categories receive weight 1, unweighted FG% and FT% proxies receive 0.35 each. Shooting attempts are absent, so correct volume-weighted percentage impact is unavailable. Toggle estimates off for counting-only comparisons. Games-played projections, schedules, injuries, and ADP are absent too.
- Turnovers are omitted from the embedded statistical data and all scores. Punt categories receive zero weight. The interface never calls these scores exact rankings or win probabilities.
- Team-fit scores increase the weight of below-baseline, non-punted categories by at most 45%. This is a heuristic and can favour repairing weaknesses. It does not optimize five-category win probability or simulate the rest of the draft.
- Punt advice looks at average standardized roster stats and remaining eligible candidates. It flags a discussion, not a conclusion that a category should be abandoned. There is no automatic sleeper label without supporting ADP/news.
- Roster matching assigns players to PG, SG, SF, PF, C, G, F, 3 UTIL, 3 bench using their editable eligibility. IR is excluded from draft slots. Assignments show one legal arrangement, not a lineup recommendation.
- Category strength labels compare with the fixed baseline, not opponent forecasts. Hover or focus category labels for definitions. Colored stats compare raw projections with the baseline: dark red ≤ −1 standard deviation, light red below average, light green at/above average, dark green ≥ +1 standard deviation. Missing projections remain neutral. The table includes baseline values.
- Older version-1 saves and exports are converted using their stored snake slot to identify your picks; other picks become Drafted. Undo reverses either action.

All essential assets are local. The original CSV and unrelated playbook are left unchanged. To update the pool later, regenerate `dist/data.js` while preserving stable player IDs, or start a new draft; saved picks refer to IDs.
