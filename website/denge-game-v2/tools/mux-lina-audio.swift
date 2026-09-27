import Foundation
import AVFoundation

func fail(_ message: String) -> NSError {
    NSError(domain: "MuxLinaAudio", code: 1, userInfo: [NSLocalizedDescriptionKey: message])
}

guard CommandLine.arguments.count == 4 else {
    print("Usage: swift tools/mux-lina-audio.swift silent.mp4 original-audio-source.mp4 output.mp4")
    exit(1)
}
let videoURL = URL(fileURLWithPath: CommandLine.arguments[1])
let audioSourceURL = URL(fileURLWithPath: CommandLine.arguments[2])
let outputURL = URL(fileURLWithPath: CommandLine.arguments[3])
guard !FileManager.default.fileExists(atPath: outputURL.path) else {
    print("Output exists; choose a new output path.")
    exit(1)
}

do {
    let videoAsset = AVURLAsset(url: videoURL)
    let audioAsset = AVURLAsset(url: audioSourceURL)
    guard let videoTrack = try await videoAsset.loadTracks(withMediaType: .video).first else { throw fail("No video track in silent file") }
    guard let audioTrack = try await audioAsset.loadTracks(withMediaType: .audio).first else { throw fail("No audio track in source") }
    let videoDuration = try await videoAsset.load(.duration)
    let audioDuration = try await audioTrack.load(.timeRange).duration

    let composition = AVMutableComposition()
    guard let compVideo = composition.addMutableTrack(withMediaType: .video, preferredTrackID: kCMPersistentTrackID_Invalid) else { throw fail("Video track allocation failed") }
    try compVideo.insertTimeRange(CMTimeRange(start: .zero, duration: videoDuration), of: videoTrack, at: .zero)
    compVideo.preferredTransform = try await videoTrack.load(.preferredTransform)
    guard let compAudio = composition.addMutableTrack(withMediaType: .audio, preferredTrackID: kCMPersistentTrackID_Invalid) else { throw fail("Audio track allocation failed") }
    try compAudio.insertTimeRange(CMTimeRange(start: .zero, duration: min(audioDuration, videoDuration)), of: audioTrack, at: .zero)

    guard let export = AVAssetExportSession(asset: composition, presetName: AVAssetExportPresetPassthrough) else { throw fail("Export session unavailable") }
    try await export.export(to: outputURL, as: .mp4)
    guard export.status == .completed else { throw export.error ?? fail("Export incomplete") }
    print("Muxed silent video + original audio -> \(outputURL.path)")
} catch {
    print("Muxing failed: \(error)")
    exit(1)
}
