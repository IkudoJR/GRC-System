@echo off
SETLOCAL
cd /d %~dp0
echo ==========================================
echo    Starting GRC Platform
echo ==========================================
echo.
echo [1/2] Starting Database Engine...
call npx prisma dev -d
echo.
echo [2/2] Starting Application Server...
echo.
echo Application will be available at: http://localhost:3000
echo.
timeout /t 2 /nobreak > nul
npm run dev
pause
