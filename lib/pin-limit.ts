// How many wrong 4-digit admin PINs before the door shuts: tight per address and capped across all addresses too,
// since the admin screen can wipe the database.
export type PinFailures = { here: number; everywhere: number }; // this address in the last 10 minutes · all addresses in the last hour

export const PIN_LIMIT: PinFailures = { here: 10, everywhere: 50 };

export function pinLocked(failures: PinFailures) {
  return failures.here >= PIN_LIMIT.here || failures.everywhere >= PIN_LIMIT.everywhere;
}
