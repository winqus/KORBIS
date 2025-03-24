import { ItemsRepository } from "../app/interfaces/ItemsRepository.ts";
import { Item } from "../core/types.ts";
import { WeaviateClient } from "npm:weaviate-ts-client@2.2.0";
import itemSchema from "../schema/ItemSchema.ts";

export class WeaviateV2ItemsRepository implements ItemsRepository {
  private readonly className: string;

  constructor(private readonly client: WeaviateClient, className = "Item") {
    this.className = className;
  }

  public async create(item: Omit<Item, "ID">): Promise<Item> {
    try {
      if (!item) {
        throw new Error("Item cannot be null");
      }

      const itemCreator = this.client.data.creator()
        .withClassName(this.className)
        .withProperties({
          name: item.name,
          description: item.description,
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

      this.log("create", `Created new item: ${result.id}`);

      return {
        ID: result.id,
        name: item.name,
        description: item.description,
      };
    } catch (error) {
      this.error("create", error);
      throw error;
    }
  }

  private async createDefaultClass(): Promise<void> {
    try {
      const newClass = await this.client
        .schema
        .classCreator()
        .withClass(itemSchema)
        .do();

      this.log("createClass", `Created new class: ${newClass.class}`);
    } catch (error) {
      this.error("createClass", "Error creating class:", error);
    }
  }

  public async findByID(ID: string): Promise<Item> {
    throw new Error("Method not implemented.");
    // if (ID == null) {
    //   throw new Error("ID cannot be null");
    // }

    // const result = await this.client
    //   .data
    //   .getterById()
    //   .withClassName(this.className)
    //   .withId(ID)
    //   .do();

    // if (!result || !result.properties) {
    //   throw new Error(`Item with ID ${ID} not found`);
    // }

    // throwIfMissing("item properties", result.properties, [
    //   "name",
    //   "description",
    // ]);

    // const item: Item = {
    //   ID,
    //   name: result.properties.name as string,
    //   description: result.properties.description as string,
    // };

    // return item;
  }

  public async findAll(): Promise<Item[]> {
    try {
      const result = await this.client.graphql.get()
        .withClassName(this.className)
        .withFields("name description _additional{id}")
        .withLimit(100)
        .do();

      const items = result.data.Get.Item as Array<
        { name: string; description: string; _additional: { id: string } }
      >;

      this.log("findAll", `Returning ${items.length} items`);

      return items.map((obj) => ({
        ID: obj._additional.id,
        name: obj.name,
        description: obj.description,
      }));
    } catch (error) {
      this.error("findAll", "Failed retrieving items:", error);
      throw error;
    }
  }

  public async delete(item: Item): Promise<void> {
    throw new Error("Method not implemented.");
    // await this.client.data.deleter()
    //   .withId(item.ID)
    //   .do();
  }

  private isClassNotFoundInSchemaError(error: any) {
    /* Example error message:
       Error: usage error (422): {"error":[{"message":"invalid object: class \"Item\" not found in schema"}]}
    */
    const targetMessage = `class \\"${this.className}\\" not found in schema`;
    return error?.message?.includes(targetMessage);
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
