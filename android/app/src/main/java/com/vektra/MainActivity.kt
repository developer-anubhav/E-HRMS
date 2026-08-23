package com.vektra

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import com.vektra.presentation.home.HomeScreen
import com.vektra.presentation.home.SplashScreen
import com.vektra.presentation.navigation.Screen
import com.vektra.presentation.theme.VektraTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            VektraTheme {
                VektraApp()
            }
        }
    }
}

@Composable
fun VektraApp() {
    var currentScreen by remember { mutableStateOf<Screen>(Screen.Splash) }

    when (currentScreen) {
        is Screen.Splash -> {
            SplashScreen(
                onSplashFinished = {
                    currentScreen = Screen.Home
                }
            )
        }
        is Screen.Home -> {
            HomeScreen()
        }
    }
}
