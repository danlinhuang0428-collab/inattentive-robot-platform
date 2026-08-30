import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE / "tools" / "avpkg"))

import av
from PIL import Image, ImageDraw

VIDEO = HERE.parent / "assets" / "video01-vr180-h3-candidate.mp4"
TARGETS = [0.0, 1.5, 3.0, 4.5, 6.0, 8.0, 10.0, 12.0, 14.5]

container = av.open(str(VIDEO))
video_stream = container.streams.video[0]
audio_stream = container.streams.audio[0] if container.streams.audio else None
duration = float(container.duration / av.time_base) if container.duration else 0.0

selected = {}
frame_count = 0
for frame in container.decode(video=0):
    frame_count += 1
    seconds = float(frame.time or 0.0)
    for target in TARGETS:
        if target not in selected and seconds >= target:
            selected[target] = (seconds, frame.to_image())

thumb_size = (360, 360)
sheet = Image.new("RGB", (thumb_size[0] * 3, thumb_size[1] * 3), "black")
draw = ImageDraw.Draw(sheet)
for index, target in enumerate(TARGETS):
    actual, image = selected[target]
    image.thumbnail((thumb_size[0], thumb_size[1] - 24), Image.Resampling.LANCZOS)
    x = (index % 3) * thumb_size[0] + (thumb_size[0] - image.width) // 2
    y = (index // 3) * thumb_size[1] + 24
    sheet.paste(image, (x, y))
    draw.text(((index % 3) * thumb_size[0] + 8, (index // 3) * thumb_size[1] + 5), f"{actual:.2f} s", fill="white")

sheet_path = HERE / "candidate-contact-sheet.jpg"
sheet.save(sheet_path, quality=88, optimize=True)

metadata = {
    "input": str(VIDEO),
    "durationSeconds": duration,
    "width": video_stream.codec_context.width,
    "height": video_stream.codec_context.height,
    "averageRate": str(video_stream.average_rate),
    "videoCodec": video_stream.codec_context.name,
    "pixelFormat": video_stream.codec_context.format.name if video_stream.codec_context.format else None,
    "decodedFrames": frame_count,
    "audioPresent": audio_stream is not None,
    "audioCodec": audio_stream.codec_context.name if audio_stream else None,
    "audioSampleRate": audio_stream.codec_context.sample_rate if audio_stream else None,
    "audioChannels": audio_stream.codec_context.channels if audio_stream else None,
    "contactSheet": str(sheet_path),
}
(HERE / "candidate-metadata.json").write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + "\n")
print(json.dumps(metadata, ensure_ascii=False, indent=2))
