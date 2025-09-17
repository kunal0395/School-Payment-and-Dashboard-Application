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
var WebhookController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookController = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const order_schema_1 = require("../schemas/order.schema");
const order_status_schema_1 = require("../schemas/order-status.schema");
const webhook_log_schema_1 = require("../schemas/webhook-log.schema");
let WebhookController = WebhookController_1 = class WebhookController {
    constructor(logModel, statusModel, orderModel) {
        this.logModel = logModel;
        this.statusModel = statusModel;
        this.orderModel = orderModel;
        this.logger = new common_1.Logger(WebhookController_1.name);
    }
    async handleWebhook(body) {
        try {
            await this.logModel.create({ event: 'webhook', payload: body, receivedAt: new Date() });
            const info = body.order_info || body;
            const collect_id = info.order_id || info.collect_id || info.collect_request_id;
            if (!collect_id) {
                this.logger.error('Webhook missing collect id', body);
                return { ok: false };
            }
            await this.statusModel.updateOne({ collect_request_id: collect_id }, {
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
            }, { upsert: true });
            await this.orderModel.updateOne({ collect_request_id: collect_id }, {
                $set: {
                    status: info.status,
                    transaction_amount: info.transaction_amount,
                    updatedAt: new Date(),
                },
            });
            this.logger.log('Webhook processed ' + collect_id);
            return { ok: true };
        }
        catch (err) {
            this.logger.error('Webhook error', err.stack || err);
            return { ok: false, error: err.message };
        }
    }
};
exports.WebhookController = WebhookController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WebhookController.prototype, "handleWebhook", null);
exports.WebhookController = WebhookController = WebhookController_1 = __decorate([
    (0, common_1.Controller)('webhook'),
    __param(0, (0, mongoose_1.InjectModel)(webhook_log_schema_1.WebhookLog.name)),
    __param(1, (0, mongoose_1.InjectModel)(order_status_schema_1.OrderStatus.name)),
    __param(2, (0, mongoose_1.InjectModel)(order_schema_1.Order.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], WebhookController);
//# sourceMappingURL=webhook.controller.js.map