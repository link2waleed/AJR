package com.my.AJR.android.widget

import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale
import java.util.TimeZone

/**
 * Data model matching iOS AJRWidgetData structure exactly.
 * This is the shared contract between JS and Android widgets.
 */
data class WidgetData(
    val salah: RingData,
    val quran: RingData,
    val dhikr: RingData,
    val overallProgress: Int,
    val nextSalah: NextSalahData,
    val circleData: CircleData,
    val journal: RingData,
    val hasJournalActive: Boolean,
    val lastUpdated: String?
) {
    data class RingData(
        val percentage: Int,
        val completed: Int? = null,
        val total: Int? = null,
        val isActive: Boolean = true
    )

    data class NextSalahData(
        val name: String,
        val timeRemaining: String,
        val timeString: String,
        val targetDateString: String? = null,
        val schedule: List<ScheduleItem> = emptyList()
    ) {
        data class ScheduleItem(
            val name: String,
            val timeString: String,
            val targetDateString: String
        )
    }

    data class CircleData(
        val hasCircles: Boolean,
        val name: String,
        val percentage: Int,
        val otherCirclesCount: Int
    )

    companion object {
        private val DEFAULT = WidgetData(
            salah = RingData(percentage = 60, completed = 3, total = 5, isActive = true),
            quran = RingData(percentage = 45, isActive = true),
            dhikr = RingData(percentage = 80, isActive = true),
            overallProgress = 62,
            nextSalah = NextSalahData(
                name = "Maghrib",
                timeRemaining = "2h 15m",
                timeString = "7:32 PM"
            ),
            circleData = CircleData(
                hasCircles = true,
                name = "Quran Circle",
                percentage = 65,
                otherCirclesCount = 2
            ),
            journal = RingData(percentage = 30, isActive = true),
            hasJournalActive = true,
            lastUpdated = null
        )

        fun fromJson(jsonString: String?): WidgetData {
            if (jsonString.isNullOrEmpty()) return DEFAULT

            val rawData = try {
                val json = JSONObject(jsonString)

                WidgetData(
                    salah = parseRingData(json.optJSONObject("salah")),
                    quran = parseRingData(json.optJSONObject("quran")),
                    dhikr = parseRingData(json.optJSONObject("dhikr")),
                    overallProgress = json.optInt("overallProgress", 0),
                    nextSalah = parseNextSalahData(json.optJSONObject("nextSalah")),
                    circleData = parseCircleData(json.optJSONObject("circleData")),
                    journal = parseRingData(json.optJSONObject("journal")),
                    hasJournalActive = json.optBoolean("hasJournalActive", false),
                    lastUpdated = json.optString("lastUpdated").takeIf { json.has("lastUpdated") && !json.isNull("lastUpdated") }
                )
            } catch (e: Exception) {
                DEFAULT
            }

            return checkAndResetForCurrentDate(rawData)
        }

        private fun checkAndResetForCurrentDate(data: WidgetData): WidgetData {
            val lastUpdatedString = data.lastUpdated ?: return data
            try {
                val isoFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply {
                    timeZone = TimeZone.getTimeZone("UTC")
                }
                val lastUpdatedTime = isoFormat.parse(lastUpdatedString)?.time ?: return data
                val now = System.currentTimeMillis()

                val calLast = Calendar.getInstance()
                calLast.timeInMillis = lastUpdatedTime

                val calNow = Calendar.getInstance()
                calNow.timeInMillis = now

                val sameDay = calLast.get(Calendar.YEAR) == calNow.get(Calendar.YEAR) &&
                              calLast.get(Calendar.DAY_OF_YEAR) == calNow.get(Calendar.DAY_OF_YEAR)

                if (!sameDay && now > lastUpdatedTime) {
                    val resetSalah = data.salah.copy(percentage = 0, completed = 0)
                    val resetQuran = data.quran.copy(percentage = 0, completed = 0)
                    val resetDhikr = data.dhikr.copy(percentage = 0, completed = 0)
                    val resetJournal = data.journal.copy(percentage = 0, completed = 0)
                    return data.copy(
                        salah = resetSalah,
                        quran = resetQuran,
                        dhikr = resetDhikr,
                        journal = resetJournal,
                        overallProgress = 0
                    )
                }
            } catch (e: Exception) {
                // Fallback to original data if parsing fails
            }
            return data
        }

        private fun parseRingData(json: JSONObject?): RingData {
            if (json == null) return RingData(percentage = 0, isActive = false)
            return RingData(
                percentage = json.optInt("percentage", 0),
                completed = json.optInt("completed").takeIf { it > 0 },
                total = json.optInt("total").takeIf { it > 0 },
                isActive = json.optBoolean("isActive", true)
            )
        }

        private fun parseNextSalahData(json: JSONObject?): NextSalahData {
            if (json == null) {
                return NextSalahData(name = "—", timeRemaining = "—", timeString = "—")
            }

            val scheduleArray = json.optJSONArray("schedule")
            val schedule = mutableListOf<NextSalahData.ScheduleItem>()

            if (scheduleArray != null) {
                for (i in 0 until scheduleArray.length()) {
                    val item = scheduleArray.optJSONObject(i)
                    if (item != null) {
                        schedule.add(
                            NextSalahData.ScheduleItem(
                                name = item.optString("name", ""),
                                timeString = item.optString("timeString", ""),
                                targetDateString = item.optString("targetDateString", "")
                            )
                        )
                    }
                }
            }

            return NextSalahData(
                name = json.optString("name", "—"),
                timeRemaining = json.optString("timeRemaining", "—"),
                timeString = json.optString("timeString", "—"),
                targetDateString = json.optString("targetDateString").takeIf { it.isNotEmpty() },
                schedule = schedule
            )
        }

        private fun parseCircleData(json: JSONObject?): CircleData {
            if (json == null) {
                return CircleData(hasCircles = false, name = "", percentage = 0, otherCirclesCount = 0)
            }
            return CircleData(
                hasCircles = json.optBoolean("hasCircles", false),
                name = json.optString("name", ""),
                percentage = json.optInt("percentage", 0),
                otherCirclesCount = json.optInt("otherCirclesCount", 0)
            )
        }
    }
}
