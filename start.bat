@echo off
title ProctorAI Security Server
echo ========================================================
echo               PROCTOR AI PROCTORING SYSTEM               
echo ========================================================
echo.
echo Starting ProctorAI server on http://localhost:3000 ...
echo.

cd /d "%~dp0"

:: Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies first, please wait...
    call npm install
)

:: Open browser after 2 seconds
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:3000"

:: Start the node server
npm start

pause
