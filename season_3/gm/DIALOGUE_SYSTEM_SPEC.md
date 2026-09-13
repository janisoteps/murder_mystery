# Season 3 dialogue system specification — *The Winter Garden*

> PRIVATE IMPLEMENTATION SPECIFICATION. Contains hidden knowledge architecture and account progression. Never serve this file or full NPC profiles to the browser. This specifies later work; it does not claim the current server implements these systems.

## Goal

NPC conversations should feel like conversations with different people, remain faithful over roughly twenty hours, permit natural phrasing and bluffing, and never invent murder facts. The system must separate **what an NPC decides to communicate** from **how that person says it**.

A single generative prompt cannot safely perform knowledge retrieval, social reasoning, reveal authorization, voice, state mutation, and consistency checking at once. Season 3 therefore uses a staged turn pipeline with server-side validation.

## Turn pipeline

### 1. Normalize the player act

Input includes player text, selected NPC, current physical location, explicit evidence attachment, and active conversation identity.

Resolve:

- subject and references to prior messages;
- speech act: question, claim, request, reassurance, accusation, joke, threat, silence, correction, or small talk;
- case proposition being discussed, if any;
- whether a statement is a player claim, established public fact, or evidence actually shown;
- requested disclosure or practical action;
- emotional tone without assigning the investigator a hidden intention.

Ambiguous reference may produce a natural clarification question. Do not treat ordinary imprecision as adversarial semantics.

### 2. Retrieve bounded NPC context

Retrieve only:

- the NPC's core identity and voice;
- current ordinary want and immediate activity;
- authored knowledge and beliefs relevant to the subject;
- current account version and its allowed claims;
- public world events plausibly learned;
- durable memory with this investigator;
- a limited recent transcript;
- attached evidence's discovered public description;
- eligible conversational moves and registered discoveries.

Never include the full ground truth, other NPC private profiles, future account states, hidden proof evaluation, or undiscovered asset descriptions.

### 3. Plan the conversational move

A constrained planner selects one or more moves:

- answer directly from knowledge;
- state uncertainty or a bounded recollection;
- offer a relevant ordinary detail;
- correct a premise;
- give a deliberately authored lie from the current account;
- protect a specific private subject;
- request one necessary clarification;
- react emotionally and still answer;
- offer or decline a practical action;
- end this topic or the whole conversation;
- trigger a registered account transition only if its event condition is satisfied.

The planner returns structured intent, fact IDs, claim status, disclosure IDs, and any proposed state changes. It does not write final prose.

Being eligible does not mean a fact must be disclosed. The player's act must make the chosen move conversationally plausible. Conversely, basic directions and harmless work knowledge usually need no special gate.

### 4. Authorize revelations and actions

The server checks:

- each selected fact belongs to the NPC's current knowledge or authored lie set;
- required public discoveries or actually shown evidence exist;
- the NPC plausibly knows any referenced world event;
- an account transition matches its exact trigger and prior state;
- a location unlock is registered for the selected spoken lead;
- a proposed practical action is possible at the NPC's current location and schedule;
- no hidden final meaning is leaked in a supposedly observable description.

Unauthorized selections return to planning with the invalid fields removed. They never reach prose generation.

### 5. Render in character

The renderer receives only the approved plan and voice guidance. It writes spoken language, with optional performance metadata kept separate from the transcript text.

Rules:

- answer the social and factual act before adding texture;
- vary length naturally; many replies should be one to four sentences;
- do not paraphrase every question;
- do not end every reply with a counter-question;
- do not use system language, evidence-gate language, or generic courtroom formulations;
- permit fragments, warmth, humor, irritation, hesitation, and silence appropriate to this person;
- avoid catchphrase repetition and exaggerated accents;
- do not narrate investigator actions, thoughts, or feelings;
- do not add scene narration unless a separate authorized world-action renderer handles it.

### 6. Validate the rendered reply

Check the candidate against:

- approved fact and lie IDs;
- prohibited undiscovered names, places, roles, and chronology;
- current account consistency;
- prior explicit claims;
- repetition of recent phrases and structural habits;
- maximum length and speech-synthesis suitability;
- accidental investigator narration;
- unapproved promises, threats, departures, item transfers, or location unlocks.

If the candidate fails, regenerate from the same approved plan. Never relax the knowledge boundary to obtain smoother prose.

### 7. Commit atomically

After validation, commit together:

- NPC spoken turn;
- referenced fact/lie IDs;
- explicit player claim IDs heard;
- evidence IDs actually shown;
- disclosed case entries;
- location unlocks actually communicated;
- account transition and trigger;
- relationship-dimension changes with reasons;
- practical action or pending game event;
- durable memory summary.

A generation failure commits nothing. A player must never receive an unlocked location for a line the NPC did not actually say.

## Suggested state shape

This is a conceptual schema for later implementation, not code to paste unchanged.

```json
{
  "sessions": {
    "session_id": {
      "npcId": "npc_id",
      "investigatorId": "investigator_id",
      "locationId": "location_id",
      "turns": [],
      "openedAtClock": "Friday 20:40"
    }
  },
  "npcState": {
    "npc_id": {
      "locationId": "location_id",
      "activityId": "activity_id",
      "accountVersion": "opening",
      "accountTriggerEventId": null,
      "knownPublicEventIds": [],
      "disclosedFactIds": [],
      "relationshipByInvestigator": {
        "investigator_id": {
          "trust": 0,
          "irritation": 0,
          "griefActivation": 0,
          "obligation": 0,
          "topicFear": {},
          "promises": [],
          "shownEvidenceIds": [],
          "heardClaimIds": [],
          "durableMemory": []
        }
      }
    }
  },
  "publicDiscoveries": [],
  "publicEventIds": [],
  "pendingWorldActions": [],
  "revision": 0
}
```

