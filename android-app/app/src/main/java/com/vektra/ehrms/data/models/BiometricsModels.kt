package com.vektra.ehrms.data.models

import com.google.gson.annotations.SerializedName

data class VerifyCheckInRequest(
    val image: String,                  // base64 frame (current)
    val prevImage: String? = null,      // base64 frame (~250ms prior for blink liveness)
    val employeeId: String? = null
)

data class MobileCheckInRequest(
    val image: String,
    val prevImage: String? = null,
    val latitude: Double,
    val longitude: Double,
    val accuracy: Double? = null,
    val employeeId: String? = null
)

data class VerificationMeta(
    val confidence: Double? = 0.0,
    val similarity: Double? = 0.0,
    val distance: Double? = 1.0,
    val liveness: Boolean? = true
)

data class GeofenceMeta(
    val insideGeofence: Boolean,
    val distanceMeters: Double,
    val geofenceStatus: String,
    val message: String? = null
)

data class FaceCheckInResponse(
    val success: Boolean,
    val matched: Boolean,
    val actionType: String? = "CHECK_IN",
    val employee: EmployeeShortInfo? = null,
    val verification: VerificationMeta? = null,
    val geofence: GeofenceMeta? = null,
    val attendance: AttendanceRecord? = null,
    val message: String
)

data class EnrollFaceRequest(
    val images: List<String>,
    val employee_id_str: String? = ""
)

data class FacialAnalyticsMetrics(
    val facialToday: Int = 0,
    val manualToday: Int = 0,
    val totalToday: Int = 0,
    val adoptionRate: Double = 0.0,
    val avgConfidence: Double = 0.0,
    val enrolledEmployees: Int = 0,
    val totalEmployees: Int = 0,
    val enrollmentPercentage: Double = 0.0,
    val geofencePassedCount: Int = 0
)

data class FacialAnalyticsResponse(
    val success: Boolean,
    val metrics: FacialAnalyticsMetrics,
    val confidenceDistribution: Map<String, Int>? = null,
    val methodBreakdown: Map<String, Int>? = null,
    val hourlyCheckIns: List<Int>? = null
)

data class AuditLogItem(
    @SerializedName("_id") val id: String,
    val date: String,
    val checkInTime: String? = null,
    val checkOutTime: String? = null,
    val status: String,
    val remarks: String? = null,
    val confidence: Double = 95.0,
    val verificationMethod: String = "Facial Recognition",
    val workDurationMinutes: Int? = null,
    val employee: EmployeeShortInfo? = null
)

data class AuditLogsResponse(
    val success: Boolean,
    val total: Int,
    val logs: List<AuditLogItem>
)

data class BiometricSettings(
    val matchThreshold: Double = 0.70,
    val encryptionEnabled: Boolean = true,
    val encryptionAlgorithm: String = "AES-256 (Fernet Cipher)",
    val serviceAuthEnabled: Boolean = true,
    val retentionDays: Int = 90
)

data class BiometricSettingsResponse(
    val success: Boolean,
    val settings: BiometricSettings
)
