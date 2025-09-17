// src/webhook/webhook.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WebhookController } from './webhook.controller';
import { WebhookLog, WebhookLogSchema } from '../schemas/webhook-log.schema';
import { OrderStatus, OrderStatusSchema } from '../schemas/order-status.schema';
import { Order, OrderSchema } from '../schemas/order.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WebhookLog.name, schema: WebhookLogSchema },
      { name: OrderStatus.name, schema: OrderStatusSchema },
      { name: Order.name, schema: OrderSchema }, 
    ]),
  ],
  controllers: [WebhookController],
})
export class WebhookModule {}
