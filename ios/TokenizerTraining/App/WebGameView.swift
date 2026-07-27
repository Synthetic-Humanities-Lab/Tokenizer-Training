import SwiftUI
import WebKit
import AVFAudio
import CoreHaptics
import CoreFoundation

private let webAssetScheme = "tokenizertraining"
private let webAssetHost = "app"
private let webAssetRoot = "WebAssets"
private let defaultGameQuery = "surface=mobile"
private let launchQueryArgumentName = "--tt-query"
private let launchMutedArgumentName = "--tt-muted"
private let maxLaunchQueryLength = 1024
private let mutedStorageKey = "tokenizer-training.muted"
private let nativeHapticMessageHandlerName = "tokenizerTrainingHaptics"
private let nativeAudioMessageHandlerName = "tokenizerTrainingAudio"
private let nativeCapabilitiesGlobalName = "__TOKENIZER_TRAINING_NATIVE_CAPABILITIES__"
private let nativeAppPauseEventName = "tokenizertraining:native-pause"
private let nativeAppResumeEventName = "tokenizertraining:native-resume"
private let maxNativeHapticRepeats = 4

#if DEBUG
private let qaLaunchQueriesEnabled = true
#else
private let qaLaunchQueriesEnabled = false
#endif

struct WebGameView: UIViewRepresentable {
    func makeCoordinator() -> NativeFeedbackCoordinator {
        NativeFeedbackCoordinator()
    }

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        let userContentController = WKUserContentController()
        userContentController.addUserScript(Self.nativeCapabilitiesUserScript(
            hapticsAvailable: context.coordinator.hapticBridge.hapticsAvailable,
            qaAvailable: qaLaunchQueriesEnabled
        ))
        if let muted = Self.launchMutedOverride(arguments: ProcessInfo.processInfo.arguments) {
            userContentController.addUserScript(Self.seedMutedUserScript(muted: muted))
        }
        context.coordinator.install(in: userContentController)
        configuration.userContentController = userContentController
        configuration.allowsInlineMediaPlayback = true
        configuration.mediaTypesRequiringUserActionForPlayback = []
        configuration.setURLSchemeHandler(BundleWebAssetSchemeHandler(), forURLScheme: webAssetScheme)
        configuration.defaultWebpagePreferences.allowsContentJavaScript = true

        let webView = WKWebView(frame: .zero, configuration: configuration)
        context.coordinator.attach(to: webView)
        webView.allowsBackForwardNavigationGestures = false
        webView.backgroundColor = UIColor(red: 0.035, green: 0.034, blue: 0.03, alpha: 1)
        webView.isOpaque = true
        webView.scrollView.backgroundColor = webView.backgroundColor
        webView.scrollView.bounces = false
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.scrollView.isScrollEnabled = false

        loadGame(in: webView)
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {}

    static func dismantleUIView(_ webView: WKWebView, coordinator: NativeFeedbackCoordinator) {
        coordinator.remove(from: webView.configuration.userContentController)
        webView.stopLoading()
    }

    private func loadGame(in webView: WKWebView) {
        let assetIndexURL = Bundle.main.resourceURL?
            .appendingPathComponent(webAssetRoot, isDirectory: true)
            .appendingPathComponent("index.html")

        if let assetIndexURL,
           FileManager.default.fileExists(atPath: assetIndexURL.path) {
            let gameQuery = Self.gameLaunchQuery(arguments: ProcessInfo.processInfo.arguments)
            guard let url = URL(string: "\(webAssetScheme)://\(webAssetHost)/index.html?\(gameQuery)") else {
                webView.loadHTMLString(Self.missingAssetsHTML, baseURL: nil)
                return
            }

            webView.load(URLRequest(url: url, cachePolicy: .reloadIgnoringLocalAndRemoteCacheData))
            return
        }

        webView.loadHTMLString(Self.missingAssetsHTML, baseURL: nil)
    }

