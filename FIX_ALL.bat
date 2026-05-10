@echo off
echo ===================================================
echo   ISO SIMULATOR - EMERGENCY REPAIR & START
echo ===================================================

echo [1/3] KILLING STUCK PROCESSES...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173') do taskkill /f /pid %%a >nul 2>&1
taskkill /f /im ngrok.exe >nul 2>&1
PowerShell -Command "Get-NetTCPConnection -LocalPort 8583 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }" >nul 2>&1
echo Done.

echo [2/3] STARTING SIMULATOR ENGINE...
start "ISO Backend" cmd /k "node server/index.js"
start "ISO Frontend" cmd /k "npm run dev"
echo Waiting for boot...
timeout /t 5 >nul

echo [3/3] ACTIVATING NGROK TUNNEL...
echo Launching: evident-skier-nylon.ngrok-free.dev
start "Ngrok Tunnel" cmd /k "ngrok http 5173 --domain=evident-skier-nylon.ngrok-free.dev"

echo.
echo 🚀 ALL SYSTEMS RESTORED!
echo Check your browser at: https://evident-skier-nylon.ngrok-free.dev
echo.
pause
