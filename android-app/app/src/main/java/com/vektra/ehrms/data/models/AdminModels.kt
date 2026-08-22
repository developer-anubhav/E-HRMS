package com.vektra.ehrms.data.models

data class WorkLocation(
    val name: String = "Main Office / HQ",
    val latitude: Double = 12.9716,
    val longitude: Double = 77.5946,
    val radiusMeters: Double = 200.0,
    val enabled: Boolean = true
)

data class WorkLocationResponse(
    val success: Boolean,
    val workLocation: WorkLocation
)

data class RegisterAdminRequest(
    val name: String,
    val email: String,
    val companyName: String
)
