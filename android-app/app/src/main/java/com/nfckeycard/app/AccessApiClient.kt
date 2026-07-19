package com.nfckeycard.app

import android.os.Handler
import android.os.Looper
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.nio.charset.StandardCharsets

data class AccessResult(val granted: Boolean, val message: String?)

/**
 * Calls the existing access-control API with the scanned card id.
 * Expects a JSON response of the form {"granted": true|false, "message": "..."}.
 * Adjust [buildRequestBody] / response parsing here if your API's contract differs.
 */
object AccessApiClient {

    private const val TIMEOUT_MS = 10_000
    private val mainHandler = Handler(Looper.getMainLooper())

    fun verifyAccess(
        endpoint: String,
        apiKey: String?,
        cardId: String,
        onResult: (Result<AccessResult>) -> Unit
    ) {
        Thread {
            val result = runCatching { doRequest(endpoint, apiKey, cardId) }
            mainHandler.post { onResult(result) }
        }.start()
    }

    private fun doRequest(endpoint: String, apiKey: String?, cardId: String): AccessResult {
        val url = URL(endpoint)
        val connection = url.openConnection() as HttpURLConnection
        try {
            connection.requestMethod = "POST"
            connection.connectTimeout = TIMEOUT_MS
            connection.readTimeout = TIMEOUT_MS
            connection.doOutput = true
            connection.setRequestProperty("Content-Type", "application/json; charset=utf-8")
            connection.setRequestProperty("Accept", "application/json")
            if (!apiKey.isNullOrBlank()) {
                connection.setRequestProperty("Authorization", "Bearer $apiKey")
            }

            val body = buildRequestBody(cardId)
            OutputStreamWriter(connection.outputStream, StandardCharsets.UTF_8).use { writer ->
                writer.write(body)
            }

            val responseCode = connection.responseCode
            val stream = if (responseCode in 200..299) connection.inputStream else connection.errorStream
            val responseText = stream?.bufferedReader(StandardCharsets.UTF_8)?.use { it.readText() }.orEmpty()

            if (responseCode !in 200..299) {
                throw ApiException("HTTP $responseCode: $responseText")
            }

            return parseResponse(responseText)
        } finally {
            connection.disconnect()
        }
    }

    private fun buildRequestBody(cardId: String): String =
        JSONObject().put("cardId", cardId).toString()

    private fun parseResponse(responseText: String): AccessResult {
        val json = JSONObject(responseText)
        val granted = json.optBoolean("granted", false)
        val message = json.optString("message", null)
        return AccessResult(granted, message)
    }

    class ApiException(message: String) : Exception(message)
}
