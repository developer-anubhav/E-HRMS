package com.vektra.data.repository

import com.google.gson.Gson
import com.vektra.core.common.Result
import com.vektra.core.network.NetworkError
import com.vektra.core.security.TokenManager
import com.vektra.data.mapper.AuthMapper
import com.vektra.data.remote.api.AuthApi
import com.vektra.data.remote.dto.LoginRequestDto
import com.vektra.data.remote.dto.LoginResponseDto
import com.vektra.domain.model.AuthSession
import com.vektra.domain.model.AuthState
import com.vektra.domain.repository.AuthRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import java.io.IOException
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Data implementation of AuthRepository.
 * Manages API login calls, network error parsing, and secure DataStore session persistence.
 */
@Singleton
class AuthRepositoryImpl @Inject constructor(
    private val authApi: AuthApi,
    private val tokenManager: TokenManager,
    private val gson: Gson
) : AuthRepository {

    override suspend fun login(email: String, password: String): Result<AuthSession> {
        return try {
            val response = authApi.login(LoginRequestDto(email = email, password = password))
            if (response.isSuccessful) {
                val body = response.body()
                if (body != null && !body.token.isNullOrBlank()) {
                    val session = AuthMapper.mapToDomainSession(body, email)
                    if (session != null) {
                        tokenManager.saveSession(
                            token = session.accessToken,
                            role = session.user.role,
                            name = session.user.name,
                            companyId = session.user.companyId,
                            email = session.user.email
                        )
                        Result.Success(session)
                    } else {
                        Result.Error(NetworkError.Unknown("Invalid login payload from server"))
                    }
                } else {
                    val errorMessage = body?.message ?: "Login failed"
                    Result.Error(NetworkError.BadRequest, Exception(errorMessage))
                }
            } else {
                val errorMsg = parseErrorMessage(response.errorBody()?.string())
                when (response.code()) {
                    400 -> Result.Error(NetworkError.BadRequest, Exception(errorMsg ?: "Invalid credentials"))
                    401 -> Result.Error(NetworkError.Unauthorized, Exception(errorMsg ?: "Unauthorized"))
                    else -> Result.Error(NetworkError.ServerError(response.code(), errorMsg), Exception(errorMsg ?: "Server error"))
                }
            }
        } catch (e: IOException) {
            Result.Error(NetworkError.NoInternet, e)
        } catch (e: Exception) {
            Result.Error(NetworkError.Unknown(e.message), e)
        }
    }

    override suspend fun logout(): Result<Unit> {
        return try {
            tokenManager.clearSession()
            Result.Success(Unit)
        } catch (e: Exception) {
            Result.Error(NetworkError.Unknown(e.message), e)
        }
    }

    override fun getAuthState(): Flow<AuthState> {
        return tokenManager.authSession.map { session ->
            if (session != null) {
                AuthState.Authenticated(session)
            } else {
                AuthState.Unauthenticated
            }
        }
    }

    override suspend fun restoreSession(): AuthSession? {
        return tokenManager.getAuthSessionDirect()
    }

    private fun parseErrorMessage(jsonString: String?): String? {
        if (jsonString.isNullOrBlank()) return null
        return try {
            val errorDto = gson.fromJson(jsonString, LoginResponseDto::class.java)
            errorDto.message
        } catch (e: Exception) {
            null
        }
    }
}
