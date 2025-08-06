import stripe from "../config/stripe.js";
import InternalError from "../error/internal-error.js";
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
    console.log("resub");
    await stripe.subscriptions.update(subId, { cancel_at_period_end: cancel });
  } catch (error) {
    throw new InternalError(`Error during cancel sub: ${error.message}`);
  }
};

export const changePlan = async (subId, priceId) => {
  try {
    await stripe.subscriptions.update(subId, {
      items: [{ price: priceId }],
      proration_behavior: "create_prorations",
      cancel_at_period_end: false,
    });
  } catch (error) {
    throw new InternalError(`Error during change plan: ${error.message}`);
  }
};
