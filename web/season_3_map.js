const SVG_NS = "http://www.w3.org/2000/svg";

const elements = {
  map: document.querySelector("#sonnenfels-map"),
  mapImage: document.querySelector("#map-image"),
  mapLoading: document.querySelector("#map-loading"),
  locationLayer: document.querySelector("#location-layer"),
  investigatorLayer: document.querySelector("#investigator-layer"),
  caseClock: document.querySelector("#case-clock"),
  locationState: document.querySelector("#location-state"),
  locationNumber: document.querySelector("#location-number"),
  locationKind: document.querySelector("#location-kind"),
  locationName: document.querySelector("#location-name"),
  locationDescription: document.querySelector("#location-description"),
  availabilityTitle: document.querySelector("#availability-title"),
  availabilityCopy: document.querySelector("#availability-copy"),
  travelButton: document.querySelector("#travel-button"),
  statusMessage: document.querySelector("#status-message"),
  toast: document.querySelector("#toast")
};

const app = {
  game: null,
  playerState: null,
  narratorState: null,
  selectedLocationId: "winter_garden",
  markerElements: new Map(),
  toastTimer: null,
  travelPending: false
};

function svgElement(name, attributes = {}) {
  const element = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, String(value));
  return element;
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: options.body ? { "Content-Type": "application/json" } : undefined
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error ?? "The map state could not be updated.");
  return payload;
}

function showToast(message) {
  window.clearTimeout(app.toastTimer);
  elements.toast.textContent = message;
  elements.toast.hidden = false;
  app.toastTimer = window.setTimeout(() => {
    elements.toast.hidden = true;
  }, 3600);
}

function locationById(locationId) {
  return app.game.locations.find((location) => location.id === locationId);
}

function unlockedLocationIds() {
  return new Set(app.playerState.unlockedLocationIds ?? ["winter_garden"]);
}

function isUnlocked(locationId) {
  return unlockedLocationIds().has(locationId);
}

function currentLocationId() {
  return app.playerState.characters?.mara_keller?.locationId ?? "winter_garden";
}

