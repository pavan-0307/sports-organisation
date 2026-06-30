// src/server.ts
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import pino from 'pino';
import swaggerUi from 'swagger-ui-express';
import { z } from 'zod';
import dotenv from 'dotenv';
import authRouter from './routes/auth.routes.js';
import userRouter from './routes/user.routes.js';
import inventoryRouter from './routes/inventory.routes.js';
import rentalRouter from './routes/rental.routes.js';

dotenv.config();

// Environment validation using Zod
const envSchema = z.object({
  PORT: z.string().default('4000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const env = envSchema.parse(process.env);

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
app.use(cookieParser());
app.use(compression());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  })
);
app.use(express.json());

// Pino logger
const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
});
app.use((req, res, next) => {
  logger.info({ method: req.method, url: req.url, ip: req.ip }, 'request');
  next();
});

// Auth Routes
app.use('/v1/auth', authRouter);
app.use('/v1/users', userRouter);
app.use('/v1', inventoryRouter);
app.use('/v1', rentalRouter);

// Health endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Swagger UI
const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'SportNest API',
    version: '1.0.0',
  },
  paths: {
    '/health': {
      get: {
        summary: 'Health check',
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string' },
                    uptime: { type: 'number' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Start server
app.listen(parseInt(env.PORT, 10), () => {
  logger.info(`API server listening on port ${env.PORT}`);
});
