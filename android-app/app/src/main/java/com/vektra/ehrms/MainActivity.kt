package com.vektra.ehrms

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.vektra.ehrms.data.local.TokenManager
import com.vektra.ehrms.ui.components.VektraBottomNav
import com.vektra.ehrms.ui.components.VektraTopBar
import com.vektra.ehrms.ui.navigation.VektraNavGraph
import com.vektra.ehrms.ui.theme.DarkBackground
import com.vektra.ehrms.ui.theme.VektraProTheme

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            VektraProTheme {
                val navController = rememberNavController()
                val navBackStackEntry by navController.currentBackStackEntryAsState()
                val currentRoute = navBackStackEntry?.destination?.route

                val isAuthRoute = currentRoute in listOf("login", "signup", "forgot_password", null)

                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = DarkBackground
                ) {
                    Scaffold(
                        topBar = {
                            if (!isAuthRoute) {
                                VektraTopBar(
                                    onLogoutClick = {
                                        TokenManager.clear()
                                        navController.navigate("login") {
                                            popUpTo(0) { inclusive = true }
                                        }
                                    }
                                )
                            }
                        },
                        bottomBar = {
                            if (!isAuthRoute) {
                                VektraBottomNav(navController = navController)
                            }
                        }
                    ) { innerPadding ->
                        Surface(
                            modifier = Modifier.padding(innerPadding),
                            color = DarkBackground
                        ) {
                            VektraNavGraph(
                                navController = navController,
                                onLogout = {
                                    TokenManager.clear()
                                    navController.navigate("login") {
                                        popUpTo(0) { inclusive = true }
                                    }
                                }
                            )
                        }
                    }
                }
            }
        }
    }
}
