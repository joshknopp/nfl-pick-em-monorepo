// src/main.ts

import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app/app.module';
import * as dotenv from 'dotenv';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { Request, Response } from 'express'; // Import types for clarity

dotenv.config();

// The main Express app instance
const expressApp = express();
// A flag to ensure we only initialize the NestJS app once
let isAppInitialized = false;

// This is our single, robust entry point for Cloud Functions.
// The --entry-point flag must point to this function.
export const startServer = async (req: Request, res: Response) => {
  // First, we check if the NestJS app is already initialized.
  // This is crucial for warm starts.
  if (!isAppInitialized) {
    // The initialization logic is now inside this handler.
    try {
      const app = await NestFactory.create(
        AppModule,
        new ExpressAdapter(expressApp)
      );

      const corsRegex = new RegExp(process.env.CORS_REGEX ?? '');
      app.enableCors({
        origin: (origin, callback) => {
          if (!origin || corsRegex.test(origin)) {
            callback(null, true);
          } else {
            callback(new Error('Not allowed by CORS'));
          }
        },
        credentials: true,
      });

      const config = new DocumentBuilder()
        .setTitle('NFL Pick Em API')
        .setDescription('API for managing NFL Pick Em game data and logic')
        .setVersion('1.0')
        .addTag('picks')
        .addBearerAuth()
        .build();

      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('api-docs', app, document);

      await app.init();
      isAppInitialized = true; // Set the flag to true after successful init.
      console.log('NestJS app successfully initialized for Cloud Functions.');
    } catch (error) {
      console.error('Failed to initialize NestJS app:', error);
      res.status(500).send('Internal Server Error');
      return;
    }
  }

  // Once the app is initialized, forward the request to the Express app.
  // This is the core of the request handling logic.
  expressApp(req, res);
};

// For local development, we still use the old pattern.
// This block will be ignored by Cloud Functions.
if (require.main === module) {
  startServer(null, null).then(() => {
    // We pass null to startServer just to trigger the initialization.
    // We then listen on the now-initialized expressApp.
    expressApp.listen(3000, () => {
      console.log('API listening on http://localhost:3000');
    });
  });
}