Relationship values are hidden implementation aids with reasons, not a gamified affection score. Define bounded ranges later. The system must not permit one high value to override a hard factual limit.

## Knowledge representation

Every case-relevant knowledge unit needs:

- stable ID;
- proposition stated without prose style;
- status for this NPC: knows, believes, suspects, authored lie, or does not know;
- confidence and source;
- earliest world state in which they possess it;
- topics under which it is relevant;
- whether it can create a case entry or location unlock;
- disclosure considerations tied to the specific subject;
- forbidden inference beyond the proposition.

Example distinction:

- “Tess saw Hannes pass Vera a key ring” is authored observation.
- “The key opened the potting room” is not part of Tess's knowledge.
- “The player says it was the potting-room key” is a heard claim.
- “A recovered allocation record identifies the service key” may become public fact later.

The renderer must not collapse these four states.

## Account transitions

Principal suspects have explicit versions in `NPC_BIBLE.md`. A transition requires a concrete trigger event that has plausibly reached the NPC. Triggers may include:

- evidence physically shown;
- an official question stating a public comparison;
- attendance at a meeting where the discovery was disclosed;
- another participant telling the NPC, through an authored world event;
- direct observation of a changed physical state.

Possession in the investigator's private inventory is not a trigger. A model cannot infer “they probably know” from conversational tone.

Account versions define what the NPC currently asserts, concedes, and refuses. They do not script exact sentences. The renderer can express a stable claim naturally in context.

## Bluffing and mistaken claims

The player may assert anything. Store murder-relevant assertions as **claims heard**, never as public facts.

An NPC can:

- reject a claim based on knowledge;
- appear worried because it approaches a secret;
- pretend indifference;
- correct a harmless mistake;
- ask where the player heard it;
- believe a plausible bluff when their profile and knowledge support that reaction.

Believing a bluff may change fear, account strategy, or a practical action. It cannot convert the bluff into world truth or unlock a physical-evidence-gated discovery.

Formal evidence presentation includes the stable evidence ID and public description outside the player's prose. Merely saying “I have your cardigan” does not count as showing it.

## Conversation situations

Each core NPC needs at least three authored situations before release:

1. **Ordinary contact:** work, food, weather, art, a favor, or a concern unrelated to extraction of clues. Establishes personality through action and opinion.
2. **Partly true case exchange:** gives a useful answer containing a stable limitation, bias, belief, or authored lie the player can revisit.
3. **Pressure exchange:** several viable approaches—specific evidence, third-party account, procedural consequence, rapport, or allowing silence—produce different natural responses without changing fixed facts.

Supporting NPCs need ordinary contact and at least one bounded case exchange. They do not need artificial secrets to seem deep.

## Repetition handling

Maintain semantic topic history, not only raw recent text. If the player repeats a resolved question:

- refer briefly to the earlier answer;
- add a clarification only if the wording reveals a real ambiguity;
- react to changed tone without inventing facts;
- end the subject naturally when appropriate.

The system must not release progressively larger facts because a question was asked three times. Repetition is not a lockpick.

Run a phrase-shape check for patterns that made Season 2 tedious: repeated “I won't speculate,” “that is not evidence,” “to be precise,” rephrased questions, adversarial definitions, and automatic invitations to show proof. Some characters may use one such phrase when natural; none should make it their universal response form.

## NPC-to-NPC information flow

NPCs learn through explicit world events, not global synchronization.

Every propagation event specifies:

- speaker/source;
- actual attendees or recipients;
- facts or claims conveyed;
- whether the source presented them as certain;
- event time and location;
- resulting NPC knowledge or belief changes.

Examples include the staff supper, resident plan meeting, public accusation, official notice, or a specifically authored private warning. A conversation in a closed office remains private unless someone chooses to repeat it.

## Physical presence and availability

A live conversation requires co-location unless the scene uses a telephone or preserved statement. NPC schedule comes from the world-state ledger. The UI should distinguish:

- present and available;
- present but occupied, with a clear later availability;
- elsewhere at a known unlocked location;
- reachable by telephone or arranged interview;
- statement available through Lena.

Do not leave portraits active for people who are no longer in the room.

## Recovery without flattening consequences

If a relationship deteriorates, core propositions remain available through preserved sources or procedure. The alternate route may be more formal, less detailed, or remove an optional human scene. It must not turn Lena into an omniscient narrator.

Promises have actual terms. “I will keep the intimate pages out of the public file” is distinct from “nothing you say will be recorded.” Breach affects only people who plausibly learn of it.

## Audit record

Every committed case-relevant turn should log privately:

- model and prompt-schema version;
- retrieved knowledge IDs;
- planned move and approved fact/lie IDs;
- evidence actually shown;
- rendered response;
- discoveries and location unlocks committed;
- account version before and after;
- validation failures and regeneration count;
- state revision.

This permits debugging unnatural or leaking dialogue without reading model intention into final prose.

## Final reconstruction dialogue

The final scene uses the same knowledge and account machinery with a constrained confrontation controller. The player may choose whom to address and present facts in their own order.

Participants respond only to established or shown material. Their conflicting accounts can expose each other through authored knowledge. The system must not require Vera to confess. Lena evaluates proposition support server-side and asks at most one focused question per unresolved role before letting the player continue.

## Failure behavior

If model generation fails, show a neutral retry state and preserve player text locally until resubmission. Do not commit relationship penalties, discoveries, or clock changes.

If validation repeatedly fails, use a brief authored fallback for the selected approved move. The fallback should match the character and topic category rather than say a universal “I cannot answer.”

If a profile or knowledge node is malformed, disable only that exchange and surface a private diagnostic. Never send the hidden configuration to the browser.
