export class BadRequestError extends Error {
  constructor(errors: Record<string, string | number | boolean>) {
    super(JSON.stringify(errors));
    this.name = "BadRequestError";
  }
}
