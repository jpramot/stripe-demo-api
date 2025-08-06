import prisma from "../config/prisma.js";

export const create = async (data) => await prisma.subscription.create({ data });

export const upsert = async (data) =>
  await prisma.subscription.upsert({ where: { id: data.id }, update: data, create: data });

export const update = async (id, data) => await prisma.subscription.update({ where: { id }, data });

export const findBySessionId = async (stripeSessionId) =>
  await prisma.subscription.findFirst({ where: { stripeSessionId } });

export const findByUserId = async (userId) =>
  await prisma.subscription.findFirst({ where: { userId } });

export const findById = async (id) => await prisma.subscription.findFirst({ where: { id } });
