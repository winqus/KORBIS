export interface GeneratedItemMetadata {
  item_name: string;
  shorthand: string;
  description: string;
}

export interface Item {
  ID: string;
  name: string;
  description: string;
  imageID?: string;
  imageURI?: string;
}
