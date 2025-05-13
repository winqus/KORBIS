import React from "react";
import { Image, useImage } from "expo-image";
import images from "../constants/images";
import { View } from "react-native";

interface AssetViewImageProps {
  imageUrl?: string;
}

export const AssetViewImage = ({ imageUrl }: AssetViewImageProps) => {
  const blurhash = "UQLz~yt8M_Ip_N_3Rka|WB-;xaxa9aRjROIV";
  const image = useImage(imageUrl || "");
  const isSquarish = (width: number, height: number) => {
    const ratio = width / height;
    return ratio > 0.75 && ratio < 1.33;
  };
  const shouldCover = () =>
    !image ? false : isSquarish(image.width, image.height);

  return (
    <View testID="__asset-view-image__" className="flex-1">
      {/* Blurred background image */}
      <Image
        placeholder={{ blurhash }}
        className="absolute inset-0 w-full h-full"
        contentFit="cover"
        blurRadius={20}
      />

      {/* Main image */}
      <Image
        source={image}
        className="size-full"
        contentFit={shouldCover() ? "cover" : "contain"}
      />

      {/* Overlay gradient */}
      <Image
        source={images.whiteGradient}
        className="absolute top-0 w-full z-40"
      />
    </View>
  );
};
