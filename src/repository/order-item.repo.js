import prisma from "../config/prisma.js";

export const findAllByOrderId = async (orderId) =>
  await prisma.orderItem.findMany({ where: { orderId } });