    static func gameLaunchQuery(arguments: [String]) -> String {
        guard let rawQuery = launchQueryArgument(arguments: arguments) else {
            return defaultGameQuery
        }

        let trimmed = rawQuery.trimmingCharacters(in: .whitespacesAndNewlines)
        guard isSafeLaunchQuery(trimmed) else {
            return defaultGameQuery
        }

        if !qaLaunchQueriesEnabled && containsQaLaunchControl(trimmed) {
            return defaultGameQuery
        }

        return "\(defaultGameQuery)&\(trimmed)"
    }

    private static func launchQueryArgument(arguments: [String]) -> String? {
        launchArgument(arguments: arguments, name: launchQueryArgumentName)
    }

    static func launchMutedOverride(arguments: [String]) -> Bool? {
        guard let rawValue = launchArgument(arguments: arguments, name: launchMutedArgumentName) else {
            return nil
        }

        switch rawValue.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() {
        case "1", "true", "yes", "on":
            return true
        case "0", "false", "no", "off":
            return false
        default:
            return nil
        }
    }

    private static func launchArgument(arguments: [String], name: String) -> String? {
        for index in arguments.indices {
            let argument = arguments[index]
            if argument == name, index + 1 < arguments.count {
                return arguments[index + 1]
            }

            if argument.hasPrefix("\(name)=") {
                return String(argument.dropFirst(name.count + 1))
            }
        }

        return nil
    }

    private static func seedMutedUserScript(muted: Bool) -> WKUserScript {
        let mutedValue = muted ? "true" : "false"
        let source = """
        try {
          window.localStorage.setItem('\(mutedStorageKey)', '\(mutedValue)');
        } catch (_) {}
        """

        return WKUserScript(source: source, injectionTime: .atDocumentStart, forMainFrameOnly: true)
    }

    private static func nativeCapabilitiesUserScript(hapticsAvailable: Bool, qaAvailable: Bool) -> WKUserScript {
        let availableValue = hapticsAvailable ? "true" : "false"
        let qaValue = qaAvailable ? "true" : "false"
        let source = """
        try {
          Object.defineProperty(window, '\(nativeCapabilitiesGlobalName)', {
            value: Object.freeze({ haptics: \(availableValue), qa: \(qaValue) }),
            configurable: false,
            enumerable: false,
            writable: false
          });
        } catch (_) {}
        """

        return WKUserScript(source: source, injectionTime: .atDocumentStart, forMainFrameOnly: true)
    }

    private static func isSafeLaunchQuery(_ query: String) -> Bool {
        guard !query.isEmpty,
              query.count <= maxLaunchQueryLength,
              !query.hasPrefix("&"),
              !query.hasSuffix("&"),
              query.rangeOfCharacter(from: .whitespacesAndNewlines) == nil else {
            return false
        }

        let blockedFragments = ["://", "?", "#", "/", "\\"]
        guard !blockedFragments.contains(where: query.contains) else {
            return false
        }

        let probe = "\(webAssetScheme)://\(webAssetHost)/index.html?\(query)"
        guard let components = URLComponents(string: probe),
              components.scheme == webAssetScheme,
              components.host == webAssetHost,
              components.path == "/index.html",
              let queryItems = components.queryItems,
              !queryItems.isEmpty else {
            return false
        }

        return true
    }

    private static func containsQaLaunchControl(_ query: String) -> Bool {
        let probe = "\(webAssetScheme)://\(webAssetHost)/index.html?\(query)"
        guard let components = URLComponents(string: probe) else {
            return true
        }

        return components.queryItems?.contains { $0.name.hasPrefix("qa") } ?? true
    }

    private static let missingAssetsHTML = """
    <!doctype html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
        <style>
          html, body {
            margin: 0;
            width: 100%;
            height: 100%;
            background: #090907;
            color: #d7c6a1;
            font: 15px -apple-system, BlinkMacSystemFont, sans-serif;
          }
          body {
            display: grid;
            place-items: center;
            text-align: center;
            padding: 24px;
            box-sizing: border-box;
          }
        </style>
      </head>
      <body>Tokenizer Training web assets are missing. Run npm run build:ios-web before building the iOS target.</body>
    </html>
    """
}

