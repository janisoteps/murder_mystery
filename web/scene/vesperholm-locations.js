import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";
import { animateCharacterModel, createInvestigatorModel, createNpcModel } from "./character-models.js";
import { createSurfaceMaterials } from "./surface-materials.js";

const WALK_SPEED = 4.3;
const PLAYER_RADIUS = 0.38;
const INTERACTION_DISTANCE = 2.15;

function material(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.78,
    metalness: options.metalness ?? 0.04,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0,
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1,
    side: options.side ?? THREE.FrontSide
  });
}

function mesh(geometry, meshMaterial, position = {}) {
  const result = new THREE.Mesh(geometry, meshMaterial);
  result.position.set(position.x ?? 0, position.y ?? 0, position.z ?? 0);
  result.rotation.set(position.rx ?? 0, position.ry ?? 0, position.rz ?? 0);
  result.castShadow = true;
  result.receiveShadow = true;
  return result;
}

function box(width, height, depth, meshMaterial, position = {}) {
  return mesh(new THREE.BoxGeometry(width, height, depth), meshMaterial, position);
}

function cylinder(top, bottom, height, segments, meshMaterial, position = {}) {
  return mesh(new THREE.CylinderGeometry(top, bottom, height, segments), meshMaterial, position);
}

function ring(color = 0xc6a66a) {
  const result = mesh(
    new THREE.RingGeometry(0.48, 0.58, 32),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.72, side: THREE.DoubleSide }),
    { y: 0.025, rx: -Math.PI / 2 }
  );
  result.castShadow = false;
  result.receiveShadow = false;
  result.visible = false;
  return result;
}

function createContext(world, surfaces, hooks) {
  const ctx = {
    world,
    surfaces,
    walkSurface: null,
    collisions: [],
    interactions: [],
    animated: [],
    add(...objects) {
      world.add(...objects);
      return objects.at(-1);
    },
    box(width, height, depth, meshMaterial, position) {
      return ctx.add(box(width, height, depth, meshMaterial, position));
    },
    cylinder(top, bottom, height, segments, meshMaterial, position) {
      return ctx.add(cylinder(top, bottom, height, segments, meshMaterial, position));
    },
    material,
    light(color, intensity, distance, position, castShadow = false) {
      const light = new THREE.PointLight(color, intensity, distance, 2);
      light.position.set(position.x, position.y, position.z);
      light.castShadow = castShadow;
      if (castShadow) light.shadow.mapSize.set(512, 512);
      return ctx.add(light);
    },
    collision(minX, maxX, minZ, maxZ) {
      ctx.collisions.push({ minX, maxX, minZ, maxZ });
    },
    interaction(definition) {
      const marker = ring(definition.color);
      marker.position.x = definition.position.x;
      marker.position.z = definition.position.z;
      ctx.add(marker);
      ctx.interactions.push({ radius: INTERACTION_DISTANCE, ...definition, ring: marker });
    },
    inspect(id, label, position, message) {
      ctx.interaction({ id, kind: "Inspect", label, position: new THREE.Vector3(position.x, 0, position.z), action: () => hooks.message(message) });
    },
    collectible(item, position, shape = "box") {
      let pending = false;
      const objectMaterial = material(item.color ?? 0xc6a66a, {
        metalness: shape === "metal" ? 0.72 : 0.12,
        roughness: shape === "metal" ? 0.34 : 0.68,
        emissive: item.color ?? 0xc6a66a,
        emissiveIntensity: 0.12
      });
      const object = shape === "vial"
        ? cylinder(0.1, 0.1, 0.42, 12, objectMaterial, { x: position.x, y: 0.25, z: position.z })
        : box(0.42, 0.12, 0.3, objectMaterial, { x: position.x, y: 0.12, z: position.z, ry: 0.18 });
      object.visible = !hooks.isCollected(item.id);
      ctx.add(object);
      ctx.interaction({
        id: item.id,
        kind: "Collect",
        label: item.title,
        position: new THREE.Vector3(position.x, 0, position.z),
        available: () => !pending && !hooks.isCollected(item.id),
        action: async () => {
          pending = true;
          const saved = await hooks.finding(item);
          pending = false;
          if (!saved) return;
          hooks.markCollected(item.id);
          object.visible = false;
          hooks.message(`${item.title} is secured in the live inventory.`);
        }
      });
    }
  };
  return ctx;
}

function ground(ctx, kind = "flagstone", size = 38) {
  const floor = mesh(new THREE.PlaneGeometry(size, size), ctx.surfaces[kind], { y: -0.03, rx: -Math.PI / 2 });
  floor.castShadow = false;
  ctx.add(floor);
  ctx.walkSurface = floor;
}

function openInterior(ctx, floorKind = "flagstone", wallKind = "stone", width = 18, depth = 22) {
  ground(ctx, floorKind, Math.max(width, depth) + 2);
  ctx.box(0.55, 5.8, depth, ctx.surfaces[wallKind], { x: -width / 2, y: 2.9 });
  ctx.box(width, 5.8, 0.55, ctx.surfaces[wallKind], { y: 2.9, z: -depth / 2 });
  ctx.collision(-width / 2 - 0.2, -width / 2 + 0.65, -depth / 2, depth / 2);
  ctx.collision(-width / 2, width / 2, -depth / 2 - 0.2, -depth / 2 + 0.65);
}

function pitchedBuilding(ctx, { width = 10, depth = 12, height = 4.8, x = 0, z = -2, walls, roof, door = 0 }) {
  ctx.box(width, height, depth, walls, { x, y: height / 2, z });
  ctx.box(width * 0.58, 0.38, depth + 0.6, roof, { x: x - width * 0.22, y: height + 1.15, z, rz: 0.48 });
  ctx.box(width * 0.58, 0.38, depth + 0.6, roof, { x: x + width * 0.22, y: height + 1.15, z, rz: -0.48 });
  ctx.box(1.8, 3.1, 0.24, ctx.surfaces.darkWood, { x: x + door, y: 1.55, z: z + depth / 2 + 0.14 });
  ctx.collision(x - width / 2 - 0.4, x + width / 2 + 0.4, z - depth / 2 - 0.4, z + depth / 2 - 0.5);
}

function workTable(ctx, x, z, width = 3.2) {
  ctx.box(width, 0.18, 1.25, ctx.surfaces.wood, { x, y: 1.05, z });
  ctx.box(0.18, 1.05, 1, ctx.surfaces.darkWood, { x: x - width * 0.4, y: 0.52, z });
  ctx.box(0.18, 1.05, 1, ctx.surfaces.darkWood, { x: x + width * 0.4, y: 0.52, z });
  ctx.collision(x - width / 2 - 0.2, x + width / 2 + 0.2, z - 0.8, z + 0.8);
}

