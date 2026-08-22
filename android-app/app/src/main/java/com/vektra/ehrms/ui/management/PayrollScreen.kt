package com.vektra.ehrms.ui.management

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vektra.ehrms.data.models.PayrollRecord
import com.vektra.ehrms.data.repository.VektraRepository
import com.vektra.ehrms.ui.theme.*
import kotlinx.coroutines.launch

@Composable
fun PayrollScreen() {
    val repository = remember { VektraRepository() }
    val scope = rememberCoroutineScope()

    var payrolls by remember { mutableStateOf<List<PayrollRecord>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        scope.launch {
            repository.getPayroll().onSuccess { payrolls = it }
            isLoading = false
        }
    }

    Column(
        modifier = Modifier.fillMaxSize().background(Navy900).padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text("Payroll Management Engine", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = Color.White)
        Text("Company salary runs, allowances, and statutory deductions", fontSize = 12.sp, color = Slate400)

        if (isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = Emerald500)
            }
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                items(payrolls) { pay ->
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
                                Text(pay.employee?.name ?: "Employee", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                                Text("Month: ${pay.month} • Basic: \$${pay.basicSalary}", color = Slate400, fontSize = 12.sp)
                                Text("Allowances: \$${pay.allowances} | Deductions: \$${pay.deductions}", color = Slate400, fontSize = 11.sp)
                            }
                            Text("\$${pay.netSalary}", fontWeight = FontWeight.Bold, fontSize = 18.sp, color = Emerald500)
                        }
                    }
                }
            }
        }
    }
}
