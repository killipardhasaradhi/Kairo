# Kairo: Someone Is Resetting Tomorrow

An interactive character portfolio disguised as a mystery you can investigate.
Built for **haX.baby: Baby's First Website** (48-hour online hackathon, 17-19 Oct 2026), **Track 2: Your Own Baby (an original character)**.

**Live site:** https://kairo-b5q.pages.dev/ &middot; **Repo:** github.com/killipardhasaradhi/Kairo

Kairo is an original character: a *Veyling*, a being born between two moments in time. She wanders forgotten dreams and keeps the memories nobody else can find. Her lantern holds a clock with no hands, and tonight it started ticking backward. Someone is resetting tomorrow, and the visitor is the detective.

There is no framework and no build step: plain HTML, CSS and JavaScript. Everything is static, so it deploys as-is.

---

## 1. The idea in one minute

A normal character portfolio is a page of pictures and stats. This one is a place you *do things in*.

- You can read it quickly as a portfolio (profile, expressions, turnaround, three inventions).
- Or you can investigate it: eight story scenes, twelve clues, thirteen secrets, a detective notebook that connects clues for you, a fictional terminal with ciphers, a secret ninth place on the map, and an ending that depends on what you noticed.
- Kairo herself is alive: she looks where your cursor goes, remembers you when you return, and talks back.

The story never requires finishing everything. A visitor who only wants the portfolio can skip the story from the first screen.

## 2. How to explore it (for judges and visitors)

1. **Landing page:** move your mouse (or drag your finger) over Kairo. Her head tilts and her shadow moves first. The star on her lantern is clickable.
2. **Meet Kairo / Portfolio:** profile, six expressions, turnaround, shadow, and three working demos (Dream Compass, Memory Archive, Loop Detector).
3. **Explore the story:** 8 scenes in a scrolling view (or switch to Step view). Every scene says "What to do here". Gold buttons marked with a star are clues. They are saved to the Detective Notebook (the round lantern button at the bottom-right).
4. **Dream Route:** scroll this section and a lantern travels along an SVG route through all eight places.
5. **Dream Lab:** live SVG Kairo who watches your cursor, lullaby music box, flashlight in the dark, a falling-dreams game, and a chat with Kairo.
6. **Map and Report:** the secret map (the ninth place appears once you understand the truth), your personal report, a share code, and a two-visitor comparison.
7. **Guestbook:** a shared wishes wall if the optional backend is switched on, otherwise a clearly labelled local guestbook.

You do not need to find everything. The "Secrets" list in the notebook shows hints for what you missed.

---

## 3. Everything that was built, A to Z

### 3.1 Character portfolio (always reachable)
- Midnight landing page with a hero that tilts toward the pointer and has a moving shadow.
- Character profile: name, title, species, profession, appearance, personality, goal, weakness, lantern, shadow, tagline.
- Expression viewer with six real expressions (curious, happy, thoughtful, determined, sad, surprised), turnaround (front, side, back) and shadow views.
- Three fictional inventions with working demos:
  - **Dream Compass:** a map of the story places with explored/unexplored states and a suggested next stop.
  - **Memory Archive:** memory fragments, each labelled with its source.
  - **Loop Detector:** compare two recordings of the repeating minute and find the anomaly.

### 3.2 The story (8 scenes)
Prologue (the lantern), Stillhour, the workshop, the Library of Unwritten Days, the mirror room, the truth, the clock tower, and the epilogue.
- **Scroll view** (default, with a progress rail and parallax) and **Step view** (one card at a time). The choice is remembered.
- **12 canonical clues** collected into the Detective Notebook, and clues can be connected to each other.
- **Two real endings.** Resetting the clock keeps the loop (you can go back and choose again). Opening the thirteenth minute is the canonical ending and unlocks the epilogue.
- The trust choice in the mirror room changes the order the truth is told, never the canonical facts.

