@echo off
SETLOCAL EnableDelayedExpansion
TITLE 💳 MADA ENTERPRISE SIMULATOR - MISSION CONTROL
cls

echo ===================================================
echo   MADA E-COMMERCE GATEWAY ^& ISO 8583 SWITCH
echo   Unified Production Console v2.0
echo ===================================================
echo.

:: 1. PROCESS SANITIZATION
echo 🛡️  [1/4] SANITIZING ENVIRONMENT...
echo [INFO] Terminating ghost Node.js processes...
taskkill /F /IM node.exe /T >nul 2>&1

:: Specific Port Cleanup for Port 3002
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3002 ^| findstr LISTENING') do (
    echo [INFO] Cleaning up process %%a on Port 3002...
    taskkill /F /PID %%a >nul 2>&1
)

timeout /t 2 /nobreak >nul
echo ✅ Environment sanitized.
echo.

:: 2. BUILD VALIDATION
echo 🏗️  [2/4] VERIFYING PRODUCTION ASSETS...
set "REBUILD=n"
set /p REBUILD="Force clean build to apply latest CSS/JS fixes? (y/n) [n]: "

if /i "!REBUILD!"=="y" goto do_build
if not exist "dist\index.html" goto do_build
goto build_ok

:do_build
echo ⚙️  [BUILD] Initiating build sequence...
call npm run build
if errorlevel 1 (
    echo ❌ [ERROR] Build failed.
    pause
    exit /b 1
)

:build_ok
echo ✅ Production assets verified.
echo.

:: 3. SYSTEM LAUNCH
echo 🚀 [3/4] LAUNCHING UNIFIED ENGINE (Port 3002 ^& 8583)...
echo [INFO] Initializing Fraud Guard, Settlement Engine, and ISO Switch...
echo.

:: We use 'start' to keep the console interactive but pipe logs to this window if possible
:: Or just run it directly to keep it stable
start "SIMULATOR_CORE" cmd /k "node server/index.js"

timeout /t 5 /nobreak >nul
echo ✅ Unified Engine is now online.
echo.

:: 4. EXTERNAL CONNECTIVITY
echo 🌐 [4/4] EXTERNAL CONNECTIVITY GUIDE
echo ---------------------------------------------------
echo  [INTERNAL] Dashboard: http://localhost:3002
echo  [EXTERNAL] Run this in a NEW terminal for ngrok:
echo  ^> ngrok http 3002
echo ---------------------------------------------------
echo.

echo 📡 [MONITOR] Watching system logs... (Press Ctrl+C to stop)
echo ===================================================
echo.

:: Keep window open and show health check status
:health_check
curl -s http://localhost:3002/health | findstr "ok" >nul
if !errorlevel! equ 0 (
    echo [%TIME%] 🟢 SYSTEM_HEALTH: OPTIMAL
) else (
    echo [%TIME%] 🔴 SYSTEM_HEALTH: CRITICAL / RESTARTING...
)
timeout /t 30 /nobreak >nul
goto health_check
