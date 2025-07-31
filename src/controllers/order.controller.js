import * as orderService from "../services/order.service.js";

export const createNewOrder = async (req, res, next) => {
  try {
    const url = await orderService.createNewOrder(req.body);
    res.json(url);
  } catch (error) {
    next(error);
  }
};

export const getAllOrders = async (_req, res, next) => {
  try {
    const orders = await orderService.getAllOrders();
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

export const getOrderPaymentUrl = async (req, res, next) => {
  try {
    const { id } = req.params;
    const url = await orderService.getOrderPaymentUrl(id);
    res.json(url);
  } catch (error) {
    next(error);
  }
};

export const checkOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await orderService.getOrderBySessionId(id);
    res.json(order);
  } catch (error) {
    next(error);
  }
};

export const cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await orderService.cancelOrder(id);
    res.json(order);
  } catch (error) {
    next(error);
  }
};

export const createNewSubOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const url = await orderService.createNewSubOrder(id);
    res.json(url);
  } catch (error) {
    next(error);
  }
};
