export interface ConfigService {
  get(key: string): string | null;
  getOrThrow(key: string): string;
}
