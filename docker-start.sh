#!/bin/bash

# Elite Laundry Docker Startup Script

echo "🚀 Elite Laundry Management System"
echo "=================================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Please create a .env file with your configuration."
    echo "You can copy from .env.production.template and modify as needed."
    exit 1
fi

# Function to start development environment
start_dev() {
    echo "🔧 Starting Development Environment..."
    echo "This will start:"
    echo "  - PostgreSQL database on port 5432"
    echo "  - Backend API on port 3001 (with hot reload)"
    echo "  - Frontend on port 3000 (with hot reload)"
    echo ""
    
    docker-compose -f docker-compose.dev.yml up -d
    
    echo ""
    echo "✅ Development environment started!"
    echo "📱 Frontend: http://localhost:3000"
    echo "🔧 Backend API: http://localhost:3001"
    echo "🗄️  Database: localhost:5432"
    echo ""
    echo "To view logs: docker-compose -f docker-compose.dev.yml logs -f"
    echo "To stop: docker-compose -f docker-compose.dev.yml down"
}

# Function to start production environment
start_prod() {
    echo "🚀 Starting Production Environment..."
    echo "This will start:"
    echo "  - PostgreSQL database (internal)"
    echo "  - Backend API (internal)"
    echo "  - Frontend with Nginx on port 80"
    echo "  - Nginx reverse proxy on port 443 (if SSL configured)"
    echo ""
    
    docker-compose up -d
    
    echo ""
    echo "✅ Production environment started!"
    echo "🌐 Application: http://localhost"
    echo "🔒 HTTPS: https://localhost (if SSL configured)"
    echo ""
    echo "To view logs: docker-compose logs -f"
    echo "To stop: docker-compose down"
}

# Function to show status
show_status() {
    echo "📊 Docker Container Status:"
    echo "=========================="
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
}

# Function to show logs
show_logs() {
    echo "📋 Recent Logs:"
    echo "==============="
    if [ -f docker-compose.dev.yml ] && docker-compose -f docker-compose.dev.yml ps -q > /dev/null 2>&1; then
        docker-compose -f docker-compose.dev.yml logs --tail=50
    else
        docker-compose logs --tail=50
    fi
}

# Function to stop all
stop_all() {
    echo "🛑 Stopping all containers..."
    docker-compose down 2>/dev/null
    docker-compose -f docker-compose.dev.yml down 2>/dev/null
    echo "✅ All containers stopped!"
}

# Main menu
case "$1" in
    "dev"|"development")
        start_dev
        ;;
    "prod"|"production")
        start_prod
        ;;
    "status")
        show_status
        ;;
    "logs")
        show_logs
        ;;
    "stop")
        stop_all
        ;;
    *)
        echo "Usage: $0 {dev|prod|status|logs|stop}"
        echo ""
        echo "Commands:"
        echo "  dev        Start development environment with hot reload"
        echo "  prod       Start production environment"
        echo "  status     Show container status"
        echo "  logs       Show recent logs"
        echo "  stop       Stop all containers"
        echo ""
        echo "Examples:"
        echo "  $0 dev     # Start development environment"
        echo "  $0 prod    # Start production environment"
        echo "  $0 status  # Check container status"
        echo "  $0 stop    # Stop all containers"
        exit 1
        ;;
esac