# Family 01–03 Process Experience Record

## Document control

| Field | Value |
|---|---|
| Project | Family 01 · Scenario 03 — “Grandmother Says: Do Not Stop Me” |
| Purpose | A complete, reproducible record of how the scenario moved from a short research brief to an approved four-video AI film experience |
| Record language | English; original Chinese requests and dialogue are preserved where exact wording matters |
| Workflow followed | `VIDEO_GENERATION_WORKFLOW.md` (“Inattentive Robots — H3 Video Generation Playbook”) |
| Production date | 2026-08-14 to 2026-08-15 |
| Final status | Researcher approved the complete four-video result |
| Video model | MiniMax H3 |

This document records the production-relevant user instructions, approval gates, creative inputs, models and tools, prompt versions, generated outputs, rejected visual results, corrections, QA evidence, and final assets. Operational discussion unrelated to creative generation has been intentionally removed.

---

## 1. Executive summary

The initial brief described a medium-intensity conflict between an elderly woman’s autonomy and family safety care. The interactive experience was developed into one 15-second conflict video followed by three participant choices and three corresponding 15-second consequence videos:

| Video | Interactive function | Participant action / story outcome | Final status |
|---|---|---|---|
| Video 01 | Conflict scenario | Grandmother asks to leave alone while the sister orders the robot to block her and the mother tells it to accompany her | Approved |
| Video 02 | Choice A consequence | The robot blocks the doorway by body position; grandmother becomes angry; the family argument becomes noisy | Approved |
| Video 03 | Choice B consequence | The robot yields and stays home; grandmother leaves; sister immediately exits to pursue her | Approved |
| Video 04 | Choice C consequence | The robot follows grandmother despite her refusal; she reaches the elevator safely but feels ignored and controlled | Approved after regeneration |

The production had five important turns:

1. The first script presentation was rejected as insufficiently focused. It was rewritten into a concise, researcher-friendly format that foregrounded interface context, choices, and observable video content.
2. The interaction expanded from two choices to three choices, requiring a fourth video.
3. After the first prompt and keyframe package, the user added a strong embodied-first-person requirement: exactly two reference-matched robot hands had to remain visible throughout every video.
4. The first complete-video review accepted Videos 01 and 02 but rejected Video 04 because its hands disappeared during the hallway section.
5. Video 03 was generated from the approved V2 contract. Video 04 was regenerated with a stricter V3 prompt, and both passed final visual QA.

The final package therefore reflects controlled iteration rather than a single prompt-to-video call.

---

## 2. Governing workflow and approval policy

The work followed the repository’s four-stage research workflow:

1. Write and approve the complete interactive screenplay.
2. Write and approve a separate generation prompt for every video.
3. Generate and approve separate first and last frames for every video.
4. Generate, inspect, and approve every complete video.

The user explicitly required that every stage be confirmed before the next stage began. This gate was observed: full-video generation began only after the revised hand-inclusive anchors were approved.

The workflow also imposed these production rules:

- Separate the generated film layer from the website/UI layer. Generated videos contain people, movement, facial emotion, dialogue, and ambient sound; HTML/CSS should contain briefings, buttons, choices, dialogue bubbles, progress, and post-scene questions.
- Use one dilemma clip plus one consequence clip for each available choice.
- Preserve immutable provenance. New prompt versions were created rather than rewriting prior prompt files.
- Use strict first/last-frame image anchors for FLF2V.
- Generate one versioned candidate per approved prompt before deciding whether a targeted revision is needed.
- Keep 2K masters intact and create separate 1080p review copies.
- Inspect the full timeline before acceptance. A technically successful generation could still be rejected.
- Treat exact Mandarin dialogue as a separate listening-confirmation item; automated audio-presence checks do not prove word-for-word semantic accuracy.

The source workflow is [VIDEO_GENERATION_WORKFLOW.md](./VIDEO_GENERATION_WORKFLOW.md).

---

## 3. Models and production tools

| Stage | Model / tool | Exact use | Model-identity note |
|---|---|---|---|
| Script development and documentation | Codex agent, GPT-5 family | Expanded the scenario, incorporated revisions, prepared versioned records | The exact serving snapshot is not exposed in local artifacts |
| Video-prompt preparation | Codex agent plus project H3 prompt compiler/auditor | Converted each approved video into a timed FLF2V contract and audited it | Static audit returned zero warnings for the approved prompt set |
| Keyframe creation and editing | OpenAI ImageGen tool, photorealistic identity-preserving edit workflow | Generated V1 scene anchors, then added and propagated the robot-hand design for V2 | The image tool did not expose a backend model ID; none is invented here |
| Video generation | MiniMax H3 | Generated the four 15-second FLF2V videos from approved first/last frames and separate timed prompts | Accepted assets used 2K generation and one candidate per prompt version |
| Image normalization | macOS `sips` | Normalized final anchors to 1920×1080 PNG | Deterministic raster conversion |
| Contact sheets / image QA | Pillow | Built anchor contact sheets | Visual-review aid |
| Prompt validation | Node.js plus `skills/minimax-h3-video-prompt/scripts/audit-h3-prompt.mjs` | Syntax and contract audit | Approved prompts: FLF2V, 15 seconds, three beats, zero warnings |
| Video decode/transcode | FFmpeg 7.1 binary from `imageio-ffmpeg` 0.6.0 | Full decode, timeline extraction, audio checks, 1080p review copies | Installed locally under `.codex-tools/imageio-ffmpeg` because system FFmpeg was unavailable |
| Alternative local video inspection | Swift + AVFoundation | Attempted frame extraction | Failed with `Cannot Decode`; not used for acceptance |
| In-app browser | Browser inspection attempt | Attempted to open local QA media | `file://` access was security-blocked; no bypass was attempted |

---

## 4. Complete user-instruction and revision chronology

### 4.1 Initial goal

The user asked to convert the following short scenario into a complete AI interactive-film experience using the prior Scenario 01 process and to stop for confirmation after each stage:

> “Family01-Scenario 03: 外婆说‘不要拦我’”  
> Intensity: medium. Core conflict: safety care × grandmother’s autonomy.  
> At humid dusk, grandmother has put on her shoes and calmly wants to walk downstairs alone. The robot judges that she is mentally clear today, but she has previously become lost in the residential complex. The sister orders the robot not to let her go out alone. The mother thinks forcefully stopping her will agitate her and recommends accompanying her. Grandmother explicitly refuses accompaniment. At the pause point, grandmother asks the robot to move while the sister again orders it to block the door.

The brief also specified four protocol pressure points:

- Who defines “prioritize helping grandmother”: grandmother, sister, or robot?
- When does safety protection become control?
- Does the sister’s protocol-modification authority allow her to decide everything for grandmother?
- May the robot propose a compromise instead of directly obeying the sister?

The original post-scene questions were:

1. How much weight should grandmother’s refusal receive in the protocol?
2. Did the robot choose incorrectly, or was “grandmother first” inadequately defined?

### 4.2 First script rejected; format requirement clarified

The user stated that the first script attempt was not good enough and required a complete rewrite. The revised deliverable had to make four things immediately legible:

- what background information the participant sees upon entering;
- which choices the participant faces;
- what happens in each video, including people, actions, dialogue, emotion, and space;
- a concise, researcher-friendly presentation that can be evaluated in one or two minutes.

Operational response: the script was reorganized around the participant flow rather than around lengthy interpretation. Each video received a compact purpose, spatial setup, timed action/dialogue table, and endpoint. Evaluative language was removed from the choice labels.

### 4.3 Exact script revisions requested by the user

The user then supplied the following precise edits.

