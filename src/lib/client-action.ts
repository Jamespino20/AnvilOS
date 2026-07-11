export type ActionResult<T> = T | { error: string };

export async function callAction<T>(promise: Promise<ActionResult<T>>): Promise<T> {
  const result = await promise;
  if (result && typeof result === "object" && "error" in result) {
    throw new Error((result as { error: string }).error);
  }
  return result as T;
}
