package com.vektra.ehrms.ui.employee

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vektra.ehrms.data.local.TokenManager
import com.vektra.ehrms.data.models.AttendanceRecord
import com.vektra.ehrms.data.models.PayrollRecord
import com.vektra.ehrms.data.repository.VektraRepository
import com.vektra.ehrms.ui.theme.*
import kotlinx.coroutines.launch

@Composable
fun EmployeeDashboardScreen(
    onNavigateToMobileCheckIn: () -> Unit
) {
    val repository = remember { VektraRepository() }
    val scope = rememberCoroutineScope()

    var todayAtt by remember { mutableStateOf<AttendanceRecord?>(null) }
    var history by remember { mutableStateOf<List<AttendanceRecord>>(emptyList()) }
    var payrolls by remember { mutableStateOf<List<PayrollRecord>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }

    fun refresh() {
        isLoading = true
        scope.launch {
            repository.getTodayAttendance().onSuccess { res ->
                todayAtt = res.data
            }
            repository.getAttendance().onSuccess { list ->
                history = list.take(10)
            }
            repository.getPayroll().onSuccess { list ->
                payrolls = list
            }
            isLoading = false
        }
    }

    LaunchedEffect(Unit) {
        refresh()
    }

    Scaffold(
        containerColor = Navy900
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            if (isLoading) {
                CircularProgressIndicator(
                    color = Emerald500,
                    modifier = Modifier.align(Alignment.Center)
                )
            } else {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Welcome Banner
                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(20.dp),
                            colors = CardDefaults.cardColors(containerColor = Navy800)
                        ) {
                            Column(modifier = Modifier.padding(20.dp)) {
                                Text(
                                    text = "Welcome back, ${TokenManager.getUserName()} 👋",
                                    fontSize = 20.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White
                                )
                                Text(
                                    text = "Role: ${TokenManager.getRole()} • Portal: Employee Self-Service",
                                    fontSize = 12.sp,
                                    color = Slate400
                                )

                                Spacer(modifier = Modifier.height(16.dp))

                                // Quick Action: Mobile Camera Check-In
                                Button(
                                    onClick = onNavigateToMobileCheckIn,
                                    modifier = Modifier.fillMaxWidth().height(48.dp),
                                    shape = RoundedCornerShape(12.dp),
                                    colors = ButtonDefaults.buttonColors(containerColor = Emerald500)
                                ) {
                                    Icon(Icons.Default.CameraAlt, contentDescription = null, tint = Color.White)
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text("OPEN MOBILE SELFIE CHECK-IN", fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }

                    // Today Status Card
                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = Navy800)
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text("Today's Shift Status", fontWeight = FontWeight.Bold, color = Slate400, fontSize = 14.sp)
                                Spacer(modifier = Modifier.height(8.dp))

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column {
                                        Text(
                                            text = todayAtt?.status ?: "Not Checked In",
                                            fontSize = 18.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = when(todayAtt?.status) {
                                                "Present" -> Emerald500
                                                "Late" -> Amber500
                                                "Absent" -> Rose600
                                                else -> Slate400
                                            }
                                        )
                                        todayAtt?.checkInTime?.let {
                                            Text("Check-In: $it", fontSize = 12.sp, color = Slate400)
                                        }
                                        todayAtt?.checkOutTime?.let {
                                            Text("Check-Out: $it", fontSize = 12.sp, color = Slate400)
                                        }
                                    }

                                    Surface(
                                        color = Emerald500.copy(alpha = 0.15f),
                                        shape = RoundedCornerShape(12.dp)
                                    ) {
                                        Text(
                                            text = todayAtt?.verificationMethod ?: "Self-Service",
                                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                                            fontSize = 11.sp,
                                            color = Emerald500,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }
                                }
                            }
                        }
                    }

                    // Recent Attendance Logs
                    item {
                        Text(
                            text = "Recent Attendance History",
                            fontWeight = FontWeight.Bold,
                            color = Color.White,
                            fontSize = 16.sp
                        )
                    }

                    items(history) { att ->
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            colors = CardDefaults.cardColors(containerColor = Navy800)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth().padding(14.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text(att.date.take(10), color = Color.White, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                                    Text("Method: ${att.verificationMethod ?: "Manual"}", color = Slate400, fontSize = 11.sp)
                                }
                                Text(
                                    att.status,
                                    fontWeight = FontWeight.Bold,
                                    color = when(att.status) {
                                        "Present" -> Emerald500
                                        "Late" -> Amber500
                                        "Absent" -> Rose600
                                        else -> Slate400
                                    }
                                )
                            }
                        }
                    }

                    // Payslips Section
                    item {
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "My Payslips & Compensation",
                            fontWeight = FontWeight.Bold,
                            color = Color.White,
                            fontSize = 16.sp
                        )
                    }

                    items(payrolls) { pay ->
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            colors = CardDefaults.cardColors(containerColor = Navy800)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth().padding(14.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text("Month: ${pay.month}", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                    Text("Basic: \$${pay.basicSalary} | Allowances: \$${pay.allowances}", color = Slate400, fontSize = 11.sp)
                                }
                                Text(
                                    "\$${pay.netSalary}",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 16.sp,
                                    color = Emerald500
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
