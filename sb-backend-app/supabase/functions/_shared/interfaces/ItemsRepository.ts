import { Item } from "../entities/index.ts";
import { Optional, Scored } from "../core/types.ts";

export type SearchItemsProps = {
  queryText?: string;
  queryImageBase64?: string;
};

export interface ItemsRepository {
  create(data: Optional<Item, "id" | "type">): Promise<Item>;

  createWithImage(
    data: Optional<Item, "id" | "type">,
    imageBase64: string,
  ): Promise<Item & Pick<Item, "imageId">>;

  findById(id: string): Promise<Item | null>;

  findAll(): Promise<Item[]>;

  paginate(
    options: {
      limit?: number;
      skip?: number;
      ownerId: string;
      parentId?: string;
    },
  ): Promise<Item[]>;

  delete(id: string): Promise<void>;

  search(query: SearchItemsProps): Promise<Scored<Item>[]>;
}
