@echo off
cd /d "%~dp0"
title AegisDome Server
echo ===============================================
echo Starting AegisDome Threat Intelligence Platform
echo ===============================================
echo.

echo Checking for Node.js...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed! 
    echo Please download and install it from https://nodejs.org/
    pause
    exit /b
)

echo Installing required packages (this may take a moment on first run)...
call npm install

echo.
echo Starting the AegisDome Server...
echo The app will automatically open in your default browser.
echo Do NOT close this window while using the app.
echo.

start http://localhost:3000
call npm run dev

pause
