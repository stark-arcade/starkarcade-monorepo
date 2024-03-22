import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import configuration from '@app/shared/configuration';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  await app.listen(configuration().api_port, () => {
    console.log(`Game api is runnning on port ${configuration().api_port}`);
  });
}
bootstrap();
