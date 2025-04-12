import { Text, TouchableOpacity, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";

export const CameraPermissionRequest = ({
  requestPermission,
  onCancel,
}: {
  requestPermission: () => any;
  onCancel?: () => any;
}) => {
  return (
    <View className="flex-1 justify-center items-center bg-gray-50 px-6">
      {/* Icon */}
      <View className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center mb-6">
        <Ionicons name="camera-outline" size={40} color="#0061ff" />
      </View>

      {/* Title */}
      <Text className="text-2xl font-bold text-gray-800 mb-2">
        Camera Access Required
      </Text>

      {/* Description */}
      <Text className="text-center text-gray-600 mb-8 max-w-xs">
        We need access to your camera to take photos. Your privacy is important
        to us.
      </Text>

      {/* Primary Button */}
      <TouchableOpacity
        onPress={requestPermission}
        className="w-full bg-primary-300 py-4 rounded-lg items-center mb-4"
      >
        <Text className="text-white font-semibold text-base">
          Grant Camera Access
        </Text>
      </TouchableOpacity>

      {/* Secondary Button */}
      {onCancel && (
        <TouchableOpacity className="py-2" onPress={onCancel}>
          <Text className="text-gray-500 text-sm">Not now</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
