import { IVirtualAsset } from "./index.ts";

export class Item implements IVirtualAsset {
  id!: string;

  ownerId!: string;

  name!: string;

  type: "item" = "item";

  description!: string;

  quantity!: number;

  parentId?: string;

  parentType?: string;

  imageId?: string;
}
