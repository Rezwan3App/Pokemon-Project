/** Format Date as YYYY-MM-DD for daily price snapshots */
export function toDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

/** Parse date key back to Date at noon UTC */
export function fromDateKey(key) {
  return new Date(`${key}T12:00:00.000Z`);
}

/** Days between two date keys */
export function daysBetween(startKey, endKey) {
  const ms = fromDateKey(endKey) - fromDateKey(startKey);
  return Math.round(ms / (1000 * 60 * 60 * 24));
}
