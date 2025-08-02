import NotFound from "../error/notfound-error.js";
import * as orderRepository from "../repository/order.repo.js";
import * as subRepository from "../repository/sub.repo.js";

export const getCheckoutStatus = async (stripeSessionId) => {
  const order = await orderRepository.findBySessionId(stripeSessionId);
  if (order) {
    return { type: "payment", status: order.status };
  }
  const sub = await subRepository.findBySessionId(stripeSessionId);
  if (sub) {
    return {
      type: "subscription",
      status: sub.subScriptionStatus,
      currentPeriodEnd: sub.currentPeriodEnd,
    };
  }

  throw new NotFound("Checkout not found");
};
