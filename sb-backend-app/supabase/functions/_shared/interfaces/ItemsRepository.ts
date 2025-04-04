import { Item } from "../entities/index.ts";
import { Optional, Scored } from "../core/types.ts";

export type SearchItemsProps = {
  queryText?: string;
  queryImageBase64?: string;
};

export interface ItemsRepository {
  create(item: Optional<Item, "id">): Promise<Item>;

  createWithImage(
    item: Optional<Item, "id">,
    imageBase64: string,
  ): Promise<Item & Pick<Item, "imageId">>;

  findById(id: string): Promise<Item | null>;

  findAll(): Promise<Item[]>;

  paginate(options: { limit?: number; skip?: number }): Promise<Item[]>;

  delete(id: string): Promise<void>;

  search(query: SearchItemsProps): Promise<Scored<Item>[]>;
}