### 3.3 The "12 ideas to make Kairo unforgettable" (all implemented)
1. **Kairo notices the visitor.** A companion face follows what you hover, blinks, whispers when you go idle ("You're still here. I thought time had taken you too."), and once something follows your cursor a step behind it.
2. **The world reacts to the cursor.** Stars drift with the pointer, a faint lantern light follows it, six hidden symbols glow only near the light, the page tints colder as danger rises, and the shadow at Kairo's feet can be turned.
3. **A real detective investigation.** Clues auto-connect when you hold both halves, each link explains *why* it fits, clues read differently depending on the order you found them, and there is a theory board.
4. **Time as a mechanic.** Slow, speed up and rewind time in Stillhour, make the library dust stand still, and catch a note that exists for only a few seconds. Calm mode removes every timed moment.
5. **Kairo remembers you.** Returning visitors are greeted according to where they stopped ("You came back. Last time, you left the clock running.").
6. **Hidden choices.** Turn the lantern over, turn a drawing over, whisper "for when I forget why" at the tower. The ending text reflects what you found.
7. **Sound that tells the story.** Everything is synthesised in the browser, no audio files. A tick in your left ear speeds up with danger, shadow footsteps in the right ear, whispers per scene, silence at key moments, a short theme per path, volume slider and mute. Sound is off by default.
8. **The mirror that lies.** The reflection blinks before Kairo, holds a bell the room does not have, and writes backwards. Inspecting all three proves it is not her.
9. **A secret map.** Nine places on a map of an eight-scene story. The ninth, the Observer's Room, is in no scene.
10. **A message that should not exist.** A fictional in-world terminal: a message timestamped tomorrow warns you not to trust the next scene you open (that scene then contains one deliberate false detail you can report). Three ciphers (ROT13, a mirrored line, A1Z26) whose keys come from clues you collected. The terminal runs no real commands, reads nothing from your device, and says so.
11. **A personal ending and report.** An archetype (for example The Witness, The Skeptic, The Believer, The Seeker), your ending, stats, a report code, a downloadable report image, and a Share button.
12. **A secret community mystery, done honestly.** Paste another visitor's report code to compare stories and see where they split. If your two sets of clues together cover all twelve, a hidden last page unlocks. There is no fake server and no invented visitor numbers.

### 3.4 Hackathon tiers (all three covered)
| Tier | Requirement | Where it is |
|---|---|---|
| 1 | Character reacts to cursor, with touch fallback | Hero tilt, companion gaze, live SVG Kairo |
| 1 | Scroll-driven story | Scroll view with chapters and progress rail |
| 1 | Day/night or mood toggle changing expression and palette | Night/Twilight toggle also changes Kairo's expression |
| 1 | Responsive layout | Tested at 390 px and 1366 px |
| 1 | One hidden Easter egg | 13 secrets, starting with the lantern star |
| 2 | Lullaby Lab with real audio and a mute switch | Dream Lab: music box (3 tones, 2 lullabies, record and replay) |
| 2 | Flashlight cursor | Header toggle plus the dark-dream panel |
| 2 | Dream Delivery map animation | SVG route drawn by scroll, lantern moving along it |
| 2 | Interactive storybook | Final Loop book with page-turn animation, swipe, arrow keys |
| 2 | Mini-game | Catch the Falling Dreams, plus memory game and loop detector |
| 3 | 3D / WebGL model | Live SVG Kairo (main) and an experimental raw-WebGL 3D view |
| 3 | Live guestbook with a backend | Cloudflare Pages Function with KV (optional switch-on, see section 6) |
| 3 | Character remembers the visitor | localStorage memory and greetings |
| 3 | Character chats back | Rule-based chat in Kairo's voice (no AI, no server) |
| 3 | Lighthouse 90+ | **Not measured yet**, see section 8 |

### 3.5 The live SVG Kairo
`js/kairo-live.js` draws Kairo as an SVG: the indigo hood with a gold star and a floppy star-charm tip, silver-lavender hair, golden star-sparkle eyes, uneven cyan and violet glowing ears, and the brass lantern with a handless clock.
- Pupils, head, ears and cloak follow the pointer or a finger at different speeds.
- She blinks, wanders with her eyes when idle, is startled if you come very close to her face, and smiles if you stay on her.
- Tap an ear (wiggle and sparkles), the hood star (stardust), the lantern (flare and bell), or her cheeks three times (ticklish).
- Six mood buttons; her mood also follows the Night/Twilight toggle.
- Keyboard users can reach the ears, star and lantern with Tab.

### 3.6 Early-web extras
Sparkle cursor (mouse only), scrolling marquee, an odometer visit counter, click sounds, a reversible Chaos Mode, and a retro guestbook.

---

## 4. Honest notes (nothing here is faked)

