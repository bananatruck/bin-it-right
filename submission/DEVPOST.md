# Devpost submission draft: Bin It Right

Every field below is drafted for the Arbiter Hacks V1 project form.
The rules require a public code repository, a demo video of 2 to 3 minutes on YouTube or Vimeo, a written description (what it does, how you built it, what you'd do next), and, for the Theme Track, one paragraph stating the waste problem and how success would be measured.
Fields marked "TO FILL" need something only the entrant can provide.

## Project name

Bin It Right

## Elevator pitch

Which Long Beach cart does it go in?
Bin It Right answers with the City's own rule, quoted word for word and linked, and says so when none of the City rules it includes match.

## Track

Theme Track: Rethinking Waste.

## Theme Track paragraph (waste problem and how I'd measure success)

The waste problem I targeted is wrong-bin sorting by Long Beach residents: recyclables and food scraps going into the wrong cart, and hazardous items such as batteries, paint and sharps going into carts at all, because the City's rules are spread across bilingual flyers and more than a dozen web pages.
Bin It Right puts those rules in one place and answers with the City's exact wording, so a resident can sort correctly in a few seconds and trust the answer.
I would measure whether it works in three ways.
First, answer coverage: the share of real searches that end in an official rule rather than "no official rule found", which I would add as an opt-in counter that stores no personal data (the current app records nothing), with a target of steady growth as gaps are filled.
Second, gaps closed: how many gap reports residents send to the City and how many become published rules.
Third, the outcome that matters most: with the City's help, compare contamination rates in a pilot neighborhood before and after promoting the app, using whatever cart inspection or processor data the City already collects.

## About the project

### Inspiration

I live in Long Beach, where every City-serviced home has a blue recycling cart, a green organics cart and a trash cart.
The answer to "where does this go?" is usually in a City flyer or one of many City web pages, and most people will not look it up while standing at the bin.
General recycling apps answer from general knowledge, and local rules differ: Long Beach, for example, tells residents to put products labeled compostable in the trash, not the green cart.
I wanted an answer I could trust, with the City's own words as proof.

### What it does

You type an item, or tap a common one, and Bin It Right shows where it goes as a large slab in that cart's colour, with an icon and a label.
Under it is the City of Long Beach's rule quoted word for word, a link to the City page, and the date the page was saved, plus the City's tips and how to use the destination.
If a word is ambiguous or misspelled ("battery" could be alkaline or lithium-ion), it asks "Did you mean" instead of guessing.
If none of the City rules in the app match ("aluminum foil"), it says "No official rule found in this app" and gives the City's email, phone and a ready-made gap report, because the City may have guidance the app does not include.
In Spanish mode it shows the City's own Spanish wording where the City publishes it, and says when a rule exists only in English, instead of machine-translating an official rule.
You can browse all 62 rules by destination, see the 20 saved City sources, and open "Why this answer" to see exactly how your words were matched.
It works offline after the first visit and has no accounts, no tracking and no AI model at runtime.

### How I built it

I built Bin It Right overnight by directing AI coding agents, and I want to be clear about that.
A Claude agent acted as lead: it read the hackathon rules, fetched the City pages, wrote the specification and every rule in the dataset, built the app, and reviewed and integrated all other work.
GPT 6.1 Sol (through Codex) wrote the matching engine and the dataset validator with tests, Gemini 4 Argon (through Antigravity) made the mock-ups, adapted the UI components and drafted the interface copy, and Grok 4.7 (through Cursor) audited every rule against the saved City pages.
The data is the core.
A fetch script saves each City page or PDF with its URL, fetch time, SHA-256 hash and a text snapshot.
Each rule stores its destination, the exact quotes it rests on, and the search terms that select it.
Tests fail the build if any rule has no source, if any quote is not found word for word in its saved page, if a Spanish label is not the City's own wording, or if one search term could select two rules.
Matching is deterministic: it normalises the text (accents, case, filler words, plurals), looks for an exact match in a hand-written term list, and otherwise scores close terms with Damerau-Levenshtein similarity and word overlap, offering anything above a fixed threshold only as "Did you mean".
The front end is React 19, TypeScript, Vite and Tailwind CSS v4, with components from Aceternity UI, Magic UI, React Bits and shadcn/ui, and it is deployed to GitHub Pages by GitHub Actions.

### Challenges I ran into

The hardest part was saying no.
Many natural search words map to more than one City rule: "AA battery" can be alkaline (battery drop-off) or lithium (hazardous waste event), "paper" can be clean paper (blue cart) or food-soiled paper (green cart).
An independent audit of the dataset against the saved pages flagged terms like these, and I removed or narrowed them so the app asks instead of guessing.
Some items the City excludes from a cart without saying where they do go, like cacti and tree stumps; for those the app says what the City says and points to the City's contact route.

### Accomplishments that I'm proud of

Every answer can be checked: the quote, the page and the date are always on screen, and an automated test proves each quote is really on that page.
The app is honest about what it does not know.
It is accessible: large touch targets, labels and icons as well as colours, screen-reader announcements, reduced motion support, and the City's own Spanish.

### What I learned

A trustworthy answer needs provenance built into the data model from the start, not added at the end.
Fuzzy matching is useful for suggestions but dangerous as an answer, so the app keeps the two apart.

### What's next

- Share the gap reports with the City of Long Beach and add rules as the City publishes them.
- Add the City's drop-off locations and dates as structured data, with a reminder when they change.
- Have a native Spanish speaker review the interface text.
- Package the fetch, snapshot and validation pipeline so other cities that publish their rules can be added.

## Built with

react, typescript, vite, tailwindcss, motion, vitest, testing-library, github-actions, github-pages, aceternity-ui, magic-ui, react-bits, shadcn-ui

## Try it out links

- Live app: https://bananatruck.github.io/bin-it-right/
- Code: https://github.com/bananatruck/bin-it-right

## Video demo link

TO FILL: the YouTube or Vimeo URL after uploading `submission/video/bin-it-right-demo-captioned.mp4` (about 2:38, recorded from the live site by `pnpm demo:record`) with `submission/video/bin-it-right-demo.srt` as its English subtitles.

## Image gallery

Upload from `docs/screenshots/`, in this order:

1. `phone-answer-pizza-box.png`: an answer with the City's quote and source.
2. `phone-did-you-mean-battery.png`: "Did you mean" for an ambiguous word.
3. `phone-no-rule.png`: "No official rule found in this app" with the City's contact route.
4. `phone-spanish-answer.png`: the City's own Spanish wording.
5. `desktop-home.png`: search and the full rule list.
6. `desktop-hazardous.png`: a hazardous waste answer with tips.

Thumbnail: crop `phone-answer-pizza-box.png` to the green slab, or use `desktop-home.png`.
