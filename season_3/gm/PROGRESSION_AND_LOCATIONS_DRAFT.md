# The Winter Garden — private gameplay and location draft

SPOILERS. **Superseded development history.** The critique and final revision have been completed. Use `SCENES_AND_PACING.md`, `CLUE_MATRIX.md`, and `GROUND_TRUTH.md`.

## Twenty-hour target

Design for approximately twenty hours for a first-time player who explores, converses, compares accounts, and follows several plausible theories. A fast deductive player may finish substantially earlier. A completionist may spend longer. Do not impose a minimum duration, require all seventy-two discoveries, or postpone a correct answer to hit a time budget.

| Investigation movement | Approximate engaged minutes | What fills the time |
|---|---:|---|
| Arrival, scene orientation, first people and physical questions | 90 | Explore a substantial opening environment, learn interactions, establish fall hypothesis and initial leads |
| Staff routes, unfinished work, and the private meeting | 180 | Hotel and workshop exploration, witness accounts, access/route reconstruction, first comparison work |
| Residents, disputed approvals, and competing personal explanations | 240 | Residence, lodging, village/records and pavilion branches; distinguish several different sets of papers and motives |
| Timing, true scene, movement, and recovered objects | 240 | Baths, nursery and goods-route work; resolve apparent late sighting; compare physical findings and custody |
| Revisits, changed accounts, public consequences, and role assignment | 270 | Targeted return visits, resident meeting, partial admissions or independent alternatives, theory-building |
| Accusation, remaining factual questions, and human aftermath | 120 | Present and refine a reconstruction; distinguish participants; see case and optional community outcomes |
| Flexible optional personal discoveries | 60 | A few chosen conversations, small environmental stories, exhibition or personal-folder closure |
| **Total planning allowance** | **1,200** | **20 hours; integrated activities, not elapsed clocks or mandatory gates** |

These movements overlap. The player can reach the actual scene in the opening and understand the motive before clearing an innocent suspect. The table estimates a likely experience, not an enforced chapter sequence.

Cross-check the intended activity mix conceptually: about six hours of close exploration, five of dialogue, three of physical interactions, three of comparison and reconstruction, two of meaningful revisits/world events, and one concentrated hour of final case presentation. These are another view of the same twenty hours, not additional hours to add to the table.

No busywork is budgeted. Failed movement, repeated dialogue, silent loading, walking a previously cleared corridor, waiting for a report, and clicking every prop because interaction cues are unclear are not desired content.

## Map discovery graph

Only `winter_garden` is initially accessible. Locked map markers can show neutral geography and public names consistent with the user's map preference. Their tooltips must not preview an undiscovered person, object, suspect role, or case connection. Travel availability is based on server-owned discovery state when implemented.

For a location, the routes separated by “or” below are alternatives. A clue route uses an actually read/collected discovery; a dialogue route uses an actually communicated lead. Being near an NPC does not automatically mean hearing their directions.

