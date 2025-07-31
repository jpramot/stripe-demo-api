import { Router } from "express";
import * as webhookController from "../controllers/webhook.controller.js";

const webhookRouter = Router();

webhookRouter.post("/", webhookController.handleStripeHook);

export default webhookRouter;
