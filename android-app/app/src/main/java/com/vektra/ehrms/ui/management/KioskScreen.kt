package com.vektra.ehrms.ui.management

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vektra.ehrms.data.models.FaceCheckInResponse
import com.vektra.ehrms.data.repository.VektraRepository
import com.vektra.ehrms.ui.components.CameraXPreview
import com.vektra.ehrms.ui.theme.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@Composable
fun KioskScreen() {
    val repository = remember { VektraRepository() }
    val scope = rememberCoroutineScope()

    var isCapturing by remember { mutableStateOf(false) }
    var isProcessing by remember { mutableStateOf(false) }
    var matchResult by remember { mutableStateOf<FaceCheckInResponse?>(null) }
    var statusText by remember { mutableStateOf("Position your face in front of the camera terminal") }

    fun processKioskFrame(currB64: String, prevB64: String?) {
        isProcessing = true
        statusText = "Analyzing facial biometrics..."

        scope.launch {
            val res = repository.verifyAndCheckInFace(currB64, prevB64)
            isProcessing = false
            isCapturing = false

            res.onSuccess { data ->
                matchResult = data
                statusText = data.message

                // Reset overlay after 4 seconds for next person in line
                delay(4000)
                matchResult = null
                statusText = "Position your face in front of the camera terminal"
            }.onFailure { err ->
                statusText = err.message ?: "Face not recognized. Please face camera directly."
                delay(3000)
                statusText = "Position your face in front of the camera terminal"
            }
        }
    }

    Column(
        modifier = Modifier.fillMaxSize().background(Navy900).padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text("Touchless Biometric Kiosk", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = Color.White)
                Text("High-Speed Counter Terminal (1:N Recognition)", fontSize = 12.sp, color = Slate400)
            }

            Surface(color = Emerald500.copy(alpha = 0.2f), shape = RoundedCornerShape(12.dp)) {
                Text("Terminal Active", modifier = Modifier.padding(8.dp), color = Emerald500, fontSize = 11.sp, fontWeight = FontWeight.Bold)
            }
        }

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f)
                .background(Navy800, shape = RoundedCornerShape(24.dp)),
            contentAlignment = Alignment.Center
        ) {
            CameraXPreview(
                modifier = Modifier.fillMaxSize(),
                useFrontCamera = true,
                isCapturing = isCapturing,
                onFrameCaptured = { curr, prev -> processKioskFrame(curr, prev) }
            )

            // Result Match Card Overlay
            matchResult?.let { match ->
                Surface(
                    color = Color.Black.copy(alpha = 0.85f),
                    modifier = Modifier.fillMaxSize()
                ) {
                    Column(
                        modifier = Modifier.fillMaxSize().padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Emerald500, modifier = Modifier.size(64.dp))
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(match.employee?.name ?: "Employee Matched", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = Color.White)
                        Text("${match.employee?.department} • ID: ${match.employee?.employeeId}", fontSize = 14.sp, color = Slate400)
                        Spacer(modifier = Modifier.height(12.dp))
                        Surface(color = Emerald500, shape = RoundedCornerShape(14.dp)) {
                            Text(
                                text = "${match.actionType ?: "CHECK_IN"} SUCCESS (${match.verification?.confidence ?: 98.0}% Match)",
                                modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                                color = Color.White,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }

            if (isProcessing) {
                Surface(color = Color.Black.copy(alpha = 0.6f), modifier = Modifier.fillMaxSize()) {
                    Box(contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = Emerald500)
                    }
                }
            }
        }

        Text(statusText, color = Slate400, fontSize = 13.sp, fontWeight = FontWeight.Medium)

        Button(
            onClick = { isCapturing = true },
            modifier = Modifier.fillMaxWidth().height(52.dp),
            shape = RoundedCornerShape(14.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Emerald500),
            enabled = !isProcessing && !isCapturing && matchResult == null
        ) {
            Icon(Icons.Default.Refresh, contentDescription = null, tint = Color.White)
            Spacer(modifier = Modifier.width(8.dp))
            Text("TRIGGER BIOMETRIC SCAN", fontWeight = FontWeight.Bold)
        }
    }
}
