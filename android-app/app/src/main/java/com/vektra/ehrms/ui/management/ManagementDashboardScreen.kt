package com.vektra.ehrms.ui.management

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vektra.ehrms.data.models.DashboardStats
import com.vektra.ehrms.data.models.FacialAnalyticsMetrics
import com.vektra.ehrms.data.repository.VektraRepository
import com.vektra.ehrms.ui.theme.*
import kotlinx.coroutines.launch

@Composable
fun ManagementDashboardScreen() {
    val repository = remember { VektraRepository() }
    val scope = rememberCoroutineScope()

    var stats by remember { mutableStateOf<DashboardStats?>(null) }
    var facialMetrics by remember { mutableStateOf<FacialAnalyticsMetrics?>(null) }
    var isLoading by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        scope.launch {
            repository.getDashboardStats().onSuccess { stats = it }
            repository.getFacialAnalytics().onSuccess { facialMetrics = it.metrics }
            isLoading = false
        }
    }

    Box(
        modifier = Modifier.fillMaxSize().background(Navy900).padding(16.dp)
    ) {
        if (isLoading) {
            CircularProgressIndicator(color = Emerald500, modifier = Modifier.align(Alignment.Center))
        } else {
            Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                Text("Management Operations Hub", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = Color.White)
                Text("Real-Time Headcount & AI Biometric KPI Dashboard", fontSize = 12.sp, color = Slate400)

                LazyVerticalGrid(
                    columns = GridCells.Fixed(2),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    item {
                        KpiMetricCard("Total Employees", "${stats?.totalEmployees ?: 0}", Icons.Default.People, Emerald500)
                    }
                    item {
                        KpiMetricCard("Present Today", "${stats?.presentToday ?: 0}", Icons.Default.CheckCircle, Sky500)
                    }
                    item {
                        KpiMetricCard("Absent Today", "${stats?.absentToday ?: 0}", Icons.Default.Cancel, Rose600)
                    }
                    item {
                        KpiMetricCard("Monthly Payroll", "\$${stats?.monthlyPayroll ?: 0.0}", Icons.Default.Payments, Amber500)
                    }
                    item {
                        KpiMetricCard("Facial Check-Ins", "${facialMetrics?.facialToday ?: 0}", Icons.Default.CameraAlt, Emerald500)
                    }
                    item {
                        KpiMetricCard("Biometric Adoption", "${facialMetrics?.adoptionRate ?: 0.0}%", Icons.Default.Biometric, Indigo500)
                    }
                }
            }
        }
    }
}

@Composable
fun KpiMetricCard(title: String, value: String, icon: ImageVector, color: Color) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Navy800),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                Text(title, fontSize = 12.sp, color = Slate400, fontWeight = FontWeight.SemiBold)
                Icon(icon, contentDescription = null, tint = color, modifier = Modifier.size(20.dp))
            }
            Spacer(modifier = Modifier.height(12.dp))
            Text(value, fontSize = 22.sp, fontWeight = FontWeight.Bold, color = Color.White)
        }
    }
}
