// Draws the Flow Count app icon: a circle drawn by a sparkler, in one blue on black.
//
// Light from the trail, its embers and the sparks is summed into one intensity buffer, bloomed,
// then mapped onto a single-hue ramp (black → deep blue → royal blue → pale blue → near white),
// so brightness changes along the circle but the color itself never does.
//
// Writes icon.png, android-icon-foreground.png and android-icon-monochrome.png into the given
// folder (macOS):
//
//   swiftc -O scripts/app-icon.swift -o /tmp/app-icon && /tmp/app-icon assets

import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers

let size = 1024
let center = Double(size) / 2
let deg = Double.pi / 180

// MARK: - Random numbers

/// Seeded, so the icon comes out the same on every run.
struct RNG {
  private var state: UInt64
  init(seed: UInt64) { state = seed }

  mutating func next() -> Double {
    state &+= 0x9E37_79B9_7F4A_7C15
    var z = state
    z = (z ^ (z >> 30)) &* 0xBF58_476D_1CE4_E5B9
    z = (z ^ (z >> 27)) &* 0x94D0_49BB_1331_11EB
    z ^= z >> 31
    return Double(z >> 11) / 9_007_199_254_740_992.0
  }

  mutating func range(_ a: Double, _ b: Double) -> Double { a + (b - a) * next() }

  mutating func gauss() -> Double {
    let u = max(next(), 1e-12)
    return (-2 * log(u)).squareRoot() * cos(2 * Double.pi * next())
  }
}

// MARK: - Light buffer

/// Every primitive is a soft gaussian, so overlapping light adds up as real light does.
final class Light {
  let n: Int
  var px: [Float]

  init(size: Int) {
    n = size
    px = [Float](repeating: 0, count: size * size)
  }

  func dot(_ x: Double, _ y: Double, sigma: Double, amp: Double) {
    guard amp > 0.0005 else { return }
    let r = sigma * 3
    let x0 = max(0, Int((x - r).rounded(.down))), x1 = min(n - 1, Int((x + r).rounded(.up)))
    let y0 = max(0, Int((y - r).rounded(.down))), y1 = min(n - 1, Int((y + r).rounded(.up)))
    guard x0 <= x1, y0 <= y1 else { return }
    let inv = 1 / (2 * sigma * sigma)
    for j in y0...y1 {
      let dy = Double(j) + 0.5 - y
      for i in x0...x1 {
        let dx = Double(i) + 0.5 - x
        px[j * n + i] += Float(amp * exp(-(dx * dx + dy * dy) * inv))
      }
    }
  }

  /// A thin line from a to b whose brightness goes from ampA to ampB.
  func streak(
    _ ax: Double, _ ay: Double, _ bx: Double, _ by: Double,
    sigma: Double, ampA: Double, ampB: Double
  ) {
    let r = sigma * 3
    let x0 = max(0, Int((min(ax, bx) - r).rounded(.down)))
    let x1 = min(n - 1, Int((max(ax, bx) + r).rounded(.up)))
    let y0 = max(0, Int((min(ay, by) - r).rounded(.down)))
    let y1 = min(n - 1, Int((max(ay, by) + r).rounded(.up)))
    guard x0 <= x1, y0 <= y1 else { return }
    let vx = bx - ax, vy = by - ay
    let len2 = max(vx * vx + vy * vy, 1e-9)
    let inv = 1 / (2 * sigma * sigma)
    for j in y0...y1 {
      let py = Double(j) + 0.5 - ay
      for i in x0...x1 {
        let pxx = Double(i) + 0.5 - ax
        let t = min(max((pxx * vx + py * vy) / len2, 0), 1)
        let a = ampA + (ampB - ampA) * t
        if a <= 0 { continue }
        let dx = pxx - t * vx, dy = py - t * vy
        px[j * n + i] += Float(a * exp(-(dx * dx + dy * dy) * inv))
      }
    }
  }

  /// An arc around the center, clockwise from `start` over `sweep`; `amp` gives its brightness
  /// by how far along it a point is, from 0 to 1.
  func arc(radius: Double, start: Double, sweep: Double, sigma: Double, amp: (Double) -> Double) {
    let band = sigma * 3
    let reach = radius + band
    let lo = max(0, Int((center - reach).rounded(.down)))
    let hi = min(n - 1, Int((center + reach).rounded(.up)))
    let inv = 1 / (2 * sigma * sigma)
    let twoPi = 2 * Double.pi
    for j in lo...hi {
      let dy = Double(j) + 0.5 - center
      for i in lo...hi {
        let dx = Double(i) + 0.5 - center
        let d = (dx * dx + dy * dy).squareRoot() - radius
        if abs(d) > band { continue }
        var t = atan2(dy, dx) - start
        t -= twoPi * (t / twoPi).rounded(.down)
        if t > sweep { continue }
        px[j * n + i] += Float(amp(t / sweep) * exp(-d * d * inv))
      }
    }
  }
}

