package com.vektra.ehrms.ui.management

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
import com.vektra.ehrms.data.models.CreateEmployeeRequest
import com.vektra.ehrms.data.models.Employee
import com.vektra.ehrms.data.repository.VektraRepository
import com.vektra.ehrms.ui.theme.*
import kotlinx.coroutines.launch

@Composable
fun EmployeesScreen() {
    val repository = remember { VektraRepository() }
    val scope = rememberCoroutineScope()

    var searchQuery by remember { mutableStateOf("") }
    var employees by remember { mutableStateOf<List<Employee>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var showAddDialog by remember { mutableStateOf(false) }

    fun refresh() {
        isLoading = true
        scope.launch {
            repository.getEmployees(search = searchQuery.ifBlank { null }).onSuccess {
                employees = it
            }
            isLoading = false
        }
    }

    LaunchedEffect(searchQuery) {
        refresh()
    }

    Scaffold(
        containerColor = Navy900,
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showAddDialog = true },
                containerColor = Emerald500
            ) {
                Icon(Icons.Default.Add, contentDescription = "Add Employee", tint = Color.White)
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Staff Directory", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = Color.White)
                Text("${employees.size} Members", fontSize = 12.sp, color = Slate400)
            }

            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                placeholder = { Text("Search by name, ID, department...", color = Slate400) },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = Emerald500) },
                modifier = Modifier.fillMaxWidth(),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = Color.White, unfocusedTextColor = Color.White,
                    focusedBorderColor = Emerald500, unfocusedBorderColor = Slate700
                ),
                singleLine = true
            )

            if (isLoading) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = Emerald500)
                }
            } else {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(employees) { emp ->
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
                                    Text(emp.name, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                                    Text("ID: ${emp.employeeId} • Dept: ${emp.department}", color = Slate400, fontSize = 12.sp)
                                    Text("Role: ${emp.role} • Salary: \$${emp.monthlySalary}", color = Slate400, fontSize = 11.sp)
                                }

                                Surface(
                                    color = if (emp.faceProfile?.enrolled == true) Emerald500.copy(alpha = 0.2f) else Slate700,
                                    shape = RoundedCornerShape(10.dp)
                                ) {
                                    Text(
                                        text = if (emp.faceProfile?.enrolled == true) "Biometrics Active" else "Not Enrolled",
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                        fontSize = 10.sp,
                                        color = if (emp.faceProfile?.enrolled == true) Emerald500 else Slate400,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    if (showAddDialog) {
        AddEmployeeDialog(
            onDismiss = { showAddDialog = false },
            onAdd = { empReq ->
                scope.launch {
                    repository.createEmployee(empReq)
                    showAddDialog = false
                    refresh()
                }
            }
        )
    }
}

@Composable
fun AddEmployeeDialog(
    onDismiss: () -> Unit,
    onAdd: (CreateEmployeeRequest) -> Unit
) {
    var empId by remember { mutableStateOf("") }
    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var dept by remember { mutableStateOf("Engineering") }
    var salary by remember { mutableStateOf("5000") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Add New Employee") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedTextField(value = empId, onValueChange = { empId = it }, label = { Text("Employee ID") })
                OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("Full Name") })
                OutlinedTextField(value = email, onValueChange = { email = it }, label = { Text("Email") })
                OutlinedTextField(value = phone, onValueChange = { phone = it }, label = { Text("Phone") })
                OutlinedTextField(value = dept, onValueChange = { dept = it }, label = { Text("Department") })
                OutlinedTextField(value = salary, onValueChange = { salary = it }, label = { Text("Monthly Salary") })
            }
        },
        confirmButton = {
            Button(onClick = {
                onAdd(
                    CreateEmployeeRequest(
                        employeeId = empId.trim(),
                        name = name.trim(),
                        email = email.trim(),
                        phoneNumber = phone.trim(),
                        department = dept.trim(),
                        monthlySalary = salary.toDoubleOrNull() ?: 0.0
                    )
                )
            }) {
                Text("Create Employee")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancel") }
        }
    )
}
