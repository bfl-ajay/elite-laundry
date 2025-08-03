@echo off
echo Fixing Docker Desktop Issues...

echo.
echo Step 1: Stopping Docker Desktop...
taskkill /f /im "Docker Desktop.exe" 2>nul
timeout /t 3 >nul

echo.
echo Step 2: Cleaning Docker cache...
docker system prune -f 2>nul
docker builder prune -f 2>nul

echo.
echo Step 3: Restarting Docker Desktop...
start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"

echo.
echo Step 4: Waiting for Docker to start...
timeout /t 30 >nul

echo.
echo Step 5: Testing Docker connection...
docker version

echo.
echo Docker fix complete! Try building again:
echo docker-compose build --no-cache frontend

pause