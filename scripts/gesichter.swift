// Gesichtserkennung mit Apple Vision (lokal, nichts wird hochgeladen).
// Aufruf: swift scripts/gesichter.swift bild1.jpg bild2.png …
// Ausgabe: eine JSON-Zeile pro Bild:
// {"pfad": "...", "breite": 1200, "hoehe": 800, "gesichter": [[x, y, b, h], …]}
// Koordinaten 0..1, Ursprung oben links (bereits gedreht nach EXIF-Ausrichtung).
import Foundation
import ImageIO
import Vision

func ausrichtung(_ wert: UInt32) -> CGImagePropertyOrientation {
	CGImagePropertyOrientation(rawValue: wert) ?? .up
}

for pfad in CommandLine.arguments.dropFirst() {
	var aus: [String: Any] = ["pfad": pfad, "gesichter": [[Double]]()]
	let url = URL(fileURLWithPath: pfad)
	guard let quelle = CGImageSourceCreateWithURL(url as CFURL, nil),
		let bild = CGImageSourceCreateImageAtIndex(quelle, 0, nil)
	else {
		aus["fehler"] = "nicht lesbar"
		print(String(data: try! JSONSerialization.data(withJSONObject: aus), encoding: .utf8)!)
		continue
	}
	let props = CGImageSourceCopyPropertiesAtIndex(quelle, 0, nil) as? [CFString: Any]
	let o = ausrichtung((props?[kCGImagePropertyOrientation] as? UInt32) ?? 1)
	let gedreht = [CGImagePropertyOrientation.left, .right, .leftMirrored, .rightMirrored].contains(o)
	aus["breite"] = gedreht ? bild.height : bild.width
	aus["hoehe"] = gedreht ? bild.width : bild.height
	let anfrage = VNDetectFaceRectanglesRequest()
	let handler = VNImageRequestHandler(cgImage: bild, orientation: o, options: [:])
	do {
		try handler.perform([anfrage])
		let boxen = (anfrage.results ?? []).filter { $0.confidence >= 0.5 }.map { f -> [Double] in
			let b = f.boundingBox
			return [Double(b.minX), Double(1 - b.maxY), Double(b.width), Double(b.height)]
		}
		aus["gesichter"] = boxen
	} catch {
		aus["fehler"] = "\(error)"
	}
	print(String(data: try! JSONSerialization.data(withJSONObject: aus), encoding: .utf8)!)
}
