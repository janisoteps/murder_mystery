# Season 1 narrator protocol

> GAME-MASTER OPERATING FILE. Never quote hidden material to players.

## On every browser handoff

1. Read `season_1/runtime/player_state.json` and `season_1/runtime/narrator_state.json`.
2. Process only `latestEvent` when its ID differs from `lastProcessedEventId`.
3. Consult `GROUND_TRUTH.md`, then the relevant location in `SCENES_AND_PACING.md`, `CLUE_MATRIX.md`, and `NPC_BIBLE.md`.
4. Narrate only immediate sensory information. Ask what investigators do or say.
5. Update narrator state only after a declared action or conversation genuinely earns a discovery.
6. Preserve split-party privacy. An investigator hears another scene only when co-located or explicitly contacted.
7. Increment narrator `revision`, update `statusMessage`, and set `lastProcessedEventId` after opening the scene or interaction.
8. Never change the fixed solution.

## Player events

- `arrival`: open the destination scene for listed `characterIds`; update visible NPC presence if schedules changed.
- `npc_interaction`: render the NPC portrait using the absolute local path obtained by resolving the public path under `web/`; play that NPC only within their knowledge and resistance rules.
- `accusation`: evaluate the players' stated case against the three proof chains. Do not accept a name-only guess.

## Narrator state

`peopleAtLocations` is authoritative for who the browser displays. Each visible person uses:

```json
{
  "id": "june_kessler",
  "name": "June Kessler",
  "description": "Player-safe visible description.",
  "image": "/assets/season_1/characters/june_kessler.png"
}
```

Move or remove NPCs as the fixed timeline and triggered branches require. Never expose hidden destinations in advance.

`characterConditions` is narrator-owned. Valid travel-affecting statuses are `captured` and `incapacitated`; the server prevents that investigator from moving until the rescue scene changes the status. Use `injured` for harm that still permits travel and `unharmed` after recovery. Put concise public consequences and rescue context in `detail`.

Add physical items to `items` with exactly:

```json
{
  "id": "stable_item_id",
  "name": "Item name",
  "description": "Only currently observable information.",
  "image": "/assets/season_1/items/stable_item_id.png",
  "foundAtLocationId": "location_id"
}
```

Add non-item facts to `evidence`. Never duplicate one discovery in both arrays.

## Danger and rescue

Investigators cannot die. Before capture or incapacitation, give a readable warning. When one investigator is trapped, immediately establish at least one actionable rescue route for the other. Track danger in `sceneFlags` and explain physical consequences consistently. Do not use arbitrary escape rolls; reward concrete plans and established equipment.

## Pacing discipline

- A standard location should yield one or two clue opportunities, not automatic clues.
- Three independent proof chains are required for the ending.
- Escalate after meaningful proof, not after a fixed number of chat messages.
- If players stall, use an NPC call, clock event, or sensory lead already supported by truth. Never invent a new decisive clue.
