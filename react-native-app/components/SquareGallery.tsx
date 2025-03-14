import { Image, View } from "react-native";
import React from "react";

interface SquareGalleryProps {
  uri: string;
}

const SquareGallery = ({ uri }: SquareGalleryProps) => {
  return (
    <View className="flex flex-row justify-center items-center py-2.5">
      {uri ? (
        <Image source={{ uri }} className="size-64 rounded-xl" />
      ) : (
        <View className="bg-gray-300 size-64 rounded-xl"></View>
      )}
    </View>
  );
};

export default SquareGallery;