final class NativeFeedbackCoordinator {
    let hapticBridge = NativeHapticBridge()
    let audioBridge = NativeAudioBridge()
    let lifecycleBridge = NativeAppLifecycleBridge()

    func install(in userContentController: WKUserContentController) {
        hapticBridge.install(in: userContentController)
        audioBridge.install(in: userContentController)
    }

    func attach(to webView: WKWebView) {
        lifecycleBridge.install(in: webView)
    }

    func remove(from userContentController: WKUserContentController) {
        lifecycleBridge.remove()
        hapticBridge.remove(from: userContentController)
        audioBridge.remove(from: userContentController)
    }
}

final class NativeAppLifecycleBridge {
    private weak var webView: WKWebView?
    private var observers: [NSObjectProtocol] = []

    func install(in webView: WKWebView) {
        remove()
        self.webView = webView
        let center = NotificationCenter.default
        observers = [
            center.addObserver(
                forName: UIApplication.willResignActiveNotification,
                object: nil,
                queue: .main
            ) { [weak self] _ in
                self?.dispatch(eventName: nativeAppPauseEventName, state: "paused")
            },
            center.addObserver(
                forName: UIApplication.didBecomeActiveNotification,
                object: nil,
                queue: .main
            ) { [weak self] _ in
                self?.dispatch(eventName: nativeAppResumeEventName, state: "active")
            }
        ]
    }

    func remove() {
        let center = NotificationCenter.default
        observers.forEach(center.removeObserver)
        observers = []
        webView = nil
    }

    private func dispatch(eventName: String, state: String) {
        let script = "window.dispatchEvent(new Event('\(eventName)'));"
        webView?.evaluateJavaScript(script) { _, error in
            #if DEBUG
            if let error {
                print("TokenizerTrainingLifecycle failed state=\(state): \(error)")
            } else {
                print("TokenizerTrainingLifecycle dispatched state=\(state)")
            }
            #endif
        }
    }

    deinit {
        remove()
    }
}

private enum NativeAudioCue: String {
    case cut
    case clear
    case resolve
    case good
    case bad
    case miss
    case falseCut
    case warning
    case ui
}

private struct NativeAudioCueShape {
    let startFrequency: Double
    let endFrequency: Double
    let duration: Double
    let toneGain: Float
    let noiseGain: Float
}

final class NativeAudioBridge: NSObject, WKScriptMessageHandler {
    private let engine = AVAudioEngine()
    private let players = (0..<4).map { _ in AVAudioPlayerNode() }
    private let format = AVAudioFormat(standardFormatWithSampleRate: 44_100, channels: 1)!
    private var nextPlayerIndex = 0
    private var isInstalled = false
    private var recentMessageTimes: [TimeInterval] = []
    #if DEBUG
    private var didReportOutputRoute = false
    #endif

    override init() {
        super.init()
        for player in players {
            engine.attach(player)
            engine.connect(player, to: engine.mainMixerNode, format: format)
        }
        engine.mainMixerNode.outputVolume = 0.9
    }

    func install(in userContentController: WKUserContentController) {
        isInstalled = true
        userContentController.add(self, name: nativeAudioMessageHandlerName)
    }