function cabinet(ctx, x, z, width = 2.3, height = 3.2) {
  ctx.box(width, height, 0.62, ctx.surfaces.darkWood, { x, y: height / 2, z });
  for (let row = 0; row < 4; row += 1) {
    ctx.box(width - 0.2, 0.09, 0.75, ctx.surfaces.wood, { x, y: 0.55 + row * 0.72, z: z + 0.08 });
  }
  ctx.collision(x - width / 2 - 0.2, x + width / 2 + 0.2, z - 0.5, z + 0.6);
}

function consoleBank(ctx, x, z, width = 4, rotation = 0) {
  const steel = material(0x46585b, { metalness: 0.45, roughness: 0.56 });
  ctx.box(width, 1.25, 0.8, steel, { x, y: 0.62, z, ry: rotation });
  for (let index = 0; index < 5; index += 1) {
    ctx.box(0.32, 0.22, 0.05, material(index % 2 ? 0x8ca56c : 0x7ba5b2, { emissive: index % 2 ? 0x394d22 : 0x244e58, emissiveIntensity: 1.1 }), {
      x: x - width * 0.36 + index * width * 0.18,
      y: 1.15,
      z: z + 0.43
    });
  }
  ctx.collision(x - width / 2 - 0.2, x + width / 2 + 0.2, z - 0.65, z + 0.65);
}

function addExteriorWeather(ctx, color = 0x95b7bd) {
  const count = 700;
  const positions = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    positions[index * 3] = (Math.random() - 0.5) * 42;
    positions[index * 3 + 1] = Math.random() * 18;
    positions[index * 3 + 2] = (Math.random() - 0.5) * 42;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const rain = new THREE.Points(geometry, new THREE.PointsMaterial({ color, size: 0.05, transparent: true, opacity: 0.34, depthWrite: false }));
  ctx.add(rain);
  ctx.animated.push((delta) => {
    rain.position.y -= delta * 7;
    if (rain.position.y < -9) rain.position.y = 0;
  });
}

function signalHouseExterior(ctx) {
  ground(ctx, "grass", 44);
  pitchedBuilding(ctx, { width: 10, depth: 11, height: 4.5, z: -2, walls: ctx.surfaces.stone, roof: ctx.surfaces.slate });
  const iron = material(0x344044, { metalness: 0.72, roughness: 0.42 });
  ctx.cylinder(0.11, 0.2, 9, 10, iron, { x: -7, y: 4.5, z: -4 });
  for (let y = 2; y < 8; y += 1.5) ctx.box(3.8, 0.08, 0.08, iron, { x: -7, y, z: -4, rz: y % 3 ? 0.42 : -0.42 });
  ctx.box(8, 0.18, 2.4, ctx.surfaces.flagstone, { y: 0.03, z: 8 });
  ctx.light(0xffc06b, 4, 8, { x: 0, y: 3.2, z: 3.8 });
  ctx.inspect("signal-mast", "Examine the aerial mast", { x: -7, z: -2 }, "The telegraph aerial has been re-tensioned recently despite the station's official closure.");
  addExteriorWeather(ctx);
  return { spawn: [{ x: 0, z: 15 }], door: { x: 0, z: 3.8 }, bounds: { minX: -18, maxX: 18, minZ: -13, maxZ: 18 }, label: "Harbor ridge · Exterior", message: "The old signal mast hums above the harbor wind. Light leaks from the improvised case room." };
}

function signalHouseInterior(ctx) {
  openInterior(ctx, "wood", "stone");
  workTable(ctx, -3.8, -2.5, 4.3);
  workTable(ctx, 3.3, 2.4, 3.6);
  consoleBank(ctx, 3.4, -8.8, 4.8);
  cabinet(ctx, -7.8, -6.6, 2.5);
  ctx.box(5.5, 2.6, 0.08, ctx.surfaces.paper, { x: -4.6, y: 3, z: -10.68 });
  ctx.light(0xf4c880, 8, 7, { x: -3.5, y: 3.2, z: -2.5 }, true);
  ctx.light(0x9ec6cf, 5, 8, { x: 3.2, y: 3.5, z: -7 });
  ctx.inspect("signal-charts", "Study the harbor charts", { x: -4.5, z: -8.8 }, "Pins trace the ferry lanes, Tidegate channel, and submerged landing beneath Saint Vigga.");
  ctx.collectible({ id: "signal-telegraph-strip", title: "Dated telegraph strip", type: "Collected object", description: "A narrow station printout carrying a sequence of harbor signals from the evening Annika died.", foundAtLocationId: "signal_house", image: "/assets/season_2/locations/signal_house_interior.png", color: 0xd6c6a1 }, { x: -3.2, z: -2.5 });
  return interiorResult("Investigation room · Interior", "Charts, radio static, and shaded desk lamps turn the abandoned station into a watchful case room.");
}

function fortExterior(ctx) {
  ground(ctx, "flagstone", 48);
  const stone = ctx.surfaces.stone;
  ctx.cylinder(7.2, 8, 5.4, 28, stone, { y: 2.7, z: -4 });
  ctx.cylinder(5.5, 6.3, 1.4, 28, ctx.surfaces.slate, { y: 6, z: -4 });
  ctx.box(2.2, 3.2, 0.35, ctx.surfaces.darkWood, { y: 1.6, z: 3.2 });
  ctx.box(3.2, 0.25, 17, ctx.surfaces.flagstone, { y: 0.03, z: 11.5 });
  // Keep the fort solid while leaving a real opening in front of the door.
  // A single collision rectangle here used to cover the entrance itself.
  ctx.collision(-8, -1.25, -11, 2.5);
  ctx.collision(1.25, 8, -11, 2.5);
  ctx.light(0x9dc1ca, 7, 13, { x: 0, y: 7, z: 1 });
  ctx.inspect("fort-tide-line", "Read the tide marks", { x: 7.9, z: 0 }, "Three bands of salt record how quickly the causeway disappears under a storm tide.");
  addExteriorWeather(ctx, 0xa8c7ce);
  return { spawn: [{ x: 0, z: 20 }], door: { x: 0, z: 3.75 }, bounds: { minX: -20, maxX: 20, minZ: -15, maxZ: 23 }, label: "Tidal causeway · Exterior", message: "Saint Vigga rises from the surf like a dark gun emplacement. The causeway shines under rain." };
}

