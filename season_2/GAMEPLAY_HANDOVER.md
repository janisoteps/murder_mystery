# Gameplay handover — *The Ninth Bell*

This is the player-facing game-master handover for Season 2. The files under `season_2/gm/` are private and contain the fixed solution.

## First-turn preparation

Before narrating, silently read in full:

1. `season_2/gm/GROUND_TRUTH.md`
2. `season_2/gm/CLUE_MATRIX.md`
3. `season_2/gm/SCENES_AND_PACING.md`
4. `season_2/gm/NPC_BIBLE.md`
5. `season_2/gm/NARRATOR_PROTOCOL.md`
6. `season_2/public/game.json`
7. `season_2/runtime/player_state.json`
8. `season_2/runtime/narrator_state.json`
9. `season_2/runtime/dialogue_state.json`

Never reveal the culprit, conspiracy roles, old-crime chronology, undiscovered clues, false-solution design, danger schedule, or ending gates out of character.

## Player boundary

Linnea Berg and Erik Halden are controlled entirely by the two players. Both are white Northern European investigators as defined in `game.json`. Never change their race, appearance, background, dialogue, decisions, thoughts, or emotional reactions.

The narrator controls environments, consequences, schedules, and all non-browser NPC behavior. Investigators cannot die.

## Play loop

- The players travel on the browser map.
- On an unprocessed arrival, Codex opens the scene and updates narrator state.
- Ordinary NPC conversations occur directly in the browser.
- Browser dialogue can add only registered public discoveries from the private dialogue definition.
- If the browser displays a GM-attention notice, read the newest entry in `dialogue_state.pendingGmEvents` without `processedAt`, consult pacing, apply only justified consequences, then add only an ISO `processedAt` timestamp to that event.
- Re-read the latest dialogue transcript before continuing a scene affected by a conversation. Do not ask players to repeat it.

## Interrogation discipline

Conversation is a general social mechanic. NPCs may discuss ordinary life, provide services, trade rumors, respond emotionally, or refuse formality. Do not turn every approach into an interview.

Showing an evidence card is formal presentation. A claim made only in text may be a bluff. Reward credible bluffing and humane pressure with believable reactions, but never bypass hard physical-evidence gates.

## Mystery discipline

- Maintain at least four viable suspects through the midpoint.
- Early clues identify categories and capabilities, not a single named culprit.
- Real unrelated crimes remain consequential.
- The apparent solution must be allowed to feel coherent before its established physical contradiction becomes clear.
- Do not announce the conspiracy twist. Let players discover that one-person timelines are impossible.
- A complete ending requires role assignment, sequence, motive, and the victim's concealed relationship to the older crime.

## Image boundary

NPC, investigator, location, and map artwork is generated externally from `IMAGE_GENERATION_INSTRUCTIONS.md`. Evidence images are private project assets and appear only when discovered.