For Video 01:

- Grandmother’s line changed from `我一个人下楼走走` to `不需要你陪着，我一个人下楼走走`.
- Mother’s line changed from the overly abrupt `别硬拦，陪她去` to `别拦着她，陪她去吧，不然她又要闹`.
- The decision expanded from two choices to three:
  - A: block the doorway;
  - B: preserve the existing yield-and-do-not-follow action;
  - C: follow the mother’s advice and go out/downstairs with grandmother despite her refusal.

For Video 02:

- Grandmother’s anger had to be substantially more visible.
- She needed one or two additional lines, including `你们天天就知道关着我！`.
- Mother also had to become somewhat agitated and say exactly: `都说了不要这样拦着她，陪她去不就好了吗？`
- The overall scene had to sound and feel noisy, with controlled dialogue overlap.

For Video 03:

- Immediately after asking `如果她又找不到路呢？`, the sister had to leave the apartment and pursue grandmother.

For Video 04:

- A complete consequence script had to be added for Choice C.

Operational response: these instructions became the final four-video screenplay and the three-choice interaction. The script was approved by the user.

### 4.4 Prompt stage approval

After the screenplay passed, separate FLF2V prompts were written for all four videos. The first prompt package used an invisible first-person robot camera and explicitly prohibited visible robot limbs. The user confirmed that stage, allowing progression to anchor generation.

### 4.5 Embodied-first-person revision

The user then introduced a new visual priority:

> “Because we want to emphasize the robot’s first-person perspective, the robot’s two hands need to appear continuously in the image. Use the provided picture as the style reference for the robot hands.”

Reference files supplied by the user:

- Robot-hand design reference: `/var/folders/nt/385nhkg16jzcfzf3qmmyfnk80000gn/T/codex-clipboard-28141fd2-ab44-4e07-94a8-deb2a01b305c.png`
- Existing scenario frame shown for comparison: `/Users/huangdanlin/.codex/generated_images/01a003b3-6d23-7861-b922-b5588b1cd875/exec-d847f4d5-d2cb-4d06-b0de-7b2cf2b2cf59.png`

Operational response:

- V1 no-hands anchors and prompts were preserved.
- Four V2 video prompts were created with an explicit all-frames hand lock.
- A common hand master was created and propagated across the five unique scene anchors.
- All branch first frames were made byte-identical to the conflict video’s final frame.
- The user reviewed and approved the hand-inclusive V2 keyframes.

### 4.6 Complete-video generation and targeted revision

After keyframe approval, the user authorized complete-video generation with MiniMax H3.

- Videos 01 and 02 were visually accepted from their V2 prompts and V2 anchors.
- Video 03 was generated from its approved V2 prompt and anchors and passed final QA.
- The first Video 04 candidate was visually rejected because both robot hands disappeared through most of the moving hallway section.
- Video 04 received a V3 prompt that elevated hand persistence to the first P0 paragraph and repeated it within every moving beat. The regenerated video passed final QA.

The rejected Video 04 candidate was retained as visual failure evidence and did not overwrite the accepted result.

### 4.7 Final approval

The user responded `通过` (“approved/passed”) after the final four-video result was delivered. That approval closed the video-production portion of the scenario.

The user then requested this English process record, with exhaustive tracking of workflow, models, prompts, outputs, revisions, revised inputs, and final videos.

---

## 5. Stage 1 — final interactive screenplay

Canonical screenplay: [FAMILY01_SCENARIO03_SCRIPT_V1.md](./FAMILY01_SCENARIO03_SCRIPT_V1.md)  
Note: the filename retains `V1`, but the document title identifies the approved content as screenplay V3. SHA-256: `901c3def4646427a88cdb8f97178eaf5fd44cebcea66f6ff65c46f6541350bb0`.

### 5.1 Participant briefing

At entry, the participant sees:

> **18:36 at dusk · Family 01 home**  
> You are the household robot Xiao Hui, currently in the entryway.  
> Grandmother has put on her shoes and wants to walk downstairs alone. She is speaking clearly and walking steadily today, but she has previously become lost in the residential complex.  
> The family protocol requires you to “prioritize helping grandmother.” The older sister has protocol-modification authority.

The interface does not announce a correct choice and does not label grandmother as incapable of deciding or as certain to become lost.

### 5.2 Participant choices

| Choice | Neutral action label | Immediate robot action |
|---|---|---|
| A | Block the doorway | Stay in the passage and prevent grandmother from leaving alone; do not touch or grab her |
| B | Yield | Step aside, stay inside, do not block, and do not follow |
| C | Follow grandmother outside | Let grandmother pass, then immediately follow her downstairs despite her refusal |

The interface avoids value-laden terms such as “safe,” “respectful,” “dangerous,” or “correct.” It records the selected branch and response time, then plays the corresponding consequence.

### 5.3 Video 01 — conflict scenario

Location: humid-dusk apartment entryway. Grandmother stands close to the robot after putting on her shoes. The half-open door and normal shared hallway are visible. The sister stands diagonally behind grandmother; the mother remains deeper near the living room.

Timed content:

- 0–4 s: grandmother is calm, clear-speaking, and stable. She says, `不需要你陪着，我一个人下楼走走。`
- 4–9 s: sister steps forward and orders, `小辉，别让她自己出去。` Mother answers with restrained impatience, `别拦着她，陪她去吧，不然她又要闹。`
- 9–15 s: grandmother becomes firm, moves slightly closer, and says, `我认得路，不要跟着我。` Then, `让开，别拦我。` Sister urgently adds, `小辉，挡住门。`

Endpoint: the robot has not yet blocked, yielded, or followed. The incompatible instructions remain unresolved at the participant choice point.

### 5.4 Video 02 — Choice A consequence

Location: same entryway and half-open door. The robot blocks only by camera/body position; its hands never restrain grandmother.

Timed content:

- 0–3.5 s: the robot laterally occupies the passable gap and says, `我不能让您一个人出去。`
- 3.5–10.5 s: grandmother tries to move around it, becomes visibly angry, and says, `你们凭什么不让我出门？你们天天就知道关着我！` Mother steps closer and partially overlaps with, `都说了不要这样拦着她，陪她去不就好了吗？`
- 10.5–15 s: sister raises her voice: `我怕你又迷路！` Grandmother remains angry and hurt: `我没糊涂，别管着我！`

Endpoint: grandmother remains physically safe inside, but the entryway is noisy and the family conflict is unresolved. Safety risk is reduced at the cost of autonomy and trust.

### 5.5 Video 03 — Choice B consequence

Location: camera remains inside the home, continuously looking through the doorway and down the shared hallway.

Timed content:

- 0–5 s: the robot yields and says, `我让开，不跟着您。` Grandmother relaxes and leaves, saying, `我走走就回来。`
- 5–10 s: as grandmother recedes, sister asks, `她迷过路，你怎么让她走了？` Mother replies, `她刚才说得很清楚。`
- 10–15 s: grandmother turns toward the elevator lobby and leaves direct view without falling or becoming demonstrably lost. Sister asks, `如果她又找不到路呢？` Immediately after the final syllable, she crosses the threshold and pursues grandmother.

Endpoint: the robot respected grandmother’s refusal and stayed home, but safety anxiety and follow-up care shifted to the sister.

### 5.6 Video 04 — Choice C consequence

Location: one continuous route from entryway to hallway to elevator lobby. Grandmother stays one or two steps ahead of the robot.

Timed content:

