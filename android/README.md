# Vektra Android Application

## Architecture Overview — Phase 2

The Vektra Android application follows **Clean Architecture** paired with **MVVM (Model-View-ViewModel)** and **Hilt Dependency Injection**.

```text
Presentation Layer (Jetpack Compose + StateFlow ViewModels)
       ↓
Domain Layer (Use Cases + Entities + Repository Interfaces)
       ↓
Data Layer (Repository Implementations + Retrofit API + DataStore Manager)
```

### Key Technical Stack
* **Language**: Kotlin (JDK 17 target)
* **UI**: Jetpack Compose + Material 3
* **Navigation**: Navigation Compose (`VektraNavGraph`)
* **Dependency Injection**: Dagger Hilt (`@HiltAndroidApp`, `@AndroidEntryPoint`, `@HiltViewModel`)
* **Networking**: Retrofit 2 + OkHttp 4 + Gson Converter
* **Local Storage / Persistence**: Jetpack DataStore Preferences (`DataStoreManager`)
* **Asynchronous / Reactive**: Kotlin Coroutines + Flow (`StateFlow`, `viewModelScope`)

---

## Target Package Structure

```text
com.vektra/
├── core/
│   ├── common/         # Result, UiState, Constants
│   ├── di/             # AppModule, NetworkModule, StorageModule, RepositoryModule
│   ├── network/        # ApiConstants, NetworkError
│   ├── storage/        # DataStoreManager
│   └── utils/          # Core utilities & Resource wrapper
├── data/
│   ├── local/          # Local database / DataStore persistence implementations
│   ├── mapper/         # DTO to Domain mappers
│   ├── remote/         # ApiService & DTOs
│   └── repository/     # Data implementations of domain repositories
├── domain/
│   ├── model/          # Pure Domain models (AppConfig, etc.)
│   ├── repository/     # Abstract repository contracts
│   └── usecase/        # Independent domain UseCases
├── presentation/
│   ├── components/     # Reusable Compose widgets (LoadingView, ErrorView)
│   ├── home/           # HomeScreen, HomeViewModel, HomeUiState, SplashScreen
│   ├── navigation/     # Screen routes & VektraNavGraph
│   └── theme/          # Color, Theme, Type
├── MainActivity.kt     # Single Activity entry point (@AndroidEntryPoint)
└── VektraApplication.kt# Application entry point (@HiltAndroidApp)
```

---

## Build & Test Instructions

### Gradle Build
To assemble a debug APK:

```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
.\gradlew.bat assembleDebug
```

### Unit Tests
To execute unit tests:

```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
.\gradlew.bat test
```