function fortInterior(ctx) {
  openInterior(ctx, "flagstone", "stone", 20, 22);
  const iron = material(0x292d2d, { metalness: 0.78, roughness: 0.42 });
  ctx.cylinder(2.5, 3.2, 4.2, 24, iron, { x: -1.5, y: 5, z: -4, rz: Math.PI / 2 });
  ctx.box(7.8, 0.48, 0.5, iron, { x: -1.5, y: 6.5, z: -4 });
  for (let index = 0; index < 5; index += 1) ctx.cylinder(0.12, 0.12, 2.4, 10, iron, { x: 6.4, y: 0.9 + index * 0.42, z: -7.5, rz: Math.PI / 2 });
  ctx.light(0x90b8c3, 8, 10, { x: -1, y: 6, z: -1 }, true);
  ctx.inspect("fort-bell", "Examine the storm bell", { x: -1.5, z: -1.5 }, "The bell lip carries a clean contact line beneath older salt bloom. Its mechanism moved recently.");
  ctx.collectible({ id: "clock_escapement_key", title: "Clock escapement key", type: "Collected object", description: "A modified clock key with stop marks matching the Saint Vigga mechanism.", foundAtLocationId: "saint_vigga_fort", image: "/assets/season_2/items/clock_escapement_key.png", color: 0x9f8658 }, { x: 6, z: -5.5 }, "metal");
  return interiorResult("Bell chamber · Interior", "The vast storm bell absorbs the room's cold light. Clockwork ticks somewhere behind the granite.");
}

function laboratoryExterior(ctx) {
  ground(ctx, "grass", 42);
  pitchedBuilding(ctx, { width: 13, depth: 11, height: 4.2, z: -2, walls: ctx.surfaces.paleStone, roof: ctx.surfaces.slate });
  const steel = material(0x82989b, { metalness: 0.62, roughness: 0.38 });
  for (const x of [-7, -4.8, 6.5]) {
    ctx.cylinder(0.1, 0.16, 4.2, 10, steel, { x, y: 2.1, z: 4 });
    ctx.cylinder(0.65, 0.65, 0.08, 18, steel, { x, y: 4.2, z: 4 });
  }
  ctx.light(0xc9e2df, 5, 10, { x: 0, y: 4, z: 4 });
  ctx.inspect("lab-gauge", "Read the rain gauge", { x: -7, z: 4 }, "The gauge records a sharp freshwater pulse before the body was found at Saint Vigga.");
  addExteriorWeather(ctx);
  return { spawn: [{ x: 0, z: 15 }], door: { x: 0, z: 3.65 }, bounds: { minX: -18, maxX: 18, minZ: -13, maxZ: 19 }, label: "North channel headland · Exterior", message: "White walls and instrument masts emerge from sea fog above the north channel." };
}

function laboratoryInterior(ctx) {
  openInterior(ctx, "wood", "paleStone");
  workTable(ctx, -3.6, 1, 4.8);
  workTable(ctx, 3.6, -3.2, 4.4);
  cabinet(ctx, -7.7, -6.7, 2.8);
  const brass = material(0x987945, { metalness: 0.68, roughness: 0.34 });
  ctx.cylinder(1.4, 1.4, 0.3, 28, brass, { x: 4.8, y: 2.5, z: -10.4, rz: Math.PI / 2 });
  ctx.cylinder(0.07, 0.07, 1.1, 8, material(0x1a1c1d), { x: 4.8, y: 2.5, z: -10.05, rz: 0.7 });
  ctx.light(0xb8dce1, 8, 9, { x: 3, y: 4, z: -4 }, true);
  ctx.inspect("lab-tide-clock", "Read the antique tide clock", { x: 4.8, z: -8.7 }, "Its handwritten correction table disagrees with the automated Tidegate archive by eleven minutes.");
  ctx.collectible({ id: "laboratory-salinity-slide", title: "Salinity comparison slide", type: "Collected object", description: "A prepared glass slide preserving the mineral profile used to distinguish rainwater from seawater.", foundAtLocationId: "marine_laboratory", image: "/assets/season_2/locations/marine_laboratory_interior.png", color: 0x8bb9c0 }, { x: -3.3, z: 1 });
  return interiorResult("Hydrographic chart room · Interior", "Instruments, specimen cabinets, and tide charts crowd the laboratory's pale room.");
}

function glassworksExterior(ctx) {
  ground(ctx, "flagstone", 44);
  pitchedBuilding(ctx, { width: 14, depth: 12, height: 5, z: -2, walls: ctx.surfaces.stone, roof: ctx.surfaces.slate });
  ctx.cylinder(1.1, 1.45, 10, 18, ctx.surfaces.stone, { x: 7, y: 5, z: -6 });
  const canal = mesh(new THREE.PlaneGeometry(12, 44), material(0x12303b, { metalness: 0.24, roughness: 0.28 }), { x: -13, y: -0.08, rx: -Math.PI / 2 });
  ctx.add(canal);
  ctx.light(0xff7d36, 9, 11, { x: 2, y: 3, z: 3 });
  ctx.inspect("glassworks-canal", "Look into the canal", { x: -7.5, z: 2 }, "Blue cullet glints beneath black canal water beside the old factory wall.");
  addExteriorWeather(ctx);
  return { spawn: [{ x: 1, z: 16 }], door: { x: 1, z: 4 }, bounds: { minX: -7.8, maxX: 19, minZ: -15, maxZ: 20 }, label: "Factory canal · Exterior", message: "The converted factory glows cobalt and furnace-orange beside the rain-black canal." };
}

function glassworksInterior(ctx) {
  openInterior(ctx, "flagstone", "stone", 20, 23);
  const furnace = material(0x5b3324, { roughness: 0.8 });
  ctx.box(5.2, 4.4, 3.2, furnace, { x: 4.8, y: 2.2, z: -7.8 });
  ctx.box(2.1, 1.7, 0.12, material(0xff7b2d, { emissive: 0xff521c, emissiveIntensity: 4 }), { x: 4.8, y: 1.7, z: -6.15 });
  for (const x of [-5.8, -2.6, 0.6]) {
    ctx.cylinder(0.55, 0.55, 2.5, 18, material(0x406b79, { transparent: true, opacity: 0.72, emissive: 0x173e52, emissiveIntensity: 0.8 }), { x, y: 1.25, z: -7.8 });
  }
  workTable(ctx, -2.5, 1.5, 5.5);
  ctx.light(0xff7c32, 28, 13, { x: 4.5, y: 3, z: -5 }, true);
  ctx.light(0x4a88aa, 6, 8, { x: -4, y: 3, z: -6 });
  ctx.inspect("museum-catalog", "Read the acquisition labels", { x: -5, z: -6.2 }, "Several cobalt pieces have labels printed on stock newer than their claimed acquisition dates.");
  ctx.collectible({ id: "blue_cullet_fragment", title: "Blue cullet fragment", type: "Collected object", description: "A sharp cobalt reject fragment whose fracture surface is fresh beneath an artificially aged crust.", foundAtLocationId: "glassworks_museum", image: "/assets/season_2/items/blue_cullet_fragment.png", color: 0x276e9b }, { x: -1.8, z: 1.5 });
  return interiorResult("Cobalt gallery & furnace hall · Interior", "Furnace light moves through blue glass, throwing hard aquatic shadows across the old factory floor.");
}

