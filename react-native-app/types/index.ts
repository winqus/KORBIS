export interface GeneratedItemMetadata {
  item_name: string;
  shorthand: string;
  description: string;
}

export interface IVirtualAsset {
  id: string;

  ownerId: string;

  name: string;

  type: "item" | "container";
}

export interface Item {
  ID: string;
  ownerId: string;
  name: string;
  description: string;
  type: "item";
  imageID?: string;
  imageURI?: string;
  parentType?: string;
  parentId?: string;
}

export interface Container extends IVirtualAsset {
  type: "container";

  description: string;

  parentId?: string;

  parentType?: string;

  childCount: number;

  path: string;

  imageId?: string;
}
