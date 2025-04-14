export type AssetType = "item" | "container";

export interface GeneratedItemMetadata {
  item_name: string;
  shorthand: string;
  description: string;
}

export interface IVirtualAsset {
  id: string;

  ownerId: string;

  name: string;

  type: AssetType;
}

export type VirtualAsset<T extends IVirtualAsset> = T;

export interface Item {
  id: string;

  ownerId: string;

  name: string;

  type: "item";

  description: string;

  quantity: number;

  imageId?: string;

  imageUrl?: string;

  parentId?: string;

  parentName?: string;

  parentType?: "root" | "container";
}

export interface Container extends IVirtualAsset {
  type: "container";

  description: string;

  imageId?: string;

  imageUrl?: string;

  parentId?: string;

  parentName?: string;

  parentType?: "root" | "container";

  childCount: number;

  path: string;
}

export type ImageType = {
  uri: string;
  width: number;
  height: number;
};
