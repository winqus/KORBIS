export interface GeneratedItemMetadata {
  item_name: string;
  shorthand: string;
  description: string;
}

export interface Item {
  ID: string;
  ownerId: string;
  name: string;
  description: string;
  imageID?: string;
  imageURI?: string;
  parentType?: string;
  parentId?: string;
}
