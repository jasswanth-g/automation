import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { VideoController } from './controllers/video.controller.js';
import { SongController } from './controllers/song.controller.js';
import { MovieController } from './controllers/movie.controller.js';
import { QuoteController } from './controllers/quote.controller.js';
import { useExpressServer, useContainer } from 'routing-controllers';
import { Container } from 'typedi';
import { ResponseInterceptor } from './interceptors/response.interceptor.js';
import { ErrorMiddleware } from './middlewares/error.middleware.js';

const port = process.env.PORT || 3000;

// Tell routing-controllers to use typedi Container
useContainer(Container);

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
        url: process.env.APP_URL || process.env.RENDER_EXTERNAL_URL || `http://localhost:${port}`,
        description: 'Server',
      },
    ],
  },
  apis: ['./src/controllers/*.ts', './src/dtos/*.ts'], 
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

const app = express();

// Apply CORS before other middlewares
app.use(cors());

// Serve static files from 'public' folder
app.use(express.static('public'));

// Increase payload limit for Base64 songs
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Initialize routing-controllers on the existing app
useExpressServer(app, {
  controllers: [VideoController, SongController, MovieController, QuoteController],
  interceptors: [ResponseInterceptor],
  middlewares: [ErrorMiddleware],
  defaultErrorHandler: false, // Use our own ErrorMiddleware
  validation: true, // Enable class-validator
  development: true,
  classTransformer: true,
  // Disable default body parser as we've already added it with limits
  // routing-controllers doesn't have a direct "disable" for body parser in useExpressServer 
  // but it will skip if already parsed or we can just let it be if it's compatible.
});

// Add Swagger documentation at /api/docs
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const baseUrl = process.env.APP_URL || `http://localhost:${port}`;
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
  console.log(`Swagger docs available at ${baseUrl}/api/docs`);
});