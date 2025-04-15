import React from "react";
import { Image } from "expo-image";
import images from "../constants/images";

interface AssetViewImageProps {
  imageUrl?: string;
}

export const AssetViewImage = ({ imageUrl }: AssetViewImageProps) => {
  return (
    <>
      <Image
        source={{ uri: imageUrl }}
        className="size-full"
        contentFit="cover"
      />
      <Image
        source={images.whiteGradient}
        className="absolute top-0 w-full z-40"
      />
    </>
  );
};
