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
2. Record the demo video from `VIDEO_SCRIPT.md` on the live app, https://bananatruck.github.io/bin-it-right/.
   Keep it between 2 and 3 minutes; the script runs about 2 minutes 30 seconds.
   The script narrates in the first person, so it should be the entrant's own voice.
3. Upload the video to YouTube (Public or Unlisted) or Vimeo, and copy the link.
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
If a judge or organizer asks, the agents and what each one did are listed in the README.

## Before recording, re-check

- The quick picks give the answers the script names: "Pizza box" to the green organics cart, "Battery" to "Did you mean" with household and lithium batteries, "Aluminum foil" to "No official rule found", and in Spanish "Bolsa de plástico" to "Basura".
- The CI badge or Actions tab shows the latest run passing.
- Dated content (household hazardous waste event dates, the Treecycling window of Dec. 26, 2026 to Jan. 8, 2027) is still current, or run `pnpm sources:fetch` and `pnpm check` to refresh it.
