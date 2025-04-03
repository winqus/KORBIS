import { ConfigService } from "../interfaces/ConfigService.ts";
import { MissingEnvVariableError } from "../errors/MissingEnvVariableError.ts";

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
