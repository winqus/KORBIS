import { View, Text, TouchableOpacity, Image } from "react-native";
import React from "react";
import { Item } from "@/types";
import images from "@/constants/images";

interface ItemCardProps {
  item: Item;
  onPress?: () => void;
}

export const ItemCard = ({ item, onPress }: ItemCardProps) => {
  const { name, imageURI } = item;

  const nameLengthLimit = 25;
  const trimmedName =
    name.length < nameLengthLimit
      ? name
      : name.slice(0, nameLengthLimit) + "...";

  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-1 w-full h-44 mt-4 rounded-xl bg-accent shadow-lg shadow-black-100/70 relative"
    >
      <Image
        source={images.cardGradient}
        className="size-full rounded-xl absolute bottom-0 z-10"
      />
      <View className="size-full flex flex-col justify-end items-start absolute p-1 z-20">
        <View className="flex-grow-0">
          <Text className="text-xl font-rubik-bold text-white ml-1">
            {trimmedName}
          </Text>
        </View>
      </View>
      <Image source={{ uri: imageURI }} className="size-full rounded-xl" />
    </TouchableOpacity>
  );
};
