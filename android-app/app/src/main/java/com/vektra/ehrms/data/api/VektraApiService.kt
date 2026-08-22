package com.vektra.ehrms.data.api

import com.vektra.ehrms.data.models.*
import retrofit2.Response
import retrofit2.http.*

interface VektraApiService {

    // --- AUTH & USER ---
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

    @POST("auth/organization-signup")
    suspend fun organizationSignup(@Body request: OrganizationSignupRequest): Response<GenericResponse>

    @POST("auth/forgot-password")
    suspend fun forgotPassword(@Body request: ForgotPasswordRequest): Response<GenericResponse>

    @POST("auth/reset-password")
    suspend fun resetPassword(@Body request: ResetPasswordRequest): Response<GenericResponse>

    // --- EMPLOYEES ---
    @GET("employees")
    suspend fun getEmployees(
        @Query("department") department: String? = null,
        @Query("search") search: String? = null
    ): Response<List<Employee>>

    @POST("employees")
    suspend fun createEmployee(@Body request: CreateEmployeeRequest): Response<Employee>

    @POST("employees/create-staff")
    suspend fun createStaff(@Body request: CreateStaffRequest): Response<Employee>

    @GET("employees/{id}")
    suspend fun getEmployeeById(@Path("id") id: String): Response<Employee>

    @PUT("employees/{id}")
    suspend fun updateEmployee(@Path("id") id: String, @Body request: Map<String, String>): Response<Employee>

    @DELETE("employees/{id}")
    suspend fun deleteEmployee(@Path("id") id: String): Response<GenericResponse>

    // --- ATTENDANCE ---
    @GET("attendance/today")
    suspend fun getTodayAttendance(): Response<TodayAttendanceResponse>

    @POST("attendance/checkin")
    suspend fun checkIn(@Body request: CheckInRequest): Response<TodayAttendanceResponse>

    @GET("attendance")
    suspend fun getAttendance(): Response<List<AttendanceRecord>>

    @POST("attendance")
    suspend fun markAttendance(@Body request: MarkAttendanceRequest): Response<AttendanceRecord>

    @GET("attendance/shift-settings")
    suspend fun getShiftSettings(): Response<ShiftSettings>

    @PUT("attendance/shift-settings")
    suspend fun updateShiftSettings(@Body settings: ShiftSettings): Response<GenericResponse>

    @PUT("attendance/{id}")
    suspend fun updateAttendance(@Path("id") id: String, @Body body: Map<String, String>): Response<AttendanceRecord>

    @DELETE("attendance/{id}")
    suspend fun deleteAttendance(@Path("id") id: String): Response<GenericResponse>

    // --- AI BIOMETRICS & FACE CHECK-IN ---
    @POST("face/verify-checkin")
    suspend fun verifyAndCheckInFace(@Body request: VerifyCheckInRequest): Response<FaceCheckInResponse>

    @POST("face/mobile-checkin")
    suspend fun mobileCheckIn(@Body request: MobileCheckInRequest): Response<FaceCheckInResponse>

    @POST("face/enroll/{employeeId}")
    suspend fun enrollFace(@Path("employeeId") employeeId: String, @Body request: EnrollFaceRequest): Response<GenericResponse>

    @GET("face/profile/{employeeId}")
    suspend fun getFaceProfile(@Path("employeeId") employeeId: String): Response<Map<String, Any>>

    @DELETE("face/profile/{employeeId}")
    suspend fun deleteFaceProfile(@Path("employeeId") employeeId: String): Response<GenericResponse>

    @GET("face/analytics")
    suspend fun getFacialAnalytics(): Response<FacialAnalyticsResponse>

    @GET("face/audit-logs")
    suspend fun getFacialAuditLogs(@Query("search") search: String? = null): Response<AuditLogsResponse>

    @GET("face/settings")
    suspend fun getBiometricSettings(): Response<BiometricSettingsResponse>

    @POST("face/settings")
    suspend fun updateBiometricSettings(@Body body: Map<String, Double>): Response<GenericResponse>

    // --- PAYROLL ---
    @GET("payroll")
    suspend fun getPayroll(): Response<List<PayrollRecord>>

    @POST("payroll")
    suspend fun createPayroll(@Body request: CreatePayrollRequest): Response<PayrollRecord>

    @PUT("payroll/{id}")
    suspend fun updatePayroll(@Path("id") id: String, @Body request: CreatePayrollRequest): Response<PayrollRecord>

    @DELETE("payroll/{id}")
    suspend fun deletePayroll(@Path("id") id: String): Response<GenericResponse>

    // --- REPORTS ---
    @GET("reports/dashboard")
    suspend fun getDashboardStats(): Response<DashboardStats>

    @GET("reports/attendance")
    suspend fun getAttendanceReport(): Response<List<AttendanceRecord>>

    @GET("reports/payroll")
    suspend fun getPayrollReport(): Response<List<PayrollRecord>>

    @GET("reports/employee-status")
    suspend fun getEmployeeStatus(): Response<EmployeeStatusResponse>

    @GET("reports/headcount-chart")
    suspend fun getHeadcountChart(): Response<ChartDataResponse>

    @GET("reports/attendance-chart")
    suspend fun getAttendanceChart(): Response<ChartDataResponse>

    // --- ADMIN WORK LOCATION & GEOFENCE ---
    @GET("admin/work-location")
    suspend fun getWorkLocation(): Response<WorkLocationResponse>

    @PUT("admin/work-location")
    suspend fun updateWorkLocation(@Body location: WorkLocation): Response<WorkLocationResponse>

    // --- SUPERADMIN GOVERNANCE ---
    @GET("superadmin/companies")
    suspend fun getCompanies(): Response<CompaniesResponse>

    @POST("superadmin/company/{id}/approve")
    suspend fun approveCompany(@Path("id") id: String): Response<GenericResponse>

    @POST("superadmin/company/{id}/reject")
    suspend fun rejectCompany(@Path("id") id: String): Response<GenericResponse>

    @GET("superadmin/health-stats")
    suspend fun getSystemHealth(): Response<SystemHealthResponse>

    @GET("superadmin/announcements/active")
    suspend fun getActiveAnnouncements(): Response<AnnouncementsResponse>

    @POST("superadmin/announcements")
    suspend fun createAnnouncement(@Body request: CreateAnnouncementRequest): Response<GenericResponse>

    @DELETE("superadmin/announcements/{id}")
    suspend fun deleteAnnouncement(@Path("id") id: String): Response<GenericResponse>
}
