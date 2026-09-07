import { expect, test } from "vitest";

test("DATABASE_URL reaches the test process", () => {
  expect(process.env.DATABASE_URL).toMatch(/^postgres:\/\//);
});
