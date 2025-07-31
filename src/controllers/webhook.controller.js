import * as webhookService from "../services/webhook.service.js";

export const handleStripeHook = async (req, res, next) => {
  try {
    const signature = req.headers["stripe-signature"];
    const { body } = req;
    await webhookService.handleStripeHook(signature, body);
    res.json({});
  } catch (error) {
    next(error);
  }
};
