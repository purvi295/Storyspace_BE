// Matches canonical v1-v5 UUIDs (gen_random_uuid() produces v4).
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Returns true when the value looks like a UUID. Used to decide whether an
 * identifier from a request should be resolved as a user_uuid (vs. a username).
 */
export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}
