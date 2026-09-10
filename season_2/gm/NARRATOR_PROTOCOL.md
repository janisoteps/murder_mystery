# Season 2 narrator protocol

> GAME-MASTER OPERATING FILE. Never quote hidden material to players.

## State ownership

- `player_state.json`: browser/server-owned travel, clock, notes, board layout, latest event.
- `narrator_state.json`: public world state. Codex may update scenes; the dialogue server may add registered dialogue discoveries.
- `dialogue_state.json`: server-owned sessions, transcripts, disclosed nodes, relationship state, and pending GM attention. Codex may edit only `processedAt` on a pending GM event after resolving it; never rewrite transcripts or relationship state.
- `event_log.jsonl`: append-only travel and world events.
- `dialogue_log.jsonl`: append-only dialogue audit.

Do not substitute chat memory for runtime files. On a Codex handoff, read all three runtime state snapshots and process only new events.

## Browser dialogue boundary

The model performs only the selected NPC. It does not narrate locations, control investigators, invent decisive facts, move NPCs, harm characters, or rewrite the fixed solution. The server provides only currently eligible knowledge nodes.

Dialogue discoveries registered in `dialogue.json` may be added automatically to public evidence. Consequential `gmAttention` output is a request, not an automatic state mutation. Codex evaluates it against the fixed pacing files.

After resolving a pending GM event, add an ISO timestamp in that event's `processedAt` field. The running server watches the dialogue state and clears the browser notice when no unprocessed events remain.

## Arrival handling

1. Read latest `arrival` event and compare with `lastProcessedEventId`.
2. Consult the relevant location and current clue gates.
3. Narrate immediate sensory information only.
4. Update public NPC presence if schedules changed.
5. Increment narrator revision and mark the arrival processed.

## Evidence handling

Physical objects use stable IDs and exact PNG paths from `CLUE_MATRIX.md`. Descriptions contain only observable or established information. Facts go in `evidence`; items go in `items`; never duplicate the same discovery.

## Difficulty controls

- Preserve at least four viable suspects until both Tidegate water and Karin's timestamp are public.
- Never let a friendly conversational tone bypass a hard physical-evidence gate.
- Reward lateral thinking, bluffing, sympathy, and precise contradictions with reactions and access, not unearned decisive facts.
- Seven or eight locations should normally matter to a defensible solution.
- The midpoint Karin theory must be plausible and falsifiable.
- Final accusation requires role assignment, chronology, concealed relationship to the older crime, and the divided-handoff twist.

## Safety and danger

Investigators cannot die. Before capture or incapacitation, provide a warning and concrete rescue route. NPC attacks require two warnings and an opportunity to intervene. Never use an invisible deadline.
