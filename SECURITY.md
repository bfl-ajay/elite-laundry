# Security Configuration Guide

This document outlines the comprehensive security measures implemented in the Laundry Management System for production deployment.

## Security Features Overview

### 1. Authentication & Authorization
- **Basic Authentication** with Base64 encoded credentials
- **Password Hashing** using bcrypt with configurable rounds (default: 12)
- **Session Management** with secure cookies and HTTP-only flags
- **Session Security** with SameSite protection and secure flags in production

### 2. Rate Limiting
- **General Rate Limiting**: 100 requests per 15 minutes per IP
- **Authentication Rate Limiting**: 5 login attempts per 15 minutes per IP
- **Configurable Windows**: Adjustable time windows and request limits
- **IP-based Tracking**: Supports X-Forwarded-For headers for proxy environments

### 3. Security Headers (Helmet.js)
- **Content Security Policy (CSP)**: Prevents XSS attacks
- **HTTP Strict Transport Security (HSTS)**: Forces HTTPS connections
- **X-Frame-Options**: Prevents clickjacking attacks
- **X-Content-Type-Options**: Prevents MIME type sniffing
- **X-XSS-Protection**: Enables browser XSS filtering
- **Referrer Policy**: Controls referrer information
- **Cross-Origin Policies**: Configures CORS and cross-origin isolation

### 4. HTTPS Enforcement
- **Automatic HTTPS Redirect**: Redirects HTTP to HTTPS in production
- **Multiple Header Support**: Checks various proxy headers
- **Configurable Enforcement**: Can be enabled/disabled via environment variables

### 5. CORS Configuration
- **Origin Validation**: Strict origin checking in production
- **Credential Support**: Configurable credential handling
- **Method Restrictions**: Configurable allowed HTTP methods
- **Header Controls**: Configurable allowed and exposed headers

### 6. Database Security
- **SSL Connections**: Enforced SSL connections in production
- **Connection Pooling**: Limited connections with timeouts
- **Parameterized Queries**: Protection against SQL injection
- **Connection Timeouts**: Configurable connection and idle timeouts

### 7. File Upload Security
- **File Type Restrictions**: Configurable allowed MIME types
- **File Size Limits**: Configurable maximum file sizes
- **Upload Directory Security**: Secure directory permissions
- **File Validation**: Server-side file type validation

## Environment Variables

### Required Security Variables

```env
# Session Security
SESSION_SECRET=your-super-secure-session-secret-here  # Min 32 characters
SESSION_NAME=laundry_session
SESSION_MAX_AGE=86400000  # 24 hours

# Database Security
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=true
DB_CONNECTION_TIMEOUT=10000
DB_IDLE_TIMEOUT=30000
DB_MAX_CONNECTIONS=20

# HTTPS Configuration
HTTPS_ENABLED=true
FORCE_HTTPS=true
TRUST_PROXY=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS=false

# Security Headers
HELMET_ENABLED=true
CSP_ENABLED=true
HSTS_ENABLED=true
HSTS_MAX_AGE=31536000  # 1 year

# CORS Security
CORS_ORIGIN=https://your-frontend-domain.com
CORS_CREDENTIALS=true
CORS_METHODS=GET,HEAD,PUT,PATCH,POST,DELETE
CORS_ALLOWED_HEADERS=Content-Type,Authorization,X-Requested-With

# File Upload Security
MAX_FILE_SIZE=5242880  # 5MB
ALLOWED_FILE_TYPES=image/jpeg,image/png,application/pdf

# Password Security
BCRYPT_ROUNDS=12
```

## Nginx Security Configuration

### Security Headers
```nginx
# Security Headers
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://your-backend-domain.com;" always;
```

### Rate Limiting
```nginx
# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=auth:10m rate=1r/s;

# Apply rate limiting
location /api/ {
    limit_req zone=api burst=20 nodelay;
    # ... proxy configuration
}

location /api/auth/ {
    limit_req zone=auth burst=5 nodelay;
    # ... proxy configuration
}
```

### SSL Configuration
```nginx
# SSL Security Settings
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
ssl_stapling on;
ssl_stapling_verify on;
```

## Docker Security

