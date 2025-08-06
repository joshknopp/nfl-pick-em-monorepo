// src/main.ts

import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app/app.module';
import * as dotenv from 'dotenv';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

dotenv.config();

const expressApp = express();

async function createNestApp() {
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
  return app;
}

// Call the initialization function, but wrap it so it's only done once.
let nestApp: any;

// A promise that resolves when the app is ready.
const ready = (async () => {
  if (!nestApp) {
    nestApp = await createNestApp();
  }
})();

// This is the new entry point for Cloud Functions.
// The name of this function must match your --entry-point flag.
export const startServer = (req: any, res: any) => {
  // Use a promise to ensure the app is ready before processing the request.
  ready.then(() => {
    // The NestJS app is initialized, so we can now forward the request
    // to the express instance.
    expressApp(req, res);
  });
};

// For local development
if (require.main === module) {
  ready.then(() => {
    expressApp.listen(3000, () => {
      console.log('API listening on http://localhost:3000');
    });
  });
}
