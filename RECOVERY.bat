@echo off
echo 🛠️ [RECOVERY] Initiating ISO 8583 Simulator Emergency Restart...

echo 🔪 [1/4] Killing hanging processes (Node, Ngrok)...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im ngrok.exe >nul 2>&1

echo 🧹 [2/4] Clearing temporary locks...
if exist "server/bins.sqlite-journal" del "server/bins.sqlite-journal"

echo 🚀 [3/4] Starting API Backend and Frontend...
start cmd /k "npm run backend"
start cmd /k "npm run dev"

echo 🌐 [4/4] Opening ngrok Tunnel...
echo Wait 5 seconds for local server to boot...
timeout /t 5 >nul
start cmd /k "ngrok http 5173 --domain=evident-skier-nylon.ngrok-free.dev"

echo ✅ [COMPLETE] Check the new terminal windows for logs.
echo Refresh your browser once the ngrok terminal shows "Online".
pause
