# Scenario 01 VR180

This folder is the isolated source of truth for the Scenario 01 VR180 experience.

## Runtime

- `index.html` — standalone WebXR entry page.
- `projection.js` — 180° × 180° half-equirectangular hemisphere mapping.
- `viewer.js` — Three.js video texture, WebXR session, drag-look fallback, and optional color-plus-depth stereo.
- `assets/scenario-01-vr180.mp4` — accepted 2880 × 2880, 24 fps, 15.04 second master.
- `assets/scenario-01-vr180.depth.mp4` — VDA-Large 1920 × 1920 temporally consistent grayscale depth master.
- `assets/scenario-01-dialogue-natural-timed.m4a` — corrected 15-second Eleven-v3 multi-character Mandarin dialogue master; all four dialogue regions remain audible through 14.725 seconds.
- `assets/scenario-01-vr180-candidate-minimax-h3-exact.mp4` — MiniMax H3 exact-script alternative with native stereo audio.
- `assets/scenario-01-vr180-candidate-minimax-h3-natural.mp4` — MiniMax H3 colloquial-dialogue alternative with native stereo audio.
- `assets/scenario-01-vr180-candidate-minimax-h3-natural.depth.mp4` — matching VDA-Large temporal depth for the H3 natural candidate.
- `assets/scenario-01-vr180-candidate-minimax-h3-natural-upscaled-topaz.mp4` — archived 2880 × 2880 Topaz comparison; retained for reference but no longer the default delivery master.
- `assets/scenario-01-vr180-candidate-minimax-h3-natural-upscaled-topaz.depth.mp4` — archived depth file matching the Topaz comparison.
- `assets/scenario-01-vr180-start.png` — accepted 2K projection frame and poster.
- `vendor/three.module.js` and `vendor/three.core.js` — vendored Three.js runtime files, so the headset page does not depend on a CDN.

The checked-in runtime now loads depth-enhanced stereo by default. `viewer.js` assigns opposite depth-derived horizontal disparity to the WebXR left and right eye layers, matching the reference project's mono-plus-depth approach. Add `?depth=off` only when testing the monoscopic fallback.
The runtime also renders timed Mandarin captions onto a separate transparent Three.js plane attached below the WebXR camera. The plane is enabled for both eye layers, remains visible as the viewer turns their head, and is not burned into any source video.
The desktop fallback supports video playback and drag-to-look; the `Enter VR` button becomes available only when `navigator.xr.isSessionSupported("immersive-vr")` succeeds. Quest access needs an HTTPS URL (or another browser-recognized secure context).

## Generation record

`generation-manifest.json` records all paid fal.ai requests and enforces the approved call ceiling, currently eleven. The sequence was:

1. Nano Banana Pro Edit — 2K projection-preserving first frame.
2. Kling O3 Native 4K — first video candidate; rejected because the grandmother moved into the room.
3. Kling O3 Native 4K — accepted video; the grandmother turns away and exits through the far-right door.
4. Kling O3 Native 4K with stricter native speaker mapping — retained only as a comparison candidate because the 4K endpoint cannot bind a voice ID to a visible character.
5. Kling O3 Native 4K controlled silent A — rejected because the mother opens her mouth during the robot line.
6. Kling O3 Native 4K controlled silent B — selected; the mother remains visually silent during the robot line and speaks again only at the final warning.
7. Kling O3 Native 4K controlled silent C — rejected because delayed grandmother motion caused the mother's mouth to move during the grandmother line.
8. ElevenLabs Eleven-v3 dialogue — selected natural multi-character Mandarin voices with emotion instructions.
9. Video Depth Anything VDA-Large — selected temporally consistent grayscale depth video.
10. MiniMax H3 image-to-video exact script — retained as an alternative 1920 × 1920 native-stereo audiovisual candidate.
11. MiniMax H3 image-to-video natural dialogue — retained as the preferred H3 alternative for stronger expression and more conversational Mandarin.
12. Video Depth Anything VDA-Large — selected depth pass matched frame-for-frame to the H3 natural candidate.
13. Topaz Starlight Precise 2.5 — historical 1.5× comparison pass; retained for evaluation and excluded from the current default workflow.

The selected B video is paired with a deterministic natural dialogue master. `qa/dialogue-timeline.json` fixes every line to its speaker and timestamp; the grandmother line is moved to 4.6–approximately 7.1 seconds so it finishes while she is still visible, and the robot line no longer depends on Kling assigning dialogue to a visible face.

The timed dialogue mix uses a fixed 15-second silent base as the duration clock. This prevents the final mix from ending when the first mother segment ends; the corrected revision was validated with audible regions at 0.38–4.13, 4.60–7.10, 9.21–12.03, and 12.61–14.73 seconds.

The original Kling-plus-controlled-dialogue-plus-depth version remains available. The H3 natural variant now has its own matching temporal depth track and loads as depth-enhanced stereo by default. The H3 exact variant remains a monoscopic preview because it does not have a matching depth pass.

All subsequent VR180 production must follow `VR180_PRODUCTION_STANDARD.md`. The standard delivery master is the accepted native 1920 × 1920 generator output. Topaz or other video super-resolution is not part of the default delivery workflow.

No additional fal.ai task may be submitted without new user approval.

## Publishing into the platform

The platform serves static assets from `NEW_Platform_8:14/platform/public/VR180`. Copy this folder's runtime files there after changes; references, QA artifacts, tools, and the rejected candidate stay only in this isolated workspace.
