@echo off
title 🌐 NGROK GLOBAL TUNNEL
echo ===================================================
echo   ESTABLISHING GLOBAL ENTERPRISE TUNNEL
echo ===================================================
echo.
echo Domain: https://evident-skier-nylon.ngrok-free.dev
echo Target: http://127.0.0.1:5173
echo.

:start
ngrok http --url=evident-skier-nylon.ngrok-free.dev 127.0.0.1:5173
echo [!] Tunnel dropped. Reconnecting in 5 seconds...
timeout /t 5
goto start