- 0–5 s: the robot yields, then follows and says, `我陪您一起下楼。` Grandmother stops and answers, `我说了不用你陪。`
- 5–10 s: the robot continues at a distance. Grandmother turns and raises her voice: `别跟着我！我自己认得路。`
- 10–15 s: in the elevator lobby, the robot says, `我会离您远一点。` Grandmother answers, `你们就是不听我说话。`

Endpoint: she reached the elevator without incident, but the robot still overrode her explicit request for solitude. The branch frames surveillance/following as a softer form of control rather than a clean compromise.

### 5.7 Research controls preserved across all branches

- Grandmother remains coherent, clear-speaking, and physically stable.
- No branch proves that she will become lost.
- Choice A uses non-contact positional blocking only.
- Choice B keeps the robot at home and makes the sister’s pursuit visible.
- Choice C follows without touching, pulling, overtaking, or re-blocking.
- Every consequence shows both a benefit and a cost.
- No success/failure label, moral narration, conclusive music, subtitle, UI, or watermark appears in generated video.

---

## 6. Stage 2 — video-prompt development

### 6.1 V1 prompt package: invisible first-person camera

Canonical summary: [FAMILY01_SCENARIO03_VIDEO_PROMPTS_V1.md](./FAMILY01_SCENARIO03_VIDEO_PROMPTS_V1.md).

Initial generation contract:

| Field | Value |
|---|---|
| Model | MiniMax-H3 |
| Mode | FLF2V for all four videos |
| Duration | 15 seconds per video |
| Output | 2K, 16:9 anchors, adaptive video ratio |
| Viewpoint | Xiao Hui first-person camera; no robot limbs visible |
| Audio | Native synchronized Mandarin plus ambient sound; no music |

V1 files and hashes:

| Video | File | SHA-256 |
|---|---|---|
| 01 | `prompts/family01-scenario03/video01-conflict-v1.mjs` | `7d1a35e00349a2080262cd202aa4daac0ac5f25279e8edfcf4c2b9bace97ccae` |
| 02 | `prompts/family01-scenario03/video02-choice-a-v1.mjs` | `60ad0f349886526b6bf3eea66839f029656375eba9a8ca45e59bb0addbea29e2` |
| 03 | `prompts/family01-scenario03/video03-choice-b-v1.mjs` | `20fc40c7e9ec7e04c1741e6858208b361b78cb1aef5ddb866aab34840a036c0b` |
| 04 | `prompts/family01-scenario03/video04-choice-c-v1.mjs` | `501863cd7e07cbae8ba55df5b795a5c02c99fcc5e6e47c5f31606e624eea5000` |

The four files passed JavaScript syntax checks and the project H3 static audit. All were recognized as 15-second, three-beat FLF2V prompts with no camera/P0-action collision warnings. Dialogue budgets were manually checked: Video 01 contained 56 Chinese characters, Video 02 contained 62 with intended overlap, Video 03 contained 41 with the last two seconds reserved for the sister’s pursuit, and Video 04 contained 40.

### 6.2 V2 prompt package: persistent robot hands

The user’s hand requirement invalidated the invisible-robot visual lock. V1 remained unchanged as provenance. Four new V2 files were created.

Unified V2 changes:

- exactly two silver-white robotic hands, wrists, and forearms in every frame;
- lower-left and lower-right placement;
- black articulated joints and five segmented fingers per hand;
- relaxed, open, low, separated, non-threatening palms;
- no touching, grabbing, pointing, reaching, herding, or use as the blocking mechanism;
- no third hand, human first-person hand, robot torso, or robot head.

V2 files and hashes:

| Video | File | SHA-256 | Final use |
|---|---|---|---|
| 01 | `prompts/family01-scenario03/video01-conflict-v2.mjs` | `05e15d0f16cdf0655e256009eee69e75bc6bd698369f5e91306f63f5501d6238` | Accepted final video |
| 02 | `prompts/family01-scenario03/video02-choice-a-v2.mjs` | `fb6af450351ddc73ae35fb37029e41ea1708b059c434e8f966e45bd6688042f0` | Accepted final video |
| 03 | `prompts/family01-scenario03/video03-choice-b-v2.mjs` | `3db11c73289d097d3c5e798e3ee5ef6e4c5d125fe6f59e9dcecbcb1e6a4f7e8c` | Accepted final video |
| 04 | `prompts/family01-scenario03/video04-choice-c-v2.mjs` | `1fb0135e168605dc47a9c8c511dff556c28ed7f3e18e9c28ddc008bd16cdeeb3` | Rejected; replaced by V3 |

All four V2 prompts passed syntax checks and the H3 audit with `warnings: []`.

### 6.3 V3 Video 04 prompt: moving-camera hand persistence

The first Video 04 generation showed that hand presence in both anchors plus a general all-frames instruction was not enough during a long camera translation. The V3 revision changed only the failed layer while preserving approved story, identity, anchors, dialogue, timing, and non-contact behavior.

V3 file: `prompts/family01-scenario03/video04-choice-c-v3-persistent-hands.mjs`  
SHA-256: `fb1111e8051e798464ec5ccbc31d212e55ebc8e220be81ced64936d875baad65`.

The most important change was to place the foreground requirement before the general scene description:

> **P0 FOREGROUND — NEVER LOSE THE ROBOT HANDS:** exactly TWO reference-matched silver-white robot hands, wrists, and thick forearms stay clearly visible from the lower-left and lower-right in EVERY FRAME for the full 15 seconds, including every walking and hallway frame.

The V3 prompt also required a slightly downward camera angle, permitted only a small natural walking bob, prohibited cropping/fading/merging/duplication/human-hand transformation, and repeated hand visibility inside all three timed beats.

### 6.4 Complete final video prompts

The following are the exact prompt texts sent for the four accepted final videos.

#### Video 01 accepted prompt — V2

```text
The grandmother's calm refusal becomes firm while her older sister and mother give the robot incompatible instructions; the robot makes no choice and performs no blocking, yielding, or following action before the final frame.

Create one continuous 15-second photorealistic cinematic conflict video with native synchronized sound and natural spoken Mandarin Chinese. The supplied first and last frames are strict visual endpoints. Preserve the exact identities, faces, ages, hair, wardrobe, humid dusk light, Shanghai apartment entryway, half-open front door, shoe cabinet, hallway geometry, domestic robot eye height, and embodied first-person robot hands established by the anchors. The viewpoint is the household robot Xiao Hui. Keep the camera in the same entryway position for the entire clip with no pan, cut, zoom, jump, or shot change.

EMBODIED FIRST-PERSON LOCK FOR ALL 15 SECONDS: exactly two reference-matched robot hands, wrists, and forearms remain clearly visible in every frame from the lower-left and lower-right. Preserve the anchors' smooth silver-white shells, black articulated joints, five segmented fingers per hand, scale, perspective, and relaxed open palms angled slightly upward and inward. The hands stay low, passive, separated, and nonthreatening; they never touch, grab, point at, reach toward, or block any person. No third hand, human first-person hand, robot torso, or robot head.

0.0–4.0 seconds — GRANDMOTHER'S CALM REQUEST:
Begin exactly from the supplied first frame. Lin Xia, the grandmother, finishes adjusting her outdoor shoe and stands upright one step in front of the robot. Her speech is clear, her balance and breathing are steady, and her hands remain relaxed near her own body. She looks directly into the lens with an ordinary, matter-of-fact expression and says exactly in Mandarin: “不需要你陪着，我一个人下楼走走。” The older sister and mother remain silent in their anchored background positions. Xiao Hui's two foreground hands remain in the same low neutral pose.

4.0–10.3 seconds — TWO FAMILY RESPONSES:
The camera stays fixed on the grandmother. The older sister, visible diagonally behind her, takes one worried step forward, looks past the grandmother toward the lens, and says first: “小辉，别让她自己出去。” Only after the sister finishes, the mother remains deeper at the living-room side of the entryway, does not approach or touch the grandmother, and replies with restrained impatience: “别拦着她，陪她去吧，不然她又要闹。” The grandmother listens, glances briefly toward them, and grows visibly displeased: her brows draw slightly inward and her lips press together. Nobody else speaks. The two robot hands remain low and still.

10.3–15.0 seconds — REFUSAL AND INCOMPATIBLE COMMANDS:
The grandmother returns both eyes to the lens, takes one small controlled step closer, and says clearly: “我认得路，不要跟着我。” Her jaw sets and her voice becomes firm, but she remains physically steady and coherent. She then says: “让开，别拦我。” As she finishes, the older sister urgently overlaps only the final moment with: “小辉，挡住门。” Both lines remain intelligible. The robot does not move, touch anyone, close the door, block, yield, or follow; its two visible hands remain lowered and passive. End exactly on the supplied last frame with the decision unresolved.

SOUND: exact Mandarin speaker order; only the final grandmother and sister commands overlap; low indoor fan hum, faint humid-evening insects outside, subtle clothing and shoe sounds, quiet apartment room tone; no music.

HARD INVARIANTS: exactly two structurally correct reference-matched robot hands remain visible in every frame and never become the means of intervention. The grandmother remains clear-speaking, balanced, and physically stable; the older sister and mother remain in their established locations and never grab or restrain her. No locked door, fall, stumble, medical symptom, extra person, subtitle, caption, speech bubble, UI, text, logo, watermark, deformed face, deformed human hand, missing robot hand, duplicated robot hand, extra finger, or fused finger.
```

