import prisma from "../config/prisma.js";

export const findById = async (id) => await prisma.user.findFirst({ where: { id } });

export const update = async (id, data) => await prisma.user.update({ where: { id }, data });
