export async function withTimeout<T>(promise: Promise<T>, ms = 15000, context = "Request"): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${context} timed out after ${ms}ms. Please check your connection and try again.`)), ms)
    ),
  ]);
}

export function errorMessage(e: unknown, fallback = "Something went wrong"): string {
  if (e instanceof Error) return e.message;
  return String(e) || fallback;
}




