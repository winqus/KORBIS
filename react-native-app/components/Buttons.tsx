import { Text, TouchableOpacity, View } from "react-native";
import React from "react";
import Ionicons from "@expo/vector-icons/Ionicons";

type ActionButtonsProps = {
  mode: string;
  absolute?: boolean;
  onAutoCreate: () => void;
  onManualAdd: () => void;
};
export const ActionButtons = ({
  mode,
  absolute,
  onAutoCreate,
  onManualAdd,
}: ActionButtonsProps) => {
  if (mode !== "add") return null;

  return (
    <View
      className={`${
        absolute ? "absolute bottom-10 left-0 right-0 px-6" : "px-10 mb-10"
      }`}
    >
      <TouchableOpacity
        onPress={onAutoCreate}
        className="bg-primary-300 py-4 rounded-full items-center mb-4"
      >
        <Text className="text-white font-semibold text-base">
          Auto create item
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onManualAdd}
        className="py-3 items-center m-auto px-6"
      >
        <Text className="text-white text-sm">or manually add items</Text>
      </TouchableOpacity>
    </View>
  );
};

type CloseButtonProps = {
  absolute?: boolean;
  onCancel: () => void;
};

export const CloseButton = ({ absolute, onCancel }: CloseButtonProps) => {
  const className = `p-2 ${absolute ? "" : "absolute top-12 left-4 z-10 p-2 bg-primary-200 rounded-full items-center justify-center size-12"}`;

  const button = (
    <TouchableOpacity onPress={onCancel} className={className}>
      <Ionicons name="close" size={28} color="white" />
    </TouchableOpacity>
  );

  return absolute ? <View className="pt-2 pl-4 pb-2">{button}</View> : button;
};
