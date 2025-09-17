import { Controller, Post, Body, Get, Param } from "@nestjs/common";
import { PaymentsService } from "./payments.service";

@Controller("payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post("create-payment")
  async createPayment(@Body() body: any) {
    return this.paymentsService.createCollectRequest(body);
  }

  @Get("check-status/:custom_order_id")
  async getStatus(@Param("custom_order_id") customOrderId: string) {
    return this.paymentsService.checkStatus(customOrderId);
  }
}
