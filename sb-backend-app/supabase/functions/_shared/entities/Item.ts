import { IVirtualAsset } from "./index.ts";
import { File } from "./File.ts";

export class Item implements IVirtualAsset {
  id!: string;

  ownerId!: string;

  name!: string;

  type!: "item";

  description!: string;

  quantity!: number;

  parentId?: string;

  parentType?: string;

  parentName?: string;

  imageId?: string;
  
  files?: File[];
}
