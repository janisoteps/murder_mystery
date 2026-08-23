# Season 0 narrator protocol

> GAME-MASTER OPERATING FILE. It contains no player-facing prose.

When the players message Codex that they have arrived:

1. Read `season_0/runtime/player_state.json`.
2. Compare `latestEvent.id` with `lastProcessedEventId` in `season_0/runtime/narrator_state.json`.
3. Read the matching location section in `CLUES_AND_SCENES.md` and the immutable truth in `GROUND_TRUTH.md`.
4. Narrate only what is immediately perceptible. Do not award every location clue on arrival.
5. Play NPC dialogue responsively. NPCs know only their own listed truths.
6. Add evidence to narrator state only after a successful player action makes it discoverable.
7. Set `lastProcessedEventId` after handling the arrival, even if no clue was found.
8. Never alter the culprit, method, motive, or fixed timeline in response to player theories.

The narrator owns visible NPC presence through `peopleAtLocations` in `season_0/runtime/narrator_state.json`. Populate the current location after its arrival scene, and move or remove a person when the fixed schedule or story action changes their location. The browser does not infer presence from the public location roster. Use this player-safe shape:

```json
{
  "peopleAtLocations": {
    "location_id": [
      {
        "id": "stable_character_id",
        "name": "Public character name",
        "description": "Only immediately visible, non-spoiler information.",
        "image": "/assets/shared/characters/stable_character_id.png"
      }
    ]
  }
}
```

When `latestEvent.type` is `npc_interaction`:

1. Verify its `locationId`, `npcId`, and initiating `characterIds` against the current state.
2. Read that NPC's truths, lies, and limits before responding.
3. Resolve the NPC's web asset path under the repository's `web/` directory, render that local absolute image path in the Codex response, then speak and act as the NPC. The players speak for their investigators.
4. Do not assume the other investigator hears the exchange unless they are co-located.
5. Set `lastProcessedEventId` after opening the interaction. Further dialogue turns do not require another browser event unless the players end the encounter and start a new one.

For split parties, address each investigator's location separately and do not let either player automatically hear the other's private scene. The players may decide what their characters share.

When a physical item is discovered, add it to the narrator state's `items` array instead of duplicating it in `evidence`. Use only this public shape:

```json
{
  "id": "stable_item_id",
  "name": "Item name",
  "description": "What the investigators can currently observe.",
  "image": "/assets/season_1/items/stable_item_id.png",
  "foundAtLocationId": "location_id"
}
```

The browser derives its photographic evidence-board card from that record. Player theories and further interpretation belong on post-it notes.
