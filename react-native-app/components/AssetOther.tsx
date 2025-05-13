import React from "react";
import { Text, View } from "react-native";

interface AssetOtherProps {
  id: string;
  visualCode?: string;
}

export const AssetOther = ({ id, visualCode }: AssetOtherProps) => {
  return (
    <View className="flex flex-col items-start gap-3">
      <Text className="text-black-300 text-xl font-rubik-bold">Other</Text>
      <View className="flex flex-col items-start justify-start gap-2">
        <Text
          testID="__id-asset-other__"
          className="text-black-200 text-sm font-rubik-medium"
          selectable={true}
        >
          ID:{" "}
          <Text
            testID="__id-value-asset-other__"
            className="text-primary-300 text-sm font-rubik-semibold"
          >
            {id}
          </Text>
        </Text>
        {visualCode && (
          <Text
            className="text-black-200 text-sm font-rubik-medium"
            selectable={true}
            testID="__codename-asset-other__"
          >
            Codename:{" "}
            <Text
              testID="__visualCode-asset-other__"
              className="text-primary-300 text-sm font-rubik-semibold"
            >
              {visualCode}
            </Text>
          </Text>
        )}
      </View>
    </View>
  );
};