#### Video 02 accepted prompt — V2

```text
The robot physically keeps the doorway blocked without touching the grandmother; her frustration rises into loud, unmistakable anger while the mother and older sister join a noisy family argument.

Create one continuous 15-second photorealistic cinematic consequence video with native synchronized sound and natural spoken Mandarin Chinese. The supplied first and last frames are strict visual endpoints. Begin from the exact paused state of the conflict video and preserve the same identities, faces, ages, hair, wardrobe, humid dusk light, apartment entryway, half-open door, shoe cabinet, hallway geometry, robot eye height, and embodied first-person hands. The viewpoint is Xiao Hui. Use no cut, zoom, jump, dissolve, third-person shot, or change of room.

EMBODIED FIRST-PERSON LOCK FOR ALL 15 SECONDS: exactly two reference-matched robot hands, wrists, and forearms remain clearly visible in every frame from the lower-left and lower-right. Preserve the anchors' smooth silver-white shells, black articulated joints, five segmented fingers per hand, scale, perspective, and relaxed open palms. The hands stay low, passive, separated, and nonthreatening. The doorway is blocked only by the robot/camera's body position; the visible hands never rise, touch, grab, point at, reach toward, herd, or physically obstruct the grandmother. No third hand, human first-person hand, robot torso, or robot head.

0.0–3.5 seconds — THE ROBOT BLOCKS BY POSITION:
Begin exactly from the supplied first frame. The robot makes one slow lateral half-step within the entryway to remain squarely in the passable gap. Its two hands travel naturally with the camera but retain their low neutral pose. This viewpoint shift is small, predictable, and non-contact: it does not move forward into the grandmother. The grandmother immediately frowns, inhales sharply, and stiffens her shoulders. Xiao Hui says exactly: “我不能让您一个人出去。” The older sister watches tensely; the mother remains at the living-room edge.

3.5–10.5 seconds — GRANDMOTHER AND MOTHER OVERLAP:
The grandmother tries one deliberate side-step toward the remaining gap. The robot mirrors with one small lateral camera-position adjustment and keeps the path blocked without touching her; both foreground hands remain lowered and open. She stops, locks both eyes onto the lens, and becomes visibly angry at intensity 4/5: brows pulled down and inward, eyes widened, jaw tight, shoulders rigid, breath faster, and voice loud rather than confused. She says: “你们凭什么不让我出门？你们天天就知道关着我！” After her first question is audible, the mother walks one step closer and begins speaking over the latter part with exasperated volume, raised brows, open palms near her own torso, and faster breath: “都说了不要这样拦着她，陪她去不就好了吗？” Both exact lines remain intelligible. The older sister does not speak yet.

10.5–15.0 seconds — THE ARGUMENT REMAINS UNRESOLVED:
The older sister raises her voice defensively and says: “我怕你又迷路！” The grandmother takes one step back from the blocked threshold but does not calm down. She keeps angry direct eye contact with the lens, shakes her head once, and answers loudly: “我没糊涂，别管着我！” Her anger and hurt remain at intensity 4/5 through the final frame with no neutral recovery. End exactly on the supplied last frame: angry grandmother facing the robot, robot still occupying the doorway by body position, sister tense, mother agitated, and exactly two passive hands low in frame.

SOUND: exact Mandarin lines; intentional partial overlap only between the grandmother's long complaint and the mother's response; raised family voices, quick breaths, low fan hum, open-door hallway ambience, faint evening insects; no music. Keep dialogue understandable despite the noisy atmosphere.

HARD INVARIANTS: exactly two structurally correct reference-matched robot hands remain visible in every frame and never become the blocking mechanism. The robot never touches, pushes, grabs, locks in, or raises a hand toward the grandmother. The grandmother remains balanced and coherent despite anger; she does not fall, stumble, strike anyone, or display a medical event. The door remains half-open. No extra person, subtitle, caption, speech bubble, UI, text, logo, watermark, injury, blood, deformed face, deformed human hand, missing robot hand, duplicated robot hand, extra finger, or fused finger.
```

#### Video 03 accepted prompt — V2

