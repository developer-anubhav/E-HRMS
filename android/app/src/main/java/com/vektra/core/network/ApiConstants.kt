package com.vektra.core.network

/**
 * Centralized API constants configuration.
 */
object ApiConstants {
    const val BASE_URL = "http://10.0.2.2:5000/api/" // Default Android Emulator to Node.js backend URL
    const val CONNECT_TIMEOUT_SECONDS = 30L
    const val READ_TIMEOUT_SECONDS = 30L
    const val WRITE_TIMEOUT_SECONDS = 30L

    object Headers {
        const val AUTHORIZATION = "Authorization"
        const val CONTENT_TYPE = "Content-Type"
        const val APPLICATION_JSON = "application/json"
    }
}
