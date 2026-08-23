import http from "node:http";
import { promises as fs, watch as watchDirectory } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HOST = "127.0.0.1";
const PORT = Number.parseInt(process.env.MYSTERY_PORT ?? "8000", 10);
const ROOT = path.dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = path.join(ROOT, "web");
const SEASON_ID = process.env.MYSTERY_SEASON ?? "season_0";
const SUPPORTED_SEASONS = new Set(["season_0", "season_1"]);
if (!SUPPORTED_SEASONS.has(SEASON_ID)) {
  throw new Error(`Unsupported MYSTERY_SEASON: ${SEASON_ID}`);
}
const SEASON_ROOT = path.join(ROOT, SEASON_ID);
const DEFAULT_INDEX_PATH = SEASON_ID === "season_1" ? "/season_1.html" : "/index.html";
const PUBLIC_GAME_PATH = path.join(SEASON_ROOT, "public", "game.json");
const RUNTIME_ROOT = path.join(SEASON_ROOT, "runtime");
const INITIAL_PLAYER_STATE_PATH = path.join(SEASON_ROOT, "public", "initial_player_state.json");
const PLAYER_STATE_PATH = path.join(RUNTIME_ROOT, "player_state.json");
const NARRATOR_STATE_PATH = path.join(RUNTIME_ROOT, "narrator_state.json");
const INITIAL_NARRATOR_STATE_PATH = path.join(SEASON_ROOT, "public", "initial_narrator_state.json");
const EVENT_LOG_PATH = path.join(RUNTIME_ROOT, "event_log.jsonl");
const MAX_BODY_BYTES = 64 * 1024;

const MIME_TYPES = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".webp", "image/webp"]
]);

const sseClients = new Set();
let narratorBroadcastTimer = null;

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8"
  });
  response.end(JSON.stringify(payload));
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function writeJsonAtomic(filePath, value) {
  const temporaryPath = path.join(
    path.dirname(filePath),
    `.${path.basename(filePath)}.${process.pid}.${Date.now()}.tmp`
  );
  await fs.writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await fs.rename(temporaryPath, filePath);
}

async function ensureRuntime() {
  await fs.mkdir(RUNTIME_ROOT, { recursive: true });

  for (const [initialPath, runtimePath] of [
    [INITIAL_PLAYER_STATE_PATH, PLAYER_STATE_PATH],
    [INITIAL_NARRATOR_STATE_PATH, NARRATOR_STATE_PATH]
  ]) {
    try {
      await fs.access(runtimePath);
    } catch {
      await fs.copyFile(initialPath, runtimePath);
    }
  }

  try {
    await fs.writeFile(EVENT_LOG_PATH, "", { encoding: "utf8", flag: "wx" });
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
  }
}

async function readRequestJson(request) {
  const chunks = [];
  let totalBytes = 0;

  for await (const chunk of request) {
    totalBytes += chunk.length;
    if (totalBytes > MAX_BODY_BYTES) {
      const error = new Error("Request body is too large.");
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }

  if (chunks.length === 0) return {};

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    const error = new Error("Request body must be valid JSON.");
    error.statusCode = 400;
    throw error;
  }
}

function advanceClock(clock, minutesToAdd, dayLabels) {
  const minutesPerDay = 24 * 60;
  const currentDayIndex = Math.max(0, dayLabels.indexOf(clock.day));
  const total = currentDayIndex * minutesPerDay + clock.minutes + minutesToAdd;
  const nextDayIndex = Math.min(dayLabels.length - 1, Math.floor(total / minutesPerDay));

  return {
    day: dayLabels[nextDayIndex],
    minutes: total % minutesPerDay
  };
}

function cleanText(value, maximumLength) {
  return typeof value === "string" ? value.trim().slice(0, maximumLength) : "";
}

function sanitizeBoard(board) {
  const positions = {};
  const sourcePositions = board?.positions && typeof board.positions === "object"
    ? board.positions
    : {};

  for (const [cardId, position] of Object.entries(sourcePositions).slice(0, 100)) {
    if (!position || !Number.isFinite(position.x) || !Number.isFinite(position.y)) continue;
    positions[cleanText(cardId, 80)] = {
      x: Math.max(0, Math.min(1600, Math.round(position.x))),
      y: Math.max(0, Math.min(5000, Math.round(position.y)))
    };
  }

  const notes = Array.isArray(board?.notes)
    ? board.notes.slice(0, 40).map((note) => ({
        id: cleanText(note?.id, 80),
        title: cleanText(note?.title, 80) || "Investigator note",
        text: cleanText(note?.text, 800)
      })).filter((note) => note.id && note.text)
    : [];

  const validCardIds = new Set([
    ...Object.keys(positions),
    ...notes.map((note) => note.id)
  ]);

  const connections = Array.isArray(board?.connections)
    ? board.connections.slice(0, 100).map((connection) => ({
        id: cleanText(connection?.id, 80),
        from: cleanText(connection?.from, 80),
        to: cleanText(connection?.to, 80),
        label: cleanText(connection?.label, 100)
      })).filter((connection) => (
        connection.id
        && connection.from !== connection.to
        && validCardIds.has(connection.from)
        && validCardIds.has(connection.to)
      ))
    : [];

  return { positions, notes, connections };
}

