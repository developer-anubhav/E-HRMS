package com.vektra.ehrms.data.models

import com.google.gson.annotations.SerializedName

data class EmployeeShortInfo(
    @SerializedName("_id") val id: String,
    val name: String,
    val employeeId: String
)

data class AttendanceRecord(
    @SerializedName("_id") val id: String,
    val employeeId: String? = null,
    val employee: EmployeeShortInfo? = null,
    val date: String,
    val status: String,
    val remarks: String? = "",
    val workDurationMinutes: Int? = null,
    val verificationMethod: String? = "Manual",
    val confidence: Double? = null,
    val checkInTime: String? = null,
    val checkOutTime: String? = null,
    val gpsLatitude: Double? = null,
    val gpsLongitude: Double? = null,
    val gpsAccuracy: Double? = null,
    val geofenceStatus: String? = "NOT_REQUIRED",
    val distanceFromLocationMeters: Double? = null
)

data class ShiftSettings(
    val startTime: String = "09:00",
    val endTime: String = "17:00",
    val gracePeriodMinutes: Int = 15
)

data class CheckInRequest(
    val type: String // "CHECK_IN" or "CHECK_OUT"
)

data class MarkAttendanceRequest(
    val employee: String,
    val date: String,
    val status: String
)

data class TodayAttendanceResponse(
    val success: Boolean,
    val data: AttendanceRecord?
)
