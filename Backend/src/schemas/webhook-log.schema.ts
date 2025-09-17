import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type WebhookLogDocument = WebhookLog & Document;

@Schema({ timestamps: true })
export class WebhookLog {
  @Prop({ required: true })
  event: string;

  @Prop({ type: Object })
  payload: any;
}

export const WebhookLogSchema = SchemaFactory.createForClass(WebhookLog);
