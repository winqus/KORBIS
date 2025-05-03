import React from "react";
import { View } from "react-native";
import { TagPill } from "./TagPill";

interface AssetTagsProps {
  type: "item" | "container";
}

export const AssetTags = ({ type }: AssetTagsProps) => {
  return (
    <View
      testID="__asset-tags__"
      className="flex flex-row items-center gap-1.5"
    >
      <TagPill label={type === "item" ? "Item" : "Container"} />
    </View>
  );
};
