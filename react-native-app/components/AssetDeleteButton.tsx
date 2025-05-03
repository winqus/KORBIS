import React from "react";
import { TouchableOpacity, View } from "react-native";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";

interface AssetDeleteButtonProps {
  onDelete: () => void;
}

export const AssetDeleteButton = ({ onDelete }: AssetDeleteButtonProps) => {
  return (
    <View className="flex flex-col items-center justify-center py-8 gap-1 w-full">
      <TouchableOpacity
        testID="__asset-delete-button__"
        onPress={onDelete}
        className="flex flex-row items-center justify-center py-1.5 px-4 gap-1.5 w-32 h-9 border border-red-500 rounded-full"
      >
        <FontAwesome5 name="trash-alt" size={18} color="#FF0000" />
      </TouchableOpacity>
    </View>
  );
};