- The **visit counter** counts visits from *this browser only* and is labelled that way.
- The **guestbook** is local to the visitor's browser. It only becomes a shared wall if you switch on the optional Cloudflare KV backend, and then the page says "Live wishes wall" and explains the safety rules.
- The **terminal** is fiction. It cannot touch the visitor's device.
- The **community comparison** works between two codes inside the visitor's own browser. There is no leaderboard.
- The **chat** is rule-based, not AI. The page says so.
- Memory (greetings, secrets, flags, theories) lives only in `localStorage` under keys that start with `kairo:`. The notebook's "Clear notebook" button resets the story state.
- Sounds are off by default, with a visible mute control. The operating-system "reduce motion" setting is respected and there is a Motion toggle, a Calm mode, and a volume slider.

## 5. Accessibility and safety

- All controls are real buttons or links with visible focus. Dialogs close with Escape. Live regions announce clues and toasts.
- Reduced motion is respected (no continuous animation, no flip animations, no falling dust).
- The dark-dream flashlight panel lists its hidden words for screen readers and works with arrow keys.
- User-written text (guestbook, wishes, theories, chat) is always inserted as text, never as HTML. Links, emails and phone numbers are rejected in guestbook text.

---

## 6. Run it, deploy it, optional backend

```bash
python3 -m http.server 8000   # or any static server
# open http://localhost:8000
```

Deploy by publishing the repository root on Cloudflare Pages, GitHub Pages, Netlify or Vercel. The live site uses **Cloudflare Pages** (project `kairo`, URL `kairo-b5q.pages.dev`).

### Turning on the live wishes wall (optional, about 2 minutes)
The wall is a Cloudflare Pages Function in `functions/api/wishes.js`. Without setup the guestbook simply stays device-only.
1. Cloudflare dashboard > Workers & Pages > KV > Create a namespace (any name).
2. Your Pages project > Settings > Bindings > Add > KV namespace. Variable name: `WISHES`. Pick the namespace.
3. Redeploy (push any commit). The Guestbook section will then say "Live wishes wall".

Built-in safety: 140-character limit, links, emails, phone numbers and rude words are rejected, one post per minute per visitor (only a short-lived hash is kept, never the IP itself), and a wish is hidden after 3 reports. Wishes can be deleted from the KV dashboard.

## 7. Project layout

```
index.html            page structure (landing, meet, story, route, portfolio, notebook, lab, map/report, guestbook)
style.css             all styles (night + twilight palettes, chaos mode, responsive, every feature)
js/core.js            helpers, settings, clue and notebook system, secrets and flags, auto-connect, stereo audio engine, hero
js/story.js           the eight story scenes, trust choice, clock tower choice, storybook
js/scroll.js          scroll-view chapters, progress rail, parallax
js/world.js           companion, gaze, hidden symbols, time tools, hidden choices, mirror that lies, memory greeting
js/archive.js         secret map and ninth place, terminal and ciphers, report, share code, comparison
js/tiers.js           mood link, flashlight, Lullaby Lab, Dream route, falling-dreams game, rule-based chat
js/kairo-live.js      live SVG Kairo
js/kairo3d.js         experimental raw-WebGL 3D view (no library)
js/demos.js           Dream Compass, Memory Archive, Loop Detector
js/extras.js          sparkle cursor, guestbook (local and live), visit counter, credits
functions/api/wishes.js   optional Cloudflare Pages Function for the live wishes wall
assets/               images (hero, backgrounds, six expressions, turnaround, shadow, locations, icons)
EXPRESSION-PROMPTS.md the prompts used to make the six expression images
```

## 8. Testing

Automated browser runs (Playwright with Chromium, desktop 1366x800 and mobile 390x844) covered:
- the full story from prologue to both endings with all 12 clues, the three demos, the Easter egg, and the theme, sound, motion, chaos, calm and flashlight toggles;
- the companion, hidden symbols, shadow turn, time tools, mirror inspection, auto-connected clues and the false-detail scene;
- the terminal (all three ciphers), the ninth place, report code, comparison and invalid-code handling;
- Lullaby Lab (play, mute, record), dark dreams, the falling-dreams game, chat, the Dream route, the storybook flip, the live wishes wall (against a stand-in server), the WebGL view, and the live SVG Kairo's gaze;
- no horizontal overflow and no script errors (apart from the expected missing `/api/wishes` when no backend is attached).

