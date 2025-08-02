import stripe from "../config/stripe.js";
import BadRequest from "../error/badrequest-error.js";
import { OrderStatus } from "../../generated/prisma/client.js";
import * as orderService from "../services/order.service.js";
import * as subService from "../services/sub.service.js";
import * as orderRepository from "../repository/order.repo.js";
import InternalError from "../error/internal-error.js";
import sleep from "../util/sleep.js";

export const handleStripeHook = async (signature, body) => {
  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    throw new BadRequest(`Webhook Error: ${error.message}`);
  }

  try {
    switch (event?.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.mode === "payment") {
          // ดึง payment_intent
          const paymentIntentId = session.payment_intent;
          // ดึง payment method ที่ใช้จ่าย
          const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
          const [paymentMethod] = paymentIntent.payment_method_types;

          const data = {
            status: OrderStatus.PAID,
            stripeIntentId: session.payment_intent,
            paymentMethod: paymentMethod.toUpperCase(),
          };
          await orderService.updateOrderBySessionId(session.id, data);
        } else if (session.mode === "subscription") {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          // console.log("session", session);
          // console.log("subscription", subscription);
          const subData = {
            id: subscription.id,
            stripeSessionId: session.id,
            priceId: subscription.plan.id,
            userId: parseInt(subscription.metadata.userId),
          };
          await subService.createOrUpdateSub(subData);
          console.log("subscription payment success");
        } else {
          throw new BadRequest("Unknown mode");
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object;
        const data = {
          status: OrderStatus.FAILED,
        };
        await orderService.updateOrderBySessionId(session.id, data);
        break;
      }

      case "customer.subscription.created": {
        console.log(event.data.object);
        const { id, current_period_start, current_period_end, plan, metadata } = event.data.object;
        console.log(
          new Date(current_period_start * 1000).toLocaleString({
            timeZone: "Asia/Bangkok",
          })
        );
        const subData = {
          id,
          currentPeriodStart: new Date(current_period_start * 1000),
          currentPeriodEnd: new Date(current_period_end * 1000),
          priceId: plan.id,
          userId: parseInt(metadata.userId),
        };
        await subService.createOrUpdateSub(subData);
        console.log("created success");
        break;
      }
      case "customer.subscription.updated": {
        break;
      }
      case "customer.source.deleted": {
        break;
      }

      default:
        throw new BadRequest(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    throw new InternalError(`Internal Error: ${error.message}`);
  }
};