    func remove(from userContentController: WKUserContentController) {
        isInstalled = false
        recentMessageTimes.removeAll(keepingCapacity: false)
        players.forEach { $0.stop() }
        engine.stop()
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
        userContentController.removeScriptMessageHandler(forName: nativeAudioMessageHandlerName)
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard isInstalled,
              UIApplication.shared.applicationState == .active,
              message.name == nativeAudioMessageHandlerName,
              message.frameInfo.isMainFrame,
              message.frameInfo.securityOrigin.protocol == webAssetScheme,
              message.frameInfo.securityOrigin.host == webAssetHost,
              acceptsMessageRate() else {
            return
        }

        guard let payload = message.body as? [String: Any],
              Set(payload.keys) == Set(["cue"]),
              let rawCue = payload["cue"] as? String,
              let cue = NativeAudioCue(rawValue: rawCue),
              ensureEngineRunning(),
              let buffer = makeBuffer(for: cue) else {
            return
        }

        let player = players[nextPlayerIndex]
        nextPlayerIndex = (nextPlayerIndex + 1) % players.count
        player.scheduleBuffer(buffer, at: nil, options: .interrupts)
        if !player.isPlaying {
            player.play()
        }

        #if DEBUG
        print("TokenizerTrainingAudio scheduled cue=\(cue.rawValue)")
        #endif
    }

    private func acceptsMessageRate() -> Bool {
        let now = ProcessInfo.processInfo.systemUptime
        recentMessageTimes.removeAll { now - $0 >= 1 }
        guard recentMessageTimes.count < 32 else {
            return false
        }

        recentMessageTimes.append(now)
        return true
    }

    private func ensureEngineRunning() -> Bool {
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.ambient, mode: .default, options: [.mixWithOthers])
            try session.setActive(true)
            if !engine.isRunning {
                try engine.start()
            }
            #if DEBUG
            if !didReportOutputRoute {
                let routes = session.currentRoute.outputs.map { $0.portType.rawValue }.joined(separator: ",")
                print("TokenizerTrainingAudio route=\(routes) volume=\(session.outputVolume)")
                didReportOutputRoute = true
            }
            #endif
            return true
        } catch {
            #if DEBUG
            print("TokenizerTrainingAudio failed to start: \(error)")
            #endif
            return false
        }
    }

    private func makeBuffer(for cue: NativeAudioCue) -> AVAudioPCMBuffer? {
        let shape = cueShape(for: cue)
        let frameCount = AVAudioFrameCount(format.sampleRate * shape.duration)
        guard frameCount > 0,
              let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frameCount),
              let samples = buffer.floatChannelData?[0] else {
            return nil
        }

        buffer.frameLength = frameCount
        var phase = 0.0
        var previousNoise: Float = 0
        var noiseState = UInt32(truncatingIfNeeded: cue.rawValue.utf8.reduce(0) { $0 &* 31 &+ UInt32($1) })
        if noiseState == 0 {
            noiseState = 1
        }

        for frame in 0..<Int(frameCount) {
            let progress = Double(frame) / Double(max(1, Int(frameCount) - 1))
            let frequency = shape.startFrequency * pow(shape.endFrequency / shape.startFrequency, progress)
            phase += 2 * Double.pi * frequency / format.sampleRate
            noiseState = noiseState &* 1_664_525 &+ 1_013_904_223
            let noise = Float(Double(noiseState) / Double(UInt32.max) * 2 - 1)
            let materialNoise: Float
            if cue == .cut {
                materialNoise = max(-1, min(1, (noise - previousNoise) * 0.9))
            } else {
                materialNoise = noise
            }
            previousNoise = noise
            let attack = min(1, progress / 0.08)
            let release = max(0, 1 - progress)
            let envelope = Float(attack * release * release)
            samples[frame] = envelope * (Float(sin(phase)) * shape.toneGain + materialNoise * shape.noiseGain)
        }

        return buffer
    }

    private func cueShape(for cue: NativeAudioCue) -> NativeAudioCueShape {
        switch cue {
        case .cut:
            return NativeAudioCueShape(startFrequency: 760, endFrequency: 180, duration: 0.058, toneGain: 0.06, noiseGain: 0.16)
        case .clear:
            return NativeAudioCueShape(startFrequency: 350, endFrequency: 220, duration: 0.082, toneGain: 0.2, noiseGain: 0.07)
        case .resolve:
            return NativeAudioCueShape(startFrequency: 210, endFrequency: 270, duration: 0.128, toneGain: 0.22, noiseGain: 0.04)
        case .good:
            return NativeAudioCueShape(startFrequency: 470, endFrequency: 680, duration: 0.118, toneGain: 0.24, noiseGain: 0.05)
        case .bad:
            return NativeAudioCueShape(startFrequency: 205, endFrequency: 142, duration: 0.15, toneGain: 0.26, noiseGain: 0.07)
        case .miss:
            return NativeAudioCueShape(startFrequency: 185, endFrequency: 128, duration: 0.112, toneGain: 0.22, noiseGain: 0.08)
        case .falseCut:
            return NativeAudioCueShape(startFrequency: 310, endFrequency: 230, duration: 0.064, toneGain: 0.22, noiseGain: 0.1)
        case .warning:
            return NativeAudioCueShape(startFrequency: 106, endFrequency: 90, duration: 0.19, toneGain: 0.27, noiseGain: 0.04)
        case .ui:
            return NativeAudioCueShape(startFrequency: 440, endFrequency: 350, duration: 0.046, toneGain: 0.18, noiseGain: 0.05)
        }
    }
}