function broadcast(eventName, payload) {
  const message = `event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of sseClients) client.write(message);
}

async function handleTravel(request, response) {
  const body = await readRequestJson(request);
  const game = await readJson(PUBLIC_GAME_PATH);
  const state = await readJson(PLAYER_STATE_PATH);
  const narratorState = await readJson(NARRATOR_STATE_PATH);
  const destination = game.locations.find((location) => location.id === body.destinationId);
  const requestedIds = Array.isArray(body.characterIds) ? [...new Set(body.characterIds)] : [];
  const knownCharacterIds = new Set(game.investigators.map((character) => character.id));

  if (!destination) {
    return sendJson(response, 400, { error: "Unknown destination." });
  }

  if (requestedIds.length === 0 || requestedIds.some((id) => !knownCharacterIds.has(id))) {
    return sendJson(response, 400, { error: "Choose one or more valid investigators." });
  }

  const blockedCharacterId = requestedIds.find((id) => {
    const condition = narratorState.characterConditions?.[id]?.status;
    return condition === "captured" || condition === "incapacitated";
  });
  if (blockedCharacterId) {
    const investigator = game.investigators.find((character) => character.id === blockedCharacterId);
    return sendJson(response, 409, {
      error: `${investigator?.name ?? "That investigator"} cannot travel until the other investigator completes the rescue.`
    });
  }

  const movingIds = requestedIds.filter(
    (id) => state.characters[id]?.locationId !== destination.id
  );

  if (movingIds.length === 0) {
    return sendJson(response, 200, { playerState: state, unchanged: true });
  }

  const fromLocations = {};
  for (const characterId of movingIds) {
    fromLocations[characterId] = state.characters[characterId].locationId;
    state.characters[characterId] = {
      ...state.characters[characterId],
      locationId: destination.id,
      status: "arrived"
    };
  }

  state.revision += 1;
  state.clock = advanceClock(state.clock, game.rules.travelMinutes, game.rules.dayLabels);
  const arrivalEvent = {
    id: `arrival-${String(state.revision).padStart(4, "0")}`,
    type: "arrival",
    characterIds: movingIds,
    fromLocations,
    destinationId: destination.id,
    clock: state.clock,
    recordedAt: new Date().toISOString()
  };
  state.latestEvent = arrivalEvent;

  await writeJsonAtomic(PLAYER_STATE_PATH, state);
  await fs.appendFile(EVENT_LOG_PATH, `${JSON.stringify(arrivalEvent)}\n`, "utf8");
  broadcast("player-state", state);
  return sendJson(response, 200, { playerState: state, event: arrivalEvent });
}

async function handleNpcInteraction(request, response) {
  const body = await readRequestJson(request);
  const [game, state, narratorState] = await Promise.all([
    readJson(PUBLIC_GAME_PATH),
    readJson(PLAYER_STATE_PATH),
    readJson(NARRATOR_STATE_PATH)
  ]);
  const investigator = game.investigators.find((character) => character.id === body.characterId);
  const characterState = state.characters[body.characterId];

  if (!investigator || !characterState) {
    return sendJson(response, 400, { error: "Choose a valid investigator." });
  }

  const peopleHere = narratorState.peopleAtLocations?.[characterState.locationId] ?? [];
  const npc = peopleHere.find((person) => person.id === body.npcId);
  if (!npc) {
    return sendJson(response, 409, {
      error: "That person is not currently at the investigator's location."
    });
  }

  state.revision += 1;
  const interactionEvent = {
    id: `interaction-${String(state.revision).padStart(4, "0")}`,
    type: "npc_interaction",
    characterIds: [investigator.id],
    npcId: npc.id,
    locationId: characterState.locationId,
    clock: state.clock,
    recordedAt: new Date().toISOString()
  };
  state.latestEvent = interactionEvent;

  await writeJsonAtomic(PLAYER_STATE_PATH, state);
  await fs.appendFile(EVENT_LOG_PATH, `${JSON.stringify(interactionEvent)}\n`, "utf8");
  broadcast("player-state", state);
  return sendJson(response, 200, { playerState: state, event: interactionEvent });
}

async function handleBoardUpdate(request, response) {
  const body = await readRequestJson(request);
  const state = await readJson(PLAYER_STATE_PATH);
  state.revision += 1;
  state.board = sanitizeBoard(body.board);
  await writeJsonAtomic(PLAYER_STATE_PATH, state);
  broadcast("player-state", state);
  return sendJson(response, 200, { playerState: state });
}

async function handleReset(response) {
  const initialPlayerState = await readJson(INITIAL_PLAYER_STATE_PATH);
  const initialNarratorState = await readJson(INITIAL_NARRATOR_STATE_PATH);
  await writeJsonAtomic(PLAYER_STATE_PATH, initialPlayerState);
  await writeJsonAtomic(NARRATOR_STATE_PATH, initialNarratorState);
  await fs.writeFile(EVENT_LOG_PATH, "", "utf8");
  broadcast("player-state", initialPlayerState);
  broadcast("narrator-state", initialNarratorState);
  return sendJson(response, 200, {
    playerState: initialPlayerState,
    narratorState: initialNarratorState
  });
}

async function serveStatic(url, response, headOnly = false) {
  const pathname = decodeURIComponent(url.pathname === "/" ? DEFAULT_INDEX_PATH : url.pathname);
  const targetPath = path.resolve(WEB_ROOT, `.${pathname}`);

  if (targetPath !== WEB_ROOT && !targetPath.startsWith(`${WEB_ROOT}${path.sep}`)) {
    return sendJson(response, 403, { error: "Forbidden." });
  }

  try {
    const stats = await fs.stat(targetPath);
    if (!stats.isFile()) return sendJson(response, 404, { error: "Not found." });
    response.writeHead(200, {
      "Cache-Control": "no-store",
      "Content-Security-Policy": "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
      "Content-Type": MIME_TYPES.get(path.extname(targetPath).toLowerCase()) ?? "application/octet-stream",
      "X-Content-Type-Options": "nosniff"
    });
    response.end(headOnly ? undefined : await fs.readFile(targetPath));
  } catch (error) {
    if (error.code === "ENOENT") return sendJson(response, 404, { error: "Not found." });
    throw error;
  }
}

async function handleRequest(request, response) {
  const url = new URL(request.url ?? "/", `http://${HOST}:${PORT}`);

  if (request.method === "GET" && url.pathname === "/api/bootstrap") {
    const [game, playerState, narratorState] = await Promise.all([
      readJson(PUBLIC_GAME_PATH),
      readJson(PLAYER_STATE_PATH),
      readJson(NARRATOR_STATE_PATH)
    ]);
    return sendJson(response, 200, { game, playerState, narratorState });
  }

  if (request.method === "GET" && url.pathname === "/api/state") {
    const [playerState, narratorState] = await Promise.all([
      readJson(PLAYER_STATE_PATH),
      readJson(NARRATOR_STATE_PATH)
    ]);
    return sendJson(response, 200, { playerState, narratorState });
  }

  if (request.method === "GET" && url.pathname === "/api/events") {
    response.writeHead(200, {
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "Content-Type": "text/event-stream; charset=utf-8"
    });
    response.write("retry: 2000\n\n");
    sseClients.add(response);
    request.on("close", () => sseClients.delete(response));
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/travel") {
    return handleTravel(request, response);
  }

  if (request.method === "POST" && url.pathname === "/api/interact") {
    return handleNpcInteraction(request, response);
  }

  if (request.method === "POST" && url.pathname === "/api/board") {
    return handleBoardUpdate(request, response);
  }

  if (request.method === "POST" && url.pathname === "/api/reset") {
    await readRequestJson(request);
    return handleReset(response);
  }

  if (request.method === "GET" || request.method === "HEAD") {
    return serveStatic(url, response, request.method === "HEAD");
  }

  return sendJson(response, 405, { error: "Method not allowed." });
}

