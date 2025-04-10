import { Image, ImageRef, ImageSource, useImage } from "expo-image";
import { View, Text, TouchableOpacity, Dimensions } from "react-native";
import React, { useEffect } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { CameraItemOption } from "@/components/ItemCameraControls";
import { SafeAreaView } from "react-native-safe-area-context";

interface PicturePreviewProps {
  mode: CameraItemOption;
  image: ImageSource;
  onCancel: () => void;
  onAutoCreate: () => void;
  onManualAdd: () => void;
}

export const PicturePreview = (props: PicturePreviewProps) => {
  const { mode, image, onCancel, onAutoCreate, onManualAdd } = props;

  const screenWidth = Dimensions.get("window").width;

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Close button */}
      <TouchableOpacity
        onPress={onCancel}
        className="absolute top-12 left-4 z-10 p-2"
      >
        <Ionicons name="close" size={28} color="white" />
      </TouchableOpacity>

      {/* Image container - centered vertically */}
      <View className="flex-1 justify-center items-center">
        <Image
          source={image}
          style={{
            width: screenWidth,
          }}
          contentFit="contain"
        />
      </View>

      {/* Bottom action buttons */}
      {mode === "add" && (
        <View className="absolute bottom-10 left-0 right-0 px-6">
          {/* Primary button */}
          <TouchableOpacity
            onPress={onAutoCreate}
            className="bg-blue-500 py-4 rounded-lg items-center mb-4"
          >
            <Text className="text-white font-semibold text-base">
              Auto create item
            </Text>
          </TouchableOpacity>

          {/* Text button */}
          <TouchableOpacity onPress={onManualAdd} className="py-3 items-center">
            <Text className="text-white text-sm">or manually add items</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};
