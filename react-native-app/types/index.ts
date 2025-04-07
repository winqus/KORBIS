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
  type: "item";
  description: string;
  quantity: number;
  imageID?: string;
  imageURI?: string;
  parentId?: string;
  parentName?: string;
  parentType?: "container";
}

export interface Container extends IVirtualAsset {
  type: "container";

  description: string;

  parentId?: string;

  parentType?: "container";

  childCount: number;

  path: string;

  imageId?: string;
}