function hotelExterior(ctx) {
  ground(ctx, "flagstone", 42);
  pitchedBuilding(ctx, { width: 14, depth: 11, height: 5.6, z: -2, walls: ctx.surfaces.paleStone, roof: ctx.surfaces.slate });
  for (const x of [-4.5, -1.5, 1.5, 4.5]) ctx.box(1.2, 2.1, 0.14, material(0xb8c8c1, { emissive: 0x4f553f, emissiveIntensity: 0.8 }), { x, y: 3.5, z: 3.58 });
  ctx.box(5.5, 0.3, 2.5, ctx.surfaces.slate, { y: 3.4, z: 4.8 });
  ctx.light(0xffc77b, 8, 10, { x: 0, y: 3, z: 5 });
  ctx.inspect("hotel-awning", "Inspect the service entrance", { x: 6.2, z: 4.5 }, "A trolley wheel has bruised the service-door jamb beneath a recent coat of paint.");
  addExteriorWeather(ctx);
  return { spawn: [{ x: 0, z: 15 }], door: { x: 0, z: 3.65 }, bounds: { minX: -18, maxX: 18, minZ: -13, maxZ: 19 }, label: "Inner harbor · Exterior", message: "Gull House offers amber windows and polished shelter against the harbor storm." };
}

function hotelInterior(ctx) {
  openInterior(ctx, "wood", "paleStone", 20, 22);
  const velvet = material(0x632f3b, { roughness: 0.92 });
  for (const x of [-5.5, 0, 5.5]) {
    ctx.box(3.3, 0.75, 1.1, velvet, { x, y: 0.72, z: -5.8 });
    ctx.box(3.3, 1.15, 0.3, velvet, { x, y: 1.4, z: -6.2 });
    ctx.collision(x - 1.9, x + 1.9, -6.6, -5.1);
  }
  workTable(ctx, -4.5, 1.5, 2.6);
  cabinet(ctx, 8.4, -7.4, 3.1);
  for (const x of [-5, 0, 5]) ctx.light(0xffbd70, 7, 6, { x, y: 3.2, z: -4 }, true);
  ctx.inspect("hotel-corridor", "Examine the corridor wall", { x: 7.5, z: -3.5 }, "A low crescent scrape carries gray trolley paint and a dusting of crushed pharmaceutical foil.");
  ctx.collectible({ id: "crushed_ampoule_seal", title: "Crushed ampoule seal", type: "Collected object", description: "A flattened medicine seal recovered beside the private dining service corridor.", foundAtLocationId: "gull_house_hotel", image: "/assets/season_2/items/crushed_ampoule_seal.png", color: 0xc7b69a }, { x: 6.8, z: -3.2 }, "metal");
  return interiorResult("Lobby & dining corridor · Interior", "Polished wood, shaded lamps, and closed dining-room doors soften the storm into discreet hotel silence.");
}

function ferryExterior(ctx) {
  ground(ctx, "flagstone", 48);
  const concrete = ctx.surfaces.stone;
  ctx.box(15, 4.8, 9, concrete, { y: 2.4, z: -5 });
  ctx.box(7, 4.2, 5.5, material(0x58757d, { metalness: 0.22, roughness: 0.5 }), { x: 3, y: 6.2, z: -6 });
  ctx.box(2.2, 3.2, 0.28, ctx.surfaces.darkWood, { y: 1.6, z: -0.35 });
  ctx.collision(-7.9, 7.9, -9.8, -0.8);
  for (const x of [-8, 0, 8]) {
    ctx.cylinder(0.13, 0.2, 8, 10, material(0x3c484b, { metalness: 0.72 }), { x, y: 4, z: 6 });
    ctx.light(0xdce9dc, 11, 13, { x, y: 7.6, z: 6 }, true);
  }
  ctx.box(5.5, 0.25, 20, material(0x3f4f53, { metalness: 0.48 }), { x: -8, y: 0.06, z: 9 });
  ctx.inspect("ferry-ramp", "Inspect the vehicle ramp", { x: -8, z: 4 }, "Fresh tire water cuts through older salt grime toward the maintenance lane.");
  addExteriorWeather(ctx);
  return { spawn: [{ x: 1, z: 20 }], door: { x: 0, z: -0.2 }, bounds: { minX: -19, maxX: 19, minZ: -15, maxZ: 23 }, label: "Passenger quay · Exterior", message: "Floodlights burn through horizontal rain above the ramps and maintenance lanes." };
}

function ferryInterior(ctx) {
  openInterior(ctx, "flagstone", "stone", 21, 23);
  consoleBank(ctx, -4.8, -7.8, 6.2);
  consoleBank(ctx, 3.3, -4.2, 5.4);
  workTable(ctx, -3.5, 2.5, 4.2);
  cabinet(ctx, 8.6, -8, 2.8);
  ctx.box(8, 2.5, 0.08, material(0x9db6ba, { emissive: 0x243b42, emissiveIntensity: 0.65 }), { x: 1, y: 3.3, z: -11.2 });
  ctx.light(0xc5e0df, 10, 11, { x: 0, y: 4.6, z: -4 }, true);
  ctx.inspect("ferry-cameras", "Check the camera matrix", { x: -4.8, z: -6.5 }, "Channels two and four show a synchronized seven-minute isolation in the access log.");
  ctx.collectible({ id: "contractor_card_l4", title: "Contractor access card L4", type: "Collected object", description: "A ferry-company contractor card with level-four service access and abrasion around its magnetic stripe.", foundAtLocationId: "ferry_terminal", image: "/assets/season_2/items/contractor_card_l4.png", color: 0xd7b55e }, { x: -2.7, z: 2.5 });
  return interiorResult("Dispatch room · Interior", "Green monitor light washes across dispatch consoles, vehicle boards, and rain-striped harbor glass.");
}

function clinicExterior(ctx) {
  ground(ctx, "flagstone", 40);
  pitchedBuilding(ctx, { width: 12, depth: 10, height: 4.4, z: -2, walls: ctx.surfaces.stone, roof: ctx.surfaces.slate });
  ctx.box(1.8, 1.8, 0.15, material(0xe5ddd0), { x: 4.5, y: 3.2, z: 3.08 });
  ctx.box(0.35, 1.3, 0.18, material(0x9e3e42), { x: 4.5, y: 3.2, z: 3.2 });
  ctx.box(1.3, 0.35, 0.18, material(0x9e3e42), { x: 4.5, y: 3.2, z: 3.2 });
  ctx.light(0xd7e1cf, 6, 9, { x: 0, y: 3.2, z: 3.6 });
  ctx.inspect("clinic-bin", "Inspect the clinical waste hatch", { x: 6.5, z: -1 }, "The locked hatch smells of antiseptic. One collection label has been replaced out of sequence.");
  addExteriorWeather(ctx);
  return { spawn: [{ x: 0, z: 14 }], door: { x: 0, z: 3.15 }, bounds: { minX: -17, maxX: 17, minZ: -12, maxZ: 18 }, label: "Harbor road · Exterior", message: "The compact brick clinic keeps a hard white light against the wet harbor road." };
}

