import { ItemEntity } from "../entities/index.ts";
import { Optional, Scored } from "../core/types.ts";

export type SearchItemsProps = {
  queryText?: string;
  queryImageBase64?: string;
};

export interface ItemsRepository {
  create(item: Optional<ItemEntity, "id">): Promise<ItemEntity>;

  createWithImage(
    item: Optional<ItemEntity, "id">,
    imageBase64?: string,
  ): Promise<ItemEntity>;

  findById(id: string): Promise<ItemEntity | null>;

  findAll(): Promise<ItemEntity[]>;

  paginate(options: { limit?: number; skip?: number }): Promise<ItemEntity[]>;

  delete(id: string): Promise<void>;

  search(query: SearchItemsProps): Promise<Scored<ItemEntity>[]>;
}
