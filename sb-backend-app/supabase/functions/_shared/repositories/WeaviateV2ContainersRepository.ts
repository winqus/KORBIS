import { WeaviateClient } from "npm:weaviate-ts-client@2.2.0";
import { WeaviateV2BaseRepository } from "./WeaviateV2BaseRepository.ts";
import { Container } from "../entities/index.ts";
import { containerSchema } from "../schema/index.ts";
import { inject, injectable } from "@needle-di/core";
import { WEAVIATE_CLIENT } from "../injection-tokens.ts";
import { ContainersRepository } from "../interfaces/index.ts";
import { Optional } from "../core/index.ts";
import { randomUUID } from "../utils.ts";
import { DEFAULT_PAGINATION_LIMIT } from "../config.ts";

// @injectable()
export class WeaviateV2ContainersRepository
  extends WeaviateV2BaseRepository<Container>
  implements ContainersRepository {
  protected readonly classProperties = containerSchema.properties.map((property) =>
    property.name
  ).filter((property) => property !== "image");
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
      .withProperties(
        {
          ...data,
          imageId,
          image: imageBase64 || undefined,
          type: this.assetType,
        } satisfies ((typeof data) & { image?: string }),
      );

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

  public async paginate(
    options: {
      limit?: number;
      skip?: number;
      ownerId: string;
      parentId?: string;
    },
  ): Promise<Container[]> {
    try {
      const { limit, skip, ownerId, parentId } = options;

      let query = this.client.graphql.get()
        .withClassName(this.className)
        .withFields(`${this.classProperties} _additional{id creationTimeUnix}`)
        .withLimit(limit || DEFAULT_PAGINATION_LIMIT)
        .withOffset(skip || 0)
        .withSort([{
          path: ["_creationTimeUnix"],
          order: "desc"
        }]);

      query = query.withWhere({
        path: ["ownerId"],
        operator: "Equal",
        valueString: ownerId,
      });

      if (parentId) {
        query = query.withWhere({
          path: ["parentId"],
          operator: "Equal",
          valueString: parentId,
        });
      }

      const objects = await query.do();

      if (!objects || !objects.data) {
        return [];
      }

      return this.mapObjects2Entities(
        objects.data.Get[this.className] || [],
      );
    } catch (error: any) {
      this.error("paginate", "Failed retrieving containers:", error?.message);
      return [];
    }
  }

  public async findByVisualCode(visualCode: string): Promise<Container | null> {
    if (!visualCode) {
      return null;
    }

    const object = await this.client.graphql.get()
      .withClassName(this.className)
      .withFields(`${this.classProperties} _additional{id creationTimeUnix}`)
      .withWhere({
        path: ["visualCode"],
        operator: "Equal",
        valueString: visualCode,
      }).do().catch((error) => {
        this.error("findByVisualCode", `Failed retrieving container with visual code (${visualCode}):`, error.message);
        throw error;
      });

    if (!object || !object.data || !object?.data?.Get[this.className][0]?.name) {
      return null;
    }

    return this.mapObject2Entity(object.data.Get[this.className][0]);
  }
}
