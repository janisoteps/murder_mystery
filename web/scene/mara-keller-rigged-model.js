import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/+esm";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/loaders/GLTFLoader.js/+esm";

const MODEL_URL = "/season-character/mara_keller_3d_rigged_2.glb";
const TARGET_HEIGHT = 1.72;

const LEG_BONES = new Set([
  "mixamorigleftupleg",
  "mixamorigleftleg",
  "mixamorigleftfoot",
  "mixamoriglefttoebase",
  "mixamoriglefttoe_end",
  "mixamorigrightupleg",
  "mixamorigrightleg",
  "mixamorigrightfoot",
  "mixamorigrighttoebase",
  "mixamorigrighttoe_end"
]);

function makeFlashlight() {
  const flashlightLength = 0.26;
  const flashlightHeadWidth = 0.104;
  const mount = new THREE.Group();
  mount.name = "mara-flashlight-mount";
  // Position the torch at Mara's hand: one torch length farther back and 1.2
  // head widths above its original satchel placement.
  mount.position.set(
    -0.255,
    0.67 + flashlightHeadWidth * 1.2,
    0.105 - flashlightLength
  );
  mount.rotation.x = Math.PI / 2;
  mount.rotation.z = -0.08;

  const metal = new THREE.MeshStandardMaterial({ color: 0x17191a, roughness: 0.3, metalness: 0.82 });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x121111, roughness: 0.9 });
  const rimMaterial = new THREE.MeshStandardMaterial({ color: 0xbfc2c1, roughness: 0.28, metalness: 0.9 });
  const lensMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xdde8dd,
    roughness: 0.12,
    transmission: 0.12,
    emissive: 0xdde8dd,
    emissiveIntensity: 0
  });

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.029, 0.19, 24), metal);
  body.position.y = 0.1;
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.031, 0.031, 0.105, 24), rubber);
  grip.position.y = 0.075;
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.031, 0.06, 24), metal);
  head.position.y = 0.225;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.047, 0.006, 10, 28), rimMaterial);
  rim.position.y = 0.257;
  rim.rotation.x = Math.PI / 2;
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.043, 28), lensMaterial);
  lens.position.y = 0.259;
  lens.rotation.x = -Math.PI / 2;

  mount.add(body, grip, head, rim, lens);
  mount.traverse((object) => {
    if (!object.isMesh) return;
    object.castShadow = true;
    object.receiveShadow = true;
  });
  mount.userData.lensMaterial = lensMaterial;
  return mount;
}

function trackTargetName(track) {
  const propertySeparator = track.name.lastIndexOf(".");
  return propertySeparator < 0 ? track.name : track.name.slice(0, propertySeparator);
}

function canonicalBoneName(name) {
  return name.replace(/[^a-z0-9_]/gi, "").toLowerCase();
}

function makeLegOnlyClip(sourceClip) {
  const tracks = sourceClip.tracks
    .filter((track) => LEG_BONES.has(canonicalBoneName(trackTargetName(track))) && track.name.endsWith(".quaternion"))
    .map((track) => track.clone());
  return new THREE.AnimationClip("Mara_Legs_Only", sourceClip.duration, tracks);
}

function normalizeModel(visual) {
  visual.updateMatrixWorld(true);
  const initialBounds = new THREE.Box3().setFromObject(visual);
  const initialHeight = initialBounds.max.y - initialBounds.min.y;
  const scale = initialHeight > 0 ? TARGET_HEIGHT / initialHeight : 1;
  visual.scale.setScalar(scale);
  visual.updateMatrixWorld(true);

  const bounds = new THREE.Box3().setFromObject(visual);
  const center = bounds.getCenter(new THREE.Vector3());
  visual.position.x -= center.x;
  visual.position.y -= bounds.min.y;
  visual.position.z -= center.z;
  visual.updateMatrixWorld(true);
}

export async function loadMaraKellerModel() {
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(MODEL_URL);
  const root = new THREE.Group();
  root.name = "mara-keller-rigged-model";
  const visual = gltf.scene;
  normalizeModel(visual);
  root.add(visual);

  visual.traverse((object) => {
    if (!object.isMesh) return;
    object.castShadow = true;
    object.receiveShadow = true;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (!material) continue;
      // Meshy's baked albedo is deliberately subdued. A modest HDR tint lifts
      // every embedded texture without replacing or washing out its detail.
      if (material.color) material.color.multiplyScalar(1.65);
      material.needsUpdate = true;
    }
  });

  const legBones = new Map();
  const restQuaternions = new Map();
  visual.traverse((object) => {
    const boneName = canonicalBoneName(object.name);
    if (!object.isBone || !LEG_BONES.has(boneName)) return;
    legBones.set(boneName, object);
    restQuaternions.set(boneName, object.quaternion.clone());
  });

  const sourceClip = gltf.animations.find((clip) => clip.name === "Casual_Walk") ?? gltf.animations[0];
  if (!sourceClip) throw new Error("The rigged Mara file does not contain a walk animation.");
  const legClip = makeLegOnlyClip(sourceClip);
  if (!legClip.tracks.length) throw new Error("The walk animation does not contain recognizable Mixamo leg tracks.");

  const mixer = new THREE.AnimationMixer(visual);
  const action = mixer.clipAction(legClip);
  action.setLoop(THREE.LoopRepeat, Infinity);
  action.play();
  action.paused = true;

  const flashlightMount = makeFlashlight();
  root.add(flashlightMount);

  root.userData.rig = {
    visual,
    mixer,
    action,
    legBones,
    restQuaternions,
    flashlightMount
  };
  root.userData.flashlightOn = false;
  return root;
}

export function animateMaraKeller(model, { moving = false, delta = 0, speed = 1 } = {}) {
  const rig = model.userData.rig;
  if (!rig) return;

  if (moving) {
    rig.action.paused = false;
    rig.mixer.update(delta * speed);
    return;
  }

  rig.action.paused = true;
  const returnAmount = 1 - Math.exp(-delta * 8);
  for (const [name, bone] of rig.legBones) {
    bone.quaternion.slerp(rig.restQuaternions.get(name), returnAmount);
  }
}

export function setMaraFlashlight(model, enabled) {
  model.userData.flashlightOn = Boolean(enabled);
  const lens = model.userData.rig?.flashlightMount?.userData?.lensMaterial;
  if (lens) lens.emissiveIntensity = enabled ? 4.5 : 0;
}

export function disposeMaraKellerModel(model) {
  const materials = new Set();
  const geometries = new Set();
  const textures = new Set();
  model.traverse((object) => {
    if (object.geometry) geometries.add(object.geometry);
    const nextMaterials = Array.isArray(object.material) ? object.material : object.material ? [object.material] : [];
    for (const material of nextMaterials) {
      materials.add(material);
      for (const value of Object.values(material)) {
        if (value?.isTexture) textures.add(value);
      }
    }
  });
  model.userData.rig?.mixer?.stopAllAction();
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
  textures.forEach((texture) => texture.dispose());
}
