@echo off
REM Elite Laundry Docker Startup Script for Windows

echo 🚀 Elite Laundry Management System
echo ==================================
echo.

REM Check if .env file exists
if not exist .env (
    echo ❌ .env file not found!
    echo Please create a .env file with your configuration.
    echo You can copy from .env.production.template and modify as needed.
    exit /b 1
)

if "%1"=="dev" goto start_dev
if "%1"=="development" goto start_dev
if "%1"=="prod" goto start_prod
if "%1"=="production" goto start_prod
if "%1"=="status" goto show_status
if "%1"=="logs" goto show_logs
if "%1"=="stop" goto stop_all
goto show_help

:start_dev
echo 🔧 Starting Development Environment...
echo This will start:
echo   - PostgreSQL database on port 5432
echo   - Backend API on port 3001 (with hot reload)
echo   - Frontend on port 3000 (with hot reload)
echo.

docker-compose -f docker-compose.dev.yml up -d

echo.
echo ✅ Development environment started!
echo 📱 Frontend: http://localhost:3000
echo 🔧 Backend API: http://localhost:3001
echo 🗄️  Database: localhost:5432
echo.
echo To view logs: docker-compose -f docker-compose.dev.yml logs -f
echo To stop: docker-compose -f docker-compose.dev.yml down
goto end

:start_prod
echo 🚀 Starting Production Environment...
echo This will start:
echo   - PostgreSQL database (internal)
echo   - Backend API (internal)
echo   - Frontend with Nginx on port 80
echo   - Nginx reverse proxy on port 443 (if SSL configured)
echo.

docker-compose up -d

echo.
echo ✅ Production environment started!
echo 🌐 Application: http://localhost
echo 🔒 HTTPS: https://localhost (if SSL configured)
echo.
echo To view logs: docker-compose logs -f
echo To stop: docker-compose down
goto end

:show_status
echo 📊 Docker Container Status:
echo ==========================
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
goto end

:show_logs
echo 📋 Recent Logs:
echo ===============
docker-compose logs --tail=50 2>nul || docker-compose -f docker-compose.dev.yml logs --tail=50
goto end

:stop_all
echo 🛑 Stopping all containers...
docker-compose down 2>nul
docker-compose -f docker-compose.dev.yml down 2>nul
echo ✅ All containers stopped!
goto end

:show_help
echo Usage: %0 {dev^|prod^|status^|logs^|stop}
echo.
echo Commands:
echo   dev        Start development environment with hot reload
echo   prod       Start production environment
echo   status     Show container status
echo   logs       Show recent logs
echo   stop       Stop all containers
echo.
echo Examples:
echo   %0 dev     # Start development environment
echo   %0 prod    # Start production environment
echo   %0 status  # Check container status
echo   %0 stop    # Stop all containers

:end