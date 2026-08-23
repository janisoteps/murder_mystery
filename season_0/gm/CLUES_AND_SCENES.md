# Season 0 clues and arrival scenes

> STOP: GAME-MASTER SPOILERS.

## Sheriff's Annex

First arrival: Deputy Warren Sloane provides the incident report but attempts to keep the investigators away from Cal's personal effects. Careful observation reveals a North Star room key that Sloane recognizes before pretending not to.

Discoverable evidence:

- `sloane_recognized_key` — Sloane recognized Cal's motel key before reading its tag.
- `industrial_alarm` — The automated alarm was generated at 6:46 p.m.; no one manually reported the death.

## Harker Grain Elevator

First arrival: The dryer chamber contains a mutilated body coated in pale grain dust. Cal's fingertips are split, and several nails were torn away while he tried to climb the rotating paddles.

Discoverable evidence:

- `red_enamel` — A red enamel chip is embedded in the scalp wound, proving an assault before the machinery started.
- `bell_rope_fibers` — Waxed hemp fibers around the wrists match old bell rope rather than industrial cord.
- `microcassette` — Beneath the dryer housing is a damaged recorder. Its final intelligible words include Cal saying, “Your congregation paid for it, Abel.” This requires a deliberate machinery search.

Danger: entering the dryer without isolating its power lets someone outside trigger a short, frightening rotation. It injures but does not kill during the rehearsal.

## Ruth's Diner

First arrival: Ruth Harker is serving two silent truckers. The washroom wastebasket has already been emptied into the alley incinerator.

Discoverable evidence:

- `crofts_wet_cuff` — With empathetic questioning, Ruth admits Croft washed a dark stain from his cuff at 6:19 p.m.
- `station_wagon` — Ruth saw Croft's station wagon heading toward Elevator Road shortly after 6:00 p.m.

## St. Orison's Chapel

First arrival: Croft can be met unless he has already been directly accused. The chapel smells of cold stone, candle grease, and sweet altar wine.

Discoverable evidence:

- `missing_rope_section` — The bell rope was shortened recently; loose fibers match those on Cal's wrists.
- `staff_damage` — The red processional staff has a new chip and diluted blood trapped beneath its iron collar.
- `altered_ledger` — Several restoration-fund entries were overwritten. This establishes motive only when paired with Iris's photograph.

Danger: after Croft realizes the investigators possess decisive evidence, he prepares an ambush in the bell tower.

## North Star Motor Court

First arrival: Iris Bell denies knowing Cal until confronted with the room key. Room 6 smells of hot dust and photographic developer.

Discoverable evidence:

- `ledger_photo` — A photograph preserves the chapel ledger before its entries were altered.
- `blackmail_draft` — Cal drafted a demand for money but never named the recipient.
- `sloane_affair` — Evidence of Cal's affair creates a plausible but ultimately false motive for Sloane.

## Narrator-state updates

When evidence is genuinely discovered, append a public card to `season_0/runtime/narrator_state.json`. Never expose undiscovered clue text. Increment `revision`, set `lastProcessedEventId`, and provide a short `statusMessage`. Do not edit `player_state.json`; it belongs to the browser.
