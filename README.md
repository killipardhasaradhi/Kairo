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
- Clock Tower now offers three paths: reset the clock (the loop continues), open the thirteenth minute (the canonical ending and epilogue), or keep the lost memory (a distinct Memory Keeper ending that can return to the tower).
- Scene cards show progress (for example, Scene 3 of 8) and plain-language instructions for the action to take.
- Hidden Easter egg: click the missing-point star on Kairo's lantern three times.

**Early-web extras**
- Sparkle cursor (mouse only), scrolling marquee, hit-counter odometer, guestbook, click sounds with a mute control, day/night (twilight) palette, and a reversible Chaos Mode.

## How visitors use the story

1. Choose **Start the mystery** or scroll to **Explore Kairo's World**.
2. Read the short text above the interactive scene.
3. Follow the blue **What to do here** instruction. It tells you the exact object or button to tap.
4. Tap the clock, bird, drawing, book, mirror, or other named item. When a clue is collected, it is added to the Detective Notebook.
5. Use the large gold **next scene** button to continue. The numbered scene buttons can also jump between scenes.
6. Open the notebook from the menu or the floating lantern button. Finding every clue is optional.
7. At the Clock Tower, choose an ending. The epilogue is unlocked by opening the thirteenth minute.

The new **Your first 30 seconds** panel explains the controls in four short steps. **Calm reading mode** reduces visual distractions and saves that preference in the current browser.

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
js/story.js       eight scenes, scene progress, trust choice and three ending paths
js/demos.js       Dream Compass, Memory Archive, Loop Detector
js/extras.js      sparkle cursor, guestbook, visit counter, credits
js/onboarding.js  beginner-friendly start action and calm reading mode
EXPRESSION-PROMPTS.md  prompts for replacing expression portraits
assets/           images
```

## Validation status for this update

- JavaScript syntax checks passed for `core.js`, `story.js`, `onboarding.js`, `demos.js` and `extras.js`.
- A full interactive browser test has **not** been run on this updated package. Please test the eight scenes, all three tower choices, local progress, notebook actions, and mobile layout before treating this as a release.
- Still recommended: test on a real phone, run Lighthouse, and do a screen-reader/keyboard pass.

## Artwork credit reminder

Before submitting to a hackathon, replace the Character art TODO below and in the Credits popup (`js/extras.js`) with the actual artist or AI image tool/source you used. Do not leave the TODO in a final submission.


## Living character and story sound (latest update)
- Kairo's landing-page character is now drawn directly as inline SVG instead of displayed as a character image.
- The pupils follow the pointer/touch position; the character floats and blinks, and a shadow gives a time-lag effect.
- A “Hear Kairo” control plays a locally synthesised lantern/whisper cue. The site's existing Sound toggle must be enabled first; audio is opt-in and no audio files or external service are required.
- Story transitions can trigger quiet synthesized cues (tick, whisper, ominous tone, reveal) while sound is enabled.
- Sounds are abstract effects, not recorded voice acting or spoken dialogue.
- Accessibility: reduced-motion settings suppress the character animation; pointer interaction works on touch screens as well.

## Living Mystery Engine (optional interactive activities)
- Live SVG Kairo on the landing page; pointer-following eyes, blink and shadow movement.
- Optional character reactions, a rewindable three-moment timeline, mirror puzzle and fictional message terminal.
- A map for jumping between story locations, a local-only theory notebook, and a copyable case report.
- Optional generated clock ambience; sound is opt-in and can be stopped or muted.
- First-time visitors can ignore the experiments and follow the main story's step-by-step hints. All interactive cards explain what to do in plain language.
- The new activities run locally in the browser. No AI service, account, server, microphone or camera is used. The guestbook, theory notes and story progress stay in the current browser.
