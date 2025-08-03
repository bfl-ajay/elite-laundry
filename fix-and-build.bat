@echo off
echo Comprehensive Fix and Build Script...

echo.
echo Step 1: Cleaning up any Docker artifacts...
docker system prune -f 2>nul
docker builder prune -f 2>nul

echo.
echo Step 2: Testing frontend build locally...
cd frontend

echo Installing dependencies...
call npm install

echo Running build test...
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Local build failed. Check the errors above.
    echo Press any key to exit...
    pause >nul
    cd ..
    exit /b 1
)

echo ✅ Local build successful!
cd ..

echo.
echo Step 3: Building Docker image...
docker-compose build --no-cache frontend

if %ERRORLEVEL% EQU 0 (
    echo.
    echo 🎉 SUCCESS! Frontend Docker image built successfully.
    echo.
    echo You can now run:
    echo   docker-compose up frontend
    echo.
    echo Or start the full stack:
    echo   docker-compose up
) else (
    echo.
    echo ❌ Docker build failed. 
    echo.
    echo Alternative: Run in development mode
    echo   run-dev.bat
)

echo.
echo Press any key to continue...
pause >nul