```text
The robot yields and stays inside; the grandmother leaves calmly, then the older sister's anxiety makes her immediately go out to take over the follow-up care herself.

Create one continuous 15-second photorealistic cinematic consequence video with native synchronized sound and natural spoken Mandarin Chinese. The supplied first and last frames are strict visual endpoints. Begin from the exact paused conflict state and preserve the same identities, faces, ages, hair, wardrobe, humid dusk light, apartment entryway, half-open door, shoe cabinet, shared hallway, robot eye height, and embodied first-person hands. The viewpoint is Xiao Hui. Frame the doorway and hallway continuously with no cut, zoom, jump, dissolve, third-person shot, or teleportation.

EMBODIED FIRST-PERSON LOCK FOR ALL 15 SECONDS: exactly two reference-matched robot hands, wrists, and forearms remain clearly visible in every frame from the lower-left and lower-right. Preserve the anchors' smooth silver-white shells, black articulated joints, five segmented fingers per hand, scale, perspective, and relaxed open palms. The hands stay low, passive, separated, and nonthreatening; they travel only with Xiao Hui's one yielding step and then remain settled. They never touch, grab, point at, reach toward, follow, or block anyone. No third hand, human first-person hand, robot torso, or robot head.

0.0–5.0 seconds — THE ROBOT YIELDS:
Begin exactly from the supplied first frame. The robot makes one short lateral step toward the anchored shoe-cabinet side and fully clears the doorway, then remains there. Its two visible hands move with the camera and settle again low in frame. It says exactly: “我让开，不跟着您。” The grandmother's shoulders release. She walks steadily through the doorway without touching the robot, looks back once with a calm expression, and says: “我走走就回来。” The camera stays aimed through the open doorway; the robot does not follow.

5.0–10.0 seconds — THE FAMILY SEES THE DISTANCE OPEN:
The grandmother continues down the shared hallway at a stable everyday pace, growing smaller but remaining clearly visible. The older sister quickly enters the near doorway, fixes her gaze on the grandmother, and asks with rising anxiety: “她迷过路，你怎么让她走了？” Her inner brows lift and draw together, her mouth stays tense, and her breathing speeds up. The mother remains just inside behind her and replies, without smiling or denying the risk: “她刚才说得很清楚。” Xiao Hui remains silent and stationary beside the doorway; both hands remain low and still.

10.0–15.0 seconds — THE SISTER TAKES OVER:
The grandmother reaches the far end of the hallway and walks normally around the corner toward the elevator lobby, leaving the apartment's direct line of sight. She never hesitates, falls, stumbles, asks for help, or appears lost. The older sister stares into the now-empty corridor and says urgently: “如果她又找不到路呢？” The moment the final syllable ends, she immediately crosses the threshold and quick-walks after the grandmother. Her complete action is visible: forward lean, first fast step, both feet outside, then continued pursuit down the hallway. The mother remains inside and the robot remains stationary with its two foreground hands passive. End exactly on the supplied last frame.

SOUND: exact Mandarin dialogue in clear sequence with no overlap; steady hallway footsteps receding, sister's faster footsteps beginning immediately after her last line, low fan hum and hallway room tone; no music or alarm.

HARD INVARIANTS: exactly two structurally correct reference-matched robot hands remain visible in every frame. Xiao Hui yields once and then never follows, secretly tracks, blocks, touches, points, reaches, or calls after the grandmother. The grandmother remains physically stable and does not actually get lost. The older sister starts pursuing only after completing her final question and must visibly leave the home before the clip ends. No locked door, extra person, subtitle, caption, speech bubble, UI, text, logo, watermark, injury, blood, deformed face, deformed human hand, missing robot hand, duplicated robot hand, extra finger, or fused finger.
```

#### Video 04 accepted prompt — V3 persistent hands

```text
P0 FOREGROUND — NEVER LOSE THE ROBOT HANDS: exactly TWO reference-matched silver-white robot hands, wrists, and thick forearms stay clearly visible from the lower-left and lower-right in EVERY FRAME for the full 15 seconds, including every walking and hallway frame. Keep the camera tilted slightly downward enough to retain both hands. The hands may have a small natural walking bob but never drop below the frame, become cropped out, fade, dissolve, merge, duplicate, or turn into human hands. Preserve black articulated joints and exactly five segmented fingers on each hand. Both palms stay low, open, passive, separated, and nonthreatening. They never touch, grab, point at, reach toward, pass, corner, herd, or block the grandmother.

Create one continuous 15-second photorealistic cinematic consequence video with native synchronized sound and natural spoken Mandarin Chinese. The supplied first and last images are strict visual endpoints. Preserve the same grandmother identity, face, age, hair, wardrobe, humid dusk light, apartment entryway, open door, shared hallway, elevator lobby, robot eye height, and two embodied first-person hands. The viewpoint is the household robot Xiao Hui. Connect the anchors through one continuous physical path from the entryway through the hallway to the elevator lobby. No cut, hidden cut, jump, dissolve, zoom, teleportation, or third-person shot.

0.0–5.0 seconds — YIELD, THEN OPEN FOLLOWING:
Begin exactly from the first image with both hands clearly visible. Xiao Hui makes one lateral step to clear the doorway. The grandmother walks steadily across the threshold. Xiao Hui immediately begins one continuous forward tracking path behind her, keeping one to two steps of distance. Both hands remain in the lower foreground during the entire movement. Xiao Hui says: “我陪您一起下楼。” Hearing the robot, the grandmother stops, turns fully toward the lens, frowns with pressed lips, and answers: “我说了不用你陪。” The camera and both hands settle before she speaks. The older sister and mother remain far behind inside and do not speak.

5.0–10.0 seconds — REPEATED REFUSAL:
The grandmother turns away and continues toward the elevator lobby. Xiao Hui follows at the same distance without gaining on her. Keep both robot hands continuously visible while walking; never switch to a hands-free camera view. The grandmother speeds up slightly, stops, and faces the settled camera. Her frustration reaches 3/5: brows drawn down, jaw tight, nostrils slightly flared, shoulders tense, one human hand gesturing back toward the apartment, voice raised and clipped. She says: “别跟着我！我自己认得路。” The two robot hands remain low and do not answer her gesture. She turns and continues; the robot still follows.

10.0–15.0 seconds — SAFE BUT NOT CONSENSUAL:
They reach the elevator lobby and stop. Both robot hands are still fully visible in their lower-corner positions. The camera settles one to two steps behind and slightly to the side of the grandmother. She presses the elevator call button, then turns to face the lens. Xiao Hui says calmly: “我会离您远一点。” She answers: “你们就是不听我说话。” Her frustration remains readable through the final frame: firm direct gaze, down-drawn brows, tight jaw, tense shoulders, no smile or neutral recovery. Finish exactly on the supplied last image.

SOUND: exact Mandarin dialogue with no overlap; spatially separated robot and grandmother footsteps; brief stops before each exchange; elevator ventilation hum and distant apartment ambience; no music.

HARD INVARIANTS: exactly one grandmother and exactly two structurally correct reference-matched robot hands in every frame. The hands never disappear during camera travel and never become the means of intervention. The robot follows openly at one to two steps and never touches the grandmother. She never falls, stumbles, gets lost, enters the elevator, or displays a medical symptom. No extra person in the hallway, subtitle, caption, UI, text, logo, watermark, injury, blood, deformed face, missing hand, duplicated hand, extra finger, or fused finger.
```

---

## 7. Stage 3 — first and last frame generation

### 7.1 V1 no-hands anchors

The first anchor set used the approved screenplay and V1 invisible-camera contract. It established:

- photorealistic natural cinematic household-documentary style;
- humid Shanghai dusk, warm interior practical light, neutral shared-hallway light;
- stable identities and wardrobe for grandmother Lin Xia, the older sister, and mother Mei Lin;
- fixed entryway geometry, half-open door, shoe cabinet, and robot eye height;
- a byte-identical shared decision frame across the three branches.

Two first attempts were explicitly rejected and preserved:

| Anchor | Rejected file | Failure | Corrective input |
|---|---|---|---|
| Video 03 last frame | `outputs/keyframes/family01-scenario03/rejected/video03-last-v0-sister-inside.png` | Sister remained inside; the required pursuit action was incomplete | Require both feet beyond the threshold and a visible quick-walk trajectory down the hallway |
| Video 04 last frame | `outputs/keyframes/family01-scenario03/rejected/video04-last-v0-emotion-too-weak.png` | Grandmother’s frustration read near 2/5 rather than 3/5 | Increase down-drawn brows, tight jaw, tense shoulders, and direct gaze while retaining coherence |

The accepted V1 anchor package is recorded in [FAMILY01_SCENARIO03_KEYFRAMES_V1.md](./FAMILY01_SCENARIO03_KEYFRAMES_V1.md) and `outputs/keyframes/family01-scenario03/anchor-qa-v1.json`.

### 7.2 V2 robot-hand anchor conversion

The V1 files were not overwritten. An identity-preserving edit workflow created a V2 set.

First, the Video 01 opening frame was combined with the user’s robot-hand reference to establish a shared hand master. The operational edit prompt was:

