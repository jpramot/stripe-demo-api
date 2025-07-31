import { Router } from "express";
import * as orderController from "../controllers/order.controller.js";

const orderRouter = Router();

orderRouter.post("/", orderController.createNewOrder);

orderRouter.get("/", orderController.getAllOrders);

orderRouter.post("/:id/pay-again", orderController.getOrderPaymentUrl);

orderRouter.post("/:id/cancel", orderController.cancelOrder);

orderRouter.get("/status/:id", orderController.checkOrderStatus);

orderRouter.post("/:id/subscribe", orderController.createNewSubOrder);

export default orderRouter;
