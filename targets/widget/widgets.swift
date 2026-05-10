import WidgetKit
import SwiftUI

// MARK: - Shared Data Model

struct AJRWidgetData: Codable {
    let salah: RingData
    let quran: RingData
    let dhikr: RingData
    let overallProgress: Int
    var nextSalah: NextSalahData
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
        var targetDateString: String?
        var schedule: [ScheduleItem]?
        
        struct ScheduleItem: Codable {
            let name: String
            let timeString: String
            let targetDateString: String
            var targetDate: Date? {
                let formatter = ISO8601DateFormatter()
                formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
                if let d = formatter.date(from: targetDateString) { return d }
                let fallback = ISO8601DateFormatter()
                return fallback.date(from: targetDateString)
            }
        }
        
        var targetDate: Date? {
            guard let dateString = targetDateString else { return nil }
            let formatter = ISO8601DateFormatter()
            formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            if let d = formatter.date(from: dateString) { return d }
            let fallback = ISO8601DateFormatter()
            return fallback.date(from: dateString)
        }
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
        var entries: [AJREntry] = []
        
        // Add current entry
        entries.append(AJREntry(date: now, data: data))

        // Create future entries from the schedule
        if let schedule = data.nextSalah.schedule {
            for item in schedule {
                if let targetDate = item.targetDate, targetDate > now {
                    var nextData = data
                    nextData.nextSalah = AJRWidgetData.NextSalahData(
                        name: item.name,
                        timeRemaining: "—",
                        timeString: item.timeString,
                        targetDateString: item.targetDateString,
                        schedule: schedule
                    )
                    entries.append(AJREntry(date: targetDate, data: nextData))
                }
            }
        }

        // Refresh every 15 minutes as a fallback
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: now)!
        let timeline = Timeline(entries: entries, policy: .after(nextUpdate))
        completion(timeline)
    }
}