private enum NativeHapticCue: String {
    case cut
    case confirm
    case clear
    case miss
    case warning
}

final class NativeHapticBridge: NSObject, WKScriptMessageHandler {
    let hapticsAvailable = CHHapticEngine.capabilitiesForHardware().supportsHaptics

    private let cutGenerator = UIImpactFeedbackGenerator(style: .light)
    private let confirmGenerator = UIImpactFeedbackGenerator(style: .rigid)
    private let clearGenerator = UIImpactFeedbackGenerator(style: .soft)
    private let notificationGenerator = UINotificationFeedbackGenerator()
    private var isInstalled = false
    private var recentMessageTimes: [TimeInterval] = []

    func install(in userContentController: WKUserContentController) {
        isInstalled = true
        userContentController.add(self, name: nativeHapticMessageHandlerName)
    }

    func remove(from userContentController: WKUserContentController) {
        isInstalled = false
        recentMessageTimes.removeAll(keepingCapacity: false)
        userContentController.removeScriptMessageHandler(forName: nativeHapticMessageHandlerName)
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard isInstalled,
              hapticsAvailable,
              UIApplication.shared.applicationState == .active,
              message.name == nativeHapticMessageHandlerName,
              message.frameInfo.isMainFrame,
              message.frameInfo.securityOrigin.protocol == webAssetScheme,
              message.frameInfo.securityOrigin.host == webAssetHost,
              acceptsMessageRate() else {
            return
        }

        guard let payload = message.body as? [String: Any],
              Set(payload.keys) == Set(["cue", "repeats"]),
              let rawCue = payload["cue"] as? String,
              let cue = NativeHapticCue(rawValue: rawCue),
              let repeatsNumber = payload["repeats"] as? NSNumber,
              CFGetTypeID(repeatsNumber) != CFBooleanGetTypeID(),
              repeatsNumber.doubleValue == Double(repeatsNumber.intValue) else {
            return
        }

        let repeats = repeatsNumber.intValue
        guard repeats >= 1,
              repeats <= maxNativeHapticRepeats,
              cue == .cut || repeats == 1 else {
            return
        }

        play(cue, repeats: repeats)
    }

    private func acceptsMessageRate() -> Bool {
        let now = ProcessInfo.processInfo.systemUptime
        recentMessageTimes.removeAll { now - $0 >= 1 }
        guard recentMessageTimes.count < 16 else {
            return false
        }

        recentMessageTimes.append(now)
        return true
    }

    private func play(_ cue: NativeHapticCue, repeats: Int) {
        for index in 0..<repeats {
            DispatchQueue.main.asyncAfter(deadline: .now() + Double(index) * 0.04) { [weak self] in
                guard let self, self.isInstalled else {
                    return
                }

                self.playOnce(cue)
            }
        }
    }

