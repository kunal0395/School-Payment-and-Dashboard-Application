import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OrderDocument = Order & Document;

class StudentInfo {
  @Prop()
  name?: string;

  @Prop()
  id?: string;

  @Prop()
  email?: string;
}

@Schema({ timestamps: true })
export class Order {
  @Prop({ required: true })
  collect_request_id: string; 

  @Prop({ required: true })
  custom_order_id: string; 

  @Prop({ required: true })
  school_id: string;

  @Prop({ required: true })
  trustee_id : string;

  @Prop({ required: true })
  amount: number;

  @Prop()
  gateway_name?: string;

  // ✅ FIX: tell NestJS/Mongoose the type explicitly
  @Prop({ type: StudentInfo })
  student_info?: StudentInfo;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

OrderSchema.index({ school_id: 1 });
OrderSchema.index({ custom_order_id: 1 }, { unique: true });
