export interface IVirtualAsset {
  id: string;

  ownerId: string;

  name: string;

  type: "item" | "container";
}
