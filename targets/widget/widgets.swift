import WidgetKit
import SwiftUI

// MARK: - Shared Data Model

struct AJRWidgetData: Codable {
    let salah: RingData
    let quran: RingData
    let dhikr: RingData
    let overallProgress: Int
    let nextSalah: NextSalahData
    let circleData: CircleData
    var hasJournalActive: Bool?
    let lastUpdated: String?

    struct RingData: Codable {
        let percentage: Int
        var completed: Int?
        var total: Int?
        var isActive: Bool?
    }

    struct NextSalahData: Codable {
        let name: String
        let timeRemaining: String
        let timeString: String
    }
    
    struct CircleData: Codable {
        let hasCircles: Bool
        let name: String
        let percentage: Int
        let otherCirclesCount: Int
    }

    static let placeholder = AJRWidgetData(
        salah: RingData(percentage: 60, completed: 3, total: 5, isActive: true),
        quran: RingData(percentage: 45, isActive: true),
        dhikr: RingData(percentage: 80, isActive: true),
        overallProgress: 62,
        nextSalah: NextSalahData(name: "Maghrib", timeRemaining: "2h 15m", timeString: "7:32 PM"),
        circleData: CircleData(hasCircles: true, name: "Qur'an Circle", percentage: 65, otherCirclesCount: 2),
        hasJournalActive: true,
        lastUpdated: nil
    )
}

// MARK: - Shared Data Reader

struct SharedDataReader {
    static let appGroup = "group.com.my.AJR"
    static let dataKey = "ajr_widget_data"

    static func read() -> AJRWidgetData {
        guard let defaults = UserDefaults(suiteName: appGroup),
              let jsonString = defaults.string(forKey: dataKey),
              let data = jsonString.data(using: .utf8) else {
            return .placeholder
        }

        do {
            return try JSONDecoder().decode(AJRWidgetData.self, from: data)
        } catch {
            print("AJR Widget: Failed to decode data – \(error)")
            return .placeholder
        }
    }
}

// MARK: - Timeline Entry

struct AJREntry: TimelineEntry {
    let date: Date
    let data: AJRWidgetData
}

// MARK: - Timeline Provider

struct AJRTimelineProvider: TimelineProvider {
    func placeholder(in context: Context) -> AJREntry {
        AJREntry(date: .now, data: .placeholder)
    }

    func getSnapshot(in context: Context, completion: @escaping (AJREntry) -> Void) {
        let entry = AJREntry(date: .now, data: SharedDataReader.read())
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<AJREntry>) -> Void) {
        let data = SharedDataReader.read()
        let now = Date()
        // Refresh every 15 minutes
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: now)!
        let entry = AJREntry(date: now, data: data)
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
}
