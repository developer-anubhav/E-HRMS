package com.vektra.ehrms.ui.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vektra.ehrms.data.api.RetrofitClient
import com.vektra.ehrms.data.local.TokenManager
import com.vektra.ehrms.data.repository.VektraRepository
import com.vektra.ehrms.ui.theme.*
import kotlinx.coroutines.launch

@Composable
fun LoginScreen(
    onLoginSuccess: (role: String) -> Unit,
    onNavigateToSignup: () -> Unit,
    onNavigateToForgotPassword: () -> Unit
) {
    val repository = remember { VektraRepository() }
    val scope = rememberCoroutineScope()

    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var passwordVisible by remember { mutableStateOf(false) }
    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    // Backend URL settings modal
    var showUrlDialog by remember { mutableStateOf(false) }
    var customUrl by remember { mutableStateOf(RetrofitClient.getBaseUrl()) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Navy900),
        contentAlignment = Alignment.Center
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth(0.9f)
                .padding(16.dp),
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
                // Logo & Header
                Text(
                    text = "Vektra Pro",
                    fontSize = 28.sp,
                    fontWeight = FontWeight.Bold,
                    color = Emerald500
                )
                Text(
                    text = "Enterprise HR Management System",
                    fontSize = 12.sp,
                    color = Slate400
                )

                Spacer(modifier = Modifier.height(8.dp))

                errorMessage?.let { error ->
                    Surface(
                        color = Rose600.copy(alpha = 0.2f),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = error,
                            color = Rose600,
                            modifier = Modifier.padding(12.dp),
                            fontSize = 12.sp
                        )
                    }
                }

                // Email Input
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it; errorMessage = null },
                    label = { Text("Email Address", color = Slate400) },
                    leadingIcon = { Icon(Icons.Default.Email, contentDescription = null, tint = Emerald500) },
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        focusedBorderColor = Emerald500,
                        unfocusedBorderColor = Slate700
                    ),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email)
                )

                // Password Input
                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it; errorMessage = null },
                    label = { Text("Password", color = Slate400) },
                    leadingIcon = { Icon(Icons.Default.Lock, contentDescription = null, tint = Emerald500) },
                    trailingIcon = {
                        IconButton(onClick = { passwordVisible = !passwordVisible }) {
                            Icon(
                                imageVector = if (passwordVisible) Icons.Default.Visibility else Icons.Default.VisibilityOff,
                                contentDescription = null,
                                tint = Slate400
                            )
                        }
                    },
                    visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        focusedBorderColor = Emerald500,
                        unfocusedBorderColor = Slate700
                    ),
                    singleLine = true
                )

                // Forgot Password link
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End
                ) {
                    TextButton(onClick = onNavigateToForgotPassword) {
                        Text("Forgot password?", color = Emerald500, fontSize = 12.sp)
                    }
                }

                // Login Button
                Button(
                    onClick = {
                        if (email.isBlank() || password.isBlank()) {
                            errorMessage = "Please enter email and password"
                            return@Button
                        }
                        isLoading = true
                        errorMessage = null
                        scope.launch {
                            val result = repository.login(email.trim(), password)
                            isLoading = false
                            result.onSuccess { res ->
                                TokenManager.saveAuthData(
                                    token = res.token,
                                    role = res.role,
                                    name = res.name,
                                    companyId = res.companyId,
                                    email = email.trim()
                                )
                                onLoginSuccess(res.role)
                            }.onFailure { err ->
                                errorMessage = err.message ?: "Login failed. Check server connection."
                            }
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Emerald500),
                    enabled = !isLoading
                ) {
                    if (isLoading) {
                        CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp))
                    } else {
                        Text("SIGN IN", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    }
                }

                Divider(color = Slate700, modifier = Modifier.padding(vertical = 8.dp))

                // Organization Register Link
                TextButton(onClick = onNavigateToSignup) {
                    Text("Register New Organization", color = Slate400, fontSize = 13.sp)
                }

                // Server Config Settings Button
                IconButton(onClick = { showUrlDialog = true }) {
                    Icon(Icons.Default.Settings, contentDescription = "Server URL", tint = Slate700)
                }
            }
        }
    }

    // Dialog to configure server API URL (for local network Wi-Fi testing)
    if (showUrlDialog) {
        AlertDialog(
            onDismissRequest = { showUrlDialog = false },
            title = { Text("Server API URL") },
            text = {
                OutlinedTextField(
                    value = customUrl,
                    onValueChange = { customUrl = it },
                    label = { Text("Base API URL") },
                    singleLine = true
                )
            },
            confirmButton = {
                Button(onClick = {
                    RetrofitClient.setBaseUrl(customUrl)
                    showUrlDialog = false
                }) {
                    Text("Save")
                }
            },
            dismissButton = {
                TextButton(onClick = { showUrlDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }
}
