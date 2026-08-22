package com.vektra.ehrms.data.local

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

object TokenManager {
    private const val PREF_NAME = "vektra_secure_prefs"
    private const val KEY_TOKEN = "jwt_token"
    private const val KEY_ROLE = "user_role"
    private const val KEY_USER_NAME = "user_name"
    private const val KEY_COMPANY_ID = "company_id"
    private const val KEY_USER_EMAIL = "user_email"

    private lateinit var prefs: SharedPreferences

    fun init(context: Context) {
        prefs = try {
            val masterKey = MasterKey.Builder(context)
                .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                .build()

            EncryptedSharedPreferences.create(
                context,
                PREF_NAME,
                masterKey,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            )
        } catch (e: Exception) {
            context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
        }
    }

    fun saveAuthData(token: String, role: String, name: String, companyId: String?, email: String? = null) {
        prefs.edit().apply {
            putString(KEY_TOKEN, token)
            putString(KEY_ROLE, role.uppercase())
            putString(KEY_USER_NAME, name)
            putString(KEY_COMPANY_ID, companyId)
            putString(KEY_USER_EMAIL, email)
            apply()
        }
    }

    fun getToken(): String? = prefs.getString(KEY_TOKEN, null)
    fun getRole(): String = prefs.getString(KEY_ROLE, "EMPLOYEE") ?: "EMPLOYEE"
    fun getUserName(): String = prefs.getString(KEY_USER_NAME, "User") ?: "User"
    fun getCompanyId(): String? = prefs.getString(KEY_COMPANY_ID, null)
    fun getUserEmail(): String? = prefs.getString(KEY_USER_EMAIL, null)

    fun isLoggedIn(): Boolean = !getToken().isNullOrEmpty()

    fun clear() {
        prefs.edit().clear().apply()
    }
}