function clinicInterior(ctx) {
  openInterior(ctx, "flagstone", "paleStone");
  for (const x of [-6, -3.4, -0.8]) cabinet(ctx, x, -9.8, 2.1, 3.6);
  workTable(ctx, 3.5, -3, 4.4);
  const white = material(0xd7ddd8, { metalness: 0.15, roughness: 0.45 });
  ctx.box(4.8, 1.05, 1, white, { x: 4.3, y: 0.53, z: 2.8 });
  for (const x of [-5, 0, 5]) ctx.light(0xe9f1e7, 9, 7, { x, y: 4.5, z: -3 }, true);
  ctx.inspect("clinic-register", "Check the medicine register", { x: -3.5, z: -8.4 }, "Pressure marks remain where a false entry was written on the sheet above this one.");
  ctx.collectible({ id: "clinic-batch-label", title: "Removed batch label", type: "Collected object", description: "A peeled sedative batch label carrying adhesive fibres from the clinic's controlled-drug ledger.", foundAtLocationId: "saltline_clinic", image: "/assets/season_2/locations/saltline_clinic_interior.png", color: 0xe7dfc7 }, { x: 3.1, z: -3 });
  return interiorResult("Dispensary & records counter · Interior", "Clinical white light reveals ordered bottles, locked drawers, and a ledger open behind the dispensary counter.");
}

function tidegateExterior(ctx) {
  ground(ctx, "grass", 48);
  const concrete = ctx.surfaces.stone;
  ctx.box(17, 5.4, 10, concrete, { y: 2.7, z: -5 });
  ctx.box(2.2, 3.2, 0.3, ctx.surfaces.darkWood, { y: 1.6, z: 0.15 });
  ctx.collision(-8.9, 8.9, -10.4, -0.25);
  for (const x of [-7, 0, 7]) {
    ctx.box(3.4, 4.5, 0.5, material(0x47595c, { metalness: 0.72, roughness: 0.5 }), { x, y: 1.8, z: -10 });
    ctx.cylinder(0.2, 0.2, 7, 12, material(0x5b6869, { metalness: 0.62 }), { x, y: 4.8, z: -8, rz: Math.PI / 2 });
  }
  ctx.light(0x9fc7c9, 9, 12, { x: 0, y: 6, z: 2 });
  ctx.inspect("tidegate-grate", "Examine the storm grate", { x: 7.5, z: 0.8 }, "A strand of orange lifting webbing is caught deep in the galvanized teeth.");
  addExteriorWeather(ctx);
  return { spawn: [{ x: 0, z: 19 }], door: { x: 0, z: 0.4 }, bounds: { minX: -20, maxX: 20, minZ: -16, maxZ: 23 }, label: "Eastern sea wall · Exterior", message: "Concrete gates crouch where the marsh meets the sea wall. Pumps throb beneath the rain." };
}

function tidegateInterior(ctx) {
  openInterior(ctx, "flagstone", "stone", 22, 24);
  const steel = material(0x405257, { metalness: 0.68, roughness: 0.48 });
  for (const x of [-6, 0, 6]) {
    ctx.cylinder(1.4, 1.4, 3.8, 20, steel, { x, y: 1.9, z: -6 });
    ctx.cylinder(0.32, 0.32, 7, 14, steel, { x, y: 4.2, z: -5, rz: Math.PI / 2 });
    ctx.collision(x - 1.7, x + 1.7, -7.7, -4.3);
  }
  const cistern = mesh(new THREE.CircleGeometry(3.1, 30), material(0x16343b, { metalness: 0.2, roughness: 0.28 }), { x: 5.8, y: 0.03, z: 3.5, rx: -Math.PI / 2 });
  ctx.add(cistern);
  ctx.collision(2.5, 9, 0.2, 6.8);
  ctx.light(0x8fc4ca, 11, 12, { x: 1, y: 5, z: -2 }, true);
  ctx.inspect("tidegate-cistern", "Test the settling cistern", { x: 2, z: 3.5 }, "The still water carries iron and concrete minerals but almost no salt.");
  ctx.collectible({ id: "tidegate_water_vial", title: "Tidegate water vial", type: "Collected object", description: "A sealed freshwater sample taken from the Tidegate settling cistern.", foundAtLocationId: "tidegate_station", image: "/assets/season_2/items/tidegate_water_vial.png", color: 0x75bdc4 }, { x: -7.5, z: 1.5 }, "vial");
  return interiorResult("Pump hall & cisterns · Interior", "Blue work lights and flashlight beams rake across vast pumps, pipes, and a still concrete cistern.");
}

function salvageExterior(ctx) {
  ground(ctx, "flagstone", 48);
  pitchedBuilding(ctx, { width: 12, depth: 10, height: 4.5, x: 5, z: -5, walls: ctx.surfaces.stone, roof: ctx.surfaces.slate, door: -3 });
  const iron = material(0x4a3f37, { metalness: 0.7, roughness: 0.58 });
  ctx.cylinder(0.3, 0.55, 10, 12, iron, { x: -8, y: 5, z: -5 });
  ctx.box(9, 0.35, 0.35, iron, { x: -4, y: 9.2, z: -5, rz: -0.35 });
  ctx.cylinder(0.1, 0.1, 7, 8, iron, { x: 0, y: 5.8, z: -5, rz: 0.1 });
  ctx.box(9, 1.8, 3.5, material(0x293b3e, { metalness: 0.5, roughness: 0.7 }), { x: -6, y: 0.9, z: 4 });
  ctx.light(0xffb562, 8, 11, { x: 2, y: 5, z: 1 });
  ctx.inspect("salvage-hull", "Inspect the stripped hull", { x: -6, z: 6.5 }, "A fresh orange sling mark crosses the hull's old black paint above the waterline.");
  addExteriorWeather(ctx);
  return { spawn: [{ x: 3, z: 18 }], door: { x: 2, z: 0.15 }, bounds: { minX: -20, maxX: 20, minZ: -15, maxZ: 22 }, label: "Industrial inlet · Salvage yard", message: "A crane, stripped hull, and low workshop crowd the black inlet under sodium work lamps." };
}

