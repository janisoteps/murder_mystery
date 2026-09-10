import http from "node:http";
import { promises as fs, watch as watchDirectory } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));

function parseEnvValue(rawValue) {
  const value = rawValue.trim();
  if (value.length < 2) return value;

  const quote = value[0];
  if ((quote === "\"" || quote === "'") && value.at(-1) === quote) {
    const unquoted = value.slice(1, -1);
    if (quote === "'") return unquoted;

    return unquoted.replace(/\\(n|r|t|\\|\")/g, (_, escaped) => ({
      n: "\n",
      r: "\r",
      t: "\t",
      "\\": "\\",
      "\"": "\""
    })[escaped]);
  }

  return value.replace(/\s+#.*$/, "").trimEnd();
}

async function loadRootEnv() {
  let contents;
  try {
    contents = await fs.readFile(path.join(ROOT, ".env"), "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return;
    throw error;
  }

  const lines = contents.replace(/^\uFEFF/, "").split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line || line.startsWith("#")) continue;

    const assignment = line.startsWith("export ") ? line.slice(7).trimStart() : line;
    const separatorIndex = assignment.indexOf("=");
    if (separatorIndex < 1) {
      throw new Error(`Invalid .env entry on line ${index + 1}`);
    }

    const key = assignment.slice(0, separatorIndex).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      throw new Error(`Invalid .env variable name on line ${index + 1}`);
    }

    if (process.env[key] === undefined) {
      process.env[key] = parseEnvValue(assignment.slice(separatorIndex + 1));
    }
  }
}

await loadRootEnv();

const HOST = "127.0.0.1";
const PORT = Number.parseInt(process.env.MYSTERY_PORT ?? "8000", 10);
const WEB_ROOT = path.join(ROOT, "web");
const SEASON_ID = process.env.MYSTERY_SEASON ?? "season_0";
const SUPPORTED_SEASONS = new Set(["season_0", "season_1", "season_2"]);
if (!SUPPORTED_SEASONS.has(SEASON_ID)) {
  throw new Error(`Unsupported MYSTERY_SEASON: ${SEASON_ID}`);
}
const SEASON_ROOT = path.join(ROOT, SEASON_ID);
const DEFAULT_INDEX_PATH = SEASON_ID === "season_2"
  ? "/season_2.html"
  : SEASON_ID === "season_1"
    ? "/season_1.html"
    : "/index.html";
