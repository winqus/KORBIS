import { Item } from "../../core/types.ts";

export type CreateItemProps = Pick<Item, "name" | "description"> & {imageBase64?: string};

export interface ItemsRepository {
  create(item: CreateItemProps): Promise<Item>;
  findByID(ID: string): Promise<Item | null>;
  findAll(): Promise<Item[]>;
  delete(item: Item): Promise<void>;
}