| Location ID | Primary route | Alternate route | In-world reason to visit |
|---|---|---|---|
| `winter_garden` | Starting location | Always returnable once released for inspection | Scene and common meeting point |
| `grand_hotel` | B01 appointment/office reference or C02 service label | Lena or Emil explains where reception and staff offices are | Interview staff and follow service records |
| `restoration_workshop` | A03 work reference or B04 work slip | Nora, Jakob, or Lena identifies the crew's base | Understand gallery work, tools, and contractor routes |
| `thermal_baths` | C02 linen label or C01 hamper destination | Marta, Jakob, or hotel staff gives a relevant baths lead | Follow objects and an apparent sighting |
| `east_residence` | D02 room reference, hotel notice, or D01 annex attachment | Richard mentions his visit, or Rosa invites the investigator | Understand the disputed spaces and speak to residents |
| `architect_lodging` | Felix's return address on ordinary site papers | Clara or hotel reception identifies his rented workroom | Examine his work and intended meeting material |
| `funicular_station` | F02 goods-route reference on a workshop delivery | Juri or Oskar explains the goods handover | Check practical movements and transport claims |
| `village_cafe` | Hotel public delivery card or residence meeting notice | Rosa, Oskar, or Benno gives directions | Village witnesses, informal contact, later public reactions |
| `municipal_reading_room` | D01/D03 agreement filing reference or Felix's archive request | David's contact through Lena or Rosa identifies the records | Compare approved and later versions |
| `gardeners_cottage` | A07 press inventory contact or E09 plant destination | Jakob or Emil invites an ordinary nursery visit | Compare normal tool/plant use and actual changes |
| `panorama_pavilion` | Public concert/exhibition program in hotel | Clara, Celia, or Saskia identifies the rehearsal/exhibition rooms | Personal-folder thread, photographs, gallery witness |
| `police_medical_room` | Lena explicitly provides the report/custody destination | Miriam explains where to collect examination results | Professional support, reports, and preserved exhibits |

All destinations have an alternative to a tiny object pickup. None depends on an essential clue locked inside itself. Public delivery cards and programs are ordinary orientation props, not additional members of the seventy-two-case-discovery list.

Unlock reasons are retained in the journal. A return visit is available even if the initiating NPC moves elsewhere. Search permission for a private office is separate from knowing where a building is. A public building must not disappear from the map because a resident is annoyed.

## 01. Winter Garden

**Spatial identity.** Large glass and iron conservatory in winter: tall palms, citrus tubs, tiled paths, reflecting basins, damp lower panes, warm lamps against blue snowlight. The gallery gives a view of the public hall; service spaces remain architecturally legible.

**Explorable zones.** Entrance and coat alcove; palm hall with intersecting paths; upper gallery and temporary works; potting room and plan chest; delivery vestibule; sheltered external approach. The actual assault room is visible and accessible for a justified scene inspection from the start.

**Physical actions.** Direct a task light, inspect a movable screen from both sides, open the botanical press, turn an empty trolley, compare a pot with its stand, operate a harmless ventilation demonstration after evidence is preserved. The trolley and press are usable systems rather than abstract hotspot labels.

**Life.** Condensation, occasional drips, slow ventilation movement, distant reception sounds, a gardener attending stressed plants, footsteps changing on tile and grit. The preserved crime area should not be casually traversed by ambient guests.

**Narrative work.** A01–A09, initial witness contact, B01/B05, and starting branches. The apparent fall is understandable from normal player eye level and from the isometric view. An accessible enlarged scene photograph conveys essential details too.

**Meaningful return.** Daylight reveals the scale of the glasshouse and changes the mood; it does not spawn new blood or replace an earlier object. Reports and known routes make previously observed positions intelligible. After scene release, ordinary work resumes around preserved markers.

## 02. Grand Hotel

**Spatial identity.** Restored lobby with a real reception desk, drawing room, dining service corridor, bar, staff office, porter station, and guest/staff floors. Public warmth contrasts with crowded work spaces rather than with a uniformly sinister basement.

**Physical actions.** Browse labeled pigeonholes with permission, follow the route of luggage, open a public program stand, inspect a switchboard printout, compare cloakroom tags, look through relevant office files with access, switch reading lights. Do not make every drawer an evidence lottery.

**Life.** Staff stack abandoned reception glasses, food moves to a staff table, guests telephone relatives, Benno tries to salvage supper. Vera remains practically useful; that usefulness must be believable before suspicion develops.

**Narrative work.** B02/B03/B08/B11/B12, financial packets and meeting notes, Clara's folder handover, Vera's public account, and Anton's porter duties. Different records occupy plausible work stations rather than one central “clue office.”

**Meaningful return.** Breakfast, a staff discussion, a requested private interview, and a justified accommodation search each change what the player is doing. Existing dialogue transcripts and a concise discovered-fact recap prevent repeated exposition.

