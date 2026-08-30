# VR180 Production Standard

This document defines the delivery standard for all subsequent AI-generated VR180 scenarios in this project. The standard uses the generator's native 1920 × 1920 output and does not require a Topaz super-resolution pass.

## 1. Projection and composition

- Deliver a square 1:1 half-equirectangular image covering 180° horizontal × 180° vertical.
- Keep the headset camera locked and level unless intentional camera motion has been tested for VR comfort.
- Preserve projection continuity at the left, right, top, and bottom edges. Do not crop a conventional 16:9 frame into a square after generation.
- First-person robot hands, foreground props, faces, doorways, and architecture must remain temporally stable.

## 2. Color video delivery master

- Standard delivery resolution: **1920 × 1920**.
- Use the accepted generator output directly at 1920 × 1920. Do not apply Topaz or another generative video super-resolution process as part of the standard delivery workflow.
- A native resolution higher than 1920 × 1920 may be retained when a generator provides it directly, but it is not required for delivery.
- Preferred frame rate: **24 fps**; 30 fps is acceptable when generated natively. Do not interpolate frame rate merely to increase the number.
- Codec: H.264 High Profile, 8-bit 4:2:0, with a fast-start MP4 header for headset streaming.
- Select bitrate according to visual quality and Quest playback performance; avoid unnecessary re-encoding of an accepted native master.
- Preserve the selected generator result's native audio unless a separately approved audio correction is required.

## 3. Depth delivery master

- Generate temporally consistent grayscale depth from the selected motion master; VDA-Large is the approved baseline.
- The published depth video must match the color master in width, height, duration, frame rate, and frame count.
- Generate depth at 1920 × 1920 so it matches the standard color master. Never use a generative image enhancer on depth values.
- Near robot hands and foreground props must be brighter than the subject; distant architecture and doorways must be darker. Inspect at least eight evenly spaced frames.

## 4. Audio and dialogue

- Keep native stereo audio when speaker identity, emotion, lip synchronization, and timing pass review.
- Verify every scripted line against its assigned speaker. Robot dialogue must not animate a human mouth.
- Verify that audible dialogue continues through the intended final line and that the audio duration matches the video.
- Do not replace an accepted audio stream during packaging or depth processing.

## 5. WebXR presentation

- Use separate left/right eye layers with opposite depth-derived horizontal disparity.
- Synchronize the depth video to the color video and correct drift greater than 80 ms.
- Render subtitles as a separate transparent camera-attached layer below the central gaze direction and enable it for both eyes.
- Keep a monoscopic fallback only for debugging; publishable Quest variants must report `DEPTH STEREO READY`.

## 6. Required QA before publishing

- Decode the full color and depth streams without errors.
- Confirm exact resolution, duration, frame rate, frame count, codec, audio channels, and audio duration.
- Inspect the native 1920 × 1920 master directly for face changes, hand deformation, edge ringing, temporal flicker, and projection damage.
- Do not require a super-resolution comparison for standard delivery.
- Verify the main video and depth video are the same dimensions and timing.
- Load the final URL in the WebXR viewer, start playback, confirm subtitles, and confirm there are no console errors.
- Test binocular comfort and disparity on a physical Quest over HTTPS before production release.

## Scenario 01 accepted benchmark

- Color: MiniMax H3 native 1920 × 1920, 24 fps, 15.08 s; no Topaz super-resolution required.
- Depth: native-master-matched 1920 × 1920, 24 fps, 15.08 s, generated from the matching motion master.
- Audio: MiniMax H3 native AAC stereo, preserved without super-resolution processing.
