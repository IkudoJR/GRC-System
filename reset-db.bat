@echo off
SETLOCAL
cd /d %~dp0
echo ==========================================
echo    GRC Platform -- Database Reset
echo ==========================================
echo.
echo  WARNING: This will WIPE all existing data
echo  and restore the database to its default
echo  seeded state.
echo.
set /p CONFIRM="  Are you sure? (Y/N): "
if /i NOT "%CONFIRM%"=="Y" (
    echo.
    echo  Reset cancelled. No changes were made.
    echo.
    pause
    exit /b 0
)

echo.
echo ==========================================
echo  Step 1: Stopping running server...
echo ==========================================
taskkill /F /IM node.exe /T >nul 2>&1
IF %ERRORLEVEL% EQU 0 (
    echo  [OK] Server stopped.
) ELSE (
    echo  [--] No server was running.
)
timeout /t 2 /nobreak >nul

echo.
echo ==========================================
echo  Step 2: Starting Database Engine...
echo ==========================================
start /min "Prisma DB Engine" cmd /c "npx prisma dev -d"
echo  [OK] Database engine starting...
echo  Waiting for database to be ready...
timeout /t 10 /nobreak >nul

echo.
echo ==========================================
echo  Step 3: Running database seed...
echo ==========================================
echo.
node prisma/seed.js
IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo  [ERROR] Seed failed! Check the output above.
    echo.
    pause
    exit /b 1
)

echo.
echo ==========================================
echo  Database reset complete!
echo ==========================================
echo.
echo  Default credentials:
echo    Admin  --  admin / admin
echo    User   --  analyst / analyst
echo.
pause
