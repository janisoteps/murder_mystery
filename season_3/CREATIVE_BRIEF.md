# Season 3 — The Winter Garden

Player-safe production brief. No solution, private character roles, evidence placement, or revelation schedule belongs here.

## Selected direction

The user selected **The Winter Garden** on 11 September 2026. The spelling “Winder Garden” in the selection is understood as referring to the proposed Winter Garden setting.

A murder interrupts the reopening of a grand Alpine sanatorium as a thermal hotel in 1998. Snow, mountain daylight, steaming baths, a glass winter garden, service spaces, and the inhabited valley provide contrasting environments. The setting is fictional. The tone allows warmth, humor, hospitality, and ordinary work alongside unease.

## User requirements

- One player-controlled investigator.
- Only the starting location is accessible initially. Other map locations visibly begin locked and unlock through discoveries or NPC information.
- Picking up evidence opens a large image-and-description modal, followed by adding the object to inventory.
- Much larger, more intricate, artistic, interactive, and alive isometric environments; environment work receives most production effort.
- A detailed investigator with convincing anatomy, clothing, materials, and animation, first reviewed in a separate walkable playground.
- Adjustable zoom in every 3D location.
- Distinct NPC personalities and more sophisticated, natural dialogue processing.
- The user generates investigator, map, and NPC imagery from supplied spoiler-safe prompts; NPC prompts are supplied one at a time, with short video assets too.
- Build locations one at a time, starting with schematic floor plans and repeated user review.

## Production order

1. Choose setting — complete.
2. Develop private story, save separate criticism, then revise privately.
3. Agree investigator appearance through a detailed image prompt and the user's generated reference. Do not choose the final face or create the model before this review.
4. Build investigator playground and iterate under user review.
5. Prepare map art brief, receive map image, position discovery-controlled markers.
6. Prepare public NPC visual briefs one at a time and receive image/video assets.
7. Develop each location from floor plan through iterative environment review.

## Latest scope and checkpoint

The user requests a substantially expanded, sophisticated story with accomplices, misdirection, many clues, independent witnesses, and multiple neutral NPCs. The intended first-play duration is **about 20 hours**, replacing the provisional 30-hour suggestion. This is a design target, to be assessed through the user's eventual play; it is not a measured duration or a minimum enforced by the game.

Every location follows a mandatory approval sequence: clue-free schematic floor plan, user review, floor-plan revision, explicit final approval, clue-free walkable 3D scene, iterative scene testing, user-supplied textures, and final testing/fixes. Never begin a location's 3D implementation before the user explicitly approves its floor plan. NPCs in the environments use transparent portrait cutouts on thin camera-aware planes; their three-second videos play in the conversation interface.

The original short draft is retained as development history. Expand the private draft and its supporting narrative documents before the separate criticism stage. **Stop and report readiness before writing the critique.** The user explicitly requested this checkpoint; do not silently advance into criticism, revision after criticism, or investigator production.

Expansion status: complete as an expanded pre-critique draft. The private package now contains the main narrative, a cast bible, a discovery/proof matrix, and location/progression design. The main narrative is approximately 7,100 words; the current expanded package is approximately 20,800 words in total, excluding the superseded original. These sizes describe writing scope, not demonstrated gameplay quality or measured duration.

Current handoff: the private critique and final story revision are complete. The authoritative private package is `GROUND_TRUTH.md`, `CLUE_MATRIX.md`, `SCENES_AND_PACING.md`, `NPC_BIBLE.md`, `DIALOGUE_SYSTEM_SPEC.md`, and `REVIEW_CONTENT_PROTOCOL.md`. Files containing `_DRAFT` and `CRITIQUE` are development history only.

The single investigator is Mara Keller. The user approved the visual direction by generating `main_character/mara_keller_full_height_high_res_1.png`, then supplied the rigged model `main_character/mara_keller_3d_rigged_2.glb`. The spoiler-safe character playground loads that model and applies only its thigh, shin, foot, and toe rotation tracks; the exported torso, head, arm, and hand animation tracks are excluded. A simple working flashlight is positioned at her hand and remains independent of the skeleton. The user accepted this investigator pass as good enough and moved production to phase 11. The generated `map/map_v1.png` meets the map brief and is now used by the Season 3 map screen. Only the Winter Garden begins unlocked; the other eleven destinations conceal their names and reject travel until a future physical or spoken lead records the unlock. The user then moved production to phase 12. Spoiler-free assets for the full cast are now present under `npcs/`. The generated apprentice portrait depicts a woman, so Emily Novak is canonical throughout the story. Production has moved to phase 13. The clue-free Winter Garden floor plan review draft v4 is available at `/season_3_winter_garden_floor_plan.html`; it widens the north balcony and adds doors from the Delivery Vestibule to Wash and Tool Store. Its 3D scene remains blocked pending explicit user approval of the final plan.

Suggested refinement: complete one representative location to the agreed standard before expanding production. Use separate review saves and substitute evidence so user review does not expose the case.

## Boundaries

All files under `gm/` contain spoilers. Do not display, summarize, link directly to, open in an app panel, or quote those files to the player. Report stage completion only. No Season 3 story data is to be added to browser code or public assets during this writing stage.

The private story is fictional design, not a functioning game. The current app supports the Season 3 character workshop but does not yet implement the full season. Do not run builds, install anything, write or run tests, or launch the app. The user alone runs it.

The next player-facing deliverable after the private story stages is the investigator image description. Stop before map, NPC asset generation, or scene construction until the preceding review stage is complete.
