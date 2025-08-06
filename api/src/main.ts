import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app/app.module';
import * as dotenv from 'dotenv';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

dotenv.config();

const expressApp = express();

async function createNestApp() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));

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

createNestApp();

if (require.main === module) {
  expressApp.listen(3000, () => {
      console.log('API listening on http://localhost:3000');
  });
}

export const startServer = expressApp;