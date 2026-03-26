import { Request, Response, NextFunction } from "express";
import OrderModel from "../models/order.model";
import { PaginationQuery, PaginatedResponse } from "../types/pagination.types";
import { Order, CreateOrderDTO, UpdateOrderDTO } from "../types/order.types";
import {
  parsePaginationParams,
  buildPaginationMeta,
} from "../utils/pagination.util";

export const getOrders = async (
  req: Request<
    Record<string, never>,
    Record<string, never>,
    Record<string, never>,
    PaginationQuery
  >,
  res: Response<PaginatedResponse<Order>>,
  next: NextFunction,
): Promise<void> => {
  try {
    const { page, limit, offset } = parsePaginationParams(req.query);

    const { orders, total } = await OrderModel.findAll(limit, offset);

    const paginationMeta = buildPaginationMeta(page, limit, total);

    res.status(200).json({
      data: orders,
      pagination: paginationMeta,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id) || id <= 0) {
      res.status(400).json({
        error: "Bad Request",
        message: "Invalid order ID",
      });
      return;
    }

    const order = await OrderModel.findById(id);

    if (!order) {
      res.status(404).json({
        error: "Not Found",
        message: "Order not found",
      });
      return;
    }

    res.status(200).json({ data: order });
  } catch (error) {
    next(error);
  }
};

export const createOrder = async (
  req: Request<Record<string, never>, Record<string, never>, CreateOrderDTO>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { user_id, total_amount, status } = req.body;

    // Basic validation
    if (!user_id || typeof user_id !== "number") {
      res.status(400).json({
        error: "Bad Request",
        message: "user_id is required and must be a number",
      });
      return;
    }

    if (!total_amount || typeof total_amount !== "number" || total_amount < 0) {
      res.status(400).json({
        error: "Bad Request",
        message: "total_amount is required and must be a positive number",
      });
      return;
    }

    const orderData: CreateOrderDTO = {
      user_id,
      total_amount,
      status,
    };

    const order = await OrderModel.create(orderData);

    res.status(201).json({
      data: order,
      message: "Order created successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrder = async (
  req: Request<{ id: string }, Record<string, never>, UpdateOrderDTO>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id) || id <= 0) {
      res.status(400).json({
        error: "Bad Request",
        message: "Invalid order ID",
      });
      return;
    }

    const { user_id, total_amount, status } = req.body;

    // Validate total_amount if provided
    if (
      total_amount !== undefined &&
      (typeof total_amount !== "number" || total_amount < 0)
    ) {
      res.status(400).json({
        error: "Bad Request",
        message: "total_amount must be a positive number",
      });
      return;
    }

    // Validate user_id if provided
    if (user_id !== undefined && typeof user_id !== "number") {
      res.status(400).json({
        error: "Bad Request",
        message: "user_id must be a number",
      });
      return;
    }

    const orderData: UpdateOrderDTO = {
      user_id,
      total_amount,
      status,
    };

    const order = await OrderModel.update(id, orderData);

    if (!order) {
      res.status(404).json({
        error: "Not Found",
        message: "Order not found",
      });
      return;
    }

    res.status(200).json({
      data: order,
      message: "Order updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const deleteOrder = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id) || id <= 0) {
      res.status(400).json({
        error: "Bad Request",
        message: "Invalid order ID",
      });
      return;
    }

    const deleted = await OrderModel.delete(id);

    if (!deleted) {
      res.status(404).json({
        error: "Not Found",
        message: "Order not found",
      });
      return;
    }

    res.status(200).json({
      message: "Order deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
