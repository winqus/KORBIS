import "npm:reflect-metadata@0.2.2";
import {
  ItemsRepository,
  SearchItemsProps,
} from "../interfaces/ItemsRepository.ts";
import { WeaviateClient } from "npm:weaviate-ts-client@2.2.0";
import { WeaviateV2BaseRepository } from "./WeaviateV2BaseRepository.ts";
import { ItemEntity } from "../entities/Item.ts";
import { itemSchema } from "../schema/index.ts";
import {
  WeaviateNearImageSearchResult,
  WeaviateScoredSearchResult,
} from "./index.ts";

export class WeaviateV2ItemsRepository
  extends WeaviateV2BaseRepository<ItemEntity>
  implements ItemsRepository {
  constructor(client: WeaviateClient) {
    super(client, itemSchema.class, itemSchema, ItemEntity);
  }

  public paginate(
    _options: { limit?: number; skip?: number },
  ): Promise<ItemEntity[]> {
    throw new Error("Method not implemented.");
  }

  public async findAll(): Promise<ItemEntity[]> {
    return await this.findMany({
      limit: 100,
      offset: 0,
      fields: "name description imageID _additional{id}",
    });
  }

  public async search(
    query: SearchItemsProps,
  ): Promise<Array<ItemEntity & { score: number }>> {
    try {
      const { queryText, queryImageBase64 } = query;
      if (!queryText && !queryImageBase64) {
        throw new Error(
          "Either queryText or queryImageBase64 must be provided",
        );
      }

      const imageBasedResults: WeaviateScoredSearchResult<ItemEntity>[] = [];
      if (queryImageBase64 && queryImageBase64.length > 0) {
        this.log(
          "search",
          "searching by image:",
          queryImageBase64.slice(0, 20),
        );

        const result = await this.client.graphql.get()
          .withClassName("Item")
          .withFields("name description imageID _additional{id distance}")
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
          item: WeaviateNearImageSearchResult<ItemEntity>,
        ) => ({
          ...item,
          _additional: {
            id: item._additional.id,
            score: 1 - item._additional.distance,
          },
        }));

        imageBasedResults.push(...rawItems);
      }

      const textBasedResults: WeaviateScoredSearchResult<ItemEntity>[] = [];
      if (queryText && queryText.trim().length > 0) {
        this.log("search", "searching by text:", queryText.slice(0, 20));

        const result = await this.client.graphql.get()
          .withClassName("Item")
          .withFields(
            "name description imageID _additional{id score}",
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
          (item: WeaviateScoredSearchResult<ItemEntity>) => ({
            ...item,
            _additional: {
              id: item._additional.id,
              score: +item._additional.score, /* Convert string to number */
            },
          } satisfies WeaviateScoredSearchResult<ItemEntity>),
        );

        textBasedResults.push(...rawItems);
      }

      const idToBestScoredItem = new Map<
        string,
        WeaviateScoredSearchResult<ItemEntity>
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
      } satisfies ItemEntity & { score: number }));

      this.log("search", "items found:", items.length);

      return items;
    } catch (error) {
      this.error("search", error);
      throw error;
    }
  }
}
