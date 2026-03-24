import { Request, Response, NextFunction } from "express";
import UserModel from "../models/user.model";
import { PaginationQuery, PaginatedResponse } from "../types/pagination.types";
import { User } from "../types/user.types";
import {
  parsePaginationParams,
  buildPaginationMeta,
} from "../utils/pagination.util";

export const getUsers = async (
  req: Request<
    Record<string, never>,
    Record<string, never>,
    Record<string, never>,
    PaginationQuery
  >,
  res: Response<PaginatedResponse<User>>,
  next: NextFunction,
): Promise<void> => {
  try {
    const { page, limit, offset } = parsePaginationParams(req.query);

    const { users, total } = await UserModel.findAll(limit, offset);

    const paginationMeta = buildPaginationMeta(page, limit, total);

    res.status(200).json({
      data: users,
      pagination: paginationMeta,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id) || id <= 0) {
      res.status(400).json({
        error: "Bad Request",
        message: "Invalid user ID",
      });
      return;
    }

    const user = await UserModel.findById(id);

    if (!user) {
      res.status(404).json({
        error: "Not Found",
        message: "User not found",
      });
      return;
    }

    res.status(200).json({ data: user });
  } catch (error) {
    next(error);
  }
};
