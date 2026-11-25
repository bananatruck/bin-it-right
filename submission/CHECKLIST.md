# Submission checklist: Arbiter Hacks V1, Theme Track

Everything that can be done without logging in is done: the app is live, the repository is public, and the form text is drafted in `DEVPOST.md`.
The steps below need the entrant, because they need a Devpost login or a recording.

## Rules that affect the submission (read on 2026-11-17 from the live hackathon pages)

- Deadline: December 20, 2026 at 9:00pm PST; "Late submissions are not judged."
- Submission period opened October 20, 2026 at 9:00am PDT (https://arbiter-hacks-v1.devpost.com/details/dates, read live on 2026-11-17), so work done on 2026-11-17 is inside it.
- Who can enter: ages 13 and over, students only, companies and professional organizations excluded, all countries except the standard exceptions.
- Teams of 1 to 4; solo entries are allowed.
- "One submission per team, to one track only."
  This entry is for the Theme Track, "Rethinking Waste".
- Theme Track entries must have waste reduction, sorting or recycling as their primary purpose; "Judges will check that the theme is central to the project, not bolted on."
- Required: a public code repository, a demo video "[2 to 3] minutes max, showing the project working" on YouTube or Vimeo, a written description (what it does, how you built it, what you'd do next), and for the Theme Track one paragraph naming the waste problem and how you would measure whether it worked.
- "Missing the repo or the video makes a submission ineligible."
- Theme Track judging: impact on the waste problem 35, technical execution 25, feasibility 20, presentation and demo clarity 20.
- The rules pages say nothing about licenses, pre-existing code, or AI tools.

## Steps for the entrant

1. Log in to Devpost and register for Arbiter Hacks V1 at https://arbiter-hacks-v1.devpost.com/ if not already registered, choosing the Theme Track.
   Registration was not done tonight (agents do not log in or submit on the entrant's behalf).
2. The demo video is already recorded from the live site: `submission/video/bin-it-right-demo-captioned.mp4` (2:46, captions burned in, no voice).
   The video files are git-ignored, so they exist only on the machine that recorded them: if `submission/video/` is missing or empty, or the site changed since, run `pnpm demo:record` first (see `docs/RECORDING.md`).
   Then watch it once.
   Optional: to narrate it yourself instead, read `submission/video/timed-script.md` over `bin-it-right-demo-nocaptions.mp4` and run `scripts/add-narration.sh your-voice.m4a`.
3. Upload the video to YouTube (Public or Unlisted) or Vimeo, add `submission/video/bin-it-right-demo.srt` as the English subtitle track, and copy the link.
4. Start a new project on Devpost and paste each field from `DEVPOST.md`.
   Put the video link in the "Video demo link" field.
   If the form shows questions that `DEVPOST.md` does not cover, answer them plainly; the form could not be seen tonight without logging in.
5. Upload the gallery images listed in `DEVPOST.md` from `docs/screenshots/`.
6. Select the Theme Track, "Rethinking Waste", and paste the Theme Track paragraph.
7. Check the repository link, https://github.com/bananatruck/bin-it-right, opens while logged out.
8. Submit before December 20, 2026 at 9:00pm PST.

## Honest disclosure about AI assistance

The rules do not ask about AI assistance, and they do not forbid AI-built entries or require the work to be done by the student personally.
This project was built overnight by AI coding agents directed by the entrant, and the submission says so in plain words: see "How I built it" in `DEVPOST.md` and "How it was built" in the README.
Keep that disclosure in the Devpost description.
If a judge or organizer asks, the README describes how the project was built and reviewed.

## Before recording, re-check

- The quick picks give the answers the script names: "Pizza box" to the green organics cart, "Battery" to "Did you mean" with household and lithium batteries, "Aluminum foil" to "No official rule found in this app", and in Spanish "Bolsa de plástico" to "Basura".
- The CI badge or Actions tab shows the latest run passing.
- Dated content (household hazardous waste event dates from Dec. 12, 2026, the Treecycling window of Dec. 26, 2026 to Jan. 8, 2027) is still current.
  If not, refresh it in this order:
  1. `pnpm sources:fetch` re-saves the City pages (it changes only `data/snapshots/` and `src/data/sources.json`).
  2. Open the [Treecycling source](https://www.longbeach.gov/lbrecycles/news/2027-holiday-treecycling/) and compare its dates with today's Pacific date and every `lb-treecycling` quote in `src/data/destinations.json` and `src/data/rules.json`.
     Check the drop-off window, currently Dec. 26, 2026 to Jan. 8, 2027, and the separate Jan. 9, 2027 pickup with its 6 a.m. deadline.
     After Jan. 8, update or remove the expired drop-off quote; after Jan. 9, update or remove the expired pickup quotes too.
     If the City still shows the old season, remove the expired quotes rather than re-publishing them with a new fetch date.
     Remove the seasonal rule and destination if no usable current guidance remains, and remove any source that is no longer cited.
     Re-fetching alone does not make dates current, and the date test does not recognize abbreviated months such as `Dec.` and `Jan.`.
  3. `pnpm test`: the date test lists every quoted "Month D, YYYY" date earlier than the day its page was saved, and the provenance test lists any quote the City changed.
  4. Edit those quotes in `src/data/destinations.json` and `src/data/rules.json` so they start at the first date that is still ahead, keeping the City's exact wording.
  5. `pnpm check`, then commit and push to `main`, and wait for the "Deploy to GitHub Pages" run to pass.
  6. Re-record the video with `pnpm demo:record` before uploading.
