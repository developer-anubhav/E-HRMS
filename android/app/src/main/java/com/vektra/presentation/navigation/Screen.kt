package com.vektra.presentation.navigation

/**
 * Sealed class representing application navigation destinations.
 */
sealed class Screen(val route: String) {
    data object Splash : Screen("splash")
    data object Home : Screen("home")
}
