@echo off
title 🛠️ ISO 8583 SIMULATOR - STRICT REPAIR
echo ---------------------------------------
echo 1. Aggressive Process Purge...
powershell -Command "Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | Where-Object { $_.OwningProcess -ne 0 } | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }"
powershell -Command "Get-NetTCPConnection -LocalPort 8583 -ErrorAction SilentlyContinue | Where-Object { $_.OwningProcess -ne 0 } | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }"
taskkill /f /im node.exe /t >nul 2>&1
taskkill /f /im ngrok.exe /t >nul 2>&1

echo 2. Clearing DB Locks...
del "server\bins.sqlite-journal" >nul 2>&1
del "server\transactions.db-journal" >nul 2>&1

echo 3. Validating Node Environment...
node -v
if %errorlevel% neq 0 (echo ❌ NODE NOT FOUND! && pause && exit)

echo 4. Starting Full Stack...
start "ISO-BACKEND" /d server node index.js
start "ISO-FRONTEND" npm run dev

echo ⏳ Waiting for boot...
timeout /t 5 >nul

echo 🌐 5. Opening ngrok Tunnel...
start "ISO-NGROK" ngrok http 5173 --domain=evident-skier-nylon.ngrok-free.dev

echo ✅ ALL SYSTEMS COMMANDED TO START.
echo Check the 3 new windows for status.
pause
