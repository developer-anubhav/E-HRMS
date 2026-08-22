package com.vektra.ehrms.ui.employee

import android.Manifest
import android.content.pm.PackageManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Camera
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import com.google.android.gms.location.LocationServices
import com.vektra.ehrms.data.models.FaceCheckInResponse
import com.vektra.ehrms.data.repository.VektraRepository
import com.vektra.ehrms.ui.components.CameraXPreview
import com.vektra.ehrms.ui.theme.*
import kotlinx.coroutines.launch

@Composable
fun MobileCheckInScreen(
    onNavigateBack: () -> Unit
) {
    val context = LocalContext.current
    val repository = remember { VektraRepository() }
    val scope = rememberCoroutineScope()

    var hasCameraPermission by remember {
        mutableStateOf(ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED)
    }
    var hasLocationPermission by remember {
        mutableStateOf(ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED)
    }

    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { perms ->
        hasCameraPermission = perms[Manifest.permission.CAMERA] ?: false
        hasLocationPermission = perms[Manifest.permission.ACCESS_FINE_LOCATION] ?: false
    }

    LaunchedEffect(Unit) {
        if (!hasCameraPermission || !hasLocationPermission) {
            permissionLauncher.launch(
                arrayOf(Manifest.permission.CAMERA, Manifest.permission.ACCESS_FINE_LOCATION)
            )
        }
    }

    var isCapturing by remember { mutableStateOf(false) }
    var isProcessing by remember { mutableStateOf(false) }
    var resultResponse by remember { mutableStateOf<FaceCheckInResponse?>(null) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    val fusedLocationClient = remember { LocationServices.getFusedLocationProviderClient(context) }

    fun captureAndVerify(currentBase64: String, prevBase64: String?) {
        isProcessing = true
        errorMessage = null

        try {
            fusedLocationClient.lastLocation.addOnSuccessListener { loc ->
                val lat = loc?.latitude ?: 12.9716 // Default fallback coords if mock
                val lng = loc?.longitude ?: 77.5946
                val acc = loc?.accuracy?.toDouble() ?: 10.0

                scope.launch {
                    val result = repository.mobileCheckIn(
                        image = currentBase64,
                        prevImage = prevBase64,
                        lat = lat,
                        lng = lng,
                        accuracy = acc
                    )
                    isProcessing = false
                    isCapturing = false

                    result.onSuccess { res ->
                        resultResponse = res
                    }.onFailure { err ->
                        errorMessage = err.message ?: "Verification failed."
                    }
                }
            }.addOnFailureListener { e ->
                isProcessing = false
                isCapturing = false
                errorMessage = "GPS Error: Could not get device coordinates (${e.message})"
            }
        } catch (e: SecurityException) {
            isProcessing = false
            isCapturing = false
            errorMessage = "Location permission required for geofence validation"
        }
    }

    Scaffold(
        containerColor = Navy900
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = "Mobile Selfie Check-In",
                fontSize = 22.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
            Text(
                text = "GPS Geofence + AI Dual-Frame Liveness Verification",
                fontSize = 12.sp,
                color = Slate400
            )

            if (!hasCameraPermission || !hasLocationPermission) {
                Card(
                    modifier = Modifier.fillMaxWidth().padding(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Navy800)
                ) {
                    Column(modifier = Modifier.padding(20.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(Icons.Default.Warning, contentDescription = null, tint = Amber500, modifier = Modifier.size(48.dp))
                        Spacer(modifier = Modifier.height(8.dp))
                        Text("Camera & Location permissions required", color = Color.White, fontWeight = FontWeight.Bold)
                        Spacer(modifier = Modifier.height(12.dp))
                        Button(onClick = { permissionLauncher.launch(arrayOf(Manifest.permission.CAMERA, Manifest.permission.ACCESS_FINE_LOCATION)) }) {
                            Text("Grant Permissions")
                        }
                    }
                }
            } else {
                // Camera Viewport
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(380.dp)
                        .background(Navy800, shape = RoundedCornerShape(24.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    CameraXPreview(
                        modifier = Modifier.fillMaxSize(),
                        useFrontCamera = true,
                        isCapturing = isCapturing,
                        onFrameCaptured = { currB64, prevB64 ->
                            captureAndVerify(currB64, prevB64)
                        }
                    )

                    if (isProcessing) {
                        Surface(
                            color = Color.Black.copy(alpha = 0.7f),
                            modifier = Modifier.fillMaxSize()
                        ) {
                            Column(
                                modifier = Modifier.fillMaxSize(),
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.Center
                            ) {
                                CircularProgressIndicator(color = Emerald500)
                                Spacer(modifier = Modifier.height(12.dp))
                                Text("Evaluating FaceNet & Geofence...", color = Color.White, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }

                // Error Banner
                errorMessage?.let { err ->
                    Surface(
                        color = Rose600.copy(alpha = 0.2f),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Warning, contentDescription = null, tint = Rose600)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(text = err, color = Rose600, fontSize = 12.sp)
                        }
                    }
                }

                // Result Card
                resultResponse?.let { res ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = Navy800)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Emerald500)
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(res.message, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                            }

                            Spacer(modifier = Modifier.height(8.dp))
                            res.geofence?.let { geo ->
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Default.LocationOn, contentDescription = null, tint = Sky500, modifier = Modifier.size(16.dp))
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text("Geofence: ${geo.geofenceStatus} (${geo.distanceMeters}m from office)", color = Slate400, fontSize = 12.sp)
                                }
                            }
                            res.verification?.let { ver ->
                                Text("Match Confidence: ${ver.confidence}%", color = Emerald500, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }

                // Capture Trigger Button
                Button(
                    onClick = {
                        resultResponse = null
                        errorMessage = null
                        isCapturing = true
                    },
                    modifier = Modifier.fillMaxWidth().height(52.dp),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Emerald500),
                    enabled = !isProcessing && !isCapturing
                ) {
                    Icon(Icons.Default.Camera, contentDescription = null, tint = Color.White)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(if (isCapturing || isProcessing) "VERIFYING..." else "CAPTURE SELFIE & CHECK-IN", fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}
