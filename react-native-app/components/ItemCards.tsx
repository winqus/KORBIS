import { View, Text, TouchableOpacity, Image } from "react-native";
import React from "react";
import { Item } from "@/types";

interface ItemCardProps {
  item: Item;
  onPress?: () => void;
}

export const ItemCard = ({ item, onPress }: ItemCardProps) => {
  const { name, imageURI } = item;

  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-1 w-full mt-4 px-3 py-4 rounded-lg bg-white shadow-lg shadow-black-100/70 relative"
    >
      <View className="flex flex-row items-center absolute bottom px-2 top-5 right-5 bg-white/90 p-1 rounded-full z-50">
        <Text className="text-xs font-rubik-bold text-primary-300 ml-0.5">
          4.4
        </Text>
      </View>
      <Image source={{ uri: imageURI }} className="w-full h-40 rounded-lg" />

      <View className="flex flex-col mt-2">
        <Text className="text-base font-rubik-bold text-black-300">{name}</Text>
      </View>
    </TouchableOpacity>
  );
};
