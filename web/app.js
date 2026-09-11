const SVG_NS = "http://www.w3.org/2000/svg";

const elements = {
  arrivalHandoff: document.querySelector("#arrival-handoff"),
  boardEmpty: document.querySelector("#board-empty"),
  boardStage: document.querySelector("#board-stage"),
  bridgeStatus: document.querySelector("#bridge-status"),
  cardLayer: document.querySelector("#card-layer"),
  caseClock: document.querySelector("#case-clock"),
  closeLocationDialog: document.querySelector("#close-location-dialog"),
  closeNpcDialog: document.querySelector("#close-npc-dialog"),
  closeNoteDialog: document.querySelector("#close-note-dialog"),
  connectButton: document.querySelector("#connect-button"),
  connectionLayer: document.querySelector("#connection-layer"),
  conversationAutoSpeak: document.querySelector("#conversation-auto-speak"),
  conversationClose: document.querySelector("#close-conversation-dialog"),
  conversationDelivery: document.querySelector("#conversation-delivery"),
  conversationDialog: document.querySelector("#conversation-dialog"),
  conversationEvidence: document.querySelector("#conversation-evidence"),
  conversationForm: document.querySelector("#conversation-form"),
  conversationGmNotice: document.querySelector("#conversation-gm-notice"),
  conversationInput: document.querySelector("#conversation-input"),
  conversationNpcImage: document.querySelector("#conversation-npc-image"),
  conversationNpcName: document.querySelector("#conversation-npc-name"),
  conversationReplay: document.querySelector("#conversation-replay"),
  conversationSend: document.querySelector("#conversation-send"),
  conversationSpeaker: document.querySelector("#conversation-speaker"),
  conversationStatus: document.querySelector("#conversation-status"),
  conversationStop: document.querySelector("#conversation-stop"),
  conversationTranscript: document.querySelector("#conversation-transcript"),
  conversationVoice: document.querySelector("#conversation-voice"),
  conversationRate: document.querySelector("#conversation-rate"),
  evidenceCount: document.querySelector("#evidence-count"),
  exploreLocationButton: document.querySelector("#explore-location-button"),
  handoffCopy: document.querySelector("#handoff-copy"),
  handoffTitle: document.querySelector("#handoff-title"),
  investigatorList: document.querySelector("#investigator-list"),
  inventoryCount: document.querySelector("#inventory-count"),
  inventoryEmpty: document.querySelector("#inventory-empty"),
  inventoryGrid: document.querySelector("#inventory-grid"),
  inventoryItemClose: document.querySelector("#close-inventory-item-dialog"),
  inventoryItemDescription: document.querySelector("#inventory-item-description"),
  inventoryItemDialog: document.querySelector("#inventory-item-dialog"),
  inventoryItemImage: document.querySelector("#inventory-item-image"),
  inventoryItemKind: document.querySelector("#inventory-item-kind"),
  inventoryItemLocation: document.querySelector("#inventory-item-location"),
  inventoryItemName: document.querySelector("#inventory-item-name"),
  knownPeople: document.querySelector("#known-people"),
  locationDescription: document.querySelector("#location-description"),
  locationDialog: document.querySelector("#location-dialog"),
  locationDialogTitle: document.querySelector("#location-dialog-title"),
  locationKind: document.querySelector("#location-kind"),
  locationName: document.querySelector("#location-name"),
  locationSlideCaption: document.querySelector("#location-slide-caption"),
  locationSlideDots: document.querySelector("#location-slide-dots"),
  locationSlideImage: document.querySelector("#location-slide-image"),
  locationSlideLabel: document.querySelector("#location-slide-label"),
  map: document.querySelector("#town-map"),
  narratorMessage: document.querySelector("#narrator-message"),
  npcDialog: document.querySelector("#npc-dialog"),
  npcDialogActions: document.querySelector("#npc-dialog-actions"),
  npcDialogDescription: document.querySelector("#npc-dialog-description"),
  npcDialogGuidance: document.querySelector("#npc-dialog-guidance"),
  npcDialogImage: document.querySelector("#npc-dialog-image"),
  npcDialogName: document.querySelector("#npc-dialog-name"),
  nextLocationSlide: document.querySelector("#next-location-slide"),
  noteDialog: document.querySelector("#note-dialog"),
  noteDialogTitle: document.querySelector("#note-dialog-title"),
  noteForm: document.querySelector("#note-form"),
  noteText: document.querySelector("#note-text"),
  noteTitle: document.querySelector("#note-title"),
  previousLocationSlide: document.querySelector("#previous-location-slide"),
  resetButton: document.querySelector("#reset-button"),
  saveNoteButton: document.querySelector("#save-note-button"),
  saveStatus: document.querySelector("#save-status"),
  sceneAction: document.querySelector("#scene-action"),
  sceneActionKind: document.querySelector("#scene-action-kind"),
  sceneActionLabel: document.querySelector("#scene-action-label"),
  sceneAreaLabel: document.querySelector("#scene-area-label"),
  sceneCanvas: document.querySelector("#scene-canvas"),
  sceneClose: document.querySelector("#close-scene-dialog"),
  sceneDialog: document.querySelector("#scene-dialog"),
  sceneInvestigatorButtons: document.querySelector("#scene-investigator-buttons"),
  sceneLocationName: document.querySelector("#scene-location-name"),
  sceneMessage: document.querySelector("#scene-message"),
  sceneDiscoveries: document.querySelector("#scene-discoveries"),
  sceneDiscoveryItems: document.querySelector("#scene-discovery-items"),
  sceneTransition: document.querySelector("#scene-transition"),
  toast: document.querySelector("#toast"),
  tokenLayer: document.querySelector("#token-layer"),
  viewLocationButton: document.querySelector("#view-location-button")
};

const app = {
  game: null,
  dialogueConfig: null,
  playerState: null,
  narratorState: null,
  selectedLocationId: null,
  travelPending: false,
  linkMode: false,
  linkSourceId: null,
  tokenDrag: null,
  cardDrag: null,
  toastTimer: null,
  activeLocationId: null,
  activeLocationSlideIndex: 0,
  activeNpcId: null,
  activeDialogueInvestigatorId: null,
  activeDialogueNpcId: null,
  dialoguePending: false,
  dialogueTranscript: [],
  lastSpokenText: "",
  interactionPending: false,
  editingNoteId: null,
  sceneController: null,
  sceneInvestigators: [],
  sceneLoading: false,
  sceneFindings: [],
  currentSceneLocationId: null
};

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: options.body ? { "Content-Type": "application/json" } : undefined
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error ?? "The state bridge rejected the request.");
  return payload;
}

function locationById(locationId) {
  return app.game.locations.find((location) => location.id === locationId);
}

function investigatorById(characterId) {
  return app.game.investigators.find((character) => character.id === characterId);
}

function locationImages(location) {
  if (Array.isArray(location?.images)) return location.images;
  if (location?.image) {
    return [{
      src: location.image,
      label: "Location view",
      alt: location.imageAlt ?? location.name
    }];
  }
  return [];
}

