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

const SCORE_THRESHOLD = 0.4;
const IMAGE_SEARCH_SCORE_THRESHOLD = 0.8;
const DEFAULT_PAGINATION_LIMIT = 50;
const FIND_ALL_LIMIT = 100;
const SEARCH_RESULTS_LIMIT = 10;
const MAX_FINAL_RESULTS = 20;
const HYBRID_SEARCH_ALPHA = 0.5;
const NAME_BOOST_FACTOR = 4;
const DESCRIPTION_BOOST_FACTOR = 2;
const SEARCH_PROPERTIES = {
  NAME: "name",
  DESCRIPTION: "description",
} as const;

@injectable()
export class WeaviateV2ItemsRepository extends WeaviateV2BaseRepository<Item>
  implements ItemsRepository {
  protected readonly assetType = "item";
  protected readonly classProperties = itemSchema.properties.map((property) =>
    property.name
  ).filter((property) => property !== "image");

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

  public async paginate(
    options: {
      limit?: number;
      skip?: number;
      ownerId: string;
      parentId?: string;
    },
  ): Promise<Item[]> {
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
      this.error("paginate", "Failed retrieving items:", error?.message);
      return [];
    }
  }

  public async findAll(): Promise<Item[]> {
    return await this.findMany({
      limit: FIND_ALL_LIMIT,
      offset: 0,
      fields: `${this.classProperties} _additional{id}`,
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
          .withFields(`${this.classProperties} _additional{id distance}`)
          .withNearImage({ image: queryImageBase64 })
          .withLimit(SEARCH_RESULTS_LIMIT)
          .do();

        this.log(
          "search",
          "founds by image items:",
          result.data.Get.Item.length,
        );

        const rawItems = (result.data.Get.Item || [])
          .map((item: WeaviateNearImageSearchResult<Item>) => ({
            ...item,
            _additional: {
              id: item._additional.id,
              score: 1 - item._additional.distance,
            },
          }))
          .filter((item: WeaviateScoredSearchResult<Item>) =>
            item._additional.score >= IMAGE_SEARCH_SCORE_THRESHOLD
          );

        imageBasedResults.push(...rawItems);
      }

      const textBasedResults: WeaviateScoredSearchResult<Item>[] = [];
      if (queryText && queryText.trim().length > 0) {
        this.log("search", "searching by text:", queryText.slice(0, 20));

        const result = await this.client.graphql.get()
          .withClassName("Item")
          .withFields(
            `${this.classProperties} _additional{id score}`,
          )
          .withHybrid({
            query: queryText,
            properties: [
              `${SEARCH_PROPERTIES.NAME}^${NAME_BOOST_FACTOR}`,
              `${SEARCH_PROPERTIES.DESCRIPTION}^${DESCRIPTION_BOOST_FACTOR}`,
            ],
            alpha: HYBRID_SEARCH_ALPHA,
          })
          .withLimit(SEARCH_RESULTS_LIMIT)
          .do();

        this.log(
          "search",
          "founds by text items:",
          result.data.Get.Item.length,
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

      const filteredResults = sortedResults
        .filter((item) => {
          const score = item._additional.score;
          const threshold = imageBasedResults.some((img) =>
              img._additional.id === item._additional.id
            )
            ? IMAGE_SEARCH_SCORE_THRESHOLD
            : SCORE_THRESHOLD;
          return score && score >= threshold;
        });

      const finalResults = filteredResults.slice(0, MAX_FINAL_RESULTS);

      const items = finalResults.map((
        item,
      ) => ({
        id: item._additional.id,
        name: item.name,
        description: item.description,
        imageId: item.imageId,
        score: item._additional.score,
        ownerId: item.ownerId,
        type: item.type,
        parentName: item.parentName,
        parentId: item.parentId,
        parentType: item.parentType,
        quantity: item.quantity,
      } satisfies Item & { score: number }));

      this.log("search", "items found:", items.length);

      return items;
    } catch (error) {
      this.error("search", error);
      throw error;
    }
  }
}
