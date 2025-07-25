# Project Structure

## Root Level Organization

```
├── backend/           # Node.js Express API server
├── frontend/          # React application
├── deployment/        # Nginx configuration files
├── .kiro/            # Kiro IDE configuration and specs
├── docker-compose.prod.yml  # Production deployment
├── Dockerfile.backend       # Backend container build
├── Dockerfile.frontend      # Frontend container build
└── DEPLOYMENT.md           # Deployment documentation
```

## Backend Structure (`/backend`)

```
backend/
├── config/           # Configuration modules
│   ├── cors.js      # CORS settings
│   ├── database.js  # PostgreSQL connection
│   └── security.js  # Security middleware configs
├── middleware/       # Express middleware
│   ├── auth.js      # Authentication middleware
│   ├── errorHandler.js  # Error handling
│   ├── upload.js    # File upload handling
│   └── validation.js    # Request validation
├── models/          # Database models
│   ├── User.js      # User model
│   ├── Order.js     # Order model
│   └── Expense.js   # Expense model
├── routes/          # API route handlers
│   ├── auth.js      # Authentication routes
│   ├── orders.js    # Order management
│   ├── expenses.js  # Expense tracking
│   └── analytics.js # Business analytics
├── scripts/         # Utility scripts
│   ├── init-db.js   # Database initialization
│   ├── create-test-user.js  # Test user creation
│   └── production-deploy.js # Production deployment
├── tests/           # Test files (mirrors src structure)
├── uploads/         # File upload storage
└── server.js        # Main application entry point
```

## Frontend Structure (`/frontend`)

```
frontend/
├── src/
│   ├── components/   # React components
│   │   ├── auth/     # Authentication components
│   │   ├── common/   # Shared/reusable components
│   │   ├── dashboard/    # Dashboard components
│   │   ├── orders/   # Order management components
│   │   └── expenses/ # Expense tracking components
│   ├── contexts/     # React contexts
│   │   ├── AuthContext.jsx    # Authentication state
│   │   └── ErrorContext.jsx   # Error handling state
│   ├── hooks/        # Custom React hooks
│   ├── pages/        # Page-level components
│   │   ├── LoginPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── OrdersPage.jsx
│   │   └── ExpensesPage.jsx
│   ├── services/     # API service modules
│   │   ├── api.js    # Base API configuration
│   │   ├── authService.js     # Authentication API
│   │   └── analyticsService.js # Analytics API
│   ├── styles/       # CSS files
│   ├── utils/        # Utility functions
│   └── App.js        # Main application component
├── cypress/          # E2E test files
└── public/           # Static assets
```

## Key Architectural Patterns

### Backend Patterns
- **MVC Architecture**: Models, routes (controllers), middleware
- **Middleware Chain**: Authentication, validation, error handling
- **Configuration Modules**: Centralized config in `/config`
- **Script Organization**: Utility scripts in `/scripts`

### Frontend Patterns
- **Component Hierarchy**: Pages > Feature Components > Common Components
- **Context Providers**: Centralized state management
- **Custom Hooks**: Reusable logic extraction
- **Service Layer**: API calls abstracted into services
- **Lazy Loading**: Code splitting for performance

### File Naming Conventions
- **Backend**: camelCase for files, PascalCase for models
- **Frontend**: PascalCase for components, camelCase for utilities
- **Tests**: Mirror source structure with `.test.js` suffix
- **Configuration**: kebab-case for config files

### Import/Export Patterns
- **Backend**: CommonJS (`require`/`module.exports`)
- **Frontend**: ES6 modules (`import`/`export`)
- **Index Files**: Barrel exports in component directories