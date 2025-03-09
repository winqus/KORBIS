import { View, Text, Image } from "react-native";
import React from "react";
import { mostRecentlyTakenPictureUri } from "@/lib/signals";

const ItemCreation = () => {
  return (
    <View>
      <Text>ItemCreation</Text>
      <Text>Uri: {mostRecentlyTakenPictureUri}</Text>
      {mostRecentlyTakenPictureUri.value && (
        <Image
          className="w-full h-full"
          source={{ uri: mostRecentlyTakenPictureUri.value }}
        />
      )}
    </View>
  );
};
export default ItemCreation;
