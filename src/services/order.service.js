import * as orderRepo from "../repository/order.repo.js";
import * as orderItemRepo from "../repository/order-item.repo.js";
import * as userRepository from "../repository/user-repo.js";
import stripe from "../config/stripe.js";
import NotFound from "../error/notfound-error.js";
import { OrderStatus } from "../../generated/prisma/index.js";
import BadRequest from "../error/badrequest-error.js";
import InternalError from "../error/internal-error.js";

//* create new order
export const createNewOrder = async (data) => {
  const { userId, cart, discount } = data;

  //? calculate total
  const total = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  const orderData = {
    totalAmount: total,
    orderItems: {
      create: cart,
    },
  };

  //? create order
  const order = await orderRepo.create(orderData);

  //? create stripe session
  const { url, stripeSessionId } = await createStripeSession(order.id, parseInt(userId), discount);

  //? update order
  await orderRepo.updateById(order.id, {
    stripePaymentUrl: url,
    stripeSessionId,
  });
  return { url };
};

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
const createStripeSession = async (orderId, userId, discount) => {
  const stripeCustomer = createOrGetStripeCustomer(userId);
  try {
    const orderItems = await orderItemRepo.findAllByOrderId(orderId);
    if (orderItems.length === 0) {
      throw new BadRequest("No order items");
    }

    const stripeSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card", "promptpay"],
      customer: stripeCustomer,
      line_items: orderItems.map((item) => ({
        price_data: {
          currency: "THB",
          product_data: {
            name: item.name,
            images: [item.image],
          },
          unit_amount: item.price * 100,
        },
        quantity: item.quantity,
      })),
      payment_intent_data: {
        metadata: {
          userId,
        },
      },
      expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
    });
    return { url: stripeSession.url, stripeSessionId: stripeSession.id };
  } catch (error) {
    throw new InternalError(error.message);
  }
};

const createOrGetStripeCustomer = async (userId) => {
  const existsUser = await userRepository.findById(userId);
  if (!existsUser) {
    throw new NotFound("User not found");
  }
  if (!existsUser.stripeCustomerId) {
    const stripeCustomer = await stripe.customers.create({
      name: existsUser.name,
      email: existsUser.email,
      metadata: {
        userId: existsUser.id,
      },
    });
    await userRepository.update(userId, {
      stripeCustomerId: stripeCustomer.id,
    });
    return stripeCustomer.id;
  }
  return existsUser.stripeCustomerId;
};
