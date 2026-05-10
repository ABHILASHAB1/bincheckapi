@echo off
SETLOCAL EnableDelayedExpansion
TITLE 💳 MADA ENTERPRISE SIMULATOR - DEV MODE
cls

echo ===================================================
echo   MADA E-COMMERCE GATEWAY ^& ISO 8583 SWITCH
echo   Unified Development Console v2.0
echo ===================================================
echo.

echo 🛡️  [1/3] SANITIZING ENVIRONMENT...
:: Kill specific ports to avoid EADDRINUSE
for %%p in (3002 5173 8583 8584) do (
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :%%p ^| findstr LISTENING') do (
        echo [INFO] Cleaning up process %%a on Port %%p...
        taskkill /F /PID %%a >nul 2>&1
    )
)
timeout /t 2 /nobreak >nul
echo ✅ Environment sanitized.
echo.

echo 🚀 [2/3] STARTING BACKEND ENGINE (Port 3002)...
start "SIMULATOR_BACKEND" cmd /k "node server/index.js"
timeout /t 3 /nobreak >nul

echo 🚀 [3/3] STARTING FRONTEND DEV SERVER (Port 5173)...
start "SIMULATOR_FRONTEND" cmd /k "npm run dev"

echo.
echo ===================================================
echo ✅ ALL SYSTEMS GO!
echo  - Frontend: http://localhost:5173
echo  - Backend:  http://localhost:3002
echo ===================================================
echo.
echo 📡 [MONITOR] Press Ctrl+C to stop this window.

:health_check
curl -s http://localhost:3002/health | findstr "ok" >nul
if %errorlevel% equ 0 (
    echo [%TIME%] 🟢 BACKEND: OPTIMAL
) else (
    echo [%TIME%] 🔴 BACKEND: UNREACHABLE
)
timeout /t 30 /nobreak >nul
goto health_check
