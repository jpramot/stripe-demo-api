import * as subService from "../services/sub.service.js";

export const getUserSub = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const sub = await subService.findByUserId(parseInt(userId));
    res.json(sub);
  } catch (error) {
    next(error);
  }
};

export const cancelOrResub = async (req, res, next) => {
  try {
    const { subId } = req.params;
    const { cancel } = req.query;
    const sub = await subService.reSubOrCancel(subId, cancel);
    res.json(sub);
  } catch (error) {
    next(error);
  }
};

export const changePlan = async (req, res, next) => {
  const { subId } = req.params;
  const { priceId } = req.body;
  const sub = await subService.changePlan(subId, priceId);
  res.json(sub);
};
