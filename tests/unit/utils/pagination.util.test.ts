import {
  parsePaginationParams,
  buildPaginationMeta,
} from "../../../src/utils/pagination.util";

describe("Pagination Utilities", () => {
  describe("parsePaginationParams", () => {
    it("should use default values when no params provided", () => {
      const result = parsePaginationParams({});

      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(0);
    });

    it("should parse valid page and limit", () => {
      const result = parsePaginationParams({ page: "2", limit: "20" });

      expect(result.page).toBe(2);
      expect(result.limit).toBe(20);
      expect(result.offset).toBe(20); // (2-1) * 20
    });

    it("should calculate correct offset", () => {
      const page3 = parsePaginationParams({ page: "3", limit: "10" });
      const page5 = parsePaginationParams({ page: "5", limit: "25" });

      expect(page3.offset).toBe(20); // (3-1) * 10
      expect(page5.offset).toBe(100); // (5-1) * 25
    });

    it("should enforce minimum page of 1", () => {
      const negative = parsePaginationParams({ page: "-5" });
      const zero = parsePaginationParams({ page: "0" });

      expect(negative.page).toBe(1);
      expect(zero.page).toBe(1);
    });

    it("should enforce minimum limit of 1", () => {
      const negative = parsePaginationParams({ limit: "-10" });
      const zero = parsePaginationParams({ limit: "0" });

      expect(negative.limit).toBe(1);
      expect(zero.limit).toBe(1);
    });

    it("should enforce maximum limit of 100", () => {
      const result = parsePaginationParams({ limit: "500" });

      expect(result.limit).toBe(100);
    });

    it("should handle non-numeric page values", () => {
      const result = parsePaginationParams({ page: "abc" });

      // parseInt("abc") = NaN, Math.max(NaN, 1) = NaN (not 1!)
      expect(result.page).toBeNaN();
    });

    it("should handle non-numeric limit values", () => {
      const result = parsePaginationParams({ limit: "xyz" });

      // parseInt("xyz") = NaN, Math.max/min with NaN = NaN
      expect(result.limit).toBeNaN();
    });

    it("should handle decimal page values", () => {
      const result = parsePaginationParams({ page: "3.7" });

      expect(result.page).toBe(3);
    });

    it("should handle decimal limit values", () => {
      const result = parsePaginationParams({ limit: "15.9" });

      expect(result.limit).toBe(15);
    });

    it("should handle edge case: page 1, limit 1", () => {
      const result = parsePaginationParams({ page: "1", limit: "1" });

      expect(result.page).toBe(1);
      expect(result.limit).toBe(1);
      expect(result.offset).toBe(0);
    });

    it("should handle edge case: large page number", () => {
      const result = parsePaginationParams({ page: "9999", limit: "10" });

      expect(result.page).toBe(9999);
      expect(result.offset).toBe(99980); // (9999-1) * 10
    });
  });

  describe("buildPaginationMeta", () => {
    it("should build correct meta for first page", () => {
      const meta = buildPaginationMeta(1, 10, 50);

      expect(meta.page).toBe(1);
      expect(meta.limit).toBe(10);
      expect(meta.totalItems).toBe(50);
      expect(meta.totalPages).toBe(5);
      expect(meta.hasNext).toBe(true);
      expect(meta.hasPrev).toBe(false);
    });

    it("should build correct meta for middle page", () => {
      const meta = buildPaginationMeta(3, 10, 50);

      expect(meta.page).toBe(3);
      expect(meta.totalPages).toBe(5);
      expect(meta.hasNext).toBe(true);
      expect(meta.hasPrev).toBe(true);
    });

    it("should build correct meta for last page", () => {
      const meta = buildPaginationMeta(5, 10, 50);

      expect(meta.page).toBe(5);
      expect(meta.totalPages).toBe(5);
      expect(meta.hasNext).toBe(false);
      expect(meta.hasPrev).toBe(true);
    });

    it("should handle single page results", () => {
      const meta = buildPaginationMeta(1, 10, 5);

      expect(meta.totalPages).toBe(1);
      expect(meta.hasNext).toBe(false);
      expect(meta.hasPrev).toBe(false);
    });

    it("should handle empty results", () => {
      const meta = buildPaginationMeta(1, 10, 0);

      expect(meta.totalItems).toBe(0);
      expect(meta.totalPages).toBe(0);
      expect(meta.hasNext).toBe(false);
      expect(meta.hasPrev).toBe(false);
    });

    it("should round up total pages for partial page", () => {
      const meta = buildPaginationMeta(1, 10, 25);

      expect(meta.totalPages).toBe(3); // 25 items / 10 per page = 2.5 → 3
    });

    it("should handle exact division of items", () => {
      const meta = buildPaginationMeta(1, 10, 30);

      expect(meta.totalPages).toBe(3); // 30 / 10 = 3 exactly
    });

    it("should handle page beyond total pages", () => {
      const meta = buildPaginationMeta(10, 10, 50);

      expect(meta.page).toBe(10);
      expect(meta.totalPages).toBe(5);
      expect(meta.hasNext).toBe(false); // Page 10 > 5 total pages
      expect(meta.hasPrev).toBe(true);
    });

    it("should handle large datasets", () => {
      const meta = buildPaginationMeta(50, 100, 10000);

      expect(meta.totalPages).toBe(100);
      expect(meta.hasNext).toBe(true);
      expect(meta.hasPrev).toBe(true);
    });

    it("should handle limit of 1", () => {
      const meta = buildPaginationMeta(2, 1, 10);

      expect(meta.totalPages).toBe(10);
      expect(meta.hasNext).toBe(true);
      expect(meta.hasPrev).toBe(true);
    });
  });
});
