import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth/auth.service';
import { getModelToken } from '@nestjs/mongoose';
import { Order } from './schemas/order.schema';
import { OrderStatus } from './schemas/order-status.schema';
import * as mongoose from 'mongoose';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const config = app.get(ConfigService);
  const auth = app.get(AuthService);
  await auth.createTestUser('student', 'password123');

  console.log('Seed done');
  await app.close();
}

bootstrap();
