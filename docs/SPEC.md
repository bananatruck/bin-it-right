# Bin It Right - specification

Bin It Right tells a Long Beach resident which cart or drop-off an item goes to, using only the City of Long Beach's own published sorting rules.
Every answer quotes the exact official sentence it rests on, links to the page it came from, and shows the date that page was fetched.
When none of the City rules in the app match an item, the app says so and gives the City's contact route instead of guessing.

## 1. The hackathon as read on 2026-11-17 (Pacific time)

Hackathon: Arbiter Hacks V1 on Devpost, https://arbiter-hacks-v1.devpost.com/.
I read the overview, rules, resources, updates and dates pages live on 2026-11-17 and they matched the copies saved earlier that night.
Track: Theme Track, "Rethinking Waste": "Build something that helps people or systems reduce, sort, or recycle waste more effectively."
The overview names "a tool that identifies whether an item is recyclable" as an example project.
"Judges will check that the theme is central to the project, not bolted on."
Eligibility: ages 13 and over, students only, teams of 1 to 4, solo entries allowed, one submission per team to one track only.
Submission period: October 20, 2026 9:00am PDT to December 20, 2026 9:00pm PST (dates page, https://arbiter-hacks-v1.devpost.com/details/dates).
Every submission must include a public code repository, a demo video of 2 to 3 minutes maximum on YouTube or Vimeo, and a written description of what it does, how it was built, and what comes next.
The Theme Track also requires one paragraph stating the specific waste problem targeted and how success would be measured.
Missing the repo or the video makes a submission ineligible.
The rules pages say nothing about licenses, pre-existing code, or the use of AI tools.

### Theme Track judging criteria (100 points)

- Impact on the waste problem, 35: "How meaningfully the project reduces, sorts, or improves recycling of waste. The theme must be central, not bolted on."
- Technical execution, 25: "Code quality, working functionality, and the difficulty of what was built."
- Feasibility, 20: "Could this actually be deployed in the real world? A working solution beats a clever one that can't ship."
- Presentation and demo clarity, 20: "How clearly the demo video and writeup explain what was built."

### How the build answers each criterion

- Impact: sorting is the whole product; answers cut contamination at the cart, the app points reusable and hazardous items to the right drop-off, and every unanswered question becomes a reportable gap for the City.
- Technical execution: a provenance-checked dataset, a deterministic and explainable matcher, strict type-checking, linting, unit tests, and CI.
- Feasibility: a static site with no server, no keys, and no model calls, which works offline once loaded and can be refreshed from the City's pages with one script.
- Presentation: a live URL, a clear README with screenshots, and a 2 to 3 minute video script that shows real answers and their citations.

## 2. City choice

The city is Long Beach, California, because the brief prefers it and its Energy and Environmental Services Department publishes enough detail.
It publishes item-level guidelines for all three carts as bilingual English and Spanish PDFs, plus web pages for green cart organics, household hazardous waste, e-waste, universal waste, medical waste, paint, used motor oil, tires, special collections, the mattress drop-off and holiday tree recycling.
Los Angeles County guidance was not needed, because Long Beach runs its own collection service.
The rules apply to City-serviced accounts; the City says private haulers' accepted materials may vary, and the app states this on every answer screen.

## 3. Data model with provenance

The dataset lives in `src/data/` as JSON validated by a Zod schema in `src/data/schema.ts`.

### Source

- `id`: short stable slug, such as `lb-3stream-pdf`.
- `url`: the exact URL fetched.
- `title`: the page or document title.
- `publisher`: "City of Long Beach".
- `format`: `html` or `pdf`.
- `fetchedAt`: ISO 8601 UTC timestamp of the fetch.
- `sha256`: hash of the raw bytes fetched.
- `snapshot`: repository path of the extracted text snapshot under `data/snapshots/`.

### Destination

A destination is where an item goes: the blue recycling cart, the green organics cart, the trash cart, a special collection pickup, a hazardous waste drop-off, and so on.
Each destination has an English label, a Spanish label only when the City publishes one, and an action with its own quoted source; its colour and icon live in `src/lib/destinationStyle.ts`.

### Rule

- `id`: stable slug.
- `label`: the item as the City names it, with `en` always and `es` only when the City's own Spanish wording exists in a source.
- `destination`: one destination id.
- `evidence`: one or more quotes, each with `sourceId`, `lang`, and `text`, where `text` must appear in that source's snapshot.
- `tips`: optional quotes with the same shape, such as "Lids On!".
- `terms`: the explicit English phrases that select this rule, all listed by hand.
- `termsEs`: explicit Spanish phrases that select this rule.

### Provenance guarantees enforced by tests

- Every rule has at least one evidence quote, and every quote names a source that exists.
- Every quote, after Unicode NFKC normalisation and whitespace collapsing, is a substring of its source snapshot.
- Every source has a URL on an official City of Long Beach domain, a fetch timestamp, a hash, and a snapshot file present in the repository.
- A Spanish label is allowed only if an evidence or tip quote in Spanish contains it.
- No search term selects two different rules.
- Rule ids and source ids are unique.

Rules are written by hand by the lead from the saved snapshots, never by an outside agent from memory; an outside model then audited every rule against the snapshots, and the tests recheck every quote on every CI run.

## 4. Matching design

Matching is deterministic, runs in the browser, makes no network or model calls, and returns an explanation of every step it took.

1. Normalise the query: Unicode NFKD, strip accents, lowercase, turn punctuation into spaces, collapse whitespace.
2. Drop a short, listed set of filler words such as "a", "an", "the", "my", "some", "old", "empty".
3. Singularise each word with a small listed set of English and Spanish suffix rules, with an exception list.
4. Exact match: if the normalised query equals a normalised term, return that rule as an answer.
5. Fuzzy match: otherwise score every term by similarity (Damerau-Levenshtein on the whole phrase, and token overlap), and return terms above a fixed threshold as "Did you mean" suggestions.
6. A fuzzy match never becomes an answer by itself; the resident picks a suggestion, which then runs as an exact match.
7. No match above the threshold returns "No official rule found in this app" with the City's published contact route.

The explanation lists the normalised text, the dropped words, the term matched or the top scores, and the threshold used.

## 5. UI flow

1. The resident lands on a search box that asks what they are throwing away, with a row of common items to tap.
2. Typing shows suggestions from the dataset as they type.
3. Submitting shows one answer card: the destination in its cart colour, the item as the City names it, the quoted rule, the source link with its fetch date, and any official tips.
4. "Did you mean" lists close entries when there is no exact match.
5. "No official rule found in this app" shows the City's email and phone, and lets the resident copy a short question for the City.
6. A browse view lists every rule grouped by destination, each with its citation.
7. A sources view lists every page fetched, with its date and hash.
8. A language switch shows the City's official Spanish wording where it exists and says plainly when only English is published.
9. A "How this works" section explains the matcher and the provenance checks.

### Accessibility

- Buttons and links are at least 48 CSS pixels tall, and small ones at least 48 wide.
- Every control has an accessible name, results are announced through a polite live region, and focus moves to the answer.
- Colour is never the only signal: every destination has a text label and an icon.
- Text contrast meets WCAG 2.2 AA, motion respects `prefers-reduced-motion`, and the layout works from 320 CSS pixels wide.

## 6. Test plan

- Data tests: the provenance guarantees in section 3, run against the committed snapshots, including a test that fails if any rule lacks a source.
- Engine tests: normalisation, filler words, singularisation, exact matches for every term in the dataset, typos that produce suggestions, unrelated text that produces "No official rule found", Spanish queries, and stable ordering.
- Component tests: the answer card shows the quote, link and date; the no-match card shows the contact route.
- Browser checks: the production build loaded in headless Chromium at 390 by 844 and 1440 by 900, with screenshots saved to `docs/screenshots/`.
- CI runs lint, type-check, tests and build on every push to `main` and every pull request, and a separate workflow deploys `dist/` to GitHub Pages.
