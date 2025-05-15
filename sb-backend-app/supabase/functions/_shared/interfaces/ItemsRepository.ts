import { Item } from "../entities/index.ts";
import { Optional, Scored } from "../core/types.ts";
import { File } from "../entities/File.ts";

export type SearchItemsProps = {
  queryText?: string;
  queryImageBase64?: string;
  ownerId: string;
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

  update(id: string, data: Partial<Item>): Promise<Item | null>;

  search(query: SearchItemsProps): Promise<Scored<Item>[]>;
  
  addFile(
    itemId: string,
    fileData: {
      id: string;
      name: string;
      originalName: string;
      fileUrl: string;
      mimeType?: string;
      size?: number;
      createdAt: string;
    }
  ): Promise<File>;
  
  deleteFile(itemId: string, fileId: string): Promise<void>;

  getFiles(itemId: string): Promise<File[]>;
}
