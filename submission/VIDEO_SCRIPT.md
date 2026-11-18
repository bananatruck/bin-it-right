# Demo video script

The rules ask for "A demo video, [2 to 3] minutes max, showing the project working", uploaded to YouTube or Vimeo and linked.
This script runs about 2 minutes 30 seconds when read at a calm pace.
Record the live site, https://bananatruck.github.io/bin-it-right/, on a phone-sized browser window (390 by 844) with the voice-over below.
Every on-screen answer named here was checked against the live build; re-check them on recording day in case the data was refreshed.

## 0:00 to 0:20 - the problem

On screen: the Bin It Right home page, the rotating headline.

Voice: "In Long Beach, every home has three carts: blue for recycling, green for organics, and trash.
The City publishes detailed rules for what goes where, but they are spread across flyers and a dozen web pages.
When people guess, recycling and compost get contaminated.
Bin It Right answers one question, which bin, using only the City's own published words."

## 0:20 to 0:55 - an answer with its proof

On screen: type "pizza box", press Enter.
The green slab reads "Green organics cart"; scroll to the quote "Food-soiled paper (napkins, paper towels, pizza boxes)".

Voice: "Pizza box.
It goes in the green organics cart.
Below the answer is the City's rule, word for word, with a link to the City page and the date that page was saved.
Every answer works like this.
The app never writes its own sorting advice; the rule you read is the City's text, quoted from an official City of Long Beach page."

On screen: tap the source line under the quote ("City of Long Beach, Residential Organics (Green Cart) Collection, saved ...") to show the real City page, then return.

## 0:55 to 1:20 - the honest cases

On screen: type "battery".

Voice: "Some words are ambiguous.
'Battery' could mean an AA battery, which goes to a battery drop-off, or a lithium-ion battery, which the City sends to a hazardous waste event.
So Bin It Right does not guess; it asks which one you mean."

On screen: tap the lithium suggestion, show the amber slab.
Then type "aluminum foil".

Voice: "And when the City has not published a rule, it says so: no official rule found.
It gives the City's email and phone number, and a ready-made gap report you can send them."

## 1:20 to 1:45 - Spanish and accessibility

On screen: switch the language toggle to ES, search "bolsa de plástico".

Voice: "The City prints its cart guidelines in English and Spanish.
In Spanish mode, Bin It Right shows the City's own Spanish wording.
Where the City only publishes English, it shows the English rule and says so, instead of machine-translating an official rule.
Buttons are large, everything works with a keyboard and a screen reader, and the app keeps working offline after the first visit."

## 1:45 to 2:15 - how it is built

On screen: open "Why this answer" under a result, then the "Sources" section.

Voice: "Under the hood there is no model call and no server.
Matching is deterministic: it normalises your words, checks a list of synonyms that is written out in full, and only offers fuzzy matches as 'did you mean'.
This panel shows exactly why it gave this answer.
The dataset has 62 rules from 20 saved City pages, each stored with its address, fetch date and a hash.
A test fails the build if any rule loses its source or if any quote stops matching the saved page word for word."

## 2:15 to 2:30 - impact and next steps

On screen: the numbers section, then the GitHub repository.

Voice: "Success is measurable: fewer wrong-bin items in the City's cart audits, and a falling share of questions with no official rule.
Next, I want to give the City the gap reports, add their bulky-item and drop-off maps, and offer it to other cities that publish their rules.
Bin It Right: the City's rules, in your pocket, with the receipts."
