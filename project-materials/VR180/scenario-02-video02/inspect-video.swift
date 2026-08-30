import AppKit
@preconcurrency import AVFoundation
import Foundation

guard CommandLine.arguments.count == 4 else {
    fputs("Usage: inspect-video.swift <video> <contact-sheet.png> <metadata.json>\n", stderr)
    exit(2)
}

let videoURL = URL(fileURLWithPath: CommandLine.arguments[1])
let sheetURL = URL(fileURLWithPath: CommandLine.arguments[2])
let metadataURL = URL(fileURLWithPath: CommandLine.arguments[3])
let asset = AVURLAsset(url: videoURL)
let duration = try await asset.load(.duration).seconds
let videoTracks = try await asset.loadTracks(withMediaType: .video)
let audioTracks = try await asset.loadTracks(withMediaType: .audio)
guard let videoTrack = videoTracks.first else { throw NSError(domain: "VR180QA", code: 1) }
let naturalSize = try await videoTrack.load(.naturalSize)
let transform = try await videoTrack.load(.preferredTransform)
let transformed = naturalSize.applying(transform)
let width = Int(abs(transformed.width).rounded())
let height = Int(abs(transformed.height).rounded())
let frameRate = try await videoTrack.load(.nominalFrameRate)
let estimatedDataRate = try await videoTrack.load(.estimatedDataRate)
let formatDescriptions = try await videoTrack.load(.formatDescriptions)
let codec = formatDescriptions.first.map { description in
    let subtype = CMFormatDescriptionGetMediaSubType(description)
    return String(format: "%c%c%c%c", (subtype >> 24) & 255, (subtype >> 16) & 255, (subtype >> 8) & 255, subtype & 255)
} ?? "unknown"

var audioChannels = 0
var audioDuration = 0.0
if let audioTrack = audioTracks.first {
    audioDuration = try await audioTrack.load(.timeRange).duration.seconds
    let audioFormats = try await audioTrack.load(.formatDescriptions)
    if let first = audioFormats.first,
       let basic = CMAudioFormatDescriptionGetStreamBasicDescription(first) {
        audioChannels = Int(basic.pointee.mChannelsPerFrame)
    }
}

let metadata: [String: Any] = [
    "path": videoURL.path,
    "durationSeconds": duration,
    "width": width,
    "height": height,
    "frameRate": frameRate,
    "estimatedVideoBitrate": estimatedDataRate,
    "codec": codec,
    "audioTracks": audioTracks.count,
    "audioChannels": audioChannels,
    "audioDurationSeconds": audioDuration,
]
let metadataData = try JSONSerialization.data(withJSONObject: metadata, options: [.prettyPrinted, .sortedKeys])
try FileManager.default.createDirectory(at: metadataURL.deletingLastPathComponent(), withIntermediateDirectories: true)
try metadataData.write(to: metadataURL)

let sampleTimes = stride(from: 0.0, through: 14.0, by: 1.75).map { $0 }
let generator = AVAssetImageGenerator(asset: asset)
generator.appliesPreferredTrackTransform = true
generator.requestedTimeToleranceBefore = CMTime(seconds: 0.05, preferredTimescale: 600)
generator.requestedTimeToleranceAfter = CMTime(seconds: 0.05, preferredTimescale: 600)

let tile = 420
let labelHeight = 34
let columns = 3
let rows = 3
let canvas = NSImage(size: NSSize(width: tile * columns, height: (tile + labelHeight) * rows))
canvas.lockFocus()
NSColor(calibratedWhite: 0.03, alpha: 1).setFill()
NSBezierPath(rect: NSRect(origin: .zero, size: canvas.size)).fill()
let labelAttributes: [NSAttributedString.Key: Any] = [
    .font: NSFont.monospacedSystemFont(ofSize: 18, weight: .semibold),
    .foregroundColor: NSColor.white,
]

for (index, seconds) in sampleTimes.enumerated() {
    let cgImage = try generator.copyCGImage(at: CMTime(seconds: seconds, preferredTimescale: 600), actualTime: nil)
    let image = NSImage(cgImage: cgImage, size: NSSize(width: tile, height: tile))
    let column = index % columns
    let rowFromTop = index / columns
    let row = rows - 1 - rowFromTop
    let x = column * tile
    let y = row * (tile + labelHeight)
    image.draw(in: NSRect(x: x, y: y + labelHeight, width: tile, height: tile))
    (String(format: "%.2f s", seconds) as NSString).draw(at: NSPoint(x: x + 12, y: y + 7), withAttributes: labelAttributes)
}
canvas.unlockFocus()

guard let tiff = canvas.tiffRepresentation,
      let bitmap = NSBitmapImageRep(data: tiff),
      let png = bitmap.representation(using: .png, properties: [:]) else {
    throw NSError(domain: "VR180QA", code: 2)
}
try FileManager.default.createDirectory(at: sheetURL.deletingLastPathComponent(), withIntermediateDirectories: true)
try png.write(to: sheetURL)
print(metadataURL.path)
print(sheetURL.path)
