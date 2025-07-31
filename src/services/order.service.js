import * as orderRepo from "../repository/order.repo.js";
import * as orderItemRepo from "../repository/order-item.repo.js";
import stripe from "../config/stripe.js";
import NotFound from "../error/notfound-error.js";
import { OrderStatus } from "../../generated/prisma/index.js";

export const createNewOrder = async (data) => {
  const totalAmount = data.reduce((acc, item) => {
    return acc + item.price * item.quantity;
  }, 0);

  const orderData = {
    totalAmount,
    orderItems: {
      create: data,
    },
  };
  const order = await orderRepo.create(orderData);
  const { url, stripeSessionId } = await createStripeSession(order.id);
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await orderRepo.updateById(order.id, {
    stripeSessionId,
    stripePaymentUrl: url,
    stripeSessionExpiredAt: tomorrow,
  });
  return { url };
};

export const getAllOrders = async () => {
  const orders = await orderRepo.findAll();
  return { orders };
};

export const getOrderPaymentUrl = async (id) => {
  const order = await orderRepo.findById(id);
  if (!order) {
    throw new NotFound("Order not found");
  }
  if (order.stripeSessionExpiredAt > new Date()) {
    console.log("return");
    return { url: order.stripePaymentUrl };
  }
  const { url, stripeSessionId } = await createStripeSession(id);
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await orderRepo.updateById(id, {
    stripeSessionId,
    stripePaymentUrl: url,
    stripeSessionExpiredAt: tomorrow,
  });
  return { url };
};

export const updateOrderToSuccess = async (sessionId, data) => {
  const existOrder = await orderRepo.findBySessionId(sessionId);
  if (!existOrder) {
    throw new NotFound("Order not found");
  }
  await orderRepo.updateById(existOrder.id, data);
};

export const cancelOrder = async (id) => {
  const existsOrder = await orderRepo.findById(id);
  if (!existsOrder) {
    throw new NotFound("Order not found");
  }
  const updatedOrder = await orderRepo.updateById(id, { status: OrderStatus.CANCELED });
  const {
    stripeIntentId,
    stripePaymentUrl,
    stripeSessionExpiredAt,
    stripeSessionId,
    paymentMethod,
    ...order
  } = updatedOrder;
  return { order };
};

export const getOrderBySessionId = async (stripeSessionId) => {
  const order = await orderRepo.findBySessionId(stripeSessionId);
  if (!order) {
    throw new NotFound("Order not found");
  }
  return { order };
};

export const createNewSubOrder = async (id) => {
  const { url, stripeSessionId } = await createStripeSubSession(id);
  return { url };
};

const createStripeSubSession = async (id) => {
  const stripeSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: id, quantity: 1 }],
    payment_method_types: ["card"],
    success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL}/cancel`,
  });
  return { url: stripeSession.url, stripeSessionId: stripeSession.id };
};

const createStripeSession = async (orderId) => {
  const orderItem = await orderItemRepo.findAllByOrderId(orderId);
  const stripeSession = await stripe.checkout.sessions.create({
    line_items: orderItem.map((item) => ({
      price_data: {
        currency: "thb",
        product_data: {
          name: item.name,
          images: [item.image],
        },
        unit_amount: item.price * 100,
      },
      quantity: item.quantity,
    })),
    mode: "payment",
    payment_method_types: ["card", "promptpay"],
    // expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL}/cancel`,
  });
  return { url: stripeSession.url, stripeSessionId: stripeSession.id };
};
