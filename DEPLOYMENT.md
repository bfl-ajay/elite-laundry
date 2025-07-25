# Production Deployment Guide

This guide covers the production deployment configuration for the Laundry Management System.

## Prerequisites

- Node.js 16+ and npm
- PostgreSQL 12+ database
- SSL certificates (for HTTPS)
- Domain name configured

## Deployment Options

### Option 1: Automated Production Deployment (Recommended)

#### Backend Deployment

1. Run the automated production setup script:
   ```bash
   cd backend
   npm run prod:setup
   ```

   This script will:
   - Set up environment configuration from template
   - Generate secure session secrets and database passwords
   - Create uploads directory with secure permissions
   - Install production dependencies
   - Run security audit
   - Test database connection
   - Create production checklist

2. Validate production configuration:
   ```bash
   npm run validate:production
   ```

   This validation script checks:
   - Environment variable configuration
   - Security settings validation
   - Database connection security
   - File system permissions
   - Nginx configuration review

3. Start the backend server:
   ```bash
   npm start
   ```

#### Frontend Deployment

1. Run the automated frontend deployment script:
   ```bash
   cd frontend
   npm run prod:deploy
   ```

   This script will:
   - Configure production environment
   - Install dependencies
   - Run security audit
   - Build optimized production bundle
   - Generate deployment info

2. Deploy the `dist/` folder to your hosting provider

### Option 2: Docker Deployment

1. Copy the production environment template:
   ```bash
   cp .env.production.template .env
   ```

2. Update the `.env` file with your production values

3. Deploy with Docker Compose:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

### Option 3: Manual Deployment

#### Backend Manual Setup

1. Copy the production environment template:
   ```bash
   cp backend/.env.production backend/.env
   ```

2. Update the following required variables in `backend/.env`:
   ```env
   # Database Configuration
   DB_HOST=your-production-db-host
   DB_NAME=laundry_management_prod
   DB_USER=your-production-db-user
   DB_PASSWORD=your-production-db-password
   
   # Security
   SESSION_SECRET=your-super-secure-session-secret-here
   
   # URLs
   FRONTEND_URL=https://your-frontend-domain.com
   CORS_ORIGIN=https://your-frontend-domain.com
   ```

3. Database Setup:
   ```sql
   CREATE DATABASE laundry_management_prod;
   CREATE USER your_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE laundry_management_prod TO your_user;
   ```

4. Run the deployment setup script:
   ```bash
   cd backend
   node scripts/deploy-setup.js
   ```

5. Install Dependencies and Start:
   ```bash
   cd backend
   npm run prod:setup
   npm start
   ```

#### Frontend Manual Setup

1. Copy the production environment template:
   ```bash
   cp frontend/.env.production frontend/.env
   ```

2. Update the API URL in `frontend/.env`:
   ```env
   VITE_API_URL=https://your-backend-domain.com/api
   ```

3. Build and Deploy:
   ```bash
   cd frontend
   npm run prod:setup
   npm run build
   ```

   The built files will be in the `frontend/dist` directory.

## Security Features Implemented

### Backend Security

- **Rate Limiting**: 100 requests per 15 minutes (general), 5 requests per 15 minutes (auth)
- **Enhanced Rate Limiting**: IP-based tracking with proxy support and detailed logging
- **Helmet.js**: Comprehensive security headers including CSP, HSTS, XSS protection, and frame options
- **CORS**: Strict origin validation in production with configurable methods and headers
- **Session Security**: Secure cookies, HTTP-only, SameSite protection with configurable expiration
- **HTTPS Enforcement**: Multi-header HTTPS detection and automatic redirect
- **Input Validation**: Express-validator for all inputs with comprehensive error handling
- **SQL Injection Protection**: Parameterized queries with connection pooling security
- **File Upload Security**: MIME type validation, size restrictions, and secure directory permissions
- **Security Logging**: Comprehensive logging of security events and rate limit violations

### Database Security

- **SSL Connections**: Enforced SSL/TLS connections in production with certificate validation
- **Connection Pooling**: Limited connections with configurable timeouts and idle management
- **Password Hashing**: bcrypt with configurable rounds (default: 12 for production)
- **Connection Security**: SSL certificate validation and secure connection parameters

### Frontend Security

- **Environment Variables**: Secure configuration management with production-specific settings
- **Build Optimization**: Code splitting, minification, and secure asset handling
- **Asset Security**: Proper CSP headers support with nonce-based script execution
- **HTTPS Enforcement**: Production builds configured for HTTPS-only operation

### Infrastructure Security

- **Docker Security**: Non-root containers, read-only filesystems, resource limits
- **Nginx Security**: Rate limiting, security headers, SSL/TLS configuration
- **Network Security**: Internal Docker networks with subnet isolation
- **File System Security**: Secure permissions and access controls

