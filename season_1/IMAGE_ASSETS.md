# Season 1 image assets

All raster assets were generated with the built-in image-generation tool, visually inspected, and copied into the project. Evidence objects have both generated PNG photographs and deterministic SVG fallbacks.

## Budget order used

1. One exterior for each of ten locations.
2. Portraits for both investigators, the victim, and all ten interactive NPCs.
3. One interior for each location only after every required image above was complete.
4. Generated evidence photographs were added after every location and character image was complete.

## Shared location prompt

- **Use case:** `stylized-concept`
- **Asset type:** Season 1 game location photograph/environment still
- **Setting:** fictional Hollowfield, Iowa, October 1996
- **Style:** cinematic photorealistic rural-gothic crime drama; grounded 35mm film texture
- **Composition:** wide landscape establishing view with spatially readable architecture
- **Materials:** specific weathered real-world surfaces appropriate to each location
- **Constraints:** historically plausible 1996; no visible people; no readable text, logos, or watermark; no supernatural elements; no body or gore

### Exterior variations

- `sheriff_coroner_annex.png` — wet brick civic annex and morgue wing, cold rainy night.
- `saint_orra_packing.png` — abandoned packing complex and freight rails, bruised storm dusk.
- `woh_radio.png` — ridge-top cinderblock station and transmitter, clear late-afternoon daylight.
- `blackwater_pump_house.png` — reservoir pump works and aeration basins, overcast noon daylight.
- `town_hall.png` — limestone civic hall with First Frost decorations, pale midday daylight.
- `mercy_diner.png` — stainless railcar diner at road-and-rail junction, copper sunset.
- `bell_farm.png` — red veterinary barn and working farm, crisp late-morning daylight.
- `saint_ledas_archive.png` — black-stone church on Founders' Hill, luminous daylight after rain.
- `northline_motel.png` — U-shaped motor lodge and empty pool, rose-violet dusk.
- `dredge_funeral_home.png` — black Victorian funeral parlor and hearse drive, overcast afternoon.

### Interior variations

- `sheriff_coroner_annex_interior.png` — squad room opening into morgue corridor.
- `saint_orra_packing_interior.png` — tiled kill floor, rails, hooks, and brine-room threshold.
- `woh_radio_interior.png` — analog control room with console, booth, records, and tape decks.
- `blackwater_pump_house_interior.png` — pumps, valve wheels, controls, and sluice stairs.
- `town_hall_interior.png` — mayor's office with wardrobe, records, seal press, and civic decor.
- `mercy_diner_interior.png` — counter and windows facing the junction at sunset.
- `bell_farm_interior.png` — veterinary treatment bay, crush gate, cabinets, and refrigerator.
- `saint_ledas_archive_interior.png` — basement labor archive with ledgers and reading lamps.
- `northline_motel_interior.png` — restrained room 8 at rose dusk.
- `dredge_funeral_home_interior.png` — consultation parlor opening into preparation room.

## Shared portrait prompt

- **Use case:** `stylized-concept`
- **Asset type:** Season 1 investigator, NPC, or victim-dossier portrait
- **Style:** cinematic photorealistic rural-gothic crime-drama character still; grounded 35mm texture; natural pores, wrinkles, hair, and fabric wear
- **Composition:** vertical chest-up portrait, eye-level, three-quarter gaze, face clearly readable in the dialogue modal
- **Lighting:** restrained practical light appropriate to the character's location
- **Constraints:** exactly one adult; historically plausible 1996 clothing and grooming; no text, logos, watermark, glamour retouching, gore, or supernatural elements; no cue implying guilt or innocence

Character-specific subject, wardrobe, and setting descriptions are locked in `gm/NPC_BIBLE.md`. Final files:

- Investigators: `nora_mercer.png`, `isaac_ward.png`. Both are white Northern European in appearance; Nora's corrected portrait has fair skin, gray-blue eyes, and collar-length dark ash-blonde hair.
- Victim dossier: `celia_wren.png`
- NPCs: `june_kessler.png`, `hollis_cade.png`, `miriam_vale.png`, `naomi_venn.png`, `gideon_rusk.png`, `vera_bell.png`, `amos_bell.png`, `rowan_pike.png`, `mae_orlov.png`, `silas_dredge.png`

## Evidence photographs and SVG fallbacks

The final evidence-board photographs are stored in `web/assets/season_1/items/`:

- `gold_threaded_button.png`
- `blackwater_sample_vial.png`
- `xylazine_vial.png`
- `red_maintenance_ledger.png`
- `motel_polaroid.png`
- `confession_reel.png`
- `municipal_wax_fragment.png`
- `civic_tire_cast.png`

The initial SVG versions remain in the same directory as lightweight fallbacks:

- `gold_threaded_button.svg`
- `blackwater_sample_vial.svg`
- `xylazine_vial.svg`
- `red_maintenance_ledger.svg`
- `motel_polaroid.svg`
- `confession_reel.svg`
- `municipal_wax_fragment.svg`
- `civic_tire_cast.svg`
