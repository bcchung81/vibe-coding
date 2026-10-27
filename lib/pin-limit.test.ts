import { expect, test } from "vitest";
import { adminAtLogin, pinLocked } from "./pin-limit";

test("the course PIN allows a classroom's worth of slips from one address", () => {
  expect(pinLocked("course", { here: 29, everywhere: 500 })).toBe(false);
  expect(pinLocked("course", { here: 30, everywhere: 30 })).toBe(true);
});

test("the admin PIN locks one address after 10 and everyone after 50 in an hour", () => {
  expect(pinLocked("admin", { here: 9, everywhere: 49 })).toBe(false);
  expect(pinLocked("admin", { here: 10, everywhere: 10 })).toBe(true);
  expect(pinLocked("admin", { here: 1, everywhere: 50 })).toBe(true);
});

test("the login screen tries the admin PIN only while its own wrong PINs stay under the admin limits", () => {
  const none = { here: 0, everywhere: 0 };
  expect(adminAtLogin({ here: 9, everywhere: 49 }, none)).toBe(true);
  expect(adminAtLogin({ here: 10, everywhere: 10 }, none)).toBe(false);
  expect(adminAtLogin({ here: 0, everywhere: 50 }, none)).toBe(false);
  expect(adminAtLogin(none, { here: 10, everywhere: 10 })).toBe(false);
});
