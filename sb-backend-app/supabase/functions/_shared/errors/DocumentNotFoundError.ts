export class DocumentNotFoundError extends Error {
  constructor(name: string, id: string, message?: string) {
    super(JSON.stringify({ name, id, message }));
    this.name = "DocumentNotFound";
  }
}
