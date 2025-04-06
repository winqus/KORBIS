export class DocumentNotFoundError extends Error {
  constructor(name: string, id: string, message?: string) {
    message = message || `${name} not found`;
    super(JSON.stringify({ name, id, message }));
    this.name = "DocumentNotFound";
  }
}
