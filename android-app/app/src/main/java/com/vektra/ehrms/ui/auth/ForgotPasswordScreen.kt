package com.vektra.ehrms.ui.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Email
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vektra.ehrms.data.repository.VektraRepository
import com.vektra.ehrms.ui.theme.*
import kotlinx.coroutines.launch

@Composable
fun ForgotPasswordScreen(
    onNavigateBack: () -> Unit
) {
    val repository = remember { VektraRepository() }
    val scope = rememberCoroutineScope()

    var email by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    var message by remember { mutableStateOf<String?>(null) }

    Box(
        modifier = Modifier.fillMaxSize().background(Navy900),
        contentAlignment = Alignment.Center
    ) {
        Card(
            modifier = Modifier.fillMaxWidth(0.9f).padding(16.dp),
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = Navy800)
        ) {
            Column(
                modifier = Modifier.fillMaxWidth().padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Text("Reset Password", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = Emerald500)
                Text("Enter your account email to receive a password reset link.", fontSize = 12.sp, color = Slate400)

                message?.let { msg ->
                    Surface(color = Emerald500.copy(alpha = 0.2f), shape = RoundedCornerShape(12.dp), modifier = Modifier.fillMaxWidth()) {
                        Text(text = msg, color = Emerald500, modifier = Modifier.padding(12.dp), fontSize = 12.sp)
                    }
                }

                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("Email Address", color = Slate400) },
                    leadingIcon = { Icon(Icons.Default.Email, contentDescription = null, tint = Emerald500) },
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(focusedTextColor = Color.White, unfocusedTextColor = Color.White, focusedBorderColor = Emerald500, unfocusedBorderColor = Slate700)
                )

                Button(
                    onClick = {
                        if (email.isBlank()) return@Button
                        isLoading = true
                        scope.launch {
                            val res = repository.forgotPassword(email.trim())
                            isLoading = false
                            message = res.getOrNull()?.message ?: "If the email exists, a password reset link has been sent."
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
                        Text("SEND RESET LINK", fontWeight = FontWeight.Bold)
                    }
                }

                TextButton(onClick = onNavigateBack) {
                    Text("Back to Sign In", color = Slate400, fontSize = 13.sp)
                }
            }
        }
    }
}
