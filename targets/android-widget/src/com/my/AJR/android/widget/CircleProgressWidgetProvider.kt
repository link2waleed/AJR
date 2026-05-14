package com.my.AJR.android.widget

import android.appwidget.AppWidgetManager
import android.content.Context
import android.view.View
import android.widget.RemoteViews
import com.my.AJR.android.R

/**
 * Circle Progress Widget - Matches iOS CircleProgressWidget
 * Displays circle completion percentage with ring visualization.
 */
class CircleProgressWidgetProvider : BaseWidgetProvider() {

    override fun updateWidget(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int,
        data: WidgetData
    ) {
        try {
            val layoutId = getLayoutForSize(
                context, appWidgetManager, appWidgetId,
                R.layout.widget_circle_progress_small,
                R.layout.widget_circle_progress_medium
            )

            val views = RemoteViews(context.packageName, layoutId)

            if (data.circleData.hasCircles) {
                // Show active circle state
                views.setViewVisibility(R.id.no_circles_container, View.GONE)
                views.setViewVisibility(R.id.active_circle_container, View.VISIBLE)

                // Set progress ring
                views.setProgressBar(R.id.progress_ring, 100, data.circleData.percentage, false)

                // Set percentage text
                views.setTextViewText(R.id.circle_percentage, "${data.circleData.percentage}%")

                // Set circle name
                views.setTextViewText(R.id.circle_name, data.circleData.name)

                // Show "+X more" indicator if applicable
                if (data.circleData.otherCirclesCount > 0) {
                    views.setViewVisibility(R.id.more_circles, View.VISIBLE)
                    views.setTextViewText(R.id.more_circles, "+${data.circleData.otherCirclesCount} more")
                } else {
                    views.setViewVisibility(R.id.more_circles, View.GONE)
                }

            } else {
                // Show no circles state
                views.setViewVisibility(R.id.no_circles_container, View.VISIBLE)
                views.setViewVisibility(R.id.active_circle_container, View.GONE)
            }

            // Set deep link to circle screen
            val pendingIntent = createDeepLinkIntent(context, DEEP_LINK_CIRCLE)
            views.setOnClickPendingIntent(R.id.widget_container, pendingIntent)

            appWidgetManager.updateAppWidget(appWidgetId, views)
        } catch (e: Exception) {
            android.util.Log.e("CircleProgressWidget", "Error updating widget", e)
        }
    }
}
