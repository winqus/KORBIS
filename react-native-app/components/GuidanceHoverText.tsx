import { Text, View } from "react-native";
import React from "react";

export const GuidanceHoverText = ({ text }: { text: string }) => {
  return (
    <View className="absolute top-12 left-0 right-0 items-center">
      <View className="bg-black/50 px-6 py-2 rounded-full">
        <Text className="text-white text-center font-rubik-medium">{text}</Text>
      </View>
    </View>
  );
};