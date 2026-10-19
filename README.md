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

## Update: ideas 1–6 (alive layer)
- **js/world.js** (new): Kairo companion that looks where you hover, idle whisper, memory greeting on return, hidden symbols near the "lantern light", shadow that turns, time tools (slow / speed / rewind, stop the dust), hidden choices (back of the lantern, back of a drawing, a note that exists for seconds), mirror inspection, evidence-aware tower text.
- **js/core.js**: secrets, decisions (flags), clue order, auto-connected clues with a "why" line, clues that read differently by order, pointer-driven star drift, cold tint as danger rises, stereo synthesised sound with volume.
- **Calm mode** removes every timed moment. Everything is stored only in your browser (localStorage).

## Update: ideas 7–12
- **Sound (7):** stereo synthesis, no audio files. Ticking sits in the left ear and speeds up as danger rises; shadow footsteps in the right ear; whisper noise per scene; silence at key moments; a different short theme per path (trust, alone, shadow, released); volume slider and mute.
- **Mirror that lies (8):** blink first, a bell only in the glass, backwards text. Inspecting all three changes the mirror scene and the tower text.
- **Secret map (9):** nine places. The ninth, the Observer's Room, appears after the truth or nine clues.
- **Terminal (10):** an in-fiction terminal with a message timestamped tomorrow, three ciphers whose keys come from collected clues, and a warning that one later scene contains a deliberate false detail you can report. It runs nothing and reads nothing from your device.
- **Report (11):** archetype, ending, stats, report code, downloadable image, share button.
- **Community (12):** compare two report codes inside the browser. If two visitors together hold all 12 clues, a hidden page unlocks. No server and no fake visitor numbers.

## Update: hackathon tiers (all three)
**Tier 1:** cursor/touch-reactive Kairo; scroll-driven story; the Night/Twilight toggle now also changes Kairo's expression and mood; responsive; many hidden Easter eggs.
**Tier 2:** Lullaby Lab (Web Audio music box, 3 tones, 2 lullabies, record and replay, mute switch); Flashlight (page-wide toggle plus a dark-dream panel); Dream Delivery route (SVG path drawn and a lantern moved by scroll); interactive storybook (page-turn animation, swipe and arrow keys); mini-game (Catch the Falling Dreams, plus the memory game and loop detector).
**Tier 3:** 3D WebGL Kairo (hand-written WebGL, no library; drag, pinch, arrows); live wishes wall; localStorage memory and greetings; rule-based chat in Kairo's voice (no AI, no server).

### Turning on the live wishes wall (optional, 2 minutes)
The wall is a Cloudflare Pages Function in `functions/api/wishes.js`. Without setup the guestbook stays device-only and says so.
1. Cloudflare dashboard > Workers & Pages > KV > Create a namespace (any name).
2. Your Pages project > Settings > Bindings > Add > KV namespace. Variable name: `WISHES`. Pick the namespace.
3. Redeploy (push any commit). The Guestbook section will then say "Live wishes wall".
Safety built in: 140-char limit, links/emails/phone numbers/rude words rejected, one post per minute per visitor (only a short-lived hash is kept), reporting hides a wish after 3 reports. You can delete wishes in the KV dashboard.
