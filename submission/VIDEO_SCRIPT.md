# Demo video script

The rules ask for "A demo video, [2 to 3] minutes max, showing the project working", uploaded to YouTube or Vimeo and linked.
The video is recorded from the live site, https://bananatruck.github.io/bin-it-right/, by `scripts/record-demo.ts`; see `docs/RECORDING.md`.
It runs about 2 minutes 45 seconds (2:46 in the recording of 2026-11-18, 23:00 PST), at 1920 by 1080, with English captions and no voice, music or third-party branding.
The captions describe what is on screen; nothing is presented as anyone speaking.
For a narrated version, read the same lines over the uncaptioned file, using the exact times in `submission/video/timed-script.md`.

## Scenes and captions

Times are from the recording of 2026-11-18 and shift by a second or two between recordings.

### 0:00 to 0:11, what it is

On screen: the home page with its rotating headline.

- "Bin It Right answers one question for Long Beach residents: which cart or drop-off does this go in?"
- "Every answer quotes the City of Long Beach's own published sorting rules."

### 0:11 to 0:40, an answer with its proof

On screen: "pizza box" is typed; the green slab reads "Green organics cart"; the quotes, a source link and the private-hauler note are shown.

- "Search: pizza box."
- "Answer: the green organics cart."
- "Below it: the City's rule, word for word, with the City page it came from and the date that page was saved."
- "Each quote links to the official City page."
- "Cart rules apply to homes with City collection; the app notes that a private hauler may differ."

### 0:40 to 0:59, a word with two meanings

On screen: "battery" is typed; "Did you mean" offers household and lithium batteries; the lithium answer opens on an amber slab.

- "Some words could mean more than one thing."
- "So the app asks which one, instead of guessing."
- "Lithium-ion batteries: a household hazardous waste drop-off, as the City says."

### 0:59 to 1:24, no matching rule

On screen: "aluminum foil" is typed; "No official rule found in this app" appears with the City's email, phone and a copyable question; "Why this answer" is opened.

- "Search: aluminum foil."
- "No City rule in the app matches, and the app says so instead of guessing."
- "It shows the City's email and phone, and a ready-made question to send them."
- "\"Why this answer\" shows how the words were matched and how close each listed term came."

### 1:24 to 1:55, Spanish

On screen: the language switch is set to Spanish; "bolsa de plástico" answers "Basura" with the City's Spanish wording; "pintura" shows the note that the City publishes that rule only in English.

- "Spanish mode."
- "It shows the City's own Spanish wording from its printed guidelines: Basura (trash)."
- "Search: pintura (paint)."
- "Where the City publishes a rule only in English, the app shows the English rule and says so."

### 1:55 to 2:10, offline

On screen: the browser's network is switched off (by the recording script) and the page is reloaded; "mattress" still answers "24/7 mattress drop-off".

- "Offline test: the network is switched off and the page is reloaded."
- "After one visit, it still answers with no connection."

### 2:10 to 2:46, the data and the close

On screen: the rule list by destination, the "Sources" list with dates and hashes, then the home page.

- "All N rules, from M saved City pages, can be browsed by destination." (`pnpm demo:record` fills in N and M from the dataset when it records: 63 and 20 from round 4 on; the recording of 2026-11-18 predates the PaintCare rule and says 62, so re-record it once round 4 is deployed.)
- "Each source page is saved with its address, the date it was fetched, and a SHA-256 fingerprint."
- "An automated test fails the build if any quote stops matching its saved page."
- "Bin It Right: the City's own rules, with the receipts."
