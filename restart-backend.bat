@echo off
echo Restarting Backend with CORS Fix...

echo.
echo Step 1: Stopping backend container...
docker-compose stop backend

echo.
echo Step 2: Starting backend with updated CORS configuration...
docker-compose up -d backend

echo.
echo Step 3: Checking backend status...
timeout /t 5 >nul
docker-compose logs --tail=10 backend

echo.
echo ✅ Backend restarted with CORS fix!
echo.
echo The backend should now accept requests from:
echo   - http://localhost:3000
echo   - http://localhost:5000  
echo   - http://localhost:8080
echo   - http://localhost:8081
echo.
echo Press any key to continue...
pause >nul