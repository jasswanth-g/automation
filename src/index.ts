import 'reflect-metadata';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { VideoController } from './controllers/video.controller.js';
import { createExpressServer } from 'routing-controllers';

const port: number = 3000;

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Automatiom API',
      version: '1.0.0',
      description: 'API for video automation tasks',
    },
    servers: [
      {
        url: `http://localhost:${port}/api`,
        description: 'Development server with /api prefix',
      },
    ],
  },
  apis: ['./src/controllers/*.ts'], 
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Create Express app with routing-controllers
const app = createExpressServer({
  controllers: [VideoController],
  // routePrefix: '/api',
  development: true
});

// Add Swagger documentation at /api/docs
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.listen(port, () => {
  console.log(`Example app listening on port http://localhost:${port}`);
  console.log(`Swagger docs available at http://localhost:${port}/api/docs`);
});