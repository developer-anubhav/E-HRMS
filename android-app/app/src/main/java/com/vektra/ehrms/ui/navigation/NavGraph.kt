package com.vektra.ehrms.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.vektra.ehrms.data.local.TokenManager
import com.vektra.ehrms.ui.auth.ForgotPasswordScreen
import com.vektra.ehrms.ui.auth.LoginScreen
import com.vektra.ehrms.ui.auth.OrganizationSignupScreen
import com.vektra.ehrms.ui.components.NavItem
import com.vektra.ehrms.ui.employee.EmployeeDashboardScreen
import com.vektra.ehrms.ui.employee.MobileCheckInScreen
import com.vektra.ehrms.ui.management.*
import com.vektra.ehrms.ui.superadmin.SuperAdminDashboardScreen

@Composable
fun VektraNavGraph(
    navController: NavHostController,
    onLogout: () -> Unit
) {
    val startRoute = if (!TokenManager.isLoggedIn()) {
        "login"
    } else {
        when (TokenManager.getRole()) {
            "EMPLOYEE" -> NavItem.EmployeeDashboard.route
            "ADMIN", "HR", "MANAGER" -> NavItem.ManagementDashboard.route
            "SUPERADMIN" -> NavItem.SuperAdminDashboard.route
            else -> NavItem.EmployeeDashboard.route
        }
    }

    NavHost(
        navController = navController,
        startDestination = startRoute
    ) {
        // --- AUTH ROUTES ---
        composable("login") {
            LoginScreen(
                onLoginSuccess = { role ->
                    val target = when (role) {
                        "EMPLOYEE" -> NavItem.EmployeeDashboard.route
                        "ADMIN", "HR", "MANAGER" -> NavItem.ManagementDashboard.route
                        "SUPERADMIN" -> NavItem.SuperAdminDashboard.route
                        else -> NavItem.EmployeeDashboard.route
                    }
                    navController.navigate(target) {
                        popUpTo("login") { inclusive = true }
                    }
                },
                onNavigateToSignup = { navController.navigate("signup") },
                onNavigateToForgotPassword = { navController.navigate("forgot_password") }
            )
        }

        composable("signup") {
            OrganizationSignupScreen(
                onNavigateToLogin = { navController.navigate("login") }
            )
        }

        composable("forgot_password") {
            ForgotPasswordScreen(
                onNavigateBack = { navController.popBackStack() }
            )
        }

        // --- EMPLOYEE ROUTES ---
        composable(NavItem.EmployeeDashboard.route) {
            EmployeeDashboardScreen(
                onNavigateToMobileCheckIn = { navController.navigate(NavItem.MobileCheckIn.route) }
            )
        }

        composable(NavItem.MobileCheckIn.route) {
            MobileCheckInScreen(
                onNavigateBack = { navController.popBackStack() }
            )
        }

        // --- MANAGEMENT ROUTES ---
        composable(NavItem.ManagementDashboard.route) {
            ManagementDashboardScreen()
        }

        composable(NavItem.Employees.route) {
            EmployeesScreen()
        }

        composable(NavItem.Attendance.route) {
            AttendanceScreen()
        }

        composable(NavItem.Kiosk.route) {
            KioskScreen()
        }

        composable(NavItem.Payroll.route) {
            PayrollScreen()
        }

        // --- SUPERADMIN ROUTES ---
        composable(NavItem.SuperAdminDashboard.route) {
            SuperAdminDashboardScreen()
        }
    }
}
