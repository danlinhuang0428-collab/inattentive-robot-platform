import AVFoundation
import AppKit
import Foundation

guard CommandLine.arguments.count == 3 else {
  fputs("Usage: extract-frames.swift <video> <output-dir>\n", stderr)
  exit(2)
}

let videoURL = URL(fileURLWithPath: CommandLine.arguments[1])
let outputURL = URL(fileURLWithPath: CommandLine.arguments[2], isDirectory: true)
try FileManager.default.createDirectory(at: outputURL, withIntermediateDirectories: true)

let asset = AVURLAsset(url: videoURL)
let duration = CMTimeGetSeconds(asset.duration)
let videoTrack = asset.tracks(withMediaType: .video).first
let audioTrack = asset.tracks(withMediaType: .audio).first
let generator = AVAssetImageGenerator(asset: asset)
generator.appliesPreferredTrackTransform = true
generator.requestedTimeToleranceBefore = .zero
generator.requestedTimeToleranceAfter = .zero

let seconds: [Double] = [0.0, 2.0, 4.0, 6.0, 8.0, 10.0, 12.0, 14.5]
for (index, second) in seconds.enumerated() {
  let time = CMTime(seconds: min(second, max(0, duration - 0.05)), preferredTimescale: 600)
  let image = try generator.copyCGImage(at: time, actualTime: nil)
  let rep = NSBitmapImageRep(cgImage: image)
  guard let png = rep.representation(using: .png, properties: [:]) else { continue }
  try png.write(to: outputURL.appendingPathComponent(String(format: "frame-%02d-%04.1fs.png", index, second)))
}

let size = videoTrack?.naturalSize ?? .zero
let fps = videoTrack?.nominalFrameRate ?? 0
let videoRate = videoTrack?.estimatedDataRate ?? 0
let audioRate = audioTrack?.estimatedDataRate ?? 0
print(String(format: "duration=%.3f width=%.0f height=%.0f fps=%.3f video_bps=%.0f audio_bps=%.0f has_audio=%@", duration, size.width, size.height, fps, videoRate, audioRate, audioTrack == nil ? "no" : "yes"))
