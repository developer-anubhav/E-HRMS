package com.vektra.ehrms.data.models

import com.google.gson.annotations.SerializedName

data class FaceProfileMirror(
    val enrolled: Boolean = false,
    val embeddingCount: Int = 0,
    val modelVersion: String = "",
    val enrolledAt: String? = null,
    val updatedAt: String? = null
)

data class Employee(
    @SerializedName("_id") val id: String,
    val employeeId: String,
    val name: String,
    val email: String,
    val phoneNumber: String? = "",
    val department: String,
    val role: String,
    val monthlySalary: Double? = 0.0,
    val status: String = "Active",
    val faceProfile: FaceProfileMirror? = null
)

data class CreateEmployeeRequest(
    val employeeId: String,
    val name: String,
    val email: String,
    val phoneNumber: String? = "",
    val department: String,
    val role: String = "EMPLOYEE",
    val monthlySalary: Double = 0.0,
    val status: String = "Active"
)

data class CreateStaffRequest(
    val employeeId: String,
    val name: String,
    val email: String,
    val department: String,
    val role: String,
    val password: String? = null
)
