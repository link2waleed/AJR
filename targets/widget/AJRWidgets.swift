import WidgetKit
import SwiftUI

// MARK: - Widget Background Modifier (iOS 17+ containerBackground)

struct WidgetBackground: ViewModifier {
    func body(content: Content) -> some View {
        content
            .containerBackground(for: .widget) {
                LinearGradient(
                    colors: [AJRColors.bgTop.opacity(0.3), AJRColors.cream],
                    startPoint: .top,
                    endPoint: .bottom
                )
            }
    }
}

extension View {
    func ajrWidgetBackground() -> some View {
        modifier(WidgetBackground())
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MARK: — 1. Daily AJR Rings Widget
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

struct DailyAJRRingsWidget: Widget {
    let kind = "DailyAJRRings"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: AJRTimelineProvider()) { entry in
            DailyAJRRingsEntryView(entry: entry)
                .ajrWidgetBackground()
        }
        .configurationDisplayName("Daily AJR")
        .description("Track your Salah, Quran & Dhikr progress.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

struct DailyAJRRingsEntryView: View {
    var entry: AJREntry

    @Environment(\.widgetFamily) var family

    var body: some View {
        switch family {
        case .systemSmall:
            smallRingsView
        case .systemMedium:
            mediumRingsView
        default:
            smallRingsView
        }
    }

    // Small: Just the rings, centered
    private var smallRingsView: some View {
        DailyRingsView(data: entry.data, compact: true)
            .widgetURL(URL(string: "ajr://dailygrowth"))
    }

    // Medium: Rings + legend side by side
    private var mediumRingsView: some View {
        HStack(spacing: 16) {
            DailyRingsView(data: entry.data, compact: false)
                .frame(maxWidth: .infinity)

            Divider()
                .padding(.vertical, 20)
                .background(Color.black.opacity(0.1))

            legendListView(withDividers: false)
                .frame(width: 140, alignment: .leading)
                .padding(.leading, 12)
        }
        .padding(.horizontal, 12)
        .widgetURL(URL(string: "ajr://dailygrowth"))
    }

    @ViewBuilder
    private func legendListView(withDividers: Bool) -> some View {
        let activeLegends: [(id: Int, color: Color, label: String, pct: Int)] = [
            (entry.data.salah.isActive ?? true) ? (0, AJRColors.salahRing, "Salah", entry.data.salah.percentage) : nil,
            (entry.data.quran.isActive ?? true) ? (1, AJRColors.quranRing, "Quran", entry.data.quran.percentage) : nil,
            (entry.data.dhikr.isActive ?? true) ? (2, AJRColors.dhikrRing, "Dhikr", entry.data.dhikr.percentage) : nil,
            (entry.data.journal?.isActive ?? false) ? (3, AJRColors.journalRing, "Journal", entry.data.journal?.percentage ?? 0) : nil
        ].compactMap { $0 }

        VStack(alignment: .leading, spacing: withDividers ? 14 : 15) {
            ForEach(Array(activeLegends.enumerated()), id: \.element.id) { index, item in
                legendRow(color: item.color, label: item.label, pct: item.pct)
                if withDividers && index < activeLegends.count - 1 {
                    Divider().background(Color.black.opacity(0.05))
                }
            }
        }
    }

    private func legendRow(color: Color, label: String, pct: Int) -> some View {
        HStack(spacing: 12) {
            Circle()
                .fill(color)
                .frame(width: 8, height: 8)
            
            Text(label)
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(AJRColors.textBlack)
            
            Spacer()
            
            Text("\(pct)%")
                .font(.system(size: 14, weight: .bold, design: .rounded))
                .foregroundColor(AJRColors.textGrey)
        }
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MARK: — 2. Next Salah Widget
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

struct NextSalahWidget: Widget {
    let kind = "NextSalah"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: AJRTimelineProvider()) { entry in
            NextSalahEntryView(entry: entry)
                .ajrWidgetBackground()
        }
        .configurationDisplayName("Next Salah")
        .description("See your next prayer time at a glance.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

struct NextSalahEntryView: View {
    var entry: AJREntry
    @Environment(\.widgetFamily) var family

    var body: some View {
        switch family {
        case .systemMedium:
            MediumNextSalahView(data: entry.data.nextSalah)
                .widgetURL(URL(string: "ajr://salah"))
        default:
            NextSalahView(data: entry.data.nextSalah, compact: true)
                .widgetURL(URL(string: "ajr://salah"))
        }
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MARK: — 3. Circle Progress Widget
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

struct CircleProgressWidget: Widget {
    let kind = "CircleProgress"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: AJRTimelineProvider()) { entry in
            CircleProgressEntryView(entry: entry)
                .ajrWidgetBackground()
        }
        .configurationDisplayName("My Circle")
        .description("See your circle's overall completion.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

struct CircleProgressEntryView: View {
    var entry: AJREntry
    @Environment(\.widgetFamily) var family

    var body: some View {
        switch family {
        case .systemMedium:
            MediumCircleProgressView(data: entry.data.circleData)
                .widgetURL(URL(string: "ajr://mycircle"))
        default:
            CircleProgressView(data: entry.data.circleData, compact: true)
                .widgetURL(URL(string: "ajr://mycircle"))
        }
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MARK: — 4. Combined Large Widget
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

struct CombinedAJRWidget: Widget {
    let kind = "CombinedAJR"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: AJRTimelineProvider()) { entry in
            CombinedAJREntryView(entry: entry)
                .ajrWidgetBackground()
        }
        .configurationDisplayName("AJR Overview")
        .description("Daily rings, next salah, and circle progress.")
        .supportedFamilies([.systemMedium, .systemLarge])
    }
}

struct CombinedAJREntryView: View {
    var entry: AJREntry

    @Environment(\.widgetFamily) var family

    var body: some View {
        switch family {
        case .systemMedium:
            mediumCombinedView
        case .systemLarge:
            largeCombinedView
        default:
            mediumCombinedView
        }
    }

    // Medium: Circle Progress ring + Next Salah side by side
    private var mediumCombinedView: some View {
        HStack(spacing: 0) {
            CircleProgressView(data: entry.data.circleData, compact: false)
                .frame(maxWidth: .infinity, alignment: .center)
                .widgetURL(URL(string: "ajr://mycircle"))
            
            NextSalahView(data: entry.data.nextSalah, compact: false)
                .frame(maxWidth: .infinity, alignment: .center)
                .widgetURL(URL(string: "ajr://salah"))
        }
        .padding(.horizontal, 12)
    }

    // Large: Next Salah + Circle Progress on top, Rings + Legend on bottom
    private var largeCombinedView: some View {
        VStack(spacing: 24) {
            // Top section — Next Salah & Circle Progress horizontally flipped
            HStack(alignment: .center) {
                NextSalahView(data: entry.data.nextSalah, compact: false)
                    .frame(maxWidth: .infinity, alignment: .leading)
                
                CircleProgressView(data: entry.data.circleData, compact: true)
            }
            .padding(.horizontal, 16)

            Divider()
                .background(Color.black.opacity(0.1))

            // Bottom section — Daily Rings & Divided Legend
            HStack(spacing: 24) {
                // Left: Rings
                DailyRingsView(data: entry.data, compact: false)
                    .frame(maxWidth: .infinity)
                    .padding(.leading, 8)
                
                // Right: Listed Legend vertically stacked with internal dividers
                legendListView(withDividers: true)
                    .padding(.trailing, 16)
            }
        }
        .widgetURL(URL(string: "ajr://dailygrowth"))
    }

    @ViewBuilder
    private func legendListView(withDividers: Bool) -> some View {
        let activeLegends: [(id: Int, color: Color, label: String, pct: Int)] = [
            (entry.data.salah.isActive ?? true) ? (0, AJRColors.salahRing, "Salah", entry.data.salah.percentage) : nil,
            (entry.data.quran.isActive ?? true) ? (1, AJRColors.quranRing, "Quran", entry.data.quran.percentage) : nil,
            (entry.data.dhikr.isActive ?? true) ? (2, AJRColors.dhikrRing, "Dhikr", entry.data.dhikr.percentage) : nil,
            (entry.data.journal?.isActive ?? false) ? (3, AJRColors.journalRing, "Journal", entry.data.journal?.percentage ?? 0) : nil
        ].compactMap { $0 }

        VStack(alignment: .leading, spacing: withDividers ? 14 : 15) {
            ForEach(Array(activeLegends.enumerated()), id: \.element.id) { index, item in
                legendRow(color: item.color, label: item.label, pct: item.pct)
                if withDividers && index < activeLegends.count - 1 {
                    Divider().background(Color.black.opacity(0.05))
                }
            }
        }
    }

    private func legendRow(color: Color, label: String, pct: Int) -> some View {
        HStack(spacing: 12) {
            Circle()
                .fill(color)
                .frame(width: 8, height: 8)
            
            Text(label)
                .font(.system(size: 13, weight: .medium))
                .foregroundColor(AJRColors.textBlack)
            
            Spacer()
            
            Text("\(pct)%")
                .font(.system(size: 13, weight: .bold, design: .rounded))
                .foregroundColor(AJRColors.textGrey)
        }
    }
}