## 03. Thermal Baths

**Spatial identity.** Grand tiled bathing hall, changing and wardrobe counters, smaller treatment rooms, a quiet cooling terrace, linen handling room, and service storage. Steam, acoustics, wet reflections, and dry textile work create distinct sensory spaces.

**Physical actions.** Trace the guest route from pool to changing to payment, examine a sample locker process, inspect a returned linen label, open a relevant contractor hamper with authorization, compare storage hooks and parcel tickets. Active machinery and hot systems are scenery unless safely isolated by staff.

**Life.** Water movement, towels folded by Marta, muted voices, a guest finding misplaced gloves, cleaners preparing the next session. The baths retain a function beyond hiding a weapon.

**Narrative work.** B09/B10/E11 resolves the apparent late sighting through an understandable routine. C01–C04 trace a physical object and distinguish the person who disposed of it from the killer. The two branches can be pursued independently on one visit.

**Meaningful return.** Compare recovered object reports, clarify an account, or revisit Amalia after correcting the time anchor. No second identical search is required after the case state changes.

## 04. Restoration Workshop

**Spatial identity.** Joinery benches, a drawing wall, metal repair bay, drying racks, parts shelves, contractor desk, and goods-loading apron. Different crafts leave different kinds of order. The space should feel used by several workers with their own habits.

**Physical actions.** Fit a non-evidence sample railing joint, inspect the original work drawing, compare job-book copies, trace a hamper allocation, view a repair from Juri's position, operate a safe scale model or isolated mechanism.

**Life.** A radio, hands sorting hardware, shavings moved off a bench, someone making tea in an unsuitable mug. Work continues where the investigation permits it.

**Narrative work.** Nora's real safety mistake, Hannes's fatal-interval absence, his changed job entry, conversion work orders, and the screen instruction. This is both a suspected-negligence location and a source that narrows another person's responsibility.

**Meaningful return.** Hannes's departure preparations, Nora's corrected account, or a comparison of the recovered weight and route. Departure does not permanently remove testimony; Lena can arrange a later contact.

## 05. East Residence

**Spatial identity.** Occupied flats, broad old corridors, a shared winter room, laundry balconies, mail corner, and a longer service route made necessary by construction. Furnishings are personal and mismatched. Avoid treating age, modest means, or disrepair as a horror aesthetic.

**Physical actions.** Walk the disputed access route, compare a proposed partition on an overhead plan, inspect room measurements with permission, help reposition Rosa's chair optionally, examine notices residents have chosen to share.

**Life.** Tea, radio repairs, a neighbor borrowing a pan, coats drying, a meeting that sometimes loses focus. Rosa and Pavel disagree about practical matters without being assigned opposite truth values.

**Narrative work.** The financing conflict becomes a change to actual inhabited spaces. D02/D03/D09/D12, E02, F07/F08/F10. Richard's alibi grows from people who were doing things rather than waiting to witness him.

**Meaningful return.** Residents compare the newly revealed agreement and decide what to ask for. The investigator can attend or obtain minutes later. Their decision is not a reward unlocked by choosing a designated compassionate line.

## 06. Architect's Lodging

**Spatial identity.** A rented upper-floor workroom and modest bedroom near the village: drafting desk, drawing storage, kettle, partially packed suitcase, view toward the hotel, and a shared stair landing. Felix's orderly plans coexist with neglected personal tasks.

**Physical actions.** Align document versions on a light table, open normal labeled drawing tubes, inspect his actual calendar and outgoing correspondence, compare a sketch to the residence. Relevant letters are readable as accessible text as well as images.

**Life.** A quiet room whose absent occupant is conveyed through ordinary incompletion. Avoid ominous coded wall diagrams or a trail of dying messages.

**Narrative work.** D01/D04/F06/F08, the distinction between personal folder and annex papers, Felix's responsibility for earlier access mistakes, and clues to the municipal envelope. The lodging never contains a solved murder dossier.

