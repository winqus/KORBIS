import { WeaviateClient } from "npm:weaviate-ts-client@2.2.0";
import { WeaviateV2BaseRepository } from "./WeaviateV2BaseRepository.ts";
import { Container } from "../entities/index.ts";
import { containerSchema } from "../schema/index.ts";
import { inject, injectable } from "@needle-di/core";
import { WEAVIATE_CLIENT } from "../injection-tokens.ts";
import { ContainersRepository } from "../interfaces/index.ts";
import { Optional } from "../core/index.ts";
import { randomUUID } from "../utils.ts";

@injectable()
export class WeaviateV2ContainersRepository
  extends WeaviateV2BaseRepository<Container>
  implements ContainersRepository {
  protected readonly assetType = "container";

  constructor(client: WeaviateClient = inject(WEAVIATE_CLIENT)) {
    super(client, containerSchema.class, containerSchema, Container);
  }

  public override create(
    data: Optional<Container, "id" | "type">,
  ): Promise<Container> {
    return super.create({
      ...data,
      type: this.assetType,
    });
  }

  public async createWithImage(
      data: Optional<Container, "id" | "type">,
      imageBase64?: string,
    ): Promise<Container> {
      const imageId = imageBase64 ? randomUUID() : undefined;
  
      const creator = this.client.data.creator()
        .withClassName(this.className)
        .withProperties({
          ...data,
          imageId: imageId,
          image: imageBase64 || undefined,
          type: this.assetType,
        });
  
      const newObject = await creator.do()
        .catch(async (error) => {
          if (this.isClassNotFoundInSchemaError(error)) {
            await this.initializeClass();
  
            return creator.do();
          }
  
          throw error;
        });
  
      return this.mapObject2Entity(newObject);
    }
}
