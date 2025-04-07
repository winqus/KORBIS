import { signal } from "@preact/signals-react";
import { IVirtualAsset } from "@/types";

export const mostRecentlyTakenPictureUri = signal("");
export const currentParentAsset = signal({
  type: undefined,
  name: "My Home",
  id: undefined,
} satisfies Partial<IVirtualAsset>);
