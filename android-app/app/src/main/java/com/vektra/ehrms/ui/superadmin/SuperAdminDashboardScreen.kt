package com.vektra.ehrms.ui.superadmin

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.HealthAndSafety
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vektra.ehrms.data.models.CompanyTenant
import com.vektra.ehrms.data.models.SystemHealthData
import com.vektra.ehrms.data.repository.VektraRepository
import com.vektra.ehrms.ui.theme.*
import kotlinx.coroutines.launch

@Composable
fun SuperAdminDashboardScreen() {
    val repository = remember { VektraRepository() }
    val scope = rememberCoroutineScope()

    var companies by remember { mutableStateOf<List<CompanyTenant>>(emptyList()) }
    var systemHealth by remember { mutableStateOf<SystemHealthData?>(null) }
    var isLoading by remember { mutableStateOf(true) }

    fun refresh() {
        isLoading = true
        scope.launch {
            repository.getCompanies().onSuccess { companies = it.data }
            repository.getSystemHealth().onSuccess { systemHealth = it.data }
            isLoading = false
        }
    }

    LaunchedEffect(Unit) {
        refresh()
    }

    Column(
        modifier = Modifier.fillMaxSize().background(Navy900).padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text("SuperAdmin Command Center", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = Color.White)
        Text("Multi-Tenant Governance & Platform Infrastructure", fontSize = 12.sp, color = Slate400)

        // System Health Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Navy800)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.HealthAndSafety, contentDescription = null, tint = Emerald500)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Platform Diagnostics", color = Color.White, fontWeight = FontWeight.Bold)
                }
                Spacer(modifier = Modifier.height(8.dp))
                Text("DB Connection: ${systemHealth?.dbStatus ?: "Connected"} | Uptime: ${systemHealth?.uptime ?: "Active"}", color = Slate400, fontSize = 12.sp)
                Text("RAM RSS: ${systemHealth?.memoryUsage ?: "0 MB"} | Heap: ${systemHealth?.heapUsed ?: "0 MB"}", color = Slate400, fontSize = 12.sp)
            }
        }

        Text("Registered Tenant Organizations", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color.White)

        if (isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = Emerald500)
            }
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                items(companies) { company ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp),
                        colors = CardDefaults.cardColors(containerColor = Navy800)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(16.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(company.name, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                                Text("Admin: ${company.adminName} (${company.email})", color = Slate400, fontSize = 12.sp)
                                Text("Status: ${company.status}", color = if (company.status == "Active") Emerald500 else Amber500, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }

                            if (company.status == "Pending") {
                                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                    IconButton(onClick = {
                                        scope.launch {
                                            repository.approveCompany(company.id)
                                            refresh()
                                        }
                                    }) {
                                        Icon(Icons.Default.Check, contentDescription = "Approve", tint = Emerald500)
                                    }
                                    IconButton(onClick = {
                                        scope.launch {
                                            repository.rejectCompany(company.id)
                                            refresh()
                                        }
                                    }) {
                                        Icon(Icons.Default.Close, contentDescription = "Reject", tint = Rose600)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
