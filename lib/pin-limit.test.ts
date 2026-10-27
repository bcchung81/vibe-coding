import { expect, test } from "vitest";
import { pinLocked } from "./pin-limit";

test("the course PIN allows a classroom's worth of slips from one address", () => {
  expect(pinLocked("course", { here: 29, everywhere: 500 })).toBe(false);
  expect(pinLocked("course", { here: 30, everywhere: 30 })).toBe(true);
});

test("the admin PIN locks one address after 10 and everyone after 50 in an hour", () => {
  expect(pinLocked("admin", { here: 9, everywhere: 49 })).toBe(false);
  expect(pinLocked("admin", { here: 10, everywhere: 10 })).toBe(true);
  expect(pinLocked("admin", { here: 1, everywhere: 50 })).toBe(true);
});
