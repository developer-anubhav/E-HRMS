package com.vektra.ehrms.ui.components

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.navigation.NavController
import androidx.navigation.compose.currentBackStackEntryAsState
import com.vektra.ehrms.data.local.TokenManager
import com.vektra.ehrms.ui.theme.Emerald500
import com.vektra.ehrms.ui.theme.Navy800

sealed class NavItem(val route: String, val title: String, val icon: ImageVector) {
    // Employee Items
    object EmployeeDashboard : NavItem("emp_dashboard", "Dashboard", Icons.Default.Dashboard)
    object MobileCheckIn : NavItem("mobile_checkin", "Check-In", Icons.Default.CameraAlt)
    
    // Management Items
    object ManagementDashboard : NavItem("mgmt_dashboard", "Overview", Icons.Default.Assessment)
    object Employees : NavItem("employees", "Staff", Icons.Default.People)
    object Attendance : NavItem("attendance", "Attendance", Icons.Default.CalendarMonth)
    object Kiosk : NavItem("kiosk", "Kiosk", Icons.Default.CenterFocusWeak)
    object Payroll : NavItem("payroll", "Payroll", Icons.Default.Payments)
    
    // SuperAdmin Items
    object SuperAdminDashboard : NavItem("superadmin_dashboard", "Governance", Icons.Default.AdminPanelSettings)
}

@Composable
fun VektraBottomNav(navController: NavController) {
    val role = TokenManager.getRole()
    val navBackStackEntry = navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry.value?.destination?.route

    val items = when (role) {
        "EMPLOYEE" -> listOf(
            NavItem.EmployeeDashboard,
            NavItem.MobileCheckIn
        )
        "ADMIN", "HR", "MANAGER" -> listOf(
            NavItem.ManagementDashboard,
            NavItem.Employees,
            NavItem.Attendance,
            NavItem.Kiosk,
            NavItem.Payroll
        )
        "SUPERADMIN" -> listOf(
            NavItem.SuperAdminDashboard
        )
        else -> listOf(NavItem.EmployeeDashboard)
    }

    NavigationBar(
        containerColor = Navy800,
        contentColor = Color.White
    ) {
        items.forEach { item ->
            val selected = currentRoute == item.route
            NavigationBarItem(
                selected = selected,
                onClick = {
                    if (currentRoute != item.route) {
                        navController.navigate(item.route) {
                            popUpTo(navController.graph.startDestinationId) { saveState = true }
                            launchSingleTop = true
                            restoreState = true
                        }
                    }
                },
                icon = {
                    Icon(
                        imageVector = item.icon,
                        contentDescription = item.title,
                        tint = if (selected) Emerald500 else Color.Gray
                    )
                },
                label = {
                    Text(
                        text = item.title,
                        color = if (selected) Emerald500 else Color.Gray
                    )
                },
                colors = NavigationBarItemDefaults.colors(
                    indicatorColor = Navy800
                )
            )
        }
    }
}
