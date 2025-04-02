import {
  CreateItemProps,
  ItemsRepository,
  SearchItemsProps,
} from "../app/interfaces/ItemsRepository.ts";
import { Item } from "../core/types.ts";
import { WeaviateClient } from "npm:weaviate-ts-client@2.2.0";
import itemSchema from "../schema/ItemSchema.ts";

type WeaviateItemSearchResult = {
  name: string;
  description: string;
  imageID: string;
  _additional: { id: string };
};

type WeaviateNearImageItemSearchResult = WeaviateItemSearchResult & {
  _additional: { distance: number };
};

type WeaviateScoredItemSearchResult = WeaviateItemSearchResult & {
  _additional: { score: number };
};

export class WeaviateV2ItemsRepository implements ItemsRepository {
  private readonly className: string;

  constructor(private readonly client: WeaviateClient, className = "Item") {
    this.className = className;
  }

  public async create(item: CreateItemProps): Promise<Item> {
    try {
      if (!item) {
        throw new Error("Item cannot be null");
      }

      const imageID = item.imageBase64 ? crypto.randomUUID() : undefined;
      const itemCreator = this.client.data.creator()
        .withClassName(this.className)
        .withProperties({
          name: item.name,
          description: item.description,
          image: item.imageBase64 || undefined,
          imageID: imageID,
        });

      const result = await itemCreator.do()
        .catch(async (error) => {
          if (this.isClassNotFoundInSchemaError(error)) {
            await this.createDefaultClass();

            return itemCreator.do();
          }

          throw error;
        });

      if (!result || !result.id) {
        throw new Error("Failed to create item");
      }

      return {
        ID: result.id,
        name: item.name,
        description: item.description,
        imageID: imageID,
      };
    } catch (error) {
      this.error("create", error);
      throw error;
    }
  }

  private async createDefaultClass(): Promise<void> {
    try {
      const _newClass = await this.client
        .schema
        .classCreator()
        .withClass(itemSchema)
        .do();
    } catch (error) {
      this.error("createClass", "Error creating class:", error);
    }
  }

  public async findByID(ID: string): Promise<Item | null> {
    try {
      if (!ID) {
        throw new Error("ID cannot be null");
      }

      // TODO: Refactor to use the WeaviateClient's graphql `get` method instead of `getterById`
      //       to prevent image data from being returned in the response.
      const result = await this.client
        .data
        .getterById()
        .withClassName(this.className)
        .withId(ID)
        .do().catch((error) => {
          if (!this.isItemNotFoundError(error)) {
            this.error("findByID", error);
          }

          return null;
        });

      if (!result || !result.properties) {
        this.log("findByID", `Item with ID ${ID} not found`);

        return null;
      }

      const item: Item = {
        ID,
        name: result.properties.name as string,
        description: result.properties.description as string,
        imageID: result.properties.imageID as string | undefined,
      };

      return item;
    } catch (error) {
      this.error("findByID", error);

      return null;
    }
  }

  public async findAll(): Promise<Item[]> {
    try {
      const result = await this.client.graphql.get()
        .withClassName(this.className)
        .withFields("name description imageID _additional{id}")
        .withLimit(100)
        .do();

      const items = result.data.Get.Item as Array<
        {
          name: string;
          description: string;
          imageID: string;
          _additional: { id: string };
        }
      >;

      return items.map((item) => ({
        ID: item._additional.id,
        name: item.name,
        description: item.description,
        imageID: item.imageID,
      }));
    } catch (error) {
      this.error("findAll", "Failed retrieving items:", error);
      throw error;
    }
  }

  public async delete(item: Item): Promise<void> {
    try {
      await this.client.data.deleter()
        .withId(item.ID)
        .do().catch((error) => {
          if (this.isItemNotFoundError(error)) {
            this.log("delete", `Item with ID ${item.ID} not found`);

            return;
          }

          throw error;
        });
    } catch (error) {
      this.error("delete", `Failed deleting item (${item?.ID})`, error);
      throw error;
    }
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

      const imageBasedResults: WeaviateScoredItemSearchResult[] = [];
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
          item: WeaviateNearImageItemSearchResult,
        ) => ({
          ...item,
          _additional: {
            id: item._additional.id,
            score: 1 - item._additional.distance,
          },
        }));

        imageBasedResults.push(...rawItems);
      }

      const textBasedResults: WeaviateScoredItemSearchResult[] = [];
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
          (item: WeaviateScoredItemSearchResult) => ({
            ...item,
            _additional: {
              id: item._additional.id,
              score: +item._additional.score, /* Convert string to number */
            },
          } satisfies WeaviateScoredItemSearchResult),
        );

        textBasedResults.push(...rawItems);
      }

      const idToBestScoredItem = new Map<string, WeaviateScoredItemSearchResult>();
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
        ID: item._additional.id,
        name: item.name,
        description: item.description,
        imageID: item.imageID,
        score: item._additional.score,
      } satisfies Item & { score: number }));

      this.log("search", "items found:", items.length);

      return items;
    } catch (error) {
      this.error("search", error);
      throw error;
    }
  }

  private isClassNotFoundInSchemaError(error: any) {
    /* Example error message:
       Error: usage error (422): {"error":[{"message":"invalid object: class \"Item\" not found in schema"}]}
    */
    const targetMessage = `class \\"${this.className}\\" not found in schema`;

    return error?.message?.includes(targetMessage) ?? false;
  }

  private isItemNotFoundError(error: any) {
    /* Example error message:
       Error: usage error (404)
    */
    const targetMessage = "usage error (404)";

    return error?.message?.includes(targetMessage) ?? false;
  }

  private log(functionName: string, message: any, ...data: any[]) {
    console.log(
      `[WeaviateV2ItemsRepository::${functionName}]`,
      message,
      ...data,
    );
  }

  private error(functionName: string, message: any, ...data: any[]) {
    console.error(
      `[WeaviateV2ItemsRepository::${functionName}]`,
      message,
      ...data,
    );
  }
}
