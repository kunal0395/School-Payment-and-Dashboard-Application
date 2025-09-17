import { Injectable, Logger, HttpException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import * as jwt from "jsonwebtoken";
import axios from "axios";
import { ConfigService } from "@nestjs/config";
import { Order, OrderDocument } from "../schemas/order.schema";
import {
  OrderStatus,
  OrderStatusDocument,
} from "../schemas/order-status.schema";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(OrderStatus.name)
    private statusModel: Model<OrderStatusDocument>,
    private readonly config: ConfigService
  ) {}

  /**
   * Generate a signed JWT token required for Edviron API.
   */
  private generateJwt(payload: Record<string, any>): string {
    const pgKey = this.config.get<string>("EDVIRON_PG_KEY");
    if (!pgKey) {
      this.logger.error("❌ Missing EDVIRON_PG_KEY in .env");
      throw new Error("Missing EDVIRON_PG_KEY");
    }
    return jwt.sign(payload, pgKey, { algorithm: "HS256" });
  }

  /**
   * Create a collect request with Edviron.
   */
  async createCollectRequest(payload: {
    amount: string | number;
    callback_url?: string;
    student_info?: any;
  }) {
    const trustee_id = this.config.get<string>("TRUSTEE_ID");
    const school_id = this.config.get<string>("SCHOOL_ID");
    const edvironBase = this.config.get<string>("EDVIRON_BASE");
    const edvironBearer = this.config.get<string>("EDVIRON_API_BEARER");
    const frontendUrl = this.config.get<string>("FRONTEND_URL");

    if (!school_id || !edvironBase || !edvironBearer || !frontendUrl) {
      this.logger.error("Missing required environment variables", {
        school_id,
        edvironBase,
        edvironBearer: !!edvironBearer,
        frontendUrl,
      });
      throw new HttpException("Server misconfiguration", 500);
    }

    // make sure payload is valid
    if (!payload || !payload.amount) {
      throw new HttpException("Invalid payload: amount required", 400);
    }

    // Build unique ids/callback
    const custom_order_id = uuidv4();
    const makeCallback = (cid: string) =>
      payload.callback_url
        ? payload.callback_url.includes("?")
          ? `${payload.callback_url}&custom_order_id=${cid}`
          : `${payload.callback_url}?custom_order_id=${cid}`
        : `${frontendUrl}/payment-status?custom_order_id=${cid}`;

    const attemptCreate = async (cid: string) => {
      const callback = makeCallback(cid);

      const signPayload = {
        school_id,
        amount: String(payload.amount),
        callback_url: callback,
      };

      const signToken = this.generateJwt(signPayload);

      const requestBody: any = {
        ...signPayload,
        sign: signToken,
      };
      if (payload.student_info) requestBody.student_info = payload.student_info;

      const url = `${edvironBase}/erp/create-collect-request`;
      this.logger.log(`📡 Calling Edviron create-collect-request: ${url}`);
      this.logger.debug(
        "Request body (sign payload): " + JSON.stringify(signPayload)
      );
      this.logger.debug("Request body (full): " + JSON.stringify(requestBody));

      try {
        const resp = await axios.post(url, requestBody, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${edvironBearer}`,
          },
          timeout: 15000,
        });

        this.logger.log(`✅ Edviron response status: ${resp.status}`);
        this.logger.debug(
          "Edviron response data: " + JSON.stringify(resp.data)
        );

        const data = resp.data;
        const collect_request_id =
          data.collect_request_id || data.Collect_request_id || data.id;
        const collect_request_url =
          data.collect_request_url ||
          data.Collect_request_url ||
          data.payment_link ||
          data.url;

        if (!collect_request_id || !collect_request_url) {
          this.logger.error(
            "Invalid response from Edviron (missing ids):",
            data
          );
          throw new HttpException("Invalid response from payment gateway", 502);
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
      } catch (err: any) {
        const respData = err?.response?.data;
        const respStatus = err?.response?.status;
        this.logger.error("Edviron create-collect-request failed", {
          message: err?.message,
          status: respStatus,
          responseData: respData,
        });

        throw new HttpException(
          respData || { message: err.message || "Unknown error from Edviron" },
          respStatus || 500
        );
      }
    };
    try {
      return await attemptCreate(custom_order_id);
    } catch (firstErr: any) {
      const status = firstErr?.getStatus
        ? firstErr.getStatus()
        : firstErr?.status;
      if (status === 409) {
        this.logger.warn(
          "Received 409 from Edviron. Retrying once with a new custom_order_id."
        );
        const retryId = `${uuidv4()}-${Date.now().toString().slice(-4)}`;
        try {
          return await attemptCreate(retryId);
        } catch (secondErr: any) {
          const respData =
            secondErr?.response?.data ||
            (secondErr?.message ? { message: secondErr.message } : secondErr);
          this.logger.error("Second attempt also failed", {
            respData,
            status: secondErr?.response?.status,
          });
          throw new HttpException(
            respData || "Failed to create collect request (retry)",
            secondErr?.response?.status || 500
          );
        }
      }
      throw firstErr;
    }
  }

  /**
   * Check payment status from Edviron.
   */
  async checkStatus(customOrderId: string) {
    const school_id = this.config.get<string>("SCHOOL_ID");
    const edvironBase = this.config.get<string>("EDVIRON_BASE");
    const edvironBearer = this.config.get<string>("EDVIRON_API_BEARER");

    if (!school_id || !edvironBase || !edvironBearer) {
      this.logger.error("❌ Missing Edviron environment variables");
      throw new HttpException("Server misconfiguration", 500);
    }

    const order = await this.orderModel
      .findOne({ custom_order_id: customOrderId })
      .lean();
    if (!order) {
      this.logger.error("Order not found for " + customOrderId);
      throw new HttpException("Order not found", 404);
    }

    const collectRequestId = order.collect_request_id;

    const signPayload = { school_id, collect_request_id: collectRequestId };
    this.logger.debug(`Signing payload: ${JSON.stringify(signPayload)}`);

    const signToken = this.generateJwt(signPayload);

    const url = `${edvironBase}/erp/collect-request/${collectRequestId}`;
    this.logger.log(`📡 Checking payment status: ${url}`);

    try {
      const res = await axios.get(url, {
        params: { school_id, sign: signToken },
        headers: { Authorization: `Bearer ${edvironBearer}` },
        timeout: 10000,
      });

      const data = res.data;
      this.logger.debug("Edviron response: " + JSON.stringify(data, null, 2));

      const statusToStore =
        data.status || (data.status_code === 200 ? "SUCCESS" : "PENDING");
      const transactionAmount =
        data.transaction_amount ?? data.amount ?? order.amount;

      // 1) Upsert OrderStatus
      await this.statusModel.updateOne(
        { collect_request_id: collectRequestId },
        {
          $set: {
            collect_request_id: collectRequestId,
            order_amount: order.amount,
            transaction_amount: transactionAmount,
            payment_mode:
              data?.details?.payment_mode ??
              data?.details?.payment_methods ??
              null,
            payment_details: JSON.stringify(data?.details ?? {}),
            bank_reference: data?.details?.bank_ref ?? null,
            payment_message: data?.message ?? null,
            status: statusToStore,
            error_message: null,
            payment_time: data.payment_time
              ? new Date(data.payment_time)
              : new Date(),
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      );

      // 2) Update Orders collection
      await this.orderModel.updateOne(
        { custom_order_id: customOrderId },
        {
          $set: {
            status: statusToStore,
            transaction_amount: transactionAmount,
            updatedAt: new Date(),
          },
        }
      );

      // return updated info
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
    } catch (err) {
      this.logger.error(
        "Error checking status",
        err?.response?.data || err.message
      );
      throw new HttpException(
        err?.response?.data || "Failed to check status",
        err?.response?.status || 500
      );
    }
  }
}
