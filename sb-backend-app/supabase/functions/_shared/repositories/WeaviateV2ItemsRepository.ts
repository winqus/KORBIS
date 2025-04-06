import "npm:reflect-metadata@0.2.2";
import {
  ItemsRepository,
  SearchItemsProps,
} from "../interfaces/ItemsRepository.ts";
import { WeaviateClient } from "npm:weaviate-ts-client@2.2.0";
import { WeaviateV2BaseRepository } from "./WeaviateV2BaseRepository.ts";
import { Item } from "../entities/index.ts";
import { itemSchema } from "../schema/index.ts";
import { Optional } from "../core/types.ts";
import {
  WeaviateNearImageSearchResult,
  WeaviateScoredSearchResult,
} from "./index.ts";
import { randomUUID } from "../utils.ts";
import { inject, injectable } from "@needle-di/core";
import { WEAVIATE_CLIENT } from "../injection-tokens.ts";

@injectable()
export class WeaviateV2ItemsRepository extends WeaviateV2BaseRepository<Item>
  implements ItemsRepository {
  protected readonly assetType = "item";

  constructor(client: WeaviateClient = inject(WEAVIATE_CLIENT)) {
    super(client, itemSchema.class, itemSchema, Item);
  }

  public override create(data: Optional<Item, "id" | "type">): Promise<Item> {
    return super.create({
      ...data,
      type: this.assetType,
    });
  }

  public async createWithImage(
    data: Optional<Item, "id" | "type">,
    imageBase64?: string,
  ): Promise<Item> {
    const imageId = imageBase64 ? randomUUID() : undefined;

    const creator = this.client.data.creator()
      .withClassName(this.className)
      .withProperties(
        {
          ...data,
          imageId: imageId,
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

  public paginate(
    options: { limit?: number; skip?: number },
  ): Promise<Item[]> {
    return this.findMany({
      limit: options.limit || 50,
      offset: options.skip || 0,
      fields: "name description imageId _additional{id}",
    });
  }

  public async findAll(): Promise<Item[]> {
    return await this.findMany({
      limit: 100,
      offset: 0,
      fields: "name description imageId _additional{id}",
    });
  }

  public async search(
    query: SearchItemsProps,
  ): Promise<Array<Item & { score: number }>> {
    try {
      const { queryText, queryImageBase64 } = query;
      if (!queryText && !queryImageBase64) {
        throw new Error(
          "Either queryText or queryImageBase64 must be provided",
        );
      }

      const imageBasedResults: WeaviateScoredSearchResult<Item>[] = [];
      if (queryImageBase64 && queryImageBase64.length > 0) {
        this.log(
          "search",
          "searching by image:",
          queryImageBase64.slice(0, 20),
        );

        const result = await this.client.graphql.get()
          .withClassName("Item")
          .withFields("name description imageId _additional{id distance}")
          .withNearImage({ image: queryImageBase64 })
          .withLimit(10)
          .do();

        this.log(
          "search",
          "founds by image items:",
          result.data.Get.Item.length,
        );

        this.log(
          "search",
          "founds by image items:",
          result.data.Get.Item,
        );

        const rawItems = (result.data.Get.Item || []).map((
          item: WeaviateNearImageSearchResult<Item>,
        ) => ({
          ...item,
          _additional: {
            id: item._additional.id,
            score: 1 - item._additional.distance,
          },
        }));

        imageBasedResults.push(...rawItems);
      }

      const textBasedResults: WeaviateScoredSearchResult<Item>[] = [];
      if (queryText && queryText.trim().length > 0) {
        this.log("search", "searching by text:", queryText.slice(0, 20));

        const result = await this.client.graphql.get()
          .withClassName("Item")
          .withFields(
            "name description imageId _additional{id score}",
          )
          .withHybrid({
            query: queryText,
            properties: ["name^3", "description^2"],
            alpha: 0.25,
          })
          .withLimit(10)
          .do();

        this.log(
          "search",
          "founds by text items:",
          result.data.Get.Item.length,
        );

        this.log(
          "search",
          "founds by text items:",
          result.data.Get.Item,
        );

        const rawItems = (result.data.Get.Item || []).map(
          (item: WeaviateScoredSearchResult<Item>) => ({
            ...item,
            _additional: {
              id: item._additional.id,
              score: +item._additional.score, /* Convert string to number */
            },
          } satisfies WeaviateScoredSearchResult<Item>),
        );

        textBasedResults.push(...rawItems);
      }

      const idToBestScoredItem = new Map<
        string,
        WeaviateScoredSearchResult<Item>
      >();
      for (const item of [...imageBasedResults, ...textBasedResults]) {
        const id = item._additional.id;
        const existing = idToBestScoredItem.get(id);

        if (!existing || item._additional.score > existing._additional.score) {
          idToBestScoredItem.set(id, item);
        }
      }

      const uniqueResults = Array.from(idToBestScoredItem.values());

      const sortedResults = uniqueResults.sort((a, b) => {
        if (a._additional.score && b._additional.score) {
          return b._additional.score - a._additional.score;
        }

        return 0;
      });

      const items = sortedResults.map((
        item,
      ) => ({
        id: item._additional.id,
        name: item.name,
        description: item.description,
        imageId: item.imageId,
        score: item._additional.score,
        ownerId: item.ownerId,
        type: item.type,
      } satisfies Item & { score: number }));

      this.log("search", "items found:", items.length);

      return items;
    } catch (error) {
      this.error("search", error);
      throw error;
    }
  }
}
