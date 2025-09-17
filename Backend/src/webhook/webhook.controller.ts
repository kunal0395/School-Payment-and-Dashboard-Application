import { Controller, Post, Body, Logger, HttpCode } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order } from '../schemas/order.schema';
import { OrderStatus } from '../schemas/order-status.schema';
import { WebhookLog } from '../schemas/webhook-log.schema';

@Controller('webhook')
export class WebhookController {
  private logger = new Logger(WebhookController.name);
  constructor(
    @InjectModel(WebhookLog.name) private logModel: Model<any>,
    @InjectModel(OrderStatus.name) private statusModel: Model<any>,
    @InjectModel(Order.name) private orderModel: Model<any>,
  ) {}

  @Post()
  @HttpCode(200)
  async handleWebhook(@Body() body: any) {
    try {
      await this.logModel.create({ event: 'webhook', payload: body, receivedAt: new Date() });

      const info = body.order_info || body;
      const collect_id = info.order_id || info.collect_id || info.collect_request_id;
      if (!collect_id) {
        this.logger.error('Webhook missing collect id', body);
        return { ok: false };
      }

      await this.statusModel.updateOne(
        { collect_request_id: collect_id },
        {
          $set: {
            collect_request_id: collect_id,
            order_amount: info.order_amount,
            transaction_amount: info.transaction_amount,
            payment_mode: info.payment_mode,
            payment_details: info.payemnt_details || info.payment_details || null,
            bank_reference: info.bank_reference,
            payment_message: info.Payment_message || info.payment_message || null,
            status: info.status,
            error_message: info.error_message || null,
            payment_time: info.payment_time ? new Date(info.payment_time) : new Date(),
            updatedAt: new Date(),
          },
        },
        { upsert: true },
      );

      await this.orderModel.updateOne(
        { collect_request_id: collect_id },
        {
          $set: {
            status: info.status,
            transaction_amount: info.transaction_amount,
            updatedAt: new Date(),
          },
        },
      );

      this.logger.log('Webhook processed ' + collect_id);
      return { ok: true };
    } catch (err) {
      this.logger.error('Webhook error', err.stack || err);
      return { ok: false, error: err.message };
    }
  }
}
