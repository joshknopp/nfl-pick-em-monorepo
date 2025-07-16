import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app/app.module'; // Adjust path if your app.module is directly in src

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for any origin, dynamically set header based on request's Origin or Referer
  app.enableCors({
    origin: (origin, callback) => {
      // If no origin header, allow (for tools like curl or server-to-server)
      if (!origin) return callback(null, true);
      // Otherwise, reflect the origin
      callback(null, origin);
    },
    credentials: true,
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    exposedHeaders: ['Authorization'],
  });

  const config = new DocumentBuilder()
    .setTitle('NFL Pick Em API')
    .setDescription('API for managing NFL Pick Em game data and logic')
    .setVersion('1.0')
    .addTag('picks')
    .addBearerAuth() // For future auth
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document); // Swagger UI will be at http://localhost:3000/api-docs

  await app.listen(3000);
}
bootstrap();
