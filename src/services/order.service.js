import * as orderRepo from "../repository/order.repo.js";
import * as orderItemRepo from "../repository/order-item.repo.js";
import * as userRepository from "../repository/user-repo.js";
import stripe from "../config/stripe.js";
import NotFound from "../error/notfound-error.js";
import { OrderStatus } from "../../generated/prisma/index.js";
import BadRequest from "../error/badrequest-error.js";
import InternalError from "../error/internal-error.js";

//* create new order
export const createNewOrder = async (data) => {};

//* get all orders
export const getAllOrders = async () => {};

//* get order payment url to pay
export const getOrderPaymentUrl = async (id) => {};

//* update order by session id
export const updateOrderBySessionId = async (sessionId, data) => {};

//* update order by intent id
export const updateOrderByIntentId = async (stripeIntentId, data) => {};

//* cancel order
export const cancelOrder = async (id) => {};

//* get order by session id
export const getOrderBySessionId = async (stripeSessionId) => {};

export const createNewSubOrder = async (id, userId) => {};

//* create stripe subscription session
const createStripeSubSession = async (id, userId) => {};

//* create stripe session payment
const createStripeSession = async (orderId, userId, discount) => {};

const createOrGetStripeCustomer = async (userId) => {};
