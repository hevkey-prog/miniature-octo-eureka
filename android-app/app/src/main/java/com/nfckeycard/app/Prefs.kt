package com.nfckeycard.app

import android.content.Context

/** Thin wrapper around SharedPreferences for the access-check API settings. */
object Prefs {
    private const val FILE_NAME = "nfc_keycard_prefs"
    private const val KEY_ENDPOINT = "endpoint_url"
    private const val KEY_OPEN_DOOR_ENDPOINT = "open_door_endpoint_url"
    private const val KEY_API_KEY = "api_key"

    fun getEndpoint(context: Context): String? =
        prefs(context).getString(KEY_ENDPOINT, null)?.takeIf { it.isNotBlank() }

    fun getOpenDoorEndpoint(context: Context): String? =
        prefs(context).getString(KEY_OPEN_DOOR_ENDPOINT, null)?.takeIf { it.isNotBlank() }

    fun getApiKey(context: Context): String? =
        prefs(context).getString(KEY_API_KEY, null)?.takeIf { it.isNotBlank() }

    fun save(context: Context, endpoint: String, openDoorEndpoint: String, apiKey: String) {
        prefs(context).edit()
            .putString(KEY_ENDPOINT, endpoint.trim())
            .putString(KEY_OPEN_DOOR_ENDPOINT, openDoorEndpoint.trim())
            .putString(KEY_API_KEY, apiKey.trim())
            .apply()
    }

    private fun prefs(context: Context) =
        context.getSharedPreferences(FILE_NAME, Context.MODE_PRIVATE)
}
