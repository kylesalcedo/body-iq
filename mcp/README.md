# Body IQ MCP server

Query the Body IQ biomechanics knowledge graph from any MCP client (Claude
Desktop, Claude Code, an agent) — **no database required**. The server reads the
exported [dataset bundle](../exports/dataset/), so it runs anywhere Node does,
and every payload carries validation metadata (`status` / `confidence` /
`qualityScore` / `sources`) for trust-aware reasoning.

## Tools

| Tool | What it does |
|---|---|
| `find_exercises` | Exercises by target muscle (+ role), movement, goal, or task, with difficulty / confidence / quality filters |
| `get_exercise` | One exercise's full record — muscles by role, movements, cues, dosing, positions, progressions, goals, tasks, **and its source citations** |
| `get_muscle` | Full attachment anatomy + the movements/exercises it drives + codes + sources |
| `get_movement` | Plane, ROM, prime movers, and the exercises that train it |
| `find_by_goal` | Exercises for a rehab / performance / prevention / mobility goal, essential-first, with cautions |
| `search` | Text search across exercises, muscles, movements, goals, tasks |
| `dataset_info` | Dataset version, schema version, git SHA, counts |

## Get the data

The server needs a dataset bundle. Either:
- **From this repo:** `pnpm export:dataset` (needs the seeded database) — writes `exports/dataset/body-iq-dataset.json`, which the server loads by default; or
- **Standalone:** download `body-iq-dataset.json` from a [GitHub Release](https://github.com/kylesalcedo/body-iq/releases) and point `BODY_IQ_DATASET` at it.

## Connect it

Add to your MCP client config (Claude Desktop: `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "body-iq": {
      "command": "npx",
      "args": ["tsx", "/Users/kylesalcedo/body-iq/mcp/server.ts"],
      "cwd": "/Users/kylesalcedo/body-iq"
    }
  }
}
```

To use a downloaded bundle instead of the repo's, add:
`"env": { "BODY_IQ_DATASET": "/absolute/path/to/body-iq-dataset.json" }`.

Restart the client; the tools appear under **body-iq**. Try: *"find beginner
exercises that target the gluteus maximus as a primary mover, quality ≥ 80"* or
*"show the evidence chain for the back squat."*
