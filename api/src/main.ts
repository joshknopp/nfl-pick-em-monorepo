import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as dotenv from 'dotenv';
import { AppModule } from './app/app.module';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, './assets/serviceAccountKey.json'),
    'utf8'
  )
);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
console.log('Firebase initialized in main.ts');

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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

  const port = process.env.PORT || 8080;
  await app.listen(port);
  console.log(`API listening on http://localhost:${port}`);
}

bootstrap();
