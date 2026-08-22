package com.vektra.ehrms.data.models

import com.google.gson.annotations.SerializedName

data class CompanyTenant(
    @SerializedName("_id") val id: String,
    val name: String,
    val email: String,
    val adminName: String,
    val status: String = "Pending",
    val createdAt: String? = null
)

data class CompaniesResponse(
    val success: Boolean,
    val data: List<CompanyTenant>
)

data class Announcement(
    @SerializedName("_id") val id: String? = null,
    val message: String,
    val priority: String = "Normal", // "High", "Normal", "Low"
    val expiresAt: String? = null,
    val isActive: Boolean = true,
    val createdAt: String? = null
)

data class AnnouncementsResponse(
    val success: Boolean,
    val data: List<Announcement>
)

data class SystemHealthData(
    val status: String = "Operational",
    val uptime: String = "0h 0m",
    val memoryUsage: String = "0 MB",
    val heapTotal: String = "0 MB",
    val heapUsed: String = "0 MB",
    val dbStatus: String = "Connected"
)

data class SystemHealthResponse(
    val success: Boolean,
    val data: SystemHealthData
)

data class CreateAnnouncementRequest(
    val message: String,
    val priority: String = "Normal",
    val expiresAt: String? = null
)