func polar(_ angle: Double, _ radius: Double) -> (Double, Double) {
  (center + cos(angle) * radius, center + sin(angle) * radius)
}

/// The branching sparks a sparkler throws out of its burning point.
func sparks(
  _ light: Light, rng: inout RNG, at x: Double, _ y: Double, count: Int,
  minLength: Double, maxLength: Double, scale k: Double, branching: Double, brightness: Double
) {
  for _ in 0..<count {
    let a = rng.range(0, 2 * Double.pi)
    let length = (minLength + (maxLength - minLength) * pow(rng.next(), 1.8)) * k
    let dx = cos(a), dy = sin(a)
    let rx = x + dx * 4 * k, ry = y + dy * 4 * k
    let tx = x + dx * length, ty = y + dy * length
    let amp = rng.range(0.6, 1.0) * brightness
    light.streak(rx, ry, tx, ty, sigma: 0.95 * k, ampA: amp, ampB: 0)
    guard length > 60 * k, rng.next() < branching else { continue }
    let t = rng.range(0.45, 0.7)
    let bx = rx + (tx - rx) * t, by = ry + (ty - ry) * t
    let branches = rng.next() < 0.5 ? 2 : 3
    for b in 0..<branches {
      let ba = a + rng.range(16, 38) * deg * (b % 2 == 0 ? 1 : -1)
      let bl = length * rng.range(0.22, 0.42)
      light.streak(
        bx, by, bx + cos(ba) * bl, by + sin(ba) * bl,
        sigma: 0.85 * k, ampA: amp * (1 - t) * 0.95, ampB: 0)
    }
  }
}

// MARK: - The drawing

/// A long-exposure sparkler trail starting at the top and running clockwise, hottest at the
/// burning point, which throws branching sparks. `k` scales the whole drawing about the center.
func sparkler(_ light: Light, k: Double) {
  var rng = RNG(seed: 11)
  let radius = 305 * k
  let start = -90 * deg, sweep = 318 * deg
  let fadeIn = { (f: Double) in min(f / 0.04, 1) }
  light.arc(radius: radius, start: start, sweep: sweep, sigma: 2.6 * k) { f in
    fadeIn(f) * (0.07 + 1.05 * pow(f, 2.4))
  }
  light.arc(radius: radius, start: start, sweep: sweep, sigma: 7 * k) { f in
    fadeIn(f) * (0.02 + 0.3 * pow(f, 2))
  }
  for _ in 0..<700 {
    let f = pow(rng.next(), 0.55)
    let (x, y) = polar(start + f * sweep, radius + rng.gauss() * (2 + 16 * (1 - f)) * k)
    light.dot(x, y, sigma: rng.range(0.8, 1.8) * k, amp: (0.05 + 0.9 * pow(f, 2.5)) * rng.range(0.3, 1))
  }
  let (hx, hy) = polar(start + sweep, radius)
  light.dot(hx, hy, sigma: 7 * k, amp: 7)
  light.dot(hx, hy, sigma: 20 * k, amp: 1.3)
  sparks(
    light, rng: &rng, at: hx, hy, count: 46, minLength: 26, maxLength: 150, scale: k,
    branching: 0.65, brightness: 1.9)
}

// MARK: - Bloom, color and output

func blur(_ src: [Float], n: Int, sigma: Double) -> [Float] {
  let radius = Int((sigma * 3).rounded(.up))
  var kernel = [Float](repeating: 0, count: 2 * radius + 1)
  var total: Float = 0
  for i in -radius...radius {
    let w = Float(exp(-Double(i * i) / (2 * sigma * sigma)))
    kernel[i + radius] = w
    total += w
  }
  for i in kernel.indices { kernel[i] /= total }
  var tmp = [Float](repeating: 0, count: n * n)
  var out = [Float](repeating: 0, count: n * n)
  src.withUnsafeBufferPointer { s in
    tmp.withUnsafeMutableBufferPointer { t in
      for y in 0..<n {
        let row = y * n
        for x in 0..<n {
          var acc: Float = 0
          let lo = max(-radius, -x), hi = min(radius, n - 1 - x)
          for i in lo...hi { acc += s[row + x + i] * kernel[i + radius] }
          t[row + x] = acc
        }
      }
    }
  }
  tmp.withUnsafeBufferPointer { t in
    out.withUnsafeMutableBufferPointer { o in
      for y in 0..<n {
        let lo = max(-radius, -y), hi = min(radius, n - 1 - y)
        let dst = y * n
        for i in lo...hi {
          let w = kernel[i + radius]
          let src = (y + i) * n
          for x in 0..<n { o[dst + x] += t[src + x] * w }
        }
      }
    }
  }
  return out
}

