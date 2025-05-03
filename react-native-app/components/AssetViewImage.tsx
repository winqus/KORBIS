import React from "react";
import { Image } from "expo-image";
import images from "../constants/images";
import { View } from "react-native";

interface AssetViewImageProps {
  imageUrl?: string;
}

export const AssetViewImage = ({ imageUrl }: AssetViewImageProps) => {
  const blurhash = "UQLz~yt8M_Ip_N_3Rka|WB-;xaxa9aRjROIV";

  return (
    <View className="flex-1">
      {/* Blurred background image */}
      <Image
        placeholder={{ blurhash }}
        className="absolute inset-0 w-full h-full"
        contentFit="cover"
        blurRadius={20}
      />

      {/* Main image */}
      <Image
        source={{ uri: imageUrl }}
        className="size-full"
        contentFit="contain"
      />

      {/* Overlay gradient */}
      <Image
        source={images.whiteGradient}
        className="absolute top-0 w-full z-40"
      />
    </View>
  );
};
