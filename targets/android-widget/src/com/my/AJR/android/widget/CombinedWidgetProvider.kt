package com.my.AJR.android.widget

import android.appwidget.AppWidgetManager
import android.content.Context
import android.view.View
import android.widget.RemoteViews
import com.my.AJR.android.R

/**
 * Combined AJR Widget - Matches iOS CombinedAJRWidget
 * Displays Next Salah, Circle Progress, and Daily Rings together.
 * Supports both medium and large sizes.
 */
class CombinedWidgetProvider : BaseWidgetProvider() {

    override fun updateWidget(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int,
        data: WidgetData
    ) {
        try {
            val layoutId = getLayoutForSize(
                context, appWidgetManager, appWidgetId,
                R.layout.widget_combined_medium,
                R.layout.widget_combined_medium,
                R.layout.widget_combined_large
            )

            val views = RemoteViews(context.packageName, layoutId)

            if (layoutId == R.layout.widget_combined_large) {
                updateLargeLayout(views, data)
            } else {
                updateMediumLayout(views, data)
            }

            // Set deep link to daily growth (primary action for combined widget)
            val pendingIntent = createDeepLinkIntent(context, DEEP_LINK_DAILY_GROWTH)
            views.setOnClickPendingIntent(R.id.widget_container, pendingIntent)

            appWidgetManager.updateAppWidget(appWidgetId, views)
        } catch (e: Exception) {
            android.util.Log.e("CombinedWidget", "Error updating widget", e)
        }
    }

    private fun updateMediumLayout(views: RemoteViews, data: WidgetData) {
        // Medium layout is side-by-side: Circle | Salah
        // Note: This uses included layouts, so we need to handle them differently
        // For simplicity, we'll update the direct views if they exist

        // Update circle section
        if (data.circleData.hasCircles) {
            views.setViewVisibility(R.id.no_circles_container, View.GONE)
            views.setViewVisibility(R.id.active_circle_container, View.VISIBLE)
            views.setProgressBar(R.id.progress_ring, 100, data.circleData.percentage, false)
            views.setTextViewText(R.id.circle_percentage, "${data.circleData.percentage}%")
            views.setTextViewText(R.id.circle_name, data.circleData.name)
            views.setViewVisibility(
                R.id.more_circles,
                if (data.circleData.otherCirclesCount > 0) View.VISIBLE else View.GONE
            )
        } else {
            views.setViewVisibility(R.id.no_circles_container, View.VISIBLE)
            views.setViewVisibility(R.id.active_circle_container, View.GONE)
        }

        // Update salah section
        views.setTextViewText(R.id.salah_name, data.nextSalah.name)
        val remainingSeconds = calculateRemainingTime(data.nextSalah.targetDateString)
        views.setTextViewText(
            R.id.time_remaining,
            if (remainingSeconds >= 0) formatTimeRemaining(remainingSeconds) else data.nextSalah.timeRemaining
        )
    }

    private fun updateLargeLayout(views: RemoteViews, data: WidgetData) {
        // Top section: Next Salah + Circle
        views.setTextViewText(R.id.salah_name, data.nextSalah.name)

        val remainingSeconds = calculateRemainingTime(data.nextSalah.targetDateString)
        views.setTextViewText(
            R.id.time_remaining,
            if (remainingSeconds >= 0) formatTimeRemaining(remainingSeconds) else data.nextSalah.timeRemaining
        )

        // Circle section
        if (data.circleData.hasCircles) {
            views.setViewVisibility(R.id.no_circles_container, View.GONE)
            views.setViewVisibility(R.id.active_circle_container, View.VISIBLE)
            views.setProgressBar(R.id.progress_ring, 100, data.circleData.percentage, false)
            views.setTextViewText(R.id.circle_percentage, "${data.circleData.percentage}%")
            views.setTextViewText(R.id.circle_name, data.circleData.name)
            views.setViewVisibility(
                R.id.more_circles,
                if (data.circleData.otherCirclesCount > 0) View.VISIBLE else View.GONE
            )
        } else {
            views.setViewVisibility(R.id.no_circles_container, View.VISIBLE)
            views.setViewVisibility(R.id.active_circle_container, View.GONE)
        }

        // Bottom section: Rings + Legend
        views.setTextViewText(R.id.overall_percentage, "${data.overallProgress}%")

        // Update rings progress
        if (data.salah.isActive) {
            views.setViewVisibility(R.id.ring_salah, View.VISIBLE)
            views.setProgressBar(R.id.ring_salah, 100, data.salah.percentage, false)
            views.setViewVisibility(R.id.legend_salah, View.VISIBLE)
            views.setTextViewText(R.id.salah_percentage, "${data.salah.percentage}%")
        } else {
            views.setViewVisibility(R.id.ring_salah, View.GONE)
            views.setViewVisibility(R.id.legend_salah, View.GONE)
        }

        if (data.quran.isActive) {
            views.setViewVisibility(R.id.ring_quran, View.VISIBLE)
            views.setProgressBar(R.id.ring_quran, 100, data.quran.percentage, false)
            views.setViewVisibility(R.id.legend_quran, View.VISIBLE)
            views.setTextViewText(R.id.quran_percentage, "${data.quran.percentage}%")
        } else {
            views.setViewVisibility(R.id.ring_quran, View.GONE)
            views.setViewVisibility(R.id.legend_quran, View.GONE)
        }

        if (data.dhikr.isActive) {
            views.setViewVisibility(R.id.ring_dhikr, View.VISIBLE)
            views.setProgressBar(R.id.ring_dhikr, 100, data.dhikr.percentage, false)
            views.setViewVisibility(R.id.legend_dhikr, View.VISIBLE)
            views.setTextViewText(R.id.dhikr_percentage, "${data.dhikr.percentage}%")
        } else {
            views.setViewVisibility(R.id.ring_dhikr, View.GONE)
            views.setViewVisibility(R.id.legend_dhikr, View.GONE)
        }

        if (data.journal.isActive) {
            views.setViewVisibility(R.id.ring_journal, View.VISIBLE)
            views.setProgressBar(R.id.ring_journal, 100, data.journal.percentage, false)
            views.setViewVisibility(R.id.legend_journal, View.VISIBLE)
            views.setTextViewText(R.id.journal_indicator, "${data.journal.percentage}%")
        } else {
            views.setViewVisibility(R.id.ring_journal, View.GONE)
            views.setViewVisibility(R.id.legend_journal, View.GONE)
        }
    }
}