function peopleAtLocation(locationId) {
  return app.narratorState.peopleAtLocations?.[locationId] ?? [];
}

function npcById(npcId) {
  for (const [locationId, people] of Object.entries(app.narratorState.peopleAtLocations ?? {})) {
    const npc = people.find((person) => person.id === npcId);
    if (npc) return { ...npc, locationId };
  }
  return null;
}

function investigatorCondition(characterId) {
  return app.narratorState.characterConditions?.[characterId]?.status
    ?? app.playerState.characters[characterId]?.condition
    ?? "unharmed";
}

function isTravelBlocked(characterId) {
  const condition = investigatorCondition(characterId);
  return condition === "captured" || condition === "incapacitated";
}

function formatClock(clock) {
  const hours = Math.floor(clock.minutes / 60) % 24;
  const minutes = clock.minutes % 60;
  return `${clock.day} · ${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function setBridgeStatus(label, state = "") {
  elements.bridgeStatus.textContent = label;
  elements.bridgeStatus.className = `bridge-status${state ? ` ${state}` : ""}`;
}

function showToast(message) {
  clearTimeout(app.toastTimer);
  elements.toast.textContent = message;
  elements.toast.hidden = false;
  app.toastTimer = setTimeout(() => {
    elements.toast.hidden = true;
  }, 4200);
}

function createSvgElement(name, attributes = {}) {
  const element = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, String(value));
  }
  return element;
}

function tokenPosition(characterId) {
  const characterState = app.playerState.characters[characterId];
  const location = locationById(characterState.locationId);
  const colocatedIds = app.game.investigators
    .map((character) => character.id)
    .filter((id) => app.playerState.characters[id].locationId === characterState.locationId);
  const index = colocatedIds.indexOf(characterId);
  const horizontalOffset = colocatedIds.length > 1 ? (index === 0 ? -20 : 20) : 0;
  return { x: location.x + horizontalOffset, y: location.y - 58 };
}

function renderTokens() {
  elements.tokenLayer.replaceChildren();

  for (const investigator of app.game.investigators) {
    const position = tokenPosition(investigator.id);
    const token = createSvgElement("g", {
      class: "investigator-token",
      "data-character-id": investigator.id,
      role: "img",
      transform: `translate(${position.x} ${position.y})`
    });
    const title = createSvgElement("title");
    title.textContent = `${investigator.name}, ${investigator.role}`;
    const ring = createSvgElement("circle", { class: "token-ring", cx: 0, cy: 0, r: 22 });
    const core = createSvgElement("circle", {
      class: "token-core",
      cx: 0,
      cy: 0,
      fill: investigator.color,
      r: 17
    });
    const initials = createSvgElement("text", {
      class: "token-initials",
      x: 0,
      y: 4
    });
    initials.textContent = investigator.initials;
    token.append(title, ring, core, initials);
    elements.tokenLayer.append(token);
  }
}

function renderSelectedLocation() {
  const location = locationById(app.selectedLocationId);
  elements.locationKind.textContent = location.kind;
  elements.locationName.textContent = location.name;
  elements.locationDescription.textContent = location.description;
  elements.viewLocationButton.disabled = locationImages(location).length === 0;
  elements.knownPeople.replaceChildren();

  const people = peopleAtLocation(location.id);
  if (people.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-presence";
    empty.textContent = "No one is currently visible.";
    elements.knownPeople.append(empty);
  }

  for (const person of people) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "npc-presence-card";
    const portrait = document.createElement("img");
    portrait.src = person.image;
    portrait.alt = "";
    const details = document.createElement("span");
    const name = document.createElement("strong");
    name.textContent = person.name;
    const prompt = document.createElement("small");
    prompt.textContent = "View portrait and talk";
    details.append(name, prompt);
    card.append(portrait, details);
    card.addEventListener("click", () => openNpcDialog(person.id));
    elements.knownPeople.append(card);
  }

  for (const locationElement of elements.map.querySelectorAll(".location")) {
    locationElement.classList.toggle(
      "is-selected",
      locationElement.dataset.locationId === app.selectedLocationId
    );
  }

  const characterButtons = document.querySelectorAll("[data-travel-character]");
  for (const button of characterButtons) {
    const isAlreadyThere = app.playerState.characters[button.dataset.travelCharacter].locationId === location.id;
    button.disabled = app.travelPending || isAlreadyThere || isTravelBlocked(button.dataset.travelCharacter);
  }

  const partyButton = document.querySelector("[data-travel-party]");
  const wholePartyIsThere = app.game.investigators.every(
    (character) => app.playerState.characters[character.id].locationId === location.id
  );
  const partyTravelIsBlocked = app.game.investigators.some(
    (character) => isTravelBlocked(character.id)
  );
  partyButton.disabled = app.travelPending || wholePartyIsThere || partyTravelIsBlocked;
}

function renderInvestigatorList() {
  elements.investigatorList.replaceChildren();

  for (const investigator of app.game.investigators) {
    const row = document.createElement(investigator.portrait ? "button" : "div");
    row.className = "investigator-row";
    if (investigator.portrait) {
      row.type = "button";
      row.classList.add("has-portrait");
      row.addEventListener("click", () => openInvestigatorDialog(investigator.id));
    }
    const portrait = document.createElement(investigator.portrait ? "img" : "span");
    portrait.className = "portrait-token";
    if (investigator.portrait) {
      portrait.src = investigator.portrait;
      portrait.alt = "";
    } else {
      portrait.textContent = investigator.initials;
      portrait.style.backgroundColor = investigator.color;
    }

    const details = document.createElement("div");
    const name = document.createElement("strong");
    name.textContent = investigator.name;
    const place = document.createElement("small");
    const condition = investigatorCondition(investigator.id);
    const locationName = locationById(app.playerState.characters[investigator.id].locationId).name;
    place.textContent = condition === "unharmed" ? locationName : `${locationName} · ${condition}`;
    details.append(name, place);
    row.append(portrait, details);
    elements.investigatorList.append(row);
  }
}

function allBoardCards() {
  const evidence = app.narratorState.evidence.map((item) => ({
    ...item,
    isPlayerNote: false
  }));
  const notes = app.playerState.board.notes.map((note) => ({
    id: note.id,
    type: "Player note",
    title: note.title,
    summary: note.text,
    source: "Investigators",
    isPlayerNote: true
  }));
  return [...evidence, ...notes];
}

function ensureBoardPositions(cards) {
  cards.forEach((card, index) => {
    if (app.playerState.board.positions[card.id]) return;
    app.playerState.board.positions[card.id] = {
      x: 55 + (index % 5) * 270,
      y: 55 + Math.floor(index / 5) * 195
    };
  });
}

function drawConnections() {
  elements.connectionLayer.replaceChildren();
  elements.connectionLayer.setAttribute("viewBox", "0 0 1600 5000");

  for (const connection of app.playerState.board.connections) {
    const fromPosition = app.playerState.board.positions[connection.from];
    const toPosition = app.playerState.board.positions[connection.to];
    const fromCard = [...elements.cardLayer.children].find(
      (card) => card.dataset.cardId === connection.from
    );
    const toCard = [...elements.cardLayer.children].find(
      (card) => card.dataset.cardId === connection.to
    );
    const from = fromPosition && {
      x: fromPosition.x + (fromCard?.offsetWidth || 230) / 2,
      y: fromPosition.y + (fromCard?.offsetHeight || 138) / 2
    };
    const to = toPosition && {
      x: toPosition.x + (toCard?.offsetWidth || 230) / 2,
      y: toPosition.y + (toCard?.offsetHeight || 138) / 2
    };
    if (!from || !to) continue;

    const line = createSvgElement("line", {
      class: "connection-line",
      x1: from.x,
      y1: from.y,
      x2: to.x,
      y2: to.y
    });
    elements.connectionLayer.append(line);

    if (connection.label) {
      const midpointX = (from.x + to.x) / 2;
      const midpointY = (from.y + to.y) / 2;
      const deltaX = to.x - from.x;
      const deltaY = to.y - from.y;
      let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
      if (angle > 90 || angle < -90) angle += 180;
      const labelWidth = Math.min(260, Math.max(48, connection.label.length * 7 + 18));
      const group = createSvgElement("g", {
        transform: `translate(${midpointX} ${midpointY}) rotate(${angle})`
      });
      const background = createSvgElement("rect", {
        class: "connection-label-background",
        x: -labelWidth / 2,
        y: -28,
        width: labelWidth,
        height: 20,
        rx: 3
      });
      const text = createSvgElement("text", {
        class: "connection-label-text",
        x: 0,
        y: -14
      });
      text.textContent = connection.label;
      group.append(background, text);
      elements.connectionLayer.append(group);
    }
  }
}

function renderLocationSlide() {
  const location = locationById(app.activeLocationId);
  const slides = locationImages(location);
  if (slides.length === 0) return;
  const slide = slides[app.activeLocationSlideIndex];

  elements.locationDialogTitle.textContent = location.name;
  elements.locationSlideImage.src = slide.src;
  elements.locationSlideImage.alt = slide.alt;
  elements.locationSlideLabel.textContent = slide.label;
  elements.locationSlideCaption.textContent = `${app.activeLocationSlideIndex + 1} of ${slides.length} · ${slide.alt}`;
  if (elements.exploreLocationButton) {
    elements.exploreLocationButton.hidden = false;
    elements.exploreLocationButton.disabled = app.sceneLoading;
  }
  elements.previousLocationSlide.disabled = slides.length < 2;
  elements.nextLocationSlide.disabled = slides.length < 2;
  elements.locationSlideDots.replaceChildren();

  slides.forEach((item, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "slide-dot";
    dot.classList.toggle("is-active", index === app.activeLocationSlideIndex);
    dot.setAttribute("aria-label", `Show ${item.label.toLowerCase()} image`);
    dot.addEventListener("click", () => {
      app.activeLocationSlideIndex = index;
      renderLocationSlide();
    });
    elements.locationSlideDots.append(dot);
  });
}

function renderSceneInvestigatorButtons(activeId) {
  if (!elements.sceneInvestigatorButtons) return;
  elements.sceneInvestigatorButtons.replaceChildren();
  for (const investigator of app.sceneInvestigators) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "scene-investigator-button";
    button.classList.toggle("is-active", investigator.id === activeId);
    button.style.setProperty("--investigator-color", investigator.color);
    button.setAttribute("aria-pressed", String(investigator.id === activeId));
    const portrait = document.createElement("img");
    portrait.src = investigator.portrait;
    portrait.alt = "";
    const copy = document.createElement("span");
    const name = document.createElement("strong");
    name.textContent = investigator.name;
    const role = document.createElement("small");
    role.textContent = investigator.id === activeId ? "Currently leading" : "Take control";
    copy.append(name, role);
    button.append(portrait, copy);
    button.addEventListener("click", () => app.sceneController?.setActiveInvestigator(investigator.id));
    elements.sceneInvestigatorButtons.append(button);
  }
}

async function saveSceneFinding(finding, investigatorId) {
  const alreadyDiscovered = [
    ...(app.narratorState.items ?? []),
    ...(app.narratorState.evidence ?? [])
  ].some((entry) => entry.id === finding.id);
  if (alreadyDiscovered) return true;

  try {
    const payload = await requestJson("/api/scene/finding", {
      method: "POST",
      body: JSON.stringify({
        findingId: finding.id,
        investigatorId,
        locationId: app.currentSceneLocationId
      })
    });
    app.narratorState = payload.narratorState;
    if (!app.sceneFindings.some((entry) => entry.id === finding.id)) {
      app.sceneFindings.push(payload.finding);
      elements.sceneDiscoveries.hidden = false;
      const chip = document.createElement("span");
      chip.className = "scene-finding-chip";
      chip.textContent = payload.finding.name ?? payload.finding.title;
      chip.title = payload.unchanged ? "Already secured" : "Saved to the live case";
      elements.sceneDiscoveryItems.append(chip);
    }
    render();
    showToast(payload.unchanged
      ? `${finding.title} was already secured.`
      : `${finding.title} saved to the live case.`);
    return true;
  } catch (error) {
    elements.sceneMessage.textContent = error.message;
    showToast(error.message);
    return false;
  }
}

function setScenePrompt(prompt) {
  if (!elements.sceneAction) return;
  elements.sceneAction.hidden = !prompt;
  if (!prompt) return;
  elements.sceneActionKind.textContent = prompt.kind;
  elements.sceneActionLabel.textContent = prompt.label;
}

function setSceneTransition(active, nextArea) {
  if (!elements.sceneTransition) return;
  const copy = elements.sceneTransition.querySelector("p");
  const location = locationById(app.currentSceneLocationId);
  if (copy) copy.textContent = nextArea === "interior"
    ? `Entering ${location?.name ?? "the building"}`
    : `Returning outside ${location?.name ?? "the location"}`;
  elements.sceneTransition.classList.toggle("is-active", active);
}

async function openLocationScene() {
  if (!elements.sceneDialog || app.sceneLoading || app.sceneController) return;

  const locationId = app.activeLocationId;
  const location = locationById(locationId);

  const locationInvestigators = app.game.investigators.filter(
    (investigator) =>
      app.playerState.characters?.[investigator.id]?.locationId === locationId
  );

  if (locationInvestigators.length === 0) {
    showToast(`Move an investigator to ${location.name} before exploring it.`);
    return;
  }

  app.sceneLoading = true;
  app.sceneInvestigators = locationInvestigators;
  app.currentSceneLocationId = locationId;
  if (elements.exploreLocationButton) elements.exploreLocationButton.disabled = true;
  app.sceneFindings = [];
  elements.sceneDiscoveryItems?.replaceChildren();
  if (elements.sceneDiscoveries) elements.sceneDiscoveries.hidden = true;
  if (elements.locationDialog?.open) elements.locationDialog.close();
  elements.sceneLocationName.textContent = location.name;
  elements.sceneCanvas.setAttribute("aria-label", `Interactive three-dimensional scene of ${location.name}`);
  elements.sceneDialog.showModal();

  try {
    const sceneModule = locationId === "saint_oda_archive"
      ? await import("./scene/saint-oda.js")
      : await import("./scene/vesperholm-locations.js");
    const createScene = locationId === "saint_oda_archive"
      ? sceneModule.createSaintOdaScene
      : (options) => sceneModule.createVesperholmLocationScene(locationId, options);
    app.sceneController = createScene({
      container: elements.sceneCanvas,
      investigators: app.sceneInvestigators,
      people: peopleAtLocation(locationId),
      discoveredFindingIds: [
        ...(app.narratorState.items ?? []).map((item) => item.id),
        ...(app.narratorState.evidence ?? []).map((item) => item.id)
      ],
      onAreaChange: (label) => {
        elements.sceneAreaLabel.textContent = label;
      },
      onPrompt: setScenePrompt,
      onMessage: (message) => {
        elements.sceneMessage.textContent = message;
      },
      onFinding: saveSceneFinding,
      onTalk: (investigatorId, npcId) => {
        app.sceneController?.pause();
        openBrowserDialogue(investigatorId, npcId);
      },
      onActiveChange: renderSceneInvestigatorButtons,
      onTransition: setSceneTransition
    });
  } catch (error) {
    app.sceneInvestigators = [];
    app.currentSceneLocationId = null;
    elements.sceneDialog.close();
    showToast(`The 3D scene could not open: ${error.message}`);
  } finally {
    app.sceneLoading = false;
    if (elements.exploreLocationButton) elements.exploreLocationButton.disabled = false;
  }
}

function closeLocationScene() {
  app.sceneController?.destroy();
  app.sceneController = null;
  app.sceneInvestigators = [];
  app.currentSceneLocationId = null;
  elements.sceneInvestigatorButtons?.replaceChildren();
  app.sceneFindings = [];
  setScenePrompt(null);
  setSceneTransition(false, "exterior");
  if (elements.sceneDialog?.open) elements.sceneDialog.close();
}

function inventoryItems() {
  const collectedItems = (app.narratorState.items ?? []).map((item) => ({
    ...item,
    name: item.name ?? item.title,
    description: item.description ?? item.summary,
    foundAtLocationId: item.foundAtLocationId ?? null
  }));
  const physicalEvidence = (app.narratorState.evidence ?? [])
    .filter((item) => item.inventoryItem)
    .map((item) => ({
      id: item.id,
      name: item.inventoryItem.name ?? item.title,
      description: item.inventoryItem.description ?? item.summary,
      foundAtLocationId: item.inventoryItem.foundAtLocationId ?? null,
      image: item.inventoryItem.image ?? item.image,
      source: item.source,
      evidenceReference: true
    }));
  const itemIds = new Set(collectedItems.map((item) => item.id));
  return [...collectedItems, ...physicalEvidence.filter((item) => !itemIds.has(item.id))];
}

function openInventoryItem(itemId) {
  const item = inventoryItems().find((entry) => entry.id === itemId);
  if (!item || !elements.inventoryItemDialog) return;
  const location = locationById(item.foundAtLocationId);
  elements.inventoryItemName.textContent = item.name;
  elements.inventoryItemKind.textContent = item.evidenceReference ? "Physical evidence" : "Collected object";
  elements.inventoryItemDescription.textContent = item.description;
  elements.inventoryItemLocation.textContent = location?.name ?? item.source ?? "Unknown location";
  elements.inventoryItemImage.src = item.image ?? locationImages(location)[0]?.src ?? "";
  elements.inventoryItemImage.alt = item.name;
  if (!elements.inventoryItemDialog.open) elements.inventoryItemDialog.showModal();
}

function renderInventory() {
  if (!elements.inventoryGrid) return;
  const items = inventoryItems();
  elements.inventoryGrid.replaceChildren();
  elements.inventoryCount.textContent = String(items.length);
  elements.inventoryEmpty.hidden = items.length > 0;

  for (const item of items) {
    const location = locationById(item.foundAtLocationId);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "inventory-card";
    button.addEventListener("click", () => openInventoryItem(item.id));
    const image = document.createElement("img");
    image.src = item.image ?? locationImages(location)[0]?.src ?? "";
    image.alt = "";
    const copy = document.createElement("span");
    const type = document.createElement("small");
    type.textContent = item.evidenceReference ? "Physical evidence" : "Collected object";
    const name = document.createElement("strong");
    name.textContent = item.name;
    const place = document.createElement("em");
    place.textContent = location?.name ?? item.source ?? "Unknown location";
    copy.append(type, name, place);
    button.append(image, copy);
    elements.inventoryGrid.append(button);
  }
}

function openLocationDialog(locationId) {
  const location = locationById(locationId);
  if (locationImages(location).length === 0) {
    showToast("No location images are available yet.");
    return;
  }

  app.activeLocationId = locationId;
  app.activeLocationSlideIndex = 0;
  renderLocationSlide();
  if (!elements.locationDialog.open) elements.locationDialog.showModal();
}

function changeLocationSlide(offset) {
  const location = locationById(app.activeLocationId);
  const slides = locationImages(location);
  if (slides.length < 2) return;
  app.activeLocationSlideIndex = (
    app.activeLocationSlideIndex + offset + slides.length
  ) % slides.length;
  renderLocationSlide();
}

function renderBoard() {
  const cards = allBoardCards();
  ensureBoardPositions(cards);
  elements.cardLayer.replaceChildren();
  elements.boardEmpty.hidden = cards.length > 0;
  elements.evidenceCount.textContent = String(cards.length);

  for (const card of cards) {
    const position = app.playerState.board.positions[card.id];
    const cardElement = document.createElement("article");
    cardElement.className = "evidence-card";
    cardElement.tabIndex = 0;
    cardElement.setAttribute("role", "group");
    cardElement.classList.toggle("is-item-card", Boolean(card.isFoundItem));
    cardElement.dataset.cardId = card.id;
    cardElement.style.left = `${position.x}px`;
    cardElement.style.top = `${position.y}px`;
    cardElement.classList.toggle("is-link-source", app.linkSourceId === card.id);

    if (card.image) {
      const itemImage = document.createElement("img");
      itemImage.className = "item-card-image";
      itemImage.src = card.image;
      itemImage.alt = card.title;
      cardElement.append(itemImage);
    }

    const type = document.createElement("span");
    type.className = "card-type";
    type.textContent = card.type;
    const title = document.createElement("h3");
    title.textContent = card.title;
    const summary = document.createElement("p");
    summary.textContent = card.summary;
    const source = document.createElement("em");
    source.className = "card-source";
    source.textContent = card.source;
    cardElement.append(type, title, summary, source);

    if (card.isPlayerNote) {
      const actions = document.createElement("div");
      actions.className = "note-card-actions";
      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.className = "note-card-action";
      editButton.textContent = "Edit";
      editButton.addEventListener("click", () => openNoteDialog(card.id));
      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "note-card-action is-delete";
      deleteButton.textContent = "Delete";
      deleteButton.addEventListener("click", () => deletePlayerNote(card.id));
      actions.append(editButton, deleteButton);
      cardElement.append(actions);
    }

    cardElement.addEventListener("pointerdown", beginCardInteraction);
    elements.cardLayer.append(cardElement);
  }

  drawConnections();
}

function renderArrivalHandoff() {
  const latestEvent = app.playerState.latestEvent;
  const latestEventId = latestEvent?.id ?? null;
  const processedEventId = app.narratorState.lastProcessedEventId ?? null;
  elements.arrivalHandoff.hidden = !latestEventId || latestEventId === processedEventId;
  if (elements.arrivalHandoff.hidden) return;

  if (latestEvent.type === "npc_interaction") {
    const npc = npcById(latestEvent.npcId);
    elements.handoffTitle.textContent = "Conversation ready";
    elements.handoffCopy.textContent = `The interaction is recorded. Return to Codex and say, “We are talking to ${npc?.name ?? "this person"}.”`;
    return;
  }

  elements.handoffTitle.textContent = "Arrival recorded";
  elements.handoffCopy.textContent = "The JSON state is current. Return to Codex and say, “We have arrived.”";
}

function openNpcDialog(npcId) {
  const npc = npcById(npcId);
  if (!npc) {
    showToast("That person is no longer here.");
    return;
  }

  app.activeNpcId = npc.id;
  elements.npcDialogImage.src = npc.image;
  elements.npcDialogImage.alt = `Portrait of ${npc.name}`;
  elements.npcDialogName.textContent = npc.name;
  elements.npcDialogDescription.textContent = npc.description;
  elements.npcDialogActions.replaceChildren();

  const colocatedInvestigators = app.game.investigators.filter(
    (investigator) => app.playerState.characters[investigator.id].locationId === npc.locationId
  );
  for (const investigator of colocatedInvestigators) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "npc-talk-button";
    button.textContent = `Talk as ${investigator.name}`;
    button.disabled = app.interactionPending;
    button.style.borderLeftColor = investigator.color;
    button.addEventListener("click", () => {
      if (app.dialogueConfig?.enabled && elements.conversationDialog) {
        openBrowserDialogue(investigator.id, npc.id);
      } else {
        requestNpcInteraction(investigator.id, npc.id);
      }
    });
    elements.npcDialogActions.append(button);
  }

  elements.npcDialogGuidance.textContent = colocatedInvestigators.length > 0
    ? app.dialogueConfig?.enabled
      ? app.dialogueConfig.configured
        ? "The conversation continues here in the browser. You can speak naturally, bluff, or formally show discovered evidence."
        : "Browser dialogue needs OPENAI_API_KEY in the server environment before an NPC can answer."
      : "This records who begins the conversation. Continue the dialogue in Codex."
    : "Move an investigator to this location before starting a conversation.";
  if (!elements.npcDialog.open) elements.npcDialog.showModal();
}

function openInvestigatorDialog(characterId) {
  const investigator = investigatorById(characterId);
  if (!investigator?.portrait) return;
  app.activeNpcId = null;
  elements.npcDialogImage.src = investigator.portrait;
  elements.npcDialogImage.alt = `Portrait of ${investigator.name}`;
  elements.npcDialogName.textContent = investigator.name;
  elements.npcDialogDescription.textContent = `${investigator.role}. ${investigator.description}`;
  elements.npcDialogActions.replaceChildren();
  elements.npcDialogGuidance.textContent = investigator.strength ?? "Player investigator";
  if (!elements.npcDialog.open) elements.npcDialog.showModal();
}

function dialogueEvidenceById(evidenceId) {
  const evidence = (app.narratorState.evidence ?? []).find((item) => item.id === evidenceId);
  if (evidence) return { title: evidence.title, summary: evidence.summary };
  const item = (app.narratorState.items ?? []).find((entry) => entry.id === evidenceId);
  return item ? { title: item.name, summary: item.description } : null;
}

function populateConversationEvidence() {
  if (!elements.conversationEvidence) return;
  const selected = elements.conversationEvidence.value;
  elements.conversationEvidence.replaceChildren();
  const none = document.createElement("option");
  none.value = "";
  none.textContent = "Do not formally show evidence";
  elements.conversationEvidence.append(none);
  const records = [
    ...(app.narratorState.evidence ?? []).map((item) => ({ id: item.id, title: item.title })),
    ...(app.narratorState.items ?? []).map((item) => ({ id: item.id, title: item.name }))
  ];
  for (const record of records) {
    const option = document.createElement("option");
    option.value = record.id;
    option.textContent = `Show: ${record.title}`;
    elements.conversationEvidence.append(option);
  }
  if (records.some((record) => record.id === selected)) elements.conversationEvidence.value = selected;
}

function renderConversationTranscript() {
  if (!elements.conversationTranscript) return;
  elements.conversationTranscript.replaceChildren();
  if (app.dialogueTranscript.length === 0) {
    const empty = document.createElement("p");
    empty.className = "conversation-empty";
    empty.textContent = "The conversation has not begun. Speak naturally; this does not have to be a formal interview.";
    elements.conversationTranscript.append(empty);
    return;
  }

  for (const turn of app.dialogueTranscript) {
    const article = document.createElement("article");
    article.className = `conversation-turn is-${turn.role}`;
    const speaker = document.createElement("strong");
    speaker.textContent = turn.speakerName;
    const text = document.createElement("p");
    text.textContent = turn.text;
    article.append(speaker, text);
    if (turn.shownEvidenceId) {
      const shown = dialogueEvidenceById(turn.shownEvidenceId);
      const badge = document.createElement("span");
      badge.className = "shown-evidence-badge";
      badge.textContent = `Shown evidence: ${shown?.title ?? turn.shownEvidenceId}`;
      article.append(badge);
    }
    if (turn.delivery) {
      const delivery = document.createElement("em");
      delivery.textContent = turn.delivery;
      article.append(delivery);
    }
    elements.conversationTranscript.append(article);
  }
  elements.conversationTranscript.scrollTop = elements.conversationTranscript.scrollHeight;
}

function populateSpeechVoices() {
  if (!elements.conversationVoice || !("speechSynthesis" in window)) return;
  const previous = elements.conversationVoice.value;
  const voices = window.speechSynthesis.getVoices();
  elements.conversationVoice.replaceChildren();
  const automatic = document.createElement("option");
  automatic.value = "";
  automatic.textContent = "Automatic system voice";
  elements.conversationVoice.append(automatic);
  voices.forEach((voice, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = `${voice.name} · ${voice.lang}`;
    elements.conversationVoice.append(option);
  });
  if ([...elements.conversationVoice.options].some((option) => option.value === previous)) {
    elements.conversationVoice.value = previous;
  }
}

function speakNpcText(text) {
  if (!text || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const voiceIndex = Number.parseInt(elements.conversationVoice?.value ?? "", 10);
  const voices = window.speechSynthesis.getVoices();
  if (Number.isInteger(voiceIndex) && voices[voiceIndex]) utterance.voice = voices[voiceIndex];
  utterance.rate = Number.parseFloat(elements.conversationRate?.value ?? "1") || 1;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

async function openBrowserDialogue(investigatorId, npcId) {
  const investigator = investigatorById(investigatorId);
  const npc = npcById(npcId);
  if (!investigator || !npc || !elements.conversationDialog) return;

  app.activeDialogueInvestigatorId = investigatorId;
  app.activeDialogueNpcId = npcId;
  app.activeNpcId = npcId;
  elements.conversationNpcName.textContent = npc.name;
  elements.conversationNpcImage.src = npc.image;
  elements.conversationNpcImage.alt = `Portrait of ${npc.name}`;
  elements.conversationSpeaker.textContent = investigator.name;
  elements.conversationStatus.textContent = app.dialogueConfig?.configured
    ? "Connected to the local dialogue bridge"
    : "OPENAI_API_KEY is not configured";
  elements.conversationDelivery.textContent = "";
  elements.conversationGmNotice.hidden = true;
  populateConversationEvidence();
  populateSpeechVoices();
  app.dialogueTranscript = [];
  renderConversationTranscript();
  if (elements.npcDialog.open) elements.npcDialog.close();
  if (!elements.conversationDialog.open) elements.conversationDialog.showModal();

  try {
    const payload = await requestJson("/api/dialogue/session", {
      method: "POST",
      body: JSON.stringify({ investigatorId, npcId })
    });
    app.dialogueTranscript = payload.transcript;
    elements.conversationGmNotice.hidden = payload.pendingGmEventCount === 0;
    renderConversationTranscript();
  } catch (error) {
    elements.conversationStatus.textContent = error.message;
  }
  elements.conversationInput.focus();
}

async function submitDialogueTurn(event) {
  event.preventDefault();
  if (app.dialoguePending) return;
  const message = elements.conversationInput.value.trim();
  if (!message) return;

  app.dialoguePending = true;
  elements.conversationSend.disabled = true;
  elements.conversationInput.disabled = true;
  elements.conversationStatus.textContent = "Waiting for a response…";
  try {
    const payload = await requestJson("/api/dialogue/turn", {
      method: "POST",
      body: JSON.stringify({
        investigatorId: app.activeDialogueInvestigatorId,
        npcId: app.activeDialogueNpcId,
        message,
        shownEvidenceId: elements.conversationEvidence.value || null
      })
    });
    app.dialogueTranscript = payload.transcript;
    app.lastSpokenText = payload.reply.text;
    elements.conversationDelivery.textContent = payload.reply.delivery;
    elements.conversationInput.value = "";
    elements.conversationEvidence.value = "";
    elements.conversationStatus.textContent = payload.reply.endConversation
      ? "The NPC appears ready to end this conversation."
      : "Response recorded";
    elements.conversationGmNotice.hidden = payload.pendingGmEventCount === 0;
    renderConversationTranscript();
    if (elements.conversationAutoSpeak.checked) speakNpcText(payload.reply.text);
    if (payload.newEvidence.length > 0) showToast("The conversation added evidence to the case board.");
  } catch (error) {
    elements.conversationStatus.textContent = error.message;
    showToast(error.message);
  } finally {
    app.dialoguePending = false;
    elements.conversationSend.disabled = false;
    elements.conversationInput.disabled = false;
    elements.conversationInput.focus();
  }
}

async function requestNpcInteraction(characterId, npcId) {
  const investigator = investigatorById(characterId);
  const npc = npcById(npcId);
  if (!investigator || !npc || app.interactionPending) return;

  app.interactionPending = true;
  openNpcDialog(npcId);
  elements.saveStatus.textContent = "Recording conversation…";
  try {
    const payload = await requestJson("/api/interact", {
      method: "POST",
      body: JSON.stringify({ characterId, npcId })
    });
    app.playerState = payload.playerState;
    elements.saveStatus.textContent = `Saved revision ${app.playerState.revision}.`;
    elements.npcDialog.close();
    showToast(`Conversation with ${npc.name} recorded. Return to Codex to begin.`);
  } catch (error) {
    showToast(error.message);
    elements.saveStatus.textContent = "Conversation was not recorded.";
  } finally {
    app.interactionPending = false;
    render();
  }
}

function render() {
  elements.caseClock.textContent = formatClock(app.playerState.clock);
  elements.narratorMessage.textContent = app.narratorState.statusMessage;
  renderSelectedLocation();
  renderInvestigatorList();
  renderTokens();
  renderBoard();
  renderInventory();
  renderArrivalHandoff();
  if (elements.conversationDialog?.open) populateConversationEvidence();
}

function selectLocation(locationId) {
  app.selectedLocationId = locationId;
  renderSelectedLocation();
}

async function commitTravel(characterIds, destinationId) {
  const destination = locationById(destinationId);
  const movingCharacters = characterIds
    .filter((id) => app.playerState.characters[id].locationId !== destinationId)
    .map(investigatorById);
  if (movingCharacters.length === 0) {
    showToast("That investigator is already at this location.");
    return;
  }

  const names = movingCharacters.map((character) => character.name).join(" and ");
  const confirmed = window.confirm(
    `Travel to ${destination.name} with ${names}? This advances the case clock by ${app.game.rules.travelMinutes} minutes.`
  );
  if (!confirmed) return;

  app.travelPending = true;
  renderSelectedLocation();
  elements.saveStatus.textContent = "Recording travel…";

  try {
    const payload = await requestJson("/api/travel", {
      method: "POST",
      body: JSON.stringify({ characterIds, destinationId })
    });
    app.playerState = payload.playerState;
    app.selectedLocationId = destinationId;
    elements.saveStatus.textContent = `Saved revision ${app.playerState.revision}.`;
    openLocationDialog(destinationId);
    showToast("Arrival recorded. Return to Codex when you are ready to enter the scene.");
  } catch (error) {
    showToast(error.message);
    elements.saveStatus.textContent = "Travel was not saved.";
  } finally {
    app.travelPending = false;
    render();
  }
}

function mapPointFromEvent(event) {
  const point = elements.map.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  return point.matrixTransform(elements.map.getScreenCTM().inverse());
}

function nearestLocation(point) {
  return app.game.locations
    .map((location) => ({
      location,
      distance: Math.hypot(point.x - location.x, point.y - location.y)
    }))
    .sort((first, second) => first.distance - second.distance)[0];
}

function beginTokenDrag(event) {
  const token = event.target.closest(".investigator-token");
  if (!token || (event.pointerType === "mouse" && event.button !== 0)) return;
  event.preventDefault();
  elements.map.setPointerCapture(event.pointerId);
  token.classList.add("is-dragging");
  app.tokenDrag = {
    characterId: token.dataset.characterId,
    pointerId: event.pointerId,
    token
  };
}

function moveTokenDrag(event) {
  if (!app.tokenDrag || app.tokenDrag.pointerId !== event.pointerId) return;
  const point = mapPointFromEvent(event);
  app.tokenDrag.token.setAttribute("transform", `translate(${point.x} ${point.y})`);
}

function endTokenDrag(event) {
  if (!app.tokenDrag || app.tokenDrag.pointerId !== event.pointerId) return;
  const drag = app.tokenDrag;
  const point = mapPointFromEvent(event);
  const closest = nearestLocation(point);
  app.tokenDrag = null;
  if (elements.map.hasPointerCapture(event.pointerId)) elements.map.releasePointerCapture(event.pointerId);
  renderTokens();

  if (closest.distance <= 95) {
    selectLocation(closest.location.id);
    commitTravel([drag.characterId], closest.location.id);
  } else {
    showToast("Drop the investigator closer to a marked location.");
  }
}

function cancelTokenDrag(event) {
  if (!app.tokenDrag || app.tokenDrag.pointerId !== event.pointerId) return;
  app.tokenDrag = null;
  if (elements.map.hasPointerCapture(event.pointerId)) elements.map.releasePointerCapture(event.pointerId);
  renderTokens();
}

function beginCardInteraction(event) {
  if (event.target.closest(".note-card-action")) return;
  const card = event.currentTarget;
  const cardId = card.dataset.cardId;
  if (event.pointerType === "mouse" && event.button !== 0) return;
  event.preventDefault();

  if (app.linkMode) {
    handleCardConnection(cardId);
    return;
  }

  const position = app.playerState.board.positions[cardId];
  card.setPointerCapture(event.pointerId);
  card.classList.add("is-dragging");
  app.cardDrag = {
    card,
    cardId,
    pointerId: event.pointerId,
    startClientX: event.clientX,
    startClientY: event.clientY,
    startX: position.x,
    startY: position.y
  };
}

function moveCardDrag(event) {
  if (!app.cardDrag || app.cardDrag.pointerId !== event.pointerId) return;
  const nextX = Math.max(0, Math.min(1370, app.cardDrag.startX + event.clientX - app.cardDrag.startClientX));
  const nextY = Math.max(0, Math.min(4700, app.cardDrag.startY + event.clientY - app.cardDrag.startClientY));
  app.playerState.board.positions[app.cardDrag.cardId] = { x: Math.round(nextX), y: Math.round(nextY) };
  app.cardDrag.card.style.left = `${nextX}px`;
  app.cardDrag.card.style.top = `${nextY}px`;
  drawConnections();
}

async function endCardDrag(event) {
  if (!app.cardDrag || app.cardDrag.pointerId !== event.pointerId) return;
  const drag = app.cardDrag;
  app.cardDrag = null;
  drag.card.classList.remove("is-dragging");
  if (drag.card.hasPointerCapture(event.pointerId)) drag.card.releasePointerCapture(event.pointerId);
  await saveBoard("Board position saved.");
}

function handleCardConnection(cardId) {
  if (!app.linkSourceId) {
    app.linkSourceId = cardId;
    renderBoard();
    showToast("Choose a second card to connect.");
    return;
  }

  if (app.linkSourceId === cardId) {
    app.linkSourceId = null;
    renderBoard();
    return;
  }

  const label = window.prompt("Optional label for this connection:", "") ?? "";
  app.playerState.board.connections.push({
    id: globalThis.crypto?.randomUUID?.() ?? `link-${Date.now()}`,
    from: app.linkSourceId,
    to: cardId,
    label
  });
  app.linkSourceId = null;
  app.linkMode = false;
  elements.connectButton.classList.remove("is-active");
  elements.connectButton.setAttribute("aria-pressed", "false");
  renderBoard();
  saveBoard("Connection saved.");
}

async function saveBoard(successMessage) {
  elements.saveStatus.textContent = "Saving evidence board…";
  try {
    const payload = await requestJson("/api/board", {
      method: "POST",
      body: JSON.stringify({ board: app.playerState.board })
    });
    app.playerState = payload.playerState;
    elements.saveStatus.textContent = `Saved revision ${app.playerState.revision}.`;
    if (successMessage) showToast(successMessage);
  } catch (error) {
    elements.saveStatus.textContent = "Evidence board was not saved.";
    showToast(error.message);
  }
}

function openNoteDialog(noteId = null) {
  app.editingNoteId = noteId;
  elements.noteForm.reset();
  const note = noteId
    ? app.playerState.board.notes.find((candidate) => candidate.id === noteId)
    : null;
  elements.noteDialogTitle.textContent = note ? "Edit investigator note" : "Pin a thought to the board";
  elements.saveNoteButton.textContent = note ? "Save changes" : "Pin to board";
  elements.noteTitle.value = note?.title ?? "Investigator note";
  elements.noteText.value = note?.text ?? "";
  if (!elements.noteDialog.open) elements.noteDialog.showModal();
  requestAnimationFrame(() => elements.noteText.focus());
}

function closeNoteDialog() {
  if (elements.noteDialog.open) elements.noteDialog.close();
  app.editingNoteId = null;
}

function addPlayerNote(event) {
  event.preventDefault();
  const text = elements.noteText.value.trim();
  const title = elements.noteTitle.value.trim() || "Investigator note";
  if (!text) {
    elements.noteText.focus();
    return;
  }

  const editingNoteId = app.editingNoteId;
  if (editingNoteId) {
    const note = app.playerState.board.notes.find((candidate) => candidate.id === editingNoteId);
    if (note) Object.assign(note, { title, text });
  } else {
    const id = globalThis.crypto?.randomUUID?.() ?? `note-${Date.now()}`;
    app.playerState.board.notes.push({ id, title, text });
    app.playerState.board.positions[id] = {
      x: 70 + (app.playerState.board.notes.length % 4) * 270,
      y: 310
    };
  }
  closeNoteDialog();
  renderBoard();
  saveBoard(editingNoteId ? "Note updated." : "Note added.");
}

function deletePlayerNote(noteId) {
  const note = app.playerState.board.notes.find((candidate) => candidate.id === noteId);
  if (!note) return;
  if (!window.confirm(`Delete “${note.title}”? Its evidence connections will also be removed.`)) return;

  app.playerState.board.notes = app.playerState.board.notes.filter(
    (candidate) => candidate.id !== noteId
  );
  delete app.playerState.board.positions[noteId];
  app.playerState.board.connections = app.playerState.board.connections.filter(
    (connection) => connection.from !== noteId && connection.to !== noteId
  );
  if (app.editingNoteId === noteId) closeNoteDialog();
  renderBoard();
  saveBoard("Note deleted.");
}

function toggleConnectionMode() {
  app.linkMode = !app.linkMode;
  app.linkSourceId = null;
  elements.connectButton.classList.toggle("is-active", app.linkMode);
  elements.connectButton.setAttribute("aria-pressed", String(app.linkMode));
  renderBoard();
  showToast(app.linkMode ? "Select the first card to connect." : "Connection mode closed.");
}

function switchView(viewName) {
  for (const button of document.querySelectorAll(".tab-button")) {
    const active = button.dataset.view === viewName;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  }

  for (const panel of document.querySelectorAll(".view-panel")) {
    const active = panel.id === `${viewName}-view`;
    panel.classList.toggle("is-active", active);
    panel.hidden = !active;
  }

  if (viewName === "board") drawConnections();
}

async function resetRehearsal() {
  const seasonLabel = app.game.id === "season_2"
    ? "Season 2"
    : app.game.id === "season_1"
      ? "Season 1"
      : "Season 0";
  const confirmed = window.confirm(`Reset all ${seasonLabel} travel, notes, connections, and unlocked evidence?`);
  if (!confirmed) return;

  try {
    const payload = await requestJson("/api/reset", {
      method: "POST",
      body: "{}"
    });
    app.playerState = payload.playerState;
    app.narratorState = payload.narratorState;
    app.selectedLocationId = app.game.locations[0].id;
    app.linkMode = false;
    app.linkSourceId = null;
    elements.saveStatus.textContent = "Rehearsal reset to its opening state.";
    render();
    showToast(`${seasonLabel} has been reset.`);
  } catch (error) {
    showToast(error.message);
  }
}

function openStateStream() {
  const stream = new EventSource("/api/events");
  stream.addEventListener("open", () => setBridgeStatus("Live", "is-live"));
  stream.addEventListener("error", () => setBridgeStatus("Reconnecting", "is-error"));
  stream.addEventListener("player-state", (event) => {
    app.playerState = JSON.parse(event.data);
    render();
  });
  stream.addEventListener("narrator-state", (event) => {
    app.narratorState = JSON.parse(event.data);
    render();
    showToast("The case file has been updated by the narrator.");
  });
  stream.addEventListener("dialogue-state", (event) => {
    const state = JSON.parse(event.data);
    if (elements.conversationGmNotice) {
      elements.conversationGmNotice.hidden = state.pendingGmEventCount === 0;
    }
  });
}

function bindEvents() {
  for (const locationElement of elements.map.querySelectorAll(".location")) {
    locationElement.addEventListener("click", () => selectLocation(locationElement.dataset.locationId));
    locationElement.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectLocation(locationElement.dataset.locationId);
      }
    });
  }

  elements.map.addEventListener("pointerdown", beginTokenDrag);
  elements.map.addEventListener("pointermove", moveTokenDrag);
  elements.map.addEventListener("pointerup", endTokenDrag);
  elements.map.addEventListener("pointercancel", cancelTokenDrag);
  document.addEventListener("pointermove", moveCardDrag);
  document.addEventListener("pointerup", endCardDrag);

  for (const button of document.querySelectorAll("[data-travel-character]")) {
    button.addEventListener("click", () => commitTravel([button.dataset.travelCharacter], app.selectedLocationId));
  }

  document.querySelector("[data-travel-party]").addEventListener("click", () => {
    commitTravel(app.game.investigators.map((character) => character.id), app.selectedLocationId);
  });

  for (const button of document.querySelectorAll(".tab-button")) {
    button.addEventListener("click", () => switchView(button.dataset.view));
  }

  document.querySelector("#add-note-button").addEventListener("click", () => openNoteDialog());
  elements.connectButton.addEventListener("click", toggleConnectionMode);
  elements.resetButton.addEventListener("click", resetRehearsal);
  elements.noteForm.addEventListener("submit", addPlayerNote);
  elements.closeNoteDialog.addEventListener("click", closeNoteDialog);
  document.querySelector("#cancel-note-button").addEventListener("click", closeNoteDialog);
  elements.viewLocationButton.addEventListener("click", () => openLocationDialog(app.selectedLocationId));
  elements.exploreLocationButton?.addEventListener("click", openLocationScene);
  elements.sceneAction?.addEventListener("click", () => app.sceneController?.interact());
  elements.sceneClose?.addEventListener("click", closeLocationScene);
  elements.sceneDialog?.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeLocationScene();
  });
  elements.inventoryItemClose?.addEventListener("click", () => elements.inventoryItemDialog.close());
  elements.inventoryItemDialog?.addEventListener("click", (event) => {
    if (event.target === elements.inventoryItemDialog) elements.inventoryItemDialog.close();
  });
  elements.closeLocationDialog.addEventListener("click", () => elements.locationDialog.close());
  elements.closeNpcDialog.addEventListener("click", () => elements.npcDialog.close());
  elements.previousLocationSlide.addEventListener("click", () => changeLocationSlide(-1));
  elements.nextLocationSlide.addEventListener("click", () => changeLocationSlide(1));

  elements.locationDialog.addEventListener("click", (event) => {
    if (event.target === elements.locationDialog) elements.locationDialog.close();
  });
  elements.npcDialog.addEventListener("click", (event) => {
    if (event.target === elements.npcDialog) elements.npcDialog.close();
  });
  elements.npcDialog.addEventListener("close", () => {
    app.activeNpcId = null;
  });
  if (elements.conversationDialog) {
    elements.conversationForm.addEventListener("submit", submitDialogueTurn);
    elements.conversationClose.addEventListener("click", () => elements.conversationDialog.close());
    elements.conversationReplay.addEventListener("click", () => speakNpcText(app.lastSpokenText));
    elements.conversationStop.addEventListener("click", () => window.speechSynthesis?.cancel());
    elements.conversationDialog.addEventListener("click", (event) => {
      if (event.target === elements.conversationDialog) elements.conversationDialog.close();
    });
    elements.conversationDialog.addEventListener("close", () => {
      window.speechSynthesis?.cancel();
      app.activeDialogueInvestigatorId = null;
      app.activeDialogueNpcId = null;
      app.sceneController?.resume();
    });
    elements.conversationInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        elements.conversationForm.requestSubmit();
      }
    });
    if ("speechSynthesis" in window) {
      window.speechSynthesis.addEventListener("voiceschanged", populateSpeechVoices);
      populateSpeechVoices();
    } else {
      elements.conversationAutoSpeak.disabled = true;
      elements.conversationReplay.disabled = true;
      elements.conversationStop.disabled = true;
    }
  }
  elements.noteDialog.addEventListener("click", (event) => {
    if (event.target === elements.noteDialog) closeNoteDialog();
  });
  elements.noteDialog.addEventListener("close", () => {
    app.editingNoteId = null;
  });
  document.addEventListener("keydown", (event) => {
    if (!elements.locationDialog.open) return;
    if (event.key === "ArrowLeft") changeLocationSlide(-1);
    if (event.key === "ArrowRight") changeLocationSlide(1);
  });
}

async function initialize() {
  try {
    const payload = await requestJson("/api/bootstrap");
    app.game = payload.game;
    app.playerState = payload.playerState;
    app.narratorState = payload.narratorState;
    app.dialogueConfig = payload.dialogue ?? { enabled: false, configured: false, model: null };
    app.selectedLocationId = app.game.locations[0].id;
    bindEvents();
    render();
    openStateStream();
  } catch (error) {
    setBridgeStatus("Unavailable", "is-error");
    showToast(`${error.message} Start the local Node server and reload this page.`);
  }
}

initialize();