const PUBLIC_GAME_PATH = path.join(SEASON_ROOT, "public", "game.json");
const RUNTIME_ROOT = path.join(SEASON_ROOT, "runtime");
const INITIAL_PLAYER_STATE_PATH = path.join(SEASON_ROOT, "public", "initial_player_state.json");
const PLAYER_STATE_PATH = path.join(RUNTIME_ROOT, "player_state.json");
const NARRATOR_STATE_PATH = path.join(RUNTIME_ROOT, "narrator_state.json");
const INITIAL_NARRATOR_STATE_PATH = path.join(SEASON_ROOT, "public", "initial_narrator_state.json");
const EVENT_LOG_PATH = path.join(RUNTIME_ROOT, "event_log.jsonl");
const DIALOGUE_DEFINITION_PATH = path.join(SEASON_ROOT, "gm", "dialogue.json");
const INITIAL_DIALOGUE_STATE_PATH = path.join(SEASON_ROOT, "public", "initial_dialogue_state.json");
const DIALOGUE_STATE_PATH = path.join(RUNTIME_ROOT, "dialogue_state.json");
const DIALOGUE_LOG_PATH = path.join(RUNTIME_ROOT, "dialogue_log.jsonl");
const DIALOGUE_MODEL = process.env.MYSTERY_OPENAI_MODEL ?? "gpt-5.6-sol";
const MAX_BODY_BYTES = 64 * 1024;
const DIALOGUE_ENABLED = SEASON_ID === "season_2";

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
let dialogueTurnQueue = Promise.resolve();

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

  if (DIALOGUE_ENABLED) {
    try {
      await fs.access(DIALOGUE_STATE_PATH);
    } catch {
      await fs.copyFile(INITIAL_DIALOGUE_STATE_PATH, DIALOGUE_STATE_PATH);
    }

    try {
      await fs.writeFile(DIALOGUE_LOG_PATH, "", { encoding: "utf8", flag: "wx" });
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
    }
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

function publicEvidenceIds(narratorState) {
  return new Set([
    ...(narratorState.evidence ?? []).map((item) => item.id),
    ...(narratorState.items ?? []).map((item) => item.id),
    ...Object.entries(narratorState.sceneFlags ?? {})
      .filter(([, value]) => Boolean(value))
      .map(([key]) => key)
  ]);
}

function pendingGmEventCount(dialogueState) {
  return (dialogueState.pendingGmEvents ?? []).filter((event) => !event.processedAt).length;
}

function eligibleDialogueNodes(profile, evidenceIds, shownEvidenceId) {
  return (profile.nodes ?? []).filter((node) => {
    const requiresAll = node.requiresAllEvidence ?? [];
    const requiresAny = node.requiresAnyEvidence ?? [];
    const requiresShown = node.requiresShownEvidence ?? [];
    return requiresAll.every((id) => evidenceIds.has(id))
      && (requiresAny.length === 0 || requiresAny.some((id) => evidenceIds.has(id)))
      && (requiresShown.length === 0 || requiresShown.includes(shownEvidenceId));
  });
}

function dialogueResponseText(apiPayload) {
  for (const outputItem of apiPayload.output ?? []) {
    if (outputItem.type !== "message") continue;
    for (const content of outputItem.content ?? []) {
      if (content.type === "output_text" && typeof content.text === "string") return content.text;
    }
  }
  return "";
}

async function requestNpcResponse({ dialogueDefinition, profile, npc, investigator, recentTurns, eligibleNodes, message, shownEvidence }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const error = new Error("Browser dialogue is not configured. Set OPENAI_API_KEY before starting Season 2.");
    error.statusCode = 503;
    throw error;
  }

  const nodeBriefs = eligibleNodes.map((node) => ({
    id: node.id,
    availableKnowledge: node.fact,
    revealWhen: node.revealWhen
  }));
  const transcript = recentTurns.map((turn) => ({
    speaker: turn.role === "npc" ? npc.name : turn.speakerName,
    text: turn.text
  }));
  const instructions = [
    "You perform exactly one NPC in a grounded prestige murder mystery.",
    "Write only the NPC's side of a natural conversation. Never write investigator dialogue, actions, thoughts, choices, scene narration, or game-master commentary.",
    "The conversation may be social, practical, emotional, or investigative. Do not force every reply toward the murder.",
    "You may use only the public setting and currently available knowledge nodes supplied below. Do not infer hidden causes, culprits, relationships, routes, evidence, or chronology.",
    "A player's unsupported claim may be a bluff. Formally shown evidence is identified separately. React according to the NPC, but never treat an unsupported claim as newly true.",
    "If a knowledge node's reveal condition is not met by the actual exchange, do not reveal it even though it is available.",
    "Keep spokenText under 1,400 characters and suitable for browser text-to-speech. Put delivery cues only in delivery, never in brackets inside spokenText.",
    `Setting: ${dialogueDefinition.setting}`,
    `NPC: ${npc.name}. Persona: ${profile.persona}`,
    `Current surface goal: ${profile.surfaceGoal}`,
    `Current relationship score: ${profile.relationshipScore ?? 0} on a -3 to +3 scale.`,
    `Formally shown evidence: ${shownEvidence ? `${shownEvidence.title}: ${shownEvidence.summary}` : "none"}.`,
    `Available knowledge nodes: ${JSON.stringify(nodeBriefs)}`,
    `Recent local transcript: ${JSON.stringify(transcript)}`
  ].join("\n");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);
  let apiResponse;
  try {
    apiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: DIALOGUE_MODEL,
        store: false,
        instructions,
        input: [{
          role: "user",
          content: [{ type: "input_text", text: `${investigator.name} says: ${message}` }]
        }],
        reasoning: { effort: "low" },
        max_output_tokens: 700,
        text: {
          format: {
            type: "json_schema",
            name: "npc_dialogue_turn",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                spokenText: { type: "string", minLength: 1, maxLength: 1400 },
                delivery: { type: "string", maxLength: 160 },
                usedKnowledgeNodeIds: { type: "array", items: { type: "string" }, maxItems: 6 },
                relationshipChange: { type: "string", enum: ["improved", "unchanged", "worsened"] },
                endConversation: { type: "boolean" }
              },
              required: ["spokenText", "delivery", "usedKnowledgeNodeIds", "relationshipChange", "endConversation"]
            }
          }
        }
      }),
      signal: controller.signal
    });
  } catch (error) {
    const wrapped = new Error(error.name === "AbortError"
      ? "The NPC response timed out. Please try that line again."
      : "The NPC dialogue service could not be reached.");
    wrapped.statusCode = 502;
    throw wrapped;
  } finally {
    clearTimeout(timeout);
  }

  const apiPayload = await apiResponse.json().catch(() => ({}));
  if (!apiResponse.ok) {
    const error = new Error(apiPayload.error?.message ?? "OpenAI rejected the NPC dialogue request.");
    error.statusCode = 502;
    throw error;
  }

  let result;
  try {
    result = JSON.parse(dialogueResponseText(apiPayload));
  } catch {
    const error = new Error("The NPC returned an unreadable response. Please try again.");
    error.statusCode = 502;
    throw error;
  }

  const eligibleIds = new Set(eligibleNodes.map((node) => node.id));
  if (!result.spokenText || result.usedKnowledgeNodeIds.some((id) => !eligibleIds.has(id))) {
    const error = new Error("The NPC response failed its spoiler-safety check. Please try again.");
    error.statusCode = 502;
    throw error;
  }
  return { ...result, responseId: apiPayload.id ?? null };
}

