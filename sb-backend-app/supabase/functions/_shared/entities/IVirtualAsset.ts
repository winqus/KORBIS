import { AssetType } from "../core/index.ts";

export interface IVirtualAsset {
  id: string;

  ownerId: string;

  name: string;

  type: AssetType;
}
