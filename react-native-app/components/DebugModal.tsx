import React, { PropsWithChildren } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

export const DebugModal = ({
  isVisible,
  children,
  onClose,
  title,
}: PropsWithChildren<{
  isVisible: boolean;
  onClose: () => void;
  title?: string;
}>) => {
  return (
    <View>
      <Modal animationType="slide" transparent={true} visible={isVisible}>
        <View className="absolute bottom-0 h-1/4 w-full bg-[#25292e] rounded-t-xl">
          <View className="h-[16%] bg-[#464C55] rounded-t-lg px-5 flex-row items-center justify-between">
            <Text className="text-white text-base">{title || "Items"}</Text>
            <Pressable onPress={onClose}>
              <MaterialIcons name="close" color="#fff" size={22} />
            </Pressable>
          </View>
          {children}
        </View>
      </Modal>
    </View>
  );
};
