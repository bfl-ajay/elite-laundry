@echo off
echo Starting Development Environment...

echo.
echo Starting Backend...
start "Backend" cmd /k "cd backend && npm run dev"

echo.
echo Waiting for backend to start...
timeout /t 5 >nul

echo.
echo Starting Frontend...
start "Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Development servers starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Press any key to close this window...
pause >nul