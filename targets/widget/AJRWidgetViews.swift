import SwiftUI
import WidgetKit

// MARK: - Color Extensions (matching AJR app theme)

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 6:
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8:
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

struct AJRColors {
    static let salahRing = Color(hex: "8FAF9A")      // Sage green — rings.layer1
    static let quranRing = Color(hex: "E3C27A")       // Gold — rings.layer2
    static let dhikrRing = Color(hex: "D1AD73")       // Warm brown — rings.layer3
    static let sage = Color(hex: "7A9E7F")            // primary.sage
    static let darkSage = Color(hex: "5A7A5F")        // primary.darkSage
    static let cream = Color(hex: "F5F3E8")           // cards.cream
    static let cardMint = Color(hex: "D4E4D1")        // cards.mint
    static let textBlack = Color(hex: "202020")       // text.black
    static let textGrey = Color(hex: "757575")        // text.grey
    static let bgTop = Color(hex: "C0E5E2")           // homeGradient.top
    static let bgBottom = Color(hex: "ECE3C9")        // homeGradient.bottom
    static let circleRing = Color(hex: "9ECED1")      // rings.innerCircle
}

// MARK: - Activity Ring View (Apple-style)

struct ActivityRingView: View {
    let progress: Double   // 0.0 – 1.0
    let ringColor: Color
    let lineWidth: CGFloat
    let size: CGFloat

    var body: some View {
        ZStack {
            // Background track
            Circle()
                .stroke(ringColor.opacity(0.2), lineWidth: lineWidth)
            // Progress arc
            Circle()
                .trim(from: 0, to: min(progress, 1.0))
                .stroke(
                    ringColor,
                    style: StrokeStyle(lineWidth: lineWidth, lineCap: .round)
                )
                .rotationEffect(.degrees(-90))
                .animation(.easeInOut(duration: 0.6), value: progress)
        }
        .frame(width: size, height: size)
    }
}

// MARK: - Daily AJR Rings View (3 concentric rings)

struct DailyRingsView: View {
    let data: AJRWidgetData
    let compact: Bool // true for small widget

    private var overallPct: Int { data.overallProgress }

    var body: some View {
        let outerSize: CGFloat = compact ? 100 : 130
        let lineWidth: CGFloat = compact ? 8 : 10
        let gap: CGFloat = compact ? 3 : 4

        // Build array of active rings so they stack tightly without gaps
        let activeRings: [(progress: Double, color: Color)] = [
            (data.salah.isActive ?? true) ? (Double(data.salah.percentage) / 100.0, AJRColors.salahRing) : nil,
            (data.quran.isActive ?? true) ? (Double(data.quran.percentage) / 100.0, AJRColors.quranRing) : nil,
            (data.dhikr.isActive ?? true) ? (Double(data.dhikr.percentage) / 100.0, AJRColors.dhikrRing) : nil
        ].compactMap { $0 }

        ZStack {
            ForEach(Array(activeRings.enumerated()), id: \.offset) { index, ring in
                ActivityRingView(
                    progress: ring.progress,
                    ringColor: ring.color,
                    lineWidth: lineWidth,
                    size: outerSize - CGFloat(index) * 2 * (lineWidth + gap)
                )
            }

            // Center percentage
            VStack(spacing: 0) {
                Text("\(overallPct)%")
                    .font(.system(size: compact ? 14 : 18, weight: .bold, design: .rounded))
                    .foregroundColor(AJRColors.textBlack)
                if !compact {
                    Text("Complete")
                        .font(.system(size: 8, weight: .medium))
                        .foregroundColor(AJRColors.textGrey)
                }
            }
        }
    }
}

// MARK: - Next Salah View

struct NextSalahView: View {
    let data: AJRWidgetData.NextSalahData
    let compact: Bool

    var body: some View {
        VStack(alignment: compact ? .center : .leading, spacing: compact ? 4 : 6) {
            // Icon + label
            HStack(spacing: 4) {
                Image(systemName: "moon.stars.fill")
                    .font(.system(size: compact ? 10 : 12))
                    .foregroundColor(AJRColors.sage)
                Text("Next Salah")
                    .font(.system(size: compact ? 9 : 10, weight: .medium))
                    .foregroundColor(AJRColors.textGrey)
            }

            // Prayer name
            Text(data.name)
                .font(.system(size: compact ? 18 : 22, weight: .bold, design: .rounded))
                .foregroundColor(AJRColors.textBlack)
                .lineLimit(1)

            // Time remaining
            Text(data.timeRemaining)
                .font(.system(size: compact ? 13 : 15, weight: .semibold, design: .rounded))
                .foregroundColor(AJRColors.darkSage)

            if !compact {
                Text(data.timeString)
                    .font(.system(size: 11, weight: .regular))
                    .foregroundColor(AJRColors.textGrey)
            }
        }
    }
}

// MARK: - Medium Next Salah View (Exact Replication)

struct MediumNextSalahView: View {
    let data: AJRWidgetData.NextSalahData