/// One hue (about 225°, royal blue) from black to near white; only lightness changes.
let ramp: [(at: Double, r: Double, g: Double, b: Double)] = [
  (0.00, 0, 0, 0),
  (0.18, 5, 12, 46),
  (0.40, 15, 43, 143),
  (0.62, 35, 83, 224),
  (0.82, 124, 155, 255),
  (0.94, 201, 214, 255),
  (1.00, 242, 245, 255),
]

func color(_ v: Double) -> (Double, Double, Double) {
  for i in 1..<ramp.count where v <= ramp[i].at {
    let a = ramp[i - 1], b = ramp[i]
    let t = (v - a.at) / (b.at - a.at)
    return (
      (a.r + (b.r - a.r) * t) / 255, (a.g + (b.g - a.g) * t) / 255, (a.b + (b.b - a.b) * t) / 255
    )
  }
  let last = ramp[ramp.count - 1]
  return (last.r / 255, last.g / 255, last.b / 255)
}

enum Mode { case color, foreground, monochrome }

func render(_ light: Light, k: Double, mode: Mode, path: String) {
  let n = light.n
  let near = blur(light.px, n: n, sigma: 3.5 * k)
  let mid = blur(light.px, n: n, sigma: 12 * k)
  let far = blur(light.px, n: n, sigma: 42 * k)
  var bytes = [UInt8](repeating: 0, count: n * n * 4)
  func byte(_ x: Double) -> UInt8 { UInt8(max(0, min(255, (x * 255).rounded()))) }
  for p in 0..<(n * n) {
    let e = Double(light.px[p]) + 0.9 * Double(near[p]) + 0.6 * Double(mid[p]) + 0.45 * Double(far[p])
    let v = 1 - exp(-e * 1.3)
    let (r, g, b) = color(v)
    switch mode {
    case .color:
      bytes[p * 4] = byte(r)
      bytes[p * 4 + 1] = byte(g)
      bytes[p * 4 + 2] = byte(b)
      bytes[p * 4 + 3] = 255
    case .foreground:
      // Premultiplied over the black background layer, this gives back the color version.
      bytes[p * 4] = byte(r)
      bytes[p * 4 + 1] = byte(g)
      bytes[p * 4 + 2] = byte(b)
      bytes[p * 4 + 3] = byte(max(r, g, b))
    case .monochrome:
      let a = byte(min(1, v * 1.2))
      bytes[p * 4] = a
      bytes[p * 4 + 1] = a
      bytes[p * 4 + 2] = a
      bytes[p * 4 + 3] = a
    }
  }
  // The iOS icon must be opaque; the Android layers need their transparency.
  let alpha: CGImageAlphaInfo = mode == .color ? .noneSkipLast : .premultipliedLast
  let data = CFDataCreate(nil, bytes, bytes.count)!
  let image = CGImage(
    width: n, height: n, bitsPerComponent: 8, bitsPerPixel: 32, bytesPerRow: n * 4,
    space: CGColorSpace(name: CGColorSpace.sRGB)!,
    bitmapInfo: CGBitmapInfo(rawValue: alpha.rawValue),
    provider: CGDataProvider(data: data)!, decode: nil, shouldInterpolate: true,
    intent: .defaultIntent)!
  let destination = CGImageDestinationCreateWithURL(
    URL(fileURLWithPath: path) as CFURL, UTType.png.identifier as CFString, 1, nil)!
  CGImageDestinationAddImage(destination, image, nil)
  guard CGImageDestinationFinalize(destination) else {
    print("couldn't write \(path)")
    exit(1)
  }
  print("wrote \(path)")
}

// MARK: - Main

let folder = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "assets"
/// Android masks adaptive icons to shapes as small as the middle 61% of a layer, so its layers
/// carry the same drawing scaled down to stay inside that.
let androidScale = 0.66
let outputs: [(file: String, k: Double, mode: Mode)] = [
  ("icon.png", 1, .color),
  ("android-icon-foreground.png", androidScale, .foreground),
  ("android-icon-monochrome.png", androidScale, .monochrome),
]
for output in outputs {
  let light = Light(size: size)
  sparkler(light, k: output.k)
  render(light, k: output.k, mode: output.mode, path: "\(folder)/\(output.file)")
}
