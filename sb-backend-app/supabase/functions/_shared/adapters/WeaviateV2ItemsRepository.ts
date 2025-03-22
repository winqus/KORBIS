import { ItemsRepository } from "../app/interfaces/ItemsRepository.ts";
import { Item } from "../core/types.ts";

export class WeaviateV2ItemsRepository implements ItemsRepository {
  public create(item: Item): Promise<Item> {
    throw new Error("Method not implemented.");
  }
  
  public findByID(ID: string): Promise<Item> {
    throw new Error("Method not implemented.");
  }
  
  public findAll(): Promise<Item[]> {
    throw new Error("Method not implemented.");
  }
  
  public delete(item: Item): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
