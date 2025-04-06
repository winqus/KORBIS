import { Container } from "../entities/index.ts";
import { Optional } from "../core/types.ts";

export interface ContainersRepository {
  create(data: Optional<Container, "id" | "type">): Promise<Container>;

  createWithImage(
    data: Optional<Container, "id" | "type">,
    imageBase64: string,
  ): Promise<Container & Pick<Container, "imageId">>;

  findById(id: string): Promise<Container | null>;

  delete(id: string): Promise<void>;

  update(id: string, data: Partial<Container>): Promise<Container | null>
}