async function processDialogueTurn(body) {
  if (!DIALOGUE_ENABLED) {
    const error = new Error("Browser dialogue is available only in Season 2.");
    error.statusCode = 404;
    throw error;
  }

  const message = cleanText(body.message, 1200);
  if (!message) {
    const error = new Error("Say something before sending the turn.");
    error.statusCode = 400;
    throw error;
  }

  const [game, playerState, narratorState, dialogueState, dialogueDefinition] = await Promise.all([
    readJson(PUBLIC_GAME_PATH),
    readJson(PLAYER_STATE_PATH),
    readJson(NARRATOR_STATE_PATH),
    readJson(DIALOGUE_STATE_PATH),
    readJson(DIALOGUE_DEFINITION_PATH)
  ]);
  const investigator = game.investigators.find((person) => person.id === body.investigatorId);
  const characterState = playerState.characters?.[body.investigatorId];
  if (!investigator || !characterState) {
    const error = new Error("Choose a valid investigator.");
    error.statusCode = 400;
    throw error;
  }

  const npc = (narratorState.peopleAtLocations?.[characterState.locationId] ?? [])
    .find((person) => person.id === body.npcId);
  const profile = dialogueDefinition.npcs?.[body.npcId];
  if (!npc || !profile) {
    const error = new Error("That person is not available for conversation here.");
    error.statusCode = 409;
    throw error;
  }

  const evidenceIds = publicEvidenceIds(narratorState);
  const shownEvidenceId = cleanText(body.shownEvidenceId, 80) || null;
  const shownEvidence = shownEvidenceId
    ? [...(narratorState.evidence ?? []), ...(narratorState.items ?? []).map((item) => ({
        ...item,
        title: item.name,
        summary: item.description
      }))].find((item) => item.id === shownEvidenceId)
    : null;
  if (shownEvidenceId && !shownEvidence) {
    const error = new Error("That evidence is not currently available to show.");
    error.statusCode = 400;
    throw error;
  }

  const eligibleNodes = eligibleDialogueNodes(profile, evidenceIds, shownEvidenceId);
  const sessionId = `${investigator.id}:${npc.id}`;
  const session = dialogueState.sessions[sessionId] ?? {
    id: sessionId,
    investigatorId: investigator.id,
    npcId: npc.id,
    turns: []
  };
  const maximumRecentTurns = dialogueDefinition.rules?.maximumRecentTurns ?? 18;
  const recentTurns = session.turns.slice(-maximumRecentTurns);
  const relationshipKey = `${investigator.id}:${npc.id}`;
  profile.relationshipScore = dialogueState.relationships[relationshipKey] ?? 0;

  const npcResult = await requestNpcResponse({
    dialogueDefinition,
    profile,
    npc,
    investigator,
    recentTurns,
    eligibleNodes,
    message,
    shownEvidence
  });

  const recordedAt = new Date().toISOString();
  session.turns.push(
    { role: "investigator", speakerName: investigator.name, text: message, shownEvidenceId, recordedAt },
    { role: "npc", speakerName: npc.name, text: cleanText(npcResult.spokenText, 1400), delivery: cleanText(npcResult.delivery, 160), responseId: npcResult.responseId, recordedAt }
  );
  session.turns = session.turns.slice(-80);
  session.updatedAt = recordedAt;
  session.ended = Boolean(npcResult.endConversation);
  dialogueState.sessions[sessionId] = session;

  const relationshipDelta = npcResult.relationshipChange === "improved"
    ? 1
    : npcResult.relationshipChange === "worsened"
      ? -1
      : 0;
  dialogueState.relationships[relationshipKey] = Math.max(-3, Math.min(3,
    (dialogueState.relationships[relationshipKey] ?? 0) + relationshipDelta
  ));

  const usedNodes = eligibleNodes.filter((node) => npcResult.usedKnowledgeNodeIds.includes(node.id));
  const disclosedSet = new Set(dialogueState.disclosedNodes ?? []);
  for (const node of usedNodes) disclosedSet.add(node.id);
  dialogueState.disclosedNodes = [...disclosedSet];

  const newEvidence = [];
  const currentPublicIds = publicEvidenceIds(narratorState);
  for (const node of usedNodes) {
    if (node.publicEvidence && !currentPublicIds.has(node.publicEvidence.id)) {
      narratorState.evidence.push(node.publicEvidence);
      currentPublicIds.add(node.publicEvidence.id);
      newEvidence.push(node.publicEvidence);
    }
    if (node.gmAttention) {
      dialogueState.pendingGmEvents.push({
        id: `gm-dialogue-${Date.now()}-${node.id}`,
        type: "dialogue_attention",
        npcId: npc.id,
        investigatorId: investigator.id,
        nodeId: node.id,
        reason: node.gmAttention,
        recordedAt
      });
    }
  }

  dialogueState.pendingGmEvents = dialogueState.pendingGmEvents.slice(-40);
  dialogueState.revision += 1;
  if (newEvidence.length > 0) {
    narratorState.revision += 1;
    narratorState.statusMessage = newEvidence.at(-1).summary;
    await writeJsonAtomic(NARRATOR_STATE_PATH, narratorState);
    broadcast("narrator-state", narratorState);
  }
  await writeJsonAtomic(DIALOGUE_STATE_PATH, dialogueState);

  const dialogueEvent = {
    id: `dialogue-${String(dialogueState.revision).padStart(5, "0")}`,
    type: "dialogue_turn",
    investigatorId: investigator.id,
    npcId: npc.id,
    playerText: message,
    shownEvidenceId,
    npcText: npcResult.spokenText,
    usedKnowledgeNodeIds: usedNodes.map((node) => node.id),
    newEvidenceIds: newEvidence.map((item) => item.id),
    responseId: npcResult.responseId,
    recordedAt
  };
  await fs.appendFile(DIALOGUE_LOG_PATH, `${JSON.stringify(dialogueEvent)}\n`, "utf8");
  broadcast("dialogue-state", {
    revision: dialogueState.revision,
    pendingGmEventCount: pendingGmEventCount(dialogueState)
  });

  return {
    reply: {
      text: npcResult.spokenText,
      delivery: npcResult.delivery,
      endConversation: npcResult.endConversation
    },
    transcript: session.turns,
    newEvidence,
    pendingGmEventCount: pendingGmEventCount(dialogueState)
  };
}

