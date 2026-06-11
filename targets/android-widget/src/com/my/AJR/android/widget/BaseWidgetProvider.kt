package com.my.AJR.android.widget

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.widget.RemoteViews
import com.my.AJR.android.MainActivity
import com.my.AJR.android.R
import java.text.SimpleDateFormat
import java.util.Locale
import java.util.TimeZone

/**
 * Base widget provider with shared functionality for all AJR widgets.
 * Implements the iOS WidgetService contract for data refresh and display.
 */
abstract class BaseWidgetProvider : AppWidgetProvider() {

    companion object {
        // Deep link schemes matching iOS
        const val DEEP_LINK_DAILY_GROWTH = "ajr://dailygrowth"
        const val DEEP_LINK_SALAH = "ajr://salah"
        const val DEEP_LINK_CIRCLE = "ajr://mycircle"

        const val ACTION_MINUTE_UPDATE = "com.my.AJR.android.widget.ACTION_MINUTE_UPDATE"
        private const val ALARM_REQUEST_CODE = 9912

        /**
         * Trigger update for all widgets across all providers.
         * Called from React Native via WidgetService.
         */
        fun updateAllWidgets(context: Context) {
            val providers = listOf(
                DailyRingsWidgetProvider::class.java,
                NextSalahWidgetProvider::class.java,
                CircleProgressWidgetProvider::class.java,
                CombinedWidgetProvider::class.java
            )

            val appWidgetManager = AppWidgetManager.getInstance(context)

            providers.forEach { providerClass ->
                val componentName = ComponentName(context, providerClass)
                val widgetIds = appWidgetManager.getAppWidgetIds(componentName)
                if (widgetIds.isNotEmpty()) {
                    appWidgetManager.notifyAppWidgetViewDataChanged(widgetIds, R.id.widget_container)
                    // Trigger onUpdate for each provider
                    context.sendBroadcast(
                        Intent(context, providerClass)
                            .setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE)
                            .putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, widgetIds)
                    )
                }
            }
        }

        fun scheduleMinuteUpdate(context: Context) {
            try {
                val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
                val intent = Intent(context, NextSalahWidgetProvider::class.java).apply {
                    action = ACTION_MINUTE_UPDATE
                }
                val pendingIntent = PendingIntent.getBroadcast(
                    context,
                    ALARM_REQUEST_CODE,
                    intent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )

                val triggerAt = System.currentTimeMillis() + 60000
                alarmManager.setRepeating(
                    AlarmManager.RTC,
                    triggerAt,
                    60000,
                    pendingIntent
                )
                android.util.Log.d("AJRWidgetAlarm", "Scheduled repeating minute update alarm")
            } catch (e: Exception) {
                android.util.Log.e("AJRWidgetAlarm", "Failed to schedule minute update", e)
            }
        }

        fun cancelMinuteUpdate(context: Context) {
            try {
                val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
                val intent = Intent(context, NextSalahWidgetProvider::class.java).apply {
                    action = ACTION_MINUTE_UPDATE
                }
                val pendingIntent = PendingIntent.getBroadcast(
                    context,
                    ALARM_REQUEST_CODE,
                    intent,
                    PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
                )
                if (pendingIntent != null) {
                    alarmManager.cancel(pendingIntent)
                    pendingIntent.cancel()
                    android.util.Log.d("AJRWidgetAlarm", "Cancelled minute update alarm")
                }
            } catch (e: Exception) {
                android.util.Log.e("AJRWidgetAlarm", "Failed to cancel minute update", e)
            }
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == ACTION_MINUTE_UPDATE) {
            android.util.Log.d("AJRWidgetAlarm", "Received minute update broadcast in Provider")
            updateAllWidgets(context)
        } else {
            super.onReceive(context, intent)
        }
    }

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        val widgetData = WidgetData.fromJson(WidgetDataStore.getWidgetData(context))

        appWidgetIds.forEach { appWidgetId ->
            updateWidget(context, appWidgetManager, appWidgetId, widgetData)
        }

        scheduleMinuteUpdate(context)
    }

    override fun onAppWidgetOptionsChanged(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int,
        newOptions: Bundle?
    ) {
        super.onAppWidgetOptionsChanged(context, appWidgetManager, appWidgetId, newOptions)

        // Re-render when widget size changes
        val widgetData = WidgetData.fromJson(WidgetDataStore.getWidgetData(context))
        updateWidget(context, appWidgetManager, appWidgetId, widgetData)
    }

    /**
     * Each widget type implements this to provide its specific layout and data binding.
     */
    abstract fun updateWidget(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int,
        data: WidgetData
    )

    /**
     * Get the appropriate layout based on widget size.
     * Matches iOS widget family behavior (.systemSmall, .systemMedium, .systemLarge).
     */
    protected fun getLayoutForSize(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int,
        smallLayout: Int,
        mediumLayout: Int,
        largeLayout: Int = mediumLayout
    ): Int {
        val options = appWidgetManager.getAppWidgetOptions(appWidgetId)
        val minWidth = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH)
        val minHeight = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT)

        // Convert dp to cells (approximate)
        val minWidthCells = (minWidth + 30) / 70
        val minHeightCells = (minHeight + 30) / 70

        return when {
            minWidthCells >= 3 && minHeightCells >= 3 -> largeLayout
            minWidthCells >= 3 || minHeightCells >= 2 -> mediumLayout
            else -> smallLayout
        }
    }

    /**
     * Create deep link pending intent.
     * Matches iOS widgetURL behavior.
     */
    protected fun createDeepLinkIntent(context: Context, deepLink: String): PendingIntent {
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(deepLink)).apply {
            setPackage(context.packageName)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }

        return PendingIntent.getActivity(
            context,
            deepLink.hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }

    /**
     * Format time remaining for display.
     * Matches iOS formatTimeRemaining function.
     */
    protected fun formatTimeRemaining(totalSeconds: Long): String {
        if (totalSeconds <= 0) return "—"
        val hours = totalSeconds / 3600
        val minutes = (totalSeconds % 3600) / 60
        return if (hours > 0) {
            "${hours}h ${minutes}m"
        } else {
            "${minutes}m"
        }
    }

    /**
     * Calculate remaining time from ISO date string.
     */
    protected fun calculateRemainingTime(targetDateString: String?): Long {
        if (targetDateString.isNullOrEmpty()) return -1L

        return try {
            // Parse ISO 8601 date string
            val isoFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply {
                timeZone = TimeZone.getTimeZone("UTC")
            }
            val targetDate = isoFormat.parse(targetDateString)?.time ?: return -1L
            val now = System.currentTimeMillis()
            ((targetDate - now) / 1000L).coerceAtLeast(0L)
        } catch (e: Exception) {
            -1L
        }
    }
}