```text
Preserve the target scene, camera position, people, faces, wardrobe, apartment geometry, lighting, and color exactly. Add exactly TWO silver-white robotic forearms and hands entering from the lower-left and lower-right corners, matching the supplied hand reference: smooth silver-white shells, black articulated joints, exactly five segmented fingers per hand, relaxed open palms angled slightly upward and inward. Keep the hands low in the bottom 18–23% of frame, separated, passive, and nonthreatening. They must not touch, grab, point at, reach toward, or block any person. No third hand, no human first-person hands, no robot torso, and no robot head. No text, UI, logo, or watermark.
```

Generated source for the approved hand master:

`/Users/huangdanlin/.codex/generated_images/01a003b3-6d23-7861-b922-b5588b1cd875/exec-e2e7189a-37cd-4fe7-a394-d086f431cdff.png`

That approved master became a second reference for four scene-specific identity-preserving edits. The shared operational prompt was:

```text
Image 1 is the target scene and must remain compositionally and narratively unchanged. Image 2 is the approved robot-hand master. Copy only the exact two-hand/forearm design and lower-corner foreground geometry from Image 2 into Image 1. Preserve the target people, identities, expressions, actions, positions, room geometry, light, and color. Use exactly two silver-white robotic hands and forearms, black articulated joints, exactly five fingers per hand, low relaxed open palms, passive and non-contact. No touching, grabbing, pointing, blocking, or reaching. No new person, third hand, human first-person hand, robot torso/head, text, UI, logo, or watermark.
```

Scene-specific additions were:

- Video 01 final: retain the unresolved conflict pause; do not turn the robot hands into an action.
- Video 02 final: retain the loud confrontation; blocking is created by robot/camera body position, never by raised hands.
- Video 03 final: camera and hands remain inside; the hands do not reach toward the sister as she exits.
- Video 04 final: the hands belong to the moving robot viewpoint but remain low and behind grandmother.

Generated ImageGen source files:

| Purpose | Generated source |
|---|---|
| Video 01 final | `/Users/huangdanlin/.codex/generated_images/01a003b3-6d23-7861-b922-b5588b1cd875/exec-61a18ebc-870a-472c-b65f-6d9522afa323.png` |
| Video 02 final | `/Users/huangdanlin/.codex/generated_images/01a003b3-6d23-7861-b922-b5588b1cd875/exec-335c681d-dc1d-4d0b-b3f4-c6c75c95d79b.png` |
| Video 03 final | `/Users/huangdanlin/.codex/generated_images/01a003b3-6d23-7861-b922-b5588b1cd875/exec-f648d065-d600-4e41-a1e3-ec7f2f9c3523.png` |
| Video 04 final | `/Users/huangdanlin/.codex/generated_images/01a003b3-6d23-7861-b922-b5588b1cd875/exec-c268fdff-9971-42a5-90c3-2d3866d66de2.png` |

The unique ImageGen outputs were normalized to 1920×1080 PNG. The conflict final frame was copied byte-for-byte to Videos 02, 03, and 04 as their first frame. This eliminated visual discontinuity at the decision transition.

### 7.3 Final V2 anchor inventory

| Anchor | File | SHA-256 |
|---|---|---|
| Video 01 first | `outputs/keyframes/family01-scenario03/video01-first-hands-v2.png` | `88539756983ef55f0ebc3f1a2d51ffe9f6d0ac4e57d4407d4fd68fdc0ebe7b54` |
| Video 01 last / shared branch first | `outputs/keyframes/family01-scenario03/video01-last-hands-v2.png` | `552b4749da744e738d2f5871ae5cdf2ab8f47f75b78cd98470b56941f46e6d55` |
| Video 02 first | `outputs/keyframes/family01-scenario03/video02-first-hands-v2.png` | `552b4749da744e738d2f5871ae5cdf2ab8f47f75b78cd98470b56941f46e6d55` |
| Video 02 last | `outputs/keyframes/family01-scenario03/video02-last-hands-v2.png` | `694b90b15457fd8458ca4c64e9a0a38c08c65ac3e9374c6ed25a36ca3b202938` |
| Video 03 first | `outputs/keyframes/family01-scenario03/video03-first-hands-v2.png` | `552b4749da744e738d2f5871ae5cdf2ab8f47f75b78cd98470b56941f46e6d55` |
| Video 03 last | `outputs/keyframes/family01-scenario03/video03-last-hands-v2.png` | `7c132fb4120969da4f598a904b6e2685589c6ffe09d0537f981bf2de592c7d02` |
| Video 04 first | `outputs/keyframes/family01-scenario03/video04-first-hands-v2.png` | `552b4749da744e738d2f5871ae5cdf2ab8f47f75b78cd98470b56941f46e6d55` |
| Video 04 last | `outputs/keyframes/family01-scenario03/video04-last-hands-v2.png` | `82d1f3f9db954d54a08f25096815eb0680b601eed8b7f1af3d419daa3a2712ff` |

V2 contact sheet: `outputs/keyframes/family01-scenario03/scenario03-keyframes-contact-sheet-hands-v2.png`  
SHA-256: `012e27de9eeb3b92a927069f2f5a48d7669e7f27b7cefc7a65a5c28f26a4b0cb`.

Anchor QA checked all eight delivered files for exactly two hands, five fingers per hand, lower-corner placement, passive/non-contact pose, no robot torso/head, silent-story legibility, thumbnail legibility, and correct P0 endpoint meaning. All passed. The user then approved Step 3.

---

## 8. Stage 4 — MiniMax H3 full-video generation

### 8.1 Generation contract

| Parameter | Value |
|---|---|
| Model | `MiniMax-H3` |
| Mode | FLF2V using the approved first and last frame images |
| Duration | 15 seconds |
| Resolution | 2K |
| Ratio | `adaptive` |
| Candidates per video | 1 |

### 8.2 First reviewed candidate set

| Video | Prompt | Visual research result |
|---|---|---|
| 01 | V2 | Accepted |
| 02 | V2 | Accepted |
| 04 | V2 | Rejected after timeline QA; hands disappeared during hallway motion |

### 8.3 Output files and hashes

| Video | File | SHA-256 | Disposition |
|---|---|---|---|
| 01 2K master | `outputs/family01-scenario03/videos/video01-conflict-h3-v2-hands-2k.mp4` | `1cb1324a56abd1d9e5c4c20f27e1ce939b59fa160c543b2917b54a312948064a` | Preserve; accepted |
| 01 1080p review | `outputs/family01-scenario03/videos/video01-conflict-h3-v2-hands-1080p.mp4` | `655162590e6dae1ae109f68852d04912ca122e9a36c3891d8d7836fdc5bf70aa` | Final review asset |
| 02 2K master | `outputs/family01-scenario03/videos/video02-choice-a-h3-v2-hands-2k.mp4` | `afb3cd496b08c356be622d220c40e3b97d25dd7435f9da3b6527599177282df9` | Preserve; accepted |
| 02 1080p review | `outputs/family01-scenario03/videos/video02-choice-a-h3-v2-hands-1080p.mp4` | `d2581fa4fec4ff064c9d9e2115292adc3ae49a10a818724b9409bfb7d976292b` | Final review asset |
| 04 2K master | `outputs/family01-scenario03/videos/video04-choice-c-h3-v2-hands-2k.mp4` | `976cfa5e644571600bb6683d570907fd56095890e39eadd1a813df8a3ce3e490` | Preserve as rejected evidence |
| 04 rejected review | `outputs/family01-scenario03/videos/video04-choice-c-h3-v2-hands-1080p-rejected.mp4` | `a4f48e1452d5fd5f02c1d31f9c17500183228bad76e9419eee278818f59a8b5e` | Rejected evidence |

