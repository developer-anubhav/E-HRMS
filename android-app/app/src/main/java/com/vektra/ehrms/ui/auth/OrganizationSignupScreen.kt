package com.vektra.ehrms.ui.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vektra.ehrms.data.repository.VektraRepository
import com.vektra.ehrms.ui.theme.*
import kotlinx.coroutines.launch

@Composable
fun OrganizationSignupScreen(
    onNavigateToLogin: () -> Unit
) {
    val repository = remember { VektraRepository() }
    val scope = rememberCoroutineScope()

    var companyName by remember { mutableStateOf("") }
    var adminName by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var successMessage by remember { mutableStateOf<String?>(null) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Navy900)
            .padding(16.dp),
        contentAlignment = Alignment.Center
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth(0.95f)
                .verticalScroll(rememberScrollState()),
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = Navy800)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Text(
                    text = "Register Organization",
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold,
                    color = Emerald500
                )
                Text(
                    text = "Setup your multi-tenant Vektra HR workspace",
                    fontSize = 12.sp,
                    color = Slate400
                )

                errorMessage?.let { error ->
                    Surface(color = Rose600.copy(alpha = 0.2f), shape = RoundedCornerShape(12.dp), modifier = Modifier.fillMaxWidth()) {
                        Text(text = error, color = Rose600, modifier = Modifier.padding(12.dp), fontSize = 12.sp)
                    }
                }

                successMessage?.let { success ->
                    Surface(color = Emerald500.copy(alpha = 0.2f), shape = RoundedCornerShape(12.dp), modifier = Modifier.fillMaxWidth()) {
                        Text(text = success, color = Emerald500, modifier = Modifier.padding(12.dp), fontSize = 12.sp)
                    }
                }

                OutlinedTextField(
                    value = companyName,
                    onValueChange = { companyName = it },
                    label = { Text("Company / Organization Name", color = Slate400) },
                    leadingIcon = { Icon(Icons.Default.Business, contentDescription = null, tint = Emerald500) },
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(focusedTextColor = Color.White, unfocusedTextColor = Color.White, focusedBorderColor = Emerald500, unfocusedBorderColor = Slate700)
                )

                OutlinedTextField(
                    value = adminName,
                    onValueChange = { adminName = it },
                    label = { Text("Admin Full Name", color = Slate400) },
                    leadingIcon = { Icon(Icons.Default.Person, contentDescription = null, tint = Emerald500) },
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(focusedTextColor = Color.White, unfocusedTextColor = Color.White, focusedBorderColor = Emerald500, unfocusedBorderColor = Slate700)
                )

                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("Admin Email", color = Slate400) },
                    leadingIcon = { Icon(Icons.Default.Email, contentDescription = null, tint = Emerald500) },
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(focusedTextColor = Color.White, unfocusedTextColor = Color.White, focusedBorderColor = Emerald500, unfocusedBorderColor = Slate700)
                )

                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it },
                    label = { Text("Password", color = Slate400) },
                    leadingIcon = { Icon(Icons.Default.Lock, contentDescription = null, tint = Emerald500) },
                    visualTransformation = PasswordVisualTransformation(),
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(focusedTextColor = Color.White, unfocusedTextColor = Color.White, focusedBorderColor = Emerald500, unfocusedBorderColor = Slate700)
                )

                Button(
                    onClick = {
                        if (companyName.isBlank() || adminName.isBlank() || email.isBlank() || password.isBlank()) {
                            errorMessage = "All fields are required"
                            return@Button
                        }
                        isLoading = true
                        errorMessage = null
                        scope.launch {
                            val result = repository.organizationSignup(companyName.trim(), adminName.trim(), email.trim(), password)
                            isLoading = false
                            result.onSuccess { res ->
                                successMessage = res.message ?: "Organization registered successfully! You can now log in."
                            }.onFailure { err ->
                                errorMessage = err.message ?: "Registration failed."
                            }
                        }
                    },
                    modifier = Modifier.fillMaxWidth().height(50.dp),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Emerald500),
                    enabled = !isLoading
                ) {
                    if (isLoading) {
                        CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp))
                    } else {
                        Text("REGISTER WORKSPACE", fontWeight = FontWeight.Bold)
                    }
                }

                TextButton(onClick = onNavigateToLogin) {
                    Text("Already have an account? Sign In", color = Slate400, fontSize = 13.sp)
                }
            }
        }
    }
}
