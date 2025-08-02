import * as subRepo from "../repository/sub.repo.js";

export const createOrUpdateSub = async (data) => {
  const sub = await subRepo.upsert(data);
  return { sub };
};

export const findBySessionId = async (stripeSessionId) => {
  const sub = await subRepo.findBySessionId(stripeSessionId);
  return { sub };
};
