import React from "react";
import { Text, View } from "react-native";

interface AssetOtherProps {
  id: string;
}

export const AssetOther = ({ id }: AssetOtherProps) => {
  return (
    <View className="flex flex-col items-start gap-3">
      <Text className="text-black-300 text-xl font-rubik-bold">Other</Text>
      <View className="flex flex-row items-center justify-start gap-2">
        <Text
          className="text-black-200 text-sm font-rubik-medium"
          selectable={true}
        >
          ID: {id}
        </Text>
      </View>
    </View>
  );
};
