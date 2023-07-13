const RE_REGEXP_CHAR = /[$()*+.?[\\\]^{|}]/gu;
const RE_HAS_REGEXP_CHAR = new RegExp(RE_REGEXP_CHAR.source);

// eslint-disable-next-line regexp/no-super-linear-backtracking -- ignore
const RE_REGEXP_STR = /^\/(.+)\/(.*)$/u;

/**
 * Escapes the `RegExp` special characters "^", "$", "\", ".", "*", "+",
 * "?", "(", ")", "[", "]", "{", "}", and "|" in `string`.
 */
export function escapeString(string: string): string {
  return string && RE_HAS_REGEXP_CHAR.test(string)
    ? string.replace(RE_REGEXP_CHAR, "\\$&")
    : string;
}

/**
 * Convert a string to the `RegExp`.
 * Normal strings (e.g. `"foo"`) is converted to `/^foo$/` of `RegExp`.
 * Strings like `"/^foo/i"` are converted to `/^foo/i` of `RegExp`.
 */
export function toRegExp(string: string, flags?: string): RegExp {
  const parts = RE_REGEXP_STR.exec(string);
  if (parts) {
    return new RegExp(parts[1], parts[2]);
  }
  return new RegExp(`^${escapeString(string)}$`, flags);
}

/** Checks whether given string is regexp string */
export function isRegExp(string: string): boolean {
  return RE_REGEXP_STR.test(string);
}
