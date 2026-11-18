import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'SL MultiShop API - Production Multi-Tenant Billing & POS SaaS',
      version: '1.0.0',
      description: 'API documentation for SL MultiShop, developed by SL IT SOLUTIONS. Provides comprehensive endpoints for Multi-Tenant Retail, Wholesale, POS Billing, Inventory, GST compliance, and Super Admin administration.',
      contact: {
        name: 'SL IT SOLUTIONS Support',
        email: 'info@slit-solutions.com'
      }
    },
    servers: [
      {
        url: '/api/v1',
        description: 'Current API Gateway'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        },
        tenantHeader: {
          type: 'apiKey',
          in: 'header',
          name: 'x-tenant-id',
          description: 'Shop ID for Super Admin cross-tenant inspection'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.ts', './dist/routes/*.js']
};

export const swaggerSpec = swaggerJsdoc(options);
