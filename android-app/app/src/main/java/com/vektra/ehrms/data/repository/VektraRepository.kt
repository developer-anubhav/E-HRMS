package com.vektra.ehrms.data.repository

import com.vektra.ehrms.data.api.RetrofitClient
import com.vektra.ehrms.data.models.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class VektraRepository {

    private val api get() = RetrofitClient.apiService

    suspend fun login(email: String, password: String): Result<LoginResponse> = safeApiCall {
        api.login(LoginRequest(email, password))
    }

    suspend fun organizationSignup(companyName: String, name: String, email: String, password: String): Result<GenericResponse> = safeApiCall {
        api.organizationSignup(OrganizationSignupRequest(companyName, name, email, password))
    }

    suspend fun forgotPassword(email: String): Result<GenericResponse> = safeApiCall {
        api.forgotPassword(ForgotPasswordRequest(email))
    }

    suspend fun getEmployees(department: String? = null, search: String? = null): Result<List<Employee>> = safeApiCall {
        api.getEmployees(department, search)
    }

    suspend fun createEmployee(req: CreateEmployeeRequest): Result<Employee> = safeApiCall {
        api.createEmployee(req)
    }

    suspend fun createStaff(req: CreateStaffRequest): Result<Employee> = safeApiCall {
        api.createStaff(req)
    }

    suspend fun deleteEmployee(id: String): Result<GenericResponse> = safeApiCall {
        api.deleteEmployee(id)
    }

    suspend fun getTodayAttendance(): Result<TodayAttendanceResponse> = safeApiCall {
        api.getTodayAttendance()
    }

    suspend fun checkIn(type: String): Result<TodayAttendanceResponse> = safeApiCall {
        api.checkIn(CheckInRequest(type))
    }

    suspend fun getAttendance(): Result<List<AttendanceRecord>> = safeApiCall {
        api.getAttendance()
    }

    suspend fun markAttendance(employeeId: String, date: String, status: String): Result<AttendanceRecord> = safeApiCall {
        api.markAttendance(MarkAttendanceRequest(employeeId, date, status))
    }

    suspend fun getShiftSettings(): Result<ShiftSettings> = safeApiCall {
        api.getShiftSettings()
    }

    suspend fun updateShiftSettings(settings: ShiftSettings): Result<GenericResponse> = safeApiCall {
        api.updateShiftSettings(settings)
    }

    suspend fun verifyAndCheckInFace(image: String, prevImage: String? = null, employeeId: String? = null): Result<FaceCheckInResponse> = safeApiCall {
        api.verifyAndCheckInFace(VerifyCheckInRequest(image, prevImage, employeeId))
    }

    suspend fun mobileCheckIn(image: String, prevImage: String? = null, lat: Double, lng: Double, accuracy: Double? = null): Result<FaceCheckInResponse> = safeApiCall {
        api.mobileCheckIn(MobileCheckInRequest(image, prevImage, lat, lng, accuracy))
    }

    suspend fun enrollFace(employeeId: String, images: List<String>, idStr: String? = ""): Result<GenericResponse> = safeApiCall {
        api.enrollFace(employeeId, EnrollFaceRequest(images, idStr))
    }

    suspend fun getFacialAnalytics(): Result<FacialAnalyticsResponse> = safeApiCall {
        api.getFacialAnalytics()
    }

    suspend fun getFacialAuditLogs(search: String? = null): Result<AuditLogsResponse> = safeApiCall {
        api.getFacialAuditLogs(search)
    }

    suspend fun getPayroll(): Result<List<PayrollRecord>> = safeApiCall {
        api.getPayroll()
    }

    suspend fun createPayroll(req: CreatePayrollRequest): Result<PayrollRecord> = safeApiCall {
        api.createPayroll(req)
    }

    suspend fun getDashboardStats(): Result<DashboardStats> = safeApiCall {
        api.getDashboardStats()
    }

    suspend fun getWorkLocation(): Result<WorkLocationResponse> = safeApiCall {
        api.getWorkLocation()
    }

    suspend fun updateWorkLocation(loc: WorkLocation): Result<WorkLocationResponse> = safeApiCall {
        api.updateWorkLocation(loc)
    }

    suspend fun getCompanies(): Result<CompaniesResponse> = safeApiCall {
        api.getCompanies()
    }

    suspend fun approveCompany(id: String): Result<GenericResponse> = safeApiCall {
        api.approveCompany(id)
    }

    suspend fun rejectCompany(id: String): Result<GenericResponse> = safeApiCall {
        api.rejectCompany(id)
    }

    suspend fun getSystemHealth(): Result<SystemHealthResponse> = safeApiCall {
        api.getSystemHealth()
    }

    suspend fun getActiveAnnouncements(): Result<AnnouncementsResponse> = safeApiCall {
        api.getActiveAnnouncements()
    }

    suspend fun createAnnouncement(msg: String, priority: String): Result<GenericResponse> = safeApiCall {
        api.createAnnouncement(CreateAnnouncementRequest(msg, priority))
    }

    private suspend fun <T> safeApiCall(call: suspend () -> retrofit2.Response<T>): Result<T> {
        return withContext(Dispatchers.IO) {
            try {
                val response = call()
                if (response.isSuccessful && response.body() != null) {
                    Result.success(response.body()!!)
                } else {
                    val errorMsg = response.errorBody()?.string() ?: "Server returned code ${response.code()}"
                    Result.failure(Exception(errorMsg))
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }
    }
}
