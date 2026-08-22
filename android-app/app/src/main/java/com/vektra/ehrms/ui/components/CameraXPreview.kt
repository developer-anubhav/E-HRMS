package com.vektra.ehrms.ui.components

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Base64
import android.util.Log
import android.view.ViewGroup
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import java.io.ByteArrayOutputStream
import java.util.concurrent.Executors

@Composable
fun CameraXPreview(
    modifier: Modifier = Modifier,
    useFrontCamera: Boolean = true,
    onFrameCaptured: (currentBase64: String, prevBase64: String?) -> Unit,
    isCapturing: Boolean = false
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val cameraExecutor = remember { Executors.newSingleThreadExecutor() }

    var imageCapture: ImageCapture? by remember { mutableStateOf(null) }
    var previousBase64Frame: String? by remember { mutableStateOf(null) }

    Box(modifier = modifier) {
        AndroidView(
            modifier = Modifier.fillMaxSize(),
            factory = { ctx ->
                val previewView = PreviewView(ctx).apply {
                    layoutParams = ViewGroup.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT
                    )
                    scaleType = PreviewView.ScaleType.FILL_CENTER
                }

                val cameraProviderFuture = ProcessCameraProvider.getInstance(ctx)
                cameraProviderFuture.addListener({
                    val cameraProvider = cameraProviderFuture.get()

                    val preview = Preview.Builder().build().also {
                        it.setSurfaceProvider(previewView.surfaceProvider)
                    }

                    val capture = ImageCapture.Builder()
                        .setCaptureMode(ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY)
                        .setJpegQuality(85)
                        .build()

                    imageCapture = capture

                    val cameraSelector = if (useFrontCamera) {
                        CameraSelector.DEFAULT_FRONT_CAMERA
                    } else {
                        CameraSelector.DEFAULT_BACK_CAMERA
                    }

                    try {
                        cameraProvider.unbindAll()
                        cameraProvider.bindToLifecycle(
                            lifecycleOwner,
                            cameraSelector,
                            preview,
                            capture
                        )
                    } catch (e: Exception) {
                        Log.e("CameraXPreview", "Camera binding failed", e)
                    }
                }, ContextCompat.getMainExecutor(ctx))

                previewView
            }
        )

        LaunchedEffect(isCapturing) {
            if (isCapturing) {
                imageCapture?.let { capture ->
                    // Capture Frame 1 (Previous frame)
                    capture.takePicture(
                        cameraExecutor,
                        object : ImageCapture.OnImageCapturedCallback() {
                            override fun onCaptureSuccess(imageProxy: ImageProxy) {
                                val b64_1 = imageProxyToBase64(imageProxy)
                                imageProxy.close()

                                // Small delay (~250ms) for eye-blink liveness motion sequence
                                Thread.sleep(250)

                                // Capture Frame 2 (Current frame)
                                capture.takePicture(
                                    cameraExecutor,
                                    object : ImageCapture.OnImageCapturedCallback() {
                                        override fun onCaptureSuccess(imageProxy2: ImageProxy) {
                                            val b64_2 = imageProxyToBase64(imageProxy2)
                                            imageProxy2.close()

                                            onFrameCaptured(b64_2, b64_1)
                                        }

                                        override fun onError(exception: ImageCaptureException) {
                                            Log.e("CameraXPreview", "Frame 2 capture error", exception)
                                        }
                                    }
                                )
                            }

                            override fun onError(exception: ImageCaptureException) {
                                Log.e("CameraXPreview", "Frame 1 capture error", exception)
                            }
                        }
                    )
                }
            }
        }
    }
}

private fun imageProxyToBase64(imageProxy: ImageProxy): String {
    val buffer = imageProxy.planes[0].buffer
    val bytes = ByteArray(buffer.remaining())
    buffer.get(bytes)

    val bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
    val outputStream = ByteArrayOutputStream()
    
    // Scale down image to optimal size (~640px) to conserve network payload
    val maxDim = 640
    val scaledBitmap = if (bitmap.width > maxDim || bitmap.height > maxDim) {
        val ratio = Math.min(maxDim.toFloat() / bitmap.width, maxDim.toFloat() / bitmap.height)
        Bitmap.createScaledBitmap(
            bitmap,
            (bitmap.width * ratio).toInt(),
            (bitmap.height * ratio).toInt(),
            true
        )
    } else bitmap

    scaledBitmap.compress(Bitmap.CompressFormat.JPEG, 85, outputStream)
    val byteArray = outputStream.toByteArray()
    return "data:image/jpeg;base64," + Base64.encodeToString(byteArray, Base64.NO_WRAP)
}