    private func playOnce(_ cue: NativeHapticCue) {
        switch cue {
        case .cut:
            cutGenerator.prepare()
            cutGenerator.impactOccurred(intensity: 0.58)
        case .confirm:
            confirmGenerator.prepare()
            confirmGenerator.impactOccurred(intensity: 0.52)
        case .clear:
            clearGenerator.prepare()
            clearGenerator.impactOccurred(intensity: 0.45)
        case .miss:
            notificationGenerator.prepare()
            notificationGenerator.notificationOccurred(.error)
        case .warning:
            notificationGenerator.prepare()
            notificationGenerator.notificationOccurred(.warning)
        }
    }
}

final class BundleWebAssetSchemeHandler: NSObject, WKURLSchemeHandler {
    func webView(_ webView: WKWebView, start urlSchemeTask: WKURLSchemeTask) {
        guard let requestURL = urlSchemeTask.request.url,
              requestURL.scheme == webAssetScheme,
              requestURL.host == webAssetHost,
              let fileURL = fileURL(for: requestURL) else {
            urlSchemeTask.didFailWithError(BundleWebAssetError.invalidURL)
            return
        }

        do {
            let data = try Data(contentsOf: fileURL)
            let response = HTTPURLResponse(
                url: requestURL,
                statusCode: 200,
                httpVersion: "HTTP/1.1",
                headerFields: responseHeaders(for: fileURL.pathExtension, byteCount: data.count)
            ) ?? URLResponse(
                url: requestURL,
                mimeType: mimeType(for: fileURL.pathExtension),
                expectedContentLength: data.count,
                textEncodingName: textEncodingName(for: fileURL.pathExtension)
            )
            urlSchemeTask.didReceive(response)
            urlSchemeTask.didReceive(data)
            urlSchemeTask.didFinish()
        } catch {
            urlSchemeTask.didFailWithError(error)
        }
    }

    func webView(_ webView: WKWebView, stop urlSchemeTask: WKURLSchemeTask) {}

    private func fileURL(for requestURL: URL) -> URL? {
        guard let resourceURL = Bundle.main.resourceURL else {
            return nil
        }

        let rawPath = requestURL.path.removingPercentEncoding ?? requestURL.path
        let pathComponents = rawPath.split(separator: "/").map(String.init)
        let sanitizedComponents = pathComponents.isEmpty ? ["index.html"] : pathComponents

        guard sanitizedComponents.allSatisfy({ !$0.isEmpty && $0 != "." && $0 != ".." }) else {
            return nil
        }

        return sanitizedComponents.reduce(
            resourceURL.appendingPathComponent(webAssetRoot, isDirectory: true),
            { partialURL, component in partialURL.appendingPathComponent(component) }
        )
    }

    private func mimeType(for pathExtension: String) -> String {
        switch pathExtension.lowercased() {
        case "html":
            return "text/html"
        case "js", "mjs":
            return "text/javascript"
        case "css":
            return "text/css"
        case "json":
            return "application/json"
        case "png":
            return "image/png"
        case "jpg", "jpeg":
            return "image/jpeg"
        case "svg":
            return "image/svg+xml"
        case "webp":
            return "image/webp"
        case "mp3":
            return "audio/mpeg"
        case "wav":
            return "audio/wav"
        case "ogg":
            return "audio/ogg"
        case "woff2":
            return "font/woff2"
        default:
            return "application/octet-stream"
        }
    }

    private func responseHeaders(for pathExtension: String, byteCount: Int) -> [String: String] {
        var headers = [
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            "Content-Length": "\(byteCount)",
            "Expires": "0",
            "Pragma": "no-cache"
        ]
        let mimeType = mimeType(for: pathExtension)

        if let encoding = textEncodingName(for: pathExtension) {
            headers["Content-Type"] = "\(mimeType); charset=\(encoding)"
        } else {
            headers["Content-Type"] = mimeType
        }

        return headers
    }

    private func textEncodingName(for pathExtension: String) -> String? {
        switch pathExtension.lowercased() {
        case "html", "js", "mjs", "css", "json", "svg":
            return "utf-8"
        default:
            return nil
        }
    }
}

enum BundleWebAssetError: Error {
    case invalidURL
}