function formatClock(clock) {
  if (!clock || typeof clock.minutes !== "number") return "Friday · 20:05";
  const hour = Math.floor(clock.minutes / 60) % 24;
  const minute = clock.minutes % 60;
  return `${clock.day} · ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function makeLockGlyph() {
  const lock = svgElement("g", { class: "marker-lock", "aria-hidden": "true" });
  const shackle = svgElement("path", {
    class: "marker-lock-shackle",
    d: "M -7 -2 V -7 A 7 7 0 0 1 7 -7 V -2"
  });
  const body = svgElement("rect", {
    class: "marker-lock-body",
    x: -10,
    y: -3,
    width: 20,
    height: 16,
    rx: 3
  });
  lock.append(shackle, body);
  return lock;
}

function createLocationMarker(location) {
  const marker = svgElement("g", {
    class: "location-marker",
    "data-location-id": location.id,
    transform: `translate(${location.x} ${location.y})`,
    role: "button",
    tabindex: 0
  });
  const title = svgElement("title");
  const hit = svgElement("circle", { class: "marker-hit", cx: 0, cy: 0, r: 48 });
  const orbit = svgElement("circle", { class: "marker-orbit", cx: 0, cy: 0, r: 25 });
  const core = svgElement("circle", { class: "marker-core", cx: 0, cy: 0, r: 17 });
  const label = svgElement("text", { class: "marker-label", x: 0, y: 46 });
  marker.append(title, hit, orbit, core, makeLockGlyph(), label);

  const activate = () => {
    if (!isUnlocked(location.id)) {
      showToast("This destination has not been discovered. Find a lead in the scene or learn about it during a conversation.");
      return;
    }
    app.selectedLocationId = location.id;
    render();
  };
  marker.addEventListener("click", activate);
  marker.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    activate();
  });
  elements.locationLayer.append(marker);
  app.markerElements.set(location.id, { marker, title, label });
}

function renderMarkers() {
  const unlocked = unlockedLocationIds();
  for (const location of app.game.locations) {
    const parts = app.markerElements.get(location.id);
    const available = unlocked.has(location.id);
    parts.marker.classList.toggle("is-locked", !available);
    parts.marker.classList.toggle("is-unlocked", available);
    parts.marker.classList.toggle("is-selected", available && location.id === app.selectedLocationId);
    parts.marker.setAttribute("aria-disabled", String(!available));
    parts.marker.setAttribute("aria-label", available ? location.name : "Undiscovered location");
    parts.title.textContent = available ? location.name : "Undiscovered location";
    parts.label.textContent = available ? location.name.toUpperCase() : "UNDISCOVERED";
  }
}

function renderInvestigator() {
  const location = locationById(currentLocationId()) ?? locationById("winter_garden");
  elements.investigatorLayer.replaceChildren();
  const token = svgElement("g", {
    class: "investigator-token",
    transform: `translate(${location.x} ${location.y - 48})`,
    role: "img",
    "aria-label": `Mara Keller at ${location.name}`
  });
  const pointer = svgElement("path", { class: "token-pointer", d: "M -7 16 L 0 28 L 7 16 Z" });
  const ring = svgElement("circle", { class: "token-ring", cx: 0, cy: 0, r: 20 });
  const core = svgElement("circle", { class: "token-core", cx: 0, cy: 0, r: 15 });
  const initials = svgElement("text", { x: 0, y: 4 });
  initials.textContent = "MK";
  token.append(pointer, ring, core, initials);
  elements.investigatorLayer.append(token);
}

function renderPanel() {
  const location = locationById(app.selectedLocationId) ?? locationById(currentLocationId());
  const atLocation = location.id === currentLocationId();
  const index = app.game.locations.findIndex((entry) => entry.id === location.id) + 1;
  elements.locationNumber.textContent = `SF–${String(index).padStart(2, "0")}`;
  elements.locationKind.textContent = location.kind;
  elements.locationName.textContent = location.name;
  elements.locationDescription.textContent = location.description;
  elements.locationState.textContent = atLocation ? "Current location" : "Accessible";
  elements.locationState.classList.toggle("is-current", atLocation);
  elements.locationState.classList.toggle("is-available", !atLocation);
  elements.availabilityTitle.textContent = atLocation ? "Investigation begins here" : "Destination discovered";
  elements.availabilityCopy.textContent = atLocation
    ? "Mara arrived at this location with the initial police handover."
    : "A recorded lead has made this destination available for travel.";
  elements.travelButton.disabled = atLocation || app.travelPending;
  elements.travelButton.textContent = atLocation ? "Mara is here" : app.travelPending ? "Recording journey…" : `Travel to ${location.name}`;
}

function render() {
  elements.caseClock.textContent = formatClock(app.playerState.clock);
  elements.statusMessage.textContent = app.narratorState.statusMessage
    ?? "Only the Winter Garden is currently accessible.";
  renderMarkers();
  renderInvestigator();
  renderPanel();
}

async function travel() {
  const destination = locationById(app.selectedLocationId);
  if (!destination || !isUnlocked(destination.id) || destination.id === currentLocationId()) return;
  app.travelPending = true;
  renderPanel();
  try {
    const payload = await requestJson("/api/travel", {
      method: "POST",
      body: JSON.stringify({ characterIds: ["mara_keller"], destinationId: destination.id })
    });
    app.playerState = payload.playerState;
    render();
    showToast(`Mara arrived at ${destination.name}.`);
  } catch (error) {
    showToast(error instanceof Error ? error.message : "The journey could not be recorded.");
  } finally {
    app.travelPending = false;
    renderPanel();
  }
}

function subscribeToState() {
  const events = new EventSource("/api/events");
  events.addEventListener("player-state", (event) => {
    app.playerState = JSON.parse(event.data);
    if (!isUnlocked(app.selectedLocationId)) app.selectedLocationId = currentLocationId();
    render();
  });
  events.addEventListener("narrator-state", (event) => {
    app.narratorState = JSON.parse(event.data);
    render();
  });
}

async function start() {
  const payload = await requestJson("/api/bootstrap");
  app.game = payload.game;
  app.playerState = payload.playerState;
  app.narratorState = payload.narratorState;
  app.selectedLocationId = currentLocationId();
  for (const location of app.game.locations) createLocationMarker(location);
  elements.travelButton.addEventListener("click", travel);
  render();
  subscribeToState();

  if (elements.mapImage.complete) elements.mapLoading.classList.add("is-ready");
  else elements.mapImage.addEventListener("load", () => elements.mapLoading.classList.add("is-ready"), { once: true });
}

start().catch((error) => {
  elements.mapLoading.textContent = error instanceof Error ? error.message : "The map could not be loaded.";
});
