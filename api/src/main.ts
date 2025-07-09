import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app/app.module'; // Adjust path if your app.module is directly in src

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend communication
  app.enableCors({
    origin: 'http://localhost:4200', // Allow your Angular app to access (change in prod)
    credentials: true,
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
