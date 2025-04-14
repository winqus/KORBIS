import { Container } from "../entities/Container.ts";
import { Item } from "../entities/Item.ts";

export interface AssetsRepository {
  getAssetsByParentId(
    options: {
      limit?: number;
      skip?: number;
      ownerId: string;
      parentId?: string;
      parentType?: string;
    }
  ): Promise<(Item | Container)[]>;
}