await ensureRuntime();

const server = http.createServer((request, response) => {
  handleRequest(request, response).catch((error) => {
    console.error(error);
    if (!response.headersSent) {
      sendJson(response, error.statusCode ?? 500, {
        error: error.statusCode ? error.message : "Internal server error."
      });
    } else {
      response.end();
    }
  });
});

const runtimeWatcher = watchDirectory(RUNTIME_ROOT, (_eventType, filename) => {
  if (filename !== path.basename(NARRATOR_STATE_PATH)) return;
  clearTimeout(narratorBroadcastTimer);
  narratorBroadcastTimer = setTimeout(async () => {
    try {
      broadcast("narrator-state", await readJson(NARRATOR_STATE_PATH));
    } catch (error) {
      console.error("Could not broadcast narrator state:", error.message);
    }
  }, 80);
});

const keepAlive = setInterval(() => {
  for (const client of sseClients) client.write(": keep-alive\n\n");
}, 20_000);

server.listen(PORT, HOST, () => {
  console.log(`${SEASON_ID} available at http://${HOST}:${PORT}`);
});

function shutdown() {
  clearInterval(keepAlive);
  clearTimeout(narratorBroadcastTimer);
  runtimeWatcher.close();
  for (const client of sseClients) client.end();
  server.close();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
