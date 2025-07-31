import prisma from "../config/prisma.js";

export const create = async (data) => await prisma.subscription.create({ data });
