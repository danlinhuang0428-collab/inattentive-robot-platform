import AVFoundation
import CoreImage
import Foundation

guard CommandLine.arguments.count == 4 else {
  fputs("Usage: local-scale.swift <input> <output> <size>\n", stderr)
  exit(2)
}

let input = URL(fileURLWithPath: CommandLine.arguments[1])
let output = URL(fileURLWithPath: CommandLine.arguments[2])
guard let size = Double(CommandLine.arguments[3]), size > 0 else { exit(2) }
try? FileManager.default.removeItem(at: output)

let asset = AVURLAsset(url: input)
let composition = AVMutableVideoComposition(asset: asset) { request in
  let source = request.sourceImage.clampedToExtent()
  let extent = request.sourceImage.extent
  let scaleX = CGFloat(size) / extent.width
  let scaleY = CGFloat(size) / extent.height
  let scaled = source
    .transformed(by: CGAffineTransform(scaleX: scaleX, y: scaleY))
    .cropped(to: CGRect(x: 0, y: 0, width: size, height: size))
  request.finish(with: scaled, context: nil)
}
composition.renderSize = CGSize(width: size, height: size)
composition.frameDuration = CMTime(value: 1, timescale: 24)

guard let exporter = AVAssetExportSession(asset: asset, presetName: AVAssetExportPresetHighestQuality) else {
  fputs("Unable to create exporter\n", stderr)
  exit(1)
}
exporter.outputURL = output
exporter.outputFileType = .mp4
exporter.shouldOptimizeForNetworkUse = true
exporter.videoComposition = composition

let semaphore = DispatchSemaphore(value: 0)
exporter.exportAsynchronously { semaphore.signal() }
semaphore.wait()

if exporter.status != .completed {
  fputs("Export failed: \(exporter.error?.localizedDescription ?? "unknown")\n", stderr)
  exit(1)
}
print(output.path)
