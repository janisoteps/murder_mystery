# Murder Mystery

This repository contains a dependency-free Season 0 technical rehearsal, Season 1 (*Blackwater Static*), and Season 2 (*The Ninth Bell*). Each season has isolated public, runtime, and game-master state.

## Run Season 2

Season 2 uses the OpenAI Responses API for browser-based NPC conversations. Create a root `.env` file from the safe example:

```sh
cp .env.example .env
```

Add your key to `.env`, then start the season:

```dotenv
OPENAI_API_KEY=your-key
```

```sh
npm run start:season2
```

Open `http://127.0.0.1:8000`. The root `.env` file is ignored by Git, and the key is never sent to the browser. Existing shell environment variables take precedence over `.env`; `MYSTERY_OPENAI_MODEL` can override the default `gpt-5.6-sol` model.

Season 2 adds an image-backed interactive island map, twenty persistent NPCs, free-form browser conversations, formal evidence presentation, Chrome speech synthesis controls, a server-private gated knowledge system, dialogue transcripts, and pending game-master events.

## Run Season 1

```sh
npm run start:season1
```

Then open `http://127.0.0.1:8000`. Season 1 includes ten significant locations, a detailed Hollowfield map, two new investigators, portrait-driven NPC conversations, exterior/interior location dossiers, SVG evidence items, and the shared evidence board.

To run the technical rehearsal instead:

```sh
npm run start:season0
```

## Run the rehearsal directly

No installation or build step is required. From the repository root, run either:

```sh
node server.mjs
```

or:

```sh
npm start
```

Then open `http://127.0.0.1:8000`.

To use another port:

```sh
MYSTERY_PORT=8080 node server.mjs
```

## Rehearsal flow

1. Drag either investigator token onto a destination, or select a destination and use its travel buttons.
2. Confirm travel. The server advances the case clock and writes the arrival to `season_0/runtime/player_state.json`.
3. Return to the Codex task and say, “We have arrived.” Codex reads the latest unprocessed arrival and runs the location scene.
4. When Codex updates `season_0/runtime/narrator_state.json`, the browser receives the change through Server-Sent Events and adds newly discovered evidence to the corkboard.
5. Drag evidence cards, add notes, and connect theories. Board changes are saved in the player state.

When the narrator marks an NPC as present, that person appears under **People here** in the location panel. Select the portrait to open the full character view. A **Talk as…** button appears for each investigator who is physically at that location. Starting a conversation writes a validated `npc_interaction` event; return to Codex and use the wording in the handoff panel to begin the scene.

Every Season 0 location has an exterior/interior slideshow. It opens automatically after confirmed travel and can also be reopened from the selected location panel. Evidence connections display their labels on the string, and notes are created or edited through the in-game post-it editor. Notes can also be deleted with confirmation; deleting one removes its connector strings. The corkboard uses a 1,600 × 5,000 pixel virtual canvas.

The “Reset rehearsal” control restores both runtime state files and clears the Season 0 event log after confirmation.

## State ownership

- `player_state.json` is owned by the browser/server. It contains positions, the case clock, notes, and corkboard layout.
- `narrator_state.json` is owned by Codex. It contains only information that has become public during play.
- `event_log.jsonl` is append-only during a rehearsal and records arrivals and NPC interaction requests.
- NPC visibility is narrator-owned in `peopleAtLocations`; interaction requests remain browser/server-owned events.
- `season_0/gm/` contains spoilers and is never served by the Node server.

Only files under `web/` are exposed as static assets. The Season 0 public definition is returned through a specific bootstrap endpoint; the GM directory cannot be reached through the browser.

Physical items use a deliberately small narrator-owned record: stable ID, name, description, image path, and discovery location ID. The evidence board turns each discovered item into a photographic card automatically. Any interpretation can be added manually with post-it notes.

## HTTP surface

- `GET /api/bootstrap` — public game definition plus both current state snapshots.
- `GET /api/state` — current player and narrator state.
- `GET /api/events` — Server-Sent Events stream.
- `POST /api/travel` — validated investigator arrival.
- `POST /api/interact` — validated request to speak to a co-located NPC.
- `POST /api/dialogue/session` — retrieve a co-located Season 2 conversation transcript.
- `POST /api/dialogue/turn` — generate and persist one gated Season 2 NPC reply.
- `POST /api/board` — validated corkboard snapshot.
- `POST /api/reset` — restore the rehearsal opening state.

The active data directory and landing page are selected with `MYSTERY_SEASON=season_0`, `season_1`, or `season_2`. The corresponding npm scripts set this automatically.