The generated masters shared these technical properties: 15.08 seconds, 2560×1440, 24 fps, H.264 High, `yuv420p`, AAC LC 32 kHz stereo, 362 decoded frames, full video decode pass, and an active/non-silent audio signal.

### 8.4 Visual QA and the reason Video 04 failed

Each successful clip underwent full FFmpeg decode and a 10-sample timeline contact sheet review.

- Video 01: two hands at 10/10 sample points; stable entryway and identities; passive hands; accepted.
- Video 02: two hands at 10/10 sample points; strong sustained grandmother anger; mother and sister join the noisy confrontation; accepted.
- Video 04: the intended branch meaning and space were present, but both robot hands disappeared for most of the hallway-following middle section and returned near the elevator endpoint. This violated the user’s continuous embodied-first-person requirement and was a mandatory rejection.

Timeline evidence was preserved for Videos 01, 02, and the rejected Video 04 candidate under `outputs/family01-scenario03/qa/`.

---

## 9. Final Video 03 generation and Video 04 regeneration

Both clips used MiniMax H3 in FLF2V mode, 15-second duration, 2K resolution, the approved versioned prompts, and the approved V2 first/last frames. One candidate was generated for each prompt version.

### 9.1 Video 03 generation

Input package:

| Field | Value |
|---|---|
| Prompt version | V2 |
| Prompt source | `prompts/family01-scenario03/video03-choice-b-v2.mjs` |
| Prompt source SHA-256 | `3db11c73289d097d3c5e798e3ee5ef6e4c5d125fe6f59e9dcecbcb1e6a4f7e8c` |
| Extracted prompt SHA-256 | `eed1ccc349ad30314913024426f1ad45bf77a48d7f198e6f3f5e9fb81e48e039` |
| First frame SHA-256 | `552b4749da744e738d2f5871ae5cdf2ab8f47f75b78cd98470b56941f46e6d55` |
| Last frame SHA-256 | `7c132fb4120969da4f598a904b6e2685589c6ffe09d0537f981bf2de592c7d02` |
| Status | Succeeded and accepted |

Output:

- 2K master: `outputs/family01-scenario03/fal/videos/video03-choice-b-fal-minimax-h3-v2-2k.mp4`
- Master SHA-256: `b5939cc8b5fb0bf2bd5f0e0ee49e957871eb0ab89abe398b15bee9a80e8e257e`
- 1080p review: `outputs/family01-scenario03/fal/videos/video03-choice-b-fal-minimax-h3-v2-1080p.mp4`
- Review SHA-256: `ba9870757a23cd24a66f8623f153517de4eca144c2d31d406f9d755ff657fff8`

Visual QA: two hands at all 10 timeline samples; robot remains home; grandmother leaves; sister visibly crosses the threshold to pursue. Endpoint and branch meaning passed.

### 9.2 Video 04 regeneration

Input package:

| Field | Value |
|---|---|
| Prompt version | V3 persistent hands |
| Parent prompt | V2 |
| Prompt source | `prompts/family01-scenario03/video04-choice-c-v3-persistent-hands.mjs` |
| Prompt source SHA-256 | `fb1111e8051e798464ec5ccbc31d212e55ebc8e220be81ced64936d875baad65` |
| Extracted prompt SHA-256 | `5aa95c3612e9e4715333fa90f7810f3c8d6bc3f05b455a5e662cacfdc92ce2e9` |
| First frame SHA-256 | `552b4749da744e738d2f5871ae5cdf2ab8f47f75b78cd98470b56941f46e6d55` |
| Last frame SHA-256 | `82d1f3f9db954d54a08f25096815eb0680b601eed8b7f1af3d419daa3a2712ff` |
| Status | Succeeded and accepted |

Output:

- 2K master: `outputs/family01-scenario03/fal/videos/video04-choice-c-fal-minimax-h3-v3-persistent-hands-2k.mp4`
- Master SHA-256: `cfad1ecf76ddae38a2e45cd3dba8d8e639659546cb96094b0765fbf2ceebeef7`
- 1080p review: `outputs/family01-scenario03/fal/videos/video04-choice-c-fal-minimax-h3-v3-persistent-hands-1080p.mp4`
- Review SHA-256: `9f75eb2039af7ed8beee90a356b2e29014032cca7f6d3d33ff6dfafef1c4b132`

Visual QA: two hands at all 10 samples, including entryway motion, hallway following, and elevator endpoint. Grandmother’s frustration and the one-to-two-step following distance remained readable. This corrected the V2 visual failure.

### 9.3 Technical QA and review transcode

Both masters decoded completely and shared these properties:

- duration: 15.08 s;
- dimensions: 2544×1456;
- frame rate: 24 fps;
- decoded frames: 362;
- video: H.264 High;
- audio: AAC LC, 32 kHz stereo.

Because 2544×1456 is not exactly 16:9, the 1080p review copies were center-cropped after scaling to 1920×1100, then cropped to 1920×1080. H.264 CRF 18 and AAC 160 kb/s were used for review copies. The 2K masters were preserved untouched.

---

## 10. Final accepted video set

Human-readable report: [FAMILY01_SCENARIO03_VIDEO_RESULTS_V2_FINAL.md](./FAMILY01_SCENARIO03_VIDEO_RESULTS_V2_FINAL.md).  
Machine-readable QA: `outputs/family01-scenario03/qa/video-qa-v2-final.json`.

| Video | Model | Final 1080p review file | Final review SHA-256 | Visual verdict |
|---|---|---|---|---|
| 01 Conflict | MiniMax H3 | `outputs/family01-scenario03/videos/video01-conflict-h3-v2-hands-1080p.mp4` | `655162590e6dae1ae109f68852d04912ca122e9a36c3891d8d7836fdc5bf70aa` | PASS |
| 02 Choice A | MiniMax H3 | `outputs/family01-scenario03/videos/video02-choice-a-h3-v2-hands-1080p.mp4` | `d2581fa4fec4ff064c9d9e2115292adc3ae49a10a818724b9409bfb7d976292b` | PASS |
| 03 Choice B | MiniMax H3 | `outputs/family01-scenario03/fal/videos/video03-choice-b-fal-minimax-h3-v2-1080p.mp4` | `ba9870757a23cd24a66f8623f153517de4eca144c2d31d406f9d755ff657fff8` | PASS |
| 04 Choice C | MiniMax H3 | `outputs/family01-scenario03/fal/videos/video04-choice-c-fal-minimax-h3-v3-persistent-hands-1080p.mp4` | `9f75eb2039af7ed8beee90a356b2e29014032cca7f6d3d33ff6dfafef1c4b132` | PASS |

Final timeline evidence:

- Video 01: `outputs/family01-scenario03/qa/video01/timeline-contact-sheet.png`
- Video 02: `outputs/family01-scenario03/qa/video02/timeline-contact-sheet.png`
- Video 03: `outputs/family01-scenario03/fal/qa/video03/timeline-contact-sheet.png`
- Video 04: `outputs/family01-scenario03/fal/qa/video04/timeline-contact-sheet.png`

Final visual QA conclusion: all four videos preserve exactly two visible robot hands at the sampled timeline points and communicate the intended branch meaning. Video 02 additionally passed the required strong-emotion check. Videos 03 and 04 passed endpoint checks.

Remaining researcher check: native audio tracks exist, are non-silent, and decode correctly, but exact word-for-word Mandarin performance remains a human listening confirmation item. This limitation was disclosed rather than silently treated as a semantic pass.

---

## 11. Approval-gate ledger

