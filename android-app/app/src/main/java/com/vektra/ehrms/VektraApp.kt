package com.vektra.ehrms

import android.app.Application
import com.vektra.ehrms.data.local.TokenManager

class VektraApp : Application() {

    override fun onCreate() {
        super.onCreate()
        // Initialize TokenManager Singleton
        TokenManager.init(this)
    }
}
