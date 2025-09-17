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
var PaymentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const jwt = require("jsonwebtoken");
const axios_1 = require("axios");
const config_1 = require("@nestjs/config");
const order_schema_1 = require("../schemas/order.schema");
const order_status_schema_1 = require("../schemas/order-status.schema");
const uuid_1 = require("uuid");
let PaymentsService = PaymentsService_1 = class PaymentsService {
    constructor(orderModel, statusModel, config) {
        this.orderModel = orderModel;
        this.statusModel = statusModel;
        this.config = config;
        this.logger = new common_1.Logger(PaymentsService_1.name);
    }
    generateJwt(payload) {
        const pgKey = this.config.get("EDVIRON_PG_KEY");
        if (!pgKey) {
            this.logger.error("❌ Missing EDVIRON_PG_KEY in .env");
            throw new Error("Missing EDVIRON_PG_KEY");
        }
        return jwt.sign(payload, pgKey, { algorithm: "HS256" });
    }
    async createCollectRequest(payload) {
        var _a, _b, _c;
        const trustee_id = this.config.get("TRUSTEE_ID");
        const school_id = this.config.get("SCHOOL_ID");
        const edvironBase = this.config.get("EDVIRON_BASE");
        const edvironBearer = this.config.get("EDVIRON_API_BEARER");
        const frontendUrl = this.config.get("FRONTEND_URL");
        if (!school_id || !edvironBase || !edvironBearer || !frontendUrl) {
            this.logger.error("Missing required environment variables", {
                school_id,
                edvironBase,
                edvironBearer: !!edvironBearer,
                frontendUrl,
            });
            throw new common_1.HttpException("Server misconfiguration", 500);
        }
        if (!payload || !payload.amount) {
            throw new common_1.HttpException("Invalid payload: amount required", 400);
        }
        const custom_order_id = (0, uuid_1.v4)();
        const makeCallback = (cid) => payload.callback_url
            ? payload.callback_url.includes("?")
                ? `${payload.callback_url}&custom_order_id=${cid}`
                : `${payload.callback_url}?custom_order_id=${cid}`
            : `${frontendUrl}/payment-status?custom_order_id=${cid}`;
        const attemptCreate = async (cid) => {
            var _a, _b;
            const callback = makeCallback(cid);
            const signPayload = {
                school_id,
                amount: String(payload.amount),
                callback_url: callback,
            };
            const signToken = this.generateJwt(signPayload);
            const requestBody = {
                ...signPayload,
                sign: signToken,
            };
            if (payload.student_info)
                requestBody.student_info = payload.student_info;
            const url = `${edvironBase}/erp/create-collect-request`;
            this.logger.log(`📡 Calling Edviron create-collect-request: ${url}`);
            this.logger.debug("Request body (sign payload): " + JSON.stringify(signPayload));
            this.logger.debug("Request body (full): " + JSON.stringify(requestBody));
            try {
                const resp = await axios_1.default.post(url, requestBody, {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${edvironBearer}`,
                    },
                    timeout: 15000,
                });
                this.logger.log(`✅ Edviron response status: ${resp.status}`);
                this.logger.debug("Edviron response data: " + JSON.stringify(resp.data));
                const data = resp.data;
                const collect_request_id = data.collect_request_id || data.Collect_request_id || data.id;
                const collect_request_url = data.collect_request_url ||
                    data.Collect_request_url ||
                    data.payment_link ||
                    data.url;
                if (!collect_request_id || !collect_request_url) {
                    this.logger.error("Invalid response from Edviron (missing ids):", data);
                    throw new common_1.HttpException("Invalid response from payment gateway", 502);
                }
                const order = await this.orderModel.create({
                    collect_request_id,
                    custom_order_id: cid,
                    trustee_id,
                    school_id,
                    amount: Number(payload.amount),
                    student_info: payload.student_info || {},
                });
                return {
                    collect_request_id,
                    collect_request_url,
                    order,
                    custom_order_id: cid,
                };
            }
            catch (err) {
                const respData = (_a = err === null || err === void 0 ? void 0 : err.response) === null || _a === void 0 ? void 0 : _a.data;
                const respStatus = (_b = err === null || err === void 0 ? void 0 : err.response) === null || _b === void 0 ? void 0 : _b.status;
                this.logger.error("Edviron create-collect-request failed", {
                    message: err === null || err === void 0 ? void 0 : err.message,
                    status: respStatus,
                    responseData: respData,
                });
                throw new common_1.HttpException(respData || { message: err.message || "Unknown error from Edviron" }, respStatus || 500);
            }
        };
        try {
            return await attemptCreate(custom_order_id);
        }
        catch (firstErr) {
            const status = (firstErr === null || firstErr === void 0 ? void 0 : firstErr.getStatus)
                ? firstErr.getStatus()
                : firstErr === null || firstErr === void 0 ? void 0 : firstErr.status;
            if (status === 409) {
                this.logger.warn("Received 409 from Edviron. Retrying once with a new custom_order_id.");
                const retryId = `${(0, uuid_1.v4)()}-${Date.now().toString().slice(-4)}`;
                try {
                    return await attemptCreate(retryId);
                }
                catch (secondErr) {
                    const respData = ((_a = secondErr === null || secondErr === void 0 ? void 0 : secondErr.response) === null || _a === void 0 ? void 0 : _a.data) ||
                        ((secondErr === null || secondErr === void 0 ? void 0 : secondErr.message) ? { message: secondErr.message } : secondErr);
                    this.logger.error("Second attempt also failed", {
                        respData,
                        status: (_b = secondErr === null || secondErr === void 0 ? void 0 : secondErr.response) === null || _b === void 0 ? void 0 : _b.status,
                    });
                    throw new common_1.HttpException(respData || "Failed to create collect request (retry)", ((_c = secondErr === null || secondErr === void 0 ? void 0 : secondErr.response) === null || _c === void 0 ? void 0 : _c.status) || 500);
                }
            }
            throw firstErr;
        }
    }
    async checkStatus(customOrderId) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
        const school_id = this.config.get("SCHOOL_ID");
        const edvironBase = this.config.get("EDVIRON_BASE");
        const edvironBearer = this.config.get("EDVIRON_API_BEARER");
        if (!school_id || !edvironBase || !edvironBearer) {
            this.logger.error("❌ Missing Edviron environment variables");
            throw new common_1.HttpException("Server misconfiguration", 500);
        }
        const order = await this.orderModel
            .findOne({ custom_order_id: customOrderId })
            .lean();
        if (!order) {
            this.logger.error("Order not found for " + customOrderId);
            throw new common_1.HttpException("Order not found", 404);
        }
        const collectRequestId = order.collect_request_id;
        const signPayload = { school_id, collect_request_id: collectRequestId };
        this.logger.debug(`Signing payload: ${JSON.stringify(signPayload)}`);
        const signToken = this.generateJwt(signPayload);
        const url = `${edvironBase}/erp/collect-request/${collectRequestId}`;
        this.logger.log(`📡 Checking payment status: ${url}`);
        try {
            const res = await axios_1.default.get(url, {
                params: { school_id, sign: signToken },
                headers: { Authorization: `Bearer ${edvironBearer}` },
                timeout: 10000,
            });
            const data = res.data;
            this.logger.debug("Edviron response: " + JSON.stringify(data, null, 2));
            const statusToStore = data.status || (data.status_code === 200 ? "SUCCESS" : "PENDING");
            const transactionAmount = (_b = (_a = data.transaction_amount) !== null && _a !== void 0 ? _a : data.amount) !== null && _b !== void 0 ? _b : order.amount;
            await this.statusModel.updateOne({ collect_request_id: collectRequestId }, {
                $set: {
                    collect_request_id: collectRequestId,
                    order_amount: order.amount,
                    transaction_amount: transactionAmount,
                    payment_mode: (_f = (_d = (_c = data === null || data === void 0 ? void 0 : data.details) === null || _c === void 0 ? void 0 : _c.payment_mode) !== null && _d !== void 0 ? _d : (_e = data === null || data === void 0 ? void 0 : data.details) === null || _e === void 0 ? void 0 : _e.payment_methods) !== null && _f !== void 0 ? _f : null,
                    payment_details: JSON.stringify((_g = data === null || data === void 0 ? void 0 : data.details) !== null && _g !== void 0 ? _g : {}),
                    bank_reference: (_j = (_h = data === null || data === void 0 ? void 0 : data.details) === null || _h === void 0 ? void 0 : _h.bank_ref) !== null && _j !== void 0 ? _j : null,
                    payment_message: (_k = data === null || data === void 0 ? void 0 : data.message) !== null && _k !== void 0 ? _k : null,
                    status: statusToStore,
                    error_message: null,
                    payment_time: data.payment_time
                        ? new Date(data.payment_time)
                        : new Date(),
                    updatedAt: new Date(),
                },
            }, { upsert: true });
            await this.orderModel.updateOne({ custom_order_id: customOrderId }, {
                $set: {
                    status: statusToStore,
                    transaction_amount: transactionAmount,
                    updatedAt: new Date(),
                },
            });
            const updatedOrder = await this.orderModel
                .findOne({ custom_order_id: customOrderId })
                .lean();
            const latestStatus = await this.statusModel
                .findOne({ collect_request_id: collectRequestId })
                .lean();
            return {
                success: true,
                order: updatedOrder,
                status: latestStatus,
                raw: data,
            };
        }
        catch (err) {
            this.logger.error("Error checking status", ((_l = err === null || err === void 0 ? void 0 : err.response) === null || _l === void 0 ? void 0 : _l.data) || err.message);
            throw new common_1.HttpException(((_m = err === null || err === void 0 ? void 0 : err.response) === null || _m === void 0 ? void 0 : _m.data) || "Failed to check status", ((_o = err === null || err === void 0 ? void 0 : err.response) === null || _o === void 0 ? void 0 : _o.status) || 500);
        }
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = PaymentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(order_schema_1.Order.name)),
    __param(1, (0, mongoose_1.InjectModel)(order_status_schema_1.OrderStatus.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        config_1.ConfigService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map