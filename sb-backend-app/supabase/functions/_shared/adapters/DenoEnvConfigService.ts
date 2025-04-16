import { injectable } from "@needle-di/core";
import { ConfigService } from "../interfaces/index.ts";
import { MissingEnvVariableError } from "../errors/index.ts";

// @injectable()
export class DenoEnvConfigService implements ConfigService {
  public get(key: string): string | null {
    return Deno.env.get(key) || null;
  }

  public getOrThrow(key: string): string {
    const value = this.get(key);
    if (!value) {
      throw new MissingEnvVariableError(key);
    }
    return value;
  }
}
