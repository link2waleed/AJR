import WidgetKit
import SwiftUI

// MARK: - Shared Data Model

struct AJRWidgetData: Codable {
    let salah: RingData
    let quran: RingData
    let dhikr: RingData
    let journal: RingData?
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
        journal: RingData(percentage: 30, isActive: true),
        overallProgress: 62,
        nextSalah: NextSalahData(name: "Maghrib", timeRemaining: "2h 15m", timeString: "7:32 PM"),
        circleData: CircleData(hasCircles: true, name: "Quran Circle", percentage: 65, otherCirclesCount: 2),
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

// MARK: - Extension for Date Rollover Reset

extension AJRWidgetData {
    func checkAndResetForDate(_ checkDate: Date) -> AJRWidgetData {
        guard let lastUpdatedString = lastUpdated else { return self }
        
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        guard let lastUpdatedDate = formatter.date(from: lastUpdatedString) ?? ISO8601DateFormatter().date(from: lastUpdatedString) else {
            return self
        }
        
        let calendar = Calendar.current
        if !calendar.isDate(lastUpdatedDate, inSameDayAs: checkDate) && checkDate > lastUpdatedDate {
            let resetSalah = RingData(percentage: 0, completed: 0, total: salah.total, isActive: salah.isActive)
            let resetQuran = RingData(percentage: 0, completed: 0, total: quran.total, isActive: quran.isActive)
            let resetDhikr = RingData(percentage: 0, completed: 0, total: dhikr.total, isActive: dhikr.isActive)
            let resetJournal = journal != nil ? RingData(percentage: 0, completed: 0, total: journal?.total, isActive: journal?.isActive) : nil
            
            return AJRWidgetData(
                salah: resetSalah,
                quran: resetQuran,
                dhikr: resetDhikr,
                journal: resetJournal,
                overallProgress: 0,
                nextSalah: nextSalah,
                circleData: circleData,
                hasJournalActive: hasJournalActive,
                lastUpdated: lastUpdated
            )
        }
        
        return self
    }
}

// MARK: - Timeline Provider

struct AJRTimelineProvider: TimelineProvider {
    func placeholder(in context: Context) -> AJREntry {
        AJREntry(date: .now, data: .placeholder)
    }

    func getSnapshot(in context: Context, completion: @escaping (AJREntry) -> Void) {
        let entry = AJREntry(date: .now, data: SharedDataReader.read().checkAndResetForDate(.now))
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<AJREntry>) -> Void) {
        let rawData = SharedDataReader.read()
        let now = Date()
        
        // Add current entry checked for date rollover
        let currentData = rawData.checkAndResetForDate(now)
        var entries: [AJREntry] = [AJREntry(date: now, data: currentData)]

        // Create future entries from the schedule
        if let schedule = currentData.nextSalah.schedule {
            for item in schedule {
                if let targetDate = item.targetDate, targetDate > now {
                    var nextData = currentData
                    nextData.nextSalah = AJRWidgetData.NextSalahData(
                        name: item.name,
                        timeRemaining: "—",
                        timeString: item.timeString,
                        targetDateString: item.targetDateString,
                        schedule: schedule
                    )
                    // Check and reset this future entry if it crosses midnight relative to lastUpdated
                    let nextDataChecked = nextData.checkAndResetForDate(targetDate)
                    entries.append(AJREntry(date: targetDate, data: nextDataChecked))
                }
            }
        }

        // Schedule an entry precisely at midnight local time to reset progress dynamically
        let calendar = Calendar.current
        if let nextMidnight = calendar.nextDate(after: now, matching: DateComponents(hour: 0, minute: 0, second: 0), matchingPolicy: .nextTime) {
            let midnightData = rawData.checkAndResetForDate(nextMidnight)
            entries.append(AJREntry(date: nextMidnight, data: midnightData))
        }

        // Sort entries chronologically for WidgetKit
        entries.sort { $0.date < $1.date }

        // Refresh every 15 minutes as a fallback
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: now)!
        let timeline = Timeline(entries: entries, policy: .after(nextUpdate))
        completion(timeline)
    }
}
