package com.vektra.ehrms.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ExitToApp
import androidx.compose.material.icons.filled.Business
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vektra.ehrms.data.local.TokenManager
import com.vektra.ehrms.ui.theme.Emerald500
import com.vektra.ehrms.ui.theme.Navy900

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun VektraTopBar(
    title: String = "Vektra Pro",
    onLogoutClick: () -> Unit
) {
    val role = TokenManager.getRole()
    val name = TokenManager.getUserName()

    TopAppBar(
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = Navy900,
            titleContentColor = Color.White
        ),
        title = {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    text = title,
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp,
                    color = Color.White
                )
                Surface(
                    color = Emerald500.copy(alpha = 0.2f),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text(
                        text = role,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                        color = Emerald500,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        },
        actions = {
            IconButton(onClick = onLogoutClick) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.ExitToApp,
                    contentDescription = "Logout",
                    tint = Color.White
                )
            }
        }
    )
}
