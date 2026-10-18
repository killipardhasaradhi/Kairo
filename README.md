# Kairo: Someone Is Resetting Tomorrow

An interactive character portfolio disguised as a mystery you can investigate.
Built for **haX.baby: Baby's First Website** (Oct 17-19, 2026), **Track 2: Your Own Baby (original character)**.

Kairo is an original character: a *Veyling*, a being born between two moments in time, who wanders forgotten dreams and keeps the lost memories nobody else can find. Their lantern holds a clock with no hands, and tonight it started ticking backward.

No framework and no build step: plain HTML, CSS and JavaScript.

## Run it

```bash
python3 -m http.server 8000   # or any static server
# open http://localhost:8000
```

It is fully static, so it deploys as-is to GitHub Pages, Netlify, Vercel or Cloudflare Pages (publish the repository root).

## What is in it

**Character portfolio (always reachable, no story required)**
- Midnight landing page, Meet Kairo profile, expression sheet, turnaround and shadow viewer.
- Character sheet fields: name, species, profession, personality, goal, weakness, lantern, shadow, tagline.

**Three working demos of Kairo's (fictional) inventions**
- **Dream Compass**: clickable map of the story's places, explored vs. unexplored states, suggested next stop. The Door in the Sky unlocks after the story's ending.
- **Memory Archive**: clickable memory fragments, each labelled with its source (lantern, paper bird, drawings, Final Loop book, mirror).
- **Loop Detector**: compares two recordings of the repeating minute and reveals the anomaly (three recordings included).

**Story (8 short scenes, prologue to epilogue)**
- Clues are collected into a Detective Notebook (12 clues). Clues can be connected to each other.
- Trust choice in the Mirror Room changes dialogue and the order the truth is told, never the canonical facts.
- Clock Tower choice: "Reset the clock" is an alternate ending you can return from; "Open the thirteenth minute" is the canonical ending and unlocks the epilogue.
- Hidden Easter egg: click the missing-point star on Kairo's lantern three times.

**Early-web extras**
- Sparkle cursor (mouse only), scrolling marquee, hit-counter odometer, guestbook, click sounds with a mute control, day/night (twilight) palette, and a reversible Chaos Mode.

## Honest notes

- The **guestbook** and the **visit counter** are **local demonstrations**: they are stored in the visitor's browser only, are not shared between visitors, and are labelled that way on the page.
- Sounds are generated with the Web Audio API (no audio files) and are **off by default**, with a visible mute/unmute control.
- Animation can be reduced from the toolbar, and the operating-system "reduce motion" setting is respected.
- Keyboard: all controls are real buttons/links with visible focus; dialogs close with Escape.

## Credits

- **Character art:** TODO before submitting. State exactly how the Kairo character sheet was made (artist name, or the AI image tool used) here **and** in the Credits popup (`js/extras.js`, the "Character art" line). The hackathon requires every art source to be credited.
- **Fonts:** Cinzel, Nunito, Caveat, VT323 (Google Fonts, SIL Open Font License).
- **Everything else** (code, story text, SVG clocks/bell/constellation, sounds) was written for this project. AI coding assistance (Claude) was used while building, which the hackathon rules allow.

The illustrations in `assets/` are crops and cleanups of the single Kairo character sheet.

## Project layout

```
index.html        page structure
style.css         all styles (night + twilight palettes, chaos mode, responsive)
js/core.js        helpers, settings, clue + notebook system, toasts, modal, audio, hero
js/story.js       the eight story scenes, trust choice, clock tower choice
js/demos.js       Dream Compass, Memory Archive, Loop Detector
js/extras.js      sparkle cursor, guestbook, visit counter, credits
assets/           images
```

## Testing done

Automated browser run (Playwright, desktop 1366x800 and mobile 390x844): full story from prologue to epilogue with all 12 clues, alternate then canonical ending, all three demos, Easter egg, theme / sound / chaos toggles, guestbook validation and HTML escaping, no horizontal overflow, no script errors.
Not yet done by hand: testing on a real phone, a Lighthouse score, and a screen-reader pass. Please add real results here if you run them.
