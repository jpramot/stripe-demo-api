import stripe from "../config/stripe.js";
import BadRequest from "../error/badrequest-error.js";
import { OrderStatus } from "../../generated/prisma/client.js";
import * as orderService from "../services/order.service.js";
import * as subService from "../services/sub.service.js";
import * as orderRepository from "../repository/order.repo.js";

export const handleStripeHook = async (signature, body) => {
  const event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);

  if (event?.type === "checkout.session.completed") {
    const session = event.data.object;
    if (session.mode === "payment") {
      //* ดึง payment_intent
      const paymentIntentId = session.payment_intent;

      //* ดึง payment method ที่ใช้จ่าย
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      const paymentMethodId = paymentIntent.payment_method;
      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
      const data = {
        status: OrderStatus.SUCCESS,
        paymentMethod: paymentMethod.type.toUpperCase(),
        stripeIntentId: paymentIntentId,
      };
      await orderService.updateOrderToSuccess(session.id, data);
    }
  } else if (event?.type === "customer.subscription.created") {
    const { id, current_period_start, current_period_end, status, plan } = event.data.object;
    console.log(event.data.object);
    const orderData = {
      status: OrderStatus.ACTIVE,
      totalAmount: plan.amount,
    };
    await orderRepository.create(orderData);
    const subData = {
      id,
      currentPeriodStart: current_period_start,
      currentPeriodEnd: current_period_end,
      subScriptionStatus: status,
    };
    await subService.createNewSubScription(subData);
  } else {
    throw new BadRequest("No event happened");
  }
};
