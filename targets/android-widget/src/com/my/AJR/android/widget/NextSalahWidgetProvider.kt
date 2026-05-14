package com.my.AJR.android.widget

import android.appwidget.AppWidgetManager
import android.content.Context
import android.widget.RemoteViews
import com.my.AJR.android.R

/**
 * Next Salah Widget - Matches iOS NextSalahWidget
 * Displays the upcoming prayer time with countdown.
 */
class NextSalahWidgetProvider : BaseWidgetProvider() {

    override fun updateWidget(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int,
        data: WidgetData
    ) {
        try {
            val layoutId = getLayoutForSize(
                context, appWidgetManager, appWidgetId,
                R.layout.widget_next_salah_small,
                R.layout.widget_next_salah_medium
            )

            val views = RemoteViews(context.packageName, layoutId)

            // Set prayer name
            views.setTextViewText(R.id.salah_name, data.nextSalah.name)

            // Calculate and set time remaining
            val remainingSeconds = calculateRemainingTime(data.nextSalah.targetDateString)
            val timeRemainingText = if (remainingSeconds >= 0) {
                formatTimeRemaining(remainingSeconds)
            } else {
                data.nextSalah.timeRemaining
            }

            views.setTextViewText(R.id.time_remaining, timeRemainingText)

            // If medium layout, also show time string
            if (layoutId == R.layout.widget_next_salah_medium) {
                views.setTextViewText(R.id.time_string, data.nextSalah.timeString)
            }

            // Set deep link to salah screen
            val pendingIntent = createDeepLinkIntent(context, DEEP_LINK_SALAH)
            views.setOnClickPendingIntent(R.id.widget_container, pendingIntent)

            appWidgetManager.updateAppWidget(appWidgetId, views)
        } catch (e: Exception) {
            android.util.Log.e("NextSalahWidget", "Error updating widget", e)
        }
    }
}