**Meaningful return.** Optional clarification of his intended public statement or a personal-folder decision with Clara. Essential copies elsewhere prevent this private room becoming a universal bottleneck.

## 07. Funicular Station

**Spatial identity.** Upper passenger hall and goods platform with an optional transition to a compact lower landing. Cable motion, waiting benches, ticket window, equipment view, and mountain sightlines. Treat these as one production destination with connected subareas, not a duplicate full-sized map location.

**Physical actions.** Inspect goods notes, compare an actual route against a timetable, view operation from the platform, use a safe demonstration model, follow a parcel's handling sequence. The transit animation is skippable after its first use.

**Life.** Oskar helps passengers, parcels accumulate, doors are adjusted, people discuss whether the weather will clear. The line functions as transport rather than an endless locked puzzle machine.

**Narrative work.** F02 supports or limits claimed movements, provides a route to the village, and gives ordinary contact with Oskar and Juri. A schedule is never promoted to an exact eyewitness account.

**Meaningful return.** Check a specific departure claim or have an optional conversation. Do not require a station visit simply to collect a completion badge.

## 08. Village Café and Square

**Spatial identity.** Small café, public notice area, sheltered square, newspaper counter, and views to occupied houses and the funicular. Early light and people moving through it distinguish the valley from the hotel complex.

**Physical actions.** Read public notices, lay out discovered documents on a table, retrieve a requested print envelope, inspect the route on a public map. Board work should be possible here without suggesting that the café contains a secret evidence wall.

**Life.** Breakfast, deliveries, ordinary gossip, someone trying to finish a crossword. Rumors have identifiable sources and are not all reliable. The NPCs can talk about matters unrelated to Felix.

**Narrative work.** Provides comfortable neutral conversations, a place to meet an already known witness, and public reactions to facts actually disclosed. It does not introduce an entire second murder to fill time.

**Meaningful return.** The village's understanding changes after a public meeting or accusation. Private discoveries remain private unless a plausible communication event occurred.

## 09. Municipal Reading Room

**Spatial identity.** Small public library/records room, map cabinet, reading tables, copy desk, and a correspondence return locker. Warm light and readable organization make examination inviting.

**Physical actions.** Compare registered versions side by side, unfold the resident-access plan, retrieve Felix's held envelope through legitimate access, inspect the photograph catalog for an optional caption correction.

**Life.** David helps an ordinary visitor and makes space on a table rather than leading with bureaucracy. An after-hours envelope can be collected through Lena if the player arrives while David is away.

**Narrative work.** D03/D04/D06 context and F09. The central differences must be legible in a few relevant pages. Players should not spend an hour searching artificial legal boilerplate.

**Meaningful return.** Supply an accurate copy for the residents or resolve a specific remaining discrepancy. All earlier examined records remain available from the journal.

## 10. Gardener's Cottage and Nursery

**Spatial identity.** Lived-in cottage, lean-to nursery, propagation benches, tool cupboard, small kitchen, and sheltered exterior planting area. It should feel cared for rather than picturesque clutter placed by an artist.

**Physical actions.** Compare an ordinary press component, trace the relocated plant's container and soil, inspect inventory notes, help with a nonessential plant task, listen to Jakob while he continues work.

**Life.** Growing lamps, condensation, kettles, labels corrected by hand, plants in various stages of recovery. Emil has his own small work area, making his ambitions visible.

**Narrative work.** A07 background, E09/E10, ordinary trolley uses, gardener observations, and emotional relief. Demonstrates that environmental traces have mundane causes as well as criminal ones.

**Meaningful return.** Show a recovered object's photograph, clarify a normal practice, or complete an optional favor. No timed plant death blocks the case.

## 11. Panorama Pavilion

