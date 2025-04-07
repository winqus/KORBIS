import { Text, TouchableOpacity } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import React from "react";

type ParentAssetInfoProps = {
  parentName: string;
  onPress?: () => void;
};

export const ParentAssetInfo = ({
  parentName,
  onPress,
}: ParentAssetInfoProps) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex flex-row items-center gap-2.5"
    >
      <FontAwesome name="folder" size={20} color="#666876" />
      <Text className="text-base font-rubik-medium text-black-200">
        {parentName}
      </Text>
    </TouchableOpacity>
  );
};
