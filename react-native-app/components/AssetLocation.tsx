import React from "react";
import { Text, View } from "react-native";
import { Image } from "expo-image";
import icons from "../constants/icons";

interface AssetLocationProps {
  location?: string;
}

export const AssetLocation = ({
  location = "Lithuania, Vilnius",
}: AssetLocationProps) => {
  return (
    <View className="flex flex-col items-start gap-3">
      <Text className="text-black-300 text-xl font-rubik-bold">Location</Text>
      <View className="flex flex-row items-center justify-start gap-2">
        <Image source={icons.location} className="w-7 h-7" />
        <Text
          className="text-black-200 text-sm font-rubik-medium"
          selectable={true}
        >
          {location}
        </Text>
      </View>
    </View>
  );
};
