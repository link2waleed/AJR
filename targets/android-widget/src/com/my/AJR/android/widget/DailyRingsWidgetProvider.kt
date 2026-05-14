package com.my.AJR.android.widget

import android.appwidget.AppWidgetManager
import android.content.Context
import android.view.View
import android.widget.RemoteViews
import com.my.AJR.android.R

/**
 * Daily AJR Rings Widget - Matches iOS DailyAJRRingsWidget
 * Displays concentric activity rings for Salah, Quran, and Dhikr.
 */
class DailyRingsWidgetProvider : BaseWidgetProvider() {

    override fun updateWidget(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int,
        data: WidgetData
    ) {
        try {
            val layoutId = getLayoutForSize(
                context, appWidgetManager, appWidgetId,
                R.layout.widget_daily_rings_small,
                R.layout.widget_daily_rings_medium
            )

            val views = RemoteViews(context.packageName, layoutId)

            // Set overall percentage (center text)
            views.setTextViewText(R.id.overall_percentage, "${data.overallProgress}%")

            // Update rings progress
            if (data.salah.isActive) {
                views.setViewVisibility(R.id.ring_salah, View.VISIBLE)
                views.setProgressBar(R.id.ring_salah, 100, data.salah.percentage, false)
            } else {
                views.setViewVisibility(R.id.ring_salah, View.GONE)
            }

            if (data.quran.isActive) {
                views.setViewVisibility(R.id.ring_quran, View.VISIBLE)
                views.setProgressBar(R.id.ring_quran, 100, data.quran.percentage, false)
            } else {
                views.setViewVisibility(R.id.ring_quran, View.GONE)
            }

            if (data.dhikr.isActive) {
                views.setViewVisibility(R.id.ring_dhikr, View.VISIBLE)
                views.setProgressBar(R.id.ring_dhikr, 100, data.dhikr.percentage, false)
            } else {
                views.setViewVisibility(R.id.ring_dhikr, View.GONE)
            }

            if (data.journal.isActive) {
                views.setViewVisibility(R.id.ring_journal, View.VISIBLE)
                views.setProgressBar(R.id.ring_journal, 100, data.journal.percentage, false)
            } else {
                views.setViewVisibility(R.id.ring_journal, View.GONE)
            }

            // If medium layout, update legend
            if (layoutId == R.layout.widget_daily_rings_medium) {
                updateLegend(views, data)
            }

            // Set deep link to daily growth
            val pendingIntent = createDeepLinkIntent(context, DEEP_LINK_DAILY_GROWTH)
            views.setOnClickPendingIntent(R.id.widget_container, pendingIntent)

            appWidgetManager.updateAppWidget(appWidgetId, views)
        } catch (e: Exception) {
            android.util.Log.e("DailyRingsWidget", "Error updating widget", e)
        }
    }

    private fun updateLegend(views: RemoteViews, data: WidgetData) {
        // Salah legend
        if (data.salah.isActive) {
            views.setViewVisibility(R.id.legend_salah, View.VISIBLE)
            views.setTextViewText(R.id.salah_percentage, "${data.salah.percentage}%")
        } else {
            views.setViewVisibility(R.id.legend_salah, View.GONE)
        }

        // Quran legend
        if (data.quran.isActive) {
            views.setViewVisibility(R.id.legend_quran, View.VISIBLE)
            views.setTextViewText(R.id.quran_percentage, "${data.quran.percentage}%")
        } else {
            views.setViewVisibility(R.id.legend_quran, View.GONE)
        }

        // Dhikr legend
        if (data.dhikr.isActive) {
            views.setViewVisibility(R.id.legend_dhikr, View.VISIBLE)
            views.setTextViewText(R.id.dhikr_percentage, "${data.dhikr.percentage}%")
        } else {
            views.setViewVisibility(R.id.legend_dhikr, View.GONE)
        }

        // Journal legend
        if (data.journal.isActive) {
            views.setViewVisibility(R.id.legend_journal, View.VISIBLE)
            views.setTextViewText(R.id.journal_indicator, "${data.journal.percentage}%")
        } else {
            views.setViewVisibility(R.id.legend_journal, View.GONE)
        }
    }
}
