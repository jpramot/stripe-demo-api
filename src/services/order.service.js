import * as orderRepo from "../repository/order.repo.js";
import * as orderItemRepo from "../repository/order-item.repo.js";
import * as userRepository from "../repository/user-repo.js";
import stripe from "../config/stripe.js";
import NotFound from "../error/notfound-error.js";
import { OrderStatus } from "../../generated/prisma/index.js";
import BadRequest from "../error/badrequest-error.js";

//* create new order
export const createNewOrder = async (data) => {
  const { cart, userId, discount } = data;
  //? calculate total amount
  const totalAmount = cart.reduce((acc, item) => {
    return acc + item.price * item.quantity;
  }, 0);

  //? prepare order data
  const orderData = {
    totalAmount,
    orderItems: {
      create: cart,
    },
  };
  const order = await orderRepo.create(orderData);
  if (discount > 100) throw new BadRequest("Discount must be less than 100");
  const totalDiscount = totalAmount * ((100 - discount) / 100);
  const { url, stripeSessionId } = await createStripeSession(
    order.id,
    parseInt(userId),
    totalDiscount
  );
  await orderRepo.updateById(order.id, {
    stripeSessionId,
    stripePaymentUrl: url,
  });
  return { url };
};

//* get all orders
export const getAllOrders = async () => {
  const orders = await orderRepo.findAll();
  return { orders };
};

//* get order payment url to pay
export const getOrderPaymentUrl = async (id) => {
  const order = await orderRepo.findByIdWithPendingStatus(id);
  if (!order) {
    throw new NotFound("Order not found");
  }
  if (order.stripeSessionExpiredAt > new Date()) {
    console.log("return");
    return { url: order.stripePaymentUrl };
  }
  const { url, stripeSessionId } = await createStripeSession(id);

  await orderRepo.updateById(id, {
    stripeSessionId,
    stripePaymentUrl: url,
  });
  return { url };
};

//* update order by session id
export const updateOrderBySessionId = async (sessionId, data) => {
  const existOrder = await orderRepo.findBySessionId(sessionId);
  if (!existOrder) {
    throw new NotFound("Order not found");
  }
  await orderRepo.updateById(existOrder.id, data);
};

//* update order by intent id
export const updateOrderByIntentId = async (stripeIntentId, data) => {
  const existOrder = await orderRepo.findByIntentId(stripeIntentId);
  if (!existOrder) {
    throw new NotFound("Order not found");
  }
  await orderRepo.updateById(existOrder.id, data);
};

//* update order
export const updateOrderById = async (id, data) => {
  const existOrder = await orderRepo.findById(id);
  if (!existOrder) {
    throw new NotFound("Order not found");
  }
  await orderRepo.updateById(id, data);
};

//* cancel order
export const cancelOrder = async (id) => {
  const existsOrder = await orderRepo.findById(id);
  if (!existsOrder) {
    throw new NotFound("Order not found");
  }
  const updatedOrder = await orderRepo.updateById(id, { status: OrderStatus.CANCELED });
  const { stripeIntentId, stripePaymentUrl, stripeSessionId, paymentMethod, ...order } =
    updatedOrder;
  return { order };
};

//* get order by session id
export const getOrderBySessionId = async (stripeSessionId) => {
  const order = await orderRepo.findBySessionId(stripeSessionId);
  if (!order) {
    throw new NotFound("Order not found");
  }
  return { order };
};

export const createNewSubOrder = async (id) => {
  const { url } = await createStripeSubSession(id, 1);
  return { url };
};

//* create stripe subscription session
const createStripeSubSession = async (id, userId) => {
  const stripeCustomerId = await createOrGetStripeCustomer(userId);
  const stripeSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: id, quantity: 1 }],
    payment_method_types: ["card"],
    subscription_data: {
      metadata: {
        userId,
      },
    },
    metadata: {
      userId,
    },
    customer: stripeCustomerId,
    success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL}/cancel`,
  });
  return { url: stripeSession.url };
};

//* create stripe session payment
const createStripeSession = async (orderId, userId, discount) => {
  const stripeCustomerId = await createOrGetStripeCustomer(userId);

  const orderItem = await orderItemRepo.findAllByOrderId(orderId);
  if (orderItem.length === 0) {
    throw new BadRequest("Order item not found");
  }
  const payload = {
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
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    customer: stripeCustomerId,
    payment_intent_data: {
      metadata: {
        orderId,
      },
    },
    success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL}/cancel`,
  };
  if (discount) {
    const coupon = await stripe.coupons.create({
      duration: "once",
      amount_off: discount * 100,
      currency: "thb",
    });
    payload.discounts = [{ coupon: coupon.id }];
  }
  const stripeSession = await stripe.checkout.sessions.create(payload);
  return {
    url: stripeSession.url,
    stripeSessionId: stripeSession.id,
  };
};

const createOrGetStripeCustomer = async (userId) => {
  const existsUser = await userRepository.findById(userId);
  if (!existsUser) {
    throw new NotFound("User not found");
  }
  let stripeCustomerId = existsUser.stripeCustomerId;
  if (!stripeCustomerId) {
    const stripeCustomer = await stripe.customers.create({
      email: existsUser.email,
      name: existsUser.name,
    });
    stripeCustomerId = stripeCustomer.id;
    await userRepository.update(userId, { stripeCustomerId });
  }
  return stripeCustomerId;
};
