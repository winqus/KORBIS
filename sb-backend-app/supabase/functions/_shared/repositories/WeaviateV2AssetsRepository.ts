import { WeaviateClient, WhereFilter } from "npm:weaviate-ts-client@2.2.0";
import { Container, Item } from "../entities/index.ts";
import { inject, injectable } from "@needle-di/core";
import { WEAVIATE_CLIENT } from "../injection-tokens.ts";
import { itemSchema } from "../schema/index.ts";
import { containerSchema } from "../schema/index.ts";
import { AssetsRepository } from "../interfaces/index.ts";
import { DEFAULT_PAGINATION_LIMIT } from "../config.ts";
import { ClassConstructor, plainToInstance } from 'npm:class-transformer@0.5.1';
import { AssetTypeEnum } from "../core/index.ts";

@injectable()
export class WeaviateV2AssetsRepository implements AssetsRepository {
  private readonly ASSET_CLASSES = ["Item", "Container"] as const;
  private readonly ASSET_CLASS_FIELDS: Record<
    typeof this.ASSET_CLASSES[number],
    string[]
  > = {
    Item: itemSchema.properties.map((property) =>
      property.name
    ).filter((property) => (property !== "image" && property !== "files")),
    Container: containerSchema.properties.map((property) =>
      property.name
    ).filter((property) => property !== "image"),
  } as const;

  constructor(
    private readonly client: WeaviateClient = inject(WEAVIATE_CLIENT),
  ) {
  }

  public async getAssetsByParentId(options: {
    limit?: number;
    skip?: number;
    ownerId: string;
    parentId?: string;
    parentType?: AssetTypeEnum.DOMAIN_ROOT | AssetTypeEnum.CONTAINER;
  }): Promise<(Item | Container)[]> {
    const { limit = DEFAULT_PAGINATION_LIMIT, skip = 0, ownerId, parentId, parentType } = options;

    if (parentType && ![AssetTypeEnum.DOMAIN_ROOT, AssetTypeEnum.CONTAINER].includes(parentType)) {
      throw new Error(`Invalid parent type: ${parentType}`);
    }

    const sharedWhereFilter = {
      operator: "And" as const,
      operands: [
        {
          path: ["ownerId"],
          operator: "Equal" as const,
          valueString: ownerId,
        },
        {
          path: ["parentId"],
          operator: "Equal" as const,
          valueString: parentId,
        },
      ],
    } satisfies WhereFilter;

    try {
      const itemQuery = this.client.graphql.get()
        .withClassName("Item")
        .withFields(
          `${this.ASSET_CLASS_FIELDS.Item.join(" ")} _additional { id creationTimeUnix }`,
        )
        .withWhere(sharedWhereFilter)
        .withLimit(limit)
        .withOffset(skip)
        .withSort([{ path: ["_creationTimeUnix"], order: "desc" }])
        .do();

      const containerQuery = this.client.graphql.get()
        .withClassName("Container")
        .withFields(
          `${this.ASSET_CLASS_FIELDS.Container.join(" ")} _additional { id creationTimeUnix }`,
        )
        .withWhere(sharedWhereFilter)
        .withLimit(limit)
        .withOffset(skip)
        .withSort([{ path: ["_creationTimeUnix"], order: "desc" }])
        .do();

      const [itemsResponse, containersResponse] = await Promise.all([
        itemQuery,
        containerQuery,
      ]);

      const items = itemsResponse?.data?.Get?.Item || [];
      const containers = containersResponse?.data?.Get?.Container || [];

      const combined = [...items, ...containers];

      combined.sort((a, b) => {
        const aTime = a._creationTimeUnix ?? a._additional?.creationTimeUnix ??
          0;
        const bTime = b._creationTimeUnix ?? b._additional?.creationTimeUnix ??
          0;
        return bTime - aTime;
      });

      const paginated = combined.slice(0, limit);

      return paginated.map((asset) => {
        if (asset.type === "item") {
          return this.mapItemObject2Entity(asset);
        } else {
          return this.mapContainerObject2Entity(asset);
        }
      });
    } catch (error: any) {
      this.error(
        "getItemsAndContainersByParentId",
        "Failed to retrieve items and containers:",
        error?.message,
      );
      return [];
    }
  }

  protected log(functionName: string, message: any, ...data: any[]) {
    console.error(
      `[${WeaviateV2AssetsRepository.name}::${functionName}]`,
      message,
      ...data,
    );
  }

  protected error(functionName: string, message: any, ...data: any[]) {
    console.error(
      `[${WeaviateV2AssetsRepository.name}::${functionName}]`,
      message,
      ...data,
    );
  }

  protected mapItemObject2Entity(data: any): Item {
    return plainToInstance<Item, Item>(
      Item,
      this.flattenAndFilterProperties(data, Item),
    ) as any;
  }

  protected mapContainerObject2Entity(data: any): Container {
    return plainToInstance<Container, Container>(
      Container,
      this.flattenAndFilterProperties(data, Container),
    ) as any;
  }

  protected flattenAndFilterProperties(item: any, entity: ClassConstructor<any>, keys?: string[]): any {
    const flattenedItem = {
      ...item,
      ...item["properties"],
      ...item["_additional"],
    };

    const entityKeys = keys || Object.getOwnPropertyNames(new entity());

    Object.keys(flattenedItem).forEach((key) => {
      if (!entityKeys.includes(key)) {
        delete flattenedItem[key];
      }
    });

    return flattenedItem;
  }
}