### Container Security
- **Non-root User**: Containers run as non-root user (1000:1000)
- **Read-only Filesystem**: Containers use read-only root filesystem
- **No New Privileges**: Security option prevents privilege escalation
- **Resource Limits**: CPU and memory limits configured
- **Temporary Filesystems**: Writable directories mounted as tmpfs

### Network Security
- **Internal Networks**: Services communicate via internal Docker networks
- **Port Binding**: Services bound to localhost only (127.0.0.1)
- **Network Isolation**: Custom bridge network with subnet isolation

## Security Validation

### Automated Validation Script
Run the production configuration validator:
```bash
npm run validate:production
```

This script checks:
- Environment variable configuration
- Security settings validation
- Database connection security
- File system permissions
- Nginx configuration review

### Manual Security Checklist

#### Pre-Deployment Security Review
- [ ] Strong session secret generated (min 32 characters)
- [ ] Database password is secure (min 12 characters)
- [ ] HTTPS is enforced in production
- [ ] CORS origins are restricted to production domains
- [ ] Rate limiting is properly configured
- [ ] File upload restrictions are in place
- [ ] Security headers are enabled
- [ ] Database SSL is enabled
- [ ] Environment variables are secured

#### Infrastructure Security
- [ ] Firewall rules configured
- [ ] SSL certificates are valid and up-to-date
- [ ] Database access is restricted
- [ ] Server access is limited to authorized personnel
- [ ] Log monitoring is configured
- [ ] Backup procedures are secure

#### Application Security
- [ ] All dependencies are up-to-date
- [ ] Security audit passes without high-severity issues
- [ ] Input validation is comprehensive
- [ ] Error messages don't leak sensitive information
- [ ] File uploads are properly validated
- [ ] Session management is secure

## Security Monitoring

### Logging
- **Access Logs**: All HTTP requests logged with security information
- **Error Logs**: Application errors logged for security analysis
- **Rate Limit Logs**: Rate limit violations logged with IP and user agent
- **Authentication Logs**: Failed authentication attempts logged

### Health Checks
- **Application Health**: `/health` endpoint provides comprehensive status
- **Database Health**: Connection and SSL status monitoring
- **File System Health**: Upload directory accessibility checks

### Security Alerts
Monitor logs for:
- Multiple failed authentication attempts
- Rate limit violations
- CORS policy violations
- File upload security violations
- Database connection failures
- SSL/TLS handshake failures

## Incident Response

### Security Incident Procedures
1. **Immediate Response**
   - Identify and isolate affected systems
   - Review logs for attack patterns
   - Block malicious IP addresses if necessary

2. **Investigation**
   - Analyze security logs
   - Check for data breaches
   - Assess system integrity

3. **Recovery**
   - Apply security patches
   - Update security configurations
   - Restore from clean backups if necessary

4. **Prevention**
   - Update security measures
   - Improve monitoring
   - Document lessons learned

## Security Updates

### Regular Maintenance
- **Dependency Updates**: Regular npm audit and updates
- **Security Patches**: Apply OS and application security patches
- **Certificate Renewal**: Monitor and renew SSL certificates
- **Configuration Review**: Regular security configuration reviews

### Security Scanning
- **Vulnerability Scanning**: Regular automated security scans
- **Penetration Testing**: Periodic professional security assessments
- **Code Review**: Security-focused code reviews for changes

## Compliance Considerations

### Data Protection
- **Data Encryption**: Sensitive data encrypted in transit and at rest
- **Access Controls**: Role-based access to sensitive operations
- **Audit Trails**: Comprehensive logging for compliance requirements
- **Data Retention**: Configurable data retention policies

### Industry Standards
- **OWASP Top 10**: Protection against common web vulnerabilities
- **Security Headers**: Implementation of recommended security headers
- **Secure Coding**: Following secure coding practices
- **Regular Audits**: Periodic security audits and assessments

## Contact Information

For security-related issues or questions:
- **Security Team**: [security@yourcompany.com]
- **Emergency Contact**: [emergency@yourcompany.com]
- **Bug Bounty**: [bugbounty@yourcompany.com]

---

**Last Updated**: $(date)
**Version**: 1.0.0
**Review Schedule**: Quarterly