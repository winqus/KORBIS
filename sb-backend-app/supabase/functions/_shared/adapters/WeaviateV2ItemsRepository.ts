import { ItemsRepository } from "../app/interfaces/ItemsRepository.ts";
import { Item } from "../core/types.ts";
import { WeaviateClient } from "npm:weaviate-ts-client@2.2.0";
import { throwIfMissing } from "../utils.ts";

export class WeaviateV2ItemsRepository implements ItemsRepository {
  private readonly className: string;

  constructor(private readonly client: WeaviateClient, className = "Item") {
    this.className = className;
  }

  public async create(item: Item): Promise<Item> {
    throw new Error("Method not implemented.");
  }

  public async findByID(ID: string): Promise<Item> {
    if (ID == null) {
      throw new Error("ID cannot be null");
    }

    const result = await this.client.data
      .getterById()
      .withClassName(this.className)
      .withId(ID)
      .do();

    if (!result || !result.properties) {
      throw new Error(`Item with ID ${ID} not found`);
    }

    throwIfMissing("item properties", result.properties, [
      "name",
      "description",
    ]);

    const item: Item = {
      ID,
      name: result.properties.name as string,
      description: result.properties.description as string,
    };

    return item;
  }

  public async findAll(): Promise<Item[]> {
    throw new Error("Method not implemented.");
    // const result = await this.client.graphql.get()
    //   .withClassName(this.className)
    //   .withFields("name description _additional{id}")
    //   .withLimit(100) // Adjust the limit based on your dataset
    //   .do();

    // const items = result.data.Get.Item as Array<{ name: string; description: string; _additional: { id: string } }>;

    // return items.map(obj => ({
    //   ID: obj._additional.id,
    //   name: obj.name,
    //   description: obj.description,
    // }));
  }

  public async delete(item: Item): Promise<void> {
    throw new Error("Method not implemented.");
    // await this.client.data.deleter()
    //   .withId(item.ID)
    //   .do();
  }
}
