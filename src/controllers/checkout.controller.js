import * as checkoutService from "../services/checkout.service.js";

export const getCheckoutStatus = async (req, res, next) => {
  try {
    return res.json({ checkout: {} });
  } catch (error) {
    next(error);
  }
};
