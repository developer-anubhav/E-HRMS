package com.vektra.ehrms.data.models

import com.google.gson.annotations.SerializedName

data class PayrollRecord(
    @SerializedName("_id") val id: String,
    val employeeId: String,
    val employee: EmployeeShortInfo? = null,
    val month: String,
    val basicSalary: Double,
    val allowances: Double = 0.0,
    val deductions: Double = 0.0,
    val netSalary: Double = 0.0,
    val createdAt: String? = null
)

data class CreatePayrollRequest(
    val employee: String, // employee _id
    val month: String,
    val basicSalary: Double,
    val allowances: Double = 0.0,
    val deductions: Double = 0.0
)