**Spatial identity.** A small performance and exhibition building overlooking the valley: rehearsal platform, seating, dressing alcove, photograph displays, print worktable, and sheltered viewing terrace. Music, fabric, paper, and changing mountain light give it a distinct identity.

**Physical actions.** Browse developed contact sheets with Saskia, inspect selected folder pages with permission, align an exhibition caption with its catalog source, reproduce Celia's sightline using an accessible diagram rather than a reflex challenge.

**Life.** Clara rehearses, stops, tries a passage again. Celia argues affectionately about a caption. Saskia decides which prints should be given to residents. These actions do not pause forever because the player has not opened a dialogue modal.

**Narrative work.** C07/E06–E08/F04/F09 and Clara's personal branch. Imagery corroborates objects and sequence without becoming an omniscient film of the crime.

**Meaningful return.** New development requested earlier, Clara's folder decision, or an optional quiet performance after the immediate crisis. Developing film is an explicit service request with other work available and a time-skip option.

## 12. Police and Medical Room

**Spatial identity.** A modest local office with separate interview, examination-report, and evidence-storage areas. It is a support destination, not a fully equipped miraculous laboratory or an additional player headquarters demanding management.

**Physical actions.** Review photographs at readable scale, request comparisons, inspect secured exhibits through their custody presentation, place discovered timeline statements beside each other, conduct an arranged interview.

**Life.** Lena answers a telephone, Miriam arrives with professional context, paperwork and tea accumulate. The staff can be competent without knowing the solution before the player.

**Narrative work.** A10/A11/C04/C05/C09/F12, recovery of prior observations, professional results, and final supported reconstruction. The investigator remains the sole playable character.

**Meaningful return.** Receive a specifically requested result or interview. A report is not delayed solely to enforce twenty hours. The player can choose to advance to its stated availability rather than wait in real time.

## Daily availability and believable movement

Each person has one current physical location at a time. Dialogue can occur remotely only when an explicit telephone or official written-statement route is used. A portrait in an old transcript is not proof that the person is still standing in the room.

| NPC | Opening night base | Following day base | Event-dependent movement |
|---|---|---|---|
| Vera | Hotel reception and staff office | Hotel | Residence meeting if invited; official interview if arranged |
| Irene | Hotel accounts office | Hotel office or staff room | Offers a private meeting after relevant exposure |
| Hannes | Workshop | Workshop and goods apron | Signaled supplier departure, later reachable through official contact |
| Anton | Hotel porter station | Hotel | Interview or luggage task with explicit return information |
| Lena | Winter Garden scene | Police/medical room | Scene visit, arranged search, or interview |
| Richard | Hotel guest office after residence visit | Hotel or residence meeting | Reports to his office by telephone; no unannounced permanent disappearance |
| Rosa | East Residence | Residence, sometimes café | Common-room meeting |
| Pavel | East Residence | Residence | Helps neighbors in the same building |
| Clara | Pavilion then hotel | Pavilion | Café meeting or private folder review by arrangement |
| Nora | Workshop | Workshop | Gallery repair after scene release |
| Jakob | Winter Garden | Garden/cottage | Attends plants between stated destinations |
| Emil | Winter Garden | Nursery or garden | Ordinary labeled delivery task |
| Miriam | Winter Garden response | Police/medical room or ordinary practice | Report explanation and requested examination |
| Oskar | Funicular Station until service ends | Station | Off-duty café contact; records remain available |
| Juri | Workshop then service rounds | Workshop or station | Demonstration or explanation by arrangement |
| Marta | Baths wardrobe/linen area | Baths | Break in staff room, return time visible |
| David | Off duty, envelope accessible through Lena | Reading Room | Public records assistance at residents' meeting if requested |
| Benno | Hotel bar and service area | Hotel dining room | Staff meal and later reception service |
| Saskia | Pavilion print work area or hotel | Pavilion/café | Requested film-development service |
| Tess | Hotel runner/porter desk | Hotel | Deliveries with a known destination and return route |
| Celia | Pavilion, after scene statement | Pavilion | Residence meeting or archive-caption discussion |
| Amalia | Baths then hotel guest rooms | Hotel/café | Leaving visit can be handled by a preserved or telephone statement |

