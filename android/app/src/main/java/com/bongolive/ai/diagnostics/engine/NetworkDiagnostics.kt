package com.bongolive.ai.diagnostics.engine

import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import com.bongolive.ai.diagnostics.model.HealthStatus
import com.bongolive.ai.diagnostics.model.NetworkStatus
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.net.InetSocketAddress
import java.net.Socket

object NetworkDiagnostics {

    suspend fun inspect(context: Context): NetworkStatus = withContext(Dispatchers.IO) {
        val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
        if (cm == null) {
            return@withContext NetworkStatus(
                isConnected = false,
                isValidatedInternet = false,
                transportType = "None",
                isMetered = false,
                geminiHostReachable = false,
                latencyMs = -1L,
                status = HealthStatus.UNKNOWN,
                details = "ConnectivityManager সার্ভিস পাওয়া যায়নি।"
            )
        }

        val activeNetwork = cm.activeNetwork
        val caps = cm.getNetworkCapabilities(activeNetwork)

        if (activeNetwork == null || caps == null) {
            return@withContext NetworkStatus(
                isConnected = false,
                isValidatedInternet = false,
                transportType = "বিচ্ছিন্ন",
                isMetered = false,
                geminiHostReachable = false,
                latencyMs = -1L,
                status = HealthStatus.ERROR,
                details = "কোনো ইন্টারনেট নেটওয়ার্ক সংযোগ নেই।"
            )
        }

        val hasInternet = caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
        val isValidated = caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)
        val isMetered = cm.isActiveNetworkMetered

        val transport = when {
            caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) -> "Wi-Fi"
            caps.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) -> "মোবাইল ডাটা"
            caps.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET) -> "ইথারনেট"
            else -> "অন্যান্য"
        }

        // Test Gemini Endpoint Reachability safely (DNS + TCP 443 handshake probe)
        var geminiReachable = false
        var latencyMs = -1L
        if (hasInternet) {
            val start = System.currentTimeMillis()
            try {
                Socket().use { socket ->
                    socket.connect(InetSocketAddress("generativelanguage.googleapis.com", 443), 2500)
                    geminiReachable = socket.isConnected
                    latencyMs = System.currentTimeMillis() - start
                }
            } catch (e: Exception) {
                geminiReachable = false
            }
        }

        val status = when {
            !hasInternet -> HealthStatus.ERROR
            !isValidated || !geminiReachable -> HealthStatus.DEGRADED
            latencyMs > 800 -> HealthStatus.DEGRADED
            else -> HealthStatus.HEALTHY
        }

        val details = buildString {
            append("$transport সংযুক্ত")
            if (isValidated) append(" (যাচাইকৃত ইন্টারনেট)") else append(" (সীমাবদ্ধ সংযোগ)")
            if (isMetered) append(" | সীমিত ডাটা (Metered)")
            if (geminiReachable) {
                append(" | Gemini সার্ভার সক্রিয় (${latencyMs}ms)")
            } else {
                append(" | Gemini সার্ভারে সংযোগ ব্যর্থ")
            }
        }

        NetworkStatus(
            isConnected = hasInternet,
            isValidatedInternet = isValidated,
            transportType = transport,
            isMetered = isMetered,
            geminiHostReachable = geminiReachable,
            latencyMs = latencyMs,
            status = status,
            details = details
        )
    }
}
