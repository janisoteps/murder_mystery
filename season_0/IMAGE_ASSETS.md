# Season 0 image assets

The ten location images were generated with the built-in image-generation tool and copied into `web/assets/season_0/locations/`. Season 0 image generation stopped after this exterior/interior set.

## Shared prompt specification

- **Use case:** `stylized-concept`
- **Asset type:** game environment slideshow image
- **Setting:** rural Iowa, late October 1994
- **Style:** cinematic rural-gothic realism; photorealistic 35mm crime, horror, or neo-noir still
- **Composition:** wide 16:9 establishing view with a clear environmental focal point
- **Lighting:** grounded practical lighting with restrained blue, amber, fluorescent, or candle contrast
- **Texture:** weathered real-world materials and subtle film grain
- **Constraints:** historically plausible for 1994; no readable text; no logos; no watermark; no supernatural entities

## Location variations

- **Sheriff's Annex exterior:** old brick civic annex, wet street, leafless trees, weak security light, aging cruisers.
- **Sheriff's Annex interior:** worn records office, scarred desks, filing cabinets, radiator, burnt coffee, fluorescent light.
- **Ruth's Diner exterior:** isolated chrome diner, wet county road, glowing windows, two old semi trucks.
- **Ruth's Diner interior:** red stools, pie case, coffee urn, shadowed booths, harsh fluorescent light.
- **Harker Grain Elevator exterior:** concrete silos above harvested fields, dust and one dirty amber work light.
- **Harker Grain Elevator interior:** machinery floor, open grain dryer, ladders, conveyors, rust, dust, no gore.
- **St. Orison's exterior:** weathered chapel, leaning cemetery stones, bare trees, one dim window.
- **St. Orison's interior:** narrow nave, old pews, bell rope, altar, red processional staff, candlelight.
- **North Star Motor Court exterior:** U-shaped motel, rain-filled pool, dead leaves, star-shaped sign without lettering.
- **North Star Motor Court interior:** decaying room 6, rumpled bed, old television, rotary telephone, negatives and envelopes.

Each location's `exterior.png` and `interior.png` was visually inspected before being copied into the project.

## Reusable character portrait

`Ruth Harker` is the single NPC portrait prototype. It is stored at `web/assets/shared/characters/ruth_harker.png` so Season 0 and Season 1 can reference the same asset without generating it again.

- **Use case:** `stylized-concept`
- **Asset type:** reusable murder-mystery game character portrait
- **Scene:** aging rural American diner interior with softly defocused red vinyl, chrome, and fluorescent fixtures
- **Subject:** broad-shouldered diner owner in her late 50s; weathered, intelligent face; severely pinned iron-gray hair; dark work blouse and worn apron; guarded expression
- **Style and framing:** cinematic photorealistic rural-gothic crime-drama still; grounded 35mm texture; vertical, chest-up, eye-level portrait
- **Constraints:** one person; historically plausible 1994 details; natural skin and fabric texture; no text, logos, watermark, glamour treatment, modern objects, gore, or supernatural elements

The generated portrait was visually inspected before being copied into the shared asset directory.
