import { Controller, Get, Param, Query } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from '../schemas/order.schema';
import { OrderStatus, OrderStatusDocument } from '../schemas/order-status.schema';

@Controller()
export class TransactionsController {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(OrderStatus.name) private statusModel: Model<OrderStatusDocument>
  ) {}

  @Get('transactions')
  async getAll(@Query() query: any) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const sortField = query.sort || 'createdAt';
    const sortOrder = query.order === 'asc' ? 1 : -1;
    const skip = (page - 1) * limit;

    const pipeline: any[] = [
      {
        $lookup: {
          from: 'orderstatuses', 
          let: { collect_id: '$collect_request_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$collect_request_id', '$$collect_id'] } } },
            { $sort: { createdAt: -1 } },
            { $limit: 1 }
          ],
          as: 'latest_status'
        }
      },
      { $unwind: { path: '$latest_status', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          collect_id: '$collect_request_id',
          custom_order_id: '$custom_order_id',
          school_id: '$school_id',
          gateway: '$gateway_name',
          order_amount: '$amount',
          transaction_amount: '$latest_status.transaction_amount',
          status: '$latest_status.status',
          payment_mode: '$latest_status.payment_mode', 
          payment_time: '$latest_status.payment_time'
        }
      },
      { $sort: { [sortField]: sortOrder } },
      { $skip: skip },
      { $limit: limit }
    ];

    const data = await this.orderModel.aggregate(pipeline);
    const total = await this.orderModel.countDocuments();
    return { data, page, limit, total };
  }

  @Get('transactions/school/:schoolId')
  async getBySchool(@Param('schoolId') schoolId: string, @Query() query: any) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const skip = (page - 1) * limit;

    const pipeline: any[] = [
      { $match: { school_id: schoolId } },
      {
        $lookup: {
          from: 'orderstatuses',
          let: { collect_id: '$collect_request_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$collect_request_id', '$$collect_id'] } } },
            { $sort: { createdAt: -1 } },
            { $limit: 1 }
          ],
          as: 'latest_status'
        }
      },
      { $unwind: { path: '$latest_status', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          collect_id: '$collect_request_id',
          custom_order_id: '$custom_order_id',
          school_id: '$school_id',
          gateway: '$gateway_name',
          order_amount: '$amount',
          transaction_amount: '$latest_status.transaction_amount',
          status: '$latest_status.status',
          payment_mode: '$latest_status.payment_mode', 
          payment_time: '$latest_status.payment_time'
        }
      },
      { $skip: skip },
      { $limit: limit }
    ];

    const data = await this.orderModel.aggregate(pipeline);
    return { data, page, limit };
  }

  @Get('transaction-status/:custom_order_id')
  async getStatus(@Param('custom_order_id') id: string) {
    const order = await this.orderModel.findOne({ custom_order_id: id }).lean();
    if (!order) return { found: false };

    const status = await this.statusModel
      .findOne({ collect_request_id: order.collect_request_id })
      .sort({ createdAt: -1 })
      .lean();

    return { order, status };
  }
}
