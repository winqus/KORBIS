import {
  Image,
  ImageSourcePropType,
  TouchableOpacity,
  View,
} from "react-native";
import React from "react";
import icons from "@/constants/icons";
import Ionicons from "@expo/vector-icons/Ionicons";

interface SquareGalleryProps {
  uri: string;
  showDismissIcon?: boolean;
  onDismiss?: () => void;
  showPickerIcon?: boolean;
  onPickerPress?: () => void;
}

const SquareGallery = ({
  uri,
  showDismissIcon = false,
  onDismiss,
  showPickerIcon = false,
  onPickerPress,
}: SquareGalleryProps) => {
  return (
    <View className="flex flex-row justify-center items-center py-2.5">
      <View className="absolute z-10 size-64">
        {showDismissIcon && (
          <TouchableOpacity
            onPress={onDismiss}
            className="absolute top-1 right-1 bg-primary-200 rounded-full size-10 items-center justify-center"
          >
            <Image
              source={icons.clear}
              className={`size-5`}
              tintColor="white"
            />
          </TouchableOpacity>
        )}
        {showPickerIcon && (
          <TouchableOpacity
            onPress={onPickerPress}
            className="absolute rounded-full size-full items-center justify-center"
          >
            <Ionicons name="add-circle-outline" size={128} color="#fff8" />
          </TouchableOpacity>
        )}
      </View>
      {uri ? (
        <Image source={{ uri }} className="size-64 rounded-xl" />
      ) : (
        <View className="bg-gray-300 size-64 rounded-xl"></View>
      )}
    </View>
  );
};

export default SquareGallery;
