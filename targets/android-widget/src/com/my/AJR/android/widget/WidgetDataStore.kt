package com.my.AJR.android.widget

import android.content.Context
import android.content.SharedPreferences

/**
 * Shared data store for widget data.
 * Mirrors iOS UserDefaults with App Group behavior.
 */
object WidgetDataStore {
    private const val PREFS_NAME = "ajr_widget_prefs"
    private const val KEY_WIDGET_DATA = "ajr_widget_data"

    private fun getPrefs(context: Context): SharedPreferences {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }

    fun saveWidgetData(context: Context, jsonData: String) {
        getPrefs(context).edit().putString(KEY_WIDGET_DATA, jsonData).apply()
    }

    fun getWidgetData(context: Context): String? {
        return getPrefs(context).getString(KEY_WIDGET_DATA, null)
    }

    fun clearWidgetData(context: Context) {
        getPrefs(context).edit().remove(KEY_WIDGET_DATA).apply()
    }
}
