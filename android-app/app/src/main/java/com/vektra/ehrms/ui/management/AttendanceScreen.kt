package com.vektra.ehrms.ui.management

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vektra.ehrms.data.models.AttendanceRecord
import com.vektra.ehrms.data.models.ShiftSettings
import com.vektra.ehrms.data.repository.VektraRepository
import com.vektra.ehrms.ui.theme.*
import kotlinx.coroutines.launch

@Composable
fun AttendanceScreen() {
    val repository = remember { VektraRepository() }
    val scope = rememberCoroutineScope()

    var records by remember { mutableStateOf<List<AttendanceRecord>>(emptyList()) }
    var shiftSettings by remember { mutableStateOf<ShiftSettings?>(null) }
    var isLoading by remember { mutableStateOf(true) }
    var showShiftDialog by remember { mutableStateOf(false) }

    fun refresh() {
        isLoading = true
        scope.launch {
            repository.getAttendance().onSuccess { records = it }
            repository.getShiftSettings().onSuccess { shiftSettings = it }
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
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text("Attendance Logs", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = Color.White)
                Text("Company shift & attendance tracking", fontSize = 12.sp, color = Slate400)
            }

            IconButton(onClick = { showShiftDialog = true }) {
                Icon(Icons.Default.Settings, contentDescription = "Shift Settings", tint = Emerald500)
            }
        }

        if (isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = Emerald500)
            }
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                items(records) { att ->
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
                            Column {
                                Text(att.employee?.name ?: "Employee", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                                Text("ID: ${att.employee?.employeeId ?: "N/A"} • Date: ${att.date.take(10)}", color = Slate400, fontSize = 12.sp)
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
            }
        }
    }

    if (showShiftDialog && shiftSettings != null) {
        var start by remember { mutableStateOf(shiftSettings!!.startTime) }
        var end by remember { mutableStateOf(shiftSettings!!.endTime) }
        var grace by remember { mutableStateOf(shiftSettings!!.gracePeriodMinutes.toString()) }

        AlertDialog(
            onDismissRequest = { showShiftDialog = false },
            title = { Text("Update Company Shift Policy") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedTextField(value = start, onValueChange = { start = it }, label = { Text("Shift Start Time (HH:mm)") })
                    OutlinedTextField(value = end, onValueChange = { end = it }, label = { Text("Shift End Time (HH:mm)") })
                    OutlinedTextField(value = grace, onValueChange = { grace = it }, label = { Text("Grace Period (Minutes)") })
                }
            },
            confirmButton = {
                Button(onClick = {
                    scope.launch {
                        repository.updateShiftSettings(
                            ShiftSettings(start, end, grace.toIntOrNull() ?: 15)
                        )
                        showShiftDialog = false
                        refresh()
                    }
                }) {
                    Text("Save Policy")
                }
            },
            dismissButton = { TextButton(onClick = { showShiftDialog = false }) { Text("Cancel") } }
        )
    }
}
