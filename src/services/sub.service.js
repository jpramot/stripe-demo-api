import stripe from "../config/stripe.js";
import BadRequest from "../error/badrequest-error.js";
import InternalError from "../error/internal-error.js";
import NotFound from "../error/notfound-error.js";
import * as subRepo from "../repository/sub.repo.js";

export const createOrUpdateSub = async (data) => {
  await subRepo.upsert(data);
};

export const updateSub = async (subId, data) => {
  await subRepo.update(subId, data);
};

export const findBySessionId = async (stripeSessionId) => {
  const sub = await subRepo.findBySessionId(stripeSessionId);
  return { sub };
};

export const findByUserId = async (userId) => {
  const sub = await subRepo.findByUserId(userId);
  return { sub };
};

export const reSubOrCancel = async (subId, cancel) => {
  try {
    await stripe.subscriptions.update(subId, { cancel_at_period_end: cancel });
  } catch (error) {
    throw new InternalError(`Error during cancel sub: ${error.message}`);
  }
};

export const changePlan = async (subId, priceId) => {
  try {
    const existsSub = await subRepo.findByUserIdWithisAvailable(1);
    if (!existsSub) {
      throw new NotFound("Subscription not found");
    }
    const subscription = await stripe.subscriptions.retrieve(subId);
    await stripe.subscriptions.update(subId, {
      items: [{ price: priceId, id: subscription.items.data[0].id }],
      proration_behavior: "always_invoice",
    });
  } catch (error) {
    throw new InternalError(`Error during change plan: ${error.message}`);
  }
};

export const showDemoSubPlan = async (subId, priceId) => {
  const existsSub = await subRepo.findByUserIdWithisAvailable(1);
  if (!existsSub) {
    throw new NotFound("Subscription not found");
  }
  const subscription = await stripe.subscriptions.retrieve(subId);
  console.log(subscription.items.data);
  const demoSub = await stripe.invoices.createPreview({
    customer: existsSub.user.stripeCustomerId,
    subscription: subId,
    subscription_details: {
      proration_behavior: "always_invoice",
      items: [
        {
          price: priceId,
          id: subscription.items.data[0].id,
        },
      ],
    },
  });
  demoSub.lines.data.forEach((line) => {
    console.log({
      description: line.description,
      amount: line.amount / 100,
      proration: line.proration,
    });
  });
  console.log("demoSub", demoSub);
  console.log(new Date(1754486101 * 1000));
  return { demoSub };
};
