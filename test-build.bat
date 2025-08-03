@echo off
echo Testing Frontend Build...

echo.
echo Step 1: Installing dependencies...
cd frontend
call npm install

echo.
echo Step 2: Running build test...
call npm run build

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Build successful! Ready for Docker.
    echo You can now run: docker-compose build --no-cache frontend
) else (
    echo.
    echo ❌ Build failed. Check the errors above.
)

echo.
echo Press any key to continue...
pause >nul

cd ..