async function handleDialogueTurn(request, response) {
  const body = await readRequestJson(request);
  const task = dialogueTurnQueue.then(() => processDialogueTurn(body));
  dialogueTurnQueue = task.catch(() => undefined);
  return sendJson(response, 200, await task);
}

async function handleDialogueSession(request, response) {
  if (!DIALOGUE_ENABLED) return sendJson(response, 404, { error: "Browser dialogue is unavailable." });
  const body = await readRequestJson(request);
  const [state, narratorState, playerState, game] = await Promise.all([
    readJson(DIALOGUE_STATE_PATH),
    readJson(NARRATOR_STATE_PATH),
    readJson(PLAYER_STATE_PATH),
    readJson(PUBLIC_GAME_PATH)
  ]);
  const investigator = game.investigators.find((person) => person.id === body.investigatorId);
  const locationId = playerState.characters?.[body.investigatorId]?.locationId;
  const npcIsColocated = (narratorState.peopleAtLocations?.[locationId] ?? [])
    .some((person) => person.id === body.npcId);
  if (!investigator || !npcIsColocated) return sendJson(response, 400, { error: "Unknown conversation." });
  const session = state.sessions[`${investigator.id}:${body.npcId}`];
  return sendJson(response, 200, {
    transcript: session?.turns ?? [],
    pendingGmEventCount: pendingGmEventCount(state)
  });
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
  if (DIALOGUE_ENABLED) {
    await writeJsonAtomic(DIALOGUE_STATE_PATH, await readJson(INITIAL_DIALOGUE_STATE_PATH));
    await fs.writeFile(DIALOGUE_LOG_PATH, "", "utf8");
  }
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
    return sendJson(response, 200, {
      game,
      playerState,
      narratorState,
      dialogue: {
        enabled: DIALOGUE_ENABLED,
        configured: DIALOGUE_ENABLED && Boolean(process.env.OPENAI_API_KEY),
        model: DIALOGUE_ENABLED ? DIALOGUE_MODEL : null
      }
    });
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

  if (request.method === "POST" && url.pathname === "/api/dialogue/turn") {
    return handleDialogueTurn(request, response);
  }

  if (request.method === "POST" && url.pathname === "/api/dialogue/session") {
    return handleDialogueSession(request, response);
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
  if (filename === path.basename(NARRATOR_STATE_PATH)) {
    clearTimeout(narratorBroadcastTimer);
    narratorBroadcastTimer = setTimeout(async () => {
      try {
        broadcast("narrator-state", await readJson(NARRATOR_STATE_PATH));
      } catch (error) {
        console.error("Could not broadcast narrator state:", error.message);
      }
    }, 80);
    return;
  }

  if (DIALOGUE_ENABLED && filename === path.basename(DIALOGUE_STATE_PATH)) {
    setTimeout(async () => {
      try {
        const dialogueState = await readJson(DIALOGUE_STATE_PATH);
        broadcast("dialogue-state", {
          revision: dialogueState.revision,
          pendingGmEventCount: pendingGmEventCount(dialogueState)
        });
      } catch (error) {
        console.error("Could not broadcast dialogue state:", error.message);
      }
    }, 80);
  }
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
