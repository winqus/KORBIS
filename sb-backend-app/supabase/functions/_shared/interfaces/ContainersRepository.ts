import { Container } from "../entities/index.ts";
import { Optional } from "../core/types.ts";

export interface ContainersRepository {
  create(item: Optional<Container, "id" | "type">): Promise<Container>;

  findById(id: string): Promise<Container | null>;

  delete(id: string): Promise<void>;
}