function salvageInterior(ctx) {
  openInterior(ctx, "flagstone", "stone", 22, 23);
  const steel = material(0x4b5554, { metalness: 0.72, roughness: 0.55 });
  workTable(ctx, -3.5, 1.5, 6);
  consoleBank(ctx, 5.8, -8, 4.2);
  for (const x of [-6, -3, 0, 3, 6]) ctx.cylinder(0.45, 0.45, 1.2, 18, steel, { x, y: 0.6, z: -6 });
  ctx.box(9, 0.25, 0.25, steel, { x: 0, y: 5.2, z: -2 });
  ctx.light(0xffad58, 13, 10, { x: -3, y: 4.5, z: 0 }, true);
  ctx.inspect("salvage-winch", "Examine the winch drum", { x: 2, z: -5 }, "Fibres embedded in the grease are the same vivid safety orange used on marine lifting slings.");
  ctx.collectible({ id: "orange_sling_fragment", title: "Orange sling fragment", type: "Collected object", description: "A torn high-load sling fragment carrying black hull paint and Tidegate grit.", foundAtLocationId: "moller_salvage", image: "/assets/season_2/items/orange_sling_fragment.png", color: 0xd9752d }, { x: -2.8, z: 1.5 });
  return interiorResult("Winch workshop · Interior", "Sodium lamps reveal cable drums, diving gear, and a long scarred workbench inside the salvage workshop.");
}

function northLightExterior(ctx) {
  ground(ctx, "grass", 46);
  ctx.cylinder(3.2, 4.2, 10, 28, ctx.surfaces.paleStone, { y: 5, z: -5 });
  ctx.cylinder(3.7, 3.7, 0.55, 28, material(0x405358, { metalness: 0.6 }), { y: 10.1, z: -5 });
  ctx.cylinder(2.5, 2.5, 2, 24, material(0x9bb7b8, { transparent: true, opacity: 0.5, emissive: 0x426c71, emissiveIntensity: 0.7 }), { y: 11.3, z: -5 });
  ctx.box(1.7, 3.1, 0.25, ctx.surfaces.darkWood, { y: 1.55, z: -0.78 });
  const steel = material(0x68797a, { metalness: 0.7 });
  for (const x of [-8, -5, 6, 9]) {
    ctx.cylinder(0.1, 0.15, 3.5, 10, steel, { x, y: 1.75, z: 3 });
    ctx.box(1.2, 0.08, 0.08, steel, { x, y: 3.5, z: 3 });
  }
  ctx.light(0xd6eeee, 12, 16, { x: 0, y: 11, z: -1 }, true);
  ctx.inspect("weather-array", "Inspect the weather array", { x: -6, z: 3 }, "One anemometer stalled during the fatal interval, but its redundant pressure drum kept tracing.");
  addExteriorWeather(ctx, 0xc0d4d8);
  return { spawn: [{ x: 0, z: 18 }], door: { x: 0, z: -0.5 }, bounds: { minX: -20, maxX: 20, minZ: -16, maxZ: 22 }, label: "Northern point · Exterior", message: "The low lighthouse leans into the gale while weather instruments chatter in its fenced garden." };
}

function northLightInterior(ctx) {
  openInterior(ctx, "flagstone", "paleStone", 18, 22);
  consoleBank(ctx, -4.5, -7.8, 5.2);
  workTable(ctx, 3.5, -3.5, 4.4);
  const lens = material(0xb7e1e3, { transparent: true, opacity: 0.55, emissive: 0x639da5, emissiveIntensity: 1.2 });
  ctx.cylinder(1.3, 1.3, 2.4, 20, lens, { x: 5.5, y: 2, z: -8 });
  ctx.light(0xc8f0ed, 14, 13, { x: 4.5, y: 4.5, z: -5 }, true);
  ctx.inspect("pressure-drum", "Read the pressure drum", { x: -4.5, z: -6.5 }, "The ink trace records a squall boundary that fixes the rain pulse to a narrow time window.");
  ctx.collectible({ id: "north-light-chart-strip", title: "Pressure-drum chart strip", type: "Collected object", description: "A timestamped meteorological chart showing the evening squall and freshwater rainfall peak.", foundAtLocationId: "north_light", image: "/assets/season_2/locations/north_light_interior.png", color: 0xd8d0b5 }, { x: 3.2, z: -3.5 });
  return interiorResult("Weather room · Interior", "A rotating lens sweeps pale light over pressure drums, radios, and handwritten storm observations.");
}

function raskExterior(ctx) {
  ground(ctx, "grass", 46);
  const concrete = ctx.surfaces.paleStone;
  ctx.box(16, 4.8, 10, concrete, { y: 2.4, z: -5 });
  ctx.box(10, 1.8, 3.2, material(0x719094, { transparent: true, opacity: 0.52, emissive: 0x263b3d, emissiveIntensity: 0.45 }), { x: 2, y: 3, z: 0.1 });
  ctx.box(17, 0.48, 11, ctx.surfaces.slate, { y: 5, z: -5 });
  ctx.box(2.2, 3.2, 0.28, ctx.surfaces.darkWood, { x: -5, y: 1.6, z: 0.15 });
  ctx.collision(-8.4, 8.4, -10.4, -0.25);
  ctx.light(0xe2d3ad, 7, 10, { x: -5, y: 3.2, z: 1 });
  ctx.inspect("rask-terrace", "Examine the private quay view", { x: 8, z: 5 }, "The south-channel sightline includes the ferry service lane and the sheltered approach to Tidegate.");
  addExteriorWeather(ctx);
  return { spawn: [{ x: -4, z: 18 }], door: { x: -5, z: 0.4 }, bounds: { minX: -20, maxX: 20, minZ: -15, maxZ: 22 }, label: "South channel cliff · Exterior", message: "The severe modernist house presents glass and pale concrete to the dark channel below." };
}

function raskInterior(ctx) {
  openInterior(ctx, "wood", "paleStone", 22, 23);
  workTable(ctx, 2.5, -3, 5.8);
  cabinet(ctx, -8.7, -7.5, 3.1);
  ctx.box(9, 3.8, 0.12, material(0x547177, { transparent: true, opacity: 0.48, emissive: 0x20363a, emissiveIntensity: 0.5 }), { x: 4.5, y: 2.2, z: -11.15 });
  for (const x of [-5, 1, 7]) ctx.light(0xe7d4aa, 7, 7, { x, y: 3.8, z: -1 }, true);
  ctx.inspect("rask-ledger", "Examine the household ledger", { x: 2.5, z: -3 }, "Three structured withdrawals are disguised among legitimate repair payments.");
  ctx.collectible({ id: "rask-withdrawal-slip", title: "Structured withdrawal slip", type: "Collected object", description: "A bank counterfoil grouping three cash withdrawals beneath misleading repair references.", foundAtLocationId: "rask_house", image: "/assets/season_2/locations/rask_house_interior.png", color: 0xcbbf9e }, { x: 3.3, z: -3 });
  return interiorResult("Private chart office · Interior", "Warm architectural lamps fall across precise models, channel charts, and a desk arranged with severe care.");
}

