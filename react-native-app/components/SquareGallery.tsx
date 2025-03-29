import {
  Image,
  ImageSourcePropType,
  TouchableOpacity,
  View,
} from "react-native";
import React from "react";

interface SquareGalleryProps {
  uri: string;
  topRightIcon?: ImageSourcePropType;
  topRightIconClassName?: string;
  topRightIconOnPress?: () => void;
}

const SquareGallery = ({
  uri,
  topRightIcon,
  topRightIconClassName,
  topRightIconOnPress,
}: SquareGalleryProps) => {
  return (
    <View className="flex flex-row justify-center items-center py-2.5">
      {topRightIcon && (
        <View className="absolute z-10 size-64">
          <TouchableOpacity
            onPress={topRightIconOnPress}
            className="absolute top-1 right-1 bg-primary-200 rounded-full size-10 items-center justify-center"
          >
            <Image
              source={topRightIcon}
              className={`size-5`}
              tintColor="white"
            />
          </TouchableOpacity>
        </View>
      )}
      {uri ? (
        <Image source={{ uri }} className="size-64 rounded-xl" />
      ) : (
        <View className="bg-gray-300 size-64 rounded-xl"></View>
      )}
    </View>
  );
};

export default SquareGallery;
