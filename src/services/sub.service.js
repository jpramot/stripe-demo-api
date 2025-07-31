import * as subRepo from "../repository/sub.repo.js";

export const createNewSubScription = async (data) => {
  const sub = await subRepo.create(data);
  return { sub };
};
