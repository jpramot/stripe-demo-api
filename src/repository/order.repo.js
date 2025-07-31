import prisma from "../config/prisma.js";

export const create = async (data) => await prisma.order.create({ data });

export const updateById = async (id, data) =>
  await prisma.order.update({
    where: { id },
    data,
  });

export const findAll = async () =>
  await prisma.order.findMany({ select: { id: true, status: true, totalAmount: true } });

export const findById = async (id) =>
  await prisma.order.findFirst({
    where: { id },
    select: { stripePaymentUrl: true, stripeSessionExpiredAt: true },
  });

export const findBySessionId = async (stripeSessionId) =>
  await prisma.order.findFirst({
    where: { stripeSessionId },
    select: { status: true, id: true, stripeSessionId: true },
  });

// export const findBySessionIdWithNotExpiredSession = async (stripeSessionId) =>
//   await prisma.order.findFirst({
//     where: { stripeSessionId, stripeSessionExpiredAt: { gt: new Date() } },
//     include: { orderItems: true },
//   });

export const updateOrder = async (id, data) => await prisma.order.update({ where: { id }, data });
