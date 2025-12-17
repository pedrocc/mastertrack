import { describe, expect, it } from "bun:test";
import {
  capitalize,
  delay,
  formatDate,
  formatDateTime,
  generateId,
  paginate,
  removeUndefined,
  truncate,
} from "../utils";

describe("utils", () => {
  describe("generateId", () => {
    it("generates a unique id", () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });

    it("generates id with correct length (UUID v4 format)", () => {
      const id = generateId();
      expect(id.length).toBe(36);
    });

    it("generates valid UUID v4 format", () => {
      const id = generateId();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(uuidRegex.test(id)).toBe(true);
    });
  });

  describe("capitalize", () => {
    it("capitalizes first letter", () => {
      expect(capitalize("hello")).toBe("Hello");
    });

    it("lowercases rest of string", () => {
      expect(capitalize("HELLO")).toBe("Hello");
    });

    it("handles single character", () => {
      expect(capitalize("a")).toBe("A");
    });

    it("handles empty string", () => {
      expect(capitalize("")).toBe("");
    });

    it("handles mixed case", () => {
      expect(capitalize("hELLo WoRLD")).toBe("Hello world");
    });
  });

  describe("truncate", () => {
    it("truncates long strings", () => {
      expect(truncate("Hello World", 5)).toBe("Hello...");
    });

    it("does not truncate short strings", () => {
      expect(truncate("Hi", 10)).toBe("Hi");
    });

    it("does not truncate strings at exact length", () => {
      expect(truncate("Hello", 5)).toBe("Hello");
    });

    it("handles empty string", () => {
      expect(truncate("", 5)).toBe("");
    });

    it("handles zero length", () => {
      expect(truncate("Hello", 0)).toBe("...");
    });
  });

  describe("paginate", () => {
    it("creates paginated response", () => {
      const data = [{ id: 1 }, { id: 2 }];
      const result = paginate(data, 1, 10, 50);

      expect(result).toEqual({
        data,
        pagination: {
          page: 1,
          pageSize: 10,
          total: 50,
          totalPages: 5,
        },
      });
    });

    it("calculates totalPages correctly with remainder", () => {
      const result = paginate([], 1, 10, 25);
      expect(result.pagination.totalPages).toBe(3);
    });

    it("handles empty data", () => {
      const result = paginate([], 1, 10, 0);
      expect(result.pagination.totalPages).toBe(0);
    });

    it("handles single page", () => {
      const result = paginate([1, 2, 3], 1, 10, 3);
      expect(result.pagination.totalPages).toBe(1);
    });
  });

  describe("delay", () => {
    it("delays for specified time", async () => {
      const start = Date.now();
      await delay(50);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(45);
    });

    it("resolves with undefined", async () => {
      const result = await delay(1);
      expect(result).toBeUndefined();
    });
  });

  describe("removeUndefined", () => {
    it("removes undefined properties", () => {
      const obj = { a: 1, b: undefined, c: "hello" };
      const result = removeUndefined(obj);
      expect(result).toEqual({ a: 1, c: "hello" });
    });

    it("keeps null properties", () => {
      const obj = { a: 1, b: null, c: undefined };
      const result = removeUndefined(obj);
      expect(result).toEqual({ a: 1, b: null });
    });

    it("returns empty object when all undefined", () => {
      const obj = { a: undefined, b: undefined };
      const result = removeUndefined(obj);
      expect(result).toEqual({});
    });

    it("returns same values when no undefined", () => {
      const obj = { a: 1, b: "test", c: false };
      const result = removeUndefined(obj);
      expect(result).toEqual({ a: 1, b: "test", c: false });
    });

    it("handles empty object", () => {
      const result = removeUndefined({});
      expect(result).toEqual({});
    });
  });

  describe("formatDate", () => {
    it("formats Date object", () => {
      const date = new Date("2024-03-15T10:30:00Z");
      const result = formatDate(date, "pt-BR");
      expect(result).toMatch(/15/);
      expect(result).toMatch(/03/);
      expect(result).toMatch(/2024/);
    });

    it("formats date string", () => {
      const result = formatDate("2024-12-25", "pt-BR");
      expect(result).toMatch(/25/);
      expect(result).toMatch(/12/);
      expect(result).toMatch(/2024/);
    });

    it("uses default locale pt-BR", () => {
      const date = new Date("2024-01-01");
      const result = formatDate(date);
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("formatDateTime", () => {
    it("formats Date object with time", () => {
      const date = new Date("2024-03-15T14:30:00");
      const result = formatDateTime(date, "pt-BR");
      expect(result).toMatch(/15/);
      expect(result).toMatch(/03/);
      expect(result).toMatch(/2024/);
      expect(result).toMatch(/14/);
      expect(result).toMatch(/30/);
    });

    it("formats date string with time", () => {
      const result = formatDateTime("2024-12-25T09:15:00", "pt-BR");
      expect(result).toMatch(/25/);
      expect(result).toMatch(/12/);
      expect(result).toMatch(/2024/);
    });

    it("uses default locale pt-BR", () => {
      const date = new Date("2024-01-01T12:00:00");
      const result = formatDateTime(date);
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
