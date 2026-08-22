package com.vektra.ehrms.data.models

import com.google.gson.annotations.SerializedName

data class LoginRequest(
    val email: String,
    val password: String
)

data class LoginResponse(
    val token: String,
    val role: String,
    val name: String,
    val companyId: String?
)

data class OrganizationSignupRequest(
    val companyName: String,
    val name: String,
    val email: String,
    val password: String
)

data class GenericResponse(
    val success: Boolean? = null,
    val message: String? = null,
    val error: String? = null
)

data class ForgotPasswordRequest(
    val email: String
)

data class ResetPasswordRequest(
    val token: String,
    val email: String,
    val password: String
)
