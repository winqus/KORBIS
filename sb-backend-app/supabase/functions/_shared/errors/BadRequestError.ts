export class BadRequestError extends Error {
  constructor(errors: Record<string, string | number | boolean> | string) {
    const message = typeof errors === "string"
      ? JSON.stringify({ message: errors })
      : JSON.stringify(errors);
    super(message);
    this.name = "BadRequestError";
  }
}
