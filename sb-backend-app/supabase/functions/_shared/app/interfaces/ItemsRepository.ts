import { Item } from "../../core/types.ts";

export interface ItemsRepository {
  create(item: Item): Promise<Item>;
  findByID(ID: string): Promise<Item>;
  findAll(): Promise<Item[]>;
  delete(item: Item): Promise<void>;
}