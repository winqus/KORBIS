import { Text, TouchableOpacity } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import React, { ReactNode } from "react";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import Ionicons from "@expo/vector-icons/Ionicons";

type ParentAssetInfoProps = {
  parentName: string;
  parentType?: "root" | "container" | "location";
  onPress?: () => void;
};

export const ParentAssetInfo = ({
  parentName,
  parentType = "root",
  onPress,
}: ParentAssetInfoProps) => {
  const iconMap: Record<typeof parentType, ReactNode> = {
    root: <FontAwesome6 name="house" size={16} color="#666876" />,
    container: <FontAwesome name="folder" size={20} color="#666876" />,
    location: <Ionicons name="location-sharp" size={20} color="#666876" />,
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex flex-row items-center gap-2.5"
      disabled={!onPress}
    >
      {iconMap[parentType]}
      <Text className="text-base font-rubik-medium text-black-200 bg-">
        {parentName}
      </Text>
    </TouchableOpacity>
  );
};
