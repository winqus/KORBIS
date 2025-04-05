import { WeaviateClient } from "npm:weaviate-ts-client@2.2.0";
import { WeaviateV2BaseRepository } from "./WeaviateV2BaseRepository.ts";
import { Container } from "../entities/index.ts";
import { containerSchema } from "../schema/index.ts";
import { inject, injectable } from "@needle-di/core";
import { WEAVIATE_CLIENT } from "../injection-tokens.ts";
import { ContainersRepository } from "../interfaces/index.ts";
import { Optional } from "../core/index.ts";

@injectable()
export class WeaviateV2ContainersRepository
  extends WeaviateV2BaseRepository<Container>
  implements ContainersRepository {
  constructor(client: WeaviateClient = inject(WEAVIATE_CLIENT)) {
    super(client, containerSchema.class, containerSchema, Container);
  }

  public override create(
    item: Optional<Container, "id" | "type">,
  ): Promise<Container> {
    return super.create({
      ...item,
      type: "container",
    });
  }
}
