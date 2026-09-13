import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/+esm";
import {
  animateMaraKeller,
  loadMaraKellerModel,
  disposeMaraKellerModel,
  setMaraFlashlight
} from "./mara-keller-rigged-model.js";

const stage = document.querySelector("#character-stage");
const loadingState = document.querySelector("#loading-state");
const errorState = document.querySelector("#error-state");
const errorMessage = document.querySelector("#error-message");
const flashlightButton = document.querySelector("#flashlight-toggle");
const flashlightState = document.querySelector("#flashlight-state");
const zoomRange = document.querySelector("#zoom-range");
const zoomReadout = document.querySelector("#zoom-readout");
const zoomInButton = document.querySelector("#zoom-in");
const zoomOutButton = document.querySelector("#zoom-out");
const resetViewButton = document.querySelector("#reset-view");

const MOVE_SPEED = 2.35;
const WALK_LIMIT = 10.8;
const MIN_VIEW_HEIGHT = 2.05;
const MAX_VIEW_HEIGHT = 11.5;
const DEFAULT_ZOOM = 55;
const DEFAULT_AZIMUTH = Math.PI * 0.22;
const CAMERA_ELEVATION = Math.PI * 0.29;

let renderer;
let scene;
let camera;
let mara;
let ground;
let flashlight;
let flashlightTarget;
let animationFrame;
let resizeObserver;
let lastTime = performance.now();
let flashlightOn = false;
let orbitAzimuth = DEFAULT_AZIMUTH;
let viewHeight = zoomValueToHeight(DEFAULT_ZOOM);
let moveTarget = null;
let dragging = false;
let dragMoved = false;
let pointerStartX = 0;
let pointerStartY = 0;
let orbitAtPointerStart = 0;

const keys = new Set();
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const cameraLook = new THREE.Vector3(0, 0.9, 0);
const desiredLook = new THREE.Vector3();
const moveVector = new THREE.Vector3();
const cameraForward = new THREE.Vector3();
const cameraRight = new THREE.Vector3();

function zoomValueToHeight(value) {
  const normalized = Number(value) / 100;
  return THREE.MathUtils.lerp(MAX_VIEW_HEIGHT, MIN_VIEW_HEIGHT, normalized * normalized * 0.84 + normalized * 0.16);
}

function studioMaterial(color, roughness = 0.86, metalness = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function addStudio() {
  const floorMaterial = studioMaterial(0x72797a, 0.92);
  floorMaterial.color.convertSRGBToLinear();
  ground = new THREE.Mesh(new THREE.CircleGeometry(15.5, 96), floorMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const outerFloor = new THREE.Mesh(new THREE.CircleGeometry(26, 96), studioMaterial(0x293034, 0.98));
  outerFloor.rotation.x = -Math.PI / 2;
  outerFloor.position.y = -0.012;
  outerFloor.receiveShadow = true;
  scene.add(outerFloor);

  const ringMaterial = new THREE.MeshBasicMaterial({ color: 0xb4aa98, transparent: true, opacity: 0.17, side: THREE.DoubleSide });
  for (const radius of [2.5, 5, 7.5, 10]) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(radius - 0.012, radius + 0.012, 96), ringMaterial);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.004;
    scene.add(ring);
  }

  const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xbbb2a3, transparent: true, opacity: 0.11 });
  for (const rotation of [0, Math.PI / 2]) {
    const line = new THREE.Mesh(new THREE.PlaneGeometry(0.022, 21), lineMaterial);
    line.rotation.set(-Math.PI / 2, 0, rotation);
    line.position.y = 0.006;
    scene.add(line);
  }

  const backdropMaterial = studioMaterial(0x555e61, 0.88);
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(19, 7), backdropMaterial);
  backWall.position.set(0, 3.5, 11.3);
  backWall.rotation.y = Math.PI;
  backWall.receiveShadow = true;
  scene.add(backWall);

  const sideWallMaterial = studioMaterial(0x424b4e, 0.9);
  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(12, 7), sideWallMaterial);
  leftWall.position.set(-10.1, 3.5, 5.1);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.receiveShadow = true;
  scene.add(leftWall);

  const rightWall = leftWall.clone();
  rightWall.position.x = 10.1;
  rightWall.rotation.y = -Math.PI / 2;
  scene.add(rightWall);

  const panelMaterial = studioMaterial(0x8b8580, 0.84);
  for (const x of [-5.8, 0, 5.8]) {
    const panel = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.9, 0.16), panelMaterial);
    panel.position.set(x, 1.95, 11.15);
    panel.castShadow = true;
    panel.receiveShadow = true;
    scene.add(panel);
  }

  const pedestalMaterial = studioMaterial(0x5d6566, 0.78);
  for (const [x, z, height] of [[-7.3, -3.5, 0.55], [7.1, 2.4, 0.82], [-4.4, 7.4, 0.34]]) {
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.62, height, 36), pedestalMaterial);
    pedestal.position.set(x, height / 2, z);
    pedestal.castShadow = true;
    pedestal.receiveShadow = true;
    scene.add(pedestal);
  }
}

