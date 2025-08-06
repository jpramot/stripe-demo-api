import stripe from "../config/stripe.js";
import BadRequest from "../error/badrequest-error.js";
import { OrderStatus, SubScriptionStatus } from "../../generated/prisma/client.js";
import * as orderService from "../services/order.service.js";
import * as subService from "../services/sub.service.js";
import * as subRepo from "../repository/sub.repo.js";
import InternalError from "../error/internal-error.js";

export const handleStripeHook = async (signature, body) => {
  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    throw new BadRequest(`Webhook Error: ${error.message}`);
  }
  console.log(`Incoming event: ${event.type}`);
  try {
    switch (event?.type) {
      //| case "checkout.session.complete":
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
          // await orderService.updateOrderBySessionId(session.id, data);
        } else if (session.mode === "subscription") {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);

          const subData = {
            id: subscription.id,
            stripeSessionId: session.id,
            priceId: subscription.plan.id,
            userId: parseInt(subscription.metadata.userId),
          };
          await subService.createOrUpdateSub(subData);
        } else {
          throw new BadRequest("Unknown mode");
        }
        break;
      }
      //| case "checkout.session.expired":
      case "checkout.session.expired": {
        const session = event.data.object;
        const data = {
          status: OrderStatus.FAILED,
        };
        await orderService.updateOrderBySessionId(session.id, data);
        break;
      }
      //| case "subscription.created": (for first time subscription)
      case "customer.subscription.created": {
        console.log(event.data.object);
        const { id, current_period_start, current_period_end, plan, metadata } = event.data.object;
        const subData = {
          id,
          currentPeriodStart: new Date(current_period_start * 1000),
          currentPeriodEnd: new Date(current_period_end * 1000),
          priceId: plan.id,
          userId: parseInt(metadata.userId),
        };
        await subService.createOrUpdateSub(subData);
        break;
      }
      //| case "subscription.updated": (for subscription update ex: change plan, cancel, renew)
      case "customer.subscription.updated": {
        //? Subscription update logic here
        console.log("updated: ", event.data.object);
        const { id } = event.data.object;
        console.log(event.data.previous_attributes);
        if (
          event.data.object.cancel_at_period_end &&
          !event.data.previous_attributes.cancel_at_period_end
        ) {
          await subService.updateSub(id, {
            subScriptionStatus: SubScriptionStatus.CANCELED_AT_PERIOD_END,
          });
        } else if (
          !event.data.object.cancel_at_period_end &&
          event.data.previous_attributes.cancel_at_period_end
        ) {
          await subService.updateSub(id, {
            subScriptionStatus: SubScriptionStatus.ACTIVE,
          });
        }
        break;
      }
      //| case "subscription.deleted": (for subscription deleted ex: subscription expired without renew)
      case "customer.source.deleted": {
        //? Subscription deleted logic here
        const { id, status } = event.data.object;
        if (status === "canceled") {
          await subService.updateSub(id, {
            subScriptionStatus: SubScriptionStatus.CANCELED,
            isAvailable: false,
          });
        }
        break;
      }
      case "invoice.payment_succeeded": {
        const { subscription } = event.data.object;
        const { start, end } = event.data.object.lines.data[0].period;
        const existSub = await subRepo.findById(subscription);
        if (existSub) {
          await subService.updateSub(existSub.id, {
            subScriptionStatus: SubScriptionStatus.ACTIVE,
            currentPeriodStart: new Date(start * 1000),
            currentPeriodEnd: new Date(end * 1000),
          });
        }
        break;
      }
      default:
        throw new BadRequest(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    throw new InternalError(`Internal Error: ${error.message}`);
  }
};