The schedule describes location bands rather than minute-by-minute autonomous simulation. Authoring should specify actual movements when implementing events. Do not pretend this draft already contains a working scheduler.

## World events and consequences

**Body transfer.** Occurs after the opening examination and evidence preservation, with an explicit notice. Before transfer, scene observations are secured. Afterwards the body examination and photographs are available through the support location. A user spending time talking must not lose a necessary observation.

**Morning transition.** The player can choose to rest or advance to a known appointment after the opening. Daylight changes activity and lighting, not the culprit or scene evidence. Core direct observations can also be made at night with available lighting.

**Annex disclosure.** Only an explicit public disclosure or a plausible informed participant's action causes the residents' meeting. Collecting a private document alone does not tell the entire valley. The meeting can be attended, postponed briefly, or read about later.

**Contractor departure.** Hannes's packing and stated supplier trip provide notice. A prepared interview can occur before he leaves. If missed, physical evidence remains and Lena can contact him. The consequence is inconvenience and a changed scene, not an unwinnable game.

**Bookkeeper approach.** Irene may ask to explain her conduct after learning that a relevant document is exposed. The player is not compelled to make promises. Her original carbon pad remains recoverable through justified access if she refuses to hand it over voluntarily.

**Account revision.** Vera changes an authored account only after learning enough to recognize that it no longer holds. Record the trigger, exact new claim, and contradiction with the earlier transcript. She does not sense hidden inventory contents.

**Accusation.** Available whenever the player elects to make one. Evaluate support and uncertainty rather than clue count or act number. An incomplete claim receives a focused question about the missing link using only information already made public.

## Investigation interface principles for later implementation

The board separates objects, professional findings, witness accounts, player hypotheses, and explicit corrections. It should be possible to preserve “Amalia initially associated the sighting with 18:52” beside her later correction without marking her a liar or deleting the first statement.

Allow interval statements: “after Irene left and before Anton's call” is often more faithful than invented minute precision. Show the basis of a claimed time: memory, receipt transaction, machine connection, or overlap with another event.

A source can be reopened from the journal with its discovered image, description, and context. Side-by-side document and image inspection supports comparison. Automatic notes must summarize established observations and spoken claims, not attach the hidden proof-group label.

When requested, a recap says what the investigator actually knows and what they have already chosen to pursue. It does not say which suspect is innocent, which branch is optional, or which clue is “the final piece.”

Use consistent interaction cues and readable reach at several zoom levels. A large detailed environment must not force hunting for a two-pixel object. Inspection can focus the camera temporarily and then return to the chosen isometric zoom.

## Spoiler-safe review and authored-content isolation

The user reviews one investigator in a separate movement/zoom playground before locations. No story clues, real suspect relations, or case outcomes appear in that playground. A support NPC can use an invented neutral identity if dialogue needs visual review.

Each floor plan labels room uses, entrances, circulation, major furniture, light, and interaction classes. It omits fatal positions, evidence placement, secrecy gates, and the purpose of misleading objects. The same review plan must support ordinary life, not only the hidden route.

Location reviews use substitute papers and items with comparable size, visual contrast, and interaction complexity. The final case overlays use a separate state and server-controlled discovered content. Hiding clue text in CSS or shipping all future testimony in JavaScript is insufficient.

The current shared application is not changed in this draft stage. Season 1 and Season 2 remain untouched. No scripts, builds, tests, installations, or app launches are authorized by these design notes.

## Next checkpoint

The expanded narrative, cast, discoveries, and progression are ready to be subjected to the separate private critique only after the user advances that checkpoint. No criticism document or post-critique solution is included here. Investigator appearance remains undecided and is the later review stage.