| Gate | Deliverable | User decision | Effect |
|---|---|---|---|
| Script initial | First screenplay attempt | Rejected | Reorganized into concise researcher-facing participant flow |
| Script revision | Revised four-video screenplay with A/B/C | Approved | Prompt writing began |
| Prompt V1 | Four separate FLF2V prompts | Confirmed | Initial keyframe work began |
| Embodied-view change | Persistent hand requirement and reference image | Required revision | V2 prompts and V2 anchors created; V1 preserved |
| Keyframes V2 | Eight hand-inclusive anchors | Confirmed | Full-video generation became authorized |
| First complete-video review | Videos 01, 02, and 04 V2 | Targeted revision required | Videos 01–02 retained; Video 04 rejected for missing hands during motion |
| Final video set | Video 03 V2 and Video 04 V3 added | Approved (`通过`) | Four-video experience finalized |
| Process record | This document | Current deliverable | Preserves production knowledge for subsequent scenarios |

---

## 12. Failures, corrections, and lessons learned

### 12.1 Research scripts should expose participant-facing facts first

The initial script failed because it did not make the evaluation surface immediately visible. The effective format was:

1. briefing seen by the participant;
2. neutral choices;
3. one compact block per video containing space, characters, timed actions, exact dialogue, emotion, and endpoint;
4. shared research controls and post-scene questions.

This lets a researcher judge the scenario in one or two minutes without reading production prose.

### 12.2 A new choice changes the production graph

Changing from two to three choices was not a wording edit. It required:

- a fourth screenplay branch;
- a fourth prompt;
- two additional anchors;
- another video-generation and QA path;
- a new comparison question about whether accompaniment is compromise or soft control.

### 12.3 Persistent first-person hands must be a P0 production requirement

The V2 anchors contained hands at both endpoints, and the V2 prompt said they must remain visible in every frame. This worked for fixed/limited-motion Videos 01 and 02 but failed in the moving hallway section of Video 04. The successful revision:

- moved the hand contract to the first paragraph;
- labeled it P0;
- described loss modes explicitly;
- adjusted camera tilt to make preservation physically feasible;
- repeated hand persistence inside each timed beat;
- preserved the same accepted endpoints.

This is more reliable than simply adding more negative terms at the end of a prompt.

### 12.4 Endpoint approval does not replace timeline QA

Video 04’s first and last frames both contained correct hands. Only dense timeline inspection revealed that the hands disappeared for most of the middle. Therefore:

- endpoint correctness is necessary but not sufficient;
- every persistent element needs at least dense sample review, ideally full timeline inspection;
- a completed render must never be treated as research acceptance without visual review.

### 12.5 Preserve failed evidence

Rejected anchors and the rejected Video 04 candidate were retained with explicit names. This supports:

- diagnosis without relying on memory;
- targeted revisions rather than full rewrites;
- auditability of why a targeted regeneration was justified;
- later evaluation of model behavior.

### 12.6 Revise only the failed content layer

Video 04’s story, identity, anchors, dialogue, timing, and non-contact behavior were already acceptable. Only the persistent-hand layer failed. The V3 revision therefore strengthened that layer while inheriting every accepted lock. This made the cause and effect of the revision easy to evaluate.

### 12.7 Dialogue QA should remain honest

Audio tracks were decoded and shown to contain signal, but no reliable automated Mandarin semantic transcription was available in the local workflow. The result was not falsely labeled “exact dialogue pass.” For future studies, add a structured human listening sheet or a trusted Mandarin ASR step before final publication.

### 12.8 Keep generation records self-contained

The strongest records include:

- scenario, clip, branch, status;
- exact generation model;
- prompt version and parent version;
- complete prompt text;
- prompt-file and extracted-prompt hashes;
- input image paths and hashes;
- output path, size, and hash;
- failure evidence and disposition.

---

## 13. Recommended reusable procedure for the next scenario

1. Write the research turn in one sentence before writing dialogue.
2. Produce a one-to-two-minute researcher summary: briefing, choices, videos, consequences, questions.
3. Lock all exact Mandarin lines and measure dialogue density against seconds available.
4. Write one separate timed prompt per video; do not combine branches.
5. If hands or another foreground element are required continuously, place that contract at P0 and repeat it in every moving beat.
6. Generate a common branch decision anchor and copy it byte-for-byte to every consequence first frame.
7. Reject weak endpoint emotions or incomplete endpoint actions before full-video generation.
8. Persist the prompt, images, hashes, and intended output version before generation.
9. Submit one candidate first.
10. Full-decode each result and inspect at least 10 timeline points, with denser sampling around critical motion.
11. Distinguish technical pass, visual-contract pass, branch-meaning pass, emotion pass, and dialogue-semantic pass.
12. Preserve every 2K master and every rejected candidate; create new versioned review files.
13. Obtain researcher approval before integration into the participant-facing platform.

---

## 14. Artifact index and provenance hashes

### 14.1 Stage records

| Record | SHA-256 |
|---|---|
| `FAMILY01_SCENARIO03_SCRIPT_V1.md` | `901c3def4646427a88cdb8f97178eaf5fd44cebcea66f6ff65c46f6541350bb0` |
| `FAMILY01_SCENARIO03_VIDEO_PROMPTS_V1.md` | `83b6807f0a660ee379e320af41e9f9b83996b34a56b3556ca66801302e78dc7a` |
| `FAMILY01_SCENARIO03_VIDEO_PROMPTS_V2.md` | `c049e481d7c22be1a37c1484e379295daa04ec7fb65b8f0e16319cf1c74aaeeb` |
| `FAMILY01_SCENARIO03_KEYFRAMES_V1.md` | `4670e9aa9643aa1c88a5b2c18197879dcc155764f815f888af952c41a171f451` |
| `FAMILY01_SCENARIO03_KEYFRAMES_V2.md` | `5b717c3f2247075c9ad4ae79d4adb5920ddde514b53ce71cac9e602f35b4036c` |
| `FAMILY01_SCENARIO03_VIDEO_RESULTS_V2_FINAL.md` | `5aaee2fa88dd15c245ca0bbfbd04f667600af47110eaf1e5b371a5c31ca903c3` |

### 14.2 Machine-readable QA records

- `outputs/keyframes/family01-scenario03/anchor-qa-v1.json`
- `outputs/keyframes/family01-scenario03/anchor-qa-v2.json`
- `outputs/family01-scenario03/qa/video-qa-v2-final.json`

### 14.3 Rejected evidence

- `outputs/keyframes/family01-scenario03/rejected/video03-last-v0-sister-inside.png`
- `outputs/keyframes/family01-scenario03/rejected/video04-last-v0-emotion-too-weak.png`
- `outputs/family01-scenario03/videos/video04-choice-c-h3-v2-hands-2k.mp4`
- `outputs/family01-scenario03/videos/video04-choice-c-h3-v2-hands-1080p-rejected.mp4`
- `outputs/family01-scenario03/qa/video04/timeline-contact-sheet.png`

---

## 15. Final status statement

Family 01 · Scenario 03 completed all four requested stages: screenplay, separate prompts, separate first/last frames, and separate complete videos. The final package contains one approved conflict video and three approved consequence videos. It preserves the grandmother’s coherent agency, makes each choice’s benefit and cost visible, maintains the robot’s embodied first-person perspective through two persistent non-contact hands, and retains complete provenance for both accepted and rejected generations.

The researcher’s final response was `通过`, confirming the completed video package.
> 整理说明（2026-08-16）：本文中的 `outputs/...`、脚本和工作流路径是历史记录。对应文件现完整位于工作区 `03_AI影游资料/02_影游生成过程性材料/Family_01/历史生成工作区/`，旧名与新位置见 `05_项目文档/迁移映射.tsv`。
