@echo off
echo 🛠️ ISO 8583 SIMULATOR - DEEP REPAIR TOOL
echo ---------------------------------------
echo 1. Stopping existing processes...
powershell -Command "Stop-Process -Id (Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue).OwningProcess -Force" 2>nul
powershell -Command "Stop-Process -Id (Get-NetTCPConnection -LocalPort 8583 -ErrorAction SilentlyContinue).OwningProcess -Force" 2>nul
powershell -Command "Stop-Process -Name ngrok -Force -ErrorAction SilentlyContinue" 2>nul

echo 2. Validating dependencies...
call npm install

echo 3. Starting Backend with FULL LOGGING...
echo [STARTUP %DATE% %TIME%] > backend_log.txt
node server/index.js >> backend_log.txt 2>&1
echo ❌ BACKEND CRASHED. Check backend_log.txt for details.
pause
