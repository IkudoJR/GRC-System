@echo off
SETLOCAL
echo ==========================================
echo    Stopping GRC Platform
echo ==========================================
echo.

echo [1/2] Stopping Application Server (node)...
taskkill /F /IM node.exe /T >nul 2>&1
IF %ERRORLEVEL% EQU 0 (
    echo        [OK] Node process terminated.
) ELSE (
    echo        [--] No Node process was running.
)

echo.
echo [2/2] Stopping Database Engine (prisma dev)...
taskkill /F /IM "prisma.exe" /T >nul 2>&1
IF %ERRORLEVEL% EQU 0 (
    echo        [OK] Prisma process terminated.
) ELSE (
    echo        [--] No Prisma process was running.
)

echo.
echo ==========================================
echo    GRC Platform stopped successfully.
echo ==========================================
echo.
pause
