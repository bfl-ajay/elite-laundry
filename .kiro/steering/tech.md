# Technology Stack

## Architecture

Full-stack web application with separate frontend and backend services, containerized for production deployment.

## Backend Stack

- **Runtime**: Node.js 18
- **Framework**: Express.js 4.18
- **Database**: PostgreSQL 15
- **Authentication**: Express sessions with bcrypt password hashing
- **Security**: Helmet, CORS, rate limiting, compression
- **File Uploads**: Multer middleware
- **Testing**: Jest with Supertest
- **Process Management**: PM2 (production)

## Frontend Stack

- **Framework**: React 18 with React Router DOM
- **Build Tool**: Vite 4
- **Styling**: Tailwind CSS 3
- **Icons**: Heroicons React
- **HTTP Client**: Axios
- **Testing**: Jest with React Testing Library
- **E2E Testing**: Cypress

## Development Tools

- **Package Manager**: npm
- **Development Server**: Nodemon (backend), Vite dev server (frontend)
- **Code Quality**: ESLint, Prettier (implied from structure)
- **Environment**: dotenv for configuration

## Deployment & Infrastructure

- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Docker Compose
- **Reverse Proxy**: Nginx
- **SSL**: Nginx with SSL termination
- **Database**: PostgreSQL with persistent volumes
- **File Storage**: Local filesystem with Docker volumes

## Common Commands

### Backend Development
```bash
cd backend
npm run dev          # Start development server with nodemon
npm test            # Run Jest tests
npm run init-db     # Initialize database schema
npm start           # Production start
```

### Frontend Development
```bash
cd frontend
npm run dev         # Start Vite development server
npm run build       # Production build
npm test           # Run Jest tests
npm run test:e2e   # Run Cypress E2E tests
```

### Production Deployment
```bash
# Setup and deploy
docker-compose -f docker-compose.prod.yml up -d
npm run prod:setup  # Both frontend and backend
npm run prod:deploy # Both frontend and backend
```

### Database Operations
```bash
cd backend
npm run init-db              # Initialize database
node scripts/create-test-user.js  # Create test user
```

## Environment Configuration

- Development: `.env` files in both frontend and backend
- Production: `.env.production` files with Docker environment variables
- Template: `.env.production.template` for reference