import {
  PaginationParams,
  PaginationMeta,
  PaginationQuery,
} from "../types/pagination.types";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

export const parsePaginationParams = (
  query: PaginationQuery,
): PaginationParams => {
  const page = Math.max(parseInt(query.page || String(DEFAULT_PAGE), 10), 1);
  const limit = Math.min(
    Math.max(parseInt(query.limit || String(DEFAULT_LIMIT), 10), 1),
    MAX_LIMIT,
  );
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

export const buildPaginationMeta = (
  page: number,
  limit: number,
  total: number,
): PaginationMeta => {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};