    var body: some View {
        HStack(spacing: 24) {
            // Left Icon Area
            Image(systemName: "moon.stars.fill")
                .font(.system(size: 28))
                .foregroundColor(AJRColors.sage)
                .padding(.leading, 12)
            
            // Separator
            Divider()
                .frame(height: 50)
                .background(Color.black.opacity(0.1))
            
            // Right Content Area (Horizontal split)
            HStack(alignment: .center) {
                
                // Salah Name
                VStack(alignment: .leading, spacing: 4) {
                    Text("Next Salah")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundColor(AJRColors.textGrey)
                    
                    Text(data.name)
                        .font(.system(size: 34, weight: .bold, design: .rounded))
                        .foregroundColor(AJRColors.textBlack)
                        .lineLimit(1)
                }
                
                Spacer(minLength: 10)
                
                // Times
                VStack(alignment: .trailing, spacing: 4) {
                    Text(data.timeRemaining)
                        .font(.system(size: 20, weight: .semibold, design: .rounded))
                        .foregroundColor(AJRColors.sage)
                    
                    Text(data.timeString)
                        .font(.system(size: 13, weight: .medium))
                        .foregroundColor(AJRColors.textGrey)
                }
            }
            .padding(.trailing, 12)
        }
    }
}

// MARK: - Circle Progress View (Small)

struct CircleProgressView: View {
    let data: AJRWidgetData.CircleData
    let compact: Bool // typically always true for small widget

    var body: some View {
        HStack(spacing: compact ? 12 : 16) {
            // Universal Icon + Divider
            Image(systemName: "person.2.fill")
                .font(.system(size: compact ? 20 : 24))
                .foregroundColor(AJRColors.sage)
            
            Divider()
                .frame(height: compact ? 60 : 70)
                .background(Color.black.opacity(0.1))
            
            // Right-side Content
            if !data.hasCircles {
                noCirclesView
            } else {
                activeCircleView
            }
        }
    }
    
    private var noCirclesView: some View {
        VStack(spacing: 6) {
            ZStack {
                Circle()
                    .stroke(
                        AJRColors.circleRing.opacity(0.4),
                        style: StrokeStyle(lineWidth: 1.5, dash: [4, 4])
                    )
                    .frame(width: 56, height: 56)
                
                VStack(spacing: 2) {
                    Image(systemName: "person.2.fill")
                        .font(.system(size: 14))
                        .foregroundColor(AJRColors.sage)
                }
            }
            
            VStack(spacing: 2) {
                Text("No Circles Yet")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(AJRColors.textBlack)
                    .lineLimit(1)
            }
        }
    }
    
    private var activeCircleView: some View {
        VStack(spacing: 6) {
            ZStack {
                ActivityRingView(
                    progress: Double(data.percentage) / 100.0,
                    ringColor: AJRColors.circleRing,
                    lineWidth: 6,
                    size: 56
                )
                
                VStack(spacing: 0) {
                    Text("\(data.percentage)%")
                        .font(.system(size: 16, weight: .bold, design: .rounded))
                        .foregroundColor(AJRColors.textBlack)
                }
            }
            
            VStack(spacing: 1) {
                Text(data.name)
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(AJRColors.textBlack)
                    .lineLimit(1)
                    .minimumScaleFactor(0.5)
                
                if data.otherCirclesCount > 0 {
                    Text("+\(data.otherCirclesCount) more")
                        .font(.system(size: 9, weight: .medium))
                        .foregroundColor(AJRColors.textGrey)
                }
            }
        }
    }
}

// MARK: - Medium Circle Progress View (Exact Replication)

struct MediumCircleProgressView: View {
    let data: AJRWidgetData.CircleData

    var body: some View {
        HStack(spacing: 20) {
            // Left Icon Area
            Image(systemName: "person.2.fill")
                .font(.system(size: 24))
                .foregroundColor(AJRColors.sage)
                .padding(.leading, 12)
            
            // Separator
            Divider()
                .frame(height: 60)
                .background(Color.black.opacity(0.1))
            
            // Right Content Area
            if !data.hasCircles {
                noCirclesRightSide
            } else {
                activeCircleRightSide
            }
        }
        .padding(.horizontal, 8)
    }
    
    private var noCirclesRightSide: some View {
        ZStack {
            // Dotted big ring
            Circle()
                .stroke(
                    AJRColors.circleRing.opacity(0.4),
                    style: StrokeStyle(lineWidth: 1.5, dash: [5, 4])
                )
                .frame(width: 100, height: 100)
            
            VStack(spacing: 6) {
                Image(systemName: "person.2.fill")
                    .font(.system(size: 22))
                    .foregroundColor(AJRColors.sage)
                
                Text("No Circles Yet")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(AJRColors.textBlack)
                
                Text("Join a circle")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(AJRColors.textGrey)
            }
        }
        .frame(maxWidth: .infinity, alignment: .center)
    }
    
    private var activeCircleRightSide: some View {
        HStack(spacing: 16) {
            // Solid Ring
            ZStack {
                ActivityRingView(
                    progress: Double(data.percentage) / 100.0,
                    ringColor: AJRColors.circleRing,
                    lineWidth: 10,
                    size: 80
                )
                
                VStack(spacing: 2) {
                    Text("\(data.percentage)%")
                        .font(.system(size: 18, weight: .bold, design: .rounded))
                        .foregroundColor(AJRColors.textBlack)
                    
                    Text("Overall")
                        .font(.system(size: 10, weight: .medium))
                        .foregroundColor(AJRColors.textGrey)
                }
            }
            
            // Text to the right
            VStack(alignment: .leading, spacing: 4) {
                Text(data.name)
                    .font(.system(size: 15, weight: .bold))
                    .foregroundColor(AJRColors.textBlack)
                    .lineLimit(1)
                
                if data.otherCirclesCount > 0 {
                    Text("+\(data.otherCirclesCount) more")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundColor(AJRColors.sage)
                }
            }
            
            Spacer(minLength: 0)
        }
    }
}
