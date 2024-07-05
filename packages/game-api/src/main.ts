import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import configuration from '@app/shared/configuration';
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

function configureSwagger(app: INestApplication) {
  const swaggerDocOptions = new DocumentBuilder()
    .setTitle('StarkARCADE Hubs API:Gateway')
    .setDescription('StarkARCADE Hubs API Gateway Document Description Content')
    .setVersion('0.0.1')

    .addBearerAuth(
      {
        type: 'apiKey',
        scheme: 'JWT',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Type into the text box: Bearer {your JWT token}',
        in: 'header',
      },
      'JWT',
    )
    .build();
  const swaggerDoc = SwaggerModule.createDocument(app, swaggerDocOptions);

  SwaggerModule.setup('/docs', app, swaggerDoc); // to get json file goto /docs-json
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureSwagger(app);

  app.enableCors();

  await app.listen(configuration().api_port || 5001, () => {
    console.log(`Game api is runnning on port ${configuration().api_port}`);
  });
}
bootstrap();