function interiorResult(label, message) {
  return { spawn: [{ x: 0, z: 9 }], door: { x: 0, z: 9.7 }, bounds: { minX: -8.1, maxX: 8.8, minZ: -10.5, maxZ: 10.2 }, label, message };
}

const LOCATIONS = {
  signal_house: { exterior: signalHouseExterior, interior: signalHouseInterior },
  saint_vigga_fort: { exterior: fortExterior, interior: fortInterior },
  marine_laboratory: { exterior: laboratoryExterior, interior: laboratoryInterior },
  glassworks_museum: { exterior: glassworksExterior, interior: glassworksInterior },
  gull_house_hotel: { exterior: hotelExterior, interior: hotelInterior },
  ferry_terminal: { exterior: ferryExterior, interior: ferryInterior },
  saltline_clinic: { exterior: clinicExterior, interior: clinicInterior },
  tidegate_station: { exterior: tidegateExterior, interior: tidegateInterior },
  moller_salvage: { exterior: salvageExterior, interior: salvageInterior },
  north_light: { exterior: northLightExterior, interior: northLightInterior },
  rask_house: { exterior: raskExterior, interior: raskInterior }
};

export function createVesperholmLocationScene(locationId, options) {
  const spec = LOCATIONS[locationId];
  if (!spec) throw new Error(`No 3D scene is authored for ${locationId}.`);
  const { container, investigators, people, discoveredFindingIds = [], onAreaChange, onPrompt, onMessage, onFinding, onTalk, onActiveChange, onTransition } = options;
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.98;
  renderer.domElement.tabIndex = 0;
  container.replaceChildren(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b171b);
  scene.fog = new THREE.FogExp2(0x14272c, 0.016);
  const camera = new THREE.OrthographicCamera(-10, 10, 7, -7, 0.1, 120);
  const cameraOffset = new THREE.Vector3(17, 18, 19);
  const cameraLook = new THREE.Vector3();
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const clock = new THREE.Clock();
  const keys = new Set();
  const collected = new Set(discoveredFindingIds);
  const figures = new Map();
  const savedPositions = { exterior: {}, interior: {} };
  const surfaceLibrary = createSurfaceMaterials(renderer);
  let world = null;
  let ctx = null;
  let area = "exterior";
  let activeInvestigatorId = investigators[0]?.id ?? null;
  let moveTarget = null;
  let nearestInteraction = null;
  let animationFrame = null;
  let transitionTimer = null;
  let paused = false;
  let transitioning = false;

  function disposeWorld() {
    if (!world) return;
    scene.remove(world);
    world.traverse((child) => {
      child.geometry?.dispose?.();
      if (Array.isArray(child.material)) child.material.forEach((entry) => {
        if (!entry.userData?.sharedSurface) entry.dispose?.();
      });
      else if (!child.material?.userData?.sharedSurface) child.material?.dispose?.();
    });
    figures.clear();
    moveTarget = null;
    nearestInteraction = null;
  }

  function addFlashlight(figure) {
    const beam = new THREE.SpotLight(0xeaf3df, 62, 12, 0.5, 0.62, 1.35);
    beam.position.set(0.55, 0.92, 0.48);
    beam.castShadow = true;
    beam.shadow.mapSize.set(512, 512);
    const target = new THREE.Object3D();
    target.position.set(0.55, 0.12, 7);
    figure.add(beam, target);
    beam.target = target;
  }

  function updateActiveMarker() {
    figures.forEach((figure, id) => {
      let marker = figure.getObjectByName("active-marker");
      if (!marker) {
        marker = ring(investigators.find((entry) => entry.id === id)?.color);
        marker.name = "active-marker";
        marker.position.y = 0.01;
        figure.add(marker);
      }
      marker.visible = id === activeInvestigatorId;
    });
  }

  function addFigures(spawns) {
    investigators.forEach((investigator, index) => {
      const figure = createInvestigatorModel(investigator);
      const saved = savedPositions[area][investigator.id];
      const spawn = saved ?? spawns[index] ?? spawns[0];
      figure.position.set(spawn.x + index * 0.7, 0, spawn.z + index * 0.42);
      figure.rotation.y = Math.PI;
      addFlashlight(figure);
      world.add(figure);
      figures.set(investigator.id, figure);
    });
    updateActiveMarker();
  }

  function addNpcs() {
    const anchors = [{ x: 5.8, z: -5.7 }, { x: 4, z: 2.8 }, { x: -5.5, z: -4 }];
    people.forEach((person, index) => {
      const anchor = anchors[index] ?? { x: 4 + index, z: -5 + index };
      const npc = createNpcModel(person);
      npc.position.set(anchor.x, 0, anchor.z);
      npc.rotation.y = -Math.PI * 0.72;
      world.add(npc);
      ctx.interaction({ id: `npc-${person.id}`, kind: "Talk", label: person.name, color: 0x8eb1b5, position: new THREE.Vector3(anchor.x, 0, anchor.z), action: () => onTalk?.(activeInvestigatorId, person.id) });
    });
  }

  function build(nextArea) {
    area = nextArea;
    world = new THREE.Group();
    scene.add(world);
    const ambient = nextArea === "exterior" ? 0x91afb5 : 0x8ca1a0;
    world.add(new THREE.HemisphereLight(ambient, nextArea === "exterior" ? 0x17231f : 0x30271f, nextArea === "exterior" ? 0.62 : 0.42));
    world.add(new THREE.AmbientLight(0x67787a, nextArea === "exterior" ? 0.12 : 0.1));
    const key = new THREE.DirectionalLight(nextArea === "exterior" ? 0xb9d1d4 : 0xc8d4ce, nextArea === "exterior" ? 0.8 : 0.48);
    key.position.set(-10, 18, 9);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    world.add(key);
    ctx = createContext(world, surfaceLibrary.materials, {
      message: (message) => onMessage?.(message),
      finding: (finding) => onFinding?.(finding, activeInvestigatorId),
      isCollected: (id) => collected.has(id),
      markCollected: (id) => collected.add(id)
    });
    const result = spec[nextArea](ctx);
    addFigures(result.spawn);
    if (nextArea === "interior") addNpcs();
    ctx.interaction({
      id: `${locationId}-${nextArea}-door`,
      kind: "Door",
      label: nextArea === "exterior" ? "Enter the building" : "Return outside",
      position: new THREE.Vector3(result.door.x, 0, result.door.z),
      action: () => transition(nextArea === "exterior" ? "interior" : "exterior")
    });
    ctx.bounds = result.bounds;
    onAreaChange?.(result.label);
    onMessage?.(result.message);
    resize();
  }

  function savePositions() {
    figures.forEach((figure, id) => {
      savedPositions[area][id] = { x: figure.position.x, z: figure.position.z };
    });
  }

  function transition(nextArea) {
    if (transitioning || nextArea === area) return;
    transitioning = true;
    paused = true;
    nearestInteraction = null;
    onPrompt?.(null);
    savePositions();
    onTransition?.(true, nextArea);
    transitionTimer = window.setTimeout(() => {
      disposeWorld();
      build(nextArea);
      const active = figures.get(activeInvestigatorId);
      if (active) cameraLook.copy(active.position);
      resize();
      transitionTimer = window.setTimeout(() => {
        transitionTimer = null;
        transitioning = false;
        paused = false;
        clock.getDelta();
        onTransition?.(false, nextArea);
        renderer.domElement.focus();
      }, 360);
    }, 320);
  }

  function collides(x, z) {
    if (x < ctx.bounds.minX || x > ctx.bounds.maxX || z < ctx.bounds.minZ || z > ctx.bounds.maxZ) return true;
    return ctx.collisions.some((obstacle) => x + PLAYER_RADIUS > obstacle.minX && x - PLAYER_RADIUS < obstacle.maxX && z + PLAYER_RADIUS > obstacle.minZ && z - PLAYER_RADIUS < obstacle.maxZ);
  }

  function tryMove(figure, dx, dz) {
    if (!collides(figure.position.x + dx, figure.position.z)) figure.position.x += dx;
    if (!collides(figure.position.x, figure.position.z + dz)) figure.position.z += dz;
  }

  function movementVector() {
    const movement = new THREE.Vector2();
    if (keys.has("ArrowUp")) movement.y -= 1;
    if (keys.has("ArrowDown")) movement.y += 1;
    if (keys.has("ArrowLeft")) movement.x -= 1;
    if (keys.has("ArrowRight")) movement.x += 1;
    return movement.lengthSq() ? movement.normalize() : movement;
  }

  function updateMovement(delta) {
    const figure = figures.get(activeInvestigatorId);
    if (!figure || paused) return;
    const movement = movementVector();
    if (movement.lengthSq()) moveTarget = null;
    else if (moveTarget) {
      movement.set(moveTarget.x - figure.position.x, moveTarget.z - figure.position.z);
      if (movement.length() < 0.15) {
        moveTarget = null;
        movement.set(0, 0);
      } else movement.normalize();
    }
    const moving = movement.lengthSq() > 0;
    if (moving) {
      tryMove(figure, movement.x * WALK_SPEED * delta, movement.y * WALK_SPEED * delta);
      figure.rotation.y = Math.atan2(movement.x, movement.y);
    }
    figures.forEach((entry, id) => animateCharacterModel(entry, id === activeInvestigatorId && moving, delta));
  }

  function updateInteractions(elapsed) {
    const figure = figures.get(activeInvestigatorId);
    nearestInteraction = null;
    let nearestDistance = Infinity;
    for (const interaction of ctx.interactions) {
      const available = interaction.available?.() ?? true;
      const distance = figure ? figure.position.distanceTo(interaction.position) : Infinity;
      interaction.ring.visible = available && distance <= interaction.radius + 1.2;
      if (interaction.ring.visible) {
        const pulse = 1 + Math.sin(elapsed * 3) * 0.06;
        interaction.ring.scale.setScalar(pulse);
      }
      if (available && distance <= interaction.radius && distance < nearestDistance) {
        nearestInteraction = interaction;
        nearestDistance = distance;
      }
    }
    onPrompt?.(nearestInteraction ? { kind: nearestInteraction.kind, label: nearestInteraction.label } : null);
  }

  function updateCamera(delta) {
    const figure = figures.get(activeInvestigatorId);
    if (!figure) return;
    const desiredLook = figure.position.clone().add(new THREE.Vector3(0, 1.2, 0));
    cameraLook.lerp(desiredLook, 1 - Math.exp(-delta * 5));
    camera.position.copy(cameraLook).add(cameraOffset);
    camera.lookAt(cameraLook);
  }

  function animate() {
    animationFrame = window.requestAnimationFrame(animate);
    const delta = Math.min(clock.getDelta(), 0.05);
    updateMovement(delta);
    ctx.animated.forEach((update) => update(delta, clock.elapsedTime));
    updateInteractions(clock.elapsedTime);
    updateCamera(delta);
    renderer.render(scene, camera);
  }

  function interact() {
    if (paused || transitioning || !nearestInteraction) return;
    const interaction = nearestInteraction;
    interaction.action();
  }

  function setActiveInvestigator(id) {
    if (!figures.has(id) || id === activeInvestigatorId) return;
    activeInvestigatorId = id;
    moveTarget = null;
    updateActiveMarker();
    onActiveChange?.(id);
    onMessage?.(`${investigators.find((entry) => entry.id === id)?.name ?? "The other investigator"} is now leading the search.`);
  }

  function onKeyDown(event) {
    if (paused || transitioning) return;
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) {
      event.preventDefault();
      keys.add(event.code);
    }
  }

  function onKeyUp(event) {
    keys.delete(event.code);
  }

  function onPointerDown(event) {
    if (paused || event.button !== 0 || !ctx.walkSurface) return;
    const bounds = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObject(ctx.walkSurface, false)[0];
    if (hit && !collides(hit.point.x, hit.point.z)) moveTarget = new THREE.Vector3(hit.point.x, 0, hit.point.z);
    renderer.domElement.focus();
  }

  function resize() {
    const width = Math.max(container.clientWidth, 1);
    const height = Math.max(container.clientHeight, 1);
    const aspect = width / height;
    const vertical = area === "interior" ? 12.2 : 14.8;
    camera.left = -(vertical * aspect) / 2;
    camera.right = (vertical * aspect) / 2;
    camera.top = vertical / 2;
    camera.bottom = -vertical / 2;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }

  build("exterior");
  const active = figures.get(activeInvestigatorId);
  if (active) cameraLook.copy(active.position);
  updateCamera(1);
  onActiveChange?.(activeInvestigatorId);
  window.addEventListener("resize", resize);
  window.addEventListener("keydown", onKeyDown, { passive: false });
  window.addEventListener("keyup", onKeyUp);
  renderer.domElement.addEventListener("pointerdown", onPointerDown);
  animate();
  renderer.domElement.focus();

  return {
    setActiveInvestigator,
    interact,
    pause() {
      paused = true;
      keys.clear();
    },
    resume() {
      if (transitioning) return;
      paused = false;
      clock.getDelta();
      renderer.domElement.focus();
    },
    destroy() {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      if (transitionTimer) window.clearTimeout(transitionTimer);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      disposeWorld();
      surfaceLibrary.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    }
  };
}