function addLighting() {
  scene.add(new THREE.HemisphereLight(0xc8d5d8, 0x1d2021, 1.05));
  scene.add(new THREE.AmbientLight(0x8f9799, 0.3));

  const keyLight = new THREE.DirectionalLight(0xffeddd, 2.6);
  keyLight.position.set(-4.5, 8, -4);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  keyLight.shadow.camera.left = -11;
  keyLight.shadow.camera.right = 11;
  keyLight.shadow.camera.top = 11;
  keyLight.shadow.camera.bottom = -11;
  keyLight.shadow.bias = -0.00025;
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0xa8c8df, 1.65);
  rimLight.position.set(7, 6, 7);
  scene.add(rimLight);

  const warmFill = new THREE.PointLight(0xd8a882, 14, 10, 2);
  warmFill.position.set(-5, 2.5, 2);
  scene.add(warmFill);
}

function addFlashlight() {
  const mount = mara.userData.rig.flashlightMount;
  flashlight = new THREE.SpotLight(0xfff0cf, 0, 15, 0.56, 0.52, 1.45);
  flashlight.position.set(0, 0.14, 0);
  flashlight.castShadow = true;
  flashlight.shadow.mapSize.set(1024, 1024);
  flashlight.shadow.bias = -0.0002;

  flashlightTarget = new THREE.Object3D();
  flashlightTarget.position.set(0, 6, 0);
  mount.add(flashlight, flashlightTarget);
  flashlight.target = flashlightTarget;

  mara.userData.flashlightBeam = flashlight;
}

function setFlashlight(enabled) {
  flashlightOn = Boolean(enabled);
  setMaraFlashlight(mara, flashlightOn);
  flashlight.intensity = flashlightOn ? 105 : 0;
  flashlightButton.setAttribute("aria-pressed", String(flashlightOn));
  flashlightButton.querySelector("span:nth-child(2)").textContent = flashlightOn ? "Switch flashlight off" : "Switch flashlight on";
  flashlightState.textContent = flashlightOn ? "On" : "Off";
  flashlightState.classList.toggle("is-on", flashlightOn);
}

function setZoom(value) {
  const normalized = THREE.MathUtils.clamp(Number(value), 0, 100);
  zoomRange.value = String(Math.round(normalized));
  zoomReadout.value = `${Math.round(normalized)}%`;
  viewHeight = zoomValueToHeight(normalized);
  resize();
}

function resize() {
  if (!renderer || !camera) return;
  const width = Math.max(stage.clientWidth, 1);
  const height = Math.max(stage.clientHeight, 1);
  const aspect = width / height;
  camera.left = -(viewHeight * aspect) / 2;
  camera.right = (viewHeight * aspect) / 2;
  camera.top = viewHeight / 2;
  camera.bottom = -viewHeight / 2;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
}

function movementFromKeys() {
  let horizontal = 0;
  let vertical = 0;
  if (keys.has("KeyA") || keys.has("ArrowLeft")) horizontal -= 1;
  if (keys.has("KeyD") || keys.has("ArrowRight")) horizontal += 1;
  if (keys.has("KeyW") || keys.has("ArrowUp")) vertical += 1;
  if (keys.has("KeyS") || keys.has("ArrowDown")) vertical -= 1;
  if (!horizontal && !vertical) return moveVector.set(0, 0, 0);

  camera.getWorldDirection(cameraForward);
  cameraForward.y = 0;
  cameraForward.normalize();
  cameraRight.crossVectors(cameraForward, new THREE.Vector3(0, 1, 0)).normalize();
  moveVector.copy(cameraForward).multiplyScalar(vertical).addScaledVector(cameraRight, horizontal).normalize();
  return moveVector;
}

function updateMovement(delta) {
  const keyboardMovement = movementFromKeys();
  let moving = keyboardMovement.lengthSq() > 0;
  if (moving) moveTarget = null;

  if (!moving && moveTarget) {
    moveVector.copy(moveTarget).sub(mara.position);
    moveVector.y = 0;
    const distance = moveVector.length();
    if (distance < 0.08) {
      moveTarget = null;
      moveVector.set(0, 0, 0);
    } else {
      moveVector.normalize();
      moving = true;
    }
  }

  if (moving) {
    const nextX = THREE.MathUtils.clamp(mara.position.x + moveVector.x * MOVE_SPEED * delta, -WALK_LIMIT, WALK_LIMIT);
    const nextZ = THREE.MathUtils.clamp(mara.position.z + moveVector.z * MOVE_SPEED * delta, -WALK_LIMIT, WALK_LIMIT);
    mara.position.x = nextX;
    mara.position.z = nextZ;
    const desiredRotation = Math.atan2(moveVector.x, moveVector.z);
    let difference = desiredRotation - mara.rotation.y;
    difference = Math.atan2(Math.sin(difference), Math.cos(difference));
    mara.rotation.y += difference * (1 - Math.exp(-delta * 12));
  }

  animateMaraKeller(mara, { moving, delta, speed: 1 });
}

