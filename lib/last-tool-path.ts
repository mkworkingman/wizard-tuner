/**
 * Remembers the last tool page the user was on, so the home page can move focus
 * back to the link that leads there. Module state: it survives client-side
 * navigations and is reset by a full reload.
 */
let lastToolPath: string | null = null;

export function rememberToolPath(path: string) {
  lastToolPath = path;
}

/** Returns the remembered path once, then forgets it. */
export function takeToolPath() {
  const path = lastToolPath;
  lastToolPath = null;
  return path;
}
