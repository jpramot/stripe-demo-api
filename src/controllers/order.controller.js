import * as orderService from "../services/order.service.js";

export const createNewOrder = async (req, res, next) => {
  try {
    res.json({ url: "http://localhost:5173" });
  } catch (error) {
    next(error);
  }
};

export const getAllOrders = async (_req, res, next) => {
  try {
    res.json({ orders: [] });
  } catch (error) {
    next(error);
  }
};

export const getOrderPaymentUrl = async (req, res, next) => {
  try {
    res.json({ url: "http://localhost:5173" });
  } catch (error) {
    next(error);
  }
};

export const checkOrderStatus = async (req, res, next) => {
  try {
    res.json({ order: {} });
  } catch (error) {
    next(error);
  }
};

export const cancelOrder = async (req, res, next) => {
  try {
    res.json({ order: {} });
  } catch (error) {
    next(error);
  }
};

export const createNewSubOrder = async (req, res, next) => {
  try {
    res.json({ url: "http://localhost:5173" });
  } catch (error) {
    next(error);
  }
};
