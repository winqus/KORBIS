export class MissingEnvVariableError extends Error {
  constructor(variableName: string) {
    super(`Missing environment variable: ${variableName}`);
    this.name = "MissingEnvVariableError";
  }
}
