import React from "react";
import { TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import icons from "../constants/icons";

interface AssetBackButtonProps {
  onPress: () => void;
}

export const AssetBackButton = ({ onPress }: AssetBackButtonProps) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex flex-row size-12 items-center justify-center"
    >
      <Image
        source={icons.back_caret_circle}
        className="size-full"
        tintColor={"white"}
      />
    </TouchableOpacity>
  );
};