function updateCamera(delta) {
  desiredLook.set(mara.position.x, viewHeight < 3.4 ? 1.04 : 0.82, mara.position.z);
  cameraLook.lerp(desiredLook, 1 - Math.exp(-delta * 6.5));
  const distance = 18;
  const horizontal = Math.cos(CAMERA_ELEVATION) * distance;
  camera.position.set(
    cameraLook.x + Math.sin(orbitAzimuth) * horizontal,
    cameraLook.y + Math.sin(CAMERA_ELEVATION) * distance,
    cameraLook.z + Math.cos(orbitAzimuth) * horizontal
  );
  camera.lookAt(cameraLook);
}

function animate(now) {
  animationFrame = requestAnimationFrame(animate);
  const delta = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;
  updateMovement(delta);
  updateCamera(delta);
  flashlight.target.updateMatrixWorld();
  renderer.render(scene, camera);
}

function floorPointFromEvent(event) {
  const bounds = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
  pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  return raycaster.intersectObject(ground, false)[0]?.point ?? null;
}

function onPointerDown(event) {
  if (event.button !== 0) return;
  dragging = true;
  dragMoved = false;
  pointerStartX = event.clientX;
  pointerStartY = event.clientY;
  orbitAtPointerStart = orbitAzimuth;
  renderer.domElement.classList.add("is-dragging");
  renderer.domElement.setPointerCapture(event.pointerId);
}

function onPointerMove(event) {
  if (!dragging) return;
  const dx = event.clientX - pointerStartX;
  const dy = event.clientY - pointerStartY;
  if (Math.hypot(dx, dy) > 5) dragMoved = true;
  if (dragMoved) orbitAzimuth = orbitAtPointerStart - dx * 0.006;
}

function onPointerUp(event) {
  if (!dragging) return;
  dragging = false;
  renderer.domElement.classList.remove("is-dragging");
  if (renderer.domElement.hasPointerCapture(event.pointerId)) renderer.domElement.releasePointerCapture(event.pointerId);
  if (!dragMoved) {
    const point = floorPointFromEvent(event);
    if (point) {
      point.x = THREE.MathUtils.clamp(point.x, -WALK_LIMIT, WALK_LIMIT);
      point.z = THREE.MathUtils.clamp(point.z, -WALK_LIMIT, WALK_LIMIT);
      point.y = 0;
      moveTarget = point;
    }
  }
}

function onWheel(event) {
  event.preventDefault();
  const current = Number(zoomRange.value);
  setZoom(current - Math.sign(event.deltaY) * 5);
}

function onKeyDown(event) {
  if (["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) {
    event.preventDefault();
    keys.add(event.code);
  }
  if (event.code === "KeyF" && !event.repeat) {
    event.preventDefault();
    setFlashlight(!flashlightOn);
  }
}

function onKeyUp(event) {
  keys.delete(event.code);
}

function resetView() {
  mara.position.set(0, 0, 0);
  mara.rotation.y = 0;
  orbitAzimuth = DEFAULT_AZIMUTH;
  moveTarget = null;
  cameraLook.set(0, 0.9, 0);
  setZoom(DEFAULT_ZOOM);
  setFlashlight(false);
}

function bindControls() {
  flashlightButton.addEventListener("click", () => setFlashlight(!flashlightOn));
  zoomRange.addEventListener("input", () => setZoom(zoomRange.value));
  zoomInButton.addEventListener("click", () => setZoom(Number(zoomRange.value) + 8));
  zoomOutButton.addEventListener("click", () => setZoom(Number(zoomRange.value) - 8));
  resetViewButton.addEventListener("click", resetView);
  window.addEventListener("keydown", onKeyDown, { passive: false });
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", () => keys.clear());
  renderer.domElement.addEventListener("pointerdown", onPointerDown);
  renderer.domElement.addEventListener("pointermove", onPointerMove);
  renderer.domElement.addEventListener("pointerup", onPointerUp);
  renderer.domElement.addEventListener("pointercancel", onPointerUp);
  renderer.domElement.addEventListener("wheel", onWheel, { passive: false });
}

async function start() {
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.tabIndex = 0;
  stage.replaceChildren(renderer.domElement);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x20272a);
  scene.fog = new THREE.Fog(0x20272a, 17, 34);
  camera = new THREE.OrthographicCamera(-6, 6, 4, -4, 0.1, 60);

  addStudio();
  addLighting();
  mara = await loadMaraKellerModel();
  mara.position.set(0, 0, 0);
  mara.rotation.y = 0;
  scene.add(mara);
  addFlashlight();

  setZoom(DEFAULT_ZOOM);
  setFlashlight(false);
  updateCamera(1);
  resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(stage);
  bindControls();
  renderer.domElement.focus();
  loadingState.classList.add("is-ready");
  lastTime = performance.now();
  animationFrame = requestAnimationFrame(animate);
}

start().catch((error) => {
  console.error(error);
  loadingState.classList.add("is-ready");
  errorMessage.textContent = error instanceof Error ? error.message : "Unknown WebGL error.";
  errorState.hidden = false;
});

window.addEventListener("beforeunload", () => {
  if (animationFrame) cancelAnimationFrame(animationFrame);
  resizeObserver?.disconnect();
  if (mara) disposeMaraKellerModel(mara);
  renderer?.dispose();
});
