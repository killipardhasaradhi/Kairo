# Kairo: new expression images

The six expression pictures on the site are currently tiny crops (102x110 px) from the character sheet, so they look almost identical.
Replace them with six real, larger images made with the **same AI image tool** you used for the character sheet.

## How to make them

1. Open your image tool and **attach the Kairo character sheet** (the picture with the turnaround) as the reference image.
2. Use the base prompt below, then add ONE expression line from the list. Make one image per expression.
3. Ask for a **square (1:1)** image, about **1024 x 1024**. Same dark midnight-blue background every time.
4. If the face drifts from Kairo, regenerate. Always keep: white-silver hair, large golden eyes, translucent uneven cyan/violet ears, midnight-blue hood with a star on its tip, golden clockwork details.

## Base prompt (paste first, every time)

> Chibi fantasy character Kairo, exactly as in the attached reference sheet: small poised dream wanderer with silver-white hair, large luminous golden eyes, uneven translucent cyan-and-violet glowing ears, an oversized deep indigo midnight-blue hooded cloak with a star-shaped tip on the hood, restrained gold celestial clockwork trim. Close-up bust portrait, face and shoulders, centered, looking toward the viewer, soft magical night background with a few golden stars, polished anime illustration, same art style and same character design as the reference. Square image. Expression: 

## Expression lines (add one after the base prompt)

**happy.jpg (laughing, natural joy)**
> laughing out loud with genuine joy, eyes squeezed into happy curved crescents, wide open smiling mouth showing a little tongue, rosy blushing cheeks, head tilted slightly back, ears lifted and glowing brighter, small golden sparkles floating around

**curious.jpg**
> curious and intrigued, head tilted to one side, eyes wide and sparkling with a tiny glowing symbol in the pupils, eyebrows raised, small closed smile, one ear perked up higher than the other

**thoughtful.jpg**
> thoughtful and focused, eyes looking down and to the side, one hand raised near the chin, eyebrows slightly drawn together, mouth small and closed, ears resting calmly, soft lantern glow on the face

**determined.jpg**
> determined and brave, eyebrows lowered with confidence, bright steady eyes looking straight ahead, firm slightly smiling mouth, chin lifted, ears swept back, golden lantern light on the face

**sad.jpg**
> sad and remembering a lost friend, eyes glistening with a tear rolling down, eyebrows tilted upward in the middle, small downturned trembling mouth, head slightly lowered, ears drooping, cooler bluer lighting

**surprised.jpg**
> very surprised, eyes wide and round with small pupils, eyebrows high, small round open mouth, hands raised near the cheeks, ears shot straight up, a small glowing star flash behind the head

## Where to put the files

Save each result as a **JPG** with exactly these names and **replace** the old files in the `assets` folder of your GitHub repo:

```
assets/expr-happy.jpg
assets/expr-curious.jpg
assets/expr-thoughtful.jpg
assets/expr-determined.jpg
assets/expr-sad.jpg
assets/expr-surprised.jpg
```

Tips:
- Keep each file under about 150 KB (export as JPG at quality 80, or resize to 768 x 768) so the site stays fast on phones.
- Do not rename them: the site loads them by these exact names, so nothing else needs to change.
- Credit the tool you used in the README and the Credits popup.
