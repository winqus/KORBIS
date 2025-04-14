import { IVirtualAsset } from "./index.ts";

export class Container implements IVirtualAsset {
  id!: string;

  ownerId!: string;

  name!: string;

  type: "container" = "container";

  description!: string;

  parentId?: string;

  parentType?: string;

  parentName?: string;

  childCount!: number;

  path!: string;

  imageId?: string;
}
