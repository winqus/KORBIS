export class NoPermissionError extends Error {
  constructor() {
    super("You're not allowed to perform this action.");
    this.name = "NoPermission";
  }
}
