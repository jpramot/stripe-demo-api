import * as webhookService from "../services/webhook.service.js";

export const handleStripeHook = async (req, res, next) => {
  try {
    res.json({});
  } catch (error) {
    next(error);
  }
};
