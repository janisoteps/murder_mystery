import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";

const TEXTURE_ROOT = "/assets/season_2/textures";

function loadTexture(loader, filename, repeatX, repeatY, anisotropy) {
  const texture = loader.load(`${TEXTURE_ROOT}/${filename}`);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = anisotropy;
  return texture;
}

function makeMaterial(map, options = {}) {
  const result = new THREE.MeshStandardMaterial({
    map,
    color: options.color ?? 0xffffff,
    roughness: options.roughness ?? 0.9,
    metalness: options.metalness ?? 0.02
  });
  result.userData.sharedSurface = true;
  return result;
}

export function createSurfaceMaterials(renderer) {
  const loader = new THREE.TextureLoader();
  const anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
  const textures = {
    grass: loadTexture(loader, "coastal_grass_tile.svg.png", 7, 7, anisotropy),
    stone: loadTexture(loader, "granite_masonry_tile.svg.png", 2.5, 3, anisotropy),
    paleStone: loadTexture(loader, "granite_masonry_tile.svg.png", 2, 3, anisotropy),
    wood: loadTexture(loader, "aged_oak_tile.svg.png", 2.5, 2, anisotropy),
    darkWood: loadTexture(loader, "aged_oak_tile.svg.png", 2.5, 2, anisotropy),
    slate: loadTexture(loader, "roof_slate_tile.svg.png", 4, 5, anisotropy),
    flagstone: loadTexture(loader, "chapel_flagstone_tile.svg.png", 4, 6, anisotropy),
    paper: loadTexture(loader, "archival_paper_tile.svg.png", 1.5, 1.5, anisotropy)
  };

  const materials = {
    grass: makeMaterial(textures.grass, { color: 0x82927e, roughness: 1 }),
    stone: makeMaterial(textures.stone, { color: 0xa6ada7, roughness: 0.98 }),
    paleStone: makeMaterial(textures.paleStone, { color: 0xc2c0b5, roughness: 0.96 }),
    wood: makeMaterial(textures.wood, { color: 0xa87f60, roughness: 0.78 }),
    darkWood: makeMaterial(textures.darkWood, { color: 0x675349, roughness: 0.83 }),
    slate: makeMaterial(textures.slate, { color: 0x9ba6aa, roughness: 0.74, metalness: 0.05 }),
    flagstone: makeMaterial(textures.flagstone, { color: 0xa4a29b, roughness: 0.95 }),
    paper: makeMaterial(textures.paper, { color: 0xc8baa1, roughness: 1 })
  };

  return {
    materials,
    dispose() {
      Object.values(materials).forEach((entry) => entry.dispose());
      Object.values(textures).forEach((entry) => entry.dispose());
    }
  };
}
