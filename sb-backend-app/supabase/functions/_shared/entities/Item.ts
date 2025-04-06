import { IVirtualAsset } from "./index.ts";

export class Item implements IVirtualAsset {
  id!: string;

  ownerId!: string;

  name!: string;

  type: "item" = "item";

  description!: string;

  parentId?: string;

  parentType?: string;

  imageId?: string;
}
