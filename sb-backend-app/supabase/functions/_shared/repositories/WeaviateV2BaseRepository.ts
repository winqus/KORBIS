import { WeaviateClient } from "npm:weaviate-ts-client@2.2.0";
import { ClassConstructor, plainToInstance } from "npm:class-transformer@0.5.1";
import { Optional } from "../core/types.ts";

export class WeaviateV2BaseRepository<T> {
  constructor(
    protected readonly client: WeaviateClient,
    protected readonly className: string,
    protected readonly classSchema: object,
    protected readonly entity: ClassConstructor<T>,
  ) {
  }

  public async create(data: Optional<T & { id: string }, "id">): Promise<T> {
    const objectCreator = this.client.data.creator()
      .withClassName(this.className)
      .withProperties(data as Record<string, any>);

    const newObject = await objectCreator.do()
      .catch(async (error) => {
        if (this.isClassNotFoundInSchemaError(error)) {
          await this.initializeClass();

          return objectCreator.do();
        }

        this.error("create", "Failed creating item:", error.message);
        throw error;
      });

    return this.mapObject2Entity(newObject);
  }

  public async findById(id: string): Promise<T | null> {
    if (!id) {
      return null;
    }

    const object = await this.client.data.getterById()
      .withClassName(this.className)
      .withId(id)
      .do().catch((error) => {
        if (!this.isItemNotFoundError(error)) {
          this.error(
            "findById",
            `Failed retrieving item (${id}):`,
            error.message,
          );
          throw error;
        }

        return null;
      });

    if (!object || !object.properties) {
      return null;
    }

    const entity = this.mapObject2Entity(object);

    return entity;
  }

  public async update(id: string, data: Partial<T>): Promise<T | null> {
    if (!id) {
      return null;
    }

    /* Does not return the updated object */
    await this.client.data
      .merger()
      .withClassName(this.className)
      .withId(id)
      .withProperties(data)
      .do().catch((error) => {
        if (this.isItemNotFoundError(error)) {
          this.log("update", `Item with ID ${id} not found`);

          return null;
        }

        this.error("update", `Failed updating item (${id}):`, error.message);
        return null;
      });

    const updatedObject = await this.findById(id);
    if (!updatedObject) {
      this.error("update", `Failed retrieving updated item (${id})`);
    }

    return updatedObject;
  }

  public async delete(id: string): Promise<void> {
    await this.client.data.deleter()
      .withClassName(this.className)
      .withId(id)
      .do().catch((error) => {
        if (this.isItemNotFoundError(error)) {
          this.log("delete", `Item with ID ${id} not found`);

          return;
        }

        this.error("delete", `Failed deleting item (${id}):`, error.message);
      });
  }

  protected async findMany(
    options: { limit?: number; offset?: number; fields?: string },
  ): Promise<T[]> {
    try {
      const { limit, offset, fields } = options;

      const objects = await this.client.graphql.get()
        .withClassName(this.className)
        .withFields(fields || "_additional{id}")
        .withLimit(limit || 100)
        .withOffset(offset || 0)
        .do();

      if (!objects || !objects.data) {
        return [];
      }

      return this.mapObjects2Entities(
        objects.data.Get[this.className] || [],
      );
    } catch (error: any) {
      this.error("findAll", "Failed retrieving items:", error?.message);
      return [];
    }
  }

  protected async initializeClass(): Promise<void> {
    const _newClass = await this.client
      .schema
      .classCreator()
      .withClass(this.classSchema)
      .do();
  }

  protected mapObject2Entity(data: any): T {
    return plainToInstance<T, T>(
      this.entity,
      this.flattenAndFilterProperties(data),
    ) as any;
  }

  protected mapObjects2Entities(data: any[]): T[] {
    return plainToInstance<T, T[]>(
      this.entity,
      data.map((item) => this.flattenAndFilterProperties(item)),
    ) as T[];
  }

  protected flattenAndFilterProperties(item: any, keys?: string[]): any {
    const flattenedItem = {
      ...item,
      ...item["properties"],
      ...item["_additional"],
    };

    const entityKeys = keys || Object.getOwnPropertyNames(new this.entity());

    Object.keys(flattenedItem).forEach((key) => {
      if (!entityKeys.includes(key)) {
        delete flattenedItem[key];
      }
    });

    return flattenedItem;
  }

  protected isClassNotFoundInSchemaError(error: any) {
    /* Example error message:
       Error: usage error (422): {"error":[{"message":"invalid object: class \"Item\" not found in schema"}]}
    */
    const targetMessage = `class \\"${this.className}\\" not found in schema`;

    return error?.message?.includes(targetMessage) ?? false;
  }

  protected isItemNotFoundError(error: any) {
    /* Example error message:
       Error: usage error (404)
    */
    const targetMessage = "usage error (404)";

    return error?.message?.includes(targetMessage) ?? false;
  }

  protected log(functionName: string, message: any, ...data: any[]) {
    console.error(
      `[WeaviateV2(${this.className})Repository::${functionName}]`,
      message,
      ...data,
    );
  }

  protected error(functionName: string, message: any, ...data: any[]) {
    console.error(
      `[WeaviateV2(${this.className})Repository::${functionName}]`,
      message,
      ...data,
    );
  }
}
