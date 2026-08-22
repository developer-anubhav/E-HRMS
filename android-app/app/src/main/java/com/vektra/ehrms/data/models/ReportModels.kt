package com.vektra.ehrms.data.models

data class DashboardStats(
    val totalEmployees: Int = 0,
    val presentToday: Int = 0,
    val absentToday: Int = 0,
    val monthlyPayroll: Double = 0.0
)

data class StatusSummaryItem(
    val _id: String, // status name e.g. "Present"
    val count: Int
)

data class EmployeeStatusResponse(
    val active: Int = 0,
    val inactive: Int = 0
)

data class ChartDataResponse(
    val labels: List<String>,
    val data: List<Int>
)
