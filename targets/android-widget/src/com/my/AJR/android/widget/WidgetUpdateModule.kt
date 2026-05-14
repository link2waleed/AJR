package com.my.AJR.android.widget

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.module.annotations.ReactModule
import org.json.JSONObject

/**
 * React Native bridge module for Android widget updates.
 * Mirrors iOS ExtensionStorage behavior from @bacons/apple-targets.
 */
@ReactModule(name = WidgetUpdateModule.NAME)
class WidgetUpdateModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val NAME = "AJRWidgetBridge"
    }

    override fun getName(): String = NAME

    /**
     * Save widget data and trigger updates - matches iOS ExtensionStorage.set behavior
     */
    @ReactMethod
    fun setWidgetData(jsonData: String) {
        val context = reactApplicationContext

        // Save to shared preferences
        WidgetDataStore.saveWidgetData(context, jsonData)

        // Trigger widget updates
        BaseWidgetProvider.updateAllWidgets(context)
    }

    /**
     * Force reload widgets without writing new data - matches iOS ExtensionStorage.reloadWidget
     */
    @ReactMethod
    fun reloadWidgets() {
        BaseWidgetProvider.updateAllWidgets(reactApplicationContext)
    }

    /**
     * Get current widget data (for debugging)
     */
    @ReactMethod
    fun getWidgetData(callback: com.facebook.react.bridge.Callback) {
        val data = WidgetDataStore.getWidgetData(reactApplicationContext) ?: "{}"
        callback.invoke(data)
    }
}
