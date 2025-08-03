import * as checkoutService from "../services/checkout.service.js";

export const getCheckoutStatus = async (req, res, next) => {
  try {
    const checkout = await checkoutService.getCheckoutStatus(req.params.stripeSessionId);
    return res.status(200).json({ checkout });
  } catch (error) {
    next(error);
  }
};
