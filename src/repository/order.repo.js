import prisma from "../config/prisma.js";
import { OrderStatus } from "../../generated/prisma/index.js";

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
    select: { stripePaymentUrl: true },
  });

export const findByIdWithPendingStatus = async (id) =>
  await prisma.order.findFirst({
    where: { id, status: OrderStatus.PENDING },
  });

export const findBySessionId = async (stripeSessionId) =>
  await prisma.order.findFirst({
    where: { stripeSessionId },
    select: { status: true, id: true, stripeSessionId: true },
  });

export const findByIntentId = async (stripeIntentId) =>
  await prisma.order.findFirst({
    where: { stripeIntentId },
  });

export const updateOrder = async (id, data) => await prisma.order.update({ where: { id }, data });
