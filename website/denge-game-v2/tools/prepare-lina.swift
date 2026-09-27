import Foundation
import AVFoundation
import Vision
import CoreImage

func fail(_ message: String) -> NSError {
    NSError(domain: "PrepareLina", code: 1, userInfo: [NSLocalizedDescriptionKey: message])
}

guard CommandLine.arguments.count == 4 else {
    print("Usage: swift tools/prepare-lina.swift input.mp4 silent-output.mp4 poster.png")
    exit(1)
}
let inputURL = URL(fileURLWithPath: CommandLine.arguments[1])
let outputURL = URL(fileURLWithPath: CommandLine.arguments[2])
let posterURL = URL(fileURLWithPath: CommandLine.arguments[3])
guard !FileManager.default.fileExists(atPath: outputURL.path), !FileManager.default.fileExists(atPath: posterURL.path) else {
    print("Output exists; choose new output paths.")
    exit(1)
}

do {
    let asset = AVURLAsset(url: inputURL)
    guard let track = try await asset.loadTracks(withMediaType: .video).first else { throw fail("No video track") }
    let size = try await track.load(.naturalSize)
    let transform = try await track.load(.preferredTransform)
    guard transform == .identity else { throw fail("Only unrotated source videos are supported") }
    let width = Int(size.width)
    let height = Int(size.height)
    let fps = try await track.load(.nominalFrameRate)
    let reader = try AVAssetReader(asset: asset)
    let videoOutput = AVAssetReaderTrackOutput(track: track, outputSettings: [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA])
    reader.add(videoOutput)
    let writer = try AVAssetWriter(outputURL: outputURL, fileType: .mp4)
    let videoInput = AVAssetWriterInput(mediaType: .video, outputSettings: [
        AVVideoCodecKey: AVVideoCodecType.h264,
        AVVideoWidthKey: width * 2,
        AVVideoHeightKey: height,
        AVVideoCompressionPropertiesKey: [AVVideoAverageBitRateKey: 8_000_000, AVVideoExpectedSourceFrameRateKey: fps, AVVideoMaxKeyFrameIntervalKey: Int(fps)]
    ])
    writer.add(videoInput)
    let adapter = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: videoInput, sourcePixelBufferAttributes: [
        kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA,
        kCVPixelBufferWidthKey as String: width * 2,
        kCVPixelBufferHeightKey as String: height,
        kCVPixelBufferIOSurfacePropertiesKey as String: [:]
    ])
    guard writer.startWriting(), reader.startReading() else { throw writer.error ?? reader.error ?? fail("Unable to start encoding") }
    writer.startSession(atSourceTime: .zero)
    let context = CIContext()
    let colorSpace = CGColorSpaceCreateDeviceRGB()
    var frames = 0
    let request = VNGenerateForegroundInstanceMaskRequest()
    while let sample = videoOutput.copyNextSampleBuffer() {
        try autoreleasepool {
            guard let pixels = CMSampleBufferGetImageBuffer(sample) else { throw fail("Missing source frame") }
            let handler = VNImageRequestHandler(cvPixelBuffer: pixels, options: [:])
            try handler.perform([request])
            guard let observation = request.results?.first, observation.allInstances.count == 1 else {
                throw fail("Expected one foreground character at frame \(frames)")
            }
            let mask = try observation.generateScaledMaskForImage(forInstances: observation.allInstances, from: handler)
            let source = CIImage(cvPixelBuffer: pixels)
            let matte = CIImage(cvPixelBuffer: mask).transformed(by: CGAffineTransform(translationX: CGFloat(width), y: 0))
            let packed = matte.composited(over: source)
            if frames == 0 {
                let foreground = try observation.generateMaskedImage(ofInstances: observation.allInstances, from: handler, croppedToInstancesExtent: false)
                try context.writePNGRepresentation(of: CIImage(cvPixelBuffer: foreground), to: posterURL, format: .RGBA8, colorSpace: colorSpace)
            }
            while !videoInput.isReadyForMoreMediaData {
                if writer.status == .failed { throw writer.error ?? fail("Video encoder failed") }
                Thread.sleep(forTimeInterval: 0.005)
            }
            guard let pool = adapter.pixelBufferPool else { throw fail("No output pixel buffer pool") }
            var result: CVPixelBuffer?
            guard CVPixelBufferPoolCreatePixelBuffer(nil, pool, &result) == kCVReturnSuccess, let result else { throw fail("Pixel buffer allocation failed") }
            context.render(packed, to: result, bounds: CGRect(x: 0, y: 0, width: width * 2, height: height), colorSpace: colorSpace)
            guard adapter.append(result, withPresentationTime: CMSampleBufferGetPresentationTimeStamp(sample)) else { throw writer.error ?? fail("Video append failed") }
            frames += 1
            if frames % 24 == 0 { print("Processed \(frames) frames"); fflush(stdout) }
        }
    }
    videoInput.markAsFinished()
    guard reader.status == .completed else { throw reader.error ?? fail("Source decoding incomplete") }
    await writer.finishWriting()
    guard writer.status == .completed else { throw writer.error ?? fail("Encoding incomplete") }
    print("Saved \(frames) frames at \(fps) fps, silent RGB left / alpha matte right.")
} catch {
    print("Preparation failed: \(error)")
    exit(1)
}
