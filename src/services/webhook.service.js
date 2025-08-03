import stripe from "../config/stripe.js";
import BadRequest from "../error/badrequest-error.js";
import { OrderStatus } from "../../generated/prisma/client.js";
import * as orderService from "../services/order.service.js";
import * as subService from "../services/sub.service.js";
import InternalError from "../error/internal-error.js";

export const handleStripeHook = async (signature, body) => {};
