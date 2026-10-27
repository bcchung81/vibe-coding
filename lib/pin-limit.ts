// How many wrong 4-digit PINs before the door shuts. The course PIN is shared by a classroom behind one address, so it is generous;
// the admin PIN guards the roster, written answers and wipe-all, so it is tight per address and capped across all addresses too.
export type PinKind = "course" | "admin";
export type PinFailures = { here: number; everywhere: number }; // this address in the last 10 minutes · all addresses in the last hour

export const PIN_LIMITS: Record<PinKind, PinFailures> = {
  course: { here: 30, everywhere: Infinity },
  admin: { here: 10, everywhere: 50 },
};

export function pinLocked(kind: PinKind, failures: PinFailures) {
  const limit = PIN_LIMITS[kind];
  return failures.here >= limit.here || failures.everywhere >= limit.everywhere;
}