**Performance hygiene done by hand:** small 128 px and 256 px copies of the expression images are used for the mood chip, companion, scroll chapters and thumbnails (the 512 px originals only load in the big viewer), below-the-fold images are lazy-loaded, every image has width and height, there are no external libraries, and fonts use `display=swap`.

**Not done yet:** a Lighthouse run, testing on a real phone, and a screen-reader pass. Please add real results here if you run them.

---

## 9. How it was built, and what went wrong along the way

This was built in a long working session with an AI coding assistant (Claude), directed by the creator, who chose the character, the story and every feature, and made the artwork. Being honest about the struggles is part of the project.

1. **Understanding the brief.** The hackathon has two tracks and several tiers, and it was not obvious at first what a "character website" should actually be. The first hours went into getting the brief, the tracks and the scoring tiers clear before choosing Track 2 and the Kairo idea.
2. **Hosting detours.** The first attempt was a paid Render "Web Service" (wrong for a static site); it should have been a free static site. Then GitHub Pages, then Cloudflare Workers (which gives `workers.dev`, not the `pages.dev` address we wanted). Only Cloudflare Pages gives a `pages.dev` link. The name `kairo` was taken, so the live link is `kairo-b5q.pages.dev`.
3. **"How do I even use this?"** After the first version the creator loved the story but could not tell how to unlock clues. That led to the "How to explore" box, a "What to do here" line in every scene with a live clue counter, and the scroll view as a more visual way to read it.
4. **All the expressions looked the same.** The first six expression images were tiny 102x110 crops of one character sheet, so every face matched. The assistant cannot generate artwork in its environment, so the creator made six genuinely different faces (laughing, thinking, determined, sad, surprised, curious) in an image tool, and they were cropped to 512 px squares and renamed.
5. **Small bugs found by testing.** A hover animation made buttons "unstable" and broke automated clicks (the lift effect was removed), toasts piled up on mobile (capped at two), a label read "Open now Open demo" (fixed in CSS), and a test selector matched two "View Portfolio" links.
6. **A lost workspace.** Midway through, the build environment was reset and the working folder disappeared. The project had to be rebuilt from the last delivered zip and attachments, and the test scripts rewritten.
7. **Big scope, limited time.** The "12 ideas" and the three hackathon tiers were a lot for a 48-hour event. Features were built in batches and tested after each one, and the stereo sound engine, secrets/flags system and auto-connecting clues in `core.js` were designed first so later features could reuse them.
8. **No libraries available.** The sandbox could not download Three.js, so the 3D view is hand-written WebGL. It worked but did not look much like Kairo, so a hand-drawn live SVG Kairo became the main interactive character, with the WebGL view kept as an experimental extra.
9. **No backend, honest answers.** A truly live guestbook, community and visitor counter need a server. Rather than fake them, local features are labelled local, and a real optional Cloudflare backend was written for the guestbook.
10. **Keeping it honest and accessible.** Early on, several early-web features (counter, guestbook) were rewritten as labelled local demonstrations, and the terminal and chat were made clearly fictional. Sound stays off by default and motion can be reduced or removed.

## 10. What I would do with more time
- Run Lighthouse and fix whatever it flags, test on a real phone, and do a screen-reader pass.
- Replace the SVG hand-drawing with layered artwork cut from the real illustration, so the live Kairo matches the character sheet exactly.
- Switch on the live wishes wall with moderation review, and add the Dream Lab's lullabies to the story scenes.
- Add Chapter Two, which the epilogue promises ("Chapter Two has been waiting for you.").

## 11. Credits

- **Character, story, world and design direction:** the creator. Kairo, Stillhour, the Veyling and every story beat are original to this project.
- **Character art:** made by the creator with **ChatGPT** (OpenAI's image generation), from the creator's own Kairo character design. This covers the character sheet and the six expression images. Crops and cleanup for the web were done afterwards. The same credit appears in the site's Credits popup.
- **Code:** plain HTML, CSS and JavaScript, written with the help of Claude (Anthropic), an AI coding assistant, which the hackathon rules allow.
- **Fonts:** Cinzel, Nunito, Caveat and VT323 from Google Fonts, all under the SIL Open Font License.
- **Sound:** synthesised in the browser with the Web Audio API. No audio files.
- **Libraries:** none.

Kairo is an original character. This site uses no existing characters or IP.
