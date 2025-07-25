const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Laundry Management System API',
      version: '1.0.0',
      description: 'A comprehensive API for managing laundry business operations including orders, expenses, and analytics',
      contact: {
        name: 'API Support',
        email: 'support@laundrymanagement.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      },
      {
        url: 'https://api.laundrymanagement.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        basicAuth: {
          type: 'http',
          scheme: 'basic',
          description: 'Basic HTTP authentication with username and password'
        },
        sessionAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'connect.sid',
          description: 'Session-based authentication using cookies'
        }
      },
      schemas: {
        User: {
          type: 'object',
          required: ['username'],
          properties: {
            id: {
              type: 'integer',
              description: 'Unique user identifier',
              example: 1
            },
            username: {
              type: 'string',
              description: 'Username for authentication',
              example: 'admin'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'User creation timestamp',
              example: '2024-01-15T10:30:00Z'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'User last update timestamp',
              example: '2024-01-15T10:30:00Z'
            }
          }
        },
        Order: {
          type: 'object',
          required: ['customerName', 'contactNumber', 'orderDate', 'services'],
          properties: {
            id: {
              type: 'integer',
              description: 'Unique order identifier',
              example: 1
            },
            orderNumber: {
              type: 'string',
              description: 'Auto-generated order number',
              example: 'ORD1234567890'
            },
            customerName: {
              type: 'string',
              description: 'Customer full name',
              example: 'John Doe'
            },
            contactNumber: {
              type: 'string',
              description: 'Customer contact number',
              example: '+1234567890'
            },
            orderDate: {
              type: 'string',
              format: 'date',
              description: 'Order placement date',
              example: '2024-01-15'
            },
            status: {
              type: 'string',
              enum: ['Pending', 'In Progress', 'Completed'],
              description: 'Current order status',
              example: 'Pending'
            },
            totalAmount: {
              type: 'number',
              format: 'decimal',
              description: 'Total order amount',
              example: 95.50
            },
            paymentStatus: {
              type: 'string',
              enum: ['Unpaid', 'Paid'],
              description: 'Payment status',
              example: 'Unpaid'
            },
            services: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/OrderService'
              },
              description: 'List of services in the order'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Order creation timestamp',
              example: '2024-01-15T10:30:00Z'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Order last update timestamp',
              example: '2024-01-15T10:30:00Z'
            }
          }
        },
        OrderService: {
          type: 'object',
          required: ['serviceType', 'clothType', 'quantity', 'unitCost'],
          properties: {
            id: {
              type: 'integer',
              description: 'Unique service identifier',
              example: 1
            },
            serviceType: {
              type: 'string',
              enum: ['washing', 'ironing', 'dry_cleaning', 'stain_removal'],
              description: 'Type of service',
              example: 'washing'
            },
            clothType: {
              type: 'string',
              enum: ['saari', 'normal', 'delicate', 'heavy'],
              description: 'Type of clothing',
              example: 'normal'
            },
            quantity: {
              type: 'integer',
              minimum: 1,
              description: 'Quantity of items',
              example: 5
            },
            unitCost: {
              type: 'number',
              format: 'decimal',
              minimum: 0,
              description: 'Cost per unit',
              example: 10.00
            },
            totalCost: {
              type: 'number',
              format: 'decimal',
              description: 'Total cost (quantity * unitCost)',
              example: 50.00,
              readOnly: true
            }
          }
        },
        Expense: {
          type: 'object',
          required: ['expenseType', 'amount', 'expenseDate'],
          properties: {
            id: {
              type: 'integer',
              description: 'Unique expense identifier',
              example: 1
            },
            expenseId: {
              type: 'string',
              description: 'Auto-generated expense ID',
              example: 'EXP1234567890'
            },
            expenseType: {
              type: 'string',
              description: 'Type of expense',
              example: 'Utilities'
            },
            amount: {
              type: 'number',
              format: 'decimal',
              minimum: 0,
              description: 'Expense amount',
              example: 150.00
            },
            expenseDate: {
              type: 'string',
              format: 'date',
              description: 'Date of expense',
              example: '2024-01-15'
            },
            billAttachment: {
              type: 'string',
              description: 'Path to uploaded bill attachment',
              example: 'uploads/bill_1234567890.pdf'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Expense creation timestamp',
              example: '2024-01-15T10:30:00Z'
            }
          }
        },
        BusinessMetrics: {
          type: 'object',
          properties: {
            totalOrders: {
              type: 'integer',
              description: 'Total number of orders',
              example: 150
            },
            completedOrders: {
              type: 'integer',
              description: 'Number of completed orders',
              example: 120
            },
            pendingOrders: {
              type: 'integer',
              description: 'Number of pending orders',
              example: 30
            },
            totalRevenue: {
              type: 'number',
              format: 'decimal',
              description: 'Total revenue generated',
              example: 15000.00
            },
            averageOrderValue: {
              type: 'number',
              format: 'decimal',
              description: 'Average value per order',
              example: 125.50
            }
          }
        },
        ExpenseMetrics: {
          type: 'object',
          properties: {
            totalExpenses: {
              type: 'integer',
              description: 'Total number of expenses',
              example: 45
            },
            totalAmount: {
              type: 'number',
              format: 'decimal',
              description: 'Total expense amount',
              example: 5000.00
            },
            averageExpense: {
              type: 'number',
              format: 'decimal',
              description: 'Average expense amount',
              example: 111.11
            },
            expensesByType: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  expenseType: {
                    type: 'string',
                    example: 'Utilities'
                  },
                  count: {
                    type: 'integer',
                    example: 12
                  },
                  totalAmount: {
                    type: 'number',
                    format: 'decimal',
                    example: 1800.00
                  }
                }
              }
            }
          }
        },
        Bill: {
          type: 'object',
          properties: {
            billNumber: {
              type: 'string',
              description: 'Auto-generated bill number',
              example: 'BILL1234567890'
            },
            orderNumber: {
              type: 'string',
              description: 'Associated order number',
              example: 'ORD1234567890'
            },
            customerName: {
              type: 'string',
              description: 'Customer name',
              example: 'John Doe'
            },
            contactNumber: {
              type: 'string',
              description: 'Customer contact',
              example: '+1234567890'
            },
            orderDate: {
              type: 'string',
              format: 'date',
              description: 'Order date',
              example: '2024-01-15'
            },
            services: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/OrderService'
              }
            },
            totalAmount: {
              type: 'number',
              format: 'decimal',
              description: 'Total bill amount',
              example: 95.50
            },
            paymentStatus: {
              type: 'string',
              enum: ['Unpaid', 'Paid'],
              description: 'Payment status',
              example: 'Unpaid'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  description: 'Error message',
                  example: 'Invalid request data'
                },
                code: {
                  type: 'string',
                  description: 'Error code',
                  example: 'VALIDATION_ERROR'
                },
                details: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      field: {
                        type: 'string',
                        example: 'customerName'
                      },
                      message: {
                        type: 'string',
                        example: 'Customer name is required'
                      }
                    }
                  }
                }
              }
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              description: 'Success message',
              example: 'Operation completed successfully'
            },
            data: {
              type: 'object',
              description: 'Response data'
            }
          }
        }
      }
    },
    security: [
      {
        basicAuth: []
      },
      {
        sessionAuth: []
      }
    ]
  },
  apis: [
    './routes/*.js',
    './middleware/*.js',
    './models/*.js'
  ]
};

const specs = swaggerJsdoc(options);

module.exports = {
  specs,
  swaggerUi,
  serve: swaggerUi.serve,
  setup: swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Laundry Management API Documentation'
  })
};