## Environment Variables Reference

### Backend (.env)

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DB_HOST` | Database host | localhost | Yes |
| `DB_PORT` | Database port | 5432 | No |
| `DB_NAME` | Database name | laundry_management | Yes |
| `DB_USER` | Database user | hackathon | Yes |
| `DB_PASSWORD` | Database password | password | Yes |
| `DB_SSL` | Enable SSL for database | false | No |
| `SESSION_SECRET` | Session encryption key | - | Yes |
| `PORT` | Server port | 3001 | No |
| `NODE_ENV` | Environment | development | No |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:3000 | Yes |
| `TRUST_PROXY` | Trust proxy headers | false | No |
| `RATE_LIMIT_MAX_REQUESTS` | Rate limit max requests | 100 | No |
| `HELMET_ENABLED` | Enable security headers | true | No |
| `COMPRESSION_ENABLED` | Enable gzip compression | true | No |
| `FORCE_HTTPS` | Force HTTPS redirect | false | No |

### Frontend (.env)

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_API_URL` | Backend API URL | http://localhost:3001/api | Yes |
| `VITE_ENV` | Environment | development | No |

## Health Checks

The backend provides a comprehensive health check endpoint at `/health`:

```bash
curl https://your-backend-domain.com/health
```

Response includes:
- Application status
- Database connectivity
- File system access
- Memory usage
- Uptime information

## Monitoring and Logging

### Production Logging

- **Access Logs**: Morgan middleware with combined format
- **Error Logs**: Only errors logged in production
- **Security Events**: Rate limiting and authentication failures

### Performance Monitoring

- **Compression**: Gzip compression enabled
- **Caching**: Static asset caching headers
- **Connection Pooling**: Database connection optimization

## SSL/TLS Configuration

For HTTPS support, configure your reverse proxy (nginx/Apache) or load balancer to handle SSL termination, or provide certificate paths in environment variables:

```env
HTTPS_ENABLED=true
SSL_CERT_PATH=/path/to/certificate.crt
SSL_KEY_PATH=/path/to/private.key
```

## Nginx Configuration

### Production Nginx Setup

A comprehensive nginx configuration is provided in `deployment/nginx.conf` with:

- SSL/TLS termination
- Security headers (HSTS, CSP, XSS protection)
- Rate limiting (API: 10r/s, Auth: 1r/s)
- Gzip compression
- Static asset caching
- SPA routing support

### Docker Nginx Setup

For containerized deployment, use the provided configurations:
- `deployment/nginx-frontend.conf` - Frontend container nginx config
- `docker-compose.prod.yml` - Complete Docker setup with nginx reverse proxy

### Manual Nginx Configuration

```nginx
# Copy the production configuration
sudo cp deployment/nginx.conf /etc/nginx/sites-available/laundry-management
sudo ln -s /etc/nginx/sites-available/laundry-management /etc/nginx/sites-enabled/

# Update domain names and SSL certificate paths
sudo nano /etc/nginx/sites-enabled/laundry-management

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

## Docker Deployment

### Prerequisites

- Docker and Docker Compose installed
- SSL certificates (for HTTPS)
- Domain names configured

### Quick Start

1. Copy environment template:
   ```bash
   cp .env.production.template .env
   ```

2. Update environment variables in `.env`

3. Place SSL certificates in `ssl/` directory

4. Deploy:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

### Docker Services

- **database**: PostgreSQL 15 with health checks
- **backend**: Node.js API with security configurations
- **frontend**: Nginx serving React build
- **nginx**: Reverse proxy with SSL termination (optional)

### Docker Security Features

- Non-root users in all containers
- Security options (`no-new-privileges`)
- Resource limits
- Health checks
- Network isolation

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check database credentials and network connectivity
   - Verify SSL configuration if enabled
   - Check firewall rules

2. **CORS Errors**
   - Verify `CORS_ORIGIN` matches frontend domain exactly
   - Check protocol (http vs https)

3. **Session Issues**
   - Ensure `SESSION_SECRET` is set and secure
   - Check cookie settings for HTTPS

4. **Rate Limiting**
   - Adjust `RATE_LIMIT_MAX_REQUESTS` if needed
   - Check if behind load balancer (configure `TRUST_PROXY`)

### Logs Location

- Application logs: stdout/stderr (configure log aggregation)
- Access logs: stdout (Morgan middleware)
- Error logs: stderr

## Security Checklist

- [ ] Strong `SESSION_SECRET` generated
- [ ] Database credentials secured
- [ ] HTTPS enforced
- [ ] CORS origins restricted
- [ ] Rate limiting configured
- [ ] File upload restrictions in place
- [ ] Security headers enabled
- [ ] Database SSL enabled
- [ ] Environment variables secured
- [ ] Regular security updates scheduled