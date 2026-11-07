import { expect, test } from "vitest";
import { pinLocked } from "./pin-limit";

test("the admin PIN locks one address after 10 and everyone after 50 in an hour", () => {
  expect(pinLocked({ here: 9, everywhere: 49 })).toBe(false);
  expect(pinLocked({ here: 10, everywhere: 10 })).toBe(true);
  expect(pinLocked({ here: 1, everywhere: 50 })).toBe(true);
});
