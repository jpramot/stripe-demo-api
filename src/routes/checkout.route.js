import * as checkoutController from "../controllers/checkout.controller.js";
import { Router } from "express";

const checkoutRouter = Router();

checkoutRouter.get("/status/:stripeSessionId", checkoutController.getCheckoutStatus);

export default checkoutRouter;
