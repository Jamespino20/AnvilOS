const MAX_BODY_SIZE = 10 * 1024;
const MAX_STRING_LENGTH = 255;
const MAX_PASSWORD_LENGTH = 128;
const MAX_EMAIL_LENGTH = 254;

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export function sanitizeString(input: unknown, maxLength = MAX_STRING_LENGTH): string {
  if (typeof input !== "string") throw new ValidationError("Expected a string value");
  const cleaned = input.replace(/<[^>]*>/g, "").trim();
  if (cleaned.length > maxLength) throw new ValidationError(`String exceeds maximum length of ${maxLength}`);
  return cleaned;
}

export function sanitizeEmail(input: unknown): string {
  const email = sanitizeString(input, MAX_EMAIL_LENGTH);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ValidationError("Invalid email format");
  return email;
}

export function sanitizePassword(input: unknown): string {
  if (typeof input !== "string") throw new ValidationError("Password must be a string");
  if (input.length < 6) throw new ValidationError("Password must be at least 6 characters");
  if (input.length > MAX_PASSWORD_LENGTH) throw new ValidationError(`Password exceeds maximum length of ${MAX_PASSWORD_LENGTH}`);
  return input;
}

export function validateBody(req: Request, body: any, requiredFields: string[]) {
  const bodyStr = JSON.stringify(body);
  if (bodyStr.length > MAX_BODY_SIZE) throw new ValidationError("Payload too large");

  for (const field of requiredFields) {
    if (body[field] === undefined || body[field] === null || String(body[field]).trim() === "") {
      throw new ValidationError(`${field} is required`);
    }
  }
}

export function safeJsonParse(text: string): any {
  if (text.length > MAX_BODY_SIZE) throw new ValidationError("Payload too large");
  try {
    return JSON.parse(text);
  } catch {
    throw new ValidationError("Malformed JSON payload");
  }
}
