"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionsController = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const order_schema_1 = require("../schemas/order.schema");
const order_status_schema_1 = require("../schemas/order-status.schema");
let TransactionsController = class TransactionsController {
    constructor(orderModel, statusModel) {
        this.orderModel = orderModel;
        this.statusModel = statusModel;
    }
    async getAll(query) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 20;
        const sortField = query.sort || 'createdAt';
        const sortOrder = query.order === 'asc' ? 1 : -1;
        const skip = (page - 1) * limit;
        const pipeline = [
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
    async getBySchool(schoolId, query) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 20;
        const skip = (page - 1) * limit;
        const pipeline = [
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
    async getStatus(id) {
        const order = await this.orderModel.findOne({ custom_order_id: id }).lean();
        if (!order)
            return { found: false };
        const status = await this.statusModel
            .findOne({ collect_request_id: order.collect_request_id })
            .sort({ createdAt: -1 })
            .lean();
        return { order, status };
    }
};
exports.TransactionsController = TransactionsController;
__decorate([
    (0, common_1.Get)('transactions'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "getAll", null);
__decorate([
    (0, common_1.Get)('transactions/school/:schoolId'),
    __param(0, (0, common_1.Param)('schoolId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "getBySchool", null);
__decorate([
    (0, common_1.Get)('transaction-status/:custom_order_id'),
    __param(0, (0, common_1.Param)('custom_order_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "getStatus", null);
exports.TransactionsController = TransactionsController = __decorate([
    (0, common_1.Controller)(),
    __param(0, (0, mongoose_1.InjectModel)(order_schema_1.Order.name)),
    __param(1, (0, mongoose_1.InjectModel)(order_status_schema_1.OrderStatus.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], TransactionsController);
//# sourceMappingURL=transactions.controller.js.map