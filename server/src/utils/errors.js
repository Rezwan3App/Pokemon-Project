/** Express error helper with HTTP status */
export function httpError(message, status = 500) {
  const err = new Error(message);
  err.status = status;
  return err